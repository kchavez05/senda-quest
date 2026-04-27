import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Item } from '../types';
import { RACES, TAG_COMBAT_START, TAG_COMBAT_END, TAG_ROLL_D20, TAG_ENEMIES_PREFIX, TAG_PLAYER_HP_PREFIX, TAG_PLAYER_MANA_PREFIX } from '../constants';

const fetchWithRetry = async (url: string, options: any, retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status === 429) return res;
      if (res.status < 500) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
  }
  return fetch(url, options);
};

export function useGameEngine() {
  const gameState = useGameStore(s => s.gameState);
  const setGameState = useGameStore(s => s.setGameState);
  const user = useGameStore(s => s.user);
  const [input, setInput] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{ value: number, type: string } | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [targetingAction, setTargetingAction] = useState<string | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<{ name: string, effect: string, cost: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const getBonusForAttr = (attr: string) => {
    if (!gameState.character) return null;
    const raceBonus = RACES[gameState.character.race].bonus;
    if (raceBonus.toLowerCase().includes(attr.toLowerCase())) {
      return raceBonus;
    }
    return null;
  };

  const addLog = async (sender: 'gm' | 'player' | 'system', text: string) => {
    if (!gameState.character?.uid) return;
    
    const logData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender,
      text,
      timestamp: Date.now(),
      uid: gameState.character.uid
    };

    try {
      if (!gameState.activeGameId) return;
      await addDoc(collection(db, 'users', gameState.character.uid, 'games', gameState.activeGameId, 'logs'), logData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${gameState.character.uid}/games/${gameState.activeGameId}/logs`);
    }
  };

  const getGMResponse = async (action: string, isRoll: boolean = false) => {
    setIsAILoading(true);
    
    try {
      const token = user ? await user.getIdToken() : '';
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetchWithRetry('/api/gm-response', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, isRoll, gameState }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.text) {
        let text = data.text;
        let updatedCharacter = { ...gameState.character };
        let hasChanges = false;
        
        // Escape brackets for prefix tags where necessary
        const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        
        const hpRegex = new RegExp(`${escapeRegex(TAG_PLAYER_HP_PREFIX)}(\\d+)\\]`);
        const hpMatch = text.match(hpRegex);
        if (hpMatch && updatedCharacter) {
          const newHp = parseInt(hpMatch[1]);
          updatedCharacter.hp = Math.min(updatedCharacter.maxHp, Math.max(0, newHp));
          text = text.replace(hpMatch[0], '');
          hasChanges = true;
        }

        const manaRegex = new RegExp(`${escapeRegex(TAG_PLAYER_MANA_PREFIX)}(\\d+)\\]`);
        const manaMatch = text.match(manaRegex);
        if (manaMatch && updatedCharacter) {
          const newMana = parseInt(manaMatch[1]);
          updatedCharacter.mana = Math.min(updatedCharacter.maxMana, Math.max(0, newMana));
          text = text.replace(manaMatch[0], '');
          hasChanges = true;
        }

        if (hasChanges && updatedCharacter && updatedCharacter.uid && gameState.activeGameId) {
          try {
            await updateDoc(doc(db, 'users', updatedCharacter.uid, 'games', gameState.activeGameId), {
              'character.hp': updatedCharacter.hp,
              'character.mana': updatedCharacter.mana,
              updatedAt: Date.now()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${updatedCharacter.uid}/games/${gameState.activeGameId}`);
          }
        }

        if (text.includes(TAG_COMBAT_START)) {
          setGameState(prev => ({ ...prev, isCombat: true, combatCount: prev.combatCount + 1 }));
          text = text.replace(TAG_COMBAT_START, '');
          
          if (updatedCharacter && updatedCharacter.uid && gameState.activeGameId) {
            updateDoc(doc(db, 'users', updatedCharacter.uid, 'games', gameState.activeGameId), {
              combatCount: gameState.combatCount + 1,
              updatedAt: Date.now()
            }).catch(e => console.error("Failed to update", e));
          }
        }
        if (text.includes(TAG_COMBAT_END)) {
          setGameState(prev => ({ ...prev, isCombat: false, enemies: [] }));
          text = text.replace(TAG_COMBAT_END, '');
        }

        const enemiesRegex = new RegExp(`${escapeRegex(TAG_ENEMIES_PREFIX)}(.*?)\\]`);
        const enemiesMatch = text.match(enemiesRegex);
        if (enemiesMatch) {
          const enemyNames = enemiesMatch[1].split(',').map(s => s.trim());
          setGameState(prev => ({
            ...prev,
            enemies: enemyNames.map(name => ({
              id: Math.random().toString(36).substr(2, 9),
              name
            }))
          }));
          text = text.replace(enemiesMatch[0], '');
        }
        
        let needsRoll = text.includes(TAG_ROLL_D20);
        if (needsRoll) {
          text = text.replace(TAG_ROLL_D20, '');
        } else if (/roll (for )?initiative/i.test(text) || /roll a d20/i.test(text)) {
          needsRoll = true;
        }
        
        addLog('gm', text.trim());
        
        if (needsRoll) {
          setTimeout(() => addLog('system', "The GM awaits your roll..."), 50);
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        addLog('system', "The tavern's magic is drained... (Quota Exceeded)");
      } else {
        addLog('system', "The shadows whisper incoherently... (AI Error)");
      }
    } finally {
      setIsAILoading(false);
    }
  };

  const rollDice = (sides: number, type: string, target?: string) => {
    if (isRolling || isAILoading) return;
    setShowMoreActions(false);
    setIsRolling(true);
    setRollResult(null);
    
    setTimeout(async () => {
      const result = Math.floor(Math.random() * sides) + 1;
      const bonus = getBonusForAttr(type);
      const finalResult = bonus ? result + 2 : result; 
      
      setRollResult({ value: finalResult, type: bonus ? `${type} (${bonus})` : type });
      setIsRolling(false);
      
      const logText = target ? `Rolled d${sides}: ${finalResult} (${type} vs ${target})` : `Rolled d${sides}: ${finalResult} (${type})`;
      addLog('system', logText);
      
      setTimeout(() => setRollResult(null), 3000);

      const attributes = ['Strength', 'Dexterity', 'Intelligence', 'Wisdom', 'Charisma', 'Constitution'];
      if (['Prompted', 'Attack', 'Defense', 'Check', 'Initiative', 'Spell', 'Item', ...attributes].some(t => type.includes(t))) {
        const actionText = target ? `${finalResult} (${type} targeting ${target})` : `${finalResult} (${type})`;
        await getGMResponse(actionText, true);
      }
    }, 1000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isAILoading) return;

    setShowMoreActions(false);
    const playerMsg = input;
    setInput('');
    addLog('player', playerMsg);
    await getGMResponse(playerMsg);
  };

  return {
    input, setInput,
    isRolling, rollResult,
    isAILoading, targetingAction,
    setTargetingAction, selectedSpell,
    setSelectedSpell, selectedItem,
    setSelectedItem, showMoreActions,
    setShowMoreActions, getBonusForAttr,
    rollDice, handleSend, addLog
  };
}

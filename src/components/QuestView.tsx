import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sword, Shield, Zap, Backpack, Dices, HelpCircle, ChevronDown } from 'lucide-react';
import { GameState, GameLog, Character, Item } from '../types';
import { SPELLS, RACES } from '../constants';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface QuestViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  key?: any;
}

export default function QuestView({ gameState, setGameState }: QuestViewProps) {
  const [input, setInput] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{ value: number, type: string } | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [targetingAction, setTargetingAction] = useState<string | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<{ name: string, effect: string, cost: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showMechanics, setShowMechanics] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastLogRef = useRef<HTMLDivElement>(null);
  
  // Helper to get roll options from GM text
  const getRollOptions = () => {
    const lastGMMsg = [...gameState.logs].reverse().find(l => l.sender === 'gm')?.text || '';
    const attributes = ['Strength', 'Dexterity', 'Intelligence', 'Wisdom', 'Charisma', 'Constitution'];
    const found = attributes.filter(attr => {
      const regex = new RegExp(`\\b${attr}\\b`, 'i');
      return regex.test(lastGMMsg);
    });
    
    const isChoice = found.length > 1 && (
      lastGMMsg.toLowerCase().includes(' or ') || 
      lastGMMsg.toLowerCase().includes('choose') ||
      lastGMMsg.toLowerCase().includes('either')
    );

    return { options: found, isChoice };
  };

  const getBonusForAttr = (attr: string) => {
    if (!gameState.character) return null;
    const raceBonus = RACES[gameState.character.race].bonus;
    if (raceBonus.toLowerCase().includes(attr.toLowerCase())) {
      return raceBonus;
    }
    return null;
  };

  const rollInfo = getRollOptions();
  const lastLog = gameState.logs[gameState.logs.length - 1];
  const isWaitingForRoll = lastLog?.sender === 'system' && lastLog?.text.includes("awaits your roll");
  const lastGMMsg = [...gameState.logs].reverse().find(l => l.sender === 'gm')?.text.toLowerCase() || '';
  const isInitiativePrompt = isWaitingForRoll && lastGMMsg.includes('initiative');

  const getRollLabel = () => {
    const gmMsg = [...gameState.logs].reverse().find(l => l.sender === 'gm')?.text.toLowerCase() || '';
    if (gmMsg.includes('initiative')) return 'Roll for Initiative';
    if (gmMsg.includes('attack')) return 'Roll Attack';
    if (gmMsg.includes('defense') || gmMsg.includes('defend')) return 'Roll Defense';
    
    if (rollInfo.options.length === 1) {
      return `Roll ${rollInfo.options[0]} Check`;
    }
    
    return 'Roll d20';
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (lastLogRef.current) {
      lastLogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [gameState.logs]);

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
      await addDoc(collection(db, 'users', gameState.character.uid, 'logs'), logData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${gameState.character.uid}/logs`);
    }
  };

  const getGMResponse = async (action: string, isRoll: boolean = false) => {
    setIsAILoading(true);
    
    try {
      const response = await fetch('/api/gm-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, isRoll, gameState }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.text) {
        let text = data.text;
        let updatedCharacter = { ...gameState.character };
        let hasChanges = false;
        
        // Handle player HP
        const hpMatch = text.match(/\[PLAYER_HP: (\d+)\]/);
        if (hpMatch && updatedCharacter) {
          const newHp = parseInt(hpMatch[1]);
          updatedCharacter.hp = Math.min(updatedCharacter.maxHp, Math.max(0, newHp));
          text = text.replace(hpMatch[0], '');
          hasChanges = true;
        }

        // Handle player Mana
        const manaMatch = text.match(/\[PLAYER_MANA: (\d+)\]/);
        if (manaMatch && updatedCharacter) {
          const newMana = parseInt(manaMatch[1]);
          updatedCharacter.mana = Math.min(updatedCharacter.maxMana, Math.max(0, newMana));
          text = text.replace(manaMatch[0], '');
          hasChanges = true;
        }

        // Update Firestore if character stats changed
        if (hasChanges && updatedCharacter && updatedCharacter.uid) {
          try {
            await updateDoc(doc(db, 'users', updatedCharacter.uid), {
              hp: updatedCharacter.hp,
              mana: updatedCharacter.mana,
              updatedAt: serverTimestamp()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${updatedCharacter.uid}`);
          }
        }

        // Handle signals
        if (text.includes('[COMBAT_START]')) {
          setGameState(prev => ({ ...prev, isCombat: true, combatCount: prev.combatCount + 1 }));
          text = text.replace('[COMBAT_START]', '');
          
          // Persist combat count
          if (updatedCharacter && updatedCharacter.uid) {
            updateDoc(doc(db, 'users', updatedCharacter.uid), {
              combatCount: gameState.combatCount + 1
            }).catch(e => console.error("Failed to update combat count", e));
          }
        }
        if (text.includes('[COMBAT_END]')) {
          setGameState(prev => ({ ...prev, isCombat: false, enemies: [] }));
          text = text.replace('[COMBAT_END]', '');
        }

        // Handle enemies
        const enemiesMatch = text.match(/\[ENEMIES: (.*?)\]/);
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
        
        const needsRoll = text.includes('[ROLL_D20]');
        if (needsRoll) {
          text = text.replace('[ROLL_D20]', '');
        }
        
        addLog('gm', text.trim());
        
        if (needsRoll) {
          addLog('system', "The GM awaits your roll...");
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        addLog('system', "The tavern's magic is drained... Please wait a moment before trying again. (Quota Exceeded)");
      } else {
        addLog('system', "The shadows whisper incoherently... (AI Error)");
      }
    } finally {
      setIsAILoading(false);
    }
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

  const rollDice = (sides: number, type: string, target?: string) => {
    if (isRolling || isAILoading) return;
    setShowMoreActions(false);
    setIsRolling(true);
    setRollResult(null);
    
    setTimeout(async () => {
      const result = Math.floor(Math.random() * sides) + 1;
      const bonus = getBonusForAttr(type);
      const finalResult = bonus ? result + 2 : result; // Narrative +2 for advantage
      
      setRollResult({ value: finalResult, type: bonus ? `${type} (${bonus})` : type });
      setIsRolling(false);
      
      const logText = target ? `Rolled d${sides}: ${finalResult} (${type} vs ${target})` : `Rolled d${sides}: ${finalResult} (${type})`;
      addLog('system', logText);
      
      // Auto-clear result after 3s
      setTimeout(() => setRollResult(null), 3000);

      // If it was a prompted roll, automatically notify the GM to continue the narrative
      const attributes = ['Strength', 'Dexterity', 'Intelligence', 'Wisdom', 'Charisma', 'Constitution'];
      if (['Prompted', 'Attack', 'Defense', 'Check', 'Initiative', 'Spell', 'Item', ...attributes].some(t => type.includes(t))) {
        const actionText = target ? `${finalResult} (${type} targeting ${target})` : `${finalResult} (${type})`;
        await getGMResponse(actionText, true);
      }
    }, 1000);
  };

  const handleAttackClick = () => {
    setShowMoreActions(false);
    if (gameState.enemies.length > 0) {
      setTargetingAction('Attack');
    } else {
      rollDice(20, 'Attack');
    }
  };

  const handleTargetSelect = (targetName: string) => {
    const action = targetingAction;
    setTargetingAction(null);
    
    if (action === 'Attack') {
      rollDice(20, 'Attack', targetName);
    } else if (action === 'Spell' && selectedSpell) {
      const spell = selectedSpell;
      setSelectedSpell(null);
      
      // Deduct mana
      setGameState(prev => ({
        ...prev,
        character: prev.character ? {
          ...prev.character,
          mana: Math.max(0, prev.character.mana - spell.cost)
        } : null
      }));

      rollDice(20, `Spell: ${spell.name} (${spell.effect})`, targetName);
    } else if (action === 'ItemTarget' && selectedItem) {
      const item = selectedItem;
      setSelectedItem(null);
      rollDice(20, `Item: ${item.name} (${item.description})`, targetName);
    }
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    if (gameState.enemies.length > 0) {
      setTargetingAction('ItemTarget');
    } else {
      setTargetingAction(null);
      setSelectedItem(null);
      rollDice(20, `Item: ${item.name} (${item.description})`);
    }
  };

  const handleSpellSelect = (spell: { name: string, effect: string, cost: number }) => {
    setShowMoreActions(false);
    if ((gameState.character?.mana || 0) < spell.cost) {
      addLog('system', `Not enough Mana to cast ${spell.name}!`);
      setTargetingAction(null);
      return;
    }

    // Some spells might not need a target (e.g., self-buffs)
    const selfBuffs = ['Concentrate', 'Berzerk', 'Rage', 'Stealth'];
    
    if (selfBuffs.includes(spell.name)) {
      setTargetingAction(null);
      // Deduct mana
      setGameState(prev => ({
        ...prev,
        character: prev.character ? {
          ...prev.character,
          mana: Math.max(0, prev.character.mana - spell.cost)
        } : null
      }));
      rollDice(20, `Spell: ${spell.name} (${spell.effect})`);
    } else {
      setSelectedSpell(spell);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto relative overflow-hidden">
      {/* Status Bar - Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#0a0502]/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
        <div className="p-4 space-y-3">
          {/* Top Row: Identity & Help */}
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-white tracking-tight">{gameState.character?.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#ff4e00] font-bold">{gameState.character?.class}</span>
                <span className="text-[9px] text-white/20">•</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#8e9299]">{gameState.character?.race}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setShowMechanics(!showMechanics)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${showMechanics ? 'bg-[#ff4e00] border-[#ff4e00] text-white shadow-[0_0_15px_rgba(255,78,0,0.3)]' : 'bg-white/5 border-white/10 text-[#8e9299] hover:text-white hover:border-white/20'}`}
              title="Game Mechanics"
            >
              <HelpCircle size={14} />
            </button>
          </div>

          {/* Bottom Row: Resource Bars */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Health */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[8px] uppercase tracking-widest text-[#8e9299] font-bold">Vitality</span>
                <span className="text-[8px] font-mono text-red-500/80">{gameState.character?.hp}/{gameState.character?.maxHp}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(gameState.character?.hp || 0) / (gameState.character?.maxHp || 1) * 100}%` }}
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                />
              </div>
            </div>

            {/* Mana */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[8px] uppercase tracking-widest text-[#8e9299] font-bold">Mana</span>
                <span className="text-[8px] font-mono text-blue-500/80">{gameState.character?.mana}/{gameState.character?.maxMana}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(gameState.character?.mana || 0) / (gameState.character?.maxMana || 1) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mechanics Info Popover */}
        <AnimatePresence>
          {showMechanics && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-4 mt-2 w-64 bg-black/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl text-[10px] text-[#8e9299] font-mono leading-relaxed z-50 shadow-2xl"
            >
              <p className="text-[#ff4e00] font-bold mb-2 uppercase tracking-widest flex justify-between items-center">
                Game Mechanics
                <button onClick={() => setShowMechanics(false)} className="text-[8px] hover:text-white">CLOSE</button>
              </p>
              <div className="space-y-1.5">
                <p>• D20 rolls determine the outcome of your actions.</p>
                <p>• 1 is a Critical Failure. 20 is a Critical Success.</p>
                <p>• Higher rolls result in better narrative outcomes.</p>
                <p>• The GM sets difficulty based on the situation.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 space-y-6 mb-4 pr-2"
        >
          {gameState.logs.map((log, index) => {
            // Anchor to the last GM message if the very last message is a system instruction
            const lastIndex = gameState.logs.length - 1;
            const isSystemMeta = gameState.logs[lastIndex]?.sender === 'system' && 
                                gameState.logs[lastIndex - 1]?.sender === 'gm';
            const anchorIndex = isSystemMeta ? lastIndex - 1 : lastIndex;
            
            return (
              <motion.div
                key={log.id}
                ref={index === anchorIndex ? lastLogRef : null}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${log.sender === 'player' ? 'justify-end' : 'justify-start'}`}
              >
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                log.sender === 'gm' ? 'bg-transparent border-l-2 border-[#ff4e00]/30 italic text-lg leading-relaxed' :
                log.sender === 'player' ? 'bg-[#ff4e00]/10 border border-[#ff4e00]/20 text-white' :
                log.text.includes('COMBAT') ? 'bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-center tracking-[0.3em] w-full' :
                'bg-white/5 border border-white/10 text-xs text-[#8e9299] font-mono'
              }`}>
                {log.text}
              </div>
            </motion.div>
          );
        })}
          {isAILoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-6 right-8 w-10 h-10 bg-[#ff4e00] text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,78,0,0.4)] z-40 hover:bg-[#ff6a26] transition-colors"
            >
              <ChevronDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dice Overlay */}
      <AnimatePresence>
        {rollResult && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-black/80 backdrop-blur-2xl border-2 border-[#ff4e00] w-32 h-32 rounded-3xl flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,78,0,0.3)]">
              <span className="text-4xl font-bold text-white">{rollResult.value}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#ff4e00] mt-2">
                {rollResult.type.split(':')[0].split('(')[0].trim()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="p-4 space-y-4">
        {/* Roll Prompt - Always show if GM is waiting for a roll */}
        {gameState.logs[gameState.logs.length - 1].sender === 'system' && gameState.logs[gameState.logs.length - 1].text.includes("awaits your roll") && (
          <div className="space-y-2">
            {rollInfo.isChoice ? (
              <div className="grid grid-cols-2 gap-2">
                {rollInfo.options.map(attr => {
                  const bonus = getBonusForAttr(attr);
                  return (
                    <motion.button
                      key={attr}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => rollDice(20, attr)}
                      disabled={isAILoading || isRolling || gameState.isGameOver}
                      className="flex flex-col items-center justify-center gap-1 bg-[#ff4e00]/10 border border-[#ff4e00]/40 rounded-2xl py-3 text-white hover:bg-[#ff4e00]/20 transition-all group disabled:opacity-50"
                    >
                      <span className="text-xs uppercase tracking-widest font-bold">Roll {attr} Check</span>
                      {bonus && (
                        <span className="text-[8px] text-[#ff4e00] font-mono animate-pulse">ADVANTAGE: {bonus}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => rollDice(20, isInitiativePrompt ? 'Initiative' : 'Prompted')}
                disabled={isAILoading || isRolling || gameState.isGameOver}
                className="w-full flex items-center justify-center gap-3 bg-[#ff4e00]/20 border border-[#ff4e00] rounded-2xl py-4 text-white hover:bg-[#ff4e00]/30 transition-all group disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(255,78,0,0.1)]"
              >
                <Dices className="text-[#ff4e00] group-hover:rotate-12 transition-transform" />
                <span className="text-sm uppercase tracking-[0.2em] font-bold">
                  {getRollLabel()}
                </span>
              </motion.button>
            )}
          </div>
        )}

        {gameState.isCombat ? (
          <div className="space-y-3">
            {targetingAction === 'Attack' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-[#ff4e00]/30 rounded-2xl p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#ff4e00] font-bold">Select Target for Attack</span>
                  <button onClick={() => setTargetingAction(null)} className="text-[10px] uppercase tracking-widest text-[#8e9299] hover:text-white">Cancel</button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {gameState.enemies.map(enemy => (
                    <button
                      key={enemy.id}
                      onClick={() => handleTargetSelect(enemy.name)}
                      className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-[#ff4e00]/10 hover:border-[#ff4e00]/50 transition-all flex justify-between items-center group"
                    >
                      <span className="text-sm font-medium group-hover:text-[#ff4e00] transition-colors">{enemy.name}</span>
                      <Sword size={14} className="text-[#ff4e00] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : targetingAction === 'Spell' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-[#ff4e00]/30 rounded-2xl p-4"
              >
                {!selectedSpell ? (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#ff4e00] font-bold">Select Spell</span>
                      <button onClick={() => setTargetingAction(null)} className="text-[10px] uppercase tracking-widest text-[#8e9299] hover:text-white">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {gameState.character && SPELLS[gameState.character.class].map(spell => (
                        <button
                          key={spell.name}
                          onClick={() => handleSpellSelect(spell)}
                          className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-[#ff4e00]/10 hover:border-[#ff4e00]/50 transition-all flex flex-col group"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm font-bold group-hover:text-[#ff4e00] transition-colors">{spell.name}</span>
                            <span className="text-[10px] font-mono text-blue-400">{spell.cost} MP</span>
                          </div>
                          <span className="text-[10px] text-[#8e9299] mt-1">{spell.effect}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#ff4e00] font-bold">Select Target for {selectedSpell.name}</span>
                      <button onClick={() => { setSelectedSpell(null); setTargetingAction(null); }} className="text-[10px] uppercase tracking-widest text-[#8e9299] hover:text-white">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {gameState.enemies.map(enemy => (
                        <button
                          key={enemy.id}
                          onClick={() => handleTargetSelect(enemy.name)}
                          className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-[#ff4e00]/10 hover:border-[#ff4e00]/50 transition-all flex justify-between items-center group"
                        >
                          <span className="text-sm font-medium group-hover:text-[#ff4e00] transition-colors">{enemy.name}</span>
                          <Zap size={14} className="text-[#ff4e00] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                      {/* Self target for healing */}
                      {selectedSpell.name === 'Heal' && (
                        <button
                          onClick={() => handleTargetSelect('Self')}
                          className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-[#ff4e00]/10 hover:border-[#ff4e00]/50 transition-all flex justify-between items-center group"
                        >
                          <span className="text-sm font-medium group-hover:text-[#ff4e00] transition-colors">Self</span>
                          <Zap size={14} className="text-[#ff4e00] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ) : targetingAction === 'Item' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-[#ff4e00]/30 rounded-2xl p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#ff4e00] font-bold">Select Item from Inventory</span>
                  <button onClick={() => setTargetingAction(null)} className="text-[10px] uppercase tracking-widest text-[#8e9299] hover:text-white">Cancel</button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {gameState.character?.inventory && gameState.character.inventory.length > 0 ? (
                    gameState.character.inventory.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleItemSelect(item)}
                        className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-[#ff4e00]/10 hover:border-[#ff4e00]/50 transition-all flex flex-col group"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-sm font-bold group-hover:text-[#ff4e00] transition-colors">{item.name}</span>
                          <span className="text-[10px] font-mono text-[#8e9299] uppercase">{item.type}</span>
                        </div>
                        <span className="text-[10px] text-[#8e9299] mt-1">{item.description}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[#8e9299] text-xs font-mono">Your inventory is empty.</div>
                  )}
                </div>
              </motion.div>
            ) : targetingAction === 'ItemTarget' && selectedItem ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-[#ff4e00]/30 rounded-2xl p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#ff4e00] font-bold">Select Target for {selectedItem.name}</span>
                  <button onClick={() => { setSelectedItem(null); setTargetingAction(null); }} className="text-[10px] uppercase tracking-widest text-[#8e9299] hover:text-white">Cancel</button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {gameState.enemies.map(enemy => (
                    <button
                      key={enemy.id}
                      onClick={() => handleTargetSelect(enemy.name)}
                      className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-[#ff4e00]/10 hover:border-[#ff4e00]/50 transition-all flex justify-between items-center group"
                    >
                      <span className="text-sm font-medium group-hover:text-[#ff4e00] transition-colors">{enemy.name}</span>
                      <Backpack size={14} className="text-[#ff4e00] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  {/* Self target for potions/utility */}
                  {(selectedItem.type === 'potion' || selectedItem.type === 'utility') && (
                    <button
                      onClick={() => handleTargetSelect('Self')}
                      className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-[#ff4e00]/10 hover:border-[#ff4e00]/50 transition-all flex justify-between items-center group"
                    >
                      <span className="text-sm font-medium group-hover:text-[#ff4e00] transition-colors">Self</span>
                      <Backpack size={14} className="text-[#ff4e00] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <button 
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#8e9299] hover:text-white hover:border-[#ff4e00]/50 transition-all group"
                >
                  <span className="text-[10px] uppercase tracking-widest font-bold">More Actions</span>
                  <ChevronDown size={14} className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showMoreActions && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3"
                    >
                      {/* Custom Action Input */}
                      <form onSubmit={handleSend} className="relative pt-2">
                        <input 
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          disabled={isAILoading || isRolling || gameState.isGameOver}
                          placeholder="Describe your action..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#ff4e00] transition-colors font-serif pr-16 disabled:opacity-50"
                        />
                        <button 
                          type="submit"
                          disabled={isAILoading || isRolling || !input.trim() || gameState.isGameOver}
                          className="absolute right-2 top-2 bottom-2 px-4 bg-[#ff4e00] text-white rounded-xl hover:bg-[#ff6a26] transition-colors disabled:opacity-50 disabled:grayscale"
                        >
                          <Send size={18} />
                        </button>
                      </form>

                      <div className="grid grid-cols-2 gap-2">
                        <ActionButton icon={<Sword size={18} />} label="Attack" onClick={handleAttackClick} disabled={isAILoading || isRolling || isInitiativePrompt || gameState.isGameOver} />
                        <ActionButton icon={<Shield size={18} />} label="Defend" onClick={() => rollDice(20, 'Defense')} disabled={isAILoading || isRolling || isInitiativePrompt || gameState.isGameOver} />
                        <ActionButton icon={<Zap size={18} />} label="Spell" onClick={() => {
                          setShowMoreActions(false);
                          setTargetingAction('Spell');
                        }} disabled={isAILoading || isRolling || isInitiativePrompt || gameState.isGameOver} />
                        <ActionButton icon={<Backpack size={18} />} label="Item" onClick={() => {
                          setShowMoreActions(false);
                          setTargetingAction('Item');
                        }} disabled={isAILoading || isRolling || isInitiativePrompt || gameState.isGameOver} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSend} className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isAILoading || isRolling || gameState.isGameOver}
                placeholder={gameState.isGameOver ? "Your journey has ended." : isAILoading ? "The GM is thinking..." : "What will you do?"}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#ff4e00] transition-colors font-serif pr-16 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isAILoading || isRolling || !input.trim() || gameState.isGameOver}
                className="absolute right-2 top-2 bottom-2 px-4 bg-[#ff4e00] text-white rounded-xl hover:bg-[#ff6a26] transition-colors disabled:opacity-50 disabled:grayscale"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, disabled }: { icon: React.ReactNode, label: string, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 hover:border-[#ff4e00]/50 transition-all group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
    >
      <span className="text-[#ff4e00] group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs uppercase tracking-widest font-bold">{label}</span>
    </button>
  );
}

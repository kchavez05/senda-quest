import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sword, Shield, Zap, Backpack, Dices, ChevronDown } from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';
import { SPELLS } from '../../constants';

export default function ActionMenu({ engine }: { engine: any }) {
  const { gameState, setGameState } = useGameState();
  const {
    input, setInput, isRolling, isAILoading, targetingAction,
    setTargetingAction, selectedSpell, setSelectedSpell, selectedItem,
    setSelectedItem, showMoreActions, setShowMoreActions, getBonusForAttr,
    rollDice, handleSend, addLog
  } = engine;

  const getRollOptions = () => {
    const lastGMMsg = [...gameState.logs].reverse().find(l => l.sender === 'gm')?.text || '';
    const attributes = ['Strength', 'Dexterity', 'Intelligence', 'Wisdom', 'Charisma', 'Constitution'];
    const found = attributes.filter(attr => new RegExp(`\\b${attr}\\b`, 'i').test(lastGMMsg));
    const isChoice = found.length > 1 && (lastGMMsg.toLowerCase().includes(' or ') || lastGMMsg.toLowerCase().includes('choose') || lastGMMsg.toLowerCase().includes('either'));
    return { options: found, isChoice };
  };

  const rollInfo = getRollOptions();
  const lastLog = gameState.logs[gameState.logs.length - 1];
  const isWaitingForRoll = lastLog?.sender === 'system' && lastLog?.text.includes("awaits your roll");
  const lastGMMsg = [...gameState.logs].reverse().find(l => l.sender === 'gm')?.text.toLowerCase() || '';
  const isInitiativePrompt = isWaitingForRoll && lastGMMsg.includes('initiative');

  const getRollLabel = () => {
    if (lastGMMsg.includes('initiative')) return 'Roll for Initiative';
    if (lastGMMsg.includes('attack')) return 'Roll Attack';
    if (lastGMMsg.includes('defense') || lastGMMsg.includes('defend')) return 'Roll Defense';
    if (rollInfo.options.length === 1) return `Roll ${rollInfo.options[0]} Check`;
    return 'Roll d20';
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
      setGameState(prev => prev.character ? { ...prev, character: { ...prev.character, mana: Math.max(0, prev.character.mana - spell.cost) } } : prev);
      rollDice(20, `Spell: ${spell.name} (${spell.effect})`, targetName);
    } else if (action === 'ItemTarget' && selectedItem) {
      const item = selectedItem;
      setSelectedItem(null);
      rollDice(20, `Item: ${item.name} (${item.description})`, targetName);
    }
  };

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    if (gameState.enemies.length > 0) {
      setTargetingAction('ItemTarget');
    } else {
      setTargetingAction(null);
      setSelectedItem(null);
      rollDice(20, `Item: ${item.name} (${item.description})`);
    }
  };

  const handleSpellSelect = (spell: any) => {
    setShowMoreActions(false);
    if ((gameState.character?.mana || 0) < spell.cost) {
      addLog('system', `Not enough Mana to cast ${spell.name}!`);
      setTargetingAction(null);
      return;
    }
    const selfBuffs = ['Concentrate', 'Berzerk', 'Rage', 'Stealth'];
    if (selfBuffs.includes(spell.name)) {
      setTargetingAction(null);
      setGameState(prev => prev.character ? { ...prev, character: { ...prev.character, mana: Math.max(0, prev.character.mana - spell.cost) } } : prev);
      rollDice(20, `Spell: ${spell.name} (${spell.effect})`);
    } else {
      setSelectedSpell(spell);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {isWaitingForRoll && (
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

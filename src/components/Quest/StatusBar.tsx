import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export default function StatusBar() {
  const gameState = useGameStore(s => s.gameState);
  const [showMechanics, setShowMechanics] = useState(false);

  return (
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
  );
}

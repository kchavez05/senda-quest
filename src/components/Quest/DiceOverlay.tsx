import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function DiceOverlay({ rollResult }: { rollResult: { value: number, type: string } | null }) {
  return (
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
  );
}

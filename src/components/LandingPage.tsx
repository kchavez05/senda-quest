import React from 'react';
import { motion } from 'motion/react';
import { Sword } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  key?: any;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Sword size={64} className="text-[#ff4e00] animate-pulse" />
            <div className="absolute inset-0 bg-[#ff4e00] blur-2xl opacity-20" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter text-white">
          SENDA <br />
          <span className="text-[#ff4e00]">QUEST</span>
        </h1>
        
        <p className="text-lg text-[#8e9299] mb-12 leading-relaxed italic">
          "The dice are cast in the shadows of the hearth. Your destiny awaits among the smoke and steel."
        </p>
        
        <button
          onClick={onStart}
          className="group relative px-12 py-4 bg-transparent border border-[#ff4e00]/50 hover:border-[#ff4e00] text-white overflow-hidden transition-all duration-500"
        >
          <div className="absolute inset-0 bg-[#ff4e00]/10 group-hover:bg-[#ff4e00]/20 transition-colors" />
          <span className="relative text-sm uppercase tracking-[0.3em] font-bold">Begin Adventure</span>
        </button>
        
        <div className="mt-16 flex justify-center gap-8 opacity-30">
          <div className="w-12 h-[1px] bg-white/50 self-center" />
          <span className="text-[10px] uppercase tracking-widest">Est. in the Abyss</span>
          <div className="w-12 h-[1px] bg-white/50 self-center" />
        </div>
      </motion.div>
    </div>
  );
}

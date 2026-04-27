import React from 'react';
import { motion } from 'motion/react';
import { Sword, LogIn, User, Plus, Clock } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useGameStore } from '../store/useGameStore';

interface LandingPageProps {
  onStart: () => void;
  user: FirebaseUser | null;
  onLogin: () => void;
  key?: any;
}

export default function LandingPage({ onStart, user, onLogin }: LandingPageProps) {
  const savedGames = useGameStore(s => s.savedGames);
  const loadGame = useGameStore(s => s.loadGame);

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
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
        
        <div className="flex flex-col gap-4 items-center w-full">
          {!user ? (
            <button
              onClick={onLogin}
              className="group relative px-12 py-4 bg-transparent border border-[#ff4e00]/50 hover:border-[#ff4e00] text-white overflow-hidden transition-all duration-500 w-full"
            >
              <div className="absolute inset-0 bg-[#ff4e00]/10 group-hover:bg-[#ff4e00]/20 transition-colors" />
              <div className="relative flex items-center justify-center gap-3">
                <LogIn size={18} className="text-[#ff4e00]" />
                <span className="text-sm uppercase tracking-[0.3em] font-bold">Sign In to Play</span>
              </div>
            </button>
          ) : (
            <div className="w-full space-y-4">
              <button
                onClick={onStart}
                className="group relative px-12 py-4 bg-transparent border border-[#ff4e00]/50 hover:border-[#ff4e00] text-white overflow-hidden transition-all duration-500 w-full"
              >
                <div className="absolute inset-0 bg-[#ff4e00]/10 group-hover:bg-[#ff4e00]/20 transition-colors" />
                <div className="relative flex items-center justify-center gap-3">
                  <Plus size={18} className="text-[#ff4e00]" />
                  <span className="text-sm uppercase tracking-[0.3em] font-bold">New Adventure</span>
                </div>
              </button>

              {savedGames.length > 0 && (
                <div className="mt-8 text-left w-full">
                  <h3 className="text-xs uppercase tracking-widest text-[#8e9299] mb-4 font-bold flex items-center gap-2">
                    <Clock size={14} /> Resume Journey
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {savedGames.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => loadGame(game.id)}
                        className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff4e00]/50 hover:bg-[#ff4e00]/5 transition-all duration-300"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-lg">{game.character.name}</span>
                          <span className="text-xs text-[#8e9299] font-sans px-2 py-1 bg-black/50 rounded-md border border-white/5">
                            HP {game.character.hp}/{game.character.maxHp} {game.character.class}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
                          <Sword size={12} /> {game.theme}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-[#8e9299] uppercase tracking-widest mt-4">
              <User size={12} />
              <span>Logged in as {user.displayName || user.email}</span>
            </div>
          )}
        </div>
        
        <div className="mt-16 flex justify-center gap-8 opacity-30">
          <div className="w-12 h-[1px] bg-white/50 self-center" />
          <span className="text-[10px] uppercase tracking-widest">Est. in the Abyss</span>
          <div className="w-12 h-[1px] bg-white/50 self-center" />
        </div>
      </motion.div>
    </div>
  );
}

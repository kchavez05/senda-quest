import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useGameState } from '../../context/GameStateContext';

interface ChatLogProps {
  isAILoading: boolean;
}

export default function ChatLog({ isAILoading }: ChatLogProps) {
  const { gameState } = useGameState();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastLogRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 space-y-6 mb-4 pr-2 custom-scrollbar"
      >
        {gameState.logs.map((log, index) => {
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
  );
}

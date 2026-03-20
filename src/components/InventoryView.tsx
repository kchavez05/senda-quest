import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Backpack, Trash2, Info, X } from 'lucide-react';
import { Character, Item, GameState } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useGameState } from '../context/GameStateContext';

interface InventoryViewProps {
  character: Character | null;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  key?: any;
}

export default function InventoryView({ character, setGameState }: InventoryViewProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { gameState } = useGameState();

  if (!character) return null;

  const removeItem = async (id: string) => {
    if (!character.uid || !gameState.activeGameId) return;
    
    const newInventory = character.inventory.filter(item => item.id !== id);
    
    try {
      await updateDoc(doc(db, 'users', character.uid, 'games', gameState.activeGameId), {
        'character.inventory': newInventory,
        updatedAt: Date.now()
      });
      setSelectedItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${character.uid}/games/${gameState.activeGameId}`);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Backpack size={32} className="text-[#ff4e00]" />
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {character.inventory.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-3xl">
            <p className="text-[#8e9299] italic">Your pockets are empty...</p>
          </div>
        ) : (
          character.inventory.map((item) => (
            <motion.button
              key={item.id}
              layoutId={item.id}
              onClick={() => setSelectedItem(item)}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-left"
            >
              <div>
                <h4 className="font-bold text-white">{item.name}</h4>
                <p className="text-[10px] uppercase tracking-widest text-[#8e9299]">{item.type}</p>
              </div>
              <Info size={16} className="text-[#ff4e00]/50" />
            </motion.button>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              layoutId={selectedItem.id}
              className="w-full max-w-md bg-[#151619] border border-white/10 rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 text-[#8e9299] hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="mb-6">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#ff4e00]">{selectedItem.type}</span>
                <h3 className="text-3xl font-bold text-white mt-1">{selectedItem.name}</h3>
              </div>

              <p className="text-[#8e9299] leading-relaxed mb-8 italic">
                "{selectedItem.description}"
              </p>

              <div className="flex gap-3">
                <button 
                  className="flex-1 bg-[#ff4e00] text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#ff6a26] transition-colors"
                  onClick={() => {/* Use Item Logic */}}
                >
                  Use Item
                </button>
                <button 
                  onClick={() => removeItem(selectedItem.id)}
                  className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

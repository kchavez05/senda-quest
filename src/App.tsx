import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Shield, 
  Scroll, 
  Backpack, 
  User, 
  Settings, 
  Home, 
  HelpCircle, 
  LogOut, 
  MessageSquare 
} from 'lucide-react';
import { GameState, Character, GameLog } from './types';
import { CLASSES, RACES, BACKGROUNDS, SPELLS } from './constants';

// Components will be imported or defined below
import LandingPage from './components/LandingPage';
import CharacterCreation from './components/CharacterCreation';
import QuestView from './components/QuestView';
import InventoryView from './components/InventoryView';
import CharacterView from './components/CharacterView';
import ResourcesView from './components/ResourcesView';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    character: null,
    currentView: 'landing',
    logs: [
      { id: '1', sender: 'gm', text: 'The heavy oak door groans behind you, sealing out the biting mountain chill. You find yourself in a dimly lit common room, the air thick with the scent of roasted meat and wet wool. You barely remember the long trek through the Blackwood, your boots still caked in its dark mire, but the promise of warmth and a dry bed was too great to ignore. A hooded figure beckons you from a shadowed corner...', timestamp: Date.now() }
    ],
    isCombat: false,
    enemies: [],
    turn: 'player',
    combatCount: 0
  });

  const setView = (view: GameState['currentView']) => {
    setGameState(prev => ({ ...prev, currentView: view }));
  };

  const updateCharacter = (character: Character) => {
    setGameState(prev => ({ ...prev, character, currentView: 'quest', isGameOver: false }));
  };

  const resetGame = () => {
    setGameState({
      character: null,
      currentView: 'landing',
      logs: [
        { id: '1', sender: 'gm', text: 'The heavy oak door groans behind you, sealing out the biting mountain chill. You find yourself in a dimly lit common room, the air thick with the scent of roasted meat and wet wool. You barely remember the long trek through the Blackwood, your boots still caked in its dark mire, but the promise of warmth and a dry bed was too great to ignore. A hooded figure beckons you from a shadowed corner...', timestamp: Date.now() }
      ],
      isCombat: false,
      enemies: [],
      turn: 'player',
      isGameOver: false,
      combatCount: 0
    });
  };

  useEffect(() => {
    if (gameState.character && gameState.character.hp <= 0 && !gameState.isGameOver) {
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        logs: [...prev.logs, {
          id: `death-${Date.now()}`,
          sender: 'system',
          text: 'YOUR JOURNEY HAS ENDED. You have succumbed to your wounds.',
          timestamp: Date.now()
        }]
      }));
    }
  }, [gameState.character?.hp, gameState.isGameOver]);

  return (
    <div className="h-screen bg-[#0a0502] text-[#e0d8d0] font-serif selection:bg-[#ff4e00]/30 overflow-hidden flex flex-col">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#3a1510] blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#ff4e00] blur-[150px] opacity-10" />
      </div>

      <main className={`flex-1 relative z-10 overflow-y-auto ${gameState.character && gameState.currentView !== 'landing' && gameState.currentView !== 'creation' ? 'pb-24' : ''}`}>
        <div className="h-full w-full">
          <AnimatePresence mode="wait">
          {gameState.currentView === 'landing' && (
            <LandingPage key="landing" onStart={() => setView('creation')} />
          )}
          {gameState.currentView === 'creation' && (
            <CharacterCreation key="creation" onComplete={updateCharacter} />
          )}
          {gameState.currentView === 'quest' && (
            <QuestView key="quest" gameState={gameState} setGameState={setGameState} />
          )}
          {gameState.currentView === 'inventory' && (
            <InventoryView key="inventory" character={gameState.character} setGameState={setGameState} />
          )}
          {gameState.currentView === 'character' && (
            <CharacterView key="character" character={gameState.character} />
          )}
          {gameState.currentView === 'resources' && (
            <ResourcesView key="resources" setView={setView} />
          )}
        </AnimatePresence>
      </div>
    </main>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameState.isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-sm w-full bg-[#1a0a05] border border-red-900/50 p-8 rounded-3xl text-center space-y-6 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
            >
              <div className="w-20 h-20 bg-red-950/50 border border-red-500/30 rounded-full flex items-center justify-center mx-auto">
                <Shield size={40} className="text-red-500 opacity-50" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tighter uppercase">Death Claims You</h2>
                <p className="text-[#8e9299] text-sm leading-relaxed">Your story ends here, amidst the shadows and the cold. But every end is a new beginning.</p>
              </div>
              <button 
                onClick={resetGame}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                Begin Anew
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {gameState.character && gameState.currentView !== 'landing' && gameState.currentView !== 'creation' && !gameState.isGameOver && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 px-4 py-3">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <NavButton 
              active={gameState.currentView === 'quest'} 
              onClick={() => setView('quest')} 
              icon={<Sword size={20} />} 
              label="Quest" 
            />
            <NavButton 
              active={gameState.currentView === 'inventory'} 
              onClick={() => setView('inventory')} 
              icon={<Backpack size={20} />} 
              label="Items" 
            />
            <NavButton 
              active={gameState.currentView === 'character'} 
              onClick={() => setView('character')} 
              icon={<User size={20} />} 
              label="Hero" 
            />
            <NavButton 
              active={gameState.currentView === 'resources'} 
              onClick={() => setView('resources')} 
              icon={<Settings size={20} />} 
              label="Menu" 
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-[#ff4e00] scale-110' : 'text-[#8e9299] hover:text-white'}`}
    >
      <div className={`p-2 rounded-full transition-colors ${active ? 'bg-[#ff4e00]/10' : 'bg-transparent'}`}>
        {icon}
      </div>
      <span className="text-[10px] uppercase tracking-widest font-sans font-bold">{label}</span>
    </button>
  );
}

import React, { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Shield, 
  Backpack, 
  User as UserIcon, 
  Settings
} from 'lucide-react';
import { loginWithGoogle } from './firebase';
import { Character } from './types';
import { useGameStore, initGameStoreListeners } from './store/useGameStore';

import LandingPage from './components/LandingPage';
import CharacterCreation from './components/CharacterCreation';
import QuestView from './components/QuestView';
import InventoryView from './components/InventoryView';
import CharacterView from './components/CharacterView';
import ResourcesView from './components/ResourcesView';

function AppContent() {
  const isAuthReady = useGameStore(s => s.isAuthReady);
  const user = useGameStore(s => s.user);
  const currentView = useGameStore(s => s.gameState.currentView);
  const character = useGameStore(s => s.gameState.character);
  const isGameOver = useGameStore(s => s.gameState.isGameOver);
  const setView = useGameStore(s => s.setView);
  const resetGame = useGameStore(s => s.resetGame);
  const createNewGame = useGameStore(s => s.createNewGame);
  const setGameState = useGameStore(s => s.setGameState);

  const handleCharacterCreation = async (characterData: Omit<Character, 'uid'>, theme: string) => {
    await createNewGame(characterData, theme);
  };

  const handleLogin = async () => {
    await loginWithGoogle();
  };

  if (!isAuthReady) {
    return <div className="h-screen bg-[#0a0502] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-screen bg-[#0a0502] text-[#e0d8d0] font-serif selection:bg-[#ff4e00]/30 overflow-hidden flex flex-col">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#3a1510] blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#ff4e00] blur-[150px] opacity-10" />
      </div>

      <main className={`flex-1 relative z-10 overflow-y-auto ${character && currentView !== 'landing' && currentView !== 'creation' ? 'pb-24' : ''}`}>
        <div className="h-full w-full">
          <AnimatePresence mode="wait">
          {currentView === 'landing' && (
            <LandingPage key="landing" onStart={() => setView('creation')} user={user} onLogin={handleLogin} />
          )}
          {currentView === 'creation' && (
            <CharacterCreation key="creation" onComplete={handleCharacterCreation} />
          )}
          {currentView === 'quest' && (
            <QuestView key="quest" />
          )}
          {currentView === 'inventory' && (
            <InventoryView key="inventory" character={character!} setGameState={setGameState} />
          )}
          {currentView === 'character' && (
            <CharacterView key="character" character={character!} />
          )}
          {currentView === 'resources' && (
            <ResourcesView key="resources" setView={setView} />
          )}
        </AnimatePresence>
      </div>
    </main>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
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
      {character && currentView !== 'landing' && currentView !== 'creation' && !isGameOver && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 px-4 py-3">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <NavButton 
              active={currentView === 'quest'} 
              onClick={() => setView('quest')} 
              icon={<Sword size={20} />} 
              label="Quest" 
            />
            <NavButton 
              active={currentView === 'inventory'} 
              onClick={() => setView('inventory')} 
              icon={<Backpack size={20} />} 
              label="Items" 
            />
            <NavButton 
              active={currentView === 'character'} 
              onClick={() => setView('character')} 
              icon={<UserIcon size={20} />} 
              label="Hero" 
            />
            <NavButton 
              active={currentView === 'resources'} 
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

export default function App() {
  useEffect(() => {
    initGameStoreListeners();
    
    const initNativeConfigs = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0502' });
        await SplashScreen.hide();
      } catch (e) {
        // Ignored on web
      }
    };
    initNativeConfigs();
  }, []);

  return <AppContent />;
}

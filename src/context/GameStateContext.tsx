import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameState, Character, GameLog } from '../types';
import { auth, db, onAuthStateChanged, User, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';

interface GameStateContextProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  user: User | null;
  isAuthReady: boolean;
  setView: (view: GameState['currentView']) => void;
  resetGame: () => void;
}

const GameStateContext = createContext<GameStateContextProps | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    character: null,
    currentView: 'landing',
    logs: [],
    isCombat: false,
    enemies: [],
    turn: 'player',
    combatCount: 0
  });

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Characters and logs sync
  useEffect(() => {
    if (!user) {
      setGameState(prev => ({ ...prev, character: null, currentView: 'landing', logs: [] }));
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeCharacter = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Character;
        setGameState(prev => ({ 
          ...prev, 
          character: data,
          currentView: prev.currentView === 'landing' || prev.currentView === 'creation' ? 'quest' : prev.currentView
        }));
      } else {
        setGameState(prev => ({ ...prev, character: null }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const logsQuery = query(
      collection(db, 'users', user.uid, 'logs'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (querySnapshot) => {
      const logs: GameLog[] = [];
      querySnapshot.forEach((doc) => {
        logs.push(doc.data() as GameLog);
      });
      
      if (logs.length === 0 && user) {
        const initialLog: GameLog = {
          id: '1',
          sender: 'gm',
          text: 'The heavy oak door groans behind you, sealing out the biting mountain chill. You find yourself in a dimly lit common room, the air thick with the scent of roasted meat and wet wool. You barely remember the long trek through the Blackwood, your boots still caked in its dark mire, but the promise of warmth and a dry bed was too great to ignore. A hooded figure beckons you from a shadowed corner...',
          timestamp: Date.now(),
          uid: user.uid
        };
        setGameState(prev => ({ ...prev, logs: [initialLog] }));
      } else {
        setGameState(prev => ({ ...prev, logs }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/logs`);
    });

    return () => {
      unsubscribeCharacter();
      unsubscribeLogs();
    };
  }, [user]);

  // Death effect
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

  const setView = (view: GameState['currentView']) => {
    setGameState(prev => ({ ...prev, currentView: view }));
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

  return (
    <GameStateContext.Provider value={{ gameState, setGameState, user, isAuthReady, setView, resetGame }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

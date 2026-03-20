import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameState, Character, GameLog, Game } from '../types';
import { auth, db, onAuthStateChanged, User, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, setDoc } from 'firebase/firestore';

interface GameStateContextProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  user: User | null;
  isAuthReady: boolean;
  setView: (view: GameState['currentView']) => void;
  resetGame: () => void;
  savedGames: Game[];
  createNewGame: (character: Omit<Character, 'uid'>, theme: string) => Promise<void>;
  loadGame: (gameId: string) => void;
}

const GameStateContext = createContext<GameStateContextProps | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [savedGames, setSavedGames] = useState<Game[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    character: null,
    theme: undefined,
    activeGameId: null,
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

  // Saved Games sync
  useEffect(() => {
    if (!user) {
      setSavedGames([]);
      return;
    }

    const gamesQuery = query(collection(db, 'users', user.uid, 'games'), orderBy('updatedAt', 'desc'));
    const unsubscribeGames = onSnapshot(gamesQuery, (querySnapshot) => {
      const games: Game[] = [];
      querySnapshot.forEach((docSnap) => {
        games.push({ id: docSnap.id, ...docSnap.data() } as Game);
      });
      setSavedGames(games);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/games`);
    });

    return () => unsubscribeGames();
  }, [user]);

  // Active Game (Character and Logs) sync
  useEffect(() => {
    if (!user || !gameState.activeGameId) {
      if (gameState.activeGameId === null && gameState.character !== null) {
        setGameState(prev => ({ ...prev, character: null, theme: undefined, logs: [] }));
      }
      return;
    }

    const gameDocRef = doc(db, 'users', user.uid, 'games', gameState.activeGameId);
    const unsubscribeCharacter = onSnapshot(gameDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Game;
        setGameState(prev => ({ 
          ...prev, 
          character: data.character,
          theme: data.theme,
          combatCount: data.combatCount || 0,
          currentView: prev.currentView === 'landing' || prev.currentView === 'creation' ? 'quest' : prev.currentView
        }));
      } else {
        // Game deleted or invalid
        setGameState(prev => ({ ...prev, character: null, activeGameId: null, theme: undefined }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/games/${gameState.activeGameId}`);
    });

    const logsQuery = query(
      collection(db, 'users', user.uid, 'games', gameState.activeGameId, 'logs'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (querySnapshot) => {
      const logs: GameLog[] = [];
      querySnapshot.forEach((docLog) => {
        logs.push(docLog.data() as GameLog);
      });
      
      setGameState(prev => ({ ...prev, logs }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/games/${gameState.activeGameId}/logs`);
    });

    return () => {
      unsubscribeCharacter();
      unsubscribeLogs();
    };
  }, [user, gameState.activeGameId]);

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

  const loadGame = (gameId: string) => {
    setGameState(prev => ({
      ...prev,
      activeGameId: gameId,
      currentView: 'quest',
      isGameOver: false,
      isCombat: false,
      enemies: []
    }));
  };

  const createNewGame = async (characterData: Omit<Character, 'uid'>, theme: string) => {
    if (!user) return;
    const gameId = doc(collection(db, 'users')).id; // Generate random ID
    const character: Character = {
      ...characterData,
      uid: user.uid
    };

    const newGame: Omit<Game, 'id'> = {
      theme,
      character,
      updatedAt: Date.now(),
      combatCount: 0
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'games', gameId), newGame);
      setGameState(prev => ({
        ...prev,
        activeGameId: gameId,
        theme,
        character,
        currentView: 'quest',
        isGameOver: false,
        isCombat: false,
        enemies: [],
        logs: []
      }));
      // Add initial log
      const initialLog: GameLog = {
        id: '1',
        sender: 'gm',
        text: `You open your eyes. The atmosphere is unfamiliar, yet exactly as you feared. A new journey begins. What do you do?`,
        timestamp: Date.now(),
        uid: user.uid
      };
      await setDoc(doc(db, 'users', user.uid, 'games', gameId, 'logs', '1'), initialLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/games/${gameId}`);
    }
  };

  const resetGame = () => {
    setGameState(prev => ({
       ...prev,
       character: null,
       activeGameId: null,
       theme: undefined,
       currentView: 'landing',
       logs: [],
       isCombat: false,
       enemies: [],
       isGameOver: false,
       combatCount: 0
    }));
  };

  return (
    <GameStateContext.Provider value={{ gameState, setGameState, user, isAuthReady, setView, resetGame, savedGames, createNewGame, loadGame }}>
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

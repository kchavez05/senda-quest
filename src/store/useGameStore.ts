import { create } from 'zustand';
import { GameState, Character, GameLog, Game } from '../types';
import { auth, db, onAuthStateChanged, User, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, setDoc } from 'firebase/firestore';

interface GameStore {
  gameState: GameState;
  setGameState: (updater: GameState | ((prev: GameState) => GameState)) => void;
  user: User | null;
  isAuthReady: boolean;
  savedGames: Game[];
  setView: (view: GameState['currentView']) => void;
  resetGame: () => void;
  createNewGame: (character: Omit<Character, 'uid'>, theme: string) => Promise<void>;
  loadGame: (gameId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  user: null,
  isAuthReady: false,
  savedGames: [],
  gameState: {
    character: null,
    theme: undefined,
    activeGameId: null,
    currentView: 'landing',
    logs: [],
    isCombat: false,
    enemies: [],
    turn: 'player',
    combatCount: 0,
    isGameOver: false,
  },

  setGameState: (updater) => {
    set((state) => ({
      gameState: typeof updater === 'function' ? updater(state.gameState) : updater
    }));
  },

  setView: (view) => set((state) => ({ gameState: { ...state.gameState, currentView: view } })),

  resetGame: () => set((state) => ({
    gameState: {
      ...state.gameState,
      character: null,
      activeGameId: null,
      theme: undefined,
      currentView: 'landing',
      logs: [],
      isCombat: false,
      enemies: [],
      isGameOver: false,
      combatCount: 0
    }
  })),

  loadGame: (gameId) => set((state) => ({
    gameState: {
      ...state.gameState,
      activeGameId: gameId,
      currentView: 'quest',
      isGameOver: false,
      isCombat: false,
      enemies: []
    }
  })),

  createNewGame: async (characterData, theme) => {
    const { user } = get();
    if (!user) return;
    const gameId = doc(collection(db, 'users')).id;
    const character: Character = { ...characterData, uid: user.uid };

    const newGame: Omit<Game, 'id'> = { theme, character, updatedAt: Date.now(), combatCount: 0 };

    try {
      await setDoc(doc(db, 'users', user.uid, 'games', gameId), newGame);
      set((state) => ({
        gameState: {
          ...state.gameState,
          activeGameId: gameId,
          theme,
          character,
          currentView: 'quest',
          isGameOver: false,
          isCombat: false,
          enemies: [],
          logs: []
        }
      }));
      const initialLog: GameLog = {
        id: '1', sender: 'gm', text: `You open your eyes. The atmosphere is unfamiliar, yet exactly as you feared. A new journey begins. What do you do?`, timestamp: Date.now(), uid: user.uid
      };
      await setDoc(doc(db, 'users', user.uid, 'games', gameId, 'logs', '1'), initialLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/games/${gameId}`);
    }
  }
}));

// Setup Firebase Listeners
let unsubAuth: (() => void) | null = null;
let unsubGames: (() => void) | null = null;
let unsubChar: (() => void) | null = null;
let unsubLogs: (() => void) | null = null;

export const initGameStoreListeners = () => {
  if (unsubAuth) return; // already initialized

  unsubAuth = onAuthStateChanged(auth, (currentUser) => {
    useGameStore.setState({ user: currentUser, isAuthReady: true });
  });

  // Watch for user changes to setup savedGames listener
  useGameStore.subscribe((state, prevState) => {
    if (state.user?.uid !== prevState.user?.uid) {
      if (unsubGames) { unsubGames(); unsubGames = null; }
      if (unsubChar) { unsubChar(); unsubChar = null; }
      if (unsubLogs) { unsubLogs(); unsubLogs = null; }

      const user = state.user;
      if (user) {
        const gamesQuery = query(collection(db, 'users', user.uid, 'games'), orderBy('updatedAt', 'desc'));
        unsubGames = onSnapshot(gamesQuery, (querySnapshot) => {
          const games: Game[] = [];
          querySnapshot.forEach(docSnap => games.push({ id: docSnap.id, ...docSnap.data() } as Game));
          useGameStore.setState({ savedGames: games });
        }, error => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/games`));
      } else {
        useGameStore.setState({ savedGames: [] });
      }
    }
  });

  // Watch for activeGameId changes
  useGameStore.subscribe((state, prevState) => {
    const user = state.user;
    const activeGameId = state.gameState.activeGameId;
    const prevActiveGameId = prevState.gameState.activeGameId;

    if (activeGameId !== prevActiveGameId || state.user?.uid !== prevState.user?.uid) {
      if (unsubChar) { unsubChar(); unsubChar = null; }
      if (unsubLogs) { unsubLogs(); unsubLogs = null; }

      if (user && activeGameId) {
        const gameDocRef = doc(db, 'users', user.uid, 'games', activeGameId);
        unsubChar = onSnapshot(gameDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Game;
            useGameStore.setState((s) => ({
              gameState: {
                ...s.gameState,
                character: data.character,
                theme: data.theme,
                combatCount: data.combatCount || 0,
                currentView: (s.gameState.currentView === 'landing' || s.gameState.currentView === 'creation') ? 'quest' : s.gameState.currentView
              }
            }));
          } else {
             useGameStore.setState((s) => ({ gameState: { ...s.gameState, character: null, activeGameId: null, theme: undefined } }));
          }
        }, error => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/games/${activeGameId}`));

        const logsQuery = query(collection(db, 'users', user.uid, 'games', activeGameId, 'logs'), orderBy('timestamp', 'asc'));
        unsubLogs = onSnapshot(logsQuery, (querySnapshot) => {
          const logs: GameLog[] = [];
          querySnapshot.forEach(docLog => logs.push(docLog.data() as GameLog));
          useGameStore.setState((s) => ({ gameState: { ...s.gameState, logs } }));
        }, error => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/games/${activeGameId}/logs`));
      }
    }
  });

  // Death effect watch
  useGameStore.subscribe((state) => {
    const char = state.gameState.character;
    const isGameOver = state.gameState.isGameOver;
    if (char && char.hp <= 0 && !isGameOver) {
      useGameStore.setState((s) => ({
        gameState: {
          ...s.gameState,
          isGameOver: true,
          logs: [...s.gameState.logs, {
            id: `death-${Date.now()}`, sender: 'system', text: 'YOUR JOURNEY HAS ENDED. You have succumbed to your wounds.', timestamp: Date.now()
          }]
        }
      }));
    }
  });
};

import { create } from 'zustand';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import type { QuizQuestion, QuizConfig } from '../schema';
import { DEFAULT_QUIZ_CONFIG } from '../schema';

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

interface QuizState {
  config: QuizConfig;
  questions: QuizQuestion[];
  isLoading: boolean;
  isReady: boolean;
  error: string | null;

  // Game State
  gameState: 'intro' | 'playing' | 'result';
  currentIndex: number;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentCombo: number;
  maxCombo: number;

  // Stats
  personalBest: number;
  highestCombo: number;
  gamesPlayed: number;

  // Actions
  loadQuizData: (siteId: string) => Promise<void>;
  startGame: () => void;
  answerQuestion: (isCorrect: boolean, points?: number) => void;
  advanceQuestion: () => void;
  resetGame: () => void;
}

const LOCAL_STATS_KEY = 'romantic_engine_quiz_stats';

function loadLocalStats() {
  try {
    const data = localStorage.getItem(LOCAL_STATS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return { personalBest: 0, highestCombo: 0, gamesPlayed: 0 };
}

function saveLocalStats(stats: { personalBest: number, highestCombo: number, gamesPlayed: number }) {
  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
}

const initialStats = loadLocalStats();

export const useQuizStore = create<QuizState>((set, get) => ({
  config: DEFAULT_QUIZ_CONFIG,
  questions: [],
  isLoading: false,
  isReady: false,
  error: null,

  gameState: 'intro',
  currentIndex: 0,
  score: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  currentCombo: 0,
  maxCombo: 0,
  
  personalBest: initialStats.personalBest,
  highestCombo: initialStats.highestCombo,
  gamesPlayed: initialStats.gamesPlayed,

  loadQuizData: async (siteId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        setTimeout(() => {
          set({
            config: { ...DEFAULT_QUIZ_CONFIG, active: true },
            questions: [
              {
                id: 'q1', siteId, question: 'Onde nos conhecemos?',
                options: [{ id: 'o1', text: 'Praia' }, { id: 'o2', text: 'Festa' }, { id: 'o3', text: 'Escola' }, { id: 'o4', text: 'Internet' }],
                correctOptionId: 'o4', points: 100, active: true, order: 1,
              },
              {
                id: 'q2', siteId, question: 'Quem mandou a primeira mensagem?',
                options: [{ id: 'o1', text: 'Eu' }, { id: 'o2', text: 'Você' }, { id: 'o3', text: 'Os dois ao mesmo tempo' }, { id: 'o4', text: 'Um amigo em comum' }],
                correctOptionId: 'o2', points: 100, active: true, order: 2,
              },
            ],
            isLoading: false,
            isReady: true,
          });
        }, 500);
        return;
      }

      // Fetch config
      const configRef = doc(db, 'sites', siteId, 'quiz_config', 'main');
      const configSnap = await getDoc(configRef);
      let loadedConfig = DEFAULT_QUIZ_CONFIG;
      if (configSnap.exists()) {
        loadedConfig = { ...DEFAULT_QUIZ_CONFIG, ...configSnap.data() } as QuizConfig;
      }

      // Fetch active questions — filter active client-side to avoid needing a composite Firestore index
      const qRef = collection(db, 'sites', siteId, 'quiz_questions');
      const qQuery = query(qRef, orderBy('order', 'asc'));
      const qSnap = await getDocs(qQuery);

      let loadedQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion));

      if (loadedConfig.shuffleQuestions) {
        loadedQuestions = shuffleArray(loadedQuestions);
      }
      if (loadedConfig.shuffleOptions) {
        loadedQuestions = loadedQuestions.map(q => ({
          ...q,
          options: shuffleArray(q.options),
        }));
      }

      set({ config: loadedConfig, questions: loadedQuestions, isLoading: false, isReady: true });
    } catch (err: any) {
      console.error('Error loading quiz:', err);
      set({ error: err.message, isLoading: false, isReady: true });
    }
  },

  startGame: () => {
    set({
      gameState: 'playing',
      currentIndex: 0,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentCombo: 0,
      maxCombo: 0,
    });
  },

  answerQuestion: (isCorrect: boolean, points?: number) => {
    const state = get();
    const config = state.config;

    let newScore = state.score;
    let newCombo = state.currentCombo;
    let newMaxCombo = state.maxCombo;

    if (isCorrect) {
      const basePoints = points ?? config.pointsCorrect;
      newScore += basePoints;
      newCombo += 1;
      if (newCombo >= 5) newScore += config.combo5;
      else if (newCombo >= 3) newScore += config.combo3;
      else if (newCombo >= 2) newScore += config.combo2;
      if (newCombo > newMaxCombo) newMaxCombo = newCombo;
    } else {
      newCombo = 0;
      // Apply penalty if provided (e.g. timeout = -50)
      if (points !== undefined && points < 0) {
        newScore = Math.max(0, newScore + points);
      }
    }

    set({
      score: newScore,
      currentCombo: newCombo,
      maxCombo: newMaxCombo,
      correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
      wrongAnswers: state.wrongAnswers + (!isCorrect ? 1 : 0),
    });
  },

  advanceQuestion: () => {
    const state = get();
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.questions.length) {
      const newGamesPlayed = state.gamesPlayed + 1;
      const newPersonalBest = Math.max(state.personalBest, state.score);
      const newHighestCombo = Math.max(state.highestCombo, state.maxCombo);
      
      saveLocalStats({
        personalBest: newPersonalBest,
        highestCombo: newHighestCombo,
        gamesPlayed: newGamesPlayed
      });

      set({ 
        gameState: 'result',
        personalBest: newPersonalBest,
        highestCombo: newHighestCombo,
        gamesPlayed: newGamesPlayed
      });
    } else {
      set({ currentIndex: nextIndex });
    }
  },

  resetGame: () => {
    const state = get();
    let resetQuestions = [...state.questions];
    if (state.config.shuffleQuestions) {
      resetQuestions = shuffleArray(resetQuestions);
    }
    if (state.config.shuffleOptions) {
      resetQuestions = resetQuestions.map(q => ({
        ...q,
        options: shuffleArray(q.options),
      }));
    }
    set({
      gameState: 'intro',
      questions: resetQuestions,
      currentIndex: 0,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentCombo: 0,
      maxCombo: 0,
    });
  },
}));

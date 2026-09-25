export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  siteId: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  points: number;
  explanation?: string;
  active: boolean;
  order: number;
  /**
   * ID do jogador que criou esta pergunta (playerId do config).
   * Perguntas criadas por um jogador nunca são exibidas para ele mesmo.
   * Se omitido, a pergunta aparece para todos.
   */
  createdBy?: string;
}

/**
 * Pergunta gerada por IA — salva em collection separada (ai_quiz_questions).
 * NUNCA deve ser exposta em nenhuma rota do admin.
 * Aparece igualmente para ambos os jogadores.
 */
export interface AiQuizQuestion {
  id: string;
  siteId: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  points: number;
  /** Timestamp da geração (Firestore Timestamp serializado como number em ms) */
  generatedAt: number;
  /** ID único da geração (ex: "2024-12-01T10:30") para controle de batches */
  batchId: string;
}

export interface QuizConfig {
  active: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimit: number | null; // seconds, null for no limit
  pointsCorrect: number;
  combo2: number;
  combo3: number;
  combo5: number;
  messages: {
    perfect: string;  // 100%
    great: string;    // 80-99%
    good: string;     // 50-79%
    bad: string;      // 0-49%
  };
  secretReward?: {
    type: 'none' | 'message' | 'photo';
    content: string; // The text or the image URL
  };
}

export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  active: false,
  shuffleQuestions: false,
  shuffleOptions: false,
  timeLimit: null,
  pointsCorrect: 100,
  combo2: 20,
  combo3: 50,
  combo5: 100,
  messages: {
    perfect: "Você lembra de absolutamente tudo. Essa história mora no seu coração. ❤️",
    great: "Quase perfeito! Você conhece muito bem a nossa história.",
    good: "Tem algumas memórias para revisar... melhor começarmos a relembrar juntos.",
    bad: "Precisamos urgentemente de uma sessão de lembranças. ❤️",
  },
  secretReward: {
    type: 'none',
    content: ''
  }
};

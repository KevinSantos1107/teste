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
  }
};

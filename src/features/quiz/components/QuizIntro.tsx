import { motion } from 'framer-motion';
import { useQuizStore } from '../store/useQuizStore';
import { Sparkles } from 'lucide-react';

export function QuizIntro() {
  const { startGame, questions } = useQuizStore();

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-white/60">Nenhuma pergunta cadastrada ainda.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center text-center"
    >
      <div className="w-20 h-20 bg-[var(--theme-primary)]/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(var(--theme-primary-rgb),0.3)]">
        <Sparkles className="w-10 h-10 text-[var(--theme-primary)]" />
      </div>
      
      <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
        Quanto você lembra da nossa história?
      </h2>
      <p className="text-white/70 text-lg mb-10 max-w-md">
        Vamos descobrir se você realmente lembra de cada detalhe dessa nossa jornada ❤️
      </p>
      
      <button
        onClick={startGame}
        className="px-8 py-4 bg-[var(--theme-primary)] hover:bg-[var(--theme-accent)] text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.4)] transition-all hover:scale-105 active:scale-95 text-lg"
      >
        Começar o Quiz
      </button>
    </motion.div>
  );
}

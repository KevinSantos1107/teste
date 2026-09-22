import { motion } from 'framer-motion';
import { useQuizStore } from '../store/useQuizStore';
import { Sparkles, Trophy, Flame } from 'lucide-react';

export function QuizIntro() {
  const { startGame, questions, personalBest, highestCombo, gamesPlayed } = useQuizStore();

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
      <p className="text-white/70 text-lg mb-8 max-w-md">
        Vamos descobrir se você realmente lembra de cada detalhe dessa nossa jornada ❤️
      </p>

      {gamesPlayed > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10 w-full max-w-sm">
          <div className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
            <span className="text-white/50 text-xs mb-1">Recorde</span>
            <span className="text-xl font-bold text-white">{personalBest}</span>
          </div>
          <div className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <Flame className="w-5 h-5 text-orange-400 mb-1" />
            <span className="text-white/50 text-xs mb-1">Maior Combo</span>
            <span className="text-xl font-bold text-orange-400">x{highestCombo}</span>
          </div>
        </div>
      )}
      
      <button
        onClick={startGame}
        className="px-8 py-4 bg-[var(--theme-primary)] hover:bg-[var(--theme-accent)] text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.4)] transition-all hover:scale-105 active:scale-95 text-lg"
      >
        {gamesPlayed > 0 ? 'Jogar Novamente' : 'Começar o Quiz'}
      </button>
    </motion.div>
  );
}

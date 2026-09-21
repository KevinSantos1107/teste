import { motion } from 'framer-motion';
import { useQuizStore } from '../store/useQuizStore';
import { Trophy, RefreshCw, Flame } from 'lucide-react';
import { useModalsStore } from '../../../store/useModalsStore';

export function QuizResult() {
  const { score, correctAnswers, questions, maxCombo, config, resetGame } = useQuizStore();
  const { closeModal } = useModalsStore();
  
  const percentage = (correctAnswers / questions.length) * 100;
  
  let message = config.messages.bad;
  if (percentage === 100) message = config.messages.perfect;
  else if (percentage >= 80) message = config.messages.great;
  else if (percentage >= 50) message = config.messages.good;
  
  const isPerfect = percentage === 100;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full relative"
    >
      {isPerfect && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div className="absolute w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(var(--theme-primary-rgb),0.2)_0%,transparent_50%)] animate-pulse" />
        </div>
      )}

      <div className="relative z-10 w-24 h-24 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(var(--theme-primary-rgb),0.3)]">
        <Trophy className="w-12 h-12 text-[var(--theme-primary)]" />
      </div>

      <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
        {percentage.toFixed(0)}% de Acerto
      </h2>
      <p className="text-white/70 text-lg mb-8 px-4">
        {message}
      </p>

      <div className="grid grid-cols-2 gap-4 w-full mb-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
          <span className="text-white/50 text-sm mb-1">Pontuação</span>
          <span className="text-2xl font-bold text-white">{score}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
          <span className="text-white/50 text-sm mb-1">Acertos</span>
          <span className="text-2xl font-bold text-white">{correctAnswers}/{questions.length}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center col-span-2">
          <span className="text-white/50 text-sm mb-1">Maior Combo</span>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-2xl font-bold text-orange-400">x{maxCombo}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full sm:flex-row">
        <button
          onClick={resetGame}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[var(--theme-primary)] hover:bg-[var(--theme-accent)] text-white font-bold rounded-2xl transition-transform active:scale-95 shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.3)]"
        >
          <RefreshCw className="w-5 h-5" /> Jogar Novamente
        </button>
        <button
          onClick={closeModal}
          className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl transition-transform active:scale-95"
        >
          Fechar
        </button>
      </div>
    </motion.div>
  );
}

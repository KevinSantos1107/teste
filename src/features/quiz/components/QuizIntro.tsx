import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuizStore } from '../store/useQuizStore';
import { Sparkles, Trophy, Flame } from 'lucide-react';
import { RankingModal } from '../../games/ranking/RankingModal';

export function QuizIntro() {
  const { startGame, questions, personalBest, highestCombo, gamesPlayed } = useQuizStore();
  const [showRanking, setShowRanking] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-white/60">Nenhuma pergunta cadastrada ainda.</p>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex-1 flex flex-col items-center justify-center text-center relative"
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

        {(personalBest > 0 || highestCombo > 0) && (
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 w-full max-w-sm">
            <div className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
              <span className="text-white/50 text-xs mb-1">Recorde Pessoal</span>
              <span className="text-xl font-bold text-white relative z-10">{personalBest}</span>
            </div>
            <div className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Flame className="w-5 h-5 text-orange-400 mb-1" />
              <span className="text-white/50 text-xs mb-1">Maior Combo</span>
              <span className="text-xl font-bold text-orange-400 relative z-10">x{highestCombo}</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <button
            onClick={startGame}
            className="w-full py-4 bg-[var(--theme-primary)] hover:bg-[var(--theme-accent)] text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.4)] transition-all hover:scale-105 active:scale-95 text-lg"
          >
            {(personalBest > 0 || gamesPlayed > 0) ? 'Jogar Novamente' : 'Começar o Quiz'}
          </button>
          
          <button
            onClick={() => setShowRanking(true)}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-yellow-500/20 hover:border-yellow-400/50 text-white font-bold rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            Ranking do Casal
          </button>
        </div>
      </motion.div>

      <RankingModal
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
        initialGame="quiz"
      />
    </>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Flame } from 'lucide-react';
import { useQuizStore } from '../store/useQuizStore';

export function QuizPlay() {
  const { 
    questions, currentIndex, score, currentCombo, 
    answerQuestion, advanceQuestion 
  } = useQuizStore();
  
  const question = questions[currentIndex];
  
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setSelectedOptionId(null);
    setIsAnimating(false);
  }, [currentIndex]);

  if (!question) return null;

  const handleOptionClick = (optionId: string) => {
    if (isAnimating) return;
    
    setSelectedOptionId(optionId);
    setIsAnimating(true);
    
    const isCorrect = optionId === question.correctOptionId;
    answerQuestion(isCorrect);
    
    // Pause before advancing to let user see animation
    setTimeout(() => {
      advanceQuestion();
    }, 1800);
  };

  const isCorrectOption = (id: string) => id === question.correctOptionId;
  
  return (
    <div className="flex-1 flex flex-col h-full w-full max-w-lg mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-white/60 font-mono text-sm">
          Pergunta {currentIndex + 1} / {questions.length}
        </div>
        <div className="flex items-center gap-4">
          {currentCombo >= 2 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={currentCombo}
              className="flex items-center gap-1 text-orange-400 font-bold text-sm"
            >
              <Flame className="w-4 h-4" /> x{currentCombo}
            </motion.div>
          )}
          <div className="font-mono text-[var(--theme-primary)] font-bold">
            {score} pts
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-[var(--theme-primary)]"
          initial={{ width: `${(currentIndex / questions.length) * 100}%` }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col justify-center"
        >
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-10 text-center leading-tight">
            {question.question}
          </h3>

          <div className="flex flex-col gap-3">
            {question.options.map(opt => {
              const isSelected = selectedOptionId === opt.id;
              const isRight = isSelected && isCorrectOption(opt.id);
              const isWrong = isSelected && !isCorrectOption(opt.id);
              const revealRight = isAnimating && isCorrectOption(opt.id) && !isSelected;
              
              let btnClass = "relative w-full p-4 rounded-2xl text-left transition-all border border-white/10 overflow-hidden ";
              
              if (!isAnimating) {
                btnClass += "bg-white/5 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]";
              } else if (isRight || revealRight) {
                btnClass += "bg-green-500/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]";
              } else if (isWrong) {
                btnClass += "bg-red-500/20 border-red-500/50";
              } else {
                btnClass += "bg-white/5 opacity-50";
              }

              return (
                <motion.button
                  key={opt.id}
                  onClick={() => handleOptionClick(opt.id)}
                  disabled={isAnimating}
                  animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={btnClass}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-white md:text-lg">{opt.text}</span>
                    {isAnimating && (isRight || revealRight) && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      </motion.div>
                    )}
                    {isAnimating && isWrong && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle className="w-6 h-6 text-red-400" />
                      </motion.div>
                    )}
                  </div>
                  
                  {isRight && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="absolute inset-0 bg-green-500/10 pointer-events-none"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Feedback message */}
          <div className="h-12 mt-6 flex items-center justify-center">
            <AnimatePresence>
              {isAnimating && selectedOptionId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  {isCorrectOption(selectedOptionId) ? (
                    <p className="text-green-400 font-bold">Você lembra mesmo! ❤️</p>
                  ) : (
                    <p className="text-red-300">Quase! Essa memória escapou 😅</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, PenLine, Sparkles, ChevronRight } from 'lucide-react';

interface ChooseCardProps {
  cards: string[];
  isHost: boolean;
  hostName: string;
  canSkip: boolean;
  categoryIndex: number;
  onChoose: (category: string) => Promise<void>;
  onSkip: () => Promise<void>;
}

const EMOJIS = ['🌟', '🎭', '🎨', '🎯', '🧩', '🎪', '🚀', '🔮'];

export function ChooseCard({
  cards,
  isHost,
  hostName,
  canSkip,
  categoryIndex,
  onChoose,
  onSkip,
}: ChooseCardProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChoose = async (cat: string) => {
    setLoading(true);
    try {
      await onChoose(cat);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await onSkip();
    } finally {
      setLoading(false);
    }
  };

  if (!isHost) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-6 p-6"
      >
        <div className="relative flex items-center justify-center w-24 h-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-[var(--theme-primary)] opacity-20 border-t-[var(--theme-primary)]"
          />
          <Sparkles className="w-8 h-8 text-[var(--theme-primary)] animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white/90 text-lg font-medium" aria-live="polite">
            {hostName} está escolhendo a categoria
          </p>
          <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs tracking-wider">
            RODADA {categoryIndex + 1}/5
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 p-4 md:p-8"
    >
      <div className="text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary)] border border-[var(--theme-primary)] bg-opacity-10 border-opacity-20 text-xs font-semibold uppercase tracking-widest">
          Rodada {categoryIndex + 1} de 5
        </span>
        <h3 className="text-3xl md:text-4xl font-serif font-bold text-white">
          Sua vez de escolher
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {!customMode ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
              {cards.map((card, i) => (
                <motion.button
                  key={`${card}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChoose(card)}
                  disabled={loading}
                  className="group relative w-full p-6 rounded-3xl text-left bg-gradient-to-b from-white/10 to-white/5 border border-white/10 hover:border-[var(--theme-primary)] transition-all disabled:opacity-40 overflow-hidden shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-primary)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{EMOJIS[i % EMOJIS.length]}</span>
                      <span className="text-base md:text-lg font-medium text-white/90 group-hover:text-white transition-colors">
                        {card}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[var(--theme-primary)] transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4 w-full max-w-md mt-4">
              {canSkip && (
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all disabled:opacity-40"
                >
                  <Shuffle className="w-4 h-4" />
                  Trocar Opções
                </button>
              )}
              <button
                onClick={() => setCustomMode(true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-medium text-[var(--theme-accent)] bg-[var(--theme-accent)] bg-opacity-10 hover:bg-opacity-20 border border-[var(--theme-accent)] border-opacity-20 transition-all disabled:opacity-40"
              >
                <PenLine className="w-4 h-4" />
                Criar Própria
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md flex flex-col gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
          >
            <div className="space-y-4">
              <label className="text-sm font-medium text-white/70 block">
                Digite a categoria personalizada:
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Ex: Filmes de terror dos anos 80..."
                maxLength={60}
                autoFocus
                className="w-full py-4 px-5 rounded-2xl text-base text-white bg-black/20 border border-white/10 focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] outline-none transition-all placeholder:text-white/20"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCustomMode(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleChoose(customText.trim())}
                disabled={!customText.trim() || loading}
                className="flex-[2] py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
              >
                Usar Categoria
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


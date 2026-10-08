import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { validateWord } from '../syncLogic';
import { WaitingFor } from './WaitingFor';
import type { SyncRoomHistory } from '../useSyncRoom';

interface WordInputProps {
  category: string;
  roundNumber: number;
  isLocked: boolean;
  partnerLocked: boolean;
  history: SyncRoomHistory[];
  deadline: number | null;
  waitingItems: { id: string; name: string; avatarUrl?: string; done: boolean }[];
  onLock: (word: string) => Promise<void>;
  onTurboOut: (round: number) => Promise<void>;
}

export function WordInput({
  category,
  roundNumber,
  isLocked,
  partnerLocked,
  history,
  deadline,
  waitingItems,
  onLock,
  onTurboOut,
}: WordInputProps) {
  const [word, setWord] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (!isLocked) {
      inputRef.current?.focus();
    }
  }, [isLocked, roundNumber]);

  const turboFiredRef = useRef<number | null>(null);

  // Timer for turbo mode
  useEffect(() => {
    if (!deadline) {
      setTimeLeft(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && turboFiredRef.current !== roundNumber) {
        turboFiredRef.current = roundNumber;
        onTurboOut(roundNumber);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, roundNumber, onTurboOut]);

  const handleLock = async () => {
    const trimmed = word.trim();
    const validation = validateWord(trimmed, history);
    if (!validation.valid) {
      setError(validation.error || 'Palavra inválida');
      return;
    }

    setError(null);
    setLocking(true);
    try {
      await onLock(trimmed);
    } finally {
      setLocking(false);
    }
  };

  const lastRound = history.length > 0 ? history[history.length - 1] : null;

  // Calculate timer progress
  const TURBO_SECONDS = 30;
  const progress = timeLeft !== null ? (timeLeft / TURBO_SECONDS) * 100 : 100;
  const isUrgent = timeLeft !== null && timeLeft <= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 px-4 py-8 md:py-16 md:gap-8 w-full max-w-lg mx-auto"
    >
      {/* Category Card */}
      <div className="w-full relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-10 rounded-3xl blur-xl transition-all duration-500 group-hover:opacity-20" />
        <div className="relative w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center shadow-2xl">
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            {category}
          </h3>
          
          {/* Visual Round Indicator */}
          <div className="flex justify-center gap-2 mt-6" aria-label={`Rodada ${roundNumber} de 6`}>
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <motion.div
                key={step}
                initial={false}
                animate={{
                  width: step === roundNumber ? 24 : 8,
                  opacity: step <= roundNumber ? 1 : 0.3,
                  backgroundColor: step <= roundNumber ? 'var(--theme-primary)' : '#ffffff'
                }}
                className="h-2 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Timer Ring */}
      {timeLeft !== null && (
        <div className="relative flex items-center justify-center w-16 h-16">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={isUrgent ? '#ff4444' : 'var(--theme-primary)'}
              strokeWidth="4"
              strokeDasharray="175.93" // 2 * PI * 28
              animate={{ strokeDashoffset: 175.93 - (175.93 * Math.max(progress, 0)) / 100 }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <div className="flex flex-col items-center justify-center text-white" aria-label={`Tempo restante: ${timeLeft} segundos`}>
            <span className="text-lg font-bold" style={{ color: isUrgent ? '#ff4444' : 'inherit' }}>
              {timeLeft}
            </span>
          </div>
        </div>
      )}

      {/* Anchors (Speech Bubbles) */}
      {lastRound && (
        <div className="w-full flex flex-col items-center gap-3 relative z-10">
          <span className="text-white/40 text-xs uppercase tracking-widest font-medium mb-1">
            Palavras Anteriores
          </span>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(lastRound.words).map(([id, w], idx) => (
              <motion.div
                key={w + id}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl shadow-lg"
              >
                <span className="text-white/90 font-medium text-lg">"{w}"</span>
                {/* Speech bubble tail */}
                <div className={`absolute -bottom-2 ${idx === 0 ? 'left-4' : 'right-4'} w-4 h-4 bg-white/10 border-b border-r border-white/20 transform rotate-45`} />
              </motion.div>
            ))}
          </div>
          <p className="text-white/40 text-xs mt-3 text-center max-w-[200px]">
            Tente encontrar o meio termo perfeito
          </p>
        </div>
      )}

      {/* Input / Locked State */}
      <div className="w-full mt-4 md:mt-8">
        {!isLocked ? (
          <div className="w-full flex flex-col gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent,var(--theme-primary))] opacity-0 rounded-2xl blur transition-opacity duration-500 group-focus-within:opacity-30" />
              <input
                ref={inputRef}
                type="text"
                value={word}
                onChange={(e) => {
                  setWord(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && word.trim()) handleLock();
                }}
                placeholder="Sua palavra…"
                maxLength={30}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="send"
                className="relative w-full py-4 px-6 rounded-2xl text-lg font-medium text-white text-center bg-white/5 backdrop-blur-xl border border-white/10 focus:border-white/40 focus:bg-white/10 outline-none transition-all placeholder:text-white/30"
                aria-label="Digite sua palavra"
              />
            </div>
            
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center font-medium" role="alert">
                {error}
              </motion.p>
            )}

            <motion.button
              whileTap={!word.trim() || locking ? {} : { scale: 0.96 }}
              onClick={handleLock}
              disabled={!word.trim() || locking}
              className="relative w-full py-4 rounded-2xl font-bold text-base text-white overflow-hidden transition-all disabled:opacity-50 disabled:grayscale group"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent, var(--theme-primary)) 100%)' }}
              aria-label={locking ? 'Travando palavra' : 'Travar palavra'}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                {locking ? 'Travando…' : 'Travar'}
              </span>
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            className="w-full flex flex-col items-center gap-6"
          >
            {/* Locked word display */}
            <div className="w-full relative px-6 py-5 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex justify-center">
               {/* Frosted glass effect over the word */}
              <div className="absolute inset-0 backdrop-blur-[4px] bg-black/20 z-10 flex items-center justify-center">
                 <motion.div
                   animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
                   transition={{ duration: 0.5 }}
                 >
                   <Lock className="w-8 h-8 text-white/80" />
                 </motion.div>
              </div>
              <span className="text-2xl font-bold text-white/30 tracking-widest blur-[2px] select-none">
                {word.toUpperCase()}
              </span>
            </div>

            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-white/60 text-base font-medium text-center" 
              aria-live="polite"
            >
              {partnerLocked ? 'Ambos travados! Revelando…' : `Aguardando…`}
            </motion.p>

            <WaitingFor items={waitingItems} label="Travaram" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}




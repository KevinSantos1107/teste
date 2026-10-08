import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, HandHelping, ThumbsUp, ThumbsDown } from 'lucide-react';
import { WaitingFor } from './WaitingFor';

interface RevealProps {
  words: Record<string, string>;
  p1Id: string;
  p2Id: string;
  playerName: string;
  partnerName: string;
  player: string;
  synced: boolean;
  lastWord: string | null;
  roundNumber: number;
  synonymProposal: { by: string } | null;
  isReady: boolean;
  partnerReady: boolean;
  waitingItems: { id: string; name: string; avatarUrl?: string; done: boolean }[];
  autoAdvanceMs?: number | null;
  onNext: () => Promise<void>;
  onProposeSynonym: () => Promise<void>;
  onAcceptSynonym: () => Promise<void>;
  onRejectSynonym: () => Promise<void>;
}

export function Reveal({
  words,
  p1Id,
  p2Id,
  playerName,
  partnerName,
  player,
  synced,
  lastWord,
  roundNumber,
  synonymProposal,
  isReady,
  partnerReady,
  waitingItems,
  autoAdvanceMs,
  onNext,
  onProposeSynonym,
  onAcceptSynonym,
  onRejectSynonym,
}: RevealProps) {
  const partnerId = player === p1Id ? p2Id : p1Id;
  const myWord = words[player] || '(vazio)';
  const theirWord = words[partnerId] || '(vazio)';

  // Vibrate on reveal
  useEffect(() => {
    try {
      navigator.vibrate?.(synced ? [100, 50, 100] : [80]);
    } catch {
      // vibrate not available
    }
  }, [synced]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4 py-8 md:py-16 w-full max-w-2xl mx-auto"
    >
      <span className="text-white/40 text-sm uppercase tracking-widest font-medium bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
        Rodada {roundNumber}
      </span>

      {/* Word cards */}
      <div className="relative w-full flex items-center justify-between md:justify-center md:gap-16 mt-4">
        {/* Connection Line Background */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0 hidden md:block" />

        <WordCard 
          word={myWord} 
          label={playerName} 
          initialX={-50} 
          delay={0.1}
          isLeft={true}
        />

        {/* Center Indicator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {synced ? (
              <motion.div
                key="synced"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="relative flex items-center justify-center w-16 h-16 rounded-full bg-pink-500/20 backdrop-blur-md border border-pink-500/40 shadow-[0_0_30px_rgba(236,72,153,0.4)]"
              >
                <Heart className="w-8 h-8 text-pink-400 drop-shadow-md" fill="currentColor" />
                {/* Glow ring */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-pink-400"
                  animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="notsynced"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
              >
                <X className="w-6 h-6 text-white/30" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <WordCard 
          word={theirWord} 
          label={partnerName} 
          initialX={50} 
          delay={0.2}
          isLeft={false}
        />
      </div>

      {/* Result message */}
      <div className="h-24 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {synced ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="text-center w-full"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-white to-pink-300 drop-shadow-sm">
                Sincronizaram! 💫
              </h2>
              <p className="text-white/60 text-base md:text-lg mt-3">
                Palavra mágica: <span className="text-white font-bold tracking-wide">"{lastWord}"</span>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="fail"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center w-full"
            >
              <p className="text-white/50 text-base md:text-lg font-medium">
                Quase lá...
              </p>
              <p className="text-white/40 text-sm mt-1">
                {roundNumber < 6 ? 'Ainda há tempo, tentem novamente!' : 'Última chance passou…'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions & Synonym Flow */}
      <div className="w-full max-w-sm flex flex-col gap-6 mt-4">
        {/* Synonym proposal */}
        {!synced && !synonymProposal && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onProposeSynonym}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-full text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-sm"
            aria-label="Propor que as palavras contem como iguais"
          >
            <HandHelping className="w-4 h-4" />
            Considerar como igual
          </motion.button>
        )}

        {synonymProposal && synonymProposal.by === player && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-white/60 text-sm animate-pulse" aria-live="polite">
              Aguardando {partnerName} aceitar a proposta…
            </p>
          </motion.div>
        )}

        {synonymProposal && synonymProposal.by !== player && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 flex flex-col items-center gap-4 shadow-lg"
          >
            <p className="text-white text-sm font-medium text-center">
              <span className="font-bold text-indigo-300">{partnerName}</span> propõe que as palavras sejam consideradas iguais.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={onRejectSynonym}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-red-400 bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 transition-colors active:scale-95"
                aria-label="Recusar proposta"
              >
                <ThumbsDown className="w-4 h-4" />
                Recusar
              </button>
              <button
                onClick={onAcceptSynonym}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-green-400 bg-green-400/10 border border-green-400/20 hover:bg-green-400/20 transition-colors active:scale-95 shadow-[0_0_15px_rgba(74,222,128,0.15)]"
                aria-label="Aceitar proposta"
              >
                <ThumbsUp className="w-4 h-4" />
                Aceitar
              </button>
            </div>
          </motion.div>
        )}

        {/* Continue button & Waiting For */}
        <div className="w-full flex flex-col items-center gap-4">
          <motion.button
            whileTap={isReady ? {} : { scale: 0.96 }}
            onClick={onNext}
            disabled={isReady}
            className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all disabled:opacity-60 overflow-hidden relative group shadow-lg"
            style={{ 
              background: isReady && !partnerReady ? 'var(--theme-card-border)' : 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent, var(--theme-primary)) 100%)' 
            }}
            aria-label={isReady ? (partnerReady ? 'Avançando' : `Esperando ${partnerName}`) : 'Continuar para a próxima etapa'}
          >
            {/* Auto-advance progress bar inside button */}
            {autoAdvanceMs !== null && autoAdvanceMs !== undefined && !isReady && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: autoAdvanceMs / 1000, ease: "linear" }}
                className="absolute inset-0 bg-black/20"
              />
            )}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative">
              {isReady
                ? partnerReady
                  ? 'Avançando...'
                  : `Pronto`
                : 'Continuar'}
            </span>
          </motion.button>
          
          <WaitingFor items={waitingItems} label="Continuar" />
        </div>
      </div>
    </motion.div>
  );
}

function WordCard({ word, label, initialX, delay, isLeft }: { word: string; label: string, initialX: number, delay: number, isLeft: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: initialX }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 100, delay }}
      className={`flex flex-col gap-2 z-10 w-[42%] max-w-[180px] ${isLeft ? 'items-end' : 'items-start'}`}
    >
      <span className="text-white/40 text-xs uppercase tracking-widest font-medium px-1 truncate w-full text-center">{label}</span>
      <div className="w-full py-6 px-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center min-h-[96px]">
        <span className="text-white font-bold text-xl md:text-2xl break-words text-center leading-tight drop-shadow-md">
          {word}
        </span>
      </div>
    </motion.div>
  );
}

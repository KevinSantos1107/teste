import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Heart } from 'lucide-react';

interface LobbyProps {
  playerName: string;
  partnerName: string;
  isPartnerOnline: boolean;
  onStart: () => Promise<void>;
  onStartTurbo: () => Promise<void>;
}

export function Lobby({
  playerName,
  partnerName,
  isPartnerOnline,
  onStart,
  onStartTurbo,
}: LobbyProps) {
  const [starting, setStarting] = useState(false);

  const handleStart = async (turbo: boolean) => {
    setStarting(true);
    try {
      if (turbo) await onStartTurbo();
      else await onStart();
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="relative w-full min-h-[60vh] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--theme-primary)] opacity-20 rounded-full blur-[100px] -z-10 mix-blend-screen animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[var(--theme-accent)] opacity-20 rounded-full blur-[80px] -z-10 mix-blend-screen animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl flex flex-col items-center gap-8 md:gap-12"
      >
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-2"
          >
            <span className="text-white/80 text-xs font-medium tracking-widest uppercase">Pronto para jogar</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
            Sincronia
          </h2>
          <p className="text-white/60 text-sm md:text-base max-w-md mx-auto">
            Escrevam a mesma palavra, sem combinar. Quanto menos rodadas, melhor!
          </p>
        </div>

        {/* Players Area */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <PlayerBadge name={playerName} online={true} />
          
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5"
          >
            <Heart className="w-5 h-5 text-[var(--theme-primary)] fill-[var(--theme-primary)] opacity-80" />
          </motion.div>

          <PlayerBadge name={partnerName} online={isPartnerOnline} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={() => handleStart(false)}
            disabled={!isPartnerOnline || starting}
            className="group relative w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden shadow-lg"
            aria-label="Começar sessão"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center gap-2">
              {starting ? 'Criando sala…' : 'Começar'}
            </div>
          </button>

          <button
            onClick={() => handleStart(true)}
            disabled={!isPartnerOnline || starting}
            className="group w-full py-3.5 rounded-2xl font-medium text-sm text-white/90 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm"
            aria-label="Modo turbo"
          >
            <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
            Modo Turbo (30s)
          </button>
        </div>

        {/* Waiting Message */}
        {!isPartnerOnline && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-[var(--theme-primary)] font-medium text-sm bg-[var(--theme-primary)]/10 px-6 py-2 rounded-full" 
            aria-live="polite"
          >
            Aguardando {partnerName} conectar…
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

function PlayerBadge({ name, online }: { name: string; online: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <motion.div
          animate={online ? { boxShadow: ['0 0 0px var(--theme-primary)', '0 0 20px var(--theme-primary)', '0 0 0px var(--theme-primary)'] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl font-serif font-bold border-2 backdrop-blur-md"
          style={{
            borderColor: online ? 'var(--theme-primary)' : 'rgba(255,255,255,0.1)',
            background: online ? 'rgba(var(--theme-primary-rgb), 0.15)' : 'rgba(255,255,255,0.02)',
            color: online ? 'var(--theme-primary)' : 'rgba(255,255,255,0.3)',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </motion.div>
        
        {/* Status indicator */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#121212] flex items-center justify-center">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${online ? 'bg-green-500' : 'bg-gray-500'}`}>
            {online && (
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute w-full h-full rounded-full bg-green-500"
              />
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className="text-base font-medium text-white/90 truncate max-w-[100px] block">{name}</span>
        <span className={`text-xs ${online ? 'text-green-400' : 'text-white/30'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
}

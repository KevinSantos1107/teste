import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../../services/firebase/config';
import { usePlayerStore } from '../../store/usePlayerStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export function PlayerAuthInit() {
  const { setPlayer, setUid } = usePlayerStore();
  const initRef = useRef(false);
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);

  useEffect(() => {
    // Evita rodar duas vezes no Strict Mode do React
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      // 1. Check for token in URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (token) {
        try {
          // Verify token in Firestore
          const tokenRef = doc(db, 'player_tokens', token);
          const tokenSnap = await getDoc(tokenRef);
          
          if (tokenSnap.exists()) {
            const data = tokenSnap.data();
            if (data.player === 'kevin' || data.player === 'iara') {
              setPlayer(data.player);
              
              const msg = data.player === 'iara' 
                ? 'Bem-vinda de volta, Princesa ❤️' 
                : 'Bem-vindo, Kevin 👑';
              
              setWelcomeMsg(msg);
              sessionStorage.setItem('greeted', 'true');
              setTimeout(() => setWelcomeMsg(null), 5000);
            }
          } else {
            console.warn('Token inválido ou expirado.');
            setPlayer('visitante');
          }
        } catch (error) {
          console.error('Erro ao verificar o token:', error);
        } finally {
          // Remove token from URL securely sem refresh
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: newUrl }, '', newUrl);
        }
      } else {
        // Se não tem token na URL, verifica se já é um jogador conhecido (salvo no Zustand/localStorage)
        // e se ainda não foi saudado nesta sessão (aba do navegador)
        const currentPlayer = usePlayerStore.getState().player;
        if (currentPlayer !== 'visitante' && !sessionStorage.getItem('greeted')) {
          const msg = currentPlayer === 'iara' 
            ? 'Bem-vinda de volta, Princesa ❤️' 
            : 'Bem-vindo, Kevin 👑';
          
          setWelcomeMsg(msg);
          sessionStorage.setItem('greeted', 'true');
          setTimeout(() => setWelcomeMsg(null), 5000);
        }
      }

      // 2. Perform anonymous auth to link session for Firestore rules (Phase 3)
      try {
        const userCredential = await signInAnonymously(auth);
        setUid(userCredential.user.uid);
      } catch (error) {
        console.error('Erro ao autenticar anonimamente:', error);
      }
    };

    initAuth();
  }, [setPlayer, setUid]);

  return (
    <AnimatePresence>
      {welcomeMsg && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.25)]">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" />
            <span className="text-white font-medium tracking-wide font-sans text-sm md:text-base">
              {welcomeMsg}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

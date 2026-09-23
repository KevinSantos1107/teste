import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../../services/firebase/config';
import { usePlayerStore } from '../../store/usePlayerStore';

export function PlayerAuthInit() {
  const { setPlayer, setUid, player } = usePlayerStore();

  useEffect(() => {
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
              
              // Custom welcome message
              // You can replace this with a proper toast from your UI library later
              const msg = data.player === 'iara' 
                ? 'Bem-vinda de volta, Princesa ❤️' 
                : 'Bem-vindo, Kevin 👑';
              alert(msg); // Placeholder until we integrate a toast
            }
          } else {
            console.warn('Token inválido ou expirado.');
            setPlayer('visitante');
          }
        } catch (error) {
          console.error('Erro ao verificar o token:', error);
        } finally {
          // Remove token from URL securely without refreshing the page
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: newUrl }, '', newUrl);
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

  return null;
}

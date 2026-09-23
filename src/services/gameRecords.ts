import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase/config';

export type GameId = 'snake' | 'word' | 'quiz';
type PlayerName = 'kevin' | 'iara';

// Aguarda o Firebase Auth terminar a inicialização antes de qualquer operação
function waitForAuth(): Promise<void> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve();
      return;
    }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        unsub();
        resolve();
      }
    });
    // Timeout de segurança: não trava para sempre se o auth falhar
    setTimeout(resolve, 5000);
  });
}

// Formato fixo do documento: "snake_kevin", "word_iara", etc.
function recordDocId(game: GameId, player: PlayerName): string {
  return `${game}_${player}`;
}

/**
 * Lê o recorde de um jogador para um jogo específico.
 * Retorna null se não houver registro ainda.
 */
export async function getRecord(
  game: GameId,
  player: PlayerName
): Promise<number | null> {
  try {
    const ref = doc(db, 'game_records', recordDocId(game, player));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().score as number;
    }
    return null;
  } catch (e) {
    console.error('Erro ao ler recorde:', e);
    return null;
  }
}

/**
 * Salva o recorde somente se a nova pontuação for maior que a atual.
 * Retorna true se o recorde foi atualizado.
 */
export async function saveRecordIfBetter(
  game: GameId,
  player: PlayerName,
  newScore: number
): Promise<boolean> {
  try {
    // Garante que o Firebase Auth já terminou antes de tentar gravar
    await waitForAuth();

    const ref = doc(db, 'game_records', recordDocId(game, player));
    const snap = await getDoc(ref);
    const currentScore = snap.exists() ? (snap.data().score as number) : -1;

    if (newScore > currentScore) {
      await setDoc(ref, {
        game,
        player,
        score: newScore,
        updatedAt: serverTimestamp(),
      });
      return true;
    }
    return false;
  } catch (e) {
    console.error('Erro ao salvar recorde:', e);
    return false;
  }
}

/**
 * Lê os recordes de ambos os jogadores para um jogo.
 * Retorna { kevin: number | null, iara: number | null }.
 * Usa 2 leituras fixas, sem orderBy ou limit.
 */
export async function getRanking(
  game: GameId
): Promise<{ kevin: number | null; iara: number | null }> {
  const [kevin, iara] = await Promise.all([
    getRecord(game, 'kevin'),
    getRecord(game, 'iara'),
  ]);
  return { kevin, iara };
}

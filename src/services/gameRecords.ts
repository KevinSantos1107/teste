import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase/config';

export type GameId = 'snake' | 'word' | 'quiz';
type PlayerName = 'kevin' | 'iara';

// Estrutura do recorde do jogo de palavras (acumulativo)
export interface WordRecord {
  score: number;      // pontuação total acumulada
  wins: number;       // total de vitórias
  streak: number;     // sequência atual de vitórias
  bestStreak: number; // melhor sequência de todos os tempos
}

// Estrutura genérica de recorde (snake, quiz)
export interface SimpleRecord {
  score: number;
}

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
 * Lê o recorde completo do jogo da palavra (acumulativo).
 * Retorna null se não houver registro ainda.
 */
export async function getWordRecord(
  player: PlayerName
): Promise<WordRecord | null> {
  try {
    const ref = doc(db, 'game_records', recordDocId('word', player));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        score: d.score ?? 0,
        wins: d.wins ?? 0,
        streak: d.streak ?? 0,
        bestStreak: d.bestStreak ?? 0,
      };
    }
    return null;
  } catch (e) {
    console.error('Erro ao ler recorde da palavra:', e);
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
 * Salva o resultado de uma partida do jogo da palavra.
 * Sempre incrementa a pontuação acumulada e atualiza streak.
 */
export async function saveWordGameResult(
  player: PlayerName,
  roundScore: number,
  currentStreak: number,
  bestStreak: number
): Promise<void> {
  try {
    await waitForAuth();

    const ref = doc(db, 'game_records', recordDocId('word', player));
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      await setDoc(ref, {
        game: 'word',
        player,
        score: (data.score ?? 0) + roundScore,
        wins: (data.wins ?? 0) + 1,
        streak: currentStreak,
        bestStreak: Math.max(data.bestStreak ?? 0, bestStreak),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        game: 'word',
        player,
        score: roundScore,
        wins: 1,
        streak: currentStreak,
        bestStreak: bestStreak,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.error('Erro ao salvar resultado da palavra:', e);
  }
}

/**
 * Lê os recordes de ambos os jogadores para um jogo simples (snake, quiz).
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

/**
 * Lê os recordes completos do jogo da palavra para ambos os jogadores.
 * Usa 2 leituras fixas.
 */
export async function getWordRanking(): Promise<{
  kevin: WordRecord | null;
  iara: WordRecord | null;
}> {
  const [kevin, iara] = await Promise.all([
    getWordRecord('kevin'),
    getWordRecord('iara'),
  ]);
  return { kevin, iara };
}

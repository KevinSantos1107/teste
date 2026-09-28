import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase/config';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { getPlayerIds } from '../features/auth/playerIds';

export type GameId = 'snake' | 'word' | 'quiz';
type PlayerName = string;

// Estrutura do recorde do jogo de palavras (acumulativo)
export interface WordRecord {
  score: number;      // pontuação total acumulada
  gamesPlayed: number;// total de jogos jogados
  wins: number;       // total de vitórias
  streak: number;     // sequência atual de vitórias
  bestStreak: number; // melhor sequência de todos os tempos
  winsByAttempt: number[]; // vitórias por tentativa (índice 0 a 5)
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
  if (!player) return null; // guard: never call Firestore with undefined/empty player
  try {
    const ref = doc(db, 'game_records', recordDocId(game, player));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().score as number;
    }
    return 0; // Documento não existe, a pontuação é 0
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
  if (!player) return null;
  try {
    const ref = doc(db, 'game_records', recordDocId('word', player));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        score: d.score ?? 0,
        gamesPlayed: d.gamesPlayed ?? d.wins ?? 0,
        wins: d.wins ?? 0,
        streak: d.streak ?? 0,
        bestStreak: d.bestStreak ?? 0,
        winsByAttempt: d.winsByAttempt ?? [0,0,0,0,0,0],
      };
    }
    return null;
  } catch (e) {
    console.error('Erro ao ler recorde da palavra:', e);
    return null;
  }
}

export interface QuizRecord {
  score: number;
  highestCombo: number;
}

/**
 * Lê o recorde do Quiz (Score e Combo).
 */
export async function getQuizRecord(
  player: PlayerName
): Promise<QuizRecord | null> {
  if (!player) return null;
  try {
    const ref = doc(db, 'game_records', recordDocId('quiz', player));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        score: d.score ?? 0,
        highestCombo: d.highestCombo ?? 0,
      };
    }
    return null;
  } catch (e) {
    console.error('Erro ao ler recorde do quiz:', e);
    return null;
  }
}

/**
 * Salva o recorde do Quiz se a pontuação ou o combo forem maiores.
 */
export async function saveQuizRecordIfBetter(
  player: PlayerName,
  newScore: number,
  newCombo: number
): Promise<boolean> {
  try {
    await waitForAuth();
    const ref = doc(db, 'game_records', recordDocId('quiz', player));
    const snap = await getDoc(ref);
    
    let updated = false;
    let dataToSave: any = { game: 'quiz', player, updatedAt: serverTimestamp() };
    
    if (snap.exists()) {
      const data = snap.data();
      const currentScore = data.score ?? 0;
      const currentCombo = data.highestCombo ?? 0;
      
      if (newScore > currentScore) {
        dataToSave.score = newScore;
        updated = true;
      }
      if (newCombo > currentCombo) {
        dataToSave.highestCombo = newCombo;
        updated = true;
      }
    } else {
      dataToSave.score = newScore;
      dataToSave.highestCombo = newCombo;
      updated = true;
    }

    if (updated) {
      await setDoc(ref, dataToSave, { merge: true });
      return true;
    }
    return false;
  } catch (e) {
    console.error('Erro ao salvar recorde do quiz:', e);
    return false;
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
      }, { merge: true });
      return true;
    }
    return false;
  } catch (e) {
    console.error('Erro ao salvar recorde:', e);
    return false;
  }
}

/**
 * Salva o resultado de uma partida do jogo da palavra (vitória ou derrota).
 * Sempre atualiza as métricas acumuladas.
 */
export async function saveWordGameResult(
  player: PlayerName,
  roundScore: number,
  isWin: boolean,
  currentStreak: number,
  bestStreak: number,
  winsByAttempt: number[]
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
        gamesPlayed: (data.gamesPlayed ?? data.wins ?? 0) + 1,
        wins: (data.wins ?? 0) + (isWin ? 1 : 0),
        streak: currentStreak,
        bestStreak: Math.max(data.bestStreak ?? 0, bestStreak),
        winsByAttempt,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      await setDoc(ref, {
        game: 'word',
        player,
        score: roundScore,
        gamesPlayed: 1,
        wins: isWin ? 1 : 0,
        streak: currentStreak,
        bestStreak: bestStreak,
        winsByAttempt,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.error('Erro ao salvar resultado da palavra:', e);
  }
}

function getConfigPlayerIds() {
  const config = useSiteConfigStore.getState().config;
  return getPlayerIds(config);
}

/**
 * Ranking return shape — keys are always 'p1'/'p2', never hardcoded names.
 */
export interface RankingResult<T> {
  p1: T | null;
  p2: T | null;
}

/**
 * Lê os recordes de ambos os jogadores para um jogo simples (snake, quiz).
 */
export async function getRanking(
  game: GameId
): Promise<RankingResult<number>> {
  const { p1Id, p2Id } = getConfigPlayerIds();
  const [p1, p2] = await Promise.all([
    getRecord(game, p1Id),
    getRecord(game, p2Id),
  ]);
  return { p1, p2 };
}

/**
 * Lê os recordes completos do jogo da palavra para ambos os jogadores.
 */
export async function getWordRanking(): Promise<RankingResult<WordRecord>> {
  const { p1Id, p2Id } = getConfigPlayerIds();
  const [p1, p2] = await Promise.all([
    getWordRecord(p1Id),
    getWordRecord(p2Id),
  ]);
  return { p1, p2 };
}

/**
 * Lê os recordes do Quiz para ambos os jogadores.
 */
export async function getQuizRanking(): Promise<RankingResult<QuizRecord>> {
  const { p1Id, p2Id } = getConfigPlayerIds();
  const [p1, p2] = await Promise.all([
    getQuizRecord(p1Id),
    getQuizRecord(p2Id),
  ]);
  return { p1, p2 };
}

// ─── Memory Game Records ──────────────────────────────────────────────────────

export type MemoryDifficulty = 'easy' | 'medium' | 'hard';

export interface MemoryLevelRecord {
  score: number;
  bestTime: number; // seconds — lower is better
}

export interface MemoryRecord {
  score: number;        // all-time best score across all difficulties
  bestTime: number;     // time of the all-time best score (seconds)
  bestScoreLevel?: MemoryDifficulty; // difficulty where the best score was made
  gamesPlayed: number;
  bestCombo: number;    // highest combo streak ever achieved
  easy:   MemoryLevelRecord | null;
  medium: MemoryLevelRecord | null;
  hard:   MemoryLevelRecord | null;
}

/**
 * Reads the memory game record for a player.
 */
export async function getMemoryRecord(
  player: PlayerName
): Promise<MemoryRecord | null> {
  if (!player) return null;
  try {
    const ref = doc(db, 'game_records', `memory_${player}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        score:          d.score          ?? 0,
        bestTime:       d.bestTime       ?? 99999,
        bestScoreLevel: d.bestScoreLevel as MemoryDifficulty | undefined,
        gamesPlayed:    d.gamesPlayed    ?? 0,
        bestCombo:      d.bestCombo      ?? 0,
        easy:   d.easy   ?? null,
        medium: d.medium ?? null,
        hard:   d.hard   ?? null,
      };
    }
    return null;
  } catch (e) {
    console.error('Erro ao ler recorde do jogo da memória:', e);
    return null;
  }
}

function nextMemoryLevelRecord(
  current: MemoryLevelRecord | null,
  newScore: number,
  newTime: number,
): MemoryLevelRecord {
  if (!current) return { score: newScore, bestTime: newTime };
  if (newScore > current.score) return { score: newScore, bestTime: newTime };
  if (newScore === current.score) {
    return { score: current.score, bestTime: Math.min(newTime, current.bestTime ?? 99999) };
  }
  return current;
}

/**
 * Saves the memory game record if the new score is better.
 * Tempo do recorde global segue sempre a partida da melhor pontuação.
 */
export async function saveMemoryRecordIfBetter(
  player: PlayerName,
  newScore: number,
  newTime: number,
  difficulty: MemoryDifficulty,
  combo: number
): Promise<boolean> {
  try {
    await waitForAuth();
    const ref = doc(db, 'game_records', `memory_${player}`);
    const snap = await getDoc(ref);

    let updated = false;
    const dataToSave: Record<string, unknown> = {
      game: 'memory',
      player,
      updatedAt: serverTimestamp(),
    };

    if (snap.exists()) {
      const data = snap.data();
      const currentScore = data.score ?? 0;
      const currentTime  = data.bestTime ?? 99999;
      const currentCombo = data.bestCombo ?? 0;
      const currentLevel = (data[difficulty] as MemoryLevelRecord | undefined) ?? null;

      if (newScore > currentScore || (newScore === currentScore && newTime < currentTime)) {
        dataToSave.score = newScore;
        dataToSave.bestTime = newTime;
        dataToSave.bestScoreLevel = difficulty;
        updated = true;
      }
      if (combo > currentCombo) {
        dataToSave.bestCombo = combo;
        updated = true;
      }

      const levelUpdate = nextMemoryLevelRecord(currentLevel, newScore, newTime);
      if (
        !currentLevel ||
        levelUpdate.score !== currentLevel.score ||
        levelUpdate.bestTime !== currentLevel.bestTime
      ) {
        dataToSave[difficulty] = levelUpdate;
        updated = true;
      }

      dataToSave.gamesPlayed = (data.gamesPlayed ?? 0) + 1;
      updated = true;
    } else {
      dataToSave.score          = newScore;
      dataToSave.bestTime       = newTime;
      dataToSave.bestScoreLevel = difficulty;
      dataToSave.bestCombo      = combo;
      dataToSave.gamesPlayed    = 1;
      dataToSave[difficulty]    = { score: newScore, bestTime: newTime } satisfies MemoryLevelRecord;
      updated = true;
    }

    if (updated) {
      await setDoc(ref, dataToSave, { merge: true });
      return true;
    }
    return false;
  } catch (e) {
    console.error('Erro ao salvar recorde do jogo da memória:', e);
    return false;
  }
}

/**
 * Reads memory game records for both players.
 */
export async function getMemoryRanking(): Promise<RankingResult<MemoryRecord>> {
  const { p1Id, p2Id } = getConfigPlayerIds();
  const [p1, p2] = await Promise.all([
    getMemoryRecord(p1Id),
    getMemoryRecord(p2Id),
  ]);
  return { p1, p2 };
}

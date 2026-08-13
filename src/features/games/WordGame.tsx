import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { cn } from '../../shared/utils/cn';
import { Heart, HeartCrack, Play, MessageCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'active';

interface WordData { palavra: string; mensagem: string; }
interface Question { id: string; pergunta: string; palavras: WordData[]; }
interface LetterCell { letter: string; state: LetterState; }

interface GameStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

const CELL_STYLES: Record<LetterState, string> = {
  correct: 'bg-emerald-500 border-emerald-500 text-white',
  present: 'bg-amber-500 border-amber-500 text-white',
  absent:  'bg-slate-700 border-slate-700 text-slate-300',
  empty:   'bg-transparent border-slate-600 text-white',
  active:  'bg-transparent border-rose-400/80 text-white scale-110 shadow-[0_0_10px_rgba(244,63,94,0.4)]',
};

const KEY_STYLES: Record<string, string> = {
  correct: 'bg-emerald-500 text-white',
  present: 'bg-amber-500 text-white',
  absent:  'bg-slate-800 text-slate-500',
  default: 'bg-slate-700 text-white hover:bg-slate-600 active:scale-95',
};

function normalizeWord(w: string): string {
  return w.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
}

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(answer.length).fill('absent');
  const answerArr = answer.split('');
  const guessArr = guess.split('');
  guessArr.forEach((l, i) => { if (l === answerArr[i]) { result[i] = 'correct'; answerArr[i] = '*'; } });
  guessArr.forEach((l, i) => {
    if (result[i] === 'correct') return;
    const idx = answerArr.indexOf(l);
    if (idx !== -1) { result[i] = 'present'; answerArr[idx] = '*'; }
  });
  return result;
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function loadStats(): GameStats {
  try { return JSON.parse(localStorage.getItem('wg_stats_v2') || 'null') ?? { gamesPlayed: 0, wins: 0, currentStreak: 0, bestStreak: 0 }; }
  catch { return { gamesPlayed: 0, wins: 0, currentStreak: 0, bestStreak: 0 }; }
}
function saveStats(s: GameStats) { localStorage.setItem('wg_stats_v2', JSON.stringify(s)); }
function loadUsedWords(): string[] { try { return JSON.parse(localStorage.getItem('wg_used_words') || '[]'); } catch { return []; } }
function saveUsedWords(u: string[]) { localStorage.setItem('wg_used_words', JSON.stringify(u)); }

// ─── Default questions (fallback) ────────────────────────────────────────────
const DEFAULT_QUESTIONS: Question[] = [
  { id: 'q1', pergunta: 'O que mais gosto em você?', palavras: [{ palavra: 'SORRISO', mensagem: '✨ É isso que eu mais amo em você!' }, { palavra: 'OLHOS', mensagem: '👀 Seus olhos me encantam!' }] },
  { id: 'q2', pergunta: 'O que sinto quando estou com você?', palavras: [{ palavra: 'FELIZ', mensagem: '😊 Você me faz tão feliz!' }, { palavra: 'COMPLETO', mensagem: '🧩 Você me completa!' }] },
  { id: 'q3', pergunta: 'O que você é para mim?', palavras: [{ palavra: 'TUDO', mensagem: '❤️ Você é tudo que eu sempre quis!' }, { palavra: 'AMOR', mensagem: '💖 Você é meu grande amor!' }] },
  { id: 'q4', pergunta: 'O que quero construir com você?', palavras: [{ palavra: 'FUTURO', mensagem: '🏡 Quero todos os meus dias ao seu lado!' }, { palavra: 'SONHOS', mensagem: '💭 Nossos sonhos juntos!' }] },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export function WordGame() {
  // Questions / game data
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const usedWords = useRef<string[]>(loadUsedWords());
  const [_dictLoaded, setDictLoaded] = useState(false);

  // Active round state
  const [currentWord, setCurrentWord] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [wordLength, setWordLength] = useState(5);

  // Grid state
  const [guesses, setGuesses] = useState<LetterCell[][]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState('');
  const [revealingRow, setRevealingRow] = useState(-1);

  // Stats & Streak
  const [stats, setStats] = useState<GameStats>(loadStats);

  // ── Load Dictionary ────────────────────────────────────────────────────────
  useEffect(() => {
    if ((window as any).VALID_PT_WORDS_STR) {
      setDictLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = '/assets/data/pt-5-letters.js';
    script.onload = () => setDictLoaded(true);
    script.onerror = () => setDictLoaded(true); // fallback ok
    document.head.appendChild(script);
  }, []);

  const isValidWord = useCallback((guess: string) => {
    const str = (window as any).VALID_PT_WORDS_STR;
    if (!str || str.length === 0) return true; // fallback if failed to load
    let left = 0;
    let right = (str.length / 5) - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const w = str.substring(mid * 5, mid * 5 + 5);
      if (w === guess) return true;
      if (w < guess) left = mid + 1;
      else right = mid - 1;
    }
    return false;
  }, []);

  // ── Load Firebase questions ────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'word_game'), orderBy('createdAt', 'asc')));
        if (snap.empty) return;
        const loaded: Question[] = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.pergunta && data.palavras && Array.isArray(data.palavras)) {
            // Filter strictly for 5 letter words
            const valid = data.palavras.filter((p: any) => 
              p.palavra && p.mensagem && normalizeWord(p.palavra).length === 5
            );
            if (valid.length > 0) loaded.push({ id: d.id, pergunta: data.pergunta, palavras: valid });
          } else if (data.palavra && data.pergunta && data.mensagem && normalizeWord(data.palavra).length === 5) {
            loaded.push({ id: d.id, pergunta: data.pergunta, palavras: [{ palavra: data.palavra, mensagem: data.mensagem }] });
          }
        });
        if (loaded.length > 0) setQuestions(loaded);
      } catch (e) { console.warn('Using default questions', e); }
    };
    fetchQuestions();
  }, []);

  // ── Start a round ──────────────────────────────────────────────────────────
  const startNewRound = useCallback((qs: Question[], used: string[]) => {
    // Build available pool
    let pool: { question: Question; wordData: WordData; id: string }[] = [];
    qs.forEach(q => q.palavras.forEach(p => {
      const w = normalizeWord(p.palavra);
      if (w.length === 5) { // double check length 5 constraint
        const id = `${q.id}:${w}`;
        if (!used.includes(id)) pool.push({ question: q, wordData: p, id });
      }
    }));

    // Reset used if all played
    if (pool.length === 0) {
      used = [];
      saveUsedWords([]);
      usedWords.current = [];
      qs.forEach(q => q.palavras.forEach(p => {
        const w = normalizeWord(p.palavra);
        if (w.length === 5) pool.push({ question: q, wordData: p, id: `${q.id}:${w}` });
      }));
    }

    if (pool.length === 0) return;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    used.push(pick.id);
    usedWords.current = used;
    saveUsedWords(used);

    const word = normalizeWord(pick.wordData.palavra);
    setCurrentWord(word);
    setCurrentQuestion(pick.question.pergunta);
    setCurrentMessage(pick.wordData.mensagem);
    setWordLength(word.length);
    setGuesses([]);
    setCurrentInput('');
    setGameOver(false);
    setWon(false);
    setRevealingRow(-1);
    setToast('');
  }, []);

  // Start first round when questions load
  useEffect(() => {
    if (questions.length > 0 && currentWord === '') {
      startNewRound(questions, usedWords.current);
    }
  }, [questions, currentWord, startNewRound]);

  // ── Keyboard handler ───────────────────────────────────────────────────────
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const handleKey = useCallback((key: string) => {
    if (gameOver || revealingRow >= 0) return;

    if (key === '⌫' || key === 'BACKSPACE') {
      setCurrentInput(p => p.slice(0, -1));
      return;
    }

    if (key === 'ENTER') {
      if (currentInput.length < wordLength) { 
        showToast('Palavra muito curta!'); 
        setShake(true); 
        setTimeout(() => setShake(false), 500); 
        return; 
      }
      
      // Dictionary validation
      if (wordLength === 5 && !isValidWord(currentInput)) {
        showToast('Palavra inválida');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      const states = evaluateGuess(currentInput, currentWord);
      const newRow: LetterCell[] = currentInput.split('').map((letter, i) => ({ letter, state: states[i] }));
      const newGuesses = [...guesses, newRow];
      setGuesses(newGuesses);
      setCurrentInput('');

      const rowIdx = newGuesses.length - 1;
      setRevealingRow(rowIdx);
      setTimeout(() => setRevealingRow(-1), wordLength * 200 + 100);

      if (currentInput === currentWord) {
        // WIN
        const newStats: GameStats = {
          gamesPlayed: stats.gamesPlayed + 1,
          wins: stats.wins + 1,
          currentStreak: stats.currentStreak + 1,
          bestStreak: Math.max(stats.bestStreak, stats.currentStreak + 1),
        };
        setStats(newStats);
        saveStats(newStats);
        setTimeout(() => {
          setWon(true);
          setGameOver(true);
        }, wordLength * 200 + 400);
      } else if (newGuesses.length >= 6) {
        // LOSE
        const newStats: GameStats = { ...stats, gamesPlayed: stats.gamesPlayed + 1, currentStreak: 0 };
        setStats(newStats);
        saveStats(newStats);
        setTimeout(() => {
          setWon(false);
          setGameOver(true);
        }, wordLength * 200 + 400);
      }
      return;
    }

    if (/^[A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ]$/.test(key) && currentInput.length < wordLength) {
      setCurrentInput(p => p + key);
    }
  }, [gameOver, revealingRow, currentInput, wordLength, guesses, currentWord, stats, isValidWord]);

  // Physical keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        e.preventDefault();
        handleKey(key);
      } else if (key === 'BACKSPACE') {
        handleKey(key);
      } else if (/^[A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ]$/.test(key)) {
        handleKey(key);
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [handleKey]);

  // Share logic
  const shareOnWhatsApp = () => {
    const siteUrl = window.location.href.split('#')[0].split('?')[0];
    const grid = guesses.map(row => 
      row.map(c => c.state === 'correct' ? '🟩' : c.state === 'present' ? '🟨' : '⬛').join('')
    ).join('\n');
    const msg = `🎮 Jogo de Palavras\n\n"❤️ Acertei em ${guesses.length} tentativa${guesses.length > 1 ? 's' : ''}!"\n\n${grid}\n\nJogue também acessando:\n🔗 ${siteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ── Build keyboard state ───────────────────────────────────────────────────
  const keyStates: Record<string, string> = {};
  guesses.forEach(row => row.forEach(cell => {
    const prev = keyStates[cell.letter];
    if (prev === 'correct') return;
    if (cell.state === 'correct' || prev !== 'correct') keyStates[cell.letter] = cell.state;
  }));

  // ── Build grid ─────────────────────────────────────────────────────────────
  const MAX_ATTEMPTS = 6;
  const rows: { cells: LetterCell[]; isActive: boolean }[] = [];
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (i < guesses.length) {
      rows.push({ cells: guesses[i], isActive: false });
    } else if (i === guesses.length && !gameOver) {
      const cells: LetterCell[] = Array(wordLength).fill(null).map((_, j) => ({
        letter: currentInput[j] || '',
        state: currentInput[j] ? 'active' : 'empty',
      }));
      rows.push({ cells, isActive: true });
    } else {
      rows.push({ cells: Array(wordLength).fill({ letter: '', state: 'empty' as LetterState }), isActive: false });
    }
  }

  if (!currentWord) return <div className="flex-1 flex items-center justify-center"><span className="text-white/40 text-sm">Carregando...</span></div>;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-3 h-full px-2 relative">
      {/* Streak badge */}
      <div className="flex items-center gap-4 w-full justify-between mt-2 z-10">
        <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
          <span className="text-lg">🔥</span>
          <span className="text-white font-bold text-sm">{stats.currentStreak}</span>
          <span className="text-white/40 text-xs">streak</span>
        </div>
        <div className="flex items-center gap-3 text-white/40 text-xs">
          <span>🏆 recorde: {stats.bestStreak}</span>
          <span>🎮 jogados: {stats.gamesPlayed}</span>
        </div>
      </div>

      {/* Question */}
      <div className="w-full text-center px-2 z-10">
        <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Pergunta</p>
        <p className="text-white font-bold text-base leading-snug">{currentQuestion}</p>
      </div>

      {/* Toast */}
      <div className={cn('text-center px-4 py-1.5 rounded-full font-bold text-sm transition-all duration-300 min-h-[28px] z-20 absolute top-28',
        toast ? 'bg-white/10 text-white' : 'opacity-0 pointer-events-none')}>
        {toast || ' '}
      </div>

      {/* Board */}
      <div className="flex flex-col gap-1 items-center z-10 relative">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={cn('flex gap-1', shake && ri === guesses.length && 'animate-[shake_0.5s_ease]')}
          >
            {row.cells.map((cell, ci) => {
              const isRevealing = ri === revealingRow;
              return (
                <div key={ci} className="relative perspective-1000" style={{ width: wordLength > 6 ? '36px' : '44px', height: wordLength > 6 ? '36px' : '44px' }}>
                  <div 
                    className={cn(
                      'absolute inset-0 border-2 flex items-center justify-center font-extrabold uppercase rounded transition-all duration-300 transform-style-3d',
                      isRevealing ? 'animate-[flip_0.6s_ease-in-out_forwards]' : '',
                      CELL_STYLES[cell.state]
                    )}
                    style={{
                      fontSize: wordLength > 6 ? '14px' : '18px',
                      animationDelay: isRevealing ? `${ci * 200}ms` : '0ms',
                    }}
                  >
                    {cell.letter}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Keyboard */}
      <div className="flex flex-col gap-1 items-center mt-auto pb-2 w-full z-10 relative">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-0.5">
            {row.map(key => {
              const state = keyStates[key];
              return (
                <button
                  key={key}
                  onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
                  onClick={e => { e.stopPropagation(); handleKey(key === '⌫' ? 'BACKSPACE' : key); }}
                  className={cn(
                    'h-11 rounded font-bold text-xs uppercase transition-all duration-200 select-none relative',
                    key === 'ENTER' || key === '⌫' ? 'px-1.5 min-w-[48px] text-[10px]' : 'w-8',
                    KEY_STYLES[state || 'default']
                  )}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b]/90 backdrop-blur-md px-6 animate-in fade-in duration-500 rounded-lg">
          <div className="flex flex-col items-center text-center max-w-sm w-full">
            {won ? (
              <>
                <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(243,24,96,0.6)] animate-[pulse_2s_infinite]">
                  <Heart className="w-10 h-10 text-white fill-current" />
                </div>
                <h2 className="text-3xl font-black text-white italic mb-2">Parabéns! 🎉</h2>
                <p className="text-white/80 font-bold mb-6">A palavra era: {currentWord}</p>
                <p className="text-rose-400 font-bold text-base mb-8 italic text-balance">🎀 {currentMessage}</p>
                
                <div className="flex w-full gap-3">
                  <button onClick={() => startNewRound(questions, usedWords.current)} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(243,24,96,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                    <Play className="w-4 h-4 fill-current" /> Próxima
                  </button>
                  <button onClick={shareOnWhatsApp} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                    <MessageCircle className="w-4 h-4" /> Compartilhar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(243,24,96,0.6)]">
                  <HeartCrack className="w-10 h-10 text-white fill-current" />
                </div>
                <h2 className="text-3xl font-black text-white italic mb-2">Quase lá! 💔</h2>
                <p className="text-white/80 font-bold mb-6">A palavra era: <span className="text-rose-400 uppercase">{currentWord}</span></p>
                <p className="text-white/60 text-sm mb-8 italic">Tente novamente com outra palavra!</p>
                
                <button onClick={() => startNewRound(questions, usedWords.current)} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(243,24,96,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                  <Play className="w-4 h-4 fill-current" /> Próxima Palavra
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 10%,50%,90%{transform:translateX(-5px)} 30%,70%{transform:translateX(5px)} }
        
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        
        @keyframes flip { 
          0% { transform: rotateX(0); } 
          49.9% { transform: rotateX(-90deg); } 
          50% { transform: rotateX(-90deg); } 
          100% { transform: rotateX(0); } 
        }
      `}</style>
    </div>
  );
}

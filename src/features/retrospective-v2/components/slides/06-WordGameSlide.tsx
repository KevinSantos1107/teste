import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../../../shared/utils/cn';
import { Heart, HeartCrack, Play } from 'lucide-react';
import { useRetroV2Store } from '../../store/useRetroV2Store';

const MAX_GUESSES = 6;

type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'active';

interface LetterCell {
  letter: string;
  state: LetterState;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const WORD_LENGTH = answer.length;
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent');
  const answerLetters = answer.split('');
  const guessLetters = guess.split('');

  guessLetters.forEach((letter, i) => {
    if (letter === answerLetters[i]) {
      result[i] = 'correct';
      answerLetters[i] = '*';
    }
  });

  guessLetters.forEach((letter, i) => {
    if (result[i] === 'correct') return;
    const foundIdx = answerLetters.indexOf(letter);
    if (foundIdx !== -1) {
      result[i] = 'present';
      answerLetters[foundIdx] = '*';
    }
  });

  return result;
}

const CELL_STYLES: Record<LetterState, string> = {
  correct: 'bg-emerald-500 border-emerald-500 text-white',
  present: 'bg-amber-500 border-amber-500 text-white',
  absent: 'bg-slate-700 border-slate-700 text-slate-300',
  empty: 'bg-transparent border-slate-600 text-white',
  active:
    'bg-transparent border-rose-400/80 text-white scale-110 shadow-[0_0_10px_rgba(244,63,94,0.4)]',
};

const KEY_STYLES: Record<string, string> = {
  correct: 'bg-emerald-500 text-white',
  present: 'bg-amber-500 text-white',
  absent: 'bg-slate-800 text-slate-500',
  default: 'bg-slate-700 text-white hover:bg-slate-600 active:scale-95',
};

interface WordGameSlideProps {
  onNext: () => void;
}

export function WordGameSlide({ onNext }: WordGameSlideProps) {
  const { config } = useRetroV2Store();
  const WORD = (config.wordGameAnswer || 'INCRIVEL')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
  const WORD_LENGTH = WORD.length;

  const [guesses, setGuesses] = useState<LetterCell[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const [revealingRow, setRevealingRow] = useState(-1);

  const keyStates: Record<string, LetterState> = {};
  guesses.forEach((row) => {
    row.forEach((cell) => {
      const prev = keyStates[cell.letter];
      if (prev === 'correct') return;
      if (prev === 'present' && cell.state !== 'correct') return;
      keyStates[cell.letter] = cell.state;
    });
  });

  const showMessage = (msg: string, duration = 2200) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver) return;
      if (revealingRow >= 0) return; // Wait for reveal animation

      if (key === 'BACKSPACE' || key === '⌫') {
        setCurrentGuess((g) => g.slice(0, -1));
        return;
      }

      if (key === 'ENTER') {
        if (currentGuess.length < WORD_LENGTH) {
          showMessage(`${WORD_LENGTH} letras!`, 500);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }

        // No dictionary validation in retrospective

        const states = evaluateGuess(currentGuess, WORD);
        const newRow: LetterCell[] = currentGuess.split('').map((letter, i) => ({
          letter,
          state: states[i],
        }));

        const newGuesses = [...guesses, newRow];
        setRevealingRow(newGuesses.length - 1);
        setTimeout(() => setRevealingRow(-1), WORD_LENGTH * 200 + 100);

        setGuesses(newGuesses);
        setCurrentGuess('');

        if (currentGuess === WORD) {
          setTimeout(
            () => {
              setWon(true);
              setGameOver(true);
            },
            WORD_LENGTH * 200 + 400
          );
        } else if (newGuesses.length >= MAX_GUESSES) {
          setTimeout(
            () => {
              setWon(false);
              setGameOver(true);
            },
            WORD_LENGTH * 200 + 400
          );
        }
        return;
      }

      if (/^[A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((g) => g + key);
      }
    },
    [gameOver, currentGuess, guesses, revealingRow]
  );

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKey]);

  // Build grid
  const rows: { cells: LetterCell[]; isActive: boolean }[] = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      rows.push({ cells: guesses[i], isActive: false });
    } else if (i === guesses.length && !gameOver) {
      const cells: LetterCell[] = Array(WORD_LENGTH)
        .fill(null)
        .map((_, j) => ({
          letter: currentGuess[j] || '',
          state: currentGuess[j] ? 'active' : 'empty',
        }));
      rows.push({ cells, isActive: true });
    } else {
      rows.push({
        cells: Array(WORD_LENGTH).fill({ letter: '', state: 'empty' as LetterState }),
        isActive: false,
      });
    }
  }

  // To restart when losing
  const restart = () => {
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
  };

  return (
    <div
      className="flex-1 bg-[#09090b] flex flex-col items-center relative overflow-hidden h-full"
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/30 via-transparent to-transparent pointer-events-none" />

      <div className="z-10 w-full flex flex-col items-center px-2 pt-16 pb-4 gap-3 max-h-full h-full relative">
        {/* Header */}
        <div className="text-center w-full px-2 z-10">
          <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">
            Capítulo 5 · Jogo
          </p>
          <h2 className="text-white text-base font-bold uppercase tracking-tight leading-snug">
            O que eu acho de você?
          </h2>
        </div>

        {/* Toast */}
        <div
          className={cn(
            'text-center px-4 py-1.5 rounded-full font-bold text-sm transition-all duration-300 min-h-[28px] z-20 absolute top-28',
            message ? 'bg-white/10 text-white opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {message || ' '}
        </div>

        {/* Board */}
        <div className="flex flex-col gap-1 items-center w-full z-10 relative">
          {rows.map((row, ri) => (
            <div
              key={ri}
              className={cn(
                'flex gap-1',
                shake && ri === guesses.length && 'animate-[shake_0.5s_ease]'
              )}
            >
              {row.cells.map((cell, ci) => {
                const isRevealing = ri === revealingRow;
                return (
                  <div
                    key={ci}
                    className="relative perspective-1000"
                    style={{
                      width: WORD_LENGTH > 6 ? '36px' : '44px',
                      height: WORD_LENGTH > 6 ? '36px' : '44px',
                    }}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 border-2 flex items-center justify-center font-extrabold uppercase rounded transition-all duration-300 transform-style-3d',
                        isRevealing ? 'animate-[flip_0.6s_ease-in-out_forwards]' : '',
                        CELL_STYLES[cell.state]
                      )}
                      style={{
                        fontSize: WORD_LENGTH > 6 ? '14px' : '18px',
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
        <div className="flex flex-col gap-1 items-center w-full mt-auto pb-2 z-10 relative">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-0.5">
              {row.map((key) => {
                const state = keyStates[key];
                return (
                  <button
                    key={key}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKey(key === '⌫' ? '⌫' : key === 'ENTER' ? 'ENTER' : key);
                    }}
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
                  <p className="text-white/80 font-bold mb-6">A palavra era: {WORD}</p>
                  <p className="text-rose-400 font-bold text-base mb-8 italic text-balance">
                    🎀 Sim, você acertou!
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNext();
                    }}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(243,24,96,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                  >
                    <Play className="w-4 h-4 fill-current" /> Próximo Slide
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(243,24,96,0.6)]">
                    <HeartCrack className="w-10 h-10 text-white fill-current" />
                  </div>
                  <h2 className="text-3xl font-black text-white italic mb-2">Quase lá! 💔</h2>
                  <p className="text-white/80 font-bold mb-6">
                    A palavra era: <span className="text-rose-400 uppercase">{WORD}</span>
                  </p>
                  <p className="text-white/60 text-sm mb-8 italic">
                    Tente novamente para prosseguir!
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restart();
                    }}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(243,24,96,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                  >
                    <Play className="w-4 h-4 fill-current" /> Tentar Novamente
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

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

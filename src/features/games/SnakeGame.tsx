import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../../shared/ui/Button';
import { Card, CardContent } from '../../shared/ui/Card';
import { Trophy, Play, RotateCcw } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

type Point = { x: number, y: number };

export function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const directionRef = useRef(direction);

  const generateFood = useCallback(() => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood());
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
          if (y === 0) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (y === 0) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (x === 0) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (x === 0) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const moveSnake = () => {
      setSnake((prev) => {
        const head = prev[0];
        const newHead = {
          x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE,
        };

        // Check collision with self
        if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          if (score > highScore) setHighScore(score);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood());
          // Don't pop tail if food eaten
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, Math.max(50, INITIAL_SPEED - (score * 2)));
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, food, score, highScore, generateFood]);

  return (
    <Card className="w-full max-w-md mx-auto bg-theme-bg overflow-hidden border-theme-primary/30 shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-xs text-theme-text-secondary uppercase">Pontos</span>
            <span className="text-2xl font-bold text-theme-primary font-mono">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-theme-text-secondary uppercase flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Recorde
            </span>
            <span className="text-2xl font-bold text-theme-secondary font-mono">{highScore}</span>
          </div>
        </div>

        <div 
          className="relative bg-theme-card-bg border border-theme-card-border rounded-xl w-full aspect-square"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` 
          }}
        >
          {/* Render Snake */}
          {snake.map((segment, index) => (
            <div
              key={`${segment.x}-${segment.y}-${index}`}
              className="bg-theme-primary rounded-sm transition-all duration-75"
              style={{
                gridColumnStart: segment.x + 1,
                gridRowStart: segment.y + 1,
                opacity: index === 0 ? 1 : 0.8,
                transform: index === 0 ? 'scale(1.1)' : 'scale(0.9)'
              }}
            />
          ))}

          {/* Render Food */}
          <div
            className="bg-rose-500 rounded-full animate-pulse"
            style={{
              gridColumnStart: food.x + 1,
              gridRowStart: food.y + 1,
              transform: 'scale(0.8)'
            }}
          />

          {/* Overlay Game Over / Start */}
          {(!isPlaying || isGameOver) && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 p-4 text-center">
              {isGameOver ? (
                <>
                  <h3 className="text-white text-2xl font-bold mb-2">Fim de Jogo!</h3>
                  <p className="text-white/80 mb-6">Você fez {score} pontos.</p>
                  <Button variant="primary" onClick={resetGame} className="gap-2">
                    <RotateCcw className="w-4 h-4" /> Tentar Novamente
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-white text-xl font-bold mb-2">Cobrinha do Amor</h3>
                  <p className="text-white/80 text-sm mb-6 max-w-xs">
                    Use as setas do teclado para guiar a cobrinha e coletar os corações.
                  </p>
                  <Button variant="primary" onClick={resetGame} className="gap-2">
                    <Play className="w-4 h-4" /> Jogar
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Mobile Controls */}
        <div className="grid grid-cols-3 gap-2 mt-6 md:hidden">
          <div />
          <Button variant="secondary" onClick={() => directionRef.current = { x: 0, y: -1 }} disabled={!isPlaying}>↑</Button>
          <div />
          <Button variant="secondary" onClick={() => directionRef.current = { x: -1, y: 0 }} disabled={!isPlaying}>←</Button>
          <Button variant="secondary" onClick={() => directionRef.current = { x: 0, y: 1 }} disabled={!isPlaying}>↓</Button>
          <Button variant="secondary" onClick={() => directionRef.current = { x: 1, y: 0 }} disabled={!isPlaying}>→</Button>
        </div>
      </CardContent>
    </Card>
  );
}

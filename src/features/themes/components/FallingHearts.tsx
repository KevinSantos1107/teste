import React from 'react';
import { Heart } from 'lucide-react';

const HEART_COLORS = ['#ff0055', '#ff4d94', '#ffb3c6', '#ff2a7a', '#ffffff', 'var(--theme-primary)'];
const HEART_VARIANTS = ['solid', 'solid', 'outline', 'glass'] as const;

interface HeartDef {
  id: number;
  layer: 'front' | 'mid' | 'back';
  style: React.CSSProperties;
  variant: typeof HEART_VARIANTS[number];
  color: string;
}

function generateHeart(id: number, layer: 'front' | 'mid' | 'back'): HeartDef {
  const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
  const variant = HEART_VARIANTS[Math.floor(Math.random() * HEART_VARIANTS.length)];
  const scaleMap  = { front: Math.random() * 0.5 + 1.0,  mid: Math.random() * 0.4 + 0.5,  back: Math.random() * 0.3 + 0.25 };
  const speedMap  = { front: Math.random() * 8  + 18,    mid: Math.random() * 12 + 24,     back: Math.random() * 15 + 34   };
  const swayMap   = { front: (Math.random() - 0.5) * 180, mid: (Math.random() - 0.5) * 130, back: (Math.random() - 0.5) * 80 };

  return {
    id,
    layer,
    variant,
    color,
    style: {
      left: `${Math.random() * 100}%`,
      animationDuration: `${speedMap[layer]}s`,
      animationDelay: `-${Math.random() * speedMap[layer]}s`,
      '--sway-x': `${swayMap[layer]}px`,
      '--start-rot': `${(Math.random() - 0.5) * 90}deg`,
      '--base-scale': scaleMap[layer],
    } as React.CSSProperties,
  };
}

const HEARTS = [
  ...Array.from({ length: 5 }, (_, i) => generateHeart(i, 'front')),
  ...Array.from({ length: 14 }, (_, i) => generateHeart(i + 5, 'mid')),
  ...Array.from({ length: 9 }, (_, i) => generateHeart(i + 19, 'back')),
];

export function FallingHearts() {
  return (
    <div className="falling-hearts pointer-events-none">
      {HEARTS.map((h) => {
        const isPulsing = h.layer === 'mid' && Math.random() > 0.4;
        const layerClass = `heart-layer-${h.layer}`;
        return (
          <div key={h.id} className={`heart-container ${layerClass}`} style={h.style}>
            <div className={`heart-wrapper ${isPulsing ? 'heart-pulse' : ''}`}>
              {h.variant === 'glass' ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="url(#glass-grad)"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1.5"
                  className={h.layer === 'front' ? 'w-10 h-10' : h.layer === 'mid' ? 'w-7 h-7' : 'w-4 h-4'}
                >
                  <defs>
                    <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                    </linearGradient>
                  </defs>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              ) : (
                <Heart
                  className={h.layer === 'front' ? 'w-10 h-10' : h.layer === 'mid' ? 'w-7 h-7' : 'w-4 h-4'}
                  fill={h.variant === 'solid' ? h.color : 'none'}
                  color={h.color}
                  strokeWidth={h.variant === 'solid' ? 0 : 2}
                  style={h.variant === 'solid' ? { filter: `drop-shadow(0 0 8px ${h.color}80)` } : undefined}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

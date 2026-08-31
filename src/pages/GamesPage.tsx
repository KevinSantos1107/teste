import { useState } from 'react';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { SnakeGame } from '../features/games/SnakeGame';
import { WordGame } from '../features/games/WordGame';
import { cn } from '../shared/utils/cn';

type GameTab = 'snake' | 'words';

export default function GamesPage() {
  const { config } = useSiteConfigStore();
  const [activeTab, setActiveTab] = useState<GameTab>('words');

  if (!config) return null;

  const tabs = [
    { id: 'words' as GameTab, label: 'Palavra Secreta', icon: '🔤' },
    { id: 'snake' as GameTab, label: 'Cobrinha', icon: '🐍' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="text-center space-y-3 pt-2 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-theme-text">
          Sala de Jogos
        </h1>
        <p className="text-theme-text-secondary text-sm md:text-base max-w-md mx-auto leading-relaxed">
          Um passatempo divertido para nós. Quem fizer mais pontos paga o lanche! 🍕
        </p>

        {/* Tab selector */}
        <div className="flex justify-center gap-2.5 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300',
                activeTab === tab.id
                  ? 'text-white scale-105 shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.25)]'
                  : 'bg-theme-card-bg border border-[rgba(var(--theme-primary-rgb),0.2)] text-theme-text-secondary hover:border-[var(--theme-primary)] hover:text-white'
              )}
              style={
                activeTab === tab.id
                  ? {
                      background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                    }
                  : undefined
              }
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Game Container ─────────────────────────────────────────── */}
      <section className="pb-4">
        {activeTab === 'words' && (
          <div
            className={cn(
              'max-w-md mx-auto rounded-2xl overflow-hidden',
              // Desktop: card with border
              'md:bg-theme-card-bg md:border md:border-[rgba(var(--theme-primary-rgb),0.3)] md:shadow-[0_0_40px_rgba(0,0,0,0.3)]',
              // Mobile: minimal container, no border/bg — game fills screen
              'bg-transparent',
              // Height
              'min-h-[calc(100dvh-220px)] md:min-h-[600px]',
              'p-2 md:p-4'
            )}
          >
            <WordGame />
          </div>
        )}
        {activeTab === 'snake' && <SnakeGame />}
      </section>
    </div>
  );
}

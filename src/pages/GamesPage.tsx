import { useState } from 'react';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { SnakeGame } from '../features/games/SnakeGame';
import { WordGame } from '../features/games/WordGame';
import { Gamepad2 } from 'lucide-react';
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-theme-primary/10 rounded-full mb-2">
          <Gamepad2 className="w-10 h-10 text-theme-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-theme-text">Sala de Jogos</h1>
        <p className="text-theme-text-secondary text-lg max-w-xl mx-auto">
          Um passatempo divertido para nós. Quem fizer mais pontos paga o lanche! 🍕
        </p>

        {/* Tab selector */}
        <div className="flex justify-center gap-3 mt-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all",
                activeTab === tab.id
                  ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/20 scale-105'
                  : 'bg-theme-card-bg border border-theme-card-border text-theme-text hover:bg-theme-card-border'
              )}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="pb-8">
        {activeTab === 'words' && (
          <div className="max-w-md mx-auto bg-theme-card-bg border border-theme-card-border rounded-2xl p-6 shadow-xl">
            <WordGame />
          </div>
        )}
        {activeTab === 'snake' && (
          <SnakeGame />
        )}
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Crown, Heart } from 'lucide-react';
import {
  getRanking,
  getWordRanking,
  getQuizRanking,
} from '../../../services/gameRecords';
import type { WordRecord, QuizRecord } from '../../../services/gameRecords';

export type RankingGame = 'snake' | 'word' | 'quiz';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialGame?: RankingGame;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function PlayerColumn({
  name,
  avatar,
  isWinner,
  children,
}: {
  name: string;
  avatar: React.ReactNode;
  isWinner: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex-1 min-w-0 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 transition-all ${
        isWinner
          ? 'bg-white/10 border border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.15)]'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      <div className="relative">
        {avatar}
        {isWinner && (
          <Crown
            className="absolute -top-3 -right-3 w-4 h-4 sm:w-5 sm:h-5 text-yellow-400"
            fill="currentColor"
          />
        )}
      </div>
      <span className="text-xs sm:text-sm font-semibold text-white/80 tracking-wide">{name}</span>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="w-full text-center">
      <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-widest mb-0.5">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-1 w-full">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-white/30 text-[9px] sm:text-[10px] uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex gap-3">
      {[0, 1].map(i => (
        <div key={i} className="flex-1 h-24 sm:h-28 rounded-2xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

// ── Tab Content ───────────────────────────────────────────────────────────────

function SnakeTab() {
  const [data, setData] = useState<{ kevin: number | null; iara: number | null } | null>(null);

  useEffect(() => {
    getRanking('snake').then(setData);
  }, []);

  if (!data) return <LoadingRow />;

  const kevinScore = data.kevin ?? 0;
  const iaraScore = data.iara ?? 0;
  const kevinWins = kevinScore > iaraScore;
  const iaraWins = iaraScore > kevinScore;

  return (
    <div className="flex gap-2 sm:gap-3">
      <PlayerColumn
        name="Kevin"
        isWinner={kevinWins}
        avatar={<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl sm:text-2xl">👑</div>}
      >
        <StatRow label="Recorde" value={kevinScore} />
      </PlayerColumn>

      <div className="flex flex-col items-center justify-center gap-1 text-white/30 px-1">
        <span className="text-xs font-bold">VS</span>
      </div>

      <PlayerColumn
        name="Iara"
        isWinner={iaraWins}
        avatar={<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-xl sm:text-2xl">🌸</div>}
      >
        <StatRow label="Recorde" value={iaraScore} />
      </PlayerColumn>
    </div>
  );
}

function WordTab() {
  const [data, setData] = useState<{ kevin: WordRecord | null; iara: WordRecord | null } | null>(null);

  useEffect(() => {
    getWordRanking().then(setData);
  }, []);

  if (!data) return <LoadingRow />;

  const k = data.kevin;
  const i = data.iara;
  const kevinScore = k?.score ?? 0;
  const iaraScore = i?.score ?? 0;
  const kevinWins = kevinScore > iaraScore;
  const iaraWins = iaraScore > kevinScore;

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex gap-2 sm:gap-3">
        <PlayerColumn
          name="Kevin"
          isWinner={kevinWins}
          avatar={<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl sm:text-2xl">👑</div>}
        >
          <StatRow label="Pontuação" value={kevinScore} />
          <Divider label="detalhes" />
          <StatRow label="Vitórias" value={k?.wins ?? 0} />
          <StatRow label="Sequência" value={`🔥 ${k?.streak ?? 0}`} />
          <StatRow label="Melhor Seq." value={k?.bestStreak ?? 0} />
        </PlayerColumn>

        <div className="flex flex-col items-center justify-center gap-1 text-white/30 px-1">
          <span className="text-xs font-bold">VS</span>
        </div>

        <PlayerColumn
          name="Iara"
          isWinner={iaraWins}
          avatar={<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-xl sm:text-2xl">🌸</div>}
        >
          <StatRow label="Pontuação" value={iaraScore} />
          <Divider label="detalhes" />
          <StatRow label="Vitórias" value={i?.wins ?? 0} />
          <StatRow label="Sequência" value={`🔥 ${i?.streak ?? 0}`} />
          <StatRow label="Melhor Seq." value={i?.bestStreak ?? 0} />
        </PlayerColumn>
      </div>

      {/* Distribuição de tentativas */}
      {(k?.winsByAttempt || i?.winsByAttempt) && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4">
          <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-widest text-center mb-2 sm:mb-3">Distribuição de Vitórias</p>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n, idx) => {
              const kv = k?.winsByAttempt?.[idx] ?? 0;
              const iv = i?.winsByAttempt?.[idx] ?? 0;
              const maxVal = Math.max(kv, iv, 1);
              return (
                <div key={n} className="flex items-center gap-1.5 sm:gap-2 text-xs">
                  <span className="text-white/40 w-3 sm:w-4 text-right shrink-0">{n}</span>
                  {/* Kevin bar (left) */}
                  <div className="flex-1 flex justify-end">
                    <div
                      className="h-3.5 sm:h-4 rounded bg-purple-500/60 transition-all duration-500 flex items-center justify-end pr-1"
                      style={{ width: `${(kv / maxVal) * 100}%`, minWidth: kv > 0 ? '1.25rem' : '0' }}
                    >
                      {kv > 0 && <span className="text-white text-[9px] font-bold">{kv}</span>}
                    </div>
                  </div>
                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/20 flex-shrink-0" />
                  {/* Iara bar (right) */}
                  <div className="flex-1">
                    <div
                      className="h-3.5 sm:h-4 rounded bg-pink-500/60 transition-all duration-500 flex items-center pl-1"
                      style={{ width: `${(iv / maxVal) * 100}%`, minWidth: iv > 0 ? '1.25rem' : '0' }}
                    >
                      {iv > 0 && <span className="text-white text-[9px] font-bold">{iv}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[9px] sm:text-[10px]">
            <span className="text-purple-400">■ Kevin</span>
            <span className="text-pink-400">■ Iara</span>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizTab() {
  const [data, setData] = useState<{ kevin: QuizRecord | null; iara: QuizRecord | null } | null>(null);

  useEffect(() => {
    getQuizRanking().then(setData);
  }, []);

  if (!data) return <LoadingRow />;

  const k = data.kevin;
  const i = data.iara;
  const kevinScore = k?.score ?? 0;
  const iaraScore = i?.score ?? 0;
  const kevinWins = kevinScore > iaraScore;
  const iaraWins = iaraScore > kevinScore;

  return (
    <div className="flex gap-2 sm:gap-3">
      <PlayerColumn
        name="Kevin"
        isWinner={kevinWins}
        avatar={<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl sm:text-2xl">👑</div>}
      >
        <StatRow label="Recorde" value={kevinScore} />
        <Divider label="combo" />
        <StatRow label="Maior Combo" value={`x${k?.highestCombo ?? 0}`} />
      </PlayerColumn>

      <div className="flex flex-col items-center justify-center gap-1 text-white/30 px-1">
        <span className="text-xs font-bold">VS</span>
      </div>

      <PlayerColumn
        name="Iara"
        isWinner={iaraWins}
        avatar={<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-xl sm:text-2xl">🌸</div>}
      >
        <StatRow label="Recorde" value={iaraScore} />
        <Divider label="combo" />
        <StatRow label="Maior Combo" value={`x${i?.highestCombo ?? 0}`} />
      </PlayerColumn>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

const TABS: { id: RankingGame; label: string; emoji: string }[] = [
  { id: 'snake', label: 'Cobrinha', emoji: '🐍' },
  { id: 'word',  label: 'Palavra',  emoji: '📝' },
  { id: 'quiz',  label: 'Quiz',     emoji: '🎯' },
];

export function RankingModal({ isOpen, onClose, initialGame = 'snake' }: Props) {
  const [activeTab, setActiveTab] = useState<RankingGame>(initialGame);

  useEffect(() => {
    if (isOpen) setActiveTab(initialGame);
  }, [isOpen, initialGame]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — drawer on mobile, centered card on sm+ */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 w-full sm:max-w-md bg-[#0d0d1a] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(92dvh)' }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-3 sm:pt-5 pb-2 sm:pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Ranking do Casal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tabs — always show label, not hidden on mobile */}
        <div className="flex gap-1 px-4 sm:px-5 pb-2 sm:pb-3 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 sm:px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content — scrollable */}
        <div className="px-4 sm:px-5 pb-5 sm:pb-6 overflow-y-auto overscroll-contain flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'snake' && <SnakeTab />}
              {activeTab === 'word'  && <WordTab />}
              {activeTab === 'quiz'  && <QuizTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

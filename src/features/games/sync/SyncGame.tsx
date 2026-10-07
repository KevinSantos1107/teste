import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useSyncRoom } from './useSyncRoom';
import { Lobby } from './components/Lobby';
import { ChooseCard } from './components/ChooseCard';
import { WordInput } from './components/WordInput';
import { Reveal } from './components/Reveal';
import { SessionResult } from './components/SessionResult';
import { getSyncRecord, saveSyncRecordIfBetter } from '../../../services/gameRecords';

export function SyncGame({ onClose }: { onClose: () => void }) {
  const {
    room,
    loading,
    error,
    actionError,
    isOffline,
    isPlayer,
    player,
    partnerId,
    partnerName,
    playerName,
    p1Id,
    p2Id,
    isPartnerOnline,
    startNewSession,
    startNewSessionTurbo,
    chooseCategory,
    skipCategory,
    lockWord,
    proposeSynonym,
    acceptSynonym,
    rejectSynonym,
    nextRound,
    triggerTurboOut,
    saveRecordFlag,
    proposeEndGame,
    acceptEndGame,
    rejectEndGame,
    playAgain,
  } = useSyncRoom();

  const [previousBest, setPreviousBest] = useState<number | null>(null);

  // Load previous best on mount
  useEffect(() => {
    getSyncRecord().then((rec) => {
      if (rec) setPreviousBest(rec.bestSession);
    });
  }, []);

  // Save record when session done
  useEffect(() => {
    if (!room || room.status !== 'sessionDone' || room.recordSaved) return;

    const total = room.results.reduce((sum, r) => sum + r.rounds, 0);
    const bestPart = Math.min(...room.results.map((r) => r.rounds));

    // Count consecutive parts with <= 2 rounds
    let maxStreak = 0;
    let currentStreak = 0;
    for (const r of room.results) {
      if (r.rounds <= 2) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    saveRecordFlag().then((shouldSave) => {
      if (shouldSave) {
        saveSyncRecordIfBetter(total, bestPart, maxStreak).then(() => {
          setPreviousBest((prev) =>
            prev === null ? total : Math.min(prev, total),
          );
        });
      }
    });
  }, [room, saveRecordFlag]);

  // End game timeout checker
  useEffect(() => {
    if (!room || !room.endGameProposal) return;
    const interval = setInterval(() => {
      if (Date.now() > room.endGameProposal!.expiresAt) {
        acceptEndGame();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.endGameProposal, acceptEndGame]);

  // Play again timeout checker
  useEffect(() => {
    if (!room || room.status !== 'sessionDone' || !room.playAgainDeadline) return;
    const interval = setInterval(() => {
      if (Date.now() > room.playAgainDeadline!) {
        acceptEndGame(); // acceptEndGame forces status back to lobby and clears states
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.status, room?.playAgainDeadline, acceptEndGame]);

  // ── Loading / error states ────────────────────────────────────────────────

  if (!isPlayer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-12">
        <p className="text-white/60 text-sm text-center">
          {error || 'Abra pelo seu link pessoal para jogar'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // ── Overlays and banners ──────────────────────────────────────────────────

  const offlineBanner = isOffline ? (
    <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-center">
      <span className="text-red-400 text-xs">Sem conexão — as ações estão desativadas</span>
    </div>
  ) : null;

  const errorBanner = actionError ? (
    <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-center">
      <span className="text-red-400 text-xs">{actionError}</span>
    </div>
  ) : null;

  const endGameOverlay = room?.endGameProposal ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center"
      >
        <LogOut className="w-8 h-8 text-white/50 mx-auto" />
        <h3 className="text-lg font-bold text-white">Finalizar jogo?</h3>
        {room.endGameProposal.by === player ? (
          <p className="text-white/60 text-sm">
            Aguardando {partnerName} confirmar...<br/>
            <span className="text-xs text-white/40 block mt-2">Encerra automaticamente em breve.</span>
          </p>
        ) : (
          <>
            <p className="text-white/60 text-sm">
              {partnerName} quer finalizar a partida. Você concorda?
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={rejectEndGame}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/70 bg-white/5 hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={acceptEndGame}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-red-500/20 hover:bg-red-500/30 text-red-400"
              >
                Finalizar
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  ) : null;

  const endGameButton = room && room.status !== 'lobby' && room.status !== 'sessionDone' && !room.endGameProposal ? (
    <button
      onClick={proposeEndGame}
      className="absolute top-4 right-14 p-2 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors z-40"
      title="Finalizar partida"
    >
      <LogOut className="w-5 h-5" />
    </button>
  ) : null;

  // ── No room: Lobby ────────────────────────────────────────────────────────

  if (!room || !room.status || room.status === 'lobby') {
    return (
      <div className="relative flex-1 flex flex-col h-full">
        {offlineBanner}
        {errorBanner}
        <Lobby
          playerName={playerName}
          partnerName={partnerName}
          isPartnerOnline={room ? isPartnerOnline(room) : false}
          onStart={startNewSession}
          onStartTurbo={startNewSessionTurbo}
        />
      </div>
    );
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  const renderView = () => {
    switch (room.status) {
      case 'choosing':
        return (
          <ChooseCard
            cards={room.cards || []}
            isHost={room.hostId === player}
            hostName={room.hostId === player ? playerName : partnerName}
            canSkip={(room.skipsLeft?.[player] ?? 0) > 0}
            categoryIndex={room.categoryIndex}
            onChoose={chooseCategory}
            onSkip={skipCategory}
          />
        );
      case 'playing':
        return (
          <WordInput
            category={room.category || ''}
            roundNumber={room.roundNumber}
            isLocked={room.locked?.[player] ?? false}
            partnerLocked={room.locked?.[partnerId] ?? false}
            partnerName={partnerName}
            history={room.history || []}
            deadline={room.deadline}
            onLock={lockWord}
            onTurboOut={triggerTurboOut}
          />
        );
      case 'revealed':
        return (
          <Reveal
            words={room.words || {}}
            p1Id={p1Id}
            p2Id={p2Id}
            playerName={playerName}
            partnerName={partnerName}
            player={player}
            synced={room.lastRoundSynced}
            lastWord={room.lastWord}
            roundNumber={room.roundNumber}
            synonymProposal={room.synonymProposal}
            isReady={room.ready?.[player] ?? false}
            partnerReady={room.ready?.[partnerId] ?? false}
            onNext={nextRound}
            onProposeSynonym={proposeSynonym}
            onAcceptSynonym={acceptSynonym}
            onRejectSynonym={rejectSynonym}
          />
        );
      case 'sessionDone':
        return (
          <SessionResult
            results={room.results || []}
            previousBest={previousBest}
            onPlayAgain={playAgain}
            onClose={onClose}
            partnerName={partnerName}
            isReady={room.ready?.[player] ?? false}
            partnerReady={room.ready?.[partnerId] ?? false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {offlineBanner}
      {errorBanner}
      {endGameButton}
      <AnimatePresence>
        {endGameOverlay}
      </AnimatePresence>
      <div className="flex-1 overflow-y-auto">
        {renderView()}
      </div>
    </div>
  );
}


import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { MenuButton } from '../components/MenuButton';
import { HistoryDropdown } from '../components/HistoryDropdown';
import { ThemeModal } from '../components/ThemeModal';
import { GameConfigModal } from '../components/GameConfigModal';
import confetti from 'canvas-confetti';

export function GameScreen() {
  const { state, dispatch } = useApp();
  const { game } = state;

  const [showHistory, setShowHistory] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/stop timer
  useEffect(() => {
    if (timerRunning) {
      timerInterval.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [timerRunning]);

  const toggleTimer = () => setTimerRunning(p => !p);
  const resetTimer = () => {
    setTimerSeconds(0);
    setTimerRunning(false);
  };

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Touch positions for swipe detection
  const touchStartY = useRef<number | null>(null);
  const touchSide = useRef<'team1' | 'team2' | null>(null);

  // Auto-redirect when game ends
  useEffect(() => {
    if (!game.isActive && game.matchHistory.length > 0) {
      dispatch({ type: 'SET_SCREEN', payload: 'gameover' });
    }
  }, [game.isActive, game.matchHistory.length, dispatch]);

  const playing = game.playing;
  const team1 = playing ? game.allTeams.find(t => t.id === playing[0]) : null;
  const team2 = playing ? game.allTeams.find(t => t.id === playing[1]) : null;

  if (!team1 || !team2) return null;

  const queueTeams = game.queue
    .map(id => game.allTeams.find(t => t.id === id))
    .filter(Boolean);

  const getTeamWins = (teamId: number) => game.wins[teamId] || 0;

  // Swipe down detection
  const handleTouchStart = useCallback((e: React.TouchEvent, side: 'team1' | 'team2') => {
    if (!game.config.swipeToDecrease) return;
    touchStartY.current = e.touches[0].clientY;
    touchSide.current = side;
  }, [game.config.swipeToDecrease]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!game.config.swipeToDecrease || touchStartY.current === null || touchSide.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 50) {
      dispatch({ type: 'SCORE_POINT_SUBTRACT', payload: { side: touchSide.current } });
    }
    touchStartY.current = null;
    touchSide.current = null;
  }, [game.config.swipeToDecrease, dispatch]);

  const scoreSide = (side: 'team1' | 'team2') => {
    dispatch({ type: 'SCORE_POINT', payload: { side } });
  };

  const isDark = game.config.darkTheme;
  const isInverted = game.config.orientation === 'inverted';
  const leftTeam = isInverted ? team2 : team1;
  const rightTeam = isInverted ? team1 : team2;
  const leftScore = isInverted ? game.scores[1] : game.scores[0];
  const rightScore = isInverted ? game.scores[0] : game.scores[1];
  const leftSide = isInverted ? 'team2' : 'team1';
  const rightSide = isInverted ? 'team1' : 'team2';
  const leftWins = isInverted ? getTeamWins(team2.id) : getTeamWins(team1.id);
  const rightWins = isInverted ? getTeamWins(team1.id) : getTeamWins(team2.id);

  // Celebration on win
  useEffect(() => {
    if (leftScore >= game.config.pointsToWin || rightScore >= game.config.pointsToWin) {
      if (!celebrated) {
        setCelebrated(true);
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        new Audio("https://www.soundjay.com/misc/sounds/applause-1.mp3").play().catch(() => {});
      }
    } else {
      setCelebrated(false);
    }
  }, [leftScore, rightScore, game.config.pointsToWin, celebrated]);

  const handleConfigChange = useCallback((newConfig: typeof game.config) => {
    dispatch({ type: 'UPDATE_GAME_CONFIG', payload: newConfig });
  }, [dispatch]);

  const handleTeamChange = useCallback((updatedTeams: typeof game.allTeams) => {
    updatedTeams.forEach((t, idx) => {
      const original = game.allTeams[idx];
      if (original.name !== t.name || original.emoji !== t.emoji) {
        dispatch({ type: 'UPDATE_TEAM_INFO', payload: { teamId: t.id, name: t.name, emoji: t.emoji } });
      }
    });
  }, [game.allTeams, dispatch]);

  // Background color
  const bgStyle = isDark
    ? { background: 'linear-gradient(180deg, #1a237e 50%, #b71c1c 50%)' }
    : { background: 'linear-gradient(90deg, #2979D0 50%, #C0392B 50%)' };

  return (
    <div className={`h-dvh w-screen flex flex-col overflow-hidden select-none relative ${isDark ? '' : ''}`} style={bgStyle}>
      {/* ─── TOP BAR: Timer + Set counter ─── */}
      <div className="flex flex-col items-center pt-4 pb-1 relative z-10">
          {/* Timer capsule */}
          <div className="inline-flex items-center gap-0 bg-white/95 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-white/30">
            <button
              onClick={toggleTimer}
              className="text-gray-600 hover:text-gray-800 transition-colors w-8 h-8 flex items-center justify-center"
              title={timerRunning ? 'Pausar' : 'Iniciar'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                {timerRunning ? (
                  <>
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </>
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>

            <span className="text-2xl font-black tabular-nums text-gray-900 min-w-[100px] text-center tracking-[0.1em]">
              {formatTimer(timerSeconds)}
            </span>

            <button
              onClick={resetTimer}
              className="text-gray-500 hover:text-gray-700 transition-colors w-8 h-8 flex items-center justify-center"
              title="Reiniciar cronômetro"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>
          </div>

          {/* Set counter capsule — connected stem below timer */}
          {game.config.setsEnabled && (
            <div className="flex flex-col items-center -mt-px">
              <div className="w-0.5 h-1.5 bg-white/60" />
              <div className="bg-white/95 backdrop-blur rounded-full px-5 py-1.5 shadow-md border border-white/30 flex items-center gap-5">
                <span className="text-sm font-black tabular-nums text-[#2979D0]">{leftWins}</span>
                <span className="text-xs font-bold text-gray-400">×</span>
                <span className="text-sm font-black tabular-nums text-[#C0392B]">{rightWins}</span>
              </div>
            </div>
          )}
        </div>

      {/* ─── MAIN SPLIT AREA ─── */}
      <div className="flex-1 flex relative">
        {/* Left half (Blue) */}
        <div
          className="flex-1 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
          onClick={() => scoreSide(leftSide)}
          onTouchStart={e => handleTouchStart(e, leftSide)}
          onTouchEnd={handleTouchEnd}
        >
          {/* Mascot emoji */}
          <div className="absolute bottom-4 left-4 text-4xl opacity-60 select-none pointer-events-none drop-shadow-lg">
            {leftTeam.emoji}
          </div>

          {/* Sets indicators */}
          {game.config.setsEnabled && game.setScores1.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-0.5">
              {game.setScores1.map((s, i) => (
                <span key={i} className="text-white/40 text-[10px] font-bold tabular-nums bg-black/10 px-1 rounded">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Team name */}
          <div className="text-white/80 text-lg font-bold mb-1 flex items-center gap-2">
            <span>{leftTeam.name || `Time ${leftTeam.id}`}</span>
          </div>

          {/* Giant score */}
          <div className="text-white text-[140px] sm:text-[170px] font-black tabular-nums leading-none mb-2 drop-shadow-xl">
            {leftScore}
          </div>

          <div className="absolute top-3 left-3 text-white font-bold text-sm bg-black/20 px-2.5 py-0.5 rounded-full">
            🏆 {leftWins} vitórias
          </div>
        </div>

        {/* Vertical divider */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-white/30 z-[2]" />

        {/* Right half (Red) */}
        <div
          className="flex-1 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
          onClick={() => scoreSide(rightSide)}
          onTouchStart={e => handleTouchStart(e, rightSide)}
          onTouchEnd={handleTouchEnd}
        >
          {/* Mascot emoji */}
          <div className="absolute bottom-4 right-4 text-4xl opacity-60 select-none pointer-events-none drop-shadow-lg">
            {rightTeam.emoji}
          </div>

          {/* Sets indicators */}
          {game.config.setsEnabled && game.setScores2.length > 0 && (
            <div className="absolute top-3 right-3 flex gap-0.5">
              {game.setScores2.map((s, i) => (
                <span key={i} className="text-white/40 text-[10px] font-bold tabular-nums bg-black/10 px-1 rounded">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Team name */}
          <div className="text-white/80 text-lg font-bold mb-1 flex items-center gap-2">
            <span>{rightTeam.name || `Time ${rightTeam.id}`}</span>
          </div>

          {/* Giant score */}
          <div className="text-white text-[140px] sm:text-[170px] font-black tabular-nums leading-none mb-2 drop-shadow-xl">
            {rightScore}
          </div>

          <div className="absolute top-3 right-3 text-white font-bold text-sm bg-black/20 px-2.5 py-0.5 rounded-full">
            🏆 {rightWins} vitórias
          </div>
        </div>
      </div>

      {/* ─── EXPANDABLE CENTER MENU ─── */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-10 flex flex-col items-center">
        <AnimatePresence>
          {menuExpanded && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white/95 backdrop-blur rounded-2xl px-3 py-3 shadow-xl border border-white/30 mb-2"
            >
              <div className="grid grid-cols-3 gap-1.5">
                <MenuButton icon="⏪" label="Reiniciar" onClick={() => dispatch({ type: 'RESTART_MATCH' })} />
                <MenuButton icon="↩" label="Desfazer" onClick={() => dispatch({ type: 'UNDO_LAST_POINT' })} disabled={game.scoreHistory.length === 0} />
                <MenuButton icon="⇄" label="Trocar lados" onClick={() => dispatch({ type: 'SWAP_SIDES' })} />
                <MenuButton icon="📈" label="Histórico" onClick={() => setShowHistory(true)} />
                <MenuButton icon="📐" label="Exibição" onClick={() => setShowTheme(true)} />
                <MenuButton icon="⚙️" label="Config" onClick={() => setShowConfig(true)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button — always visible */}
        <motion.button
          onClick={() => setMenuExpanded(p => !p)}
          className="bg-white/95 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center shadow-lg border border-white/30 hover:bg-white transition-colors"
          title={menuExpanded ? 'Fechar menu' : 'Abrir menu'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 transition-transform duration-200"
            style={{ transform: menuExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.button>

        {/* Current set indicator below menu */}
        {game.config.setsEnabled && (
          <div className="text-xs font-semibold text-white/70 mt-1.5">
            Set {game.currentSet}
          </div>
        )}
      </div>

      {/* ─── BOTTOM BAR: Queue + End Match ─── */}
      <div className={`${isDark ? 'bg-gray-900/80' : 'bg-black/10 backdrop-blur-sm'} px-4 py-2.5 flex items-center justify-between z-[5]`}>
          {/* Queue */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
            {queueTeams.length > 0 && (
              <>
                <span className="text-xs font-bold uppercase tracking-wide shrink-0 text-white/60">
                  Próximo:
                </span>
                {queueTeams.map(t => (
                  <span
                    key={t!.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 bg-white/20 text-white/80"
                  >
                    {t!.emoji} {t!.name || `T${t!.id}`}
                  </span>
                ))}
              </>
            )}
          </div>

          {/* End match button */}
          <button
            onClick={() => dispatch({ type: 'END_MATCH' })}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg transition-all shadow-md shrink-0 ml-2"
          >
            🏁 Encerrar
          </button>
        </div>

      {/* ─── OVERLAY MODALS ─── */}
      <HistoryDropdown
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        matchHistory={game.matchHistory}
      />
      <ThemeModal
        isOpen={showTheme}
        onClose={() => setShowTheme(false)}
        config={game.config}
        onConfigChange={handleConfigChange}
      />
      <GameConfigModal
        isOpen={showConfig}
        onClose={() => {
          setShowConfig(false);
          setMenuExpanded(false);
        }}
        config={game.config}
        teams={game.allTeams}
        onConfigChange={handleConfigChange}
        onTeamChange={handleTeamChange}
        onOpenTheme={() => { setShowConfig(false); setShowTheme(true); }}
      />
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
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
      // Swipe down detected
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

  useEffect(() => {
    if (leftScore >= game.config.pointsToWin || rightScore >= game.config.pointsToWin) {
      if (!celebrated) {
        setCelebrated(true);
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        new Audio("https://www.soundjay.com/misc/sounds/applause-1.mp3").play();
      }
    } else {
      setCelebrated(false);
    }
  }, [leftScore, rightScore, game.config.pointsToWin, celebrated]);

  const handleConfigChange = useCallback((config: typeof game.config) => {
    dispatch({ type: 'UPDATE_GAME_CONFIG', payload: config });
  }, [dispatch]);

  const handleTeamChange = useCallback((teams: typeof game.allTeams) => {
    // We need to update individual teams
    teams.forEach((t, idx) => {
      const original = game.allTeams[idx];
      if (original.name !== t.name || original.emoji !== t.emoji) {
        dispatch({ type: 'UPDATE_TEAM_INFO', payload: { teamId: t.id, name: t.name, emoji: t.emoji } });
      }
    });
  }, [game.allTeams, dispatch]);

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden select-none ${isDark ? 'bg-gray-950' : ''}`}>
      {/* Timer bar */}
      {game.config.timerEnabled && (
        <div className={`flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
          <span>▶</span>
          <span className="tabular-nums">00:00</span>
          <span>↺</span>
        </div>
      )}

      {/* Main split area */}
      <div className="flex-1 flex relative">
        {/* Left half (Blue) */}
        <div
          className="flex-1 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: isDark ? '#1a237e' : '#2979D0' }}
          onClick={() => scoreSide(leftSide)}
          onTouchStart={e => handleTouchStart(e, leftSide)}
          onTouchEnd={handleTouchEnd}
        >
          {/* Decorative pawns */}
          <div className="absolute top-2 left-2 text-[60px] opacity-[0.06] select-none pointer-events-none leading-none">♟</div>
          <div className="absolute bottom-2 left-2 text-[60px] opacity-[0.06] select-none pointer-events-none leading-none">♟</div>
          {/* Mascot */}
          <div className="absolute bottom-4 right-4 text-3xl opacity-40 select-none pointer-events-none">🐸</div>

          {/* Set scores */}
          {game.config.setsEnabled && game.setScores1.length > 0 && (
            <div className="absolute top-4 text-white/50 text-xs font-medium tabular-nums">
              Sets: {game.setScores1.map((s, i) => (
                <span key={i} className="mx-0.5">{s}</span>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`x${i}`} className="mx-0.5">×</span>, el], [] as React.ReactNode[])}
            </div>
          )}

          {/* Team name */}
          <div className="text-white/90 text-lg sm:text-xl font-bold mb-1 flex items-center gap-2">
            <span>{leftTeam.emoji}</span>
            <span>{leftTeam.name || `Time ${leftTeam.id}`}</span>
          </div>

          {/* Score */}
          <div className="text-white text-8xl sm:text-9xl font-black tabular-nums leading-none mb-2">
            {leftScore}
          </div>

          {/* Wins indicator */}
          {game.config.setsEnabled && leftWins > 0 && (
            <div className="text-white/60 text-xs font-semibold bg-white/10 px-3 py-1 rounded-full">
              🏆 {leftWins} {leftWins === 1 ? 'vitória' : 'vitórias'}
            </div>
          )}
        </div>

        {/* Divider / Center actions */}
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-8 z-10 flex flex-col items-center gap-2 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm rounded-2xl px-3 py-3 shadow-xl`}>
          {/* Set score between teams */}
          {game.config.setsEnabled && game.currentSet > 1 && (
            <div className="text-xs font-bold text-gray-500 mb-1 tabular-nums">
              {game.setScores1.length > 0 ? game.setScores1.reduce((a, b) => a + b, 0) : 0} × {game.setScores2.length > 0 ? game.setScores2.reduce((a, b) => a + b, 0) : 0}
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            <MenuButton icon="⏪" label="Reiniciar" onClick={() => dispatch({ type: 'RESTART_MATCH' })} />
            <MenuButton icon="↩" label="Desfazer" onClick={() => dispatch({ type: 'UNDO_LAST_POINT' })} disabled={game.scoreHistory.length === 0} />
            <MenuButton icon="⇄" label="Trocar lados" onClick={() => dispatch({ type: 'SWAP_SIDES' })} />
            <MenuButton icon="📈" label="Histórico" onClick={() => setShowHistory(true)} />
            <MenuButton icon="📐" label="Exibição" onClick={() => setShowTheme(true)} />
            <MenuButton icon="⚙️" label="Configurações" onClick={() => setShowConfig(true)} />
          </div>

          {/* Current set indicator */}
          {game.config.setsEnabled && (
            <div className="text-xs font-semibold text-gray-400 mt-1">
              Set {game.currentSet}
            </div>
          )}
        </div>

        {/* Right half (Red) */}
        <div
          className="flex-1 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: isDark ? '#b71c1c' : '#C0392B' }}
          onClick={() => scoreSide(rightSide)}
          onTouchStart={e => handleTouchStart(e, rightSide)}
          onTouchEnd={handleTouchEnd}
        >
          {/* Decorative pawns */}
          <div className="absolute top-2 right-2 text-[60px] opacity-[0.06] select-none pointer-events-none leading-none">♟</div>
          <div className="absolute bottom-2 right-2 text-[60px] opacity-[0.06] select-none pointer-events-none leading-none">♟</div>
          {/* Mascot */}
          <div className="absolute bottom-4 left-4 text-3xl opacity-40 select-none pointer-events-none">🐄</div>

          {/* Set scores */}
          {game.config.setsEnabled && game.setScores2.length > 0 && (
            <div className="absolute top-4 text-white/50 text-xs font-medium tabular-nums">
              Sets: {game.setScores2.map((s, i) => (
                <span key={i} className="mx-0.5">{s}</span>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`x${i}`} className="mx-0.5">×</span>, el], [] as React.ReactNode[])}
            </div>
          )}

          {/* Team name */}
          <div className="text-white/90 text-lg sm:text-xl font-bold mb-1 flex items-center gap-2">
            <span>{rightTeam.emoji}</span>
            <span>{rightTeam.name || `Time ${rightTeam.id}`}</span>
          </div>

          {/* Score */}
          <div className="text-white text-8xl sm:text-9xl font-black tabular-nums leading-none mb-2">
            {rightScore}
          </div>

          {/* Wins indicator */}
          {game.config.setsEnabled && rightWins > 0 && (
            <div className="text-white/60 text-xs font-semibold bg-white/10 px-3 py-1 rounded-full">
              🏆 {rightWins} {rightWins === 1 ? 'vitória' : 'vitórias'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t px-4 py-2.5 flex items-center justify-between`}>
        {/* Queue */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
          {queueTeams.length > 0 && (
            <>
              <span className={`text-xs font-semibold uppercase tracking-wide shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Fila:
              </span>
              {queueTeams.map(t => (
                <span
                  key={t!.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t!.emoji} {t!.name || `Time ${t!.id}`}
                </span>
              ))}
            </>
          )}
        </div>

        {/* End match button */}
        <button
          onClick={() => dispatch({ type: 'END_MATCH' })}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg transition-all shadow-md shrink-0 ml-2"
        >
          🏁 Encerrar
        </button>
      </div>

      {/* Overlaid modals */}
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
        onClose={() => setShowConfig(false)}
        config={game.config}
        teams={game.allTeams}
        onConfigChange={handleConfigChange}
        onTeamChange={handleTeamChange}
        onOpenTheme={() => { setShowConfig(false); setShowTheme(true); }}
      />
    </div>
  );
}

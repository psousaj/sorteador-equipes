import { ChevronLeft, Trophy, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useEffect } from 'react';

export function GameScreen() {
  const { state, dispatch } = useApp();
  const { game } = state;

  // Auto-redirect when game ends
  useEffect(() => {
    if (!game.isActive && game.matchHistory.length > 0) {
      dispatch({ type: 'SET_SCREEN', payload: 'gameover' });
    }
  }, [game.isActive, game.matchHistory.length, dispatch]);

  const team1 = game.playing ? game.allTeams.find(t => t.id === game.playing![0]) : null;
  const team2 = game.playing ? game.allTeams.find(t => t.id === game.playing![1]) : null;

  if (!team1 || !team2) return null;

  const queueTeams = game.queue
    .map(id => game.allTeams.find(t => t.id === id))
    .filter(Boolean);

  const getTeamWins = (teamId: number) => game.wins[teamId] || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => {
            dispatch({ type: 'CLOSE_GAME' });
            dispatch({ type: 'SET_SCREEN', payload: 'result' });
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft size={22} />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <span className="text-sm font-semibold text-gray-700">
            Partida {game.matchHistory.length + 1}
          </span>
        </div>
      </header>

      {/* Score / Playing area */}
      <div className="flex-1 grid grid-cols-2 gap-px bg-gray-200 overflow-hidden">
        {/* Team 1 (Left - Blue) */}
        <motion.div
          className="relative flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 cursor-pointer select-none"
          onClick={() => dispatch({ type: 'SCORE_POINT', payload: { side: 'team1' } })}
          whileTap={{ scale: 0.98 }}
          layout
        >
          {/* Team name + members */}
          <div className="text-center mb-2 px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800">
              🔵 Time {team1.id}
            </h2>
            <p className="text-xs sm:text-sm text-blue-600 mt-1 font-medium truncate max-w-[200px]">
              {team1.members.map(m => m.name).join(', ')}
            </p>
          </div>

          {/* Score */}
          <div className="text-7xl sm:text-8xl font-black text-blue-700 tabular-nums leading-none mb-3">
            {game.scores[0]}
          </div>

          {/* Playing indicator */}
          <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 bg-blue-200/60 px-3 py-1 rounded-full">
            <span>👑</span>
            <span>JOGANDO</span>
          </div>

          {/* Click hint */}
          <div className="absolute bottom-3 text-xs text-blue-400/60 font-medium">
            Clique para pontuar
          </div>
        </motion.div>

        {/* Team 2 (Right - Red) */}
        <motion.div
          className="relative flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-red-100 cursor-pointer select-none"
          onClick={() => dispatch({ type: 'SCORE_POINT', payload: { side: 'team2' } })}
          whileTap={{ scale: 0.98 }}
          layout
        >
          {/* Team name + members */}
          <div className="text-center mb-2 px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-red-800">
              🔴 Time {team2.id}
            </h2>
            <p className="text-xs sm:text-sm text-red-600 mt-1 font-medium truncate max-w-[200px]">
              {team2.members.map(m => m.name).join(', ')}
            </p>
          </div>

          {/* Score */}
          <div className="text-7xl sm:text-8xl font-black text-red-700 tabular-nums leading-none mb-3">
            {game.scores[1]}
          </div>

          {/* Playing indicator */}
          <div className="flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-200/60 px-3 py-1 rounded-full">
            <span>👑</span>
            <span>JOGANDO</span>
          </div>

          {/* Click hint */}
          <div className="absolute bottom-3 text-xs text-red-400/60 font-medium">
            Clique para pontuar
          </div>
        </motion.div>
      </div>

      {/* Bottom info bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 space-y-3">
        {/* Queue */}
        {queueTeams.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Na fila:</span>
            <div className="flex gap-1.5 flex-wrap">
              {queueTeams.map(t => (
                <span
                  key={t!.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700"
                >
                  🎯 Time {t!.id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Wins */}
        {Object.keys(game.wins).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vitórias:</span>
            <div className="flex gap-2 flex-wrap">
              {game.allTeams.filter(t => (game.wins[t.id] || 0) > 0).map(t => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700"
                >
                  <Trophy size={12} />
                  Time {t.id} ({getTeamWins(t.id)})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* End match button */}
        <button
          onClick={() => dispatch({ type: 'END_MATCH' })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg transition-all shadow-md"
        >
          <Flag size={16} />
          Encerrar partida
        </button>
      </div>
    </div>
  );
}

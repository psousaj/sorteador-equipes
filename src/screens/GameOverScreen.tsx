import { Home, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export function GameOverScreen() {
  const { state, dispatch } = useApp();
  const { game } = state;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          className="text-center max-w-lg w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-4">🏁</div>
          <h1 className="text-3xl font-display font-bold text-gray-800 mb-2">
            Sessão encerrada!
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {game.matchHistory.length} partidas disputadas
          </p>
        </motion.div>

        {/* Wins Ranking */}
        {Object.keys(game.wins).length > 0 && (
          <motion.div
            className="w-full max-w-md mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">
              Ranking de Vitórias
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              {Object.entries(game.wins)
                .sort(([, a], [, b]) => b - a)
                .map(([teamId, wins], idx) => {
                  const team = game.allTeams.find(t => t.id === Number(teamId));
                  if (!team) return null;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                  return (
                    <div
                      key={teamId}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {medal ? (
                          <span className="text-base w-6 text-center">{medal}</span>
                        ) : (
                          <span className="text-base w-6 text-center text-gray-300">•</span>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {team.emoji} {team.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 tabular-nums">
                        {wins} {wins === 1 ? 'vitória' : 'vitórias'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Match History */}
        <motion.div
          className="w-full max-w-md space-y-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            Histórico de partidas
          </h2>
          {game.matchHistory.length === 0 ? (
            <p className="text-sm text-gray-400 px-1">Nenhuma partida foi disputada.</p>
          ) : (
            game.matchHistory.map((match, idx) => (
              <div
                key={match.id}
                className="bg-white rounded-xl border border-gray-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{match.team1Name}</span>
                    <span className="text-gray-400 mx-1">vs</span>
                    <span className="font-medium">{match.team2Name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tabular-nums ${
                      match.winner === 'team1' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {match.score1} × {match.score2}
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Venceu {match.winner === 'team1' ? match.team1Name : match.team2Name}
                    </span>
                  </div>
                </div>

                {/* Set details — only if sets were enabled */}
                {match.setScores1 && match.setScores1.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-500">
                    <span className="font-medium">Sets:</span>
                    {match.setScores1.map((s1, i) => (
                      <span key={i} className="tabular-nums">
                        {i > 0 && <span className="mx-1 text-gray-300">•</span>}
                        <span className={match.winner === 'team1' && i === match.setScores1.length - 1 ? 'text-blue-600 font-semibold' : ''}>
                          {s1}×{match.setScores2[i]}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => {
              dispatch({ type: 'CLOSE_GAME' });
              dispatch({ type: 'SET_SCREEN', payload: 'home' });
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white text-gray-700 border border-gray-200 hover:shadow-lg transition-all shadow-md"
          >
            <Home size={18} />
            Voltar ao início
          </button>

          <button
            onClick={() => {
              dispatch({ type: 'CLOSE_GAME' });
              dispatch({ type: 'SET_SCREEN', payload: 'result' });
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand to-purple-600 text-white hover:shadow-xl transition-all shadow-md"
          >
            <Eye size={18} />
            Ver resultado do sorteio
          </button>
        </motion.div>
      </div>
    </div>
  );
}

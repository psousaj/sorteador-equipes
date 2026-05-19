import { useState } from 'react';
import { Copy, Check, Shuffle, ArrowLeft, Share2, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { TeamCard } from '../components/TeamCard';
import type { GameConfig } from '../types';

export function ResultScreen() {
  const { state, dispatch, startDraw } = useApp();
  const { currentResult } = state;
  const [copied, setCopied] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    pointsToWin: 5,
    winLimit: 2,
    deuce: true,
  });

  if (!currentResult) return null;

  const formatWhatsApp = () => {
    const lines: string[] = [];
    lines.push('*🎲 Sorteio de Equipes*');
    lines.push('');

    currentResult.teams.forEach(team => {
      lines.push(`*Time ${team.id}*`);
      team.members.forEach(m => {
        const isCaptain = team.captain?.id === m.id;
        const tags = m.tags.filter(t => t !== 'masculino' && t !== 'feminino').join(', ');
        const tagStr = tags ? ` (${tags})` : '';
        lines.push(`${isCaptain ? '👑 ' : ''}${m.name}${tagStr}`);
      });
      lines.push('');
    });

    lines.push(`📅 ${new Date().toLocaleDateString('pt-BR')}`);
    return lines.join('\n');
  };

  const handleCopy = async () => {
    const text = formatWhatsApp();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = formatWhatsApp();
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      handleCopy();
    }
  };

  const handleRedraw = () => {
    // Re-draw with same config
    const config = currentResult.config;
    dispatch({ type: 'SET_TEAM_SIZE', payload: config.teamSize });
    // Remove old rules and add saved ones
    // Actually, we saved config in state already from the draw, just run startDraw again
    startDraw();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display text-gray-800">
            🎲 Times Sorteados!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentResult.teams.length} times · {currentResult.teams.reduce((a, t) => a + t.members.length, 0)} jogadores
          </p>
        </motion.div>

        {/* Teams grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {currentResult.teams.map((team, idx) => (
            <motion.div
              key={team.id}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
            >
              <TeamCard team={team} colorIndex={idx} />
            </motion.div>
          ))}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
              transition-all duration-300 shadow-md
              ${copied
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:shadow-lg border border-gray-200'
              }
            `}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copiado!' : '📋 Copiar pra WhatsApp'}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white text-gray-700 hover:shadow-lg border border-gray-200 transition-all shadow-md"
          >
            <Share2 size={18} />
            Compartilhar
          </button>

          <button
            onClick={handleRedraw}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand to-purple-600 text-white hover:shadow-xl transition-all shadow-md"
          >
            <Shuffle size={18} />
            Sortear de novo
          </button>

          <button
            onClick={() => setShowGameModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-xl transition-all shadow-md"
          >
            <Play size={18} />
            Iniciar Partida
          </button>
        </motion.div>

        {/* Game Config Modal */}
        <AnimatePresence>
          {showGameModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGameModal(false)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-bold text-gray-800">⚙️ Configurar Partida</h2>
                  <button
                    onClick={() => setShowGameModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pontos para vencer
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={gameConfig.pointsToWin}
                      onChange={e => setGameConfig(prev => ({ ...prev, pointsToWin: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-brand focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite de vitórias (sai com X)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={gameConfig.winLimit}
                      onChange={e => setGameConfig(prev => ({ ...prev, winLimit: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-brand focus:border-transparent"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameConfig.deuce}
                      onChange={e => setGameConfig(prev => ({ ...prev, deuce: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span className="text-sm font-medium text-gray-700">Deuce (diferença de 2 pontos)</span>
                  </label>
                </div>

                <button
                  onClick={() => {
                    dispatch({
                      type: 'START_GAME',
                      payload: { config: gameConfig, teams: currentResult.teams },
                    });
                    dispatch({ type: 'SET_SCREEN', payload: 'game' });
                    setShowGameModal(false);
                  }}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-xl transition-all shadow-md"
                >
                  <Play size={18} />
                  Começar!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Copy preview */}
        <motion.div
          className="mt-8 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-xs text-gray-400 mb-2 font-medium">Preview do texto copiado:</p>
          <pre className="bg-white/80 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 whitespace-pre-wrap font-body leading-relaxed">
            {formatWhatsApp()}
          </pre>
        </motion.div>
      </div>
    </div>
  );
}

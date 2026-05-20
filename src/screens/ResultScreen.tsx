import { useState, useEffect } from 'react';
import { Copy, Check, Shuffle, ArrowLeft, Share2, Play, X, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { TeamCard } from '../components/TeamCard';
import type { GameConfig, Team } from '../types';
import { defaultGameConfig, randomTeamEmoji, TEAM_EMOJIS } from '../types';
import { getGameConfig, saveGameConfig, saveTeamCustomizations, getTeamCustomizations } from '../lib/storage';
import { SPORTS, CAPTAIN_TAG } from '../lib/sports';

export function ResultScreen() {
  const { state, dispatch, startDraw } = useApp();
  const { currentResult } = state;
  const [copied, setCopied] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);

  // Load game config from localStorage
  const [gameConfig, setGameConfigState] = useState<GameConfig>(() => {
    return getGameConfig() || defaultGameConfig();
  });

  // Editable team customizations
  const [teamNames, setTeamNames] = useState<Record<number, string>>({});
  const [teamEmojis, setTeamEmojis] = useState<Record<number, string>>({});
  const [editEmojiForTeam, setEditEmojiForTeam] = useState<number | null>(null);

  // Load saved customizations and merge with current teams
  useEffect(() => {
    if (!currentResult) return;
    const saved = getTeamCustomizations();
    const names: Record<number, string> = {};
    const emojis: Record<number, string> = {};
    currentResult.teams.forEach(t => {
      names[t.id] = saved?.teams?.[t.id]?.name || t.name || `Time ${t.id}`;
      emojis[t.id] = saved?.teams?.[t.id]?.emoji || t.emoji || randomTeamEmoji();
    });
    setTeamNames(names);
    setTeamEmojis(emojis);
  }, [currentResult]);

  if (!currentResult) return null;

  // Save customizations whenever they change
  const persistCustomizations = (names: Record<number, string>, emojis: Record<number, string>) => {
    saveTeamCustomizations({
      teams: Object.fromEntries(
        Object.entries(names).map(([id, name]) => [
          id,
          { name, emoji: emojis[Number(id)] },
        ])
      ),
    });
  };

  const handleNameChange = (teamId: number, name: string) => {
    const newNames = { ...teamNames, [teamId]: name };
    setTeamNames(newNames);
    persistCustomizations(newNames, teamEmojis);
  };

  const handleEmojiChange = (teamId: number, emoji: string) => {
    const newEmojis = { ...teamEmojis, [teamId]: emoji };
    setTeamEmojis(newEmojis);
    setEditEmojiForTeam(null);
    persistCustomizations(teamNames, newEmojis);
  };

  const buildTeamsWithInfo = (): Team[] => {
    return currentResult.teams.map(t => ({
      ...t,
      name: teamNames[t.id] || t.name || `Time ${t.id}`,
      emoji: teamEmojis[t.id] || t.emoji || randomTeamEmoji(),
    }));
  };

  const formatWhatsApp = () => {
    const lines: string[] = [];
    lines.push('*🎲 Sorteio de Equipes*');
    lines.push('');

    currentResult.teams.forEach(team => {
      const displayName = teamNames[team.id] || team.name || `Time ${team.id}`;
      const displayEmoji = teamEmojis[team.id] || team.emoji || '';
      lines.push(`*${displayEmoji} ${displayName}*`);
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
    const config = currentResult.config;
    dispatch({ type: 'SET_TEAM_SIZE', payload: config.teamSize });
    startDraw();
  };

  const startGame = () => {
    const teamsWithInfo = buildTeamsWithInfo();
    const configToSave = { ...gameConfig };

    // If sets disabled, ensure related fields are off
    if (!gameConfig.setsEnabled) {
      configToSave.margin = 2;
      configToSave.totalSets = 3;
      configToSave.setsToWin = 2;
    }

    saveGameConfig(configToSave);

    dispatch({
      type: 'START_GAME',
      payload: { config: configToSave, teams: teamsWithInfo },
    });
    dispatch({ type: 'SET_SCREEN', payload: 'game' });
    setShowGameModal(false);
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

        {/* Teams grid with inline editing */}
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
          {currentResult.teams.map((team, idx) => {
            const displayName = teamNames[team.id] || `Time ${team.id}`;
            const displayEmoji = teamEmojis[team.id] || '🏳️';
            const colors = [
              'border-purple-400 bg-purple-100',
              'border-emerald-400 bg-emerald-100',
              'border-pink-400 bg-pink-100',
              'border-yellow-400 bg-yellow-100',
              'border-sky-400 bg-sky-100',
              'border-orange-400 bg-orange-100',
              'border-teal-400 bg-teal-100',
              'border-indigo-400 bg-indigo-100',
            ];
            const headerColors = [
              'bg-purple-500', 'bg-emerald-500', 'bg-pink-500', 'bg-yellow-500',
              'bg-sky-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500',
            ];
            const ci = idx % colors.length;

            return (
              <motion.div
                key={team.id}
                className={`rounded-2xl border-2 ${colors[ci]} overflow-hidden transition-all hover:shadow-lg`}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
              >
                {/* Header with inline editor */}
                <div className={`${headerColors[ci]} text-white px-4 py-2 flex items-center gap-2`}>
                  {/* Emoji selector */}
                  <div className="relative">
                    <button
                      onClick={() => setEditEmojiForTeam(editEmojiForTeam === team.id ? null : team.id)}
                      className="text-xl hover:scale-110 transition-transform cursor-pointer select-none"
                    >
                      {displayEmoji}
                    </button>
                    <AnimatePresence>
                      {editEmojiForTeam === team.id && (
                        <motion.div
                          className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl shadow-xl border border-gray-200 p-2 grid grid-cols-6 gap-1 w-48"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          {TEAM_EMOJIS.map(e => (
                            <button
                              key={e}
                              onClick={() => handleEmojiChange(team.id, e)}
                              className={`text-lg p-1 rounded-lg hover:bg-gray-100 transition-colors ${displayEmoji === e ? 'bg-gray-100 ring-2 ring-brand' : ''}`}
                            >
                              {e}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Editable name */}
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => handleNameChange(team.id, e.target.value)}
                    className="flex-1 bg-transparent text-white font-display text-lg outline-none border-b border-transparent focus:border-white/50 placeholder-white/50"
                    placeholder={`Time ${team.id}`}
                  />

                  <span className="text-xs opacity-75 ml-auto shrink-0">{team.members.length}</span>
                </div>

                {/* Members */}
                <div className="p-3 space-y-1.5 bg-white/60">
                  {team.members.map(m => {
                    const isCaptain = team.captain?.id === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-xl
                          ${isCaptain ? 'bg-white/80 font-semibold' : 'hover:bg-white/40'}
                          transition-colors
                        `}
                      >
                        {isCaptain && <Crown size={16} className="text-yellow-500 shrink-0" />}
                        <span className={`text-gray-800 text-sm ${isCaptain ? 'font-bold' : ''}`}>
                          {m.name}{isCaptain && ' (C)'}
                        </span>
                        <div className="ml-auto flex gap-1">
                          {m.tags
                            .filter(t => t !== 'masculino' && t !== 'feminino')
                            .map(t => (
                              <span
                                key={t}
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500"
                              >
                                {t}
                              </span>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Sport Template Selector */}
        <motion.div
          className="max-w-xl mx-auto mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">
            Template de Esporte
          </label>
          <div className="flex flex-wrap gap-2 justify-center">
            {SPORTS.map(sport => (
              <button
                key={sport.id}
                onClick={() => {
                  const newConfig = { ...gameConfig, sportTemplate: sport.id };
                  setGameConfigState(newConfig);
                  saveGameConfig(newConfig);
                }}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border
                  ${gameConfig.sportTemplate === sport.id
                    ? 'bg-brand text-white border-brand shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-base">{sport.emoji}</span>
                {sport.name}
              </button>
            ))}
            <button
              onClick={() => {
                const newConfig = { ...gameConfig, sportTemplate: '' };
                setGameConfigState(newConfig);
                saveGameConfig(newConfig);
              }}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border
                ${!gameConfig.sportTemplate
                  ? 'bg-gray-200 text-gray-700 border-gray-300 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }
              `}
            >
              ✗ Nenhum
            </button>
          </div>
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
                  <h2 className="text-lg font-bold text-gray-800">⚙️ Configurar Partida</h2>
                  <button
                    onClick={() => setShowGameModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Points to win */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Pontos para vencer
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={gameConfig.pointsToWin}
                      onChange={e => setGameConfigState(prev => ({ ...prev, pointsToWin: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-brand focus:border-transparent bg-gray-50"
                    />
                  </div>

                  {/* Max wins */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Limite de vitórias (sai com X)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={gameConfig.maxWins}
                      onChange={e => setGameConfigState(prev => ({ ...prev, maxWins: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-brand focus:border-transparent bg-gray-50"
                    />
                  </div>

                  {/* Sets toggle */}
                  <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50/50">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gameConfig.setsEnabled}
                        onChange={e => setGameConfigState(prev => ({ ...prev, setsEnabled: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <span className="text-sm font-semibold text-gray-700">Sets (melhor de X)</span>
                    </label>

                    {gameConfig.setsEnabled && (
                      <div className="flex gap-2 pl-7">
                        {[
                          { label: 'MD3 — Melhor de 3', totalSets: 3, setsToWin: 2 },
                          { label: 'MD5 — Melhor de 5', totalSets: 5, setsToWin: 3 },
                        ].map(opt => (
                          <button
                            key={opt.totalSets}
                            onClick={() => setGameConfigState(prev => ({
                              ...prev,
                              totalSets: opt.totalSets,
                              setsToWin: opt.setsToWin,
                            }))}
                            className={`
                              flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all border
                              ${gameConfig.totalSets === opt.totalSets
                                ? 'bg-brand text-white border-brand shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={startGame}
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
          <p className="text-xs text-gray-400 mb-2 font-medium text-center">Preview do texto copiado:</p>
          <pre className="bg-white/80 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 whitespace-pre-wrap font-body leading-relaxed">
            {formatWhatsApp()}
          </pre>
        </motion.div>
      </div>
    </div>
  );
}

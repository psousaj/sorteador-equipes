import { useState } from 'react';
import { ArrowLeft, Trash2, Copy, Shuffle, Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { TeamCard } from '../components/TeamCard';
import { getHistory, clearHistory, removeFromHistory } from '../lib/storage';
import type { DrawResult } from '../types';

export function HistoryScreen() {
  const { state, dispatch } = useApp();
  const [history, setHistory] = useState<DrawResult[]>(getHistory());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const handleRemove = (id: string) => {
    removeFromHistory(id);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const handleCopyResult = async (result: DrawResult) => {
    const lines: string[] = [];
    lines.push('*🎲 Sorteio de Equipes*');
    lines.push(`📅 ${new Date(result.timestamp).toLocaleDateString('pt-BR')} ${new Date(result.timestamp).toLocaleTimeString('pt-BR')}`);
    lines.push('');

    result.teams.forEach(team => {
      lines.push(`*Time ${team.id}*`);
      team.members.forEach(m => {
        const isCaptain = team.captain?.id === m.id;
        lines.push(`${isCaptain ? '👑 ' : ''}${m.name}`);
      });
      lines.push('');
    });

    const text = lines.join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedId(result.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRestoreDraw = (result: DrawResult) => {
    dispatch({
      type: 'LOAD_CONFIG',
      payload: {
        config: result.config,
        people: result.allPeople,
      },
    });
    dispatch({ type: 'SET_SCREEN', payload: 'home' });
  };

  // Group by date
  const grouped = history.reduce<Record<string, DrawResult[]>>((acc, item) => {
    const date = new Date(item.timestamp).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{history.length} sorteio(s)</span>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
              >
                <Trash2 size={14} />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-display text-gray-800 flex items-center justify-center gap-2">
            <Clock size={24} className="text-brand" />
            Histórico
          </h1>
        </motion.div>

        {/* Empty state */}
        {history.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 font-body">Nenhum sorteio ainda.</p>
            <p className="text-sm text-gray-400">Os sorteios aparecem aqui automaticamente.</p>
          </motion.div>
        )}

        {/* History list */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-brand rounded-full" />
                {date}
              </h2>
              <div className="space-y-3">
                {items.map(result => (
                  <motion.div
                    key={result.id}
                    className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎲</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {result.teams.length} times · {result.teams.reduce((a, t) => a + t.members.length, 0)} pessoas
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>

                    {/* Team preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {result.teams.map((team, idx) => (
                        <div key={team.id} className="bg-gray-50 rounded-xl p-2">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Time {team.id}</p>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {team.members.map(m => (
                              <span key={m.id} className="block">
                                {team.captain?.id === m.id ? '👑 ' : ''}{m.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyResult(result)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition-all ${
                          copiedId === result.id
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {copiedId === result.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === result.id ? 'Copiado' : 'Copiar'}
                      </button>
                      <button
                        onClick={() => handleRestoreDraw(result)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-brand-light hover:text-white transition-all"
                      >
                        <Shuffle size={12} />
                        Refazer
                      </button>
                      <button
                        onClick={() => handleRemove(result.id)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-red-400 hover:bg-red-50 hover:text-red-500 transition-all ml-auto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

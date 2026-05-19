import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import type { GameConfig, Team } from '../types';
import { defaultGameConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  teams: Team[];
  onConfigChange: (config: GameConfig) => void;
  onTeamChange: (teams: Team[]) => void;
  onOpenTheme: () => void;
}

export function GameConfigModal({
  isOpen,
  onClose,
  config,
  teams,
  onConfigChange,
  onTeamChange,
  onOpenTheme,
}: Props) {
  const [editingTeamIndex, setEditingTeamIndex] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const updateConfig = (partial: Partial<GameConfig>) => {
    onConfigChange({ ...config, ...partial });
  };

  const adjust = (key: 'pointsToWin' | 'margin' | 'setsToWin', delta: number) => {
    const val = config[key] + delta;
    if (val < 1) return;
    updateConfig({ [key]: val });
  };

  const handleReset = () => {
    onConfigChange(defaultGameConfig());
  };

  const openTeamEdit = (index: number) => {
    setEditingTeamIndex(index);
    setShowEmojiPicker(false);
  };

  const updateTeam = (index: number, name: string, emoji: string) => {
    const updated = [...teams];
    updated[index] = { ...updated[index], name, emoji };
    onTeamChange(updated);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (editingTeamIndex !== null) {
      updateTeam(editingTeamIndex, teams[editingTeamIndex].name, emojiData.emoji);
      setShowEmojiPicker(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">&lt; CONFIGURAÇÕES</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title="Resetar configurações"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ─── Coluna esquerda — GERAL ─── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Geral</h3>

                {/* Idioma */}
                <SettingRow icon="🌐" label="Português (brasil)">
                  <span className="text-sm text-gray-500">▼</span>
                </SettingRow>

                {/* Tema do placar */}
                <SettingRow icon="⊞" label="Tema do placar">
                  <button
                    onClick={onOpenTheme}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ↗
                  </button>
                </SettingRow>

                {/* Swipe to decrease */}
                <SettingRow icon="☝" label="Deslize para diminuir o placar">
                  <Checkbox
                    checked={config.swipeToDecrease}
                    onChange={v => updateConfig({ swipeToDecrease: v })}
                  />
                </SettingRow>

                {/* Vibration */}
                <SettingRow icon="📳" label="Vibração na mudança de pontuação">
                  <Checkbox
                    checked={config.vibration}
                    onChange={v => updateConfig({ vibration: v })}
                  />
                </SettingRow>

                {/* Ask set winner */}
                <SettingRow icon="❓" label="Perguntar para atribuir o set?">
                  <Checkbox
                    checked={config.askSetWinner}
                    onChange={v => updateConfig({ askSetWinner: v })}
                  />
                </SettingRow>

                {/* ÁUDIO (stub) */}
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide pt-2">Áudio</h3>

                <SettingRow icon="🔈" label="Voz da pontuação" disabled>
                  <Checkbox checked={false} onChange={() => {}} disabled />
                </SettingRow>

                <SettingRow icon="🎙" label="Tipo de voz 1" disabled>
                  <span className="text-sm text-gray-400">▼</span>
                </SettingRow>

                <SettingRow icon="🎛" label="Velocidade da voz" disabled>
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full" />
                </SettingRow>

                <SettingRow icon="💬" label='Formato de anúncio de voz {p1} a {p2}' disabled>
                  <span className="text-gray-300">✎</span>
                </SettingRow>
              </div>

              {/* ─── Coluna direita — TIMES ─── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Times</h3>

                {/* Team cards */}
                <div className="space-y-2">
                  {teams.map((team, idx) => (
                    <button
                      key={team.id}
                      onClick={() => openTeamEdit(idx)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all text-left"
                    >
                      <span className="text-lg">{team.emoji || '🏳'}</span>
                      <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                        {team.name || `Time ${team.id}`}
                      </span>
                      <span className="text-xs text-gray-400">✎</span>
                    </button>
                  ))}
                </div>

                {/* Team editor sub-modal */}
                <AnimatePresence>
                  {editingTeamIndex !== null && (
                    <motion.div
                      className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-3"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Nome do time:</span>
                        <input
                          type="text"
                          value={teams[editingTeamIndex].name}
                          onChange={e => updateTeam(editingTeamIndex, e.target.value, teams[editingTeamIndex].emoji)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-brand focus:border-transparent"
                          placeholder={`Time ${teams[editingTeamIndex].id}`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700">Emoji:</span>
                          <span className="text-2xl">{teams[editingTeamIndex].emoji || '🏳'}</span>
                          <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="text-xs text-brand font-medium"
                          >
                            {showEmojiPicker ? 'Fechar' : 'Escolher'}
                          </button>
                        </div>
                        {showEmojiPicker && (
                          <div className="w-full max-w-[300px] mx-auto [&_.EmojiPickerReact]:!w-full [&_.EmojiPickerReact]:!h-[300px]">
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PARTIDA */}
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide pt-2">Partida</h3>

                <SettingRow icon="👑" label="Pontos para vencer o set">
                  <Stepper value={config.pointsToWin} onDecrease={() => adjust('pointsToWin', -1)} onIncrease={() => adjust('pointsToWin', 1)} />
                </SettingRow>

                <SettingRow icon="↔" label="Margem para vencer o set">
                  <Stepper value={config.margin} onDecrease={() => adjust('margin', -1)} onIncrease={() => adjust('margin', 1)} />
                </SettingRow>

                <SettingRow icon="🏆" label="Sets para vencer a partida">
                  <Stepper value={config.setsToWin} onDecrease={() => adjust('setsToWin', -1)} onIncrease={() => adjust('setsToWin', 1)} />
                </SettingRow>

                {/* CRONÔMETRO */}
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide pt-2">Cronômetro</h3>

                <SettingRow icon="⏱" label={`Duração do cronômetro ${config.timerDuration} min`}>
                  <button className="text-gray-400 hover:text-gray-600">✎</button>
                </SettingRow>

                <SettingRow icon="⏰" label="Contagem regressiva">
                  <Checkbox
                    checked={config.timerCountdown}
                    onChange={v => updateConfig({ timerCountdown: v })}
                  />
                </SettingRow>

                <SettingRow icon="🔈" label="Som do cronômetro">
                  <Checkbox
                    checked={config.timerSound}
                    onChange={v => updateConfig({ timerSound: v })}
                  />
                </SettingRow>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Helper Components ───────────────────────────────────

function SettingRow({
  icon,
  label,
  children,
  disabled,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span>{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand" />
    </label>
  );
}

function Stepper({
  value,
  onDecrease,
  onIncrease,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDecrease}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-bold"
      >
        −
      </button>
      <span className="text-sm font-bold text-gray-800 w-5 text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={onIncrease}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-bold"
      >
        +
      </button>
    </div>
  );
}

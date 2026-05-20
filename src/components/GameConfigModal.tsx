import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import type { GameConfig, Team } from '../types';
import { defaultGameConfig } from '../types';
import { getGameConfig, saveGameConfig } from '../lib/storage';

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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = getGameConfig();
    if (saved) {
      onConfigChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    saveGameConfig(config);
  }, [config]);

  const totalSets = config.totalSets || 3;
  const derivedSetsToWin = Math.floor(totalSets / 2) + 1;

  const updateConfig = (partial: Partial<GameConfig>) => {
    onConfigChange({ ...config, ...partial });
  };

  const adjust = (key: 'pointsToWin' | 'margin' | 'setsToWin' | 'totalSets', delta: number) => {
    const val = (key === 'totalSets' ? totalSets : config[key]) + delta;
    if (val < 1) return;
    if (key === 'totalSets') {
      if (val < 3) return;
      updateConfig({ totalSets: val, setsToWin: Math.floor(val / 2) + 1 });
    } else {
      updateConfig({ [key]: val });
    }
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
          className="fixed inset-0 z-50 flex flex-col bg-gray-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* ─── Header ─── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-brand hover:text-brand/80 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">CONFIGURAÇÕES</h1>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold"
              title="Restaurar configurações padrão"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              Resetar
            </button>
          </div>

          {/* ─── Content ─── */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ═══════════════════ COLUNA ESQUERDA — GERAL ═══════════════════ */}
              <div className="space-y-4">
                {/* ── Geral ── */}
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Geral</h2>

                <Card>
                  {/* Idioma */}
                  <SettingRow icon="🌐" label="Português (brasil)">
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">▼</span>
                  </SettingRow>

                  <Divider />

                  {/* Tema do placar */}
                  <SettingRow icon="⊞" label="Tema do placar">
                    <button
                      onClick={onOpenTheme}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium bg-gray-100 px-2 py-1 rounded-md"
                    >
                      Editar ↗
                    </button>
                  </SettingRow>

                  <Divider />

                  {/* Deslize para diminuir */}
                  <SettingRow icon="👇" label="Deslize para diminuir o placar">
                    <Toggle checked={config.swipeToDecrease} onChange={v => updateConfig({ swipeToDecrease: v })} />
                  </SettingRow>

                  <Divider />

                  {/* Vibração */}
                  <SettingRow icon="📳" label="Vibração na mudança de pontuação">
                    <Toggle checked={config.vibration} onChange={v => updateConfig({ vibration: v })} />
                  </SettingRow>

                  <Divider />

                  {/* Perguntar set */}
                  <SettingRow icon="❓" label="Perguntar para atribuir o set?">
                    <Toggle checked={config.askSetWinner} onChange={v => updateConfig({ askSetWinner: v })} />
                  </SettingRow>
                </Card>

                {/* ── Áudio ── */}
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Áudio</h2>

                <Card>
                  <SettingRow icon="🔊" label="Voz da pontuação">
                    <Toggle checked={config.askSetWinner} onChange={v => updateConfig({ askSetWinner: v })} />
                  </SettingRow>

                  <Divider />

                  <SettingRow icon="🎙️" label="Tipo de voz" disabled>
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">Voz 1 ▼</span>
                  </SettingRow>

                  <Divider />

                  <SettingRow icon="⚡" label="Velocidade da voz" disabled>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full relative">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-300 rounded-full" />
                    </div>
                  </SettingRow>

                  <Divider />

                  <SettingRow icon="💬" label='Formato: {p1} à {p2}' disabled>
                    <span className="text-gray-300 text-sm">✎</span>
                  </SettingRow>
                </Card>
              </div>

              {/* ═══════════════════ COLUNA DIREITA — PARTIDA ═══════════════════ */}
              <div className="space-y-4">
                {/* ── Jogadores ── */}
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jogadores</h2>

                <div className="space-y-2">
                  {teams.map((team, idx) => {
                    const isLeft = idx === 0;
                    return (
                      <button
                        key={team.id}
                        onClick={() => openTeamEdit(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white transition-all hover:brightness-110 ${
                          isLeft ? 'bg-[#2979D0]' : 'bg-[#C0392B]'
                        }`}
                      >
                        <span className="text-2xl">{team.emoji || '🏳️'}</span>
                        <div className="flex-1 text-left">
                          <div className="text-xs font-semibold text-white/70">
                            {isLeft ? 'Player 1' : 'Player 2'}
                          </div>
                          <div className="text-sm font-bold text-white">
                            {team.name || (isLeft ? 'Player 1' : 'Player 2')}
                          </div>
                        </div>
                        <span className="text-white/60 text-lg leading-none">✎</span>
                      </button>
                    );
                  })}
                </div>

                {/* Team editor sub-modal */}
                <AnimatePresence>
                  {editingTeamIndex !== null && (
                    <motion.div
                      className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 shrink-0">Nome:</span>
                        <input
                          type="text"
                          value={teams[editingTeamIndex].name}
                          onChange={e => updateTeam(editingTeamIndex, e.target.value, teams[editingTeamIndex].emoji)}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-brand focus:border-transparent bg-gray-50"
                          placeholder={`Time ${teams[editingTeamIndex].id}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 shrink-0">Emoji:</span>
                        <span className="text-3xl">{teams[editingTeamIndex].emoji || '🏳️'}</span>
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-xs font-semibold text-brand hover:text-brand/80 transition-colors"
                        >
                          {showEmojiPicker ? 'Fechar' : 'Trocar'}
                        </button>
                      </div>
                      {showEmojiPicker && (
                        <div className="w-full max-w-[300px] mx-auto [&_.EmojiPickerReact]:!w-full [&_.EmojiPickerReact]:!h-[280px]">
                          <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Partida ── */}
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Partida</h2>

                <Card>
                  <SettingRow icon="👑" label="Pontos para vencer">
                    <Stepper value={config.pointsToWin} onDecrease={() => adjust('pointsToWin', -1)} onIncrease={() => adjust('pointsToWin', 1)} />
                  </SettingRow>

                  <Divider />

                  <SettingRow icon="🏆" label="Limite de vitórias (sai com X)">
                    <Stepper value={config.maxWins} onDecrease={() => updateConfig({ maxWins: Math.max(1, config.maxWins - 1) })} onIncrease={() => updateConfig({ maxWins: config.maxWins + 1 })} />
                  </SettingRow>

                  {config.setsEnabled && (
                    <>
                      <Divider />

                      <SettingRow icon="↔️" label="Margem para vencer o set">
                        <Stepper value={config.margin} onDecrease={() => adjust('margin', -1)} onIncrease={() => adjust('margin', 1)} />
                      </SettingRow>

                      <Divider />

                      <SettingRow icon="🏆" label="Total de sets na partida">
                        <Stepper value={totalSets} onDecrease={() => adjust('totalSets', -1)} onIncrease={() => adjust('totalSets', 1)} />
                      </SettingRow>

                      <div className="text-xs font-medium text-gray-500 pl-8 -mt-1">
                        Vence quem fizer {derivedSetsToWin} sets
                      </div>
                    </>
                  )}
                </Card>

                {/* ── Cronômetro ── */}
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Cronômetro</h2>

                <Card>
                  <SettingRow icon="⏱️" label="Duração do cronômetro">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                      <span>∞</span>
                      <span className="text-gray-300 font-normal">|</span>
                      <span>{config.timerDuration} min</span>
                      <span className="text-gray-400 ml-0.5">✎</span>
                    </div>
                  </SettingRow>

                  <Divider />

                  <SettingRow icon="⏰" label="Contagem regressiva">
                    <Toggle checked={config.timerCountdown} onChange={v => updateConfig({ timerCountdown: v })} />
                  </SettingRow>

                  <Divider />

                  <SettingRow icon="🔊" label="Som do cronômetro">
                    <Toggle checked={config.timerSound} onChange={v => updateConfig({ timerSound: v })} />
                  </SettingRow>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Helper Components ───────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-2 space-y-0">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 mx-0" />;
}

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
    <div className={`flex items-center justify-between py-2.5 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-2.5 text-sm">
        <span className="text-base w-5 text-center shrink-0">{icon}</span>
        <span className={`font-semibold ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({
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
      <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-brand" />
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
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold transition-colors"
      >
        −
      </button>
      <span className="text-sm font-bold text-gray-800 w-6 text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={onIncrease}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold transition-colors"
      >
        +
      </button>
    </div>
  );
}

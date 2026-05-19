import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { GameConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  onConfigChange: (config: GameConfig) => void;
}

export function ThemeModal({ isOpen, onClose, config, onConfigChange }: Props) {
  const toggle = (key: keyof GameConfig) => {
    if (key === 'orientation') {
      onConfigChange({ ...config, orientation: config.orientation === 'normal' ? 'inverted' : 'normal' });
    } else if (typeof config[key] === 'boolean') {
      onConfigChange({ ...config, [key]: !config[key] });
    }
  };

  const adjustTimer = (delta: number) => {
    const val = config.timerDuration + delta;
    if (val < 1 || val > 60) return;
    onConfigChange({ ...config, timerDuration: val });
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
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">📐 Exibição</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Toggle options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <ToggleButton
                label="Orientação"
                value={config.orientation === 'inverted' ? 'Invertido' : 'Normal'}
                active={config.orientation === 'inverted'}
                onClick={() => toggle('orientation')}
              />
              <ToggleButton
                label="Fundo escuro"
                value={config.darkTheme ? 'Ativado' : 'Desativado'}
                active={config.darkTheme}
                onClick={() => toggle('darkTheme')}
              />
              <ToggleButton
                label="Cronômetro"
                value={config.timerEnabled ? 'Ligado' : 'Desligado'}
                active={config.timerEnabled}
                onClick={() => toggle('timerEnabled')}
              />
              <ToggleButton
                label="Sets"
                value={config.setsEnabled ? 'Ligado' : 'Desligado'}
                active={config.setsEnabled}
                onClick={() => toggle('setsEnabled')}
              />
              <ToggleButton
                label="Vibração"
                value={config.vibration ? 'Ativado' : 'Desativado'}
                active={config.vibration}
                onClick={() => toggle('vibration')}
              />
              <ToggleButton
                label="Deslizar"
                value={config.swipeToDecrease ? 'Ativado' : 'Desativado'}
                active={config.swipeToDecrease}
                onClick={() => toggle('swipeToDecrease')}
              />
            </div>

            {/* Timer duration — visible when timer is on */}
            {config.timerEnabled && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Duração (minutos)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustTimer(-1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-bold"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-gray-800 w-8 text-center tabular-nums">
                    {config.timerDuration}
                  </span>
                  <button
                    onClick={() => adjustTimer(1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToggleButton({ label, value, active, onClick }: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition-all text-sm
        ${active
          ? 'border-brand bg-brand/5 text-brand font-semibold'
          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
        }
      `}
    >
      <span className="text-xs font-medium">{label}</span>
      <span className={`text-xs ${active ? 'text-brand' : 'text-gray-400'}`}>
        {value}
      </span>
    </button>
  );
}

import React from 'react';
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
              <h2 className="text-lg font-bold text-gray-800">🎨 Escolher tema</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Toggle options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <ToggleButton
                label="Orientação"
                value={config.orientation === 'inverted' ? 'Invertido' : 'Normal'}
                active={config.orientation === 'inverted'}
                onClick={() => toggle('orientation')}
              />
              <ToggleButton
                label="Escuro"
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
            </div>

            {/* Preview do placar */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="flex h-24">
                <div className="flex-1 bg-[#2979D0] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white/80 text-xs font-semibold">
                      {config.orientation === 'inverted' ? 'Time Vermelho' : 'Time Azul'}
                    </div>
                    <div className="text-white text-3xl font-black tabular-nums">10</div>
                  </div>
                </div>
                <div className="flex-1 bg-[#C0392B] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white/80 text-xs font-semibold">
                      {config.orientation === 'inverted' ? 'Time Azul' : 'Time Vermelho'}
                    </div>
                    <div className="text-white text-3xl font-black tabular-nums">7</div>
                  </div>
                </div>
              </div>
            </div>
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

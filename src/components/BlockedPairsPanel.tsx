import { Ban, ChevronLeft, X } from 'lucide-react';
import type { BlockedPair } from '../types';

interface BlockedPairsPanelProps {
  showBlockedPanel: boolean;
  blockedPairs: BlockedPair[];
  onClose: () => void;
  onUnblockPair: (pair: BlockedPair) => void;
}

export function BlockedPairsPanel({
  showBlockedPanel,
  blockedPairs,
  onClose,
  onUnblockPair,
}: BlockedPairsPanelProps) {
  if (!showBlockedPanel) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      <div className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Ban size={16} className="text-red-500" />
            Pares bloqueados
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {blockedPairs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            Nenhum par bloqueado.
          </p>
        ) : (
          <div className="space-y-2">
            {blockedPairs.map(pair => (
              <div
                key={`${pair.personId1}-${pair.personId2}`}
                className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2"
              >
                <span className="text-sm text-gray-700">
                  {pair.personName1} <span className="text-red-500">🚫</span> {pair.personName2}
                </span>
                <button
                  onClick={() => onUnblockPair(pair)}
                  className="p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                  title="Desbloquear par"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

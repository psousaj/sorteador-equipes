import { Crown } from 'lucide-react';

interface CaptainToggleProps {
  enableCaptain: boolean;
  onToggle: (value: boolean) => void;
  captainTooltipOpen: boolean;
  onToggleTooltip: () => void;
  captainTooltipRef: React.RefObject<HTMLDivElement>;
}

export function CaptainToggle({
  enableCaptain,
  onToggle,
  captainTooltipOpen,
  onToggleTooltip,
  captainTooltipRef,
}: CaptainToggleProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Crown size={16} />
          Capitão automático
          <div className="relative" ref={captainTooltipRef}>
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTooltip();
              }}
            >
              ?
            </span>
            {captainTooltipOpen && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-10">
                Seleciona um capitão aleatório por time no sorteio
              </span>
            )}
          </div>
        </label>
        <button
          onClick={() => onToggle(!enableCaptain)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            enableCaptain ? 'bg-brand' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              enableCaptain ? 'translate-x-5.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {enableCaptain && (
        <p className="text-xs text-gray-400 mt-2">
          Um capitão aleatório será sorteado para cada time.
        </p>
      )}
    </div>
  );
}

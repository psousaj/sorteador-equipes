import { AlertTriangle } from 'lucide-react';

interface ErrorModalProps {
  showErrorModal: boolean;
  drawError: string | null;
  onClose: () => void;
}

export function ErrorModal({ showErrorModal, drawError, onClose }: ErrorModalProps) {
  if (!showErrorModal || !drawError) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-display font-bold text-gray-800">
            Não foi possível sortear
          </h3>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="text-sm text-red-700 whitespace-pre-wrap">
            {drawError.split('\n').map((line, i) => (
              <div key={i} className="flex items-start gap-2 mb-1 last:mb-0">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

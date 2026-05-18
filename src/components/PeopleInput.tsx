import { UserPlus } from 'lucide-react';

interface PeopleInputProps {
  importedNames: string;
  onTextChange: (value: string) => void;
  onImport: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  soundEnabled: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  peopleLength: number;
}

export function PeopleInput({
  importedNames,
  onTextChange,
  onImport,
  onKeyDown,
  textareaRef,
  peopleLength,
}: PeopleInputProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <UserPlus size={16} />
        Adicionar pessoas
      </label>
      <textarea
        ref={textareaRef}
        value={importedNames}
        onChange={(e) => {
          onTextChange(e.target.value);
          // Auto-grow
          const el = e.target;
          el.style.height = 'auto';
          el.style.height = Math.max(80, el.scrollHeight) + 'px';
        }}
        onKeyDown={onKeyDown}
        placeholder="João, Maria, Pedro, Ana...&#10;(um por linha ou separados por vírgula)"
        className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all overflow-hidden"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={onImport}
          className="flex-1 bg-brand text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors"
        >
          Importar
        </button>
      </div>
      {peopleLength > 0 && (
        <p className="text-xs text-gray-400 mt-1">{peopleLength} pessoa(s) importada(s)</p>
      )}
    </div>
  );
}

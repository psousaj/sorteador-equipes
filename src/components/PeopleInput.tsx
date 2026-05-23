import { useEffect, useRef, useState } from 'react';
import { UserPlus, Check } from 'lucide-react';

interface PeopleInputProps {
  importedNames: string;
  onTextChange: (value: string) => void;
  onImport: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  soundEnabled: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  peopleLength: number;
  importCount: number;
}

export function PeopleInput({
  importedNames,
  onTextChange,
  onImport,
  onKeyDown,
  soundEnabled,
  textareaRef,
  peopleLength,
  importCount,
}: PeopleInputProps) {
  const [flash, setFlash] = useState(false);
  const prevCountRef = useRef(importCount);

  // Trigger green flash whenever importCount increments
  useEffect(() => {
    if (importCount > prevCountRef.current) {
      setFlash(true);
      prevCountRef.current = importCount;
      const timer = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = importCount;
  }, [importCount]);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <UserPlus size={16} />
        Adicionar pessoas
      </label>
      <div className="relative">
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
          className={`w-full min-h-[80px] px-3 py-2 text-sm border rounded-xl resize-none focus:outline-none transition-all duration-300 overflow-hidden ${
            flash
              ? 'border-green-400 ring-2 ring-green-200 bg-green-50'
              : 'focus:ring-2 focus:ring-brand/30 focus:border-brand'
          }`}
        />
        {/* Success checkmark overlay */}
        {flash && (
          <div className="absolute top-2 right-2 text-green-500 animate-bounce">
            <Check size={20} />
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-2 items-center">
        <button
          onClick={onImport}
          className={`flex-1 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
            flash
              ? 'bg-green-500 scale-[0.97]'
              : 'bg-brand hover:bg-brand-dark'
          }`}
        >
          {flash ? 'Importado ✓' : 'Importar'}
        </button>
      </div>
      {peopleLength > 0 && (
        <p className={`text-xs mt-1 transition-colors duration-300 ${
          flash ? 'text-green-600 font-semibold' : 'text-gray-400'
        }`}>
          {peopleLength} pessoa(s) importada(s)
        </p>
      )}
    </div>
  );
}

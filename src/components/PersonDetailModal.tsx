import { X, Trash2 } from 'lucide-react';
import { DEFAULT_TAGS } from '../types';
import type { Person } from '../types';

interface PersonDetailModalProps {
  selectedPerson: Person | null;
  onClose: () => void;
  editingName: string | null;
  editNameValue: string;
  onStartEditing: (person: Person) => void;
  onSaveName: () => void;
  onNameChange: (value: string) => void;
  onNameKeyDown: (e: React.KeyboardEvent) => void;
  onRemove: (id: string, name: string) => void;
  onRemoveTag?: (id: string, tag: string) => void;
  nameInputRef: React.RefObject<HTMLInputElement>;
}

export function PersonDetailModal({
  selectedPerson,
  onClose,
  editingName,
  editNameValue,
  onStartEditing,
  onSaveName,
  onNameChange,
  onNameKeyDown,
  onRemove,
  onRemoveTag,
  nameInputRef,
}: PersonDetailModalProps) {
  if (!selectedPerson) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { onClose(); }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-4">
          <div className="text-4xl mb-2">
            {selectedPerson.gender === 'male' ? '🚹' : selectedPerson.gender === 'female' ? '🚺' : '❓'}
          </div>
          {editingName === selectedPerson.id ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editNameValue}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={onSaveName}
              onKeyDown={onNameKeyDown}
              className="text-xl font-display font-bold text-gray-800 text-center w-full border-b-2 border-brand/50 outline-none bg-transparent"
            />
          ) : (
            <h3
              className="text-xl font-display font-bold text-gray-800 cursor-pointer hover:text-brand transition-colors"
              onClick={() => onStartEditing(selectedPerson)}
            >
              {selectedPerson.name}
            </h3>
          )}
          <p className="text-xs text-gray-400 mt-1">Clique no nome para editar</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6">
          {selectedPerson.tags.length === 0 && (
            <span className="text-xs text-gray-400">Nenhuma tag</span>
          )}
          {selectedPerson.tags.map(tag => {
            const tagDef = DEFAULT_TAGS.find(t => t.value === tag);
            const tagColor = tagDef?.color || 'bg-gray-100 text-gray-600';
            const tagLabel = tagDef?.label || tag;
            return (
              <button
                key={tag}
                onClick={() => onRemoveTag?.(selectedPerson.id, tag)}
                className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${tagColor}`}
              >
                {tagLabel}
                <span className="text-[10px] opacity-60 hover:opacity-100">×</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={() => onRemove(selectedPerson.id, selectedPerson.name)}
            className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Remover {editingName === selectedPerson.id ? editNameValue || selectedPerson.name : selectedPerson.name}
          </button>
        </div>
      </div>
    </div>
  );
}

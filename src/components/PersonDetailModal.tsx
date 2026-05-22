import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { DEFAULT_TAGS } from '../types';
import type { Person } from '../types';

interface PersonDetailModalProps {
  person: Person | null;
  onClose: () => void;
  editingName: string | null;
  editNameValue: string;
  onStartEditing: (person: Person) => void;
  onSaveName: () => void;
  onNameChange: (value: string) => void;
  onNameKeyDown: (e: React.KeyboardEvent) => void;
  onRemove: (id: string, name: string) => void;
  onRemoveTag?: (id: string, tag: string) => void;
  onGenderChange?: (id: string, gender: Person['gender']) => void;
  nameInputRef: React.RefObject<HTMLInputElement>;
}

export function PersonDetailModal({
  person,
  onClose,
  editingName,
  editNameValue,
  onStartEditing,
  onSaveName,
  onNameChange,
  onNameKeyDown,
  onRemove,
  onRemoveTag,
  onGenderChange,
  nameInputRef,
}: PersonDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!person) return null;

  const handleRemove = () => {
    onRemove(person.id, person.name);
    setConfirmDelete(false);
  };

  const genderOptions: { value: Person['gender']; label: string; icon: string; color: string }[] = [
    { value: 'male', label: 'Masculino', icon: '♂', color: 'text-blue-500' },
    { value: 'female', label: 'Feminino', icon: '♀', color: 'text-pink-500' },
    { value: 'unknown', label: 'Indefinido', icon: '?', color: 'text-orange-400' },
  ];

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
          {/* Gender radio */}
          <div className="flex justify-center gap-2 mb-3">
            {genderOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onGenderChange?.(person.id, opt.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                  person.gender === opt.value
                    ? opt.value === 'male'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : opt.value === 'female'
                        ? 'border-pink-400 bg-pink-50 text-pink-700'
                        : 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <span className={`text-base font-bold ${opt.color}`}>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>

          {editingName === person.id ? (
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
              onClick={() => onStartEditing(person)}
            >
              {person.name}
            </h3>
          )}
          <p className="text-xs text-gray-400 mt-1">Clique no nome para editar</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6">
          {person.tags.length === 0 && (
            <span className="text-xs text-gray-400">Nenhuma tag</span>
          )}
          {person.tags.map(tag => {
            const tagDef = DEFAULT_TAGS.find(t => t.value === tag);
            const tagColor = tagDef?.color || 'bg-gray-100 text-gray-600';
            const tagLabel = tagDef?.label || tag;
            return (
              <button
                key={tag}
                onClick={(e) => { e.stopPropagation(); onRemoveTag?.(person.id, tag); }}
                className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${tagColor}`}
              >
                {tagLabel}
                <span className="text-[10px] opacity-60 hover:opacity-100">×</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 mt-6">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Remover {editingName === person.id ? editNameValue || person.name : person.name}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-600 text-center font-medium">
                Tem certeza que deseja remover <strong>{person.name}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRemove}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
                >
                  Sim, remover
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

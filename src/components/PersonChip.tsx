import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Person } from '../types';
import { DEFAULT_TAGS } from '../types';
import { TEAM_COLORS } from '../types';

interface PersonChipProps {
  person: Person;
  index: number;
  onGenderChange: (id: string, gender: Person['gender']) => void;
  onToggleTag: (id: string, tag: string) => void;
  onRemove: (id: string) => void;
  onClickName: (person: Person) => void;
  availableTags: string[];
  customTags: string[];
  onAddCustomTag: (id: string, tag: string) => void;
}

const genderEmoji: Record<string, string> = {
  male: '🚹',
  female: '🚺',
  unknown: '❓',
};

export function PersonChip({
  person,
  index,
  onGenderChange,
  onToggleTag,
  onRemove,
  onClickName,
  availableTags,
  customTags,
  onAddCustomTag,
}: PersonChipProps) {
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  const colorIndex = index % TEAM_COLORS.length;

  const genderBorder = person.gender === 'male'
    ? 'border-blue-300'
    : person.gender === 'female'
      ? 'border-pink-300'
      : 'border-orange-300';

  // Close tag menu on click outside
  useEffect(() => {
    if (!tagMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setTagMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [tagMenuOpen]);

  return (
    <div
      className={`
        relative group rounded-xl border-2 p-3 transition-all duration-200
        ${genderBorder} bg-white hover:shadow-md hover:border-brand-light
      `}
    >
      {/* Header: Name + Gender + Remove */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const genders: Person['gender'][] = ['male', 'female', 'unknown'];
            const idx = genders.indexOf(person.gender);
            onGenderChange(person.id, genders[(idx + 1) % genders.length]);
          }}
          className="text-lg hover:scale-110 transition-transform cursor-pointer"
          title="Clique para alternar gênero"
        >
          {genderEmoji[person.gender]}
        </button>
        <span
          className="font-body font-semibold text-gray-800 flex-1 truncate cursor-pointer hover:text-brand transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClickName(person);
          }}
        >
          {person.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(person.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {[...DEFAULT_TAGS.filter(t => person.tags.includes(t.value))].map(tag => (
          <button
            key={tag.value}
            onClick={(e) => {
              e.stopPropagation();
              onToggleTag(person.id, tag.value);
            }}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.color} hover:opacity-75 transition-opacity`}
          >
            {tag.label} ✕
          </button>
        ))}
        {customTags.filter(t => person.tags.includes(t)).map(tag => (
          <button
            key={tag}
            onClick={(e) => {
              e.stopPropagation();
              onToggleTag(person.id, tag);
            }}
            className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 hover:opacity-75 transition-opacity"
          >
            {tag} ✕
          </button>
        ))}
        {/* Add tag button */}
        <div className="relative" ref={tagMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTagMenuOpen(prev => !prev);
            }}
            className="text-xs px-2 py-0.5 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand hover:text-brand transition-colors"
          >
            + Tag
          </button>
          {tagMenuOpen && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-white border rounded-xl shadow-xl p-2 min-w-[140px]">
              {availableTags
                .filter(t => !person.tags.includes(t))
                .map(tag => (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTag(person.id, tag);
                      setTagMenuOpen(false);
                    }}
                    className="block w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              {availableTags.filter(t => !person.tags.includes(t)).length === 0 && (
                <span className="text-xs text-gray-400 px-2">Todas tags já adicionadas</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom tag input */}
      <div className="mt-2 flex gap-1">
        <input
          type="text"
          placeholder="Tag personalizada..."
          className="w-3/5 text-xs px-2 py-1 border rounded-lg focus:outline-none focus:border-brand"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim();
              if (value) {
                onAddCustomTag(person.id, value.toLowerCase());
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

import { X } from 'lucide-react';
import type { Person } from '../types';
import { DEFAULT_TAGS } from '../types';
import { TEAM_COLORS } from '../types';

interface PersonChipProps {
  person: Person;
  index: number;
  onGenderChange: (id: string, gender: Person['gender']) => void;
  onToggleTag: (id: string, tag: string) => void;
  onToggleBlock: (id: string) => void;
  onRemove: (id: string) => void;
  isInBlockMode: boolean;
  blockedBySomeone: boolean;
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
  onToggleBlock,
  onRemove,
  isInBlockMode,
  blockedBySomeone,
  availableTags,
  customTags,
  onAddCustomTag,
}: PersonChipProps) {
  const colorIndex = index % TEAM_COLORS.length;

  const genderBorder = person.gender === 'male'
    ? 'border-blue-300'
    : person.gender === 'female'
      ? 'border-pink-300'
      : 'border-orange-300';

  return (
    <div
      className={`
        relative group rounded-xl border-2 p-3 transition-all duration-200
        ${isInBlockMode
          ? 'border-red-400 bg-red-50 shadow-lg scale-105'
          : blockedBySomeone
            ? 'border-red-300 bg-red-50/50'
            : `${genderBorder} bg-white hover:shadow-md hover:border-brand-light`
        }
      `}
      onClick={() => isInBlockMode && onToggleBlock(person.id)}
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
        <span className="font-body font-semibold text-gray-800 flex-1 truncate">
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
        <div className="relative group/tag">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const menu = (e.target as HTMLElement)
                .closest('.group')!
                .querySelector('.tag-menu') as HTMLElement;
              if (menu) menu.classList.toggle('hidden');
            }}
            className="text-xs px-2 py-0.5 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand hover:text-brand transition-colors"
          >
            + Tag
          </button>
          <div className="tag-menu hidden absolute top-full left-0 mt-1 z-20 bg-white border rounded-xl shadow-xl p-2 min-w-[140px]">
            {availableTags
              .filter(t => !person.tags.includes(t))
              .map(tag => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTag(person.id, tag);
                    const menu = (e.target as HTMLElement).closest('.tag-menu')!;
                    menu.classList.add('hidden');
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
        </div>
      </div>

      {/* Custom tag input */}
      <div className="mt-2 flex gap-1">
        <input
          type="text"
          placeholder="Tag personalizada..."
          className="flex-1 text-xs px-2 py-1 border rounded-lg focus:outline-none focus:border-brand"
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

      {/* Block indicator */}
      {person.blockedWith.length > 0 && (
        <div className="mt-1.5 text-xs text-red-500 font-medium">
          🚫 {person.blockedWith.length} bloqueio(s)
        </div>
      )}
    </div>
  );
}

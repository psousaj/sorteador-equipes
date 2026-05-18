import { Users, Ban, List, Trash2 } from 'lucide-react';
import { PersonChip } from './PersonChip';
import type { Person, BlockedPair } from '../types';

interface PeopleListProps {
  people: Person[];
  blockModePersonId: string | null;
  onToggleBlockMode: () => void;
  onBlockPersonClick: (personId: string) => void;
  onClearPeople: () => void;
  onRemovePerson: (id: string, name: string) => void;
  onClickName: (person: Person) => void;
  blockedPairs: BlockedPair[];
  onShowBlockedPanel: () => void;
  showBlockedPanel: boolean;
  personTags: string[];
  customTags: string[];
  onGenderChange: (id: string, gender: Person['gender']) => void;
  onToggleTag: (id: string, tag: string) => void;
  onAddCustomTag: (id: string, tag: string) => void;
  setBlockModePersonId: (id: string | null) => void;
}

export function PeopleList({
  people,
  blockModePersonId,
  onToggleBlockMode,
  onBlockPersonClick,
  onClearPeople,
  onRemovePerson,
  onClickName,
  blockedPairs,
  onShowBlockedPanel,
  showBlockedPanel,
  personTags,
  customTags,
  onGenderChange,
  onToggleTag,
  onAddCustomTag,
  setBlockModePersonId,
}: PeopleListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Users size={14} />
            Pessoas ({people.length})
          </h2>
          <button
            onClick={onToggleBlockMode}
            className={`p-1.5 rounded-lg transition-colors ${
              blockModePersonId !== null
                ? 'bg-red-100 text-red-600 border border-red-300'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent'
            }`}
            title={blockModePersonId !== null ? 'Sair do modo bloqueio' : 'Bloquear pares'}
          >
            <Ban size={16} />
          </button>
          <button
            onClick={onShowBlockedPanel}
            className={`p-1.5 rounded-lg transition-colors relative ${
              showBlockedPanel
                ? 'bg-orange-100 text-orange-600 border border-orange-300'
                : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 border border-transparent'
            }`}
            title="Pares bloqueados"
          >
            <List size={16} />
            {blockedPairs.length > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {blockedPairs.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {blockModePersonId !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500 font-medium animate-pulse">
                {blockModePersonId === '__active__'
                  ? 'Clique em 2 pessoas para bloquear par 🚫'
                  : 'Clique em outra pessoa para bloquear o par 🚫'}
              </span>
              <button
                onClick={() => setBlockModePersonId(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancelar
              </button>
            </div>
          )}
          <button
            onClick={onClearPeople}
            className="text-xs flex items-center gap-1 text-red-400 hover:text-red-600 font-semibold transition-colors"
            title="Limpar lista de pessoas"
          >
            <Trash2 size={14} />
            Limpar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {people.map((person, idx) => {
          const isBlockModeTarget =
            blockModePersonId !== null &&
            (blockModePersonId === '__active__' || blockModePersonId !== person.id);
          return (
            <PersonChip
              key={person.id}
              person={person}
              index={idx}
              onGenderChange={onGenderChange}
              onToggleTag={onToggleTag}
              onRemove={(id) => onRemovePerson(id, person.name)}
              onClickName={onClickName}
              availableTags={personTags}
              customTags={customTags}
              onAddCustomTag={onAddCustomTag}
              isBlockModeTarget={isBlockModeTarget}
              onBlockSelect={onBlockPersonClick}
            />
          );
        })}
      </div>
    </div>
  );
}

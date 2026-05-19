import { X } from 'lucide-react';
import type { TeamRule } from '../types';

interface RuleRowProps {
  rule: TeamRule;
  tagLabel: string;
  tagColor: string;
  onRemove: (id: string) => void;
}

export function RuleRow({ rule, tagLabel, tagColor, onRemove }: RuleRowProps) {
  const typeLabel = {
    min: 'Mínimo',
    max: 'Máximo',
    exact: 'Exato',
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 hover:shadow-sm transition-shadow">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor}`}>
        {tagLabel}
      </span>
      <span className="text-xs text-gray-500 font-medium">{typeLabel[rule.type]}</span>
      <span className="text-sm font-bold text-gray-800">{rule.perTeam}</span>
      <span className="text-xs text-gray-400">por time</span>
      <button
        onClick={() => onRemove(rule.id)}
        className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

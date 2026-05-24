import { useState } from 'react';
import { X } from 'lucide-react';
import { positiveInt } from '../lib/validation';
import { toast } from 'sonner';
import type { TeamRule } from '../types';

interface RuleRowProps {
  rule: TeamRule;
  tagLabel: string;
  tagColor: string;
  onRemove: (id: string) => void;
  onUpdate: (id: string, perTeam: number) => void;
}

export function RuleRow({ rule, tagLabel, tagColor, onRemove, onUpdate }: RuleRowProps) {
  const [raw, setRaw] = useState(String(rule.perTeam));

  const typeLabel = {
    min: 'Mínimo',
    max: 'Máximo',
    exact: 'Exato',
  };

  const handleBlur = () => {
    const result = positiveInt.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setRaw(String(rule.perTeam));
      return;
    }
    if (result.data !== rule.perTeam) {
      onUpdate(rule.id, result.data);
    }
    setRaw(String(result.data));
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 hover:shadow-sm transition-shadow">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor}`}>
        {tagLabel}
      </span>
      <span className="text-xs text-gray-500 font-medium">{typeLabel[rule.type]}</span>
      <input
        type="number"
        min={1}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        className="w-12 text-center text-sm font-bold text-gray-800 px-1 py-0.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand"
      />
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

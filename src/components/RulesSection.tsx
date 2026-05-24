import { Settings2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';
import { RuleRow } from './RuleRow';
import { DEFAULT_TAGS } from '../types';
import { positiveInt } from '../lib/validation';
import { toast } from 'sonner';
import type { TeamRule } from '../types';
import { playClickSound, playPopSound } from '../lib/sounds';

interface RulesSectionProps {
  rules: TeamRule[];
  availableRuleTags: { value: string; label: string }[];
  soundEnabled: boolean;
  onAddRule: (rule: TeamRule) => void;
  onRemoveRule: (id: string) => void;
  onUpdateRule: (id: string, perTeam: number) => void;
}

const TAG_COLORS: Record<string, string> = {
  iniciante: 'bg-green-100 text-green-800',
  experiente: 'bg-yellow-100 text-yellow-800',
};

export function RulesSection({
  rules,
  availableRuleTags,
  soundEnabled,
  onAddRule,
  onRemoveRule,
  onUpdateRule,
}: RulesSectionProps) {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRuleTag, setNewRuleTag] = useState('');
  const [newRuleType, setNewRuleType] = useState<'min' | 'max' | 'exact'>('min');
  const [newRuleValue, setNewRuleValue] = useState(1);

  const handleAddRule = () => {
    if (!newRuleTag) return;
    const result = positiveInt.safeParse(newRuleValue);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    const rule: TeamRule = {
      id: uuidv4(),
      tag: newRuleTag,
      type: newRuleType,
      perTeam: result.data,
    };
    onAddRule(rule);
    setShowRuleForm(false);
    setNewRuleTag('');
    setNewRuleType('min');
    setNewRuleValue(1);
    if (soundEnabled) playPopSound();
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Settings2 size={16} />
          Regras
        </label>
        <button
          onClick={() => {
            setShowRuleForm(!showRuleForm);
            if (soundEnabled) playClickSound();
          }}
          className="text-xs flex items-center gap-1 text-brand hover:text-brand-dark font-semibold transition-colors"
        >
          <Plus size={14} />
          Adicionar regra
        </button>
      </div>

      {rules.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {rules.map(rule => {
            const tagDef = DEFAULT_TAGS.find(t => t.value === rule.tag);
            const tagColor = TAG_COLORS[rule.tag] || 'bg-gray-100 text-gray-600';
            const tagLabel = tagDef?.label || rule.tag;
            return (
              <RuleRow
                key={rule.id}
                rule={rule}
                tagLabel={tagLabel}
                tagColor={tagColor}
                onRemove={onRemoveRule}
                onUpdate={onUpdateRule}
              />
            );
          })}
        </div>
      )}

      {rules.length === 0 && !showRuleForm && (
        <p className="text-xs text-gray-400">Nenhuma regra ainda. Times serão sorteados aleatoriamente.</p>
      )}

      {/* Rule form */}
      {showRuleForm && (
        <div className="bg-orange-50 rounded-xl p-3 space-y-2 border border-orange-200">
          <select
            value={newRuleTag}
            onChange={(e) => setNewRuleTag(e.target.value)}
            className="w-full text-sm px-3 py-1.5 rounded-lg border focus:outline-none focus:border-brand"
          >
            <option value="">Selecione uma tag...</option>
            {availableRuleTags.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value as any)}
              className="flex-1 text-sm px-2 py-1.5 rounded-lg border focus:outline-none focus:border-brand"
            >
              <option value="min">Mínimo</option>
              <option value="max">Máximo</option>
              <option value="exact">Exato</option>
            </select>
            <input
              type="number"
              min={1}
              value={newRuleValue}
              onChange={(e) => setNewRuleValue(Number(e.target.value))}
              className="w-16 text-center text-sm px-2 py-1.5 rounded-lg border focus:outline-none focus:border-brand"
            />
            <span className="text-xs text-gray-500 self-center">por time</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddRule}
              disabled={!newRuleTag}
              className="flex-1 bg-brand text-white text-sm font-semibold py-1.5 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              Adicionar
            </button>
            <button
              onClick={() => setShowRuleForm(false)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Settings2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
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

const GENDER_OPTIONS = [
  { value: 'male', label: '♂ Homens' },
  { value: 'female', label: '♀ Mulheres' },
];

export function RulesSection({
  rules,
  availableRuleTags,
  soundEnabled,
  onAddRule,
  onRemoveRule,
  onUpdateRule,
}: RulesSectionProps) {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRuleKind, setNewRuleKind] = useState<'tag' | 'gender'>('tag');
  const [newRuleTag, setNewRuleTag] = useState('');
  const [newRuleGender, setNewRuleGender] = useState('male');
  const [newRuleType, setNewRuleType] = useState<'min' | 'max' | 'exact'>('min');
  const [newRuleValue, setNewRuleValue] = useState(1);

  const handleAddRule = () => {
    if (newRuleKind === 'tag' && !newRuleTag) return;
    const result = positiveInt.safeParse(newRuleValue);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    const rule: TeamRule = {
      id: uuidv4(),
      tag: newRuleKind === 'tag' ? newRuleTag : newRuleGender,
      type: newRuleType,
      perTeam: result.data,
      kind: newRuleKind,
    };
    onAddRule(rule);
    setShowRuleForm(false);
    setNewRuleKind('tag');
    setNewRuleTag('');
    setNewRuleGender('male');
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
            const tagLabel = rule.kind === 'gender'
              ? (rule.tag === 'male' ? '♂ Homens' : '♀ Mulheres')
              : (tagDef?.label || rule.tag);
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
          {/* Kind toggle */}
          <div className="flex gap-1 bg-orange-100 rounded-lg p-0.5">
            <button
              onClick={() => { setNewRuleKind('tag'); setNewRuleTag(''); }}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                newRuleKind === 'tag'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🏷️ Tag
            </button>
            <button
              onClick={() => setNewRuleKind('gender')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                newRuleKind === 'gender'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⚥ Gênero
            </button>
          </div>

          {newRuleKind === 'tag' ? (
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
          ) : (
            <select
              value={newRuleGender}
              onChange={(e) => setNewRuleGender(e.target.value)}
              className="w-full text-sm px-3 py-1.5 rounded-lg border focus:outline-none focus:border-brand"
            >
              {GENDER_OPTIONS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          )}

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
              disabled={newRuleKind === 'tag' && !newRuleTag}
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

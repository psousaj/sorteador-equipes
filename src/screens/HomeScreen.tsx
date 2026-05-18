import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users, Settings2, Shuffle, Volume2, VolumeX, Crown,
  Plus, AlertTriangle, History, Trash2, UserPlus, X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { PersonChip } from '../components/PersonChip';
import { DEFAULT_TAGS } from '../types';
import type { TeamRule, Person } from '../types';
import { RuleRow } from '../components/RuleRow';
import { playPopSound, playClickSound } from '../lib/sounds';
import { saveCustomTags, getCustomTags } from '../lib/storage';

const TAG_COLORS: Record<string, string> = {
  masculino: 'bg-blue-100 text-blue-800',
  feminino: 'bg-pink-100 text-pink-800',
};

export function HomeScreen() {
  const { state, dispatch, parseNames, startDraw } = useApp();
  const { people, teamSize, rules, enableCaptain, soundEnabled, importedNames, drawError } = state;

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRuleTag, setNewRuleTag] = useState('');
  const [newRuleType, setNewRuleType] = useState<'min' | 'max' | 'exact'>('min');
  const [newRuleValue, setNewRuleValue] = useState(1);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [captainTooltipOpen, setCaptainTooltipOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [blockModePersonId, setBlockModePersonId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const captainTooltipRef = useRef<HTMLDivElement>(null);

  // Load custom tags from localStorage on mount
  useEffect(() => {
    const saved = getCustomTags();
    if (saved.length > 0) {
      setCustomTags(saved);
    }
  }, []);

  // Save custom tags to localStorage whenever they change
  useEffect(() => {
    if (customTags.length > 0) {
      saveCustomTags(customTags);
    }
  }, [customTags]);

  // Close captain tooltip on click outside
  useEffect(() => {
    if (!captainTooltipOpen) return;
    function handleClick(e: MouseEvent) {
      if (captainTooltipRef.current && !captainTooltipRef.current.contains(e.target as Node)) {
        setCaptainTooltipOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [captainTooltipOpen]);

  // All available tags for rules (predefined + custom, including gender tags)
  const availableRuleTags = useMemo(() => {
    return [...DEFAULT_TAGS.map(t => ({ value: t.value, label: t.label })), ...customTags.map(t => ({ value: t, label: t }))];
  }, [customTags]);

  const numTeams = useMemo(() => {
    if (people.length === 0 || teamSize === 0) return 0;
    return Math.ceil(people.length / teamSize);
  }, [people.length, teamSize]);

  const handleImport = () => {
    if (!importedNames.trim()) return;
    if (soundEnabled) playPopSound();
    parseNames(importedNames);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleImport();
    }
  };

  const handleGenderChange = (id: string, gender: Person['gender']) => {
    dispatch({ type: 'UPDATE_PERSON_GENDER', payload: { id, gender } });
  };

  const handleToggleTag = (id: string, tag: string) => {
    dispatch({ type: 'TOGGLE_PERSON_TAG', payload: { id, tag } });
  };

  const handleAddCustomTag = (id: string, tag: string) => {
    if (!customTags.includes(tag)) {
      setCustomTags(prev => [...prev, tag]);
    }
    dispatch({ type: 'ADD_TAG_TO_PERSON', payload: { id, tag } });
  };

  const handleRemovePerson = (id: string, name: string) => {
    dispatch({ type: 'REMOVE_PERSON', payload: { id, name } });
    setSelectedPerson(null);
  };

  const handleToggleBlock = (personId: string) => {
    if (blockModePersonId === null) {
      setBlockModePersonId(personId);
      setSelectedPerson(null);
    } else if (blockModePersonId === personId) {
      setBlockModePersonId(null);
    } else {
      dispatch({
        type: 'TOGGLE_BLOCKED_PAIR',
        payload: { personId1: blockModePersonId, personId2: personId },
      });
      setBlockModePersonId(null);
    }
  };

  const handleAddRule = () => {
    if (!newRuleTag) return;
    const rule: TeamRule = {
      id: uuidv4(),
      tag: newRuleTag,
      type: newRuleType,
      value: newRuleValue,
    };
    dispatch({ type: 'ADD_RULE', payload: rule });
    setShowRuleForm(false);
    setNewRuleTag('');
    setNewRuleType('min');
    setNewRuleValue(1);
    if (soundEnabled) playPopSound();
  };

  const handleRemoveRule = (id: string) => {
    dispatch({ type: 'REMOVE_RULE', payload: id });
  };

  const handleStartDraw = () => {
    if (people.length === 0) return;
    if (soundEnabled) playClickSound();
    startDraw();
  };

  const personTags = useMemo(() => {
    const fullTags = [...DEFAULT_TAGS.map(t => t.value), ...customTags];
    return fullTags;
  }, [customTags]);

  const isPeopleReady = people.length >= teamSize && teamSize > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shadow-lg">
              <Shuffle size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display text-gray-800">Sorteador</h1>
              <p className="text-xs text-gray-500 font-body">Monte seus times em segundos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SOUND', payload: !soundEnabled })}
              className="p-2 rounded-xl hover:bg-white/80 transition-colors"
              title={soundEnabled ? 'Desativar som' : 'Ativar som'}
            >
              {soundEnabled ? <Volume2 size={20} className="text-gray-600" /> : <VolumeX size={20} className="text-gray-400" />}
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'history' })}
              className="p-2 rounded-xl hover:bg-white/80 transition-colors"
              title="Histórico"
            >
              <History size={20} className="text-gray-600" />
            </button>
          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: People Input */}
          <div className="lg:col-span-3 space-y-4">
            {/* Textarea */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <UserPlus size={16} />
                Adicionar pessoas
              </label>
              <textarea
                ref={textareaRef}
                value={importedNames}
                onChange={(e) => {
                  dispatch({ type: 'IMPORT_NAMES', payload: e.target.value });
                  // Auto-grow
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.max(80, el.scrollHeight) + 'px';
                }}
                onKeyDown={handleTextareaKeyDown}
                placeholder="João, Maria, Pedro, Ana...\n(um por linha ou separados por vírgula)"
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all overflow-hidden"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleImport}
                  className="flex-1 bg-brand text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors"
                >
                  Importar
                </button>
                {/* {people.length > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'CLEAR_PEOPLE' })}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                    title="Limpar todos"
                  >
                    <Trash2 size={16} />
                  </button>
                )} */}
              </div>
              {people.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">{people.length} pessoa(s) importada(s)</p>
              )}
            </div>

            {/* People chips */}
            {people.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Users size={14} />
                    Pessoas ({people.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    {blockModePersonId !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500 font-medium animate-pulse">
                          Clique em outra pessoa para bloquear o par 🚫
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
                      onClick={() => dispatch({ type: 'CLEAR_PEOPLE' })}
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
                    const blockedBySomeone = people.some(p => p.blockedWith.includes(person.id));
                    return (
                      <PersonChip
                      key={person.id}
                      person={person}
                      index={idx}
                      onGenderChange={handleGenderChange}
                      onToggleTag={handleToggleTag}
                      onRemove={(id) => handleRemovePerson(id, person.name)}
                      onClickName={setSelectedPerson}
                      onToggleBlock={handleToggleBlock}
                      isInBlockMode={blockModePersonId === person.id}
                      blockedBySomeone={blockedBySomeone && blockModePersonId === null}
                      availableTags={personTags}
                      customTags={customTags}
                      onAddCustomTag={handleAddCustomTag}
                    />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Config */}
          <div className="lg:col-span-2 space-y-4">
            {/* Team size */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users size={16} />
                Tamanho do time
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={teamSize}
                  onChange={(e) => dispatch({ type: 'SET_TEAM_SIZE', payload: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-20 text-center text-2xl font-bold text-brand bg-orange-50 border-2 border-brand/20 rounded-xl px-3 py-2 focus:outline-none focus:border-brand"
                />
                <span className="text-sm text-gray-500">
                  {numTeams > 0
                    ? `${numTeams} time(s) — ${people.length - (numTeams - 1) * teamSize} a ${teamSize} por time`
                    : 'Adicione pessoas primeiro'}
                </span>
              </div>
            </div>

            {/* Rules */}
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
                        onRemove={handleRemoveRule}
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
                      onChange={(e) => setNewRuleValue(Math.max(1, parseInt(e.target.value) || 1))}
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

            {/* Captain config */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Crown size={16} />
                  Capitão automático
                  <div className="relative" ref={captainTooltipRef}>
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCaptainTooltipOpen(prev => !prev);
                      }}
                    >
                      ?
                    </span>
                    {captainTooltipOpen && (
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-10">
                        Seleciona um capitão aleatório por time no sorteio
                      </span>
                    )}
                  </div>
                </label>
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_CAPTAIN', payload: !enableCaptain })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    enableCaptain ? 'bg-brand' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      enableCaptain ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              {enableCaptain && (
                <p className="text-xs text-gray-400 mt-2">
                  Um capitão aleatório será sorteado para cada time.
                </p>
              )}
            </div>

            {/* Draw error */}
            {drawError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700 whitespace-pre-wrap">{drawError}</div>
              </div>
            )}

            {/* Sortear button */}
            <button
              onClick={handleStartDraw}
              disabled={!isPeopleReady}
              className={`
                w-full py-4 rounded-2xl font-display text-xl flex items-center justify-center gap-3
                transition-all duration-300 shadow-lg
                ${isPeopleReady
                  ? 'bg-gradient-to-r from-brand to-purple-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <Shuffle size={24} />
              SORTEAR!
            </button>
            {!isPeopleReady && (
              <p className="text-xs text-center text-gray-400">
                Adicione pelo menos {teamSize} pessoa(s) para sortear
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Person detail modal */}
      {selectedPerson && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPerson(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPerson(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-4">
              <div className="text-4xl mb-2">
                {selectedPerson.gender === 'male' ? '🚹' : selectedPerson.gender === 'female' ? '🚺' : '❓'}
              </div>
              <h3 className="text-xl font-display font-bold text-gray-800">{selectedPerson.name}</h3>
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
                  <span key={tag} className={`text-xs px-3 py-1 rounded-full font-medium ${tagColor}`}>
                    {tagLabel}
                  </span>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={() => handleToggleBlock(selectedPerson.id)}
                className="w-full py-3 rounded-xl bg-orange-50 text-orange-600 font-semibold text-sm hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
              >
                🚫 Bloquear {selectedPerson.name}
              </button>
              <button
                onClick={() => handleRemovePerson(selectedPerson.id, selectedPerson.name)}
                className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Remover {selectedPerson.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

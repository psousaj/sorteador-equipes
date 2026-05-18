import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users, Settings2, Shuffle, Volume2, VolumeX, Crown,
  Plus, AlertTriangle, History, Trash2, UserPlus, X, Ban, List, ChevronLeft
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { PersonChip } from '../components/PersonChip';
import { DEFAULT_TAGS } from '../types';
import type { TeamRule, Person, BlockedPair } from '../types';
import { RuleRow } from '../components/RuleRow';
import { playPopSound, playClickSound } from '../lib/sounds';
import { saveCustomTags, getCustomTags, getBlockedPairs, saveBlockedPairs } from '../lib/storage';

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
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const captainTooltipRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  // Focus name input when editing starts
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  // Show error modal when drawError changes
  useEffect(() => {
    if (drawError) {
      setShowErrorModal(true);
    }
  }, [drawError]);

  // All available tags for rules (predefined + custom, including gender tags)
  const availableRuleTags = useMemo(() => {
    return [...DEFAULT_TAGS.map(t => ({ value: t.value, label: t.label })), ...customTags.map(t => ({ value: t, label: t }))];
  }, [customTags]);

  const numTeams = useMemo(() => {
    if (people.length === 0 || teamSize === 0) return 0;
    return Math.ceil(people.length / teamSize);
  }, [people.length, teamSize]);

  // Get blocked pairs for display
  const blockedPairs = useMemo(() => {
    const pairs: BlockedPair[] = [];
    const processed = new Set<string>();
    people.forEach(p => {
      p.blockedWith.forEach(bId => {
        const key = [p.id, bId].sort().join('::');
        if (processed.has(key)) return;
        processed.add(key);
        const other = people.find(op => op.id === bId);
        if (other) {
          pairs.push({
            personId1: p.id,
            personId2: bId,
            personName1: p.name,
            personName2: other.name,
          });
        }
      });
    });
    return pairs;
  }, [people]);

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

  const handleToggleBlockMode = () => {
    if (blockModePersonId !== null) {
      setBlockModePersonId(null);
    } else {
      setBlockModePersonId('__active__');
    }
  };

  // New block flow: click person A in mode, then person B
  const handleBlockPersonClick = (personId: string) => {
    if (blockModePersonId === '__active__') {
      // First person clicked
      setBlockModePersonId(personId);
    } else if (typeof blockModePersonId === 'string' && blockModePersonId !== '__active__') {
      if (blockModePersonId === personId) {
        // Clicking same person cancels
        setBlockModePersonId('__active__');
        return;
      }
      // Second person clicked — create pair
      dispatch({
        type: 'TOGGLE_BLOCKED_PAIR',
        payload: { personId1: blockModePersonId, personId2: personId },
      });
      setBlockModePersonId(null);
    }
  };

  const handleUnblockPair = (pair: BlockedPair) => {
    dispatch({
      type: 'TOGGLE_BLOCKED_PAIR',
      payload: { personId1: pair.personId1, personId2: pair.personId2 },
    });
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

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    dispatch({ type: 'SET_DRAW_ERROR', payload: null });
  };

  const handleStartEditingName = (person: Person) => {
    setEditingName(person.id);
    setEditNameValue(person.name);
  };

  const handleSaveName = () => {
    if (editingName && editNameValue.trim()) {
      dispatch({ type: 'UPDATE_PERSON_NAME', payload: { id: editingName, name: editNameValue.trim() } });
    }
    setEditingName(null);
    setEditNameValue('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    }
    if (e.key === 'Escape') {
      setEditingName(null);
      setEditNameValue('');
    }
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
              </div>
              {people.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">{people.length} pessoa(s) importada(s)</p>
              )}
            </div>

            {/* People chips */}
            {people.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Users size={14} />
                      Pessoas ({people.length})
                    </h2>
                    <button
                      onClick={handleToggleBlockMode}
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
                      onClick={() => setShowBlockedPanel(!showBlockedPanel)}
                      className={`p-1.5 rounded-lg transition-colors ${
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
                    const isBlockModeTarget =
                      blockModePersonId !== null &&
                      (blockModePersonId === '__active__' || blockModePersonId !== person.id);
                    return (
                      <div
                        key={person.id}
                        className={`relative ${isBlockModeTarget ? 'cursor-pointer' : ''}`}
                        onClick={() => isBlockModeTarget && handleBlockPersonClick(person.id)}
                      >
                        {isBlockModeTarget && (
                          <div className="absolute inset-0 bg-red-500/5 rounded-xl border-2 border-dashed border-red-300 z-10 pointer-events-none" />
                        )}
                        <PersonChip
                          person={person}
                          index={idx}
                          onGenderChange={handleGenderChange}
                          onToggleTag={handleToggleTag}
                          onRemove={(id) => handleRemovePerson(id, person.name)}
                          onClickName={setSelectedPerson}
                          availableTags={personTags}
                          customTags={customTags}
                          onAddCustomTag={handleAddCustomTag}
                        />
                      </div>
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

            {/* Draw error (inline, redundancy) */}
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
              onClick={() => { setSelectedPerson(null); setEditingName(null); }}
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
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleNameKeyDown}
                  className="text-xl font-display font-bold text-gray-800 text-center w-full border-b-2 border-brand/50 outline-none bg-transparent"
                />
              ) : (
                <h3
                  className="text-xl font-display font-bold text-gray-800 cursor-pointer hover:text-brand transition-colors"
                  onClick={() => handleStartEditingName(selectedPerson)}
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
                  <span key={tag} className={`text-xs px-3 py-1 rounded-full font-medium ${tagColor}`}>
                    {tagLabel}
                  </span>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={() => handleRemovePerson(selectedPerson.id, selectedPerson.name)}
                className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Remover {editingName === selectedPerson.id ? editNameValue || selectedPerson.name : selectedPerson.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked pairs slide panel */}
      {showBlockedPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowBlockedPanel(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Ban size={16} className="text-red-500" />
                Pares bloqueados
              </h3>
              <button
                onClick={() => setShowBlockedPanel(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {blockedPairs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                Nenhum par bloqueado.
              </p>
            ) : (
              <div className="space-y-2">
                {blockedPairs.map(pair => (
                  <div
                    key={`${pair.personId1}-${pair.personId2}`}
                    className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2"
                  >
                    <span className="text-sm text-gray-700">
                      {pair.personName1} <span className="text-red-500">🚫</span> {pair.personName2}
                    </span>
                    <button
                      onClick={() => handleUnblockPair(pair)}
                      className="p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                      title="Desbloquear par"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Error modal */}
      {showErrorModal && drawError && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={handleCloseErrorModal}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-display font-bold text-gray-800">
                Não foi possível sortear
              </h3>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="text-sm text-red-700 whitespace-pre-wrap">
                {drawError.split('\n').map((line, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1 last:mb-0">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCloseErrorModal}
              className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

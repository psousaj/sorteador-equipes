import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Shuffle, Volume2, VolumeX,
  AlertTriangle, History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_TAGS } from '../types';
import type { TeamRule, Person, BlockedPair } from '../types';
import { playPopSound, playClickSound } from '../lib/sounds';
import { saveCustomTags, getCustomTags } from '../lib/storage';
import { PeopleInput } from '../components/PeopleInput';
import { PeopleList } from '../components/PeopleList';
import { TeamConfig } from '../components/TeamConfig';
import { RulesSection } from '../components/RulesSection';
import { CaptainToggle } from '../components/CaptainToggle';
import { PersonDetailModal } from '../components/PersonDetailModal';
import { ErrorModal } from '../components/ErrorModal';
import { BlockedPairsPanel } from '../components/BlockedPairsPanel';

export function HomeScreen() {
  const { state, dispatch, parseNames, startDraw } = useApp();
  const { people, teamSize, rules, enableCaptain, soundEnabled, importedNames, drawError } = state;

  const [customTags, setCustomTags] = useState<string[]>([]);
  const [captainTooltipOpen, setCaptainTooltipOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [blockModePersonId, setBlockModePersonId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null!);
  const captainTooltipRef = useRef<HTMLDivElement>(null!);
  const nameInputRef = useRef<HTMLInputElement>(null!);

  // Load custom tags from localStorage on mount
  useEffect(() => {
    const saved = getCustomTags();
    if (saved.length > 0) setCustomTags(saved);
  }, []);

  // Save custom tags to localStorage whenever they change
  useEffect(() => {
    if (customTags.length > 0) saveCustomTags(customTags);
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
    if (drawError) setShowErrorModal(true);
  }, [drawError]);

  // Computed values
  const availableRuleTags = useMemo(() => {
    return [...DEFAULT_TAGS.map(t => ({ value: t.value, label: t.label })), ...customTags.map(t => ({ value: t, label: t }))];
  }, [customTags]);

  const numTeams = useMemo(() => {
    if (people.length === 0 || teamSize === 0) return 0;
    return Math.ceil(people.length / teamSize);
  }, [people.length, teamSize]);

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
          pairs.push({ personId1: p.id, personId2: bId, personName1: p.name, personName2: other.name });
        }
      });
    });
    return pairs;
  }, [people]);

  const personTags = useMemo(() => {
    return [...DEFAULT_TAGS.map(t => t.value), ...customTags];
  }, [customTags]);

  // Handlers
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
    if (!customTags.includes(tag)) setCustomTags(prev => [...prev, tag]);
    dispatch({ type: 'ADD_TAG_TO_PERSON', payload: { id, tag } });
  };

  const handleRemovePerson = (id: string, name: string) => {
    dispatch({ type: 'REMOVE_PERSON', payload: { id, name } });
    setSelectedPerson(null);
  };

  const handleToggleBlockMode = () => {
    setBlockModePersonId(prev => prev !== null ? null : '__active__');
  };

  const handleBlockPersonClick = (personId: string) => {
    if (blockModePersonId === '__active__') {
      setBlockModePersonId(personId);
    } else if (typeof blockModePersonId === 'string' && blockModePersonId !== '__active__') {
      if (blockModePersonId === personId) {
        setBlockModePersonId('__active__');
        return;
      }
      dispatch({ type: 'TOGGLE_BLOCKED_PAIR', payload: { personId1: blockModePersonId, personId2: personId } });
      setBlockModePersonId(null);
    }
  };

  const handleUnblockPair = (pair: BlockedPair) => {
    dispatch({ type: 'TOGGLE_BLOCKED_PAIR', payload: { personId1: pair.personId1, personId2: pair.personId2 } });
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
    if (e.key === 'Enter') { e.preventDefault(); handleSaveName(); }
    if (e.key === 'Escape') { setEditingName(null); setEditNameValue(''); }
  };

  const handleTextChange = (value: string) => {
    dispatch({ type: 'IMPORT_NAMES', payload: value });
  };

  const handleAddRule = (rule: TeamRule) => {
    dispatch({ type: 'ADD_RULE', payload: rule });
  };

  const handleRemoveRule = (id: string) => {
    dispatch({ type: 'REMOVE_RULE', payload: id });
  };

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
          {/* Left: People Input + List */}
          <div className="lg:col-span-3 space-y-4">
            <PeopleInput
              importedNames={importedNames}
              onTextChange={handleTextChange}
              onImport={handleImport}
              onKeyDown={handleTextareaKeyDown}
              soundEnabled={soundEnabled}
              textareaRef={textareaRef}
              peopleLength={people.length}
            />

            {people.length > 0 && (
              <PeopleList
                people={people}
                blockModePersonId={blockModePersonId}
                onToggleBlockMode={handleToggleBlockMode}
                onBlockPersonClick={handleBlockPersonClick}
                onClearPeople={() => dispatch({ type: 'CLEAR_PEOPLE' })}
                onRemovePerson={handleRemovePerson}
                onClickName={setSelectedPerson}
                blockedPairs={blockedPairs}
                onShowBlockedPanel={() => setShowBlockedPanel(!showBlockedPanel)}
                showBlockedPanel={showBlockedPanel}
                personTags={personTags}
                customTags={customTags}
                onGenderChange={handleGenderChange}
                onToggleTag={handleToggleTag}
                onAddCustomTag={handleAddCustomTag}
                setBlockModePersonId={setBlockModePersonId}
              />
            )}
          </div>

          {/* Right: Config */}
          <div className="lg:col-span-2 space-y-4">
            <TeamConfig
              teamSize={teamSize}
              onTeamSizeChange={(value) => dispatch({ type: 'SET_TEAM_SIZE', payload: value })}
              numTeams={numTeams}
              peopleLength={people.length}
            />

            <RulesSection
              rules={rules}
              availableRuleTags={availableRuleTags}
              soundEnabled={soundEnabled}
              onAddRule={handleAddRule}
              onRemoveRule={handleRemoveRule}
            />

            <CaptainToggle
              enableCaptain={enableCaptain}
              onToggle={(value) => dispatch({ type: 'TOGGLE_CAPTAIN', payload: value })}
              captainTooltipOpen={captainTooltipOpen}
              onToggleTooltip={() => setCaptainTooltipOpen(prev => !prev)}
              captainTooltipRef={captainTooltipRef}
            />

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
      <PersonDetailModal
        selectedPerson={selectedPerson}
        onClose={() => { setSelectedPerson(null); setEditingName(null); }}
        editingName={editingName}
        editNameValue={editNameValue}
        onStartEditing={handleStartEditingName}
        onSaveName={handleSaveName}
        onNameChange={setEditNameValue}
        onNameKeyDown={handleNameKeyDown}
        onRemove={handleRemovePerson}
        nameInputRef={nameInputRef}
      />

      {/* Blocked pairs slide panel */}
      <BlockedPairsPanel
        showBlockedPanel={showBlockedPanel}
        blockedPairs={blockedPairs}
        onClose={() => setShowBlockedPanel(false)}
        onUnblockPair={handleUnblockPair}
      />

      {/* Error modal */}
      <ErrorModal
        showErrorModal={showErrorModal}
        drawError={drawError}
        onClose={handleCloseErrorModal}
      />
    </div>
  );
}

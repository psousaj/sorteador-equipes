import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Person, TeamRule, DrawConfig, Team, DrawResult, Screen, BlockedPair } from '../types';
import { getLastConfig, saveLastConfig, saveToHistory, saveBlockedPairs, getBlockedPairs } from '../lib/storage';
import { runDraw } from '../lib/sortAlgorithm';
import { inferGender } from '../lib/genderInference';

// ─── State ──────────────────────────────────────────────

interface AppState {
  screen: Screen;
  people: Person[];
  teamSize: number;
  rules: TeamRule[];
  captainTag: string;
  enableCaptain: boolean;
  soundEnabled: boolean;
  currentResult: DrawResult | null;
  animationDone: boolean;
  drawError: string | null;

  importedNames: string; // raw textarea content
}

const initialState: AppState = {
  screen: 'home',
  people: [],
  teamSize: 4,
  rules: [],
  captainTag: '',
  enableCaptain: false,
  soundEnabled: true,
  currentResult: null,
  animationDone: false,
  drawError: null,

  importedNames: '',
};

// ─── Actions ─────────────────────────────────────────────

type Action =
  | { type: 'SET_SCREEN'; payload: Screen }
  | { type: 'IMPORT_NAMES'; payload: string }
  | { type: 'SET_PEOPLE'; payload: Person[] }
  | { type: 'ADD_PEOPLE'; payload: Person[] }
  | { type: 'SET_TEAM_SIZE'; payload: number }
  | { type: 'ADD_RULE'; payload: TeamRule }
  | { type: 'REMOVE_RULE'; payload: string }
  | { type: 'SET_CAPTAIN_TAG'; payload: string }
  | { type: 'TOGGLE_CAPTAIN'; payload: boolean }
  | { type: 'TOGGLE_BLOCKED_PAIR'; payload: { personId1: string; personId2: string } }
  | { type: 'TOGGLE_SOUND'; payload: boolean }
  | { type: 'SET_RESULT'; payload: DrawResult | null }
  | { type: 'SET_ANIMATION_DONE'; payload: boolean }
  | { type: 'SET_DRAW_ERROR'; payload: string | null }
  | { type: 'UPDATE_PERSON_GENDER'; payload: { id: string; gender: Person['gender'] } }
  | { type: 'TOGGLE_PERSON_TAG'; payload: { id: string; tag: string } }
  | { type: 'ADD_TAG_TO_PERSON'; payload: { id: string; tag: string } }
  | { type: 'REMOVE_TAG_FROM_PERSON'; payload: { id: string; tag: string } }

  | { type: 'REMOVE_PERSON'; payload: { id: string; name: string } }
  | { type: 'UPDATE_PERSON_NAME'; payload: { id: string; name: string } }
  | { type: 'LOAD_CONFIG'; payload: { config: DrawConfig; people: Person[] } }
  | { type: 'CLEAR_PEOPLE' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    case 'IMPORT_NAMES':
      return { ...state, importedNames: action.payload };

    case 'SET_PEOPLE':
      return { ...state, people: action.payload };

    case 'ADD_PEOPLE':
      return { ...state, people: [...state.people, ...action.payload] };

    case 'SET_TEAM_SIZE':
      return { ...state, teamSize: action.payload };

    case 'ADD_RULE':
      return { ...state, rules: [...state.rules, action.payload] };

    case 'REMOVE_RULE':
      return { ...state, rules: state.rules.filter(r => r.id !== action.payload) };

    case 'SET_CAPTAIN_TAG':
      return { ...state, captainTag: action.payload };

    case 'TOGGLE_CAPTAIN':
      return { ...state, enableCaptain: action.payload };

    case 'TOGGLE_BLOCKED_PAIR': {
      const { personId1, personId2 } = action.payload;
      const people = state.people.map(p => {
        if (p.id === personId1) {
          const hasBlock = p.blockedWith.includes(personId2);
          return {
            ...p,
            blockedWith: hasBlock
              ? p.blockedWith.filter(id => id !== personId2)
              : [...p.blockedWith, personId2],
          };
        }
        if (p.id === personId2) {
          const hasBlock = p.blockedWith.includes(personId1);
          return {
            ...p,
            blockedWith: hasBlock
              ? p.blockedWith.filter(id => id !== personId1)
              : [...p.blockedWith, personId1],
          };
        }
        return p;
      });
      return { ...state, people };
    }

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: action.payload };

    case 'SET_RESULT':
      return { ...state, currentResult: action.payload };

    case 'SET_ANIMATION_DONE':
      return { ...state, animationDone: action.payload };

    case 'SET_DRAW_ERROR':
      return { ...state, drawError: action.payload };

    case 'UPDATE_PERSON_GENDER': {
      const { id, gender } = action.payload;
      const people = state.people.map(p => {
        if (p.id !== id) return p;
        // Remove old gender tags, add new ones
        let tags = p.tags.filter(t => t !== 'masculino' && t !== 'feminino');
        if (gender === 'male') tags.push('masculino');
        if (gender === 'female') tags.push('feminino');
        return { ...p, gender, tags };
      });
      return { ...state, people };
    }

    case 'TOGGLE_PERSON_TAG': {
      const { id, tag } = action.payload;
      const people = state.people.map(p => {
        if (p.id !== id) return p;
        const hasTag = p.tags.includes(tag);
        const newTags = hasTag ? p.tags.filter(t => t !== tag) : [...p.tags, tag];
        // Update gender when toggling masculine/feminine tags
        let newGender = p.gender;
        if (tag === 'masculino') {
          newGender = hasTag ? 'unknown' : 'male';
        } else if (tag === 'feminino') {
          newGender = hasTag ? 'unknown' : 'female';
        }
        return {
          ...p,
          tags: newTags,
          gender: newGender,
        };
      });
      return { ...state, people };
    }

    case 'ADD_TAG_TO_PERSON': {
      const { id, tag } = action.payload;
      let updatedPeople = state.people.map(p =>
        p.id === id && !p.tags.includes(tag)
          ? { ...p, tags: [...p.tags, tag] }
          : p
      );
      // Also update gender if tag is masculine/feminine
      if (tag === 'masculino') {
        updatedPeople = updatedPeople.map(p =>
          p.id === id ? { ...p, gender: 'male' as const } : p
        );
      } else if (tag === 'feminino') {
        updatedPeople = updatedPeople.map(p =>
          p.id === id ? { ...p, gender: 'female' as const } : p
        );
      }
      return { ...state, people: updatedPeople };
    }

    case 'REMOVE_TAG_FROM_PERSON': {
      const { id, tag } = action.payload;
      let updatedPeople = state.people.map(p =>
        p.id === id ? { ...p, tags: p.tags.filter(t => t !== tag) } : p
      );
      // Also update gender if removing masculine/feminine tag
      if (tag === 'masculino' || tag === 'feminino') {
        updatedPeople = updatedPeople.map(p =>
          p.id === id ? { ...p, gender: 'unknown' as const } : p
        );
      }
      return { ...state, people: updatedPeople };
    }


    case 'REMOVE_PERSON': {
      const { id, name } = action.payload;
      const people = state.people.filter(p => p.id !== id);
      // Clean up blockedWith references
      const cleanedPeople = people.map(p => ({
        ...p,
        blockedWith: p.blockedWith.filter(bId => bId !== id),
      }));
      // Also remove name from importedNames textarea
      const cleanedNames = state.importedNames
        .split(/[,\n]+/)
        .map(n => n.trim())
        .filter(n => n.toLowerCase() !== name.toLowerCase())
        .join(', ');
      return { ...state, people: cleanedPeople, importedNames: cleanedNames };
    }

    case 'UPDATE_PERSON_NAME': {
      const { id, name } = action.payload;
      return {
        ...state,
        people: state.people.map(p =>
          p.id === id ? { ...p, name } : p
        ),
      };
    }

    case 'LOAD_CONFIG':
      return {
        ...state,
        people: action.payload.people,
        teamSize: action.payload.config.teamSize,
        rules: action.payload.config.rules,
        captainTag: action.payload.config.captainTag,
        enableCaptain: action.payload.config.enableCaptain,
        soundEnabled: action.payload.config.soundEnabled,
      };

    case 'CLEAR_PEOPLE':
      saveBlockedPairs([]);
      return { ...state, people: [], importedNames: '' };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  parseNames: (raw: string) => void;
  startDraw: () => void;
  restartDraw: () => void;
  goToHome: () => void;
  goToResult: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Restore last config on mount
  useEffect(() => {
    const { config, people } = getLastConfig();
    if (config && people.length > 0) {
      dispatch({ type: 'LOAD_CONFIG', payload: { config, people } });
    }
  }, []);

  // Restore blocked pairs from localStorage
  useEffect(() => {
    if (state.people.length === 0) return;
    const blockedPairs = getBlockedPairs();
    if (blockedPairs.length === 0) return;
    // Apply blocked pairs to people
    const updatedPeople = state.people.map(p => {
      const relatedPairs = blockedPairs.filter(
        bp => bp.personId1 === p.id || bp.personId2 === p.id
      );
      const blockedIds = relatedPairs.map(bp =>
        bp.personId1 === p.id ? bp.personId2 : bp.personId1
      );
      return { ...p, blockedWith: blockedIds };
    });
    dispatch({ type: 'SET_PEOPLE', payload: updatedPeople });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save blocked pairs to localStorage whenever they change
  useEffect(() => {
    const pairs: BlockedPair[] = [];
    const processed = new Set<string>();
    state.people.forEach(p => {
      p.blockedWith.forEach(bId => {
        const key = [p.id, bId].sort().join('::');
        if (processed.has(key)) return;
        processed.add(key);
        const other = state.people.find(op => op.id === bId);
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
    saveBlockedPairs(pairs);
  }, [state.people]);

  const parseNames = useCallback((raw: string) => {
    const names = raw
      .split(/[,\n]+/)
      .map(n => n.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    // Filter out names that already exist (case-insensitive)
    const existingNames = new Set(state.people.map(p => p.name.toLowerCase()));
    const newNames = names.filter(n => !existingNames.has(n.toLowerCase()));

    if (newNames.length === 0) return;

    const people: Person[] = newNames.map(name => {
      const inferredGender = inferGender(name);
      const tags: string[] = [];
      if (inferredGender === 'male') tags.push('masculino');
      if (inferredGender === 'female') tags.push('feminino');

      return {
        id: uuidv4(),
        name,
        gender: inferredGender,
        tags,
        blockedWith: [],
      };
    });

    if (state.people.length === 0) {
      dispatch({ type: 'SET_PEOPLE', payload: people });
    } else {
      dispatch({ type: 'ADD_PEOPLE', payload: people });
    }
  }, [state.people]);

  const startDraw = useCallback(() => {
    const config: DrawConfig = {
      teamSize: state.teamSize,
      rules: state.rules,
      captainTag: state.captainTag,
      enableCaptain: state.enableCaptain,
      soundEnabled: state.soundEnabled,
    };

    const result = runDraw({ people: state.people, config });

    if (!result.success) {
      const errors = result.validationErrors || result.drawErrors || [];
      dispatch({ type: 'SET_DRAW_ERROR', payload: errors.join('\n') });
      return;
    }

    dispatch({ type: 'SET_DRAW_ERROR', payload: null });
    dispatch({ type: 'SET_RESULT', payload: result.result! });
    dispatch({ type: 'SET_ANIMATION_DONE', payload: false });
    dispatch({ type: 'SET_SCREEN', payload: 'animation' });

    // Save config for next time
    saveLastConfig(config, state.people);
  }, [state.teamSize, state.rules, state.captainTag, state.enableCaptain, state.soundEnabled, state.people]);

  const restartDraw = useCallback(() => {
    dispatch({ type: 'SET_RESULT', payload: null });
    dispatch({ type: 'SET_ANIMATION_DONE', payload: false });
    dispatch({ type: 'SET_SCREEN', payload: 'home' });
  }, []);

  const goToHome = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', payload: 'home' });
  }, []);

  const goToResult = useCallback(() => {
    // Save to history when showing result
    if (state.currentResult) {
      saveToHistory(state.currentResult);
    }
    dispatch({ type: 'SET_ANIMATION_DONE', payload: true });
    dispatch({ type: 'SET_SCREEN', payload: 'result' });
  }, [state.currentResult]);

  return (
    <AppContext.Provider
      value={{ state, dispatch, parseNames, startDraw, restartDraw, goToHome, goToResult }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

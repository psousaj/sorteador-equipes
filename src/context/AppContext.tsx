import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Person, TeamRule, DrawConfig, Team, DrawResult, Screen, BlockedPair, GameConfig, GameSession, MatchResult } from '../types';
import { defaultGameConfig, randomTeamEmoji } from '../types';
import { getLastConfig, saveLastConfig, saveToHistory, saveBlockedPairs, getBlockedPairs, saveGameConfig, getGameConfig } from '../lib/storage';
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

  game: GameSession;
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

  game: {
    isActive: false,
    config: defaultGameConfig(),
    allTeams: [],
    queue: [],
    playing: null,
    scores: [0, 0],
    setScores1: [],
    setScores2: [],
    currentSet: 1,
    wins: {},
    matchHistory: [],
    scoreHistory: [],
  },
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
  | { type: 'CLEAR_PEOPLE' }
  | { type: 'START_GAME'; payload: { config: GameConfig; teams: Team[] } }
  | { type: 'SCORE_POINT'; payload: { side: 'team1' | 'team2' } }
  | { type: 'SCORE_POINT_SUBTRACT'; payload: { side: 'team1' | 'team2' } }
  | { type: 'UNDO_LAST_POINT' }
  | { type: 'SWAP_SIDES' }
  | { type: 'UPDATE_GAME_CONFIG'; payload: Partial<GameConfig> }
  | { type: 'UPDATE_TEAM_INFO'; payload: { teamId: number; name?: string; emoji?: string } }
  | { type: 'END_MATCH' }
  | { type: 'RESTART_MATCH' }
  | { type: 'CLOSE_GAME' };

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

    // ── GAME ACTIONS ─────────────────────────────────────

    case 'START_GAME': {
      const { config, teams } = action.payload;
      const teamIds = teams.map(t => t.id);
      const queue = teamIds.slice(2);
      const playing: [number, number] = [teamIds[0], teamIds[1]];
      const wins: Record<number, number> = {};
      teamIds.forEach(id => { wins[id] = 0; });
      return {
        ...state,
        game: {
          isActive: true,
          config,
          allTeams: teams,
          queue,
          playing,
          scores: [0, 0],
          setScores1: [],
          setScores2: [],
          currentSet: 1,
          wins,
          matchHistory: [],
          scoreHistory: [],
        },
      };
    }

    case 'SCORE_POINT': {
      const { game } = state;
      if (!game.playing || !game.isActive) return state;

      const side = action.payload.side;
      const idx = side === 'team1' ? 0 : 1;

      // Vibration feedback
      if (game.config.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }

      if (!game.config.setsEnabled) {
        // ── Traditional mode (no sets) ───────────────────
        const newScores: [number, number] = [...game.scores] as [number, number];
        newScores[idx] += 1;
        const { pointsToWin } = game.config;

        // Check if someone reached the target
        const team1Won = newScores[0] >= pointsToWin;
        const team2Won = newScores[1] >= pointsToWin;

        if (!team1Won && !team2Won) {
          // Save history, no winner yet
          return {
            ...state,
            game: {
              ...game,
              scores: newScores,
              scoreHistory: [...game.scoreHistory, [...game.scores] as [number, number]],
            },
          };
        }

        // A match was won — record result and rotate
        const winner = team1Won ? 'team1' as const : 'team2' as const;
        const winnerId = winner === 'team1' ? game.playing[0] : game.playing[1];
        const loserId = winner === 'team1' ? game.playing[1] : game.playing[0];
        const winnerTeam = game.allTeams.find(t => t.id === winnerId)!;
        const loserTeam = game.allTeams.find(t => t.id === loserId)!;

        const matchResult: MatchResult = {
          id: uuidv4(),
          team1Id: game.playing[0],
          team2Id: game.playing[1],
          team1Name: winnerTeam.name,
          team2Name: loserTeam.name,
          score1: newScores[0],
          score2: newScores[1],
          setNumber: 1,
          setScores1: [newScores[0]],
          setScores2: [newScores[1]],
          winner,
        };

        // Rotation: loser goes to back of queue
        let newQueue = [...game.queue, loserId];
        let newPlaying: [number, number] | null = game.playing;
        let isActive = true;

        // Reset scores
        const newWins = { ...game.wins };
        newWins[winnerId] = (newWins[winnerId] || 0) + 1;

        // Check if winner hit maxWins
        if (newWins[winnerId] >= game.config.maxWins) {
          // Winner is done, put at top of queue (observer)
          newQueue = [winnerId, ...newQueue];
          newPlaying = null;
        } else {
          // Winner stays
          newPlaying = game.playing;
        }

        // Pull next from queue
        if (newQueue.length >= 1) {
          const nextTeamId = newQueue[0];
          newQueue = newQueue.slice(1);
          if (!newPlaying) {
            // Need two teams: first from queue, then next
            if (newQueue.length >= 1) {
              const secondTeamId = newQueue[0];
              newQueue = newQueue.slice(1);
              newPlaying = [nextTeamId, secondTeamId];
            } else {
              newPlaying = [nextTeamId, winnerId];
            }
          } else {
            // Winner stays, challenger comes in
            newPlaying = winner === 'team1'
              ? [winnerId, nextTeamId]
              : [nextTeamId, winnerId];
          }
        } else {
          newPlaying = null;
          isActive = false;
        }

        return {
          ...state,
          game: {
            ...game,
            scores: [0, 0],
            setScores1: [],
            setScores2: [],
            currentSet: 1,
            playing: newPlaying,
            queue: newQueue,
            wins: newWins,
            matchHistory: [...game.matchHistory, matchResult],
            isActive,
            scoreHistory: [],
          },
        };
      }

      // ── Sets mode ──────────────────────────────────────
      const newScoreHistory: [number, number][] = [
        ...game.scoreHistory,
        [...game.scores] as [number, number],
      ];
      const newScores: [number, number] = [...game.scores] as [number, number];
      newScores[idx] += 1;

      const { pointsToWin, margin } = game.config;

      // Check set win condition: reached pointsToWin WITH margin
      const setWinner: 'team1' | 'team2' | null =
        newScores[0] >= pointsToWin && Math.abs(newScores[0] - newScores[1]) >= margin
          ? 'team1'
          : newScores[1] >= pointsToWin && Math.abs(newScores[0] - newScores[1]) >= margin
            ? 'team2'
            : null;

      if (setWinner === null) {
        // No set winner yet
        return {
          ...state,
          game: {
            ...game,
            scores: newScores,
            scoreHistory: newScoreHistory,
          },
        };
      }

      // A set was won
      const newSetScores1 = [...game.setScores1, newScores[0]];
      const newSetScores2 = [...game.setScores2, newScores[1]];
      const newWins = { ...game.wins };
      const winnerTeamId = setWinner === 'team1' ? game.playing[0] : game.playing[1];
      const loserTeamId = setWinner === 'team1' ? game.playing[1] : game.playing[0];
      newWins[winnerTeamId] = (newWins[winnerTeamId] || 0) + 1;

      const newCurrentSet = game.currentSet + 1;
      const matchWinner = newWins[winnerTeamId] >= game.config.setsToWin;

      if (!matchWinner) {
        // Same teams continue, new set
        return {
          ...state,
          game: {
            ...game,
            scores: [0, 0],
            currentSet: newCurrentSet,
            setScores1: newSetScores1,
            setScores2: newSetScores2,
            wins: newWins,
            scoreHistory: [],
          },
        };
      }

      // The match was won (reached setsToWin sets)
      const matchWinnerTeam = game.allTeams.find(t => t.id === winnerTeamId)!;
      const matchLoserTeam = game.allTeams.find(t => t.id === loserTeamId)!;

      const matchResult: MatchResult = {
        id: uuidv4(),
        team1Id: game.playing[0],
        team2Id: game.playing[1],
        team1Name: matchWinnerTeam.name,
        team2Name: matchLoserTeam.name,
        score1: newScores[0],
        score2: newScores[1],
        setNumber: game.currentSet,
        setScores1: newSetScores1,
        setScores2: newSetScores2,
        winner: setWinner,
      };

      // Rotation: loser goes to back of queue
      let newQueue = [...game.queue, loserTeamId];
      let newPlaying: [number, number] | null = game.playing;
      let isActive = true;

      // Check if winner hit maxWins
      if (newWins[winnerTeamId] >= game.config.maxWins) {
        // Winner is done, put at top of queue (observer)
        newQueue = [winnerTeamId, ...newQueue];
        newPlaying = null;
      } else {
        // Winner stays
        newPlaying = game.playing;
      }

      // Pull next from queue
      if (newQueue.length >= 1) {
        const nextTeamId = newQueue[0];
        newQueue = newQueue.slice(1);
        if (!newPlaying) {
          // Need two teams: first from queue, then next
          if (newQueue.length >= 1) {
            const secondTeamId = newQueue[0];
            newQueue = newQueue.slice(1);
            newPlaying = [nextTeamId, secondTeamId];
          } else {
            newPlaying = [nextTeamId, winnerTeamId];
          }
        } else {
          // Winner stays, challenger comes in
          newPlaying = setWinner === 'team1'
            ? [winnerTeamId, nextTeamId]
            : [nextTeamId, winnerTeamId];
        }
      } else {
        newPlaying = null;
        isActive = false;
      }

      return {
        ...state,
        game: {
          ...game,
          scores: [0, 0],
          currentSet: 1,
          setScores1: [],
          setScores2: [],
          playing: newPlaying,
          queue: newQueue,
          wins: newWins,
          matchHistory: [...game.matchHistory, matchResult],
          isActive,
          scoreHistory: [],
        },
      };
    }

    case 'SCORE_POINT_SUBTRACT': {
      const { game } = state;
      if (!game.playing || !game.isActive) return state;

      const idx = action.payload.side === 'team1' ? 0 : 1;
      const newScores: [number, number] = [...game.scores] as [number, number];
      newScores[idx] = Math.max(0, newScores[idx] - 1);

      return {
        ...state,
        game: {
          ...game,
          scores: newScores,
        },
      };
    }

    case 'UNDO_LAST_POINT': {
      const { game } = state;
      if (game.scoreHistory.length === 0) return state;

      const history = [...game.scoreHistory];
      const lastScores = history.pop()!;

      return {
        ...state,
        game: {
          ...game,
          scores: lastScores,
          scoreHistory: history,
        },
      };
    }

    case 'SWAP_SIDES': {
      const { game } = state;
      if (!game.playing) return state;

      const newPlaying: [number, number] = [game.playing[1], game.playing[0]];

      return {
        ...state,
        game: {
          ...game,
          playing: newPlaying,
          scores: [game.scores[1], game.scores[0]],
          setScores1: [...game.setScores2],
          setScores2: [...game.setScores1],
        },
      };
    }

    case 'UPDATE_GAME_CONFIG': {
      return {
        ...state,
        game: {
          ...state.game,
          config: {
            ...state.game.config,
            ...action.payload,
          },
        },
      };
    }

    case 'UPDATE_TEAM_INFO': {
      const { teamId, name, emoji } = action.payload;
      return {
        ...state,
        game: {
          ...state.game,
          allTeams: state.game.allTeams.map(t =>
            t.id === teamId
              ? {
                  ...t,
                  ...(name !== undefined ? { name } : {}),
                  ...(emoji !== undefined ? { emoji } : {}),
                }
              : t
          ),
        },
      };
    }

    case 'END_MATCH': {
      const { game } = state;
      if (!game.playing || !game.isActive) return state;

      // Determine set/winner based on current scores
      if (game.scores[0] === game.scores[1]) {
        // Tie — nothing to do
        return state;
      }

      const winnerSide: 'team1' | 'team2' = game.scores[0] > game.scores[1] ? 'team1' : 'team2';
      const winnerId = winnerSide === 'team1' ? game.playing[0] : game.playing[1];
      const loserId = winnerSide === 'team1' ? game.playing[1] : game.playing[0];
      const winnerTeam = game.allTeams.find(t => t.id === winnerId)!;
      const loserTeam = game.allTeams.find(t => t.id === loserId)!;

      if (!game.config.setsEnabled) {
        // ── Traditional mode ─────────────────────────────
        const matchResult: MatchResult = {
          id: uuidv4(),
          team1Id: game.playing[0],
          team2Id: game.playing[1],
          team1Name: winnerTeam.name,
          team2Name: loserTeam.name,
          score1: game.scores[0],
          score2: game.scores[1],
          setNumber: 1,
          setScores1: [game.scores[0]],
          setScores2: [game.scores[1]],
          winner: winnerSide,
        };

        // Rotation: winner stays, loser to back of queue
        let newQueue = [...game.queue, loserId];
        let newPlaying: [number, number] | null = game.playing;
        let isActive = true;

        if (newQueue.length >= 1) {
          const nextTeamId = newQueue[0];
          newQueue = newQueue.slice(1);
          newPlaying = winnerSide === 'team1'
            ? [winnerId, nextTeamId]
            : [nextTeamId, winnerId];
        } else {
          newPlaying = null;
          isActive = false;
        }

        return {
          ...state,
          game: {
            ...game,
            scores: [0, 0],
            setScores1: [],
            setScores2: [],
            currentSet: 1,
            playing: newPlaying,
            queue: newQueue,
            matchHistory: [...game.matchHistory, matchResult],
            isActive,
            scoreHistory: [],
          },
        };
      }

      // ── Sets mode ──────────────────────────────────────
      // End the current set with whoever has more points
      const newSetScores1 = [...game.setScores1, game.scores[0]];
      const newSetScores2 = [...game.setScores2, game.scores[1]];
      const newWins = { ...game.wins };
      newWins[winnerId] = (newWins[winnerId] || 0) + 1;

      const newCurrentSet = game.currentSet + 1;

      if (newWins[winnerId] < game.config.setsToWin) {
        // Same teams continue, new set
        return {
          ...state,
          game: {
            ...game,
            scores: [0, 0],
            currentSet: newCurrentSet,
            setScores1: newSetScores1,
            setScores2: newSetScores2,
            wins: newWins,
            scoreHistory: [],
          },
        };
      }

      // Match was won
      const matchResult: MatchResult = {
        id: uuidv4(),
        team1Id: game.playing[0],
        team2Id: game.playing[1],
        team1Name: winnerTeam.name,
        team2Name: loserTeam.name,
        score1: game.scores[0],
        score2: game.scores[1],
        setNumber: game.currentSet,
        setScores1: newSetScores1,
        setScores2: newSetScores2,
        winner: winnerSide,
      };

      // Rotation: winner stays, loser to back of queue
      let newQueue = [...game.queue, loserId];
      let newPlaying: [number, number] | null = game.playing;
      let isActive = true;

      if (newQueue.length >= 1) {
        const nextTeamId = newQueue[0];
        newQueue = newQueue.slice(1);
        newPlaying = winnerSide === 'team1'
          ? [winnerId, nextTeamId]
          : [nextTeamId, winnerId];
      } else {
        newPlaying = null;
        isActive = false;
      }

      return {
        ...state,
        game: {
          ...game,
          scores: [0, 0],
          currentSet: 1,
          setScores1: [],
          setScores2: [],
          playing: newPlaying,
          queue: newQueue,
          wins: newWins,
          matchHistory: [...game.matchHistory, matchResult],
          isActive,
          scoreHistory: [],
        },
      };
    }

    case 'RESTART_MATCH': {
      const { game } = state;
      return {
        ...state,
        game: {
          ...game,
          scores: [0, 0],
          isActive: true,
        },
      };
    }

    case 'CLOSE_GAME':
      return {
        ...state,
        game: {
          isActive: false,
          config: defaultGameConfig(),
          allTeams: [],
          queue: [],
          playing: null,
          scores: [0, 0],
          setScores1: [],
          setScores2: [],
          currentSet: 1,
          wins: {},
          matchHistory: [],
          scoreHistory: [],
        },
      };

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

  // Auto-save people whenever they change (not just on draw)
  useEffect(() => {
    if (state.people.length > 0) {
      const drawConfig: DrawConfig = {
        teamSize: state.teamSize,
        rules: state.rules,
        captainTag: state.captainTag,
        enableCaptain: state.enableCaptain,
        soundEnabled: state.soundEnabled,
      };
      saveLastConfig(drawConfig, state.people);
    }
  }, [state.people, state.teamSize, state.rules, state.captainTag, state.enableCaptain, state.soundEnabled]);

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

  // Load game config from localStorage on mount
  useEffect(() => {
    const saved = getGameConfig();
    if (saved) {
      dispatch({ type: 'UPDATE_GAME_CONFIG', payload: saved });
    }
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

  // Save game config to localStorage whenever it changes
  useEffect(() => {
    if (state.game.isActive) {
      saveGameConfig(state.game.config);
    }
  }, [state.game.config, state.game.isActive]);

  const parseNames = useCallback((raw: string) => {
    const names = raw
      .split(/[,\n]+/)
      .map(n => n.trim())
      // Remove leading numbers with separators: "1-", "2.", "3)", "4-", "05-", etc.
      .map(n => n.replace(/^\d+[\.\)\-\s]+/, ''))
      // Remove trailing checkmarks and common emojis: ✅ ❌ ✔️ ✗ 🚫 etc.
      .map(n => n.replace(/[\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F000}-\u{1FFFF}\u{FE00}-\u{FE0F}✅❌✔️✗🚫]+$/u, '').trim())
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

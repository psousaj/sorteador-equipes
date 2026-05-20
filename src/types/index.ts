export interface Person {
  id: string;
  name: string;
  gender: GenderOption;
  tags: string[];
  blockedWith: string[];
}

export interface TeamRule {
  id: string;
  tag: string;
  type: 'exact' | 'min' | 'max';
  perTeam: number;
}

export interface DrawConfig {
  teamSize: number;
  rules: TeamRule[];
  captainTag: string;
  enableCaptain: boolean;
  soundEnabled: boolean;
}

export interface Team {
  id: number;
  members: Person[];
  captain: Person | null;
  name: string;        // ← editável
  emoji: string;       // ← editável
}

export interface DrawResult {
  id: string;
  timestamp: number;
  config: DrawConfig;
  teams: Team[];
  allPeople: Person[];
}

export interface GameConfig {
  // Modo de jogo
  setsEnabled: boolean;
  pointsToWin: number;      // pontos pra vencer o set
  margin: number;           // diferença mínima pra vencer (ex: 2 = deuce)
  setsToWin: number;        // sets necessários pra vencer (derivado de totalSets)
  totalSets: number;        // total de sets na partida
  maxWins: number;          // limite de vitórias antes de rodar (sai com X)

  // Timer (visual only)
  timerEnabled: boolean;
  timerDuration: number;    // minutos
  timerCountdown: boolean;
  timerSound: boolean;

  // Geral
  swipeToDecrease: boolean;
  vibration: boolean;
  askSetWinner: boolean;
  darkTheme: boolean;
  orientation: 'normal' | 'inverted';

  // Templates
  sportTemplate: string;    // 'football' | 'volleyball' | 'basketball' | 'table-tennis' | ''
}

export interface MatchResult {
  id: string;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  score1: number;
  score2: number;
  setNumber: number;          // número do set
  setScores1: number[];       // histórico de todos os sets (time 1)
  setScores2: number[];       // histórico de todos os sets (time 2)
  winner: 'team1' | 'team2';
}

export interface GameSession {
  isActive: boolean;
  config: GameConfig;
  allTeams: Team[];
  queue: number[];                              // team IDs waiting
  playing: [number, number] | null;             // team IDs playing now
  scores: [number, number];
  setScores1: number[];                         // pontuação de cada set (time 1)
  setScores2: number[];                         // pontuação de cada set (time 2)
  currentSet: number;                           // set atual (1-indexed)
  wins: Record<number, number>;                 // teamId -> wins
  matchHistory: MatchResult[];
  scoreHistory: [number, number][];             // histórico de scores p/ undo
}

export type Screen = 'home' | 'animation' | 'result' | 'history' | 'game' | 'gameover';

export type GenderOption = 'male' | 'female' | 'unknown';

export interface BlockedPair {
  personId1: string;
  personId2: string;
  personName1: string;
  personName2: string;
}

export const DEFAULT_TAGS = [
  { value: 'masculino', label: 'Masculino', color: 'bg-blue-100 text-blue-800' },
  { value: 'feminino', label: 'Feminino', color: 'bg-pink-100 text-pink-800' },
] as const;

export const TEAM_COLORS = [
  { bg: 'bg-team-1', light: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', hex: '#6C5CE7' },
  { bg: 'bg-team-2', light: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-700', hex: '#00B894' },
  { bg: 'bg-team-3', light: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700', hex: '#FD79A8' },
  { bg: 'bg-team-4', light: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', hex: '#FDCB6E' },
  { bg: 'bg-team-5', light: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-700', hex: '#74B9FF' },
  { bg: 'bg-team-6', light: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', hex: '#E17055' },
  { bg: 'bg-team-7', light: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-700', hex: '#00CEC9' },
  { bg: 'bg-team-8', light: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700', hex: '#A29BFE' },
];

export const TEAM_EMOJIS = ['🦁','🐯','🦅','🐉','🦈','🐺','🦊','🐼','🐨','🦄','🐲','🐸','🦋','🐙','🦀','🐝','🦜','🐘','🦍','🦖'];

export function randomTeamEmoji(): string {
  return TEAM_EMOJIS[Math.floor(Math.random() * TEAM_EMOJIS.length)];
}

export function defaultGameConfig(): GameConfig {
  return {
    setsEnabled: false,
    pointsToWin: 10,
    margin: 2,
    setsToWin: 2,
    totalSets: 3,
    maxWins: 5,
    timerEnabled: false,
    timerDuration: 10,
    timerCountdown: false,
    timerSound: true,
    swipeToDecrease: true,
    vibration: false,
    askSetWinner: false,
    darkTheme: false,
    orientation: 'normal',
    sportTemplate: '',
  };
}

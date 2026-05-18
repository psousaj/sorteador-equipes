export interface Person {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'unknown';
  tags: string[];
  blockedWith: string[];
}

export interface TeamRule {
  id: string;
  tag: string;
  type: 'min' | 'max' | 'exact';
  value: number;
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
}

export interface DrawResult {
  id: string;
  timestamp: number;
  config: DrawConfig;
  teams: Team[];
  allPeople: Person[];
}

export type Screen = 'home' | 'animation' | 'result' | 'history';

export type GenderOption = 'male' | 'female' | 'unknown';

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

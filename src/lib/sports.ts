export interface SportTemplate {
  id: string;
  name: string;
  emoji: string;
  tags: string[];
  hasCaptain: boolean;
}

export const SPORTS: SportTemplate[] = [
  {
    id: 'football',
    name: 'Futebol',
    emoji: '⚽',
    tags: ['goleiro', 'zagueiro', 'meio-campo', 'atacante'],
    hasCaptain: true,
  },
  {
    id: 'volleyball',
    name: 'Vôlei',
    emoji: '🏐',
    tags: ['levantador', 'ponteiro', 'central', 'oposto', 'líbero'],
    hasCaptain: true,
  },
  {
    id: 'basketball',
    name: 'Basquete',
    emoji: '🏀',
    tags: [],
    hasCaptain: true,
  },
  {
    id: 'table-tennis',
    name: 'Tênis de Mesa',
    emoji: '🏓',
    tags: [],
    hasCaptain: false,
  },
];

export const CAPTAIN_TAG = 'capitão';

export function getSportById(id: string): SportTemplate | undefined {
  return SPORTS.find(s => s.id === id);
}

export function getDefaultCaptainTag(): string {
  return CAPTAIN_TAG;
}

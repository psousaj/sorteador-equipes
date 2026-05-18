import type { DrawResult, Person, TeamRule, DrawConfig } from '../types';

const STORAGE_KEYS = {
  history: 'sorteador:history',
  lastConfig: 'sorteador:lastConfig',
  lastPeople: 'sorteador:lastPeople',
  customTags: 'sorteador:customTags',
} as const;

const MAX_HISTORY = 50;

// --- History ---

export function saveToHistory(result: DrawResult): void {
  try {
    const history = getHistory();
    history.unshift(result);
    // Keep only last MAX_HISTORY
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  } catch {
    // localStorage might be full
  }
}

export function getHistory(): DrawResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.history);
    if (!data) return [];
    return JSON.parse(data) as DrawResult[];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.history);
}

export function removeFromHistory(id: string): void {
  const history = getHistory().filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

// --- Last configuration ---

export function saveLastConfig(config: DrawConfig, people: Person[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.lastConfig, JSON.stringify(config));
    localStorage.setItem(STORAGE_KEYS.lastPeople, JSON.stringify(people));
  } catch {
    // Ignore
  }
}

export function getLastConfig(): {
  config: DrawConfig | null;
  people: Person[];
} {
  try {
    const configData = localStorage.getItem(STORAGE_KEYS.lastConfig);
    const peopleData = localStorage.getItem(STORAGE_KEYS.lastPeople);
    return {
      config: configData ? JSON.parse(configData) : null,
      people: peopleData ? JSON.parse(peopleData) : [],
    };
  } catch {
    return { config: null, people: [] };
  }
}

// --- Custom Tags ---

export function saveCustomTags(tags: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.customTags, JSON.stringify(tags));
  } catch {
    // Ignore
  }
}

export function getCustomTags(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.customTags);
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch {
    return [];
  }
}

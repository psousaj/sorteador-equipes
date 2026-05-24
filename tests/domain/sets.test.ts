import { describe, it, expect } from 'vitest';
import {
  checkSetWinner,
  checkMatchWinner,
  processSetScore,
} from '../../src/domain/sets';
import type { Team, MatchResult } from '../../src/types';

const mockTeams: Team[] = [
  { id: 1, members: [], captain: null, name: 'Team A', emoji: '🦁' },
  { id: 2, members: [], captain: null, name: 'Team B', emoji: '🐯' },
  { id: 3, members: [], captain: null, name: 'Team C', emoji: '🦅' },
];

const config = { pointsToWin: 10, margin: 2, setsToWin: 2, maxWins: 5 };

// ─── checkSetWinner ──────────────────────────────────────

describe('checkSetWinner()', () => {
  it('team1 vence com pontos suficientes e margem', () => {
    expect(checkSetWinner([10, 5], 10, 2)).toBe('team1');
  });

  it('team2 vence com pontos e margem', () => {
    expect(checkSetWinner([8, 11], 10, 2)).toBe('team2');
  });

  it('retorna null se ninguém atingiu pointsToWin', () => {
    expect(checkSetWinner([7, 8], 10, 2)).toBeNull();
  });

  it('retorna null se atingiu mas sem margem (deuce)', () => {
    expect(checkSetWinner([10, 9], 10, 2)).toBeNull();
  });

  it('retorna null se os dois têm pontos mas sem margem', () => {
    expect(checkSetWinner([12, 11], 10, 2)).toBeNull();
  });
});

// ─── checkMatchWinner ────────────────────────────────────

describe('checkMatchWinner()', () => {
  it('team ganhou setsToWin sets → match winner', () => {
    expect(checkMatchWinner({ 1: 2, 2: 0 }, 1, 2)).toBe(true);
  });

  it('team não atingiu setsToWin → não é match winner', () => {
    expect(checkMatchWinner({ 1: 1, 2: 1 }, 1, 2)).toBe(false);
  });
});

// ─── processSetScore ─────────────────────────────────────

function baseInput(overrides: Partial<any> = {}) {
  return {
    playing: [1, 2] as [number, number],
    queue: [3],
    scores: [0, 0] as [number, number],
    wins: { 1: 0, 2: 0 } as Record<number, number>,
    reigningTeamId: null,
    reignCount: 0,
    allTeams: mockTeams,
    matchHistory: [] as MatchResult[],
    scoreHistory: [] as [number, number][],
    currentSet: 1,
    setScores1: [] as number[],
    setScores2: [] as number[],
    ...overrides,
  };
}

describe('processSetScore()', () => {
  it('ponto normal sem set vencedor → scores incrementam', () => {
    const r = processSetScore(baseInput(), config, 'team1');
    expect(r.scores).toEqual([1, 0]);
    expect(r.matchResult).toBeNull();
    expect(r.scoreHistory).toHaveLength(1); // salvou histórico
  });

  it('set vencido mas match segue → mesmos times, novo set', () => {
    const r = processSetScore(
      baseInput({ scores: [9, 5] }),
      config, 'team1'
    );
    expect(r.currentSet).toBe(2);
    expect(r.scores).toEqual([0, 0]);
    expect(r.matchResult).toBeNull(); // match não acabou
    expect(r.setScores1).toEqual([10]);
    expect(r.setScores2).toEqual([5]);
    expect(r.wins[1]).toBe(1);
  });

  it('match vencido (setsToWin atingido) → rotation com reign', () => {
    const r = processSetScore(
      baseInput({
        scores: [9, 5],
        wins: { 1: 1, 2: 0 },
      }),
      config, 'team1'
    );
    expect(r.matchResult).not.toBeNull();
    expect(r.matchResult!.winner).toBe('team1');
    expect(r.wins[1]).toBe(2);
    expect(r.reigningTeamId).toBe(1);
    expect(r.reignCount).toBe(1);
    // MODE 1: winner stays
    expect(r.playing).toEqual([1, 3]);
  });

  it('reign tracking funciona em sets mode', () => {
    const r = processSetScore(
      baseInput({
        scores: [9, 5],
        wins: { 1: 1, 2: 0 },
        reigningTeamId: 1,
        reignCount: 4,
      }),
      config, 'team1'
    );
    expect(r.reignCount).toBe(5);
    // reignCount >= maxWins (5) → MODE 2
    expect(r.playing).toEqual([3, 1]); // promove 1, winner completa
  });
});

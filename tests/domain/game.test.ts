import { describe, it, expect } from 'vitest';
import {
  rotateCourt,
  updateReign,
  buildMatchResult,
  processScoreNoSets,
  processEndMatch,
} from '../../src/domain/game';
import type { Team, MatchResult } from '../../src/types';

const mockTeams: Team[] = [
  { id: 1, members: [], captain: null, name: 'Team A', emoji: '🦁' },
  { id: 2, members: [], captain: null, name: 'Team B', emoji: '🐯' },
  { id: 3, members: [], captain: null, name: 'Team C', emoji: '🦅' },
  { id: 4, members: [], captain: null, name: 'Team D', emoji: '🐉' },
];

// ─── rotateCourt ────────────────────────────────────────

describe('rotateCourt()', () => {
  it('MODE 1: winner stays, loser to back, promote from queue', () => {
    const result = rotateCourt([3, 4], 1, 2, 'team1', false);
    expect(result.playing).toEqual([1, 3]);
    expect(result.queue).toEqual([4, 2]); // 4 stays, loser(2) goes to back
    expect(result.isActive).toBe(true);
  });

  it('MODE 1: winner on right side (team2)', () => {
    const result = rotateCourt([3, 4], 2, 1, 'team2', false);
    expect(result.playing).toEqual([3, 2]); // team2 winner stays on right
    expect(result.queue).toEqual([4, 1]);
  });

  it('MODE 2: both leave, promote 2, winner to front, loser to back', () => {
    const result = rotateCourt([3, 4], 1, 2, 'team1', true);
    expect(result.playing).toEqual([3, 4]);
    expect(result.queue).toEqual([1, 2]); // winner(1) front, loser(2) back
    expect(result.isActive).toBe(true);
  });

  it('MODE 2: only 1 in queue, fill with winner from front', () => {
    const result = rotateCourt([3], 1, 2, 'team1', true);
    expect(result.playing).toEqual([3, 1]); // promove 1, winner completa
    expect(result.queue).toEqual([2]); // loser back
  });

  it('MODE 2: empty queue, fill with both from newQueue', () => {
    const result = rotateCourt([], 1, 2, 'team1', true);
    expect(result.playing).toEqual([1, 2]);
    expect(result.queue).toEqual([]);
  });
});

// ─── updateReign ─────────────────────────────────────────

describe('updateReign()', () => {
  it('null reigningTeamId → establishes reign', () => {
    const r = updateReign(null, 0, 1);
    expect(r).toEqual({ reigningTeamId: 1, reignCount: 1 });
  });

  it('same champion wins → reignCount++', () => {
    const r = updateReign(1, 3, 1);
    expect(r).toEqual({ reigningTeamId: 1, reignCount: 4 });
  });

  it('different champion wins → reign transfers and resets', () => {
    const r = updateReign(1, 5, 2);
    expect(r).toEqual({ reigningTeamId: 2, reignCount: 1 });
  });
});

// ─── buildMatchResult ────────────────────────────────────

describe('buildMatchResult()', () => {
  const result = buildMatchResult(
    [1, 2],
    15, 10,
    1, [15], [10],
    mockTeams, 'team1'
  );

  it('sets winner team info', () => {
    expect(result.team1Name).toBe('Team A');
    expect(result.team2Name).toBe('Team B');
    expect(result.winner).toBe('team1');
  });

  it('records scores', () => {
    expect(result.score1).toBe(15);
    expect(result.score2).toBe(10);
  });

  it('generates an id', () => {
    expect(result.id).toBeTruthy();
  });
});

// ─── processScoreNoSets ──────────────────────────────────

function baseInput(overrides: Partial<any> = {}) {
  return {
    playing: [1, 2] as [number, number],
    queue: [3, 4],
    scores: [0, 0] as [number, number],
    wins: { 1: 0, 2: 0 } as Record<number, number>,
    reigningTeamId: null,
    reignCount: 0,
    allTeams: mockTeams,
    matchHistory: [] as MatchResult[],
    scoreHistory: [] as [number, number][],
    ...overrides,
  };
}

describe('processScoreNoSets()', () => {
  const config = { pointsToWin: 10, maxWins: 5 };

  it('incrementa score sem declarar vencedor', () => {
    const r = processScoreNoSets(baseInput(), config, 'team1');
    expect(r.scores).toEqual([1, 0]);
    expect(r.matchResult).toBeNull();
    expect(r.scoreHistory).toHaveLength(1);
    expect(r.isActive).toBe(true);
  });

  it('declara vencedor quando atinge pointsToWin', () => {
    const r = processScoreNoSets(
      baseInput({ scores: [9, 5] }),
      config, 'team1'
    );
    expect(r.matchResult).not.toBeNull();
    expect(r.matchResult!.winner).toBe('team1');
    expect(r.wins[1]).toBe(1);
    expect(r.scores).toEqual([0, 0]); // zera
  });

  it('primeira vitória → estabelece reinado', () => {
    const r = processScoreNoSets(
      baseInput({ scores: [9, 5] }),
      config, 'team1'
    );
    expect(r.reigningTeamId).toBe(1);
    expect(r.reignCount).toBe(1);
  });

  it('mesmo campeão vence de novo → reignCount++', () => {
    const r = processScoreNoSets(
      baseInput({
        scores: [9, 5],
        reigningTeamId: 1,
        reignCount: 2,
      }),
      config, 'team1'
    );
    expect(r.reigningTeamId).toBe(1);
    expect(r.reignCount).toBe(3);
    // Abaixo de maxWins → MODE 1
    expect(r.playing).toEqual([1, 3]); // winner stays
  });

  it('campeão diferente → reign troca e reinicia', () => {
    const r = processScoreNoSets(
      baseInput({
        scores: [3, 9],
        reigningTeamId: 1,
        reignCount: 4,
      }),
      config, 'team2'
    );
    expect(r.reigningTeamId).toBe(2);
    expect(r.reignCount).toBe(1);
  });

  it('reignCount atinge maxWins → MODE 2 (ambos saem)', () => {
    const r = processScoreNoSets(
      baseInput({
        scores: [9, 5],
        reigningTeamId: 1,
        reignCount: 4,
      }),
      { ...config, maxWins: 5 }, 'team1'
    );
    expect(r.reignCount).toBe(5);
    expect(r.playing).toEqual([3, 4]); // promove 2
  });

  it('não crasha com playing null', () => {
    const r = processScoreNoSets(
      baseInput({ playing: null }),
      config, 'team1'
    );
    expect(r.matchResult).toBeNull();
    expect(r.isActive).toBe(false);
  });
});

// ─── processEndMatch ─────────────────────────────────────

describe('processEndMatch()', () => {
  it('encerra partida com vencedor e atualiza reinado', () => {
    const r = processEndMatch(
      baseInput({ scores: [15, 10] }),
      { currentSet: 1, setScores1: [], setScores2: [] }
    );
    expect(r.isActive).toBe(false);
    expect(r.playing).toBeNull();
    expect(r.queue).toEqual([]);
    expect(r.reigningTeamId).toBe(1);
    expect(r.reignCount).toBe(1);
    expect(r.matchHistory).toHaveLength(1);
  });

  it('score empatado → retorna estado inalterado (isActive preservado)', () => {
    const r = processEndMatch(
      baseInput({ scores: [10, 10] }),
      { currentSet: 1, setScores1: [], setScores2: [] }
    );
    expect(r.isActive).toBe(true);
    expect(r.matchHistory).toHaveLength(0);
  });
});

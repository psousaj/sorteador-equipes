import type { MatchResult, Team } from '../types';

// ─── Types ──────────────────────────────────────────────

export interface RotateResult {
  playing: [number, number] | null;
  queue: number[];
  isActive: boolean;
}

export interface ScoreInput {
  playing: [number, number] | null;
  queue: number[];
  scores: [number, number];
  wins: Record<number, number>;
  reigningTeamId: number | null;
  reignCount: number;
  allTeams: Team[];
  matchHistory: MatchResult[];
  scoreHistory: [number, number][];
}

export interface GameConfigSubset {
  pointsToWin: number;
  maxWins: number;
  setsEnabled?: boolean;
  margin?: number;
  setsToWin?: number;
}

export interface ScoreOutput {
  playing: [number, number] | null;
  queue: number[];
  scores: [number, number];
  wins: Record<number, number>;
  reigningTeamId: number | null;
  reignCount: number;
  matchHistory: MatchResult[];
  scoreHistory: [number, number][];
  isActive: boolean;
}

// ─── Pure rotation logic ─────────────────────────────────

export function rotateCourt(
  queue: number[],
  winnerId: number,
  loserId: number,
  winner: 'team1' | 'team2',
  hitMaxWins: boolean
): RotateResult {
  if (hitMaxWins) {
    // MODE 2: campeão bateu limite — ambos saem
    const promoted = queue.slice(0, 2);
    const newQueue = [winnerId, ...queue.slice(2), loserId];
    // winner → topo, loser → final

    if (promoted.length >= 2) {
      return { playing: [promoted[0], promoted[1]], queue: newQueue, isActive: true };
    }
    if (promoted.length === 1) {
      return { playing: [promoted[0], winnerId], queue: newQueue.slice(1), isActive: true };
    }
    if (newQueue.length >= 2) {
      return { playing: [newQueue[0], newQueue[1]], queue: newQueue.slice(2), isActive: true };
    }
    return { playing: null, queue: newQueue, isActive: false };
  }

  // MODE 1: vitória normal — winner fica, loser pro final
  const newQueue = [...queue, loserId];
  if (newQueue.length >= 1) {
    const nextTeamId = newQueue[0];
    const remainingQueue = newQueue.slice(1);
    const newPlaying: [number, number] = winner === 'team1'
      ? [winnerId, nextTeamId]
      : [nextTeamId, winnerId];
    return { playing: newPlaying, queue: remainingQueue, isActive: true };
  }
  return { playing: null, queue: newQueue, isActive: false };
}

// ─── Reign logic ─────────────────────────────────────────

export function updateReign(
  reigningTeamId: number | null,
  reignCount: number,
  winnerId: number
): { reigningTeamId: number; reignCount: number } {
  if (reigningTeamId === null) {
    return { reigningTeamId: winnerId, reignCount: 1 };
  }
  if (winnerId === reigningTeamId) {
    return { reigningTeamId, reignCount: reignCount + 1 };
  }
  return { reigningTeamId: winnerId, reignCount: 1 };
}

// ─── Match result builder ────────────────────────────────

export function buildMatchResult(
  playing: [number, number],
  score1: number,
  score2: number,
  currentSet: number,
  setScores1: number[],
  setScores2: number[],
  allTeams: Team[],
  winnerSide: 'team1' | 'team2'
): MatchResult {
  const team1Team = allTeams.find(t => t.id === playing[0])!;
  const team2Team = allTeams.find(t => t.id === playing[1])!;

  return {
    id: crypto.randomUUID(),
    team1Id: playing[0],
    team2Id: playing[1],
    team1Name: team1Team.name,
    team2Name: team2Team.name,
    score1,
    score2,
    setNumber: currentSet,
    setScores1,
    setScores2,
    winner: winnerSide,
  };
}

// ─── Process score — no sets mode ────────────────────────

export function processScoreNoSets(
  input: ScoreInput,
  config: GameConfigSubset,
  side: 'team1' | 'team2'
): ScoreOutput & { matchResult: MatchResult | null } {
  const { playing, queue, scores, wins, reigningTeamId, reignCount, allTeams, matchHistory, scoreHistory } = input;

  if (!playing) {
    return { ...input, matchResult: null, isActive: false };
  }

  const idx = side === 'team1' ? 0 : 1;
  const newScores: [number, number] = [...scores] as [number, number];
  newScores[idx] += 1;
  const { pointsToWin } = config;

  // Check if someone reached the target
  const team1Won = newScores[0] >= pointsToWin;
  const team2Won = newScores[1] >= pointsToWin;

  if (!team1Won && !team2Won) {
    return {
      ...input,
      scores: newScores,
      scoreHistory: [...scoreHistory, [...scores] as [number, number]],
      matchResult: null,
      isActive: true,
    };
  }

  // A match was won
  const winner = team1Won ? 'team1' as const : 'team2' as const;
  const winnerId = winner === 'team1' ? playing[0] : playing[1];
  const loserId = winner === 'team1' ? playing[1] : playing[0];

  const newWins = { ...wins };
  newWins[winnerId] = (newWins[winnerId] || 0) + 1;

  // Reign
  const reign = updateReign(reigningTeamId, reignCount, winnerId);

  // Build match result
  const matchResult = buildMatchResult(
    playing,
    newScores[0], newScores[1],
    1, [newScores[0]], [newScores[1]],
    allTeams, winner
  );

  // Rotate
  const { playing: newPlaying, queue: newQueue, isActive } = rotateCourt(
    queue, winnerId, loserId, winner,
    reign.reignCount >= config.maxWins
  );

  return {
    playing: newPlaying,
    queue: newQueue,
    scores: [0, 0] as [number, number],
    wins: newWins,
    reigningTeamId: reign.reigningTeamId,
    reignCount: reign.reignCount,
    matchHistory: [...matchHistory, matchResult],
    scoreHistory: [],
    isActive,
    matchResult,
  };
}

// ─── Process end match (manual) ──────────────────────────

export function processEndMatch(
  input: ScoreInput,
  config: { currentSet: number; setScores1: number[]; setScores2: number[] }
): ScoreOutput & { currentSet: number; setScores1: number[]; setScores2: number[] } {
  const { playing, scores, wins, reigningTeamId, reignCount, allTeams, matchHistory } = input;

  if (!playing || scores[0] === scores[1]) {
    return {
      ...input,
      currentSet: config.currentSet,
      setScores1: config.setScores1,
      setScores2: config.setScores2,
      isActive: playing !== null,
    };
  }

  const winnerSide: 'team1' | 'team2' = scores[0] > scores[1] ? 'team1' : 'team2';
  const winnerId = winnerSide === 'team1' ? playing[0] : playing[1];
  const loserId = winnerSide === 'team1' ? playing[1] : playing[0];

  const finalScores1 = [...config.setScores1, scores[0]];
  const finalScores2 = [...config.setScores2, scores[1]];

  const matchResult = buildMatchResult(
    playing,
    scores[0], scores[1],
    config.currentSet, finalScores1, finalScores2,
    allTeams, winnerSide
  );

  const reign = updateReign(reigningTeamId, reignCount, winnerId);

  return {
    playing: null,
    queue: [],
    scores: [0, 0] as [number, number],
    wins,
    reigningTeamId: reign.reigningTeamId,
    reignCount: reign.reignCount,
    matchHistory: [...matchHistory, matchResult],
    scoreHistory: [],
    isActive: false,
    currentSet: 1,
    setScores1: [],
    setScores2: [],
  };
}

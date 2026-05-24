import type { MatchResult } from '../types';
import { buildMatchResult, updateReign, rotateCourt } from './game';
import type { ScoreInput, GameConfigSubset, ScoreOutput } from './game';

export interface SetsConfigSubset extends GameConfigSubset {
  margin: number;
  setsToWin: number;
}

export interface SetsScoreInput extends ScoreInput {
  currentSet: number;
  setScores1: number[];
  setScores2: number[];
}

export interface SetsScoreOutput extends ScoreOutput {
  currentSet: number;
  setScores1: number[];
  setScores2: number[];
  matchResult: MatchResult | null;
}

/**
 * Check if a team won the current set, considering margin.
 * Returns null if no one won yet.
 */
export function checkSetWinner(
  scores: [number, number],
  pointsToWin: number,
  margin: number
): 'team1' | 'team2' | null {
  if (scores[0] >= pointsToWin && Math.abs(scores[0] - scores[1]) >= margin) {
    return 'team1';
  }
  if (scores[1] >= pointsToWin && Math.abs(scores[0] - scores[1]) >= margin) {
    return 'team2';
  }
  return null;
}

/**
 * Check if a team has reached setsToWin sets and won the match.
 */
export function checkMatchWinner(
  wins: Record<number, number>,
  winnerTeamId: number,
  setsToWin: number
): boolean {
  return (wins[winnerTeamId] || 0) >= setsToWin;
}

/**
 * Process a score point in sets mode.
 */
export function processSetScore(
  input: SetsScoreInput,
  config: SetsConfigSubset,
  side: 'team1' | 'team2'
): SetsScoreOutput {
  const {
    playing, queue, scores, wins, reigningTeamId, reignCount,
    allTeams, matchHistory, scoreHistory,
    currentSet, setScores1, setScores2,
  } = input;

  if (!playing) {
    return {
      ...input,
      matchResult: null,
      isActive: playing !== null || queue.length > 0,
      playing,
      queue,
      scores,
      wins,
      reigningTeamId,
      reignCount,
      matchHistory,
      scoreHistory,
      currentSet,
      setScores1,
      setScores2,
    };
  }

  const idx = side === 'team1' ? 0 : 1;

  const newScoreHistory: [number, number][] = [
    ...scoreHistory,
    [...scores] as [number, number],
  ];
  const newScores: [number, number] = [...scores] as [number, number];
  newScores[idx] += 1;

  const { pointsToWin, margin } = config;

  // Check set win condition
  const setWinner = checkSetWinner(newScores, pointsToWin, margin);

  if (setWinner === null) {
    // No set winner yet
    return {
      ...input,
      scores: newScores,
      scoreHistory: newScoreHistory,
      setScores1,
      setScores2,
      currentSet,
      matchResult: null,
      isActive: playing !== null || queue.length > 0,
      playing,
      queue,
      wins,
      reigningTeamId,
      reignCount,
      matchHistory,
    };
  }

  // A set was won
  const newSetScores1 = [...setScores1, newScores[0]];
  const newSetScores2 = [...setScores2, newScores[1]];
  const newWins = { ...wins };
  const winnerTeamId = setWinner === 'team1' ? playing[0] : playing[1];
  const loserTeamId = setWinner === 'team1' ? playing[1] : playing[0];
  newWins[winnerTeamId] = (newWins[winnerTeamId] || 0) + 1;

  // Reign tracking
  const reign = updateReign(reigningTeamId, reignCount, winnerTeamId);

  const newCurrentSet = currentSet + 1;
  const matchWinner = checkMatchWinner(newWins, winnerTeamId, config.setsToWin);

  if (!matchWinner) {
    // Same teams continue, new set
    return {
      playing,
      queue,
      scores: [0, 0] as [number, number],
      wins: newWins,
      reigningTeamId: reign.reigningTeamId,
      reignCount: reign.reignCount,
      matchHistory,
      scoreHistory: [],
      isActive: playing !== null || queue.length > 0,
      currentSet: newCurrentSet,
      setScores1: newSetScores1,
      setScores2: newSetScores2,
      matchResult: null,
    };
  }

  // The match was won (reached setsToWin sets)
  const matchResult = buildMatchResult(
    playing,
    newScores[0], newScores[1],
    currentSet, newSetScores1, newSetScores2,
    allTeams, setWinner
  );

  // Rotate
  const { playing: newPlaying, queue: newQueue, isActive } = rotateCourt(
    queue, winnerTeamId, loserTeamId, setWinner,
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
    currentSet: 1,
    setScores1: [],
    setScores2: [],
    matchResult,
  };
}

import { describe, it, expect } from 'vitest';
import { validateGameConfig, positiveInt } from '../../src/lib/validation';

describe('validateGameConfig()', () => {
  it('aceita config padrão', () => {
    const r = validateGameConfig({
      setsEnabled: false,
      pointsToWin: 10,
      margin: 2,
      setsToWin: 2,
      totalSets: 3,
      maxWins: 5,
      timerEnabled: true,
      timerDuration: 10,
      timerCountdown: false,
      timerSound: true,
      swipeToDecrease: true,
      vibration: false,
      askSetWinner: false,
      darkTheme: false,
      orientation: 'normal',
      screenOrientation: 'landscape',
      sportTemplate: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita pointsToWin = 0', () => {
    const r = validateGameConfig({ pointsToWin: 0 });
    expect(r.success).toBe(false);
  });

  it('rejeita maxWins acima de 99', () => {
    const r = validateGameConfig({ maxWins: 100 });
    expect(r.success).toBe(false);
  });

  it('rejeita margin negativa', () => {
    const r = validateGameConfig({ margin: -1 });
    expect(r.success).toBe(false);
  });
});

describe('positiveInt()', () => {
  it('aceita 1', () => {
    expect(positiveInt.safeParse(1).success).toBe(true);
  });

  it('aceita 99', () => {
    expect(positiveInt.safeParse(99).success).toBe(true);
  });

  it('rejeita 0', () => {
    const r = positiveInt.safeParse(0);
    expect(r.success).toBe(false);
  });

  it('rejeita negativo', () => {
    const r = positiveInt.safeParse(-5);
    expect(r.success).toBe(false);
  });

  it('rejeita string vazia', () => {
    const r = positiveInt.safeParse('');
    expect(r.success).toBe(false);
  });

  it('coerce de string "2"', () => {
    const r = positiveInt.safeParse('2');
    expect(r.success).toBe(true);
    expect(r.data).toBe(2);
  });
});

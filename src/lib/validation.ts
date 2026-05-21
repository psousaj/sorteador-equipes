import { z } from 'zod';

export const gameConfigSchema = z.object({
  setsEnabled: z.boolean(),
  pointsToWin: z.number().int().min(1).max(99),
  margin: z.number().int().min(1).max(10),
  setsToWin: z.number().int().min(1).max(7),
  totalSets: z.number().int().min(1).max(7),
  maxWins: z.number().int().min(1).max(99),
  timerEnabled: z.boolean(),
  timerDuration: z.number().int().min(1).max(120),
  timerCountdown: z.boolean(),
  timerSound: z.boolean(),
  swipeToDecrease: z.boolean(),
  vibration: z.boolean(),
  askSetWinner: z.boolean(),
  darkTheme: z.boolean(),
  orientation: z.enum(['normal', 'inverted']),
  sportTemplate: z.string(),
});

export type ValidatedGameConfig = z.infer<typeof gameConfigSchema>;

export function validateGameConfig(data: unknown) {
  return gameConfigSchema.safeParse(data);
}

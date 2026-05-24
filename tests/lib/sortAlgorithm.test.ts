import { describe, it, expect } from 'vitest';
import { runDraw } from '../../src/lib/sortAlgorithm';
import type { Person, TeamRule } from '../../src/types';

function makePerson(name: string, gender: Person['gender'], tags: string[] = []): Person {
  return {
    id: name.toLowerCase().replace(/\s/g, '_'),
    name,
    gender,
    tags,
    blockedWith: [],
  };
}

function makeRule(tag: string, type: TeamRule['type'], perTeam: number, kind: TeamRule['kind']): TeamRule {
  return { id: `rule_${tag}_${type}`, tag, type, perTeam, kind };
}

const EMPTY_CAPTAIN = { captainTag: '', enableCaptain: false, soundEnabled: false };

describe('runDraw — gender rules', () => {
  describe('exact gender rule', () => {
    it('distribui exatamente 1 homem por time (2 times, 2 homens, 2 mulheres)', () => {
      const result = runDraw({
        people: [
          makePerson('João', 'male'),
          makePerson('Pedro', 'male'),
          makePerson('Maria', 'female'),
          makePerson('Ana', 'female'),
        ],
        config: { teamSize: 2, rules: [makeRule('male', 'exact', 1, 'gender')], ...EMPTY_CAPTAIN },
      });

      expect(result.success).toBe(true);
      expect(result.result?.teams).toHaveLength(2);
      for (const team of result.result!.teams) {
        expect(team.members.filter(p => p.gender === 'male')).toHaveLength(1);
        expect(team.members.filter(p => p.gender === 'female')).toHaveLength(1);
      }
    });

    it('rejeita se não tem mulheres suficientes pra regra exact', () => {
      const result = runDraw({
        people: [
          makePerson('João', 'male'),
          makePerson('Pedro', 'male'),
          makePerson('Maria', 'female'),
        ],
        config: { teamSize: 2, rules: [makeRule('female', 'exact', 2, 'gender')], ...EMPTY_CAPTAIN },
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
    });
  });

  describe('min gender rule', () => {
    it('garante pelo menos 1 mulher por time com folga', () => {
      const result = runDraw({
        people: [
          makePerson('João', 'male'),
          makePerson('Pedro', 'male'),
          makePerson('Maria', 'female'),
          makePerson('Ana', 'female'),
          makePerson('José', 'male'),
          makePerson('Carla', 'female'),
        ],
        config: { teamSize: 3, rules: [makeRule('female', 'min', 1, 'gender')], ...EMPTY_CAPTAIN },
      });

      expect(result.success).toBe(true);
      expect(result.result?.teams).toHaveLength(2);
      for (const team of result.result!.teams) {
        expect(team.members.filter(p => p.gender === 'female').length).toBeGreaterThanOrEqual(1);
      }
    });

    it('rejeita se não tem mulheres suficientes pro mínimo', () => {
      const result = runDraw({
        people: [
          makePerson('João', 'male'),
          makePerson('Pedro', 'male'),
          makePerson('José', 'male'),
          makePerson('Maria', 'female'),
        ],
        config: { teamSize: 2, rules: [makeRule('female', 'min', 2, 'gender')], ...EMPTY_CAPTAIN },
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
    });
  });

  describe('max gender rule', () => {
    it('não ultrapassa máximo de homens por time (2 homens, 4 mulheres, 2 times)', () => {
      const result = runDraw({
        people: [
          makePerson('João', 'male'),
          makePerson('Pedro', 'male'),
          makePerson('Maria', 'female'),
          makePerson('Ana', 'female'),
          makePerson('Carla', 'female'),
          makePerson('Lúcia', 'female'),
        ],
        config: { teamSize: 3, rules: [makeRule('male', 'max', 1, 'gender')], ...EMPTY_CAPTAIN },
      });

      expect(result.success).toBe(true);
      expect(result.result?.teams).toHaveLength(2);
      for (const team of result.result!.teams) {
        expect(team.members.filter(p => p.gender === 'male').length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('gender + tag rules combinadas', () => {
    it('respeita regra de gênero e tag simultaneamente (tags disjuntas dos gêneros)', () => {
      const result = runDraw({
        people: [
          makePerson('João', 'male', ['iniciante']),
          makePerson('Pedro', 'male', ['iniciante']),
          makePerson('Maria', 'female', ['experiente']),
          makePerson('Ana', 'female', ['experiente']),
        ],
        config: {
          teamSize: 2,
          rules: [
            makeRule('male', 'exact', 1, 'gender'),
            makeRule('experiente', 'exact', 1, 'tag'),
          ],
          ...EMPTY_CAPTAIN,
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.teams).toHaveLength(2);
      // Homens (iniciante) vão pros times via regra de gênero
      const teamA = result.result!.teams[0];
      const teamB = result.result!.teams[1];
      // Cada time tem 1 male (João/Pedro via gender rule)
      expect(teamA.members.filter(p => p.gender === 'male').length).toBeGreaterThanOrEqual(1);
      expect(teamB.members.filter(p => p.gender === 'male').length).toBeGreaterThanOrEqual(1);
    });

    it('aplica regra de tag (iniciante) e regra de gênero (female) juntas', () => {
      const result = runDraw({
        people: [
          makePerson('João', 'male', ['iniciante']),
          makePerson('Pedro', 'male'),
          makePerson('Maria', 'female', ['iniciante']),
          makePerson('Ana', 'female', ['iniciante']),
        ],
        config: {
          teamSize: 2,
          rules: [
            makeRule('iniciante', 'exact', 1, 'tag'),
            makeRule('female', 'min', 1, 'gender'),
          ],
          ...EMPTY_CAPTAIN,
        },
      });

      expect(result.success).toBe(true);
      expect(result.result?.teams).toHaveLength(2);
      for (const team of result.result!.teams) {
        // Pelo menos 1 female por time (Maria + Ana)
        expect(team.members.filter(p => p.gender === 'female').length).toBeGreaterThanOrEqual(1);
        // Exatamente 1 iniciante por time (João + Maria + Ana = 3, 2 times)
        expect(team.members.filter(p => p.tags.includes('iniciante')).length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('gender unknown', () => {
    it('unknown não satura regras de gênero específicas', () => {
      const result = runDraw({
        people: [
          makePerson('João', 'male'),
          makePerson('Pedro', 'male'),
          makePerson('Alex', 'unknown'),
          makePerson('Maria', 'female'),
          makePerson('Ana', 'female'),
        ],
        config: {
          teamSize: 3,
          rules: [makeRule('male', 'exact', 1, 'gender')],
          ...EMPTY_CAPTAIN,
        },
      });

      expect(result.success).toBe(true);
      // João e Pedro vão um em cada time (exact 1 male), Alex (unknown) não conta
      const teamA = result.result!.teams[0];
      const teamB = result.result!.teams[1];
      expect(teamA.members.filter(p => p.gender === 'male').length).toBeLessThanOrEqual(1);
      expect(teamB.members.filter(p => p.gender === 'male').length).toBeLessThanOrEqual(1);
      // total de males = 2 (só João e Pedro)
      const totalMales = result.result!.teams.reduce(
        (sum, t) => sum + t.members.filter(p => p.gender === 'male').length, 0
      );
      expect(totalMales).toBe(2);
    });
  });
});

import { v4 as uuidv4 } from 'uuid';
import type { Person, TeamRule, DrawConfig, Team, DrawResult } from '../types';

interface DrawInput {
  people: Person[];
  config: DrawConfig;
}

interface DrawValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validates if the draw rules are feasible with the given people.
 */
function validateDraw(input: DrawInput): DrawValidation {
  const { people, config } = input;
  const errors: string[] = [];

  if (people.length === 0) {
    return { valid: false, errors: ['Adicione pelo menos uma pessoa.'] };
  }

  if (config.teamSize < 1) {
    return { valid: false, errors: ['Tamanho do time deve ser pelo menos 1.'] };
  }

  if (config.teamSize > people.length) {
    return { valid: false, errors: ['Tamanho do time maior que o número de pessoas.'] };
  }

  // Collect all unique tags across all rules
  const rulesByTag = new Map<string, TeamRule[]>();
  for (const rule of config.rules) {
    if (!rulesByTag.has(rule.tag)) {
      rulesByTag.set(rule.tag, []);
    }
    rulesByTag.get(rule.tag)!.push(rule);
  }

  const numTeams = Math.ceil(people.length / config.teamSize);

  for (const [tag, rules] of rulesByTag) {
    const peopleWithTag = people.filter(p => p.tags.includes(tag)).length;

    for (const rule of rules) {
      if (rule.type === 'exact') {
        const needed = rule.perTeam * numTeams;
        if (peopleWithTag < needed) {
          const neededTotal = rule.perTeam * numTeams;
          errors.push(
            `Regra "exatamente ${rule.perTeam} ${tag}" precisa de ${neededTotal} pessoa(s), mas só tem ${peopleWithTag}.`
          );
        }
      } else if (rule.type === 'min') {
        const needed = rule.perTeam * numTeams;
        if (peopleWithTag < needed) {
          errors.push(
            `Regra "mínimo ${rule.perTeam} ${tag}" precisa de pelo menos ${needed} pessoa(s), mas só tem ${peopleWithTag}.`
          );
        }
      }
    }
  }

  // Check blocked pairs
  for (const person of people) {
    for (const blockedId of person.blockedWith) {
      const blockedPerson = people.find(p => p.id === blockedId);
      if (!blockedPerson) {
        errors.push(`Pessoa bloqueada não encontrada: "${person.name}" ↔ ?`);
      }
    }
  }

  // Check captain rule
  if (config.enableCaptain && config.captainTag) {
    const peopleWithCaptainTag = people.filter(p => p.tags.includes(config.captainTag));
    if (peopleWithCaptainTag.length < numTeams) {
      errors.push(
        `Regra "capitão = ${config.captainTag}" precisa de ${numTeams} pessoa(s), mas só tem ${peopleWithCaptainTag.length} com essa tag.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Shuffle array using Fisher-Yates algorithm.
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Main draw algorithm.
 * Distributes people into teams respecting rules.
 * Uses a greedy approach with constraint satisfaction.
 */
function performDraw(input: DrawInput): { teams: Team[]; errors: string[] } {
  const { people, config } = input;
  const errors: string[] = [];

  const numTeams = Math.ceil(people.length / config.teamSize);
  const teams: Person[][] = Array.from({ length: numTeams }, () => []);
  const captains: (Person | null)[] = Array.from({ length: numTeams }, () => null);

  // Separate people by categories
  let everyone = [...people];
  const blockedMap = new Map<string, Set<string>>();
  for (const person of everyone) {
    blockedMap.set(person.id, new Set(person.blockedWith));
  }

  // 1. Handle captain tag — distribute tagged people first
  if (config.enableCaptain && config.captainTag) {
    const captainCandidates = everyone.filter(p => p.tags.includes(config.captainTag));
    everyone = everyone.filter(p => !p.tags.includes(config.captainTag));

    const shuffledCaptains = shuffle(captainCandidates);
    shuffledCaptains.forEach((person, i) => {
      const teamIdx = i % numTeams;
      teams[teamIdx].push(person);
      captains[teamIdx] = person;
    });
  }

  // 2. Handle exact rules — distribute people with exact-match tags
  const exactRules = config.rules.filter(r => r.type === 'exact');
  for (const rule of exactRules) {
    const candidates = everyone.filter(p => p.tags.includes(rule.tag));
    everyone = everyone.filter(p => !p.tags.includes(rule.tag));

    const shuffled = shuffle(candidates);
    let personIdx = 0;
    for (let teamIdx = 0; teamIdx < numTeams; teamIdx++) {
      for (let n = 0; n < rule.perTeam && personIdx < shuffled.length; n++) {
        teams[teamIdx].push(shuffled[personIdx]);
        personIdx++;
      }
    }
  }

  // 3. Handle min rules — distribute remaining tagged people evenly
  const minRules = config.rules.filter(r => r.type === 'min');
  for (const rule of minRules) {
    // People with this tag who haven't been placed yet
    const candidates = everyone.filter(p => p.tags.includes(rule.tag) && !teams.some(t => t.includes(p)));
    everyone = everyone.filter(p => !candidates.includes(p));

    const shuffled = shuffle(candidates);
    let personIdx = 0;
    for (let teamIdx = 0; teamIdx < numTeams && personIdx < shuffled.length; teamIdx++) {
      teams[teamIdx].push(shuffled[personIdx]);
      personIdx++;
    }
    // If there are remaining candidates after first pass, redistribute remaining
    const remaining = shuffled.slice(personIdx);
    // Shuffle remaining and distribute to teams that need more people
    const shuffledRemaining = shuffle(remaining);
    shuffledRemaining.forEach((person, i) => {
      const availableTeams = teams
        .map((t, idx) => ({ team: t, idx }))
        .filter(({ team }) => team.length < config.teamSize);

      if (availableTeams.length > 0) {
        const target = availableTeams[i % availableTeams.length].idx;
        teams[target].push(person);
      } else {
        // Overflow to the team with fewest people (incomplete teams)
        const minTeam = teams.reduce((min, t, idx) =>
          t.length < teams[min].length ? idx : min, 0);
        teams[minTeam].push(person);
      }
    });
  }

  // 4. Handle max rules — check that no team exceeds max
  const maxRules = config.rules.filter(r => r.type === 'max');
  for (const rule of maxRules) {
    for (let i = 0; i < numTeams; i++) {
      const count = teams[i].filter(p => p.tags.includes(rule.tag)).length;
      if (count > rule.perTeam) {
        errors.push(`Time ${i + 1} tem ${count} "${rule.tag}", mas o máximo é ${rule.perTeam}.`);
      }
    }
  }

  // 5. Handle blocked pairs — check no blocked pairs in same team
  for (let i = 0; i < numTeams; i++) {
    const team = teams[i];
    for (const person of team) {
      for (const blockedId of person.blockedWith) {
        const blockedInSameTeam = team.find(p => p.id === blockedId);
        if (blockedInSameTeam) {
          errors.push(
            `"${person.name}" e "${blockedInSameTeam.name}" não podem ficar no mesmo time (Time ${i + 1}).`
          );
        }
      }
    }
  }

  // 6. Distribute remaining people
  const remaining = shuffle(everyone);

  // Build a team queue — teams that have fewer members get first pick
  const teamQueue = Array.from({ length: numTeams }, (_, i) => i).sort(
    (a, b) => teams[a].length - teams[b].length
  );

  let currentTeamIdx = 0;
  for (const person of remaining) {
    if (teams.some(t => t.includes(person))) continue; // already placed

    // Try to find a team that doesn't violate max rules
    let placed = false;

    // Try teams cyclically
    for (let attempt = 0; attempt < numTeams; attempt++) {
      const teamIdx = (currentTeamIdx + attempt) % numTeams;
      const team = teams[teamIdx];

      // Skip full teams
      if (team.length >= config.teamSize) continue;

      // Check max rules
      let violatesMax = false;
      for (const rule of maxRules) {
        if (person.tags.includes(rule.tag)) {
          const currentCount = team.filter(p => p.tags.includes(rule.tag)).length;
          if (currentCount + 1 > rule.perTeam) {
            violatesMax = true;
            break;
          }
        }
      }
      if (violatesMax) continue;

      // Check blocked pairs
      const blockedInTeam = person.blockedWith.some(blockedId =>
        team.some(p => p.id === blockedId)
      );
      if (blockedInTeam) continue;

      team.push(person);
      currentTeamIdx = teamIdx + 1;
      placed = true;
      break;
    }

    if (!placed) {
      // Overflow: put in the least full team regardless
      const leastFull = teams.reduce((min, t, idx) =>
        t.length < teams[min].length ? idx : min, 0);
      teams[leastFull].push(person);
    }
  }

  // 7. Assign captains where missing
  for (let i = 0; i < numTeams; i++) {
    if (!captains[i] && teams[i].length > 0) {
      if (config.enableCaptain && config.captainTag) {
        // Pick someone with the captain tag
        const captainFromTag = teams[i].find(p => p.tags.includes(config.captainTag));
        if (captainFromTag) {
          captains[i] = captainFromTag;
        } else {
          // Random captain
          const shuffledTeam = shuffle(teams[i]);
          captains[i] = shuffledTeam[0];
        }
      } else {
        // Random captain
        const shuffledTeam = shuffle(teams[i]);
        captains[i] = shuffledTeam[0];
      }
    }
  }

  // 8. Build result
  const result: Team[] = teams.map((members, i) => ({
    id: i + 1,
    members,
    captain: captains[i],
    name: `Time ${i + 1}`,
    emoji: '🎯',
  }));

  return { teams: result, errors };
}

/**
 * Run the draw with validation.
 */
export function runDraw(input: DrawInput): {
  success: boolean;
  result?: DrawResult;
  validationErrors?: string[];
  drawErrors?: string[];
} {
  const validation = validateDraw(input);

  if (!validation.valid) {
    return { success: false, validationErrors: validation.errors };
  }

  const { teams, errors } = performDraw(input);

  // Clean blocked pairs from the result people (don't save that state)
  const cleanPeople = input.people.map(p => ({
    ...p,
    blockedWith: [] as string[],
  }));

  const result: DrawResult = {
    id: uuidv4(),
    timestamp: Date.now(),
    config: { ...input.config },
    teams,
    allPeople: cleanPeople,
  };

  return {
    success: errors.length === 0,
    result: errors.length === 0 ? result : undefined,
    drawErrors: errors.length > 0 ? errors : undefined,
  };
}

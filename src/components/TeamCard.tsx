import { Crown } from 'lucide-react';
import type { Team } from '../types';
import { TEAM_COLORS } from '../types';

interface TeamCardProps {
  team: Team;
  colorIndex: number;
  compact?: boolean;
}

function genderEmoji(gender: string): string {
  if (gender === 'male') return '🚹';
  if (gender === 'female') return '🚺';
  return '';
}

const TAG_COLORS: Record<string, string> = {
  iniciante: 'bg-green-100 text-green-600',
  experiente: 'bg-yellow-100 text-yellow-600',
  levantador: 'bg-purple-100 text-purple-600',
  menina: 'bg-pink-100 text-pink-600',
  menino: 'bg-blue-100 text-blue-600',
};

export function TeamCard({ team, colorIndex, compact = false }: TeamCardProps) {
  const colors = TEAM_COLORS[colorIndex % TEAM_COLORS.length];

  const formatWhatsApp = () => {
    const lines = [`*Time ${team.id}*`];
    team.members.forEach(m => {
      const isCaptain = team.captain?.id === m.id;
      const tags = m.tags.filter(t => t !== 'menina' && t !== 'menino' && t !=='' ).join(', ');
      const tagStr = tags ? ` (${tags})` : '';
      const captainStr = isCaptain ? ' 👑' : '';
      lines.push(`${m.name}${captainStr}${tagStr}`);
    });
    return lines.join('\n');
  };

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.light} overflow-hidden transition-all hover:shadow-lg`}>
      {/* Header */}
      <div className={`${colors.bg} text-white px-4 py-2 flex items-center gap-2`}>
        <span className="font-display text-lg">Time {team.id}</span>
        <span className="text-xs opacity-75 ml-auto">{team.members.length} jogador(es)</span>
      </div>

      {/* Members */}
      <div className="p-3 space-y-1.5">
        {team.members.map(m => {
          const isCaptain = team.captain?.id === m.id;
          return (
            <div
              key={m.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-xl
                ${isCaptain ? 'bg-white/80 font-semibold' : 'hover:bg-white/40'}
                transition-colors
              `}
            >
              {isCaptain && (
                <Crown size={16} className="text-yellow-500 flex-shrink-0" />
              )}
              {!isCaptain && (
                <span className="w-4 flex-shrink-0 text-sm">{genderEmoji(m.gender)}</span>
              )}
              <span className={`text-gray-800 ${isCaptain ? 'font-bold' : ''}`}>
                {m.name}
                {isCaptain && ' (C)'}
              </span>
              <div className="ml-auto flex gap-1">
                {m.tags
                  .filter(t => t !== 'menina' && t !== 'menino')
                  .map(t => (
                    <span
                      key={t}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[t] || 'bg-gray-100 text-gray-500'}`}
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

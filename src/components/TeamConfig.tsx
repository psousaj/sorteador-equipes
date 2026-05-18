import { Users } from 'lucide-react';

interface TeamConfigProps {
  teamSize: number;
  onTeamSizeChange: (value: number) => void;
  numTeams: number;
  peopleLength: number;
}

export function TeamConfig({ teamSize, onTeamSizeChange, numTeams, peopleLength }: TeamConfigProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <Users size={16} />
        Tamanho do time
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={50}
          value={teamSize}
          onChange={(e) => onTeamSizeChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 text-center text-2xl font-bold text-brand bg-orange-50 border-2 border-brand/20 rounded-xl px-3 py-2 focus:outline-none focus:border-brand"
        />
        <span className="text-sm text-gray-500">
          {numTeams > 0
            ? `${numTeams} time(s) — ${peopleLength - (numTeams - 1) * teamSize} a ${teamSize} por time`
            : 'Adicione pessoas primeiro'}
        </span>
      </div>
    </div>
  );
}

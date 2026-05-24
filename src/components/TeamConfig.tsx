import { useState } from 'react';
import { Users } from 'lucide-react';
import { positiveInt } from '../lib/validation';
import { toast } from 'sonner';

interface TeamConfigProps {
  teamSize: number;
  onTeamSizeChange: (value: number) => void;
  numTeams: number;
  peopleLength: number;
}

export function TeamConfig({ teamSize, onTeamSizeChange, numTeams, peopleLength }: TeamConfigProps) {
  const [raw, setRaw] = useState(String(teamSize));

  const handleBlur = () => {
    const result = positiveInt.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setRaw(String(teamSize));
      return;
    }
    if (result.data !== teamSize) {
      onTeamSizeChange(result.data);
    }
    setRaw(String(result.data));
  };

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
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={handleBlur}
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

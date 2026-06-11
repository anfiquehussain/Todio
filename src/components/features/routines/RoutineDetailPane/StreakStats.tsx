import { Flame, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { Routine, RoutineLog } from '../../../../types';
import { calculateStreakAndRate } from '../../../../store/slices/routineSlice';

interface StreakStatsProps {
  routine: Routine;
  logs: RoutineLog[];
}

export const StreakStats = ({ routine, logs }: StreakStatsProps) => {
  const stats = calculateStreakAndRate(routine, logs);
  const totalCompletions = logs.filter(log => log.routineId === routine.id).length;

  const statItems = [
    {
      label: 'Current Streak',
      value: `${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`,
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 border-orange-500/15',
    },
    {
      label: 'All-Time Best',
      value: `${stats.bestStreak} ${stats.bestStreak === 1 ? 'day' : 'days'}`,
      icon: Award,
      color: 'text-brand-secondary',
      bgColor: 'bg-brand-secondary/10 border-brand-secondary/15',
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10 border-brand-primary/15',
      caption: 'Last 30 days due dates',
    },
    {
      label: 'Total Completed',
      value: `${totalCompletions} ${totalCompletions === 1 ? 'time' : 'times'}`,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10 border-success/15',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 font-sans">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`flex flex-col p-4 rounded-3xl border select-none transition-all duration-200 hover:scale-[1.01] ${item.bgColor}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-text-secondary/70 uppercase tracking-wider">
                {item.label}
              </span>
              <Icon className={`w-4.5 h-4.5 ${item.color}`} aria-hidden="true" />
            </div>
            <span className="text-lg font-black text-text-primary tracking-tight">
              {item.value}
            </span>
            {item.caption && (
              <span className="text-[9px] text-text-secondary/50 font-bold mt-1">
                {item.caption}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

import { Flame } from 'lucide-react';

interface StreakFlameProps {
  streak: number;
}

export const StreakFlame = ({ streak }: StreakFlameProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border border-gray-border rounded-3xl relative overflow-hidden group font-sans">
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-warning/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
      
      <div className="relative flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning hover:shadow-xl hover:shadow-warning/20 transition-all select-none">
          <Flame className="w-9 h-9 fill-warning animate-pulse" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-text-primary tracking-tight">
            {streak} Day{streak !== 1 ? 's' : ''}
          </span>
          <span className="text-xs font-bold text-warning uppercase tracking-widest mt-1">
            Consecutive Streak 🔥
          </span>
        </div>
        <p className="text-xs text-text-secondary text-center leading-relaxed max-w-[200px] mt-1 select-none">
          Complete checklist subtasks daily to build up streak XP rewards!
        </p>
      </div>
    </div>
  );
};

import { Award } from 'lucide-react';

interface XPProgressProps {
  xp: number;
}

export const XPProgress = ({ xp }: XPProgressProps) => {
  const cap = 1000;
  const percentage = Math.min((xp / cap) * 100, 100);
  
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border border-gray-border rounded-3xl relative overflow-hidden group font-sans">
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-brand-accent/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

      <div className="relative flex flex-col items-center gap-4">
        {/* Circle SVG Loader */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-gray-border/20"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-brand-accent transition-all duration-500 ease-out"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="w-14 h-14 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent select-none">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="text-2xl font-black text-text-primary tracking-tight">
            {xp} / {cap} XP
          </span>
          <span className="text-xs font-bold text-brand-accent uppercase tracking-widest mt-1">
            Level Progress ({percentage.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Award, Flame, CheckSquare, Sparkles, TrendingUp } from 'lucide-react';
import { useAppSelector } from '../hooks/useRedux';
import { PageHeader } from '../components/patterns/PageHeader';
import { StreakFlame } from '../components/features/profile/StreakFlame';
import { XPProgress } from '../components/features/profile/XPProgress';

export const ProfilePage: React.FC = () => {
  const { streak, xp } = useAppSelector((state) => state.profile);
  const { tasks } = useAppSelector((state) => state.todo);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const badges = [
    {
      title: 'Action Pioneer 🚀',
      desc: 'Created your first action todo item.',
      unlocked: totalCount >= 1,
      icon: CheckSquare,
      color: 'text-brand-primary bg-brand-primary/10 border-brand-primary/20',
    },
    {
      title: 'XP Overlord 🧠',
      desc: 'Accumulated over 300 XP productivity score.',
      unlocked: xp >= 300,
      icon: Award,
      color: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20',
    },
    {
      title: 'Streak Monarch 👑',
      desc: 'Stack a multiplier streak of 3 days or more.',
      unlocked: streak >= 3,
      icon: Flame,
      color: 'text-warning bg-warning/10 border-warning/20',
    },
    {
      title: 'Task Conqueror 🎯',
      desc: 'Finish 5 or more primary tasks successfully.',
      unlocked: completedCount >= 5,
      icon: Sparkles,
      color: 'text-info bg-info/10 border-info/20',
    },
  ];

  return (
    <div className="flex flex-col gap-8 font-sans">
      <PageHeader
        title="Analytics & Achievements"
        subtitle="Review consecutive daily streaks, level progress, and unlocked productivity badges."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StreakFlame streak={streak} />
        <XPProgress xp={xp} />

        <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-info/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="relative flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-info/10 border border-info/20 text-info flex items-center justify-center">
              <TrendingUp className="w-5.5 h-5.5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-wide">Completion Metric</h3>
              <p className="text-3xl font-black text-text-primary mt-1">
                {completionRate.toFixed(0)}%
              </p>
              <span className="text-xs text-text-secondary font-medium mt-1 inline-block">
                Tally: {completedCount} / {totalCount} completed tasks
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <h3 className="text-lg font-bold text-text-primary border-b border-gray-border/50 pb-2.5">
          Productivity Badges & Medals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${
                badge.unlocked
                  ? 'bg-bg-secondary border-gray-border glow-primary'
                  : 'bg-card/40 border-gray-border/40 opacity-40 select-none'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${
                  badge.unlocked ? badge.color : 'bg-gray-border/10 border-gray-border/20 text-text-secondary'
                }`}
              >
                <badge.icon className="w-7 h-7 shrink-0" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-sm font-extrabold text-text-primary tracking-wide">
                  {badge.title}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {badge.desc}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-widest mt-1">
                  {badge.unlocked ? '🔓 Unlocked' : '🔒 Locked'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

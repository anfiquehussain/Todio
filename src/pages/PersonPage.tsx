import React from 'react';
import { Heart, Terminal, Award, Cpu, Code2 } from 'lucide-react';
import { PageHeader } from '../components/patterns/PageHeader';

export const PersonPage: React.FC = () => {
  const developers = [
    {
      name: 'Productivity Architect',
      role: 'Lead Architect & AI Systems Designer',
      bio: 'Pioneered the ShowLi 3-Layer architecture paradigms, porting high-fidelity movie planners into gamified task schedulers.',
      skills: ['React', 'Redux Toolkit', 'TypeScript', 'Tailwind CSS v4', 'Web Audio API'],
      avatar: 'PA',
    }
  ];

  return (
    <div className="flex flex-col gap-8 font-sans">
      <PageHeader
        title="Engineering Contributors"
        subtitle="Meet the architects behind Todio's premium 3-Layer UI frameworks."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Developer Bio Card */}
        {developers.map((dev) => (
          <div
            key={dev.name}
            className="lg:col-span-2 bg-card border border-gray-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 relative overflow-hidden group"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl group-hover:scale-115 transition-transform duration-500 pointer-events-none" />
            
            <div className="w-20 h-20 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-2xl font-black flex items-center justify-center shrink-0 glow-primary select-none">
              {dev.avatar}
            </div>

            <div className="flex flex-col gap-4 relative z-10 flex-1">
              <div>
                <h3 className="text-xl font-extrabold text-text-primary tracking-wide">
                  {dev.name}
                </h3>
                <span className="text-xs font-bold text-brand-primary uppercase tracking-widest mt-1 inline-block">
                  {dev.role}
                </span>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                {dev.bio}
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {dev.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-bg-secondary border border-gray-border text-text-primary select-none"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* System telemetry/specs card */}
        <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-brand-accent/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-gray-border/50 pb-2">
              <Terminal className="w-5 h-5 text-brand-accent shrink-0" />
              <h3 className="text-sm font-bold text-text-primary font-sans">App Metadata</h3>
            </div>

            <div className="flex flex-col gap-3.5 text-xs font-sans">
              <div className="flex items-center gap-2 text-text-secondary">
                <Cpu className="w-4 h-4 shrink-0 text-brand-accent/70" />
                <span>Engine: React v18 + Vite + TS</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Code2 className="w-4 h-4 shrink-0 text-brand-accent/70" />
                <span>Compiler: Tailwind v4 Compiler</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Award className="w-4 h-4 shrink-0 text-brand-accent/70" />
                <span>Store: Redux Toolkit Slices</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-text-secondary/50 font-bold uppercase tracking-wider mt-6 flex items-center gap-1.5 relative z-10 select-none">
            Made with <Heart className="w-3.5 h-3.5 fill-error text-error animate-pulse shrink-0" /> by AI Engineering
          </div>
        </div>
      </div>
    </div>
  );
};

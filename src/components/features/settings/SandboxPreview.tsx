
import { Sparkles, Check } from 'lucide-react';

export const SandboxPreview = () => {
  return (
    <div className="lg:col-span-1 flex flex-col gap-4 lg:sticky lg:top-6 h-fit select-none">
      <div className="flex items-center gap-2 border-b border-gray-border pb-3 mb-1">
        <Sparkles className="w-4.5 h-4.5 text-brand-primary animate-pulse" />
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
          Real-Time Cockpit Sandbox Preview
        </h3>
      </div>

      {/* Realistic UI Mockup Card that scales dynamically */}
      <div 
        className="w-full bg-card border border-gray-border rounded-3xl p-5 shadow-2xl flex flex-col gap-4 select-none relative overflow-hidden transition-all duration-300 transform"
      >
        {/* Glossy radial blur inside preview */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white border border-brand-primary/30 bg-brand-primary/10">
            Workplace Pipeline 📁
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-success border border-success/30 bg-success/10">
            High Priority
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-base font-extrabold text-text-primary tracking-tight leading-snug">
            Establish simple-todo cockpit project
          </h2>
          <p className="text-[10px] text-text-secondary leading-relaxed">
            Coordinate full workspace structure, setup Redux state slices, and customize interface typography and sizing.
          </p>
        </div>

        {/* Subtasks checklist mockup */}
        <div className="flex flex-col gap-2 border-t border-gray-border/50 pt-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary/60">
            <span>Task Checklist</span>
            <span>Tally: 3 items</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-bg-secondary border border-gray-border/60 text-text-primary border-l-2 border-l-success">
              <div className="w-4 h-4 rounded-md border border-gray-border flex items-center justify-center bg-bg-primary text-transparent shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold truncate flex-1">Configure layout routes index</span>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-bg-secondary border border-gray-border/60 text-text-primary border-l-2 border-l-warning">
              <div className="w-4 h-4 rounded-md border border-gray-border flex items-center justify-center bg-bg-primary text-transparent shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold truncate flex-1">Implement SettingsPage custom styles</span>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl border border-success/15 bg-success/5 text-text-secondary/60 border-l-2 border-l-success/40">
              <div className="w-4 h-4 rounded-md flex items-center justify-center border border-success bg-success text-white shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold truncate line-through opacity-50 flex-1">Load custom Google font profiles</span>
            </div>
          </div>
        </div>

        {/* Card details footer */}
        <div className="grid grid-cols-2 gap-3 border-t border-gray-border/50 pt-3 text-[10px] font-semibold text-text-secondary">
          <div className="flex flex-col">
            <span className="uppercase text-[8px] font-bold tracking-widest text-text-secondary/55">Target due</span>
            <span className="text-text-primary font-bold mt-0.5">May 30, 2026</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="uppercase text-[8px] font-bold tracking-widest text-text-secondary/55">Payout XP</span>
            <span className="text-brand-primary font-black mt-0.5">+155 XP Payout</span>
          </div>
        </div>

        <div className="flex justify-end mt-1">
          <button className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase text-white bg-brand-primary border border-brand-primary/20 hover:bg-brand-primary/85 transition-colors cursor-pointer">
            Primary Action
          </button>
        </div>
      </div>

      <div className="bg-[#161616]/40 border border-gray-border/50 rounded-2xl p-4 text-[10px] text-text-secondary/80 leading-relaxed font-semibold">
        📢 <strong className="text-text-primary">Layout Scaling Notice</strong>: Try toggling font families and font sizes. Since all text sizes and margins in the preview box are powered by standard <code className="text-brand-primary bg-bg-secondary px-1 py-0.5 rounded">rem</code> properties, the sandbox box above scales dynamically!
      </div>

    </div>
  );
};

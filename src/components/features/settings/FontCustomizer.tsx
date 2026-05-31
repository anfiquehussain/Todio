
import { Type, Sliders, Check } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { setFontFamily, setFontSize } from '../../../store/slices/settingsSlice';
import { playCompletionSound } from '../../../lib/sound';
import type { SettingsFontFamily, SettingsFontSize } from '../../../types';

const FONTS: { id: SettingsFontFamily; name: string; description: string; sample: string; css: string }[] = [
  { 
    id: 'default', 
    name: 'Outfit & Inter (Default)', 
    description: 'System premium design blend (geometric headers + professional body).',
    sample: 'Sphinx of black quartz, judge my vow.',
    css: "'Inter', 'Outfit', system-ui, sans-serif"
  },
  { 
    id: 'inter', 
    name: 'Inter Pro', 
    description: 'Ultra-clean sans-serif tailored for excellent software interfaces.',
    sample: 'Focus intensely on completing key workflows.',
    css: "'Inter', sans-serif"
  },
  { 
    id: 'outfit', 
    name: 'Outfit Geometric', 
    description: 'Warm, beautiful modern typeface with circular geometric curves.',
    sample: 'Experience maximum workspace productivity.',
    css: "'Outfit', sans-serif"
  },
  { 
    id: 'roboto', 
    name: 'Roboto Neo', 
    description: 'Classic clean grotesque style, readable and friendly standard.',
    sample: 'Organize subtasks and checklists gracefully.',
    css: "'Roboto', sans-serif"
  },
  { 
    id: 'lexend', 
    name: 'Lexend High-Readability', 
    description: 'Scientifically designed to reduce reading strain and cognitive load.',
    sample: 'Acknowledge achievements and track progress.',
    css: "'Lexend', sans-serif"
  },
  { 
    id: 'playfair', 
    name: 'Playfair Editorial', 
    description: 'Classic serif typography providing a literary and high-end feel.',
    sample: 'Master all primary tasks with elegant focus.',
    css: "'Playfair Display', serif"
  },
  { 
    id: 'mono', 
    name: 'Console Monospace', 
    description: 'Structured grid typeface ideal for code-focused planning.',
    sample: 'npm run dev --port=3000 --open=true',
    css: "monospace"
  }
];

const SIZES: { id: SettingsFontSize; name: string; description: string; scale: string; pxValue: string }[] = [
  { id: 'xs', name: 'Extra Small', description: 'Maximum information density.', scale: '75%', pxValue: '12px' },
  { id: 'sm', name: 'Small', description: 'Compact list overview.', scale: '87.5%', pxValue: '14px' },
  { id: 'md', name: 'Medium (Standard)', description: 'Balanced defaults.', scale: '100%', pxValue: '16px' },
  { id: 'lg', name: 'Large', description: 'Comfortable reading scale.', scale: '112.5%', pxValue: '18px' },
  { id: 'xl', name: 'Extra Large', description: 'Enhanced clarity and visibility.', scale: '125%', pxValue: '20px' },
  { id: '2xl', name: 'Huge', description: 'Ultimate accessibility.', scale: '150%', pxValue: '24px' }
];

interface FontCustomizerProps {
  soundEnabled: boolean;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FontCustomizer = ({
  soundEnabled,
  toast
}: FontCustomizerProps) => {
  const dispatch = useAppDispatch();
  const { fontFamily, fontSize } = useAppSelector((state) => state.settings);

  const handleFontChange = (fontId: SettingsFontFamily) => {
    dispatch(setFontFamily(fontId));
    playCompletionSound(soundEnabled);
    toast(`Font family changed! 🧱`, 'success');
  };

  const handleSizeChange = (sizeId: SettingsFontSize) => {
    dispatch(setFontSize(sizeId));
    playCompletionSound(soundEnabled);
    toast(`Global font size scaled to ${sizeId.toUpperCase()}! 🔔`, 'success');
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Typography Settings Section */}
      <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden select-none">
        <div className="flex items-center gap-3 border-b border-gray-border/50 pb-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
            <Type aria-hidden="true" className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-text-primary tracking-wide">System Typography Fonts</h3>
            <p className="text-xs text-text-secondary">Select the global font family applied to all checklists, buttons, and tasks.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {FONTS.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => handleFontChange(font.id)}
              className={`group flex items-center justify-between text-left gap-4 p-4 rounded-2xl border transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
                fontFamily === font.id
                  ? 'bg-brand-primary/5 border-brand-primary border-l-4 border-l-brand-primary text-text-primary'
                  : 'bg-bg-secondary border-gray-border/70 hover:border-text-secondary/40 text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                    {font.name}
                  </span>
                  {fontFamily === font.id && (
                    <span className="text-[9px] font-bold text-brand-primary px-1.5 py-0.5 rounded bg-brand-primary/10">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-text-secondary leading-relaxed">
                  {font.description}
                </span>
                <span 
                  className="text-xs font-semibold mt-1.5 opacity-80 truncate border-t border-gray-border/30 pt-1" 
                  style={{ fontFamily: font.css }}
                >
                  {font.sample}
                </span>
              </div>
              {fontFamily === font.id && (
                <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0">
                  <Check aria-hidden="true" className="w-4.5 h-4.5" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sizing Settings Section */}
      <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden select-none">
        <div className="flex items-center gap-3 border-b border-gray-border/50 pb-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
            <Sliders aria-hidden="true" className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-text-primary tracking-wide">Workspace Interface Sizing</h3>
            <p className="text-xs text-text-secondary">Scale the layout, padding bounds, and text sizes across the entire system cockpit.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => handleSizeChange(size.id)}
              className={`flex flex-col text-left gap-1.5 p-4 rounded-2xl border transition-colors cursor-pointer select-none relative focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
                fontSize === size.id
                  ? 'bg-brand-primary/5 border-brand-primary border-l-4 border-l-brand-primary text-text-primary'
                  : 'bg-bg-secondary border-gray-border/70 hover:border-text-secondary/40 text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                  {size.id}
                </span>
                <span className="text-[9px] font-black text-text-secondary/70">
                  {size.scale} ({size.pxValue})
                </span>
              </div>
              <span className="text-xs font-bold text-text-primary mt-1">
                {size.name}
              </span>
              <span className="text-[10px] text-text-secondary/80 leading-relaxed">
                {size.description}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};


import { Volume2, LayoutList } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { setSoundEnabled } from '../store/slices/todoSlice';
import { setShowSubtasksInline, setShowListBadges } from '../store/slices/settingsSlice';
import { playCompletionSound } from '../lib/sound';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/patterns/PageHeader';
import { FontCustomizer } from '../components/features/settings/FontCustomizer';
import { SandboxPreview } from '../components/features/settings/SandboxPreview';

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const { soundEnabled } = useAppSelector((state) => state.todo);
  const { showSubtasksInline, showListBadges } = useAppSelector((state) => state.settings);

  const handleToggleSound = () => {
    dispatch(setSoundEnabled(!soundEnabled));
    playCompletionSound(!soundEnabled);
    toast(!soundEnabled ? 'Synth audio enabled! 🔔' : 'Synth audio muted.', 'info');
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 h-full overflow-y-auto no-scrollbar font-sans relative z-10 max-w-6xl mx-auto">
      {/* Decorative Blur Backdrops */}
      <div
        className="absolute -top-24 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: 'var(--color-brand-primary)' }}
      />
      <div
        className="absolute bottom-24 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: 'var(--color-brand-secondary)' }}
      />

      <PageHeader 
        title="Cockpit Settings" 
        subtitle="Customize your workspace's aesthetics, fonts, and interface sizing parameters."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Controls */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* General Audio Segment */}
          <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden select-none">
            <div className="flex items-center gap-3 border-b border-gray-border/50 pb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-wide">Sound & Audio Preferences</h3>
                <p className="text-xs text-text-secondary">Synthesizer bell rewards played on completion milestones.</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 p-3 bg-bg-secondary border border-gray-border rounded-2xl">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-text-primary">Physical Audio Bells</span>
                <span className="text-[10px] text-text-secondary">Web Audio API powered synthesizer resonance chime.</span>
              </div>
              <button
                onClick={handleToggleSound}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all border ${
                  soundEnabled 
                    ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/15'
                    : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-[#1a1a1a]'
                }`}
              >
                {soundEnabled ? 'Enabled 🔔' : 'Muted 🔇'}
              </button>
            </div>
          </div>

          {/* Workspace View Preferences Card */}
          <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden select-none">
            <div className="flex items-center gap-3 border-b border-gray-border/50 pb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
                <LayoutList className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-text-primary tracking-wide">Workspace View Preferences</h3>
                <p className="text-xs text-text-secondary">Configure inline list badges and in-place subtask visibility.</p>
              </div>
            </div>

            {/* Subtask inline select */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-bg-secondary border border-gray-border rounded-2xl">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-xs font-bold text-text-primary">In-place Subtasks Display</span>
                <span className="text-[10px] text-text-secondary">Render checklist items inline within the main task list.</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(['none', 'all', 'imported-priority'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      dispatch(setShowSubtasksInline(mode));
                      playCompletionSound(soundEnabled);
                      toast(
                        mode === 'none'
                          ? 'Inline subtasks hidden.'
                          : mode === 'all'
                          ? 'Showing all inline subtasks!'
                          : 'Showing imported and priority inline subtasks!',
                        'success'
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all border ${
                      showSubtasksInline === mode
                        ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/15'
                        : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {mode === 'none' ? 'Hide' : mode === 'all' ? 'All' : 'Priority/Import'}
                  </button>
                ))}
              </div>
            </div>

            {/* List badges toggle */}
            <div className="flex items-center justify-between gap-4 p-3.5 bg-bg-secondary border border-gray-border rounded-2xl">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-xs font-bold text-text-primary">Show List & Sublist Badges</span>
                <span className="text-[10px] text-text-secondary">Display parent list tags on task cards in global views.</span>
              </div>
              <button
                onClick={() => {
                  dispatch(setShowListBadges(!showListBadges));
                  playCompletionSound(soundEnabled);
                  toast(!showListBadges ? 'Workspace list badges visible!' : 'Workspace list badges hidden.', 'success');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all border ${
                  showListBadges
                    ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/15'
                    : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-[#1a1a1a]'
                }`}
              >
                {showListBadges ? 'Show Badges 🏷️' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Extracted FontCustomizer component */}
          <FontCustomizer
            soundEnabled={soundEnabled}
            toast={(msg, type) => toast(msg, type)}
          />

        </div>

        {/* Right 1 Column: Extracted Sandbox Preview Area */}
        <SandboxPreview />

      </div>

    </div>
  );
};
export default SettingsPage;

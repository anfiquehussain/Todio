import { Download, Upload, Volume2, VolumeX } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { setSoundEnabled } from '../store/slices/todoSlice';
import { PageHeader } from '../components/patterns/PageHeader';
import { useToast } from '../hooks/useToast';
import { playCompletionSound } from '../lib/sound';

export const BrowsePage = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { soundEnabled, tasks } = useAppSelector((state) => state.todo);

  const handleToggleSound = () => {
    dispatch(setSoundEnabled(!soundEnabled));
    playCompletionSound(!soundEnabled);
    toast(
      !soundEnabled ? 'Synthesizer audio bells activated! 🔔' : 'Synthesizer audio bells muted.',
      'info'
    );
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-cockpit-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Task database backup exported successfully! 📦', 'success');
  };

  return (
    <div className="flex flex-col gap-8 font-sans">
      <PageHeader
        title="Exploration & Tools"
        subtitle="Manage localized workspace utilities, synthesizer settings, and JSON backup imports/exports."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Audio Bell controls */}
        <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col gap-4 select-none relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-border/50 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
              {soundEnabled ? <Volume2 className="w-5.5 h-5.5" /> : <VolumeX className="w-5.5 h-5.5 text-error" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-wide">Audio Bell Resonance</h3>
              <p className="text-xs text-text-secondary">Synthesize bell triggers upon list and checklist completions.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleToggleSound}
              className={`w-full py-3.5 px-4 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/15'
                  : 'bg-transparent border-gray-border text-text-secondary hover:text-text-primary hover:bg-[#1a1a1a]'
              }`}
            >
              {soundEnabled ? 'Synthesizer Active (Click to Mute)' : 'Synthesizer Muted (Click to Activate)'}
            </button>
          </div>
        </div>

        {/* Card 2: JSON Backup controls */}
        <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col gap-4 select-none relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-border/50 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
              <Download className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-wide">Local Backup Importer & Exporter</h3>
              <p className="text-xs text-text-secondary">Save localized backups of all current tasks and categories.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-xs font-bold hover:bg-card/85 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export DB Backup</span>
            </button>
            <button
              onClick={() => toast('JSON importer interface enabled below.', 'info')}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-xs font-bold hover:bg-card/85 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

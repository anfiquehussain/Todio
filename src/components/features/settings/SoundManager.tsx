import { Volume2, VolumeX } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { setSoundEnabled } from '../../../store/slices/todoSlice';
import { playCompletionSound } from '../../../lib/sound';
import { useToast } from '../../../hooks/useToast';

export const SoundManager = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { soundEnabled } = useAppSelector((state) => state.todo);

  const handleToggleSound = () => {
    dispatch(setSoundEnabled(!soundEnabled));
    playCompletionSound(!soundEnabled);
    toast(
      !soundEnabled ? 'Synthesizer audio bells activated! 🔔' : 'Synthesizer audio bells muted.',
      'info'
    );
  };

  return (
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
  );
};

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useRedux';
import type { Routine } from '../../../../types';
import { useRoutineSchedule } from '../../../../hooks/useRoutineSchedule';
import { 
  createRoutineLogAsync, deleteRoutineLogAsync, setActiveRoutineId, calculateStreakAndRate
} from '../../../../store/slices/routineSlice';
import { incrementXP, decrementXP } from '../../../../store/slices/profileSlice';
import { playCompletionSound } from '../../../../lib/sound';
import { useToast } from '../../../../hooks/useToast';
import { CheckInNoteModal } from './CheckInNoteModal';

interface RoutineCardProps {
  routine: Routine;
  isSelected: boolean;
}

export const RoutineCard = ({ routine, isSelected }: RoutineCardProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isDueToday, isCompletedToday, getLogForDate, getRecurrenceLabel, formatDate } = useRoutineSchedule();
  
  const { routineLogs } = useAppSelector((state) => state.routine);
  const { soundEnabled } = useAppSelector((state) => state.todo);
  const { user } = useAppSelector((state) => state.auth);
  const { routineNotesPrompt } = useAppSelector((state) => state.settings);

  const dueToday = isDueToday(routine);
  const completed = isCompletedToday(routine, routineLogs);
  const recurrenceLabel = getRecurrenceLabel(routine);
  const stats = calculateStreakAndRate(routine, routineLogs);
  const currentStreak = stats.currentStreak;

  // Dynamic Lucide Icon mapping
  const getIcon = (iconName: string) => {
    const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; 'aria-hidden'?: string }>>)[iconName];
    return IconComp ? <IconComp className="w-5 h-5" aria-hidden="true" /> : <Icons.RefreshCw className="w-5 h-5" aria-hidden="true" />;
  };

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const handleConfirmCheckIn = async (note: string) => {
    if (!user) return;
    const todayStr = formatDate(new Date());
    const log = {
      id: `log-${Date.now()}`,
      routineId: routine.id,
      userId: user.uid,
      completedAt: new Date().toISOString(),
      scheduledDate: todayStr,
      note,
    };

    try {
      await dispatch(createRoutineLogAsync(log)).unwrap();
      dispatch(incrementXP(25));
      playCompletionSound(soundEnabled);
      toast('Routine completed! +25 XP 🔥', 'success');
    } catch {
      toast('Failed to log routine completion.', 'error');
    }
  };

  const handleCheckInToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection

    if (!user) {
      toast('Please sign in to log routine completions.', 'info');
      return;
    }

    const todayStr = formatDate(new Date());

    if (completed) {
      // Uncheck routine
      const todayLog = getLogForDate(routine, routineLogs, todayStr);
      if (todayLog) {
        try {
          await dispatch(deleteRoutineLogAsync(todayLog.id)).unwrap();
          dispatch(decrementXP(25));
          toast('Routine check-in removed.', 'info');
        } catch {
          toast('Failed to remove check-in.', 'error');
        }
      }
    } else {
      if (routineNotesPrompt) {
        setIsNoteModalOpen(true);
      } else {
        await handleConfirmCheckIn('');
      }
    }
  };

  return (
    <div
      onClick={() => dispatch(setActiveRoutineId(routine.id))}
      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? 'bg-card border-brand-primary/30 shadow-lg shadow-brand-primary/5'
          : 'bg-card/40 border-gray-border/30 hover:border-gray-border hover:bg-card/60'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Check-in Trigger Circle */}
        {dueToday ? (
          <button
            onClick={handleCheckInToggle}
            className={`w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              completed
                ? 'border-transparent text-white'
                : 'border-gray-border/50 hover:border-brand-primary/70'
            }`}
            style={{ 
              backgroundColor: completed ? routine.color : 'transparent',
              borderColor: completed ? 'transparent' : routine.color + '80'
            }}
            aria-label={completed ? `Mark ${routine.title} as incomplete` : `Complete ${routine.title} for today`}
          >
            {completed && <Icons.Check className="w-4 h-4 stroke-[3px]" />}
          </button>
        ) : (
          <div 
            className="w-6.5 h-6.5 rounded-full border border-dashed border-text-secondary/20 flex items-center justify-center shrink-0 text-text-secondary/30"
            title="Not scheduled for today"
          >
            <Icons.Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
        )}

        {/* Info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="shrink-0" style={{ color: routine.color }}>
              {getIcon(routine.icon)}
            </span>
            <h4 className={`text-sm font-bold truncate ${completed ? 'text-text-secondary line-through opacity-70' : 'text-text-primary'}`}>
              {routine.title}
            </h4>
          </div>
          <span className="text-[11px] text-text-secondary/70 font-semibold mt-1">
            {recurrenceLabel}
          </span>
        </div>
      </div>

      {/* Streak Fire Badge */}
      {!routine.deleted && (
        <div className="flex items-center gap-1 shrink-0 ml-3 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg select-none">
          <span className="text-[11px] font-bold text-orange-500">
            {currentStreak}
          </span>
          <span className="text-xs" role="img" aria-label="Streak fire">🔥</span>
        </div>
      )}

      <CheckInNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onConfirm={handleConfirmCheckIn}
        routineTitle={routine.title}
      />
    </div>
  );
};

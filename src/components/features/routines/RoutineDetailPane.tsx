import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  setActiveRoutineId, deleteRoutineAsync, restoreRoutineAsync, 
  deleteRoutinePermanentAsync, updateRoutineAsync, deleteRoutineLogAsync 
} from '../../../store/slices/routineSlice';
import { decrementXP } from '../../../store/slices/profileSlice';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { CalendarHeatmap } from './RoutineDetailPane/CalendarHeatmap';
import { StreakStats } from './RoutineDetailPane/StreakStats';
import { ConfirmationModal } from '../../patterns/ConfirmationModal';
import { RoutineFormModal } from './RoutineFormModal';
import type { Routine } from '../../../types';

export const RoutineDetailPane = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();

  const { routines, activeRoutineId, routineLogs } = useAppSelector((state) => state.routine);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeletePermanentOpen, setIsDeletePermanentOpen] = useState(false);

  const activeRoutine = routines.find(r => r.id === activeRoutineId) || null;

  // Filter logs for this specific routine, sorted newest first
  const activeLogs = activeRoutine
    ? [...routineLogs]
        .filter(l => l.routineId === activeRoutine.id)
        .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
    : [];

  const getIcon = (iconName: string, color: string) => {
    const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[iconName];
    return IconComp 
      ? <IconComp className="w-8 h-8" style={{ color }} /> 
      : <Icons.RefreshCw className="w-8 h-8" style={{ color }} />;
  };

  const handleSoftDelete = async () => {
    if (!activeRoutine) return;
    if (!checkAuth('delete routine')) return;

    try {
      const routineId = activeRoutine.id;
      await dispatch(deleteRoutineAsync(routineId)).unwrap();
      toast('Routine moved to trash bin.', 'info', undefined, {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreRoutineAsync(routineId));
          dispatch(setActiveRoutineId(routineId));
          toast('Routine restored.', 'success');
        }
      });
    } catch {
      toast('Failed to move routine to trash.', 'error');
    }
  };

  const handleRestore = async () => {
    if (!activeRoutine) return;
    try {
      await dispatch(restoreRoutineAsync(activeRoutine.id)).unwrap();
      toast('Routine restored to active status.', 'success');
    } catch {
      toast('Failed to restore routine.', 'error');
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!activeRoutine) return;
    try {
      await dispatch(deleteRoutinePermanentAsync(activeRoutine.id)).unwrap();
      toast('Routine and logs permanently deleted.', 'info');
      setIsDeletePermanentOpen(false);
    } catch {
      toast('Failed to permanently delete routine.', 'error');
    }
  };

  const handleArchiveToggle = async () => {
    if (!activeRoutine) return;
    try {
      const updated = { ...activeRoutine, archived: !activeRoutine.archived };
      await dispatch(updateRoutineAsync(updated)).unwrap();
      toast(
        updated.archived 
          ? 'Routine moved to archive.' 
          : 'Routine restored to active focus.', 
        'success'
      );
    } catch {
      toast('Failed to update archive status.', 'error');
    }
  };

  const handleEditSubmit = async (updatedData: Routine) => {
    try {
      await dispatch(updateRoutineAsync(updatedData)).unwrap();
      toast('Routine modifications saved! 📁', 'success');
    } catch {
      toast('Failed to modify routine.', 'error');
    }
  };

  const handleRemoveLog = async (logId: string, dateStr: string) => {
    if (!confirm(`Are you sure you want to remove your completion log for ${dateStr}? This will affect your streak.`)) {
      return;
    }

    try {
      await dispatch(deleteRoutineLogAsync(logId)).unwrap();
      dispatch(decrementXP(25));
      toast('Completion log removed.', 'info');
    } catch {
      toast('Failed to remove completion log.', 'error');
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg-secondary select-none border-l border-gray-border/20 w-full">
      {activeRoutine ? (
        <div className="flex flex-col h-full overflow-hidden animate-slide-in relative">
          
          {/* Header Panel */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border/30 shrink-0 bg-[#161616]/20">
            {/* Close / Back button (Mobile focused) */}
            <button
              onClick={() => dispatch(setActiveRoutineId(null))}
              className="p-2 hover:bg-[#202020] rounded-xl text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              aria-label="Back to routines list"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Actions Bar */}
            <div className="flex items-center gap-1.5">
              {!activeRoutine.deleted ? (
                <>
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-2 hover:bg-[#202020] rounded-xl text-text-secondary hover:text-brand-primary transition-all cursor-pointer"
                    title="Edit Routine"
                    aria-label="Edit routine"
                  >
                    <Icons.Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleArchiveToggle}
                    className="p-2 hover:bg-[#202020] rounded-xl text-text-secondary hover:text-brand-primary transition-all cursor-pointer"
                    title={activeRoutine.archived ? 'Restore to Active' : 'Archive Routine'}
                    aria-label={activeRoutine.archived ? 'Restore routine' : 'Archive routine'}
                  >
                    {activeRoutine.archived ? <Icons.ArchiveRestore className="w-4 h-4" /> : <Icons.Archive className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSoftDelete}
                    className="p-2 hover:bg-error/15 rounded-xl text-error hover:text-red-400 transition-all cursor-pointer"
                    title="Move to Trash"
                    aria-label="Delete routine to trash"
                  >
                    <Icons.Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRestore}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#202020] hover:bg-[#282828] border border-gray-border/30 text-text-primary text-xs font-bold rounded-xl cursor-pointer transition-all"
                    title="Restore Routine"
                  >
                    <Icons.RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setIsDeletePermanentOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 border border-error/30 text-error text-xs font-bold rounded-xl cursor-pointer transition-all"
                    title="Delete Permanently"
                  >
                    <Icons.Trash2 className="w-3.5 h-3.5" />
                    <span>Destroy</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Details Scroll Area */}
          <div className="flex-1 overflow-y-auto pt-5 px-6 pb-8 flex flex-col gap-5.5 no-scrollbar">
            
            {/* Title Block */}
            <div className="flex items-start gap-4 border-b border-gray-border/10 pb-4.5 select-none">
              <div className="p-3.5 bg-card border border-gray-border/30 rounded-3xl shrink-0 shadow-lg shadow-black/10">
                {getIcon(activeRoutine.icon, activeRoutine.color)}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <h2 className="text-lg font-black tracking-tight text-text-primary leading-tight wrap-break-word">
                  {activeRoutine.title}
                </h2>
                {activeRoutine.description ? (
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {activeRoutine.description}
                  </p>
                ) : (
                  <span className="text-[11px] text-text-secondary/40 font-bold italic">
                    No overview description provided.
                  </span>
                )}
              </div>
            </div>

            {/* Streak Statistics Grid */}
            <StreakStats routine={activeRoutine} logs={routineLogs} />

            {/* Contribution Heatmap */}
            <CalendarHeatmap routine={activeRoutine} logs={routineLogs} />

            {/* Activity History Log */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Icons.History className="w-4 h-4 text-text-secondary/60 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary/60 select-none">
                  Recent Completions Log
                </span>
              </div>
              
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {activeLogs.length > 0 ? (
                  activeLogs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-card/10 border border-gray-border/20 rounded-2xl transition-all hover:bg-card/20"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: activeRoutine.color }}
                        >
                          <Icons.Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                        </div>
                        <span className="text-xs font-bold text-text-primary">
                          {formatDateLabel(log.scheduledDate)}
                        </span>
                        {log.note && (
                          <span className="text-[10px] text-text-secondary/70 truncate bg-[#202020] px-2 py-0.5 rounded-lg border border-gray-border/25">
                            {log.note}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveLog(log.id, log.scheduledDate)}
                        className="p-1 hover:bg-error/10 hover:text-error rounded-lg text-text-secondary/40 transition-colors cursor-pointer shrink-0"
                        title="Remove Completion"
                        aria-label="Remove completion record"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-border/30 rounded-2xl text-[11px] text-text-secondary/40 font-semibold italic select-none">
                    No completions logged in workspace history.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Metadata */}
          <div className="px-6 py-4 border-t border-gray-border/30 bg-[#161616]/20 select-none flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Icons.Calendar className="w-3.5 h-3.5 text-text-secondary/50 shrink-0" />
              <span className="text-[10px] font-bold text-text-secondary/60">
                Started {formatDateLabel(activeRoutine.startDate)}
              </span>
            </div>
            {activeRoutine.endDate && (
              <span className="text-[10px] font-bold text-text-secondary/60">
                Ends {formatDateLabel(activeRoutine.endDate)}
              </span>
            )}
          </div>

          {/* Form Modal for editing */}
          <RoutineFormModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSubmit={handleEditSubmit}
            editingRoutine={activeRoutine}
          />

          {/* Destruction Warning Dialog */}
          <ConfirmationModal
            isOpen={isDeletePermanentOpen}
            onClose={() => setIsDeletePermanentOpen(false)}
            onConfirm={handleConfirmPermanentDelete}
            title="Permanently Delete Routine?"
            message={`Are you sure you want to permanently delete "${activeRoutine.title}"? This action deletes all associated streak history and completion logs. It cannot be undone.`}
            confirmLabel="Delete Permanently"
            isDanger={true}
          />
        </div>
      ) : (
        /* Empty Detail Inspector Pane */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-secondary/40 gap-4 select-none">
          <div className="w-16 h-16 rounded-3xl bg-gray-border/5 border border-gray-border/10 flex items-center justify-center text-text-secondary/30 shadow-xl shadow-black/5">
            <Icons.Compass className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xs font-black text-text-primary">Inspect Habit Progress</h2>
            <p className="text-[10px] mt-1.5 leading-relaxed max-w-[240px] text-text-secondary/70">
              Click any habit in your active routines checklist to view long-term activity maps, streak stats, and history.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

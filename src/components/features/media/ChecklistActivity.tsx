import { useState } from 'react';
import { Plus, Check, Trash2, ShieldAlert } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { createSubtaskAsync, updateSubtaskAsync, deleteSubtaskAsync, createSubtasksBulkAsync, restoreSubtaskAsync } from '../../../store/slices/todoSlice';
import { incrementXP, updateStreak } from '../../../store/slices/profileSlice';
import { playCompletionSound } from '../../../lib/sound';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import type { Subtask } from '../../../types';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { ConfirmationModal } from '../../patterns/ConfirmationModal';

interface ChecklistActivityProps {
  taskId: string;
}

export const ChecklistActivity = ({
  taskId,
}: ChecklistActivityProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();
  const { user } = useAppSelector((state) => state.auth);
  const { subtasks: allSubtasks, soundEnabled } = useAppSelector((state) => state.todo);
  const subtasks = allSubtasks.filter(s => !s.deleted);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskPriority, setNewSubtaskPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subtaskSortOrder, setSubtaskSortOrder] = useState<'default' | 'asc' | 'desc'>(() => {
    const cached = localStorage.getItem('todo_subtask_sort_order');
    return (cached as 'default' | 'asc' | 'desc') || 'default';
  });
  const [subtaskToDeleteId, setSubtaskToDeleteId] = useState<string | null>(null);

  // Load subtask expand/collapse memory from localStorage
  const [isActiveSubtasksOpen, setIsActiveSubtasksOpen] = useState(() => {
    const cached = localStorage.getItem('todo_active_subtasks_expanded');
    return cached === null ? true : cached === 'true';
  });

  const [isCompletedSubtasksOpen, setIsCompletedSubtasksOpen] = useState(() => {
    const cached = localStorage.getItem('todo_completed_subtasks_expanded');
    return cached === null ? false : cached === 'true';
  });

  // Filter subtasks for this specific task
  const taskSubtasks = subtasks.filter(s => s.taskId === taskId);

  const sortSubtasks = (list: Subtask[]) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return [...list].sort((a, b) => {
      if (subtaskSortOrder === 'desc') {
        const weightA = priorityWeight[a.priority || 'low'];
        const weightB = priorityWeight[b.priority || 'low'];
        if (weightA !== weightB) return weightB - weightA;
      } else if (subtaskSortOrder === 'asc') {
        const weightA = priorityWeight[a.priority || 'low'];
        const weightB = priorityWeight[b.priority || 'low'];
        if (weightA !== weightB) return weightA - weightB;
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
  };

  const activeSubtasks = sortSubtasks(taskSubtasks.filter(s => !s.completed));
  const completedSubtasks = sortSubtasks(taskSubtasks.filter(s => s.completed));

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuth('create a subtask')) return;
    if (!newSubtaskTitle.trim() || !user) return;

    const subtask: Subtask = {
      id: `subtask-${Date.now()}`,
      taskId: taskId,
      title: newSubtaskTitle.trim(),
      completed: false,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      priority: newSubtaskPriority,
    };

    try {
      setIsSubmitting(true);
      await dispatch(createSubtaskAsync(subtask));
      setNewSubtaskTitle('');
      setNewSubtaskPriority('low'); // Reset to default low
      toast('Drafted checklist subtask successfully! 🧱', 'success');
    } catch (err) {
      toast('Failed to append subtask checklist.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBulkSubtasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuth('create a subtask')) return;
    if (!bulkText.trim() || !user) return;

    const lines = bulkText.split('\n');
    const newSubtasks: Subtask[] = [];
    const timestamp = Date.now();

    lines.forEach((line, index) => {
      let trimmed = line.trim();
      if (!trimmed) return;

      // Clean up common bullet/number prefixes (e.g. "1- ", "2. ", "- ", "* ", "[ ] ", "[x] ")
      trimmed = trimmed.replace(/^(?:\d+[-.)\s]*|[-*+\s]|\[\s*[xX]?\s*\]\s*)+/, '').trim();

      if (trimmed) {
        newSubtasks.push({
          id: `subtask-${timestamp}-${index}`,
          taskId: taskId,
          title: trimmed,
          completed: false,
          userId: user.uid,
          createdAt: new Date(timestamp + index).toISOString(),
          priority: newSubtaskPriority,
        });
      }
    });

    if (newSubtasks.length === 0) {
      toast('No valid subtasks found to import.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(createSubtasksBulkAsync(newSubtasks));
      setBulkText('');
      setIsBulkMode(false);
      setNewSubtaskPriority('low'); // Reset to default low
      toast(`Successfully imported ${newSubtasks.length} checklist items! 🧱`, 'success');
    } catch (err) {
      toast('Failed to bulk import subtasks.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    if (!checkAuth('toggle subtask status')) return;
    const newCompletedState = !subtask.completed;

    try {
      await dispatch(updateSubtaskAsync({ ...subtask, completed: newCompletedState }));
      
      if (newCompletedState) {
        // Gain 35 XP rewards on subtask checklist completion
        dispatch(incrementXP(35));
        dispatch(updateStreak());
        playCompletionSound(soundEnabled);
        toast('+35 XP Score! Subtask completed! 🔔', 'success');
      } else {
        toast('Subtask reverted to active.', 'info');
      }
    } catch (err) {
      toast('Failed to mutate checklist state.', 'error');
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!checkAuth('delete subtasks')) return;
    setSubtaskToDeleteId(subtaskId);
  };

  const handleConfirmDeleteSubtask = async () => {
    if (!subtaskToDeleteId) return;
    const deletedSubtask = subtasks.find(s => s.id === subtaskToDeleteId);
    try {
      await dispatch(deleteSubtaskAsync(subtaskToDeleteId));
      toast('Subtask deleted.', 'info', undefined, deletedSubtask ? {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreSubtaskAsync(deletedSubtask.id));
          toast('Subtask restored.', 'success');
        }
      } : undefined);
    } catch (err) {
      toast('Failed to delete subtask.', 'error');
    } finally {
      setSubtaskToDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-card border border-gray-border rounded-3xl p-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-border/50 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-text-primary tracking-wide">
            Subtask Checklists & Logging
          </h3>
          <button
            type="button"
            onClick={() => setIsBulkMode(!isBulkMode)}
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1.5 cursor-pointer bg-brand-primary/10 px-2 py-0.5 rounded-md hover:bg-brand-primary/15"
          >
            {isBulkMode ? 'Switch to Single' : 'Bulk Import'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary/70">
            Tally: {taskSubtasks.length} items
          </span>
          <button
            type="button"
            onClick={() => {
              let nextSort: 'default' | 'asc' | 'desc' = 'default';
              if (subtaskSortOrder === 'default') nextSort = 'desc';
              else if (subtaskSortOrder === 'desc') nextSort = 'asc';
              setSubtaskSortOrder(nextSort);
              localStorage.setItem('todo_subtask_sort_order', nextSort);
            }}
            className="text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1 cursor-pointer bg-brand-primary/10 px-1.5 py-0.5 rounded-md hover:bg-brand-primary/15"
            title="Sort subtasks by priority"
          >
            Sort: {subtaskSortOrder === 'default' ? 'Date' : subtaskSortOrder === 'desc' ? 'Priority ↓' : 'Priority ↑'}
          </button>
        </div>
      </div>

      {isBulkMode ? (
        <form onSubmit={handleAddBulkSubtasks} className="flex flex-col gap-3 border-b border-gray-border/50 pb-4 mb-2">
          <textarea
            placeholder={`Paste multiple lines here...\n1- First subtask\n2- Second subtask\n3- Third subtask`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-all focus:outline-hidden focus:border-brand-primary resize-y min-h-[100px] font-sans"
          />
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary/60">
                Bullets & numbers are cleaned automatically.
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNewSubtaskPriority('low')}
                  className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                    newSubtaskPriority === 'low'
                      ? 'bg-success ring-2 ring-success/40 scale-110 shadow-md shadow-success/30'
                      : 'bg-success/30 hover:bg-success/60'
                  }`}
                  title="Low Priority"
                  aria-label="Set low priority"
                />
                <button
                  type="button"
                  onClick={() => setNewSubtaskPriority('medium')}
                  className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                    newSubtaskPriority === 'medium'
                      ? 'bg-warning ring-2 ring-warning/40 scale-110 shadow-md shadow-warning/30'
                      : 'bg-warning/30 hover:bg-warning/60'
                  }`}
                  title="Medium Priority"
                  aria-label="Set medium priority"
                />
                <button
                  type="button"
                  onClick={() => setNewSubtaskPriority('high')}
                  className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                    newSubtaskPriority === 'high'
                      ? 'bg-error ring-2 ring-error/40 scale-110 shadow-md shadow-error/30'
                      : 'bg-error/30 hover:bg-error/60'
                  }`}
                  title="High Priority"
                  aria-label="Set high priority"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsBulkMode(false);
                  setBulkText('');
                  setNewSubtaskPriority('low');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="accent" size="sm" disabled={isSubmitting}>
                <Plus className="w-4 h-4 mr-1" />
                Import List
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleAddSubtask} className="flex gap-2 items-center border-b border-gray-border/50 pb-4 mb-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setNewSubtaskPriority('low')}
              className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                newSubtaskPriority === 'low'
                  ? 'bg-success ring-2 ring-success/40 scale-110 shadow-md shadow-success/30'
                  : 'bg-success/30 hover:bg-success/60'
              }`}
              title="Low Priority"
              aria-label="Set low priority"
            />
            <button
              type="button"
              onClick={() => setNewSubtaskPriority('medium')}
              className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                newSubtaskPriority === 'medium'
                  ? 'bg-warning ring-2 ring-warning/40 scale-110 shadow-md shadow-warning/30'
                  : 'bg-warning/30 hover:bg-warning/60'
              }`}
              title="Medium Priority"
              aria-label="Set medium priority"
            />
            <button
              type="button"
              onClick={() => setNewSubtaskPriority('high')}
              className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                newSubtaskPriority === 'high'
                  ? 'bg-error ring-2 ring-error/40 scale-110 shadow-md shadow-error/30'
                  : 'bg-error/30 hover:bg-error/60'
              }`}
              title="High Priority"
              aria-label="Set high priority"
            />
          </div>
          <input
            type="text"
            placeholder="Add subtask instruction…"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-all focus:outline-hidden focus:border-brand-primary"
          />
          <Button type="submit" variant="accent" size="sm" disabled={isSubmitting}>
            <Plus className="w-4 h-4 mr-1" />
            Append
          </Button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {/* Active Subtasks Block */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => {
                const newState = !isActiveSubtasksOpen;
                setIsActiveSubtasksOpen(newState);
                localStorage.setItem('todo_active_subtasks_expanded', String(newState));
              }}
              className="text-xs font-bold text-text-secondary/60 hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer select-none"
            >
              <span>{isActiveSubtasksOpen ? 'Hide Active Subtasks' : 'Show Active Subtasks'} ({activeSubtasks.length})</span>
            </button>
          </div>

          {isActiveSubtasksOpen && (
            activeSubtasks.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1 no-scrollbar animate-slide-in">
                {activeSubtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`group flex items-center justify-between gap-4 p-3.5 rounded-2xl border transition-all ${
                      subtask.priority === 'high'
                        ? 'bg-error/5 border-error/20 text-text-primary border-l-4 border-l-error'
                        : subtask.priority === 'medium'
                          ? 'bg-warning/5 border-warning/20 text-text-primary border-l-4 border-l-warning'
                          : 'bg-bg-secondary border-gray-border/60 text-text-primary border-l-4 border-l-success'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <button
                        onClick={() => handleToggleSubtask(subtask)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                          subtask.priority === 'high'
                            ? 'border-error bg-bg-primary text-transparent hover:border-error/80'
                            : subtask.priority === 'medium'
                              ? 'border-warning bg-bg-primary text-transparent hover:border-warning/80'
                              : 'border-gray-border bg-bg-primary text-transparent hover:border-text-secondary/50'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold truncate">
                        {subtask.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        title="Remove subtask"
                      >
                        <Trash2 className="w-4 h-4 text-error/70 hover:text-error" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-text-secondary/40 gap-2 border border-dashed border-gray-border/50 rounded-2xl">
                <ShieldAlert className="w-8 h-8 text-brand-primary/40 animate-bounce" />
                <span className="text-xs font-bold">No active subtasks.</span>
              </div>
            )
          )}
        </div>

        {/* Completed Subtasks Block */}
        {completedSubtasks.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-border/20 pt-3">
            <div className="flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={() => {
                  const newState = !isCompletedSubtasksOpen;
                  setIsCompletedSubtasksOpen(newState);
                  localStorage.setItem('todo_completed_subtasks_expanded', String(newState));
                }}
                className="text-xs font-bold text-text-secondary/60 hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer select-none"
              >
                <span>{isCompletedSubtasksOpen ? 'Hide Completed Subtasks' : 'Show Completed Subtasks'} ({completedSubtasks.length})</span>
              </button>
            </div>

            {isCompletedSubtasksOpen && (
              <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1 no-scrollbar animate-slide-in">
                {completedSubtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`group flex items-center justify-between gap-4 p-3.5 rounded-2xl border border-success/15 bg-success/5 text-text-secondary/60 transition-all hover:bg-success/10 border-l-4 ${
                      subtask.priority === 'high'
                        ? 'border-l-error/40'
                        : subtask.priority === 'medium'
                          ? 'border-l-warning/40'
                          : 'border-l-success/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <button
                        onClick={() => handleToggleSubtask(subtask)}
                        className="w-5 h-5 rounded-md flex items-center justify-center border border-success bg-success text-white transition-all shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold truncate line-through opacity-50">
                        {subtask.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        title="Remove subtask"
                      >
                        <Trash2 className="w-4 h-4 text-error/70 hover:text-error" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={subtaskToDeleteId !== null}
        onClose={() => setSubtaskToDeleteId(null)}
        onConfirm={handleConfirmDeleteSubtask}
        title="Delete Subtask?"
        message={`Are you sure you want to permanently delete "${subtasks.find(s => s.id === subtaskToDeleteId)?.title || 'this subtask'}"?`}
        confirmLabel="Delete"
        isDanger={true}
      />
    </div>
  );
};

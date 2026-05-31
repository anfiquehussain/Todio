import React, { useState } from 'react';
import { 
  AlertCircle, Edit2, Trash2, Check, X, Copy 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useRedux';
import { 
  createSubtaskAsync, updateSubtaskAsync, deleteSubtaskAsync, createSubtasksBulkAsync 
} from '../../../../store/slices/todoSlice';
import { incrementXP, updateStreak } from '../../../../store/slices/profileSlice';
import { playCompletionSound } from '../../../../lib/sound';
import type { Task, Subtask, UserProfile } from '../../../../types';

interface SubtaskChecklistProps {
  activeTask: Task;
  subtasks: Subtask[];
  user: UserProfile | null;
  soundEnabled: boolean;
  checkAuth: (action: string) => boolean;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SubtaskChecklist = ({
  activeTask,
  subtasks,
  user,
  soundEnabled,
  checkAuth,
  toast
}: SubtaskChecklistProps) => {
  const dispatch = useAppDispatch();
  const { isDetailsPaneExpanded } = useAppSelector((state) => state.todo);

  // Load subtask expand/collapse memory from localStorage
  const [isActiveSubtasksOpen, setIsActiveSubtasksOpen] = useState(() => {
    const cached = localStorage.getItem('todo_active_subtasks_expanded');
    return cached === null ? true : cached === 'true';
  });

  const [isCompletedSubtasksOpen, setIsCompletedSubtasksOpen] = useState(() => {
    const cached = localStorage.getItem('todo_completed_subtasks_expanded');
    return cached === null ? false : cached === 'true';
  });

  const [subtaskSortOrder, setSubtaskSortOrder] = useState<'default' | 'asc' | 'desc'>(() => {
    const cached = localStorage.getItem('todo_subtask_sort_order');
    return (cached as 'default' | 'asc' | 'desc') || 'default';
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskPriority, setNewSubtaskPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Subtask Editing Inline State
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [editingSubtaskPriority, setEditingSubtaskPriority] = useState<'low' | 'medium' | 'high'>('low');

  // Subtask Addition
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !activeTask || !user) return;
    if (!checkAuth('add subtask checklist')) return;

    const subtask: Subtask = {
      id: `subtask-${Date.now()}`,
      taskId: activeTask.id,
      title: newSubtaskTitle.trim(),
      completed: false,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      priority: newSubtaskPriority,
    };

    try {
      await dispatch(createSubtaskAsync(subtask)).unwrap();
      setNewSubtaskTitle('');
      setNewSubtaskPriority('low'); // Reset to default low
      toast('Checklist item appended! 🧱', 'success');
    } catch {
      toast('Failed to add checklist item.', 'error');
    }
  };

  // Bulk Subtask Addition
  const handleAddBulkSubtasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim() || !activeTask || !user) return;
    if (!checkAuth('add subtask checklist')) return;

    const lines = bulkText.split('\n');
    const newSubtasks: Subtask[] = [];
    const timestamp = Date.now();

    lines.forEach((line, index) => {
      let trimmed = line.trim();
      if (!trimmed) return;

      // Clean up common prefixes
      trimmed = trimmed.replace(/^(?:\d+[-.)\s]*|[-*+\s]|\[\s*[xX]?\s*\]\s*)+/, '').trim();

      if (trimmed) {
        newSubtasks.push({
          id: `subtask-${timestamp}-${index}`,
          taskId: activeTask.id,
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
      await dispatch(createSubtasksBulkAsync(newSubtasks)).unwrap();
      setBulkText('');
      setIsBulkMode(false);
      setNewSubtaskPriority('low'); // Reset to default low
      toast(`Successfully imported ${newSubtasks.length} checklist items! 🧱`, 'success');
    } catch {
      toast('Failed to bulk import subtasks.', 'error');
    }
  };

  // Subtask Complete Toggle
  const handleToggleSubtask = async (sub: Subtask) => {
    if (!checkAuth('toggle subtask')) return;
    const completedState = !sub.completed;

    try {
      await dispatch(updateSubtaskAsync({ ...sub, completed: completedState })).unwrap();
      if (completedState) {
        dispatch(incrementXP(35));
        dispatch(updateStreak());
        playCompletionSound(soundEnabled);
        toast('Subtask completed! +35 XP Score! 🔔', 'success');
      } else {
        toast('Subtask reverted to active.', 'info');
      }
    } catch {
      toast('Failed to toggle subtask.', 'error');
    }
  };

  // Subtask Delete
  const handleDeleteSubtask = async (id: string) => {
    if (!checkAuth('delete subtask')) return;
    try {
      await dispatch(deleteSubtaskAsync(id)).unwrap();
      toast('Subtask deleted.', 'info');
    } catch {
      toast('Failed to remove subtask.', 'error');
    }
  };

  const handleUpdateSubtask = async (sub: Subtask) => {
    if (!editingSubtaskTitle.trim()) return;
    try {
      await dispatch(updateSubtaskAsync({ 
        ...sub, 
        title: editingSubtaskTitle.trim(),
        priority: editingSubtaskPriority
      })).unwrap();
      setEditingSubtaskId(null);
      toast('Subtask checklist item updated! 🧱', 'success');
    } catch {
      toast('Failed to update subtask.', 'error');
    }
  };

  const currentTaskSubtasks = subtasks.filter(s => s.taskId === activeTask.id);
  const activeSubtasks = currentTaskSubtasks.filter(s => !s.completed);
  const completedSubtasks = currentTaskSubtasks.filter(s => s.completed);

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
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const sortedActiveSubtasks = sortSubtasks(activeSubtasks);
  const sortedCompletedSubtasks = sortSubtasks(completedSubtasks);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary/50">Subtask checklist</label>
          <button
            type="button"
            onClick={() => setIsBulkMode(!isBulkMode)}
            className="text-[9px] font-bold text-brand-primary hover:text-brand-primary/85 transition-colors flex items-center gap-1.5 cursor-pointer bg-brand-primary/10 px-2 py-0.5 rounded-md hover:bg-brand-primary/15"
          >
            {isBulkMode ? 'Switch to Single' : 'Bulk Import'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-secondary/70">
            Tally: {currentTaskSubtasks.length} items
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
            className="text-[9px] font-bold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1 cursor-pointer bg-brand-primary/10 px-1.5 py-0.5 rounded-md hover:bg-brand-primary/15"
            title="Sort subtasks by priority"
          >
            Sort: {subtaskSortOrder === 'default' ? 'Date' : subtaskSortOrder === 'desc' ? 'Priority ↓' : 'Priority ↑'}
          </button>
        </div>
      </div>

      {/* Add Subtask Input Form */}
      {isBulkMode ? (
        <form onSubmit={handleAddBulkSubtasks} className="flex flex-col gap-2 pb-2 border-b border-gray-border/20">
          <textarea
            placeholder={`Paste multiple lines here...\nReviews ( showli rating)\nSimilar recommendion\nMedia info`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-xl border border-gray-border bg-bg-primary text-text-primary text-[11px] font-semibold placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary resize-y min-h-[90px] font-sans"
          />
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-secondary/50">
                Pasted lines become checklist items.
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
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsBulkMode(false);
                  setBulkText('');
                  setNewSubtaskPriority('low');
                }}
                className="px-2.5 py-1.5 bg-[#202020] hover:bg-[#252525] border border-gray-border text-text-primary font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-all flex items-colors justify-center shrink-0 shadow-md shadow-brand-primary/10"
              >
                Import List
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleAddSubtask} className="flex gap-2 items-center pb-2 border-b border-gray-border/20">
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
            className="flex-1 px-3 py-2 rounded-xl border border-gray-border bg-bg-primary text-text-primary text-[11px] font-semibold placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold text-[11px] rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md shadow-brand-primary/10"
          >
            Append
          </button>
        </form>
      )}

      {/* Subtask listing */}
      <div className="flex flex-col gap-4">
        {/* Active Subtasks Block */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const newState = !isActiveSubtasksOpen;
                setIsActiveSubtasksOpen(newState);
                localStorage.setItem('todo_active_subtasks_expanded', String(newState));
              }}
              className="text-[10px] font-bold text-text-secondary/60 hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer select-none"
            >
              <span>{isActiveSubtasksOpen ? 'Hide Active Subtasks' : 'Show Active Subtasks'} ({activeSubtasks.length})</span>
            </button>
          </div>

          {isActiveSubtasksOpen && (
            sortedActiveSubtasks.length > 0 ? (
              <div className={`flex flex-col gap-2 select-none overflow-y-auto pr-1 no-scrollbar animate-slide-in ${
                isDetailsPaneExpanded ? 'max-h-[60vh]' : 'max-h-[200px]'
              }`}>
                {sortedActiveSubtasks.map(sub => (
                  <div
                    key={sub.id}
                    className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                      sub.priority === 'high'
                        ? 'bg-error/5 border-error/20 text-text-primary border-l-4 border-l-error'
                        : sub.priority === 'medium'
                          ? 'bg-warning/5 border-warning/20 text-text-primary border-l-4 border-l-warning'
                          : 'bg-bg-primary border-gray-border text-text-primary border-l-4 border-l-success'
                    }`}
                  >
                    {editingSubtaskId === sub.id ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdateSubtask(sub);
                        }}
                        className="flex-1 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingSubtaskPriority('low')}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                              editingSubtaskPriority === 'low'
                                ? 'bg-success ring-2 ring-success/40 scale-110'
                                : 'bg-success/30 hover:bg-success/60'
                            }`}
                            title="Low"
                            aria-label="Set low priority"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingSubtaskPriority('medium')}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                              editingSubtaskPriority === 'medium'
                                ? 'bg-warning ring-2 ring-warning/40 scale-110'
                                : 'bg-warning/30 hover:bg-warning/60'
                            }`}
                            title="Medium"
                            aria-label="Set medium priority"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingSubtaskPriority('high')}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                              editingSubtaskPriority === 'high'
                                ? 'bg-error ring-2 ring-error/40 scale-110'
                                : 'bg-error/30 hover:bg-error/60'
                            }`}
                            title="High"
                            aria-label="Set high priority"
                          />
                        </div>
                        <input
                          autoFocus
                          type="text"
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingSubtaskId(null);
                            }
                          }}
                          className="flex-1 px-2 py-1 rounded bg-[#202020] border border-gray-border/20 text-text-primary text-[11px] font-semibold focus:outline-hidden focus:border-brand-primary"
                        />
                        <button
                          type="submit"
                          className="p-1 bg-brand-primary hover:bg-brand-primary/90 text-white rounded cursor-pointer flex items-center justify-center shrink-0"
                          aria-label="Save subtask"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubtaskId(null)}
                          className="p-1 border border-gray-border hover:bg-white/5 text-text-secondary rounded cursor-pointer flex items-center justify-center shrink-0"
                          aria-label="Cancel"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                          <button
                            onClick={() => handleToggleSubtask(sub)}
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                              sub.priority === 'high'
                                ? 'border-error bg-bg-secondary text-transparent hover:border-error/80'
                                : sub.priority === 'medium'
                                  ? 'border-warning bg-bg-secondary text-transparent hover:border-warning/80'
                                  : 'border-gray-border bg-bg-secondary text-transparent hover:border-text-secondary'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[11px] font-bold truncate">
                            {sub.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(sub.title);
                              toast('Subtask copied to clipboard! 📋', 'success');
                            }}
                            className="p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Copy subtask"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubtaskId(sub.id);
                              setEditingSubtaskTitle(sub.title);
                              setEditingSubtaskPriority(sub.priority || 'low');
                            }}
                            className="p-1 hover:bg-[#282828] rounded text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Edit subtask"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubtask(sub.id);
                            }}
                            className="p-1 hover:bg-[#282828] rounded text-error opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Delete subtask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 text-text-secondary/40 gap-2 border border-dashed border-gray-border/50 rounded-2xl">
                <AlertCircle className="w-8 h-8 opacity-40 text-brand-primary" />
                <span className="text-[10px] font-bold">No active subtasks.</span>
              </div>
            )
          )}
        </div>

        {/* Completed Subtasks Block */}
        {completedSubtasks.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-border/20 pt-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const newState = !isCompletedSubtasksOpen;
                  setIsCompletedSubtasksOpen(newState);
                  localStorage.setItem('todo_completed_subtasks_expanded', String(newState));
                }}
                className="text-[10px] font-bold text-text-secondary/60 hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer select-none"
              >
                <span>{isCompletedSubtasksOpen ? 'Hide Completed Subtasks' : 'Show Completed Subtasks'} ({completedSubtasks.length})</span>
              </button>
            </div>

            {isCompletedSubtasksOpen && (
              <div className={`flex flex-col gap-2 select-none overflow-y-auto pr-1 no-scrollbar animate-slide-in ${
                isDetailsPaneExpanded ? 'max-h-[40vh]' : 'max-h-[150px]'
              }`}>
                {sortedCompletedSubtasks.map(sub => (
                  <div
                    key={sub.id}
                    className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border border-success/15 bg-success/5 text-text-secondary/50 transition-all hover:bg-success/10 border-l-4 ${
                      sub.priority === 'high'
                        ? 'border-l-error/40'
                        : sub.priority === 'medium'
                          ? 'border-l-warning/40'
                          : 'border-l-success/40'
                    }`}
                  >
                    {editingSubtaskId === sub.id ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdateSubtask(sub);
                        }}
                        className="flex-1 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingSubtaskPriority('low')}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                              editingSubtaskPriority === 'low'
                                ? 'bg-success ring-2 ring-success/40 scale-110'
                                : 'bg-success/30 hover:bg-success/60'
                            }`}
                            title="Low"
                            aria-label="Set low priority"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingSubtaskPriority('medium')}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                              editingSubtaskPriority === 'medium'
                                ? 'bg-warning ring-2 ring-warning/40 scale-110'
                                : 'bg-warning/30 hover:bg-warning/60'
                            }`}
                            title="Medium"
                            aria-label="Set medium priority"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingSubtaskPriority('high')}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                              editingSubtaskPriority === 'high'
                                ? 'bg-error ring-2 ring-error/40 scale-110'
                                : 'bg-error/30 hover:bg-error/60'
                            }`}
                            title="High"
                            aria-label="Set high priority"
                          />
                        </div>
                        <input
                          autoFocus
                          type="text"
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingSubtaskId(null);
                            }
                          }}
                          className="flex-1 px-2 py-1 rounded bg-[#202020] border border-gray-border/20 text-text-primary text-[11px] font-semibold focus:outline-hidden focus:border-brand-primary"
                        />
                        <button
                          type="submit"
                          className="p-1 bg-brand-primary hover:bg-brand-primary/90 text-white rounded cursor-pointer flex items-center justify-center shrink-0"
                          aria-label="Save subtask"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubtaskId(null)}
                          className="p-1 border border-gray-border hover:bg-white/5 text-text-secondary rounded cursor-pointer flex items-center justify-center shrink-0"
                          aria-label="Cancel"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                          <button
                            onClick={() => handleToggleSubtask(sub)}
                            className="w-4 h-4 rounded-md flex items-center justify-center border border-success bg-success text-white transition-all shrink-0 cursor-pointer"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[11px] font-bold truncate line-through opacity-50">
                            {sub.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(sub.title);
                              toast('Subtask copied to clipboard! 📋', 'success');
                            }}
                            className="p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Copy subtask"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubtaskId(sub.id);
                              setEditingSubtaskTitle(sub.title);
                              setEditingSubtaskPriority(sub.priority || 'low');
                            }}
                            className="p-1 hover:bg-[#282828] text-text-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Edit subtask"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubtask(sub.id);
                            }}
                            className="p-1 hover:bg-[#282828] rounded text-error opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

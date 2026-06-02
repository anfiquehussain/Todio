import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertCircle, Edit2, Trash2, Check, X, Copy, ChevronDown, ChevronUp, Upload, Download, ArrowUpDown, GripVertical 
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { useAppDispatch } from '../../../../hooks/useRedux';
import { 
  createSubtaskAsync, updateSubtaskAsync, deleteSubtaskAsync, createSubtasksBulkAsync, updateSubtasksPositionsAsync 
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
  onTriggerExport: (mode: 'task' | 'subtask') => void;
}

interface SubtaskTitleTextProps {
  title: string;
  lineClass?: string;
}

const SubtaskTitleText = ({ title, lineClass = '' }: SubtaskTitleTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = textRef.current;
      if (el) {
        setIsOverflowing(el.scrollHeight > el.clientHeight);
      }
    };
    
    measure();
    // Re-check after a brief tick to ensure layout and fonts are fully settled
    const timeout = setTimeout(measure, 100);
    return () => clearTimeout(timeout);
  }, [title]);

  return (
    <div className="flex items-start gap-1.5 flex-1 min-w-0">
      <span
        ref={textRef}
        title={title}
        className={`text-[11px] font-bold text-left select-text wrap-break-word flex-1 ${lineClass} ${
          isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1 overflow-hidden'
        }`}
      >
        {title}
      </span>
      {isOverflowing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-0.5 hover:bg-[#2e2e2e] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0 mt-0.5"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
};

export const SubtaskChecklist = ({
  activeTask,
  subtasks,
  user,
  soundEnabled,
  checkAuth,
  toast,
  onTriggerExport
}: SubtaskChecklistProps) => {
  const dispatch = useAppDispatch();

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

  // Drag and Drop Placement Indicator States
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

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
      // 'default' manual dragging sorting
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      if (posA !== posB) return posA - posB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const sortedActiveSubtasks = sortSubtasks(activeSubtasks);
  const sortedCompletedSubtasks = sortSubtasks(completedSubtasks);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-gray-border/30 pb-2 select-none">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary/50">Subtasks</label>
          <span className="text-[9px] font-bold text-text-secondary/60 bg-[#202020] border border-gray-border px-1.5 py-0.5 rounded-md">
            {currentTaskSubtasks.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Bulk Import Toggle */}
          <button
            type="button"
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isBulkMode
                ? 'bg-brand-primary/15 border-brand-primary/20 text-brand-primary'
                : 'bg-[#202020] border-gray-border text-text-secondary hover:text-text-primary hover:bg-[#252525]'
            }`}
            title={isBulkMode ? "Switch to single input" : "Bulk import subtasks"}
            aria-label="Bulk import subtasks"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Export Subtasks Action */}
          {currentTaskSubtasks.length > 0 && (
            <button
              type="button"
              onClick={() => onTriggerExport('subtask')}
              className="p-1.5 rounded-lg border border-gray-border bg-[#202020] text-text-secondary hover:text-text-primary hover:bg-[#252525] transition-all cursor-pointer animate-scale-in"
              title="Export subtasks list"
              aria-label="Export subtasks list"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sort Button */}
          <button
            type="button"
            onClick={() => {
              let nextSort: 'default' | 'asc' | 'desc' = 'default';
              if (subtaskSortOrder === 'default') nextSort = 'desc';
              else if (subtaskSortOrder === 'desc') nextSort = 'asc';
              setSubtaskSortOrder(nextSort);
              localStorage.setItem('todo_subtask_sort_order', nextSort);
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              subtaskSortOrder !== 'default'
                ? 'bg-brand-primary/15 border-brand-primary/20 text-brand-primary'
                : 'bg-[#202020] border-gray-border text-text-secondary hover:text-text-primary hover:bg-[#252525]'
            }`}
            title={`Sort: ${subtaskSortOrder === 'default' ? 'Date' : subtaskSortOrder === 'desc' ? 'Priority Descending' : 'Priority Ascending'}`}
            aria-label="Sort subtasks"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
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
        <form onSubmit={handleAddSubtask} className="flex flex-col sm:flex-row gap-2 pb-2 border-b border-gray-border/20">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <input
              type="text"
              placeholder="Add subtask instruction…"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-border bg-bg-primary text-text-primary text-[11px] font-semibold placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2 py-1.5 rounded-xl border border-gray-border/40">
              <span className="text-[9px] font-bold text-text-secondary/50 mr-1 uppercase tracking-wider">Priority</span>
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
            <button
              type="submit"
              className="px-3.5 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold text-[11px] rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md shadow-brand-primary/10"
            >
              Append
            </button>
          </div>
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
              <Reorder.Group
                axis="y"
                values={sortedActiveSubtasks}
                onReorder={(newOrder) => {
                  if (subtaskSortOrder !== 'default') {
                    setSubtaskSortOrder('default');
                    localStorage.setItem('todo_subtask_sort_order', 'default');
                  }
                  const updated = newOrder.map((sub, index) => ({
                    ...sub,
                    position: index,
                  }));
                  dispatch(updateSubtasksPositionsAsync(updated));
                }}
                className="flex flex-col gap-2 select-none pr-1 animate-slide-in"
              >
                {sortedActiveSubtasks.map(sub => (
                  <Reorder.Item
                    key={sub.id}
                    value={sub}
                    dragListener={editingSubtaskId !== sub.id}
                    className="w-full focus:outline-hidden relative"
                    draggable={editingSubtaskId !== sub.id}
                    onDragStart={() => {
                      setDraggedSubtaskId(sub.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relativeY = e.clientY - rect.top;
                      const isTop = relativeY < rect.height / 2;
                      setDragOverSubtaskId(sub.id);
                      setDropPosition(isTop ? 'top' : 'bottom');
                    }}
                    onDragLeave={() => {
                      setDragOverSubtaskId(null);
                      setDropPosition(null);
                    }}
                    onDragEnd={() => {
                      setDraggedSubtaskId(null);
                      setDragOverSubtaskId(null);
                      setDropPosition(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedSubtaskId && draggedSubtaskId !== sub.id) {
                        const updatedSubtasks = [...sortedActiveSubtasks];
                        const fromIdx = updatedSubtasks.findIndex(s => s.id === draggedSubtaskId);
                        if (fromIdx !== -1) {
                          const [removed] = updatedSubtasks.splice(fromIdx, 1);
                          // Calculate exact landing index in the updated (shrunk) list
                          let toIdx = updatedSubtasks.findIndex(s => s.id === sub.id);
                          if (toIdx !== -1) {
                            if (dropPosition === 'bottom') {
                              toIdx = toIdx + 1;
                            }
                            updatedSubtasks.splice(toIdx, 0, removed);
                            
                            if (subtaskSortOrder !== 'default') {
                              setSubtaskSortOrder('default');
                              localStorage.setItem('todo_subtask_sort_order', 'default');
                            }
                            const updated = updatedSubtasks.map((s, index) => ({
                              ...s,
                              position: index,
                            }));
                            dispatch(updateSubtasksPositionsAsync(updated));
                          }
                        }
                      }
                      setDraggedSubtaskId(null);
                      setDragOverSubtaskId(null);
                      setDropPosition(null);
                    }}
                  >
                    {dragOverSubtaskId === sub.id && dropPosition === 'top' && draggedSubtaskId !== sub.id && (
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-primary shadow-[0_0_8px_#6366f1] rounded-full z-50 pointer-events-none" />
                    )}

                    <div
                      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl border transition-all ${
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
                          className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full flex-1">
                            <div className="flex items-center gap-1 shrink-0 bg-[#1a1a1a] px-2 py-1.5 rounded-lg border border-gray-border/40 self-start xs:self-auto">
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
                              className="flex-1 min-w-0 px-2 py-1 rounded bg-[#202020] border border-gray-border/20 text-text-primary text-[11px] font-semibold focus:outline-hidden focus:border-brand-primary"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
                            <button
                              type="submit"
                              className="p-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                              aria-label="Save subtask"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubtaskId(null)}
                              className="p-1.5 border border-gray-border hover:bg-white/5 text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                              aria-label="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-start gap-2.5 overflow-hidden flex-1 w-full">
                            <div className="p-1 -ml-1 text-text-secondary/30 group-hover:text-text-secondary/70 hover:bg-[#282828] rounded cursor-grab active:cursor-grabbing transition-colors shrink-0 mt-0.5" title="Drag to reorder">
                              <GripVertical className="w-3 h-3" />
                            </div>
                            <button
                              onClick={() => handleToggleSubtask(sub)}
                              className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer mt-0.5 ${
                                sub.priority === 'high'
                                  ? 'border-error bg-bg-secondary text-transparent hover:border-error/80'
                                  : sub.priority === 'medium'
                                    ? 'border-warning bg-bg-secondary text-transparent hover:border-warning/80'
                                    : 'border-gray-border bg-bg-secondary text-transparent hover:border-text-secondary'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                            <SubtaskTitleText title={sub.title} />
                          </div>

                          <div className="flex items-center justify-end gap-1 shrink-0 w-full sm:w-auto border-t border-gray-border/10 pt-2 sm:border-t-0 sm:pt-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(sub.title);
                                toast('Subtask copied to clipboard! 📋', 'success');
                              }}
                              className="p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
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
                              className="p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                              title="Edit subtask"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubtask(sub.id);
                              }}
                              className="p-1 hover:bg-[#282828] rounded text-error transition-colors cursor-pointer shrink-0"
                              title="Delete subtask"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {dragOverSubtaskId === sub.id && dropPosition === 'bottom' && draggedSubtaskId !== sub.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-primary shadow-[0_0_8px_#6366f1] rounded-full z-50 pointer-events-none" />
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
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
              <div className="flex flex-col gap-2 select-none pr-1 animate-slide-in">
                {sortedCompletedSubtasks.map(sub => (
                  <div
                    key={sub.id}
                    className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl border border-success/15 bg-success/5 text-text-secondary/50 transition-all hover:bg-success/10 border-l-4 ${
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
                        className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full flex-1">
                          <div className="flex items-center gap-1 shrink-0 bg-[#1a1a1a] px-2 py-1.5 rounded-lg border border-gray-border/40 self-start xs:self-auto">
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
                            className="flex-1 min-w-0 px-2 py-1 rounded bg-[#202020] border border-gray-border/20 text-text-primary text-[11px] font-semibold focus:outline-hidden focus:border-brand-primary"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="submit"
                            className="p-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                            aria-label="Save subtask"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubtaskId(null)}
                            className="p-1.5 border border-gray-border hover:bg-white/5 text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                            aria-label="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start gap-2.5 overflow-hidden flex-1 w-full">
                          <button
                            onClick={() => handleToggleSubtask(sub)}
                            className="w-4 h-4 rounded-md flex items-center justify-center border border-success bg-success text-white transition-all shrink-0 cursor-pointer mt-0.5"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                          <SubtaskTitleText title={sub.title} lineClass="line-through opacity-50" />
                        </div>

                        <div className="flex items-center justify-end gap-1 shrink-0 w-full sm:w-auto border-t border-gray-border/10 pt-2 sm:border-t-0 sm:pt-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(sub.title);
                              toast('Subtask copied to clipboard! 📋', 'success');
                            }}
                            className="p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
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
                            className="p-1 hover:bg-[#282828] text-text-secondary rounded hover:text-text-primary transition-colors cursor-pointer shrink-0"
                            title="Edit subtask"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubtask(sub.id);
                            }}
                            className="p-1 hover:bg-[#282828] rounded text-error transition-colors cursor-pointer shrink-0"
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

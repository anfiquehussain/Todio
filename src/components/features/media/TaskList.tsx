import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Check, Trash2, Smile, Edit2, X, Copy, ChevronDown, ChevronUp, GripVertical, ArrowRight,
  ArrowDown, ArrowUp, ArrowDownAZ, ArrowDownZA, Clock, Calendar, Folder, LayoutList, CheckSquare
} from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  createTaskAsync, updateTaskAsync, deleteTaskAsync, 
  setActiveTaskId, setSortBy, updateTasksPositionsAsync, updateSubtasksPositionsAsync,
  setActiveCollectionId, setActiveSubcollectionId, setFilter,
  restoreTaskAsync, deleteTaskPermanentAsync,
  restoreCollectionAsync, deleteCollectionPermanentAsync,
  restoreSubcollectionAsync, deleteSubcollectionPermanentAsync,
  restoreSubtaskAsync, deleteSubtaskPermanentAsync,
  emptyTrashAsync, updateSubtaskAsync
} from '../../../store/slices/todoSlice';
import { setShowSubtasksInline, setShowListBadges } from '../../../store/slices/settingsSlice';
import { incrementXP, updateStreak } from '../../../store/slices/profileSlice';
import { playCompletionSound } from '../../../lib/sound';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { Modal } from '../../patterns/Modal';
import { ConfirmationModal } from '../../patterns/ConfirmationModal';
import { Button } from '../../ui/Button';
import type { Task, Collection, Subcollection, Subtask } from '../../../types';

interface TaskTitleTextProps {
  title: string;
  lineClass?: string;
}

const TaskTitleText = ({ title, lineClass = '' }: TaskTitleTextProps) => {
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
    const timeout = setTimeout(measure, 100);
    return () => clearTimeout(timeout);
  }, [title]);

  return (
    <div className="flex items-start gap-1.5 flex-1 min-w-0">
      <span
        ref={textRef}
        title={title}
        className={`text-xs font-bold text-left select-text wrap-break-word flex-1 ${lineClass} ${
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

interface SubtaskProgressProps {
  taskId: string;
  subtasks: Array<{ taskId: string; completed: boolean }>;
}

const SubtaskProgress = ({ taskId, subtasks }: SubtaskProgressProps) => {
  const taskSubtasks = subtasks.filter(s => s.taskId === taskId);
  const totalSubtasks = taskSubtasks.length;
  if (totalSubtasks === 0) return null;

  const completedSubtasks = taskSubtasks.filter(s => s.completed).length;
  const percent = Math.round((completedSubtasks / totalSubtasks) * 100);

  // Precision coordinates to prevent clipping in 16x16 viewBox
  const radius = 3.25;
  const circumference = 2 * Math.PI * radius; // ~20.42
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div 
      className="shrink-0 flex items-center justify-center w-5 h-5 text-text-secondary select-none"
      title={`${completedSubtasks} of ${totalSubtasks} subtasks completed (${percent}%)`}
    >
      <svg className="w-3.5 h-3.5 transform -rotate-90" viewBox="0 0 16 16">
        {/* Background outer ring (highly visible, elegant stroke) */}
        <circle
          cx="8"
          cy="8"
          r="6.5"
          className="stroke-text-secondary/30 fill-none"
          strokeWidth="1.2"
        />
        {/* Clock-like solid pie segment fill */}
        <circle
          cx="8"
          cy="8"
          r={radius}
          className="stroke-brand-primary fill-none transition-all duration-300"
          strokeWidth="6.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
    </div>
  );
};


interface ActiveTaskItemProps {
  task: Task;
  isSelected: boolean;
  subtasks: Array<{ taskId: string; completed: boolean }>;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  editingTaskTitle: string;
  setEditingTaskTitle: (title: string) => void;
  editingTaskPriority: number;
  setEditingTaskPriority: (priority: number) => void;
  handleUpdateTaskInline: (task: Task) => void;
  handleToggleComplete: (task: Task) => void;
  handleDeleteTask: (id: string) => void;
  handleCopyTask: (task: Task) => void;
  activeCollectionId: string | null;
  activeSubcollectionId: string | null;
  draggedTaskId: string | null;
  setDraggedTaskId: (id: string | null) => void;
  dragOverTaskId: string | null;
  setDragOverTaskId: (id: string | null) => void;
  dropPosition: 'top' | 'bottom' | null;
  setDropPosition: (pos: 'top' | 'bottom' | null) => void;
  activeQueue: Task[];
  sortBy: string;
  dispatch: any;
  toast: any;
}

const ActiveTaskItem = ({
  task,
  isSelected,
  subtasks: subtasksSummary,
  editingTaskId,
  setEditingTaskId,
  editingTaskTitle,
  setEditingTaskTitle,
  editingTaskPriority,
  setEditingTaskPriority,
  handleUpdateTaskInline,
  handleToggleComplete,
  handleDeleteTask,
  handleCopyTask,
  activeCollectionId,
  activeSubcollectionId,
  draggedTaskId,
  setDraggedTaskId,
  dragOverTaskId,
  setDragOverTaskId,
  dropPosition,
  setDropPosition,
  activeQueue,
  sortBy,
  dispatch,
  toast,
}: ActiveTaskItemProps) => {
  const dragControls = useDragControls();
  const { checkAuth } = useAuthGuard();

  const { showSubtasksInline, showListBadges } = useAppSelector((state) => state.settings);
  const { collections, subcollections, subtasks: allSubtasks, soundEnabled } = useAppSelector((state) => state.todo);

  const col = collections.find(c => c.id === task.collectionId);
  const sub = subcollections.find(s => s.id === task.subcollectionId);

  const taskSubtasks = allSubtasks.filter(s => s.taskId === task.id && !s.deleted);
  const inlineSubtasks = taskSubtasks.filter(s => {
    if (showSubtasksInline === 'all') return true;
    if (showSubtasksInline === 'imported-priority') {
      return (
        s.priority === 'high' || 
        s.priority === 'medium' || 
        task.imported === true || 
        task.priority >= 4
      );
    }
    return false;
  });

  const handleToggleSubtaskInline = async (subtaskItem: Subtask) => {
    if (!checkAuth('toggle subtask')) return;
    const completedState = !subtaskItem.completed;

    try {
      await dispatch(updateSubtaskAsync({ ...subtaskItem, completed: completedState })).unwrap();
      
      // Auto-update parent task completion status based on subtasks
      const updatedSubtasks = taskSubtasks.map(s => s.id === subtaskItem.id ? { ...s, completed: completedState } : s);
      const allCompleted = updatedSubtasks.every(s => s.completed);

      if (allCompleted && !task.completed && !task.manuallyUnchecked) {
        await dispatch(updateTaskAsync({ ...task, completed: true })).unwrap();
        dispatch(incrementXP(50));
        playCompletionSound(soundEnabled);
        toast('All subtasks completed! Task automatically completed! +50 XP Score! 🏆🔔', 'success');
      } else if (!allCompleted && task.completed) {
        await dispatch(updateTaskAsync({ ...task, completed: false })).unwrap();
        toast('Incomplete subtasks found! Task reverted to active queue. 🧭', 'info');
      }

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

  return (
    <Reorder.Item
      key={task.id}
      value={task}
      dragControls={dragControls}
      dragListener={false}
      className="w-full focus:outline-hidden relative flex flex-col gap-1.5"
      draggable={editingTaskId !== task.id}
      onDragStart={() => {
        setDraggedTaskId(task.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const isTop = relativeY < rect.height / 2;
        setDragOverTaskId(task.id);
        setDropPosition(isTop ? 'top' : 'bottom');
      }}
      onDragLeave={() => {
        setDragOverTaskId(null);
        setDropPosition(null);
      }}
      onDragEnd={() => {
        setDraggedTaskId(null);
        setDragOverTaskId(null);
        setDropPosition(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (draggedTaskId && draggedTaskId !== task.id) {
          const updatedTasks = [...activeQueue];
          const fromIdx = updatedTasks.findIndex(t => t.id === draggedTaskId);
          if (fromIdx !== -1) {
            const [removed] = updatedTasks.splice(fromIdx, 1);
            let toIdx = updatedTasks.findIndex(t => t.id === task.id);
            if (toIdx !== -1) {
              if (dropPosition === 'bottom') {
                toIdx = toIdx + 1;
              }
              updatedTasks.splice(toIdx, 0, removed);
              
              if (sortBy !== 'custom') {
                dispatch(setSortBy('custom'));
              }
              const updated = updatedTasks.map((t, index) => ({
                ...t,
                position: index,
              }));
              dispatch(updateTasksPositionsAsync(updated));
            }
          }
        }
        setDraggedTaskId(null);
        setDragOverTaskId(null);
        setDropPosition(null);
      }}
    >
      {dragOverTaskId === task.id && dropPosition === 'top' && draggedTaskId !== task.id && (
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-primary shadow-[0_0_10px_#6366f1] rounded-full z-50 pointer-events-none" />
      )}

      {editingTaskId === task.id ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateTaskInline(task);
          }}
          onClick={(e) => e.stopPropagation()}
          className={`flex items-center justify-between px-3.5 py-3.5 rounded-2xl border border-l-4 select-none transition-all ${
            editingTaskPriority >= 4
              ? 'bg-error/5 border-error/20 border-l-error'
              : editingTaskPriority >= 2
                ? 'bg-warning/5 border-warning/20 border-l-warning'
                : 'bg-[#181818]/60 border-gray-border border-l-success'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="flex items-center gap-1 shrink-0 bg-[#202020] border border-gray-border/20 px-2 py-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setEditingTaskPriority(1)}
                className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                  editingTaskPriority <= 1
                    ? 'bg-success ring-2 ring-success/40 scale-110'
                    : 'bg-success/30 hover:bg-success/60'
                }`}
                title="Low Priority"
                aria-label="Set low priority"
              />
              <button
                type="button"
                onClick={() => setEditingTaskPriority(3)}
                className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                  editingTaskPriority >= 2 && editingTaskPriority <= 3
                    ? 'bg-warning ring-2 ring-warning/40 scale-110'
                    : 'bg-warning/30 hover:bg-warning/60'
                }`}
                title="Medium Priority"
                aria-label="Set medium priority"
              />
              <button
                type="button"
                onClick={() => setEditingTaskPriority(5)}
                className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                  editingTaskPriority >= 4
                    ? 'bg-error ring-2 ring-error/40 scale-110'
                    : 'bg-error/30 hover:bg-error/60'
                }`}
                title="High Priority"
                aria-label="Set high priority"
              />
            </div>

            <input
              autoFocus
              type="text"
              value={editingTaskTitle}
              onChange={(e) => setEditingTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditingTaskId(null);
                }
              }}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-border bg-bg-primary text-text-primary text-[11px] font-semibold focus:outline-hidden focus:border-brand-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2.5">
            <button
              type="submit"
              className="p-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Save task"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditingTaskId(null)}
              className="p-1.5 border border-gray-border hover:bg-white/5 text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div
          onClick={() => dispatch(setActiveTaskId(task.id))}
          className={`group flex items-center justify-between px-3.5 py-3 rounded-2xl border border-l-4 cursor-pointer select-none transition-all ${
            task.priority >= 4
              ? `${isSelected ? 'bg-error/10 border-[#383838]' : 'bg-error/5 border-error/20 hover:bg-error/10'} border-l-error`
              : task.priority >= 2
                ? `${isSelected ? 'bg-warning/10 border-[#383838]' : 'bg-warning/5 border-warning/20 hover:bg-warning/10'} border-l-warning`
                : `${isSelected ? 'bg-[#222222] border-[#383838]' : 'bg-[#181818]/60 border-gray-border hover:bg-[#1c1c1c]'} border-l-success`
          } ${isSelected ? 'shadow-md shadow-brand-primary/5' : ''}`}
        >
          <div className="flex items-start gap-3 overflow-hidden flex-1">
            <div
              onPointerDown={(e) => {
                dragControls.start(e);
              }}
              className="p-1 -ml-1 text-text-secondary/30 group-hover:text-text-secondary/70 hover:bg-[#282828] rounded cursor-grab active:cursor-grabbing transition-colors shrink-0 mt-0.5 touch-none"
              title="Drag to reorder"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
              className={`w-4.5 h-4.5 rounded-full border bg-bg-secondary flex items-center justify-center text-transparent transition-all shrink-0 cursor-pointer mt-0.5 ${
                task.priority >= 4
                  ? 'border-error hover:border-error/80'
                  : task.priority >= 2
                    ? 'border-warning hover:border-warning/80'
                    : 'border-text-secondary/40 hover:border-brand-primary/80'
              }`}
              aria-label="Mark task completed"
            >
              <Check className={`w-3 h-3 ${
                task.priority >= 4 ? 'hover:text-error' : task.priority >= 2 ? 'hover:text-warning' : 'hover:text-brand-primary'
              }`} />
            </button>
            <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
              <TaskTitleText title={task.title} lineClass="text-text-primary" />
              {showListBadges && (col || sub) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  {col && (
                    <span 
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#202020] border border-gray-border/50 text-text-secondary select-none"
                      style={{ borderColor: `${col.color}33`, color: col.color }}
                    >
                      <Folder className="w-2.5 h-2.5" style={{ color: col.color }} />
                      <span>{col.name}</span>
                    </span>
                  )}
                  {sub && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#202020] border border-gray-border/50 text-text-secondary select-none">
                      <LayoutList className="w-2.5 h-2.5 text-brand-secondary" />
                      <span>{sub.name}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SubtaskProgress taskId={task.id} subtasks={subtasksSummary} />
            {!activeCollectionId && !activeSubcollectionId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setActiveCollectionId(task.collectionId));
                  dispatch(setActiveSubcollectionId(task.subcollectionId));
                  dispatch(setActiveTaskId(task.id));
                  dispatch(setFilter('all'));
                  toast("Navigated to task's workspace location! 🧭", 'success');
                }}
                className="p-1 hover:bg-[#2e2e2e] rounded text-brand-primary hover:text-brand-primary/80 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Go to Task Position (List/Sublist)"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyTask(task);
              }}
              className="p-1 hover:bg-[#2e2e2e] rounded text-text-secondary hover:text-text-primary opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Copy Task"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingTaskId(task.id);
                setEditingTaskTitle(task.title);
                setEditingTaskPriority(task.priority || 1);
              }}
              className="p-1 hover:bg-[#2e2e2e] rounded text-text-secondary hover:text-text-primary opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
              className="p-1 hover:bg-[#2e2e2e] rounded text-error/70 hover:text-error opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Inline Subtasks List */}
      {showSubtasksInline !== 'none' && inlineSubtasks.length > 0 && !editingTaskId && (
        <div className="mt-0.5 mb-1.5 ml-8 mr-2 flex flex-col gap-1.5 pl-3 border-l border-gray-border/40 select-none animate-slide-in">
          {inlineSubtasks.map(subtaskItem => (
             <div 
               key={subtaskItem.id} 
               onClick={(e) => e.stopPropagation()} 
               className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all bg-[#1a1a1a]/40 ${
                 subtaskItem.completed
                   ? 'border-success/20 border-l-2 border-l-success opacity-60 bg-success/5'
                   : subtaskItem.priority === 'high'
                     ? 'border-error/20 border-l-2 border-l-error bg-error/5 hover:bg-error/10'
                     : subtaskItem.priority === 'medium'
                       ? 'border-warning/20 border-l-2 border-l-warning bg-warning/5 hover:bg-warning/10'
                       : 'border-gray-border/60 border-l-2 border-l-success bg-[#121212]/40 hover:bg-[#151515]/50'
               }`}
             >
               <div className="flex items-center gap-2 overflow-hidden flex-1">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     handleToggleSubtaskInline(subtaskItem);
                   }}
                   className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                     subtaskItem.completed
                       ? 'bg-success border-success text-white'
                       : subtaskItem.priority === 'high'
                         ? 'border-error hover:border-error/80'
                         : subtaskItem.priority === 'medium'
                           ? 'border-warning hover:border-warning/80'
                           : 'border-gray-border hover:border-text-secondary'
                   }`}
                   aria-label="Toggle subtask completion"
                 >
                   {subtaskItem.completed && <Check className="w-2.5 h-2.5 text-white" />}
                 </button>
                 <span className={`truncate text-left ${subtaskItem.completed ? 'text-text-secondary line-through opacity-60' : 'text-text-primary'}`}>
                   {subtaskItem.title}
                 </span>
               </div>
               {subtaskItem.priority && (
                 <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded-sm shrink-0 ${
                   subtaskItem.priority === 'high'
                     ? 'bg-error/10 text-error'
                     : subtaskItem.priority === 'medium'
                       ? 'bg-warning/10 text-warning'
                       : 'bg-success/10 text-success'
                 }`}>
                   {subtaskItem.priority}
                 </span>
               )}
             </div>
          ))}
        </div>
      )}

      {dragOverTaskId === task.id && dropPosition === 'bottom' && draggedTaskId !== task.id && (
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-brand-primary shadow-[0_0_10px_#6366f1] rounded-full z-50 pointer-events-none" />
      )}
    </Reorder.Item>
  );
};

interface TrashQueueViewProps {
  tasks: Task[];
  collections: Collection[];
  subcollections: Subcollection[];
  subtasks: Subtask[];
  dispatch: any;
  toast: any;
}

const TrashQueueView = ({
  tasks,
  collections,
  subcollections,
  subtasks,
  dispatch,
  toast
}: TrashQueueViewProps) => {
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: 'collection' | 'subcollection' | 'task' | 'subtask';
    name: string;
  } | null>(null);
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);

  const getDaysLeft = (deletedAt?: string) => {
    if (!deletedAt) return '30 days left';
    const now = new Date();
    const deletedDate = new Date(deletedAt);
    const diffMs = now.getTime() - deletedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const daysLeft = 30 - diffDays;
    if (daysLeft <= 0) return 'Expiring';
    return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  };

  const handleRestoreCollection = async (id: string) => {
    try {
      await dispatch(restoreCollectionAsync(id)).unwrap();
      toast('Workspace list restored successfully.', 'success');
    } catch {
      toast('Failed to restore list.', 'error');
    }
  };

  const handleRestoreSubcollection = async (id: string) => {
    try {
      await dispatch(restoreSubcollectionAsync(id)).unwrap();
      toast('Sublist restored successfully.', 'success');
    } catch {
      toast('Failed to restore sublist.', 'error');
    }
  };

  const handleRestoreTask = async (id: string) => {
    try {
      await dispatch(restoreTaskAsync(id)).unwrap();
      toast('Task successfully restored.', 'success');
    } catch {
      toast('Failed to restore task.', 'error');
    }
  };

  const handleRestoreSubtask = async (id: string) => {
    try {
      await dispatch(restoreSubtaskAsync(id)).unwrap();
      toast('Subtask restored successfully.', 'success');
    } catch {
      toast('Failed to restore subtask.', 'error');
    }
  };

  const handleDeletePermanent = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    try {
      if (type === 'collection') {
        await dispatch(deleteCollectionPermanentAsync(id)).unwrap();
        toast('Workspace list permanently deleted.', 'info');
      } else if (type === 'subcollection') {
        await dispatch(deleteSubcollectionPermanentAsync(id)).unwrap();
        toast('Sublist permanently deleted.', 'info');
      } else if (type === 'task') {
        await dispatch(deleteTaskPermanentAsync(id)).unwrap();
        toast('Task permanently deleted.', 'info');
      } else if (type === 'subtask') {
        await dispatch(deleteSubtaskPermanentAsync(id)).unwrap();
        toast('Subtask permanently deleted.', 'info');
      }
    } catch {
      toast(`Failed to permanently delete ${type}.`, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const hasDeletedItems =
    collections.length > 0 ||
    subcollections.length > 0 ||
    tasks.length > 0 ||
    subtasks.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-text-secondary/50 uppercase tracking-wider select-none">
          Soft Deleted Items (Auto-purges after 30 days)
        </div>
        {hasDeletedItems && (
          <button
            onClick={() => setIsEmptyTrashModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-error/20 bg-error/5 hover:bg-error/15 text-error text-[10px] font-extrabold cursor-pointer transition-all select-none shadow-xs"
            title="Permanently empty all items in the trash"
            aria-label="Empty Trash Bin"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {hasDeletedItems ? (
        <div className="flex flex-col gap-5">
          {/* Collections (Lists) */}
          {collections.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary/40 px-1 select-none">
                Workspace Lists ({collections.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {collections.map(col => (
                  <div
                    key={col.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 select-none transition-all"
                    style={{ borderLeftColor: col.color || '#6366f1' }}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <Folder className="w-3.5 h-3.5 shrink-0 opacity-55" style={{ color: col.color }} />
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {col.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(col.deletedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreCollection(col.id)}
                        className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Restore List"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: col.id, type: 'collection', name: col.name })}
                        className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Delete permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subcollections (Sublists) */}
          {subcollections.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary/40 px-1 select-none">
                Workspace Sublists ({subcollections.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {subcollections.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-brand-secondary/40 select-none transition-all"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <LayoutList className="w-3.5 h-3.5 shrink-0 opacity-55 text-brand-secondary" />
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {sub.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(sub.deletedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreSubcollection(sub.id)}
                        className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Restore Sublist"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: sub.id, type: 'subcollection', name: sub.name })}
                        className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Delete permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary/40 px-1 select-none">
                Tasks ({tasks.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-text-secondary/40 select-none transition-all"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <CheckSquare className="w-3.5 h-3.5 shrink-0 opacity-55 text-text-secondary" />
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {task.title}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(task.deletedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreTask(task.id)}
                        className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Restore Task"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: task.id, type: 'task', name: task.title })}
                        className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Delete permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary/40 px-1 select-none">
                Subtasks ({subtasks.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {subtasks.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-success/40 select-none transition-all"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <CheckSquare className="w-3.5 h-3.5 shrink-0 opacity-55 text-success" />
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {sub.title}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(sub.deletedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreSubtask(sub.id)}
                        className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Restore Subtask"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: sub.id, type: 'subtask', name: sub.title })}
                        className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Delete permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 text-text-secondary/40 gap-3 border border-dashed border-gray-border/50 rounded-3xl mt-2 select-none">
          <Smile className="w-12 h-12 text-brand-primary/40 animate-pulse" />
          <div>
            <h3 className="text-xs font-black text-text-primary">Trash is empty</h3>
            <p className="text-[10px] mt-0.5">Deleted items will stay here for 30 days.</p>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmationModal
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeletePermanent}
          title={`Delete ${deleteTarget.type === 'collection' ? 'List' : deleteTarget.type === 'subcollection' ? 'Sublist' : deleteTarget.type === 'task' ? 'Task' : 'Subtask'} Permanently?`}
          message="This action cannot be undone. The item and all its contents will be lost forever."
          confirmLabel="Delete Permanently"
          isDanger={true}
        />
      )}

      {isEmptyTrashModalOpen && (
        <ConfirmationModal
          isOpen={isEmptyTrashModalOpen}
          onClose={() => setIsEmptyTrashModalOpen(false)}
          onConfirm={async () => {
            try {
              await dispatch(emptyTrashAsync()).unwrap();
              toast('Trash bin successfully cleared.', 'info');
            } catch {
              toast('Failed to empty trash bin.', 'error');
            } finally {
              setIsEmptyTrashModalOpen(false);
            }
          }}
          title="Empty Trash Bin?"
          message="Are you sure you want to permanently delete all items in the trash? This action cannot be undone."
          confirmLabel="Empty Trash"
          isDanger={true}
        />
      )}
    </div>
  );
};

export const TaskList = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();

  const { 
    tasks: allTasks, collections: allCollections, subcollections: allSubcollections, activeCollectionId, 
    activeSubcollectionId, activeTaskId, filter, sortBy, soundEnabled, subtasks: allSubtasks
  } = useAppSelector((state) => state.todo);
  const { showSubtasksInline, showListBadges } = useAppSelector((state) => state.settings);

  const collections = allCollections.filter(c => !c.deleted);
  const subcollections = allSubcollections.filter(s => !s.deleted);
  const tasks = filter === 'trash' ? allTasks.filter(t => t.deleted) : allTasks.filter(t => !t.deleted);
  const subtasks = allSubtasks.filter(s => !s.deleted);

  const { user } = useAppSelector((state) => state.auth);

  const [newTitle, setNewTitle] = useState('');
  const [expandedCompleted, setExpandedCompleted] = useState(false);

  const taskSortOptions = {
    custom: { label: 'Manual Order', icon: GripVertical },
    'priority-desc': { label: 'Priority: High → Low', icon: ArrowDown },
    'priority-asc': { label: 'Priority: Low → High', icon: ArrowUp },
    'dueDate-asc': { label: 'Due Date: Earliest', icon: Calendar },
    'dueDate-desc': { label: 'Due Date: Latest', icon: Calendar },
    'title-asc': { label: 'Name: A → Z', icon: ArrowDownAZ },
    'title-desc': { label: 'Name: Z → A', icon: ArrowDownZA },
    'createdAt-desc': { label: 'Newest Created', icon: Clock },
    'createdAt-asc': { label: 'Oldest Created', icon: Clock },
  } as const;

  const currentSort = taskSortOptions[sortBy as keyof typeof taskSortOptions] || taskSortOptions.custom;
  const ActiveSortIcon = currentSort.icon;

  // Drag and Drop Placement Indicator States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

  // Task Editing Inline State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [editingTaskPriority, setEditingTaskPriority] = useState<number>(1);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  const handleUpdateTaskInline = async (task: Task) => {
    if (!editingTaskTitle.trim()) return;
    try {
      await dispatch(updateTaskAsync({ 
        ...task, 
        title: editingTaskTitle.trim(),
        priority: editingTaskPriority
      })).unwrap();
      setEditingTaskId(null);
      toast('Task card updated inline! 🛠️', 'success');
    } catch {
      toast('Failed to save task card.', 'error');
    }
  };

  // Header Title Resolver
  const getHeaderTitle = () => {
    if (activeSubcollectionId) {
      return subcollections.find(s => s.id === activeSubcollectionId)?.name || 'Sublist';
    }
    if (activeCollectionId) {
      return collections.find(c => c.id === activeCollectionId)?.name || 'Workspace';
    }
    switch (filter) {
      case 'active': return 'Today';
      case 'all': return 'Imported';
      case 'overdue': return 'Inbox';
      case 'completed': return 'Completed Archive';
      case 'trash': return 'Trash Bin';
      default: return 'Tasks Workspace';
    }
  };

  // Filter Tasks list based on active dual-sidebar selectors
  const getFilteredTasks = () => {
    const today = new Date().setHours(0, 0, 0, 0);

    return tasks.filter(t => {
      // 1. Workspace filters
      if (activeSubcollectionId) {
        return t.subcollectionId === activeSubcollectionId;
      }
      if (activeCollectionId) {
        return t.collectionId === activeCollectionId;
      }

      // 2. Smart view filters
      if (filter === 'active') {
        return t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) === today;
      }
      if (filter === 'all') {
        return t.imported === true || t.priority >= 4;
      }
      if (filter === 'overdue') {
        return !t.collectionId;
      }
      if (filter === 'completed') {
        return t.completed;
      }
      return true;
    });
  };

  const sortedTasks = [...getFilteredTasks()].sort((a, b) => {
    if (sortBy === 'priority-desc') return b.priority - a.priority;
    if (sortBy === 'priority-asc') return a.priority - b.priority;
    if (sortBy === 'dueDate-desc') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    if (sortBy === 'dueDate-asc') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'createdAt-desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'createdAt-asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'title-asc') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'title-desc') {
      return b.title.localeCompare(a.title);
    }
    
    // Legacy support fallback
    if (sortBy as any === 'priority') return b.priority - a.priority;
    if (sortBy as any === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy as any === 'createdAt') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy as any === 'title') {
      return a.title.localeCompare(b.title);
    }

    // 'custom' manual dragging sorting
    const posA = a.position ?? 0;
    const posB = b.position ?? 0;
    if (posA !== posB) return posA - posB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const activeQueue = sortedTasks.filter(t => !t.completed);
  const completedQueue = sortedTasks.filter(t => t.completed);

  // Quick Add Task Form Submit
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!checkAuth('create a task') || !user) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      overview: '',
      priority: 1,
      dueDate: activeCollectionId ? '' : new Date().toISOString().split('T')[0], // Set today's date if in Today smart view
      completed: false,
      collectionId: activeCollectionId,
      subcollectionId: activeSubcollectionId,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      await dispatch(createTaskAsync(task)).unwrap();
      dispatch(incrementXP(10));
      dispatch(updateStreak());
      setNewTitle('');
      toast('Action task successfully established! +10 XP Score 🚀', 'success');
    } catch {
      toast('Failed to establish task card.', 'error');
    }
  };

  // Warning Modal for Incomplete Subtasks state
  const [warningTask, setWarningTask] = useState<Task | null>(null);
  const [isBulkCompleting, setIsBulkCompleting] = useState(false);

  const handleCompleteAllSubtasksAndTask = async () => {
    if (!warningTask || isBulkCompleting) return;
    setIsBulkCompleting(true);
    try {
      const taskSubtasks = subtasks.filter(s => s.taskId === warningTask.id);
      const incompleteSubtasks = taskSubtasks.filter(s => !s.completed);

      // 1. Mark all incomplete subtasks as completed
      const updatedSubtasks = incompleteSubtasks.map(s => ({ ...s, completed: true }));
      if (updatedSubtasks.length > 0) {
        await dispatch(updateSubtasksPositionsAsync(updatedSubtasks)).unwrap();
      }

      // 2. Mark parent task as completed
      await dispatch(updateTaskAsync({ ...warningTask, completed: true })).unwrap();

      // 3. XP reward: 35 XP per newly completed subtask + 50 XP for task
      const totalXP = updatedSubtasks.length * 35 + 50;
      dispatch(incrementXP(totalXP));
      dispatch(updateStreak());
      playCompletionSound(soundEnabled);

      toast(`Task and all its subtasks completed! +${totalXP} XP Score! 🏆🔔`, 'success');
    } catch {
      toast('Failed to complete all subtasks and task.', 'error');
    } finally {
      setIsBulkCompleting(false);
      setWarningTask(null);
    }
  };

  // Revert task modal state
  const [revertTask, setRevertTask] = useState<Task | null>(null);

  const handleRevertTaskResetSubtasks = async () => {
    if (!revertTask) return;
    try {
      const taskSubtasks = subtasks.filter(s => s.taskId === revertTask.id);
      const resetSubtasks = taskSubtasks.map(s => ({ ...s, completed: false }));

      // 1. Reset all subtasks
      if (resetSubtasks.length > 0) {
        await dispatch(updateSubtasksPositionsAsync(resetSubtasks)).unwrap();
      }

      // 2. Mark parent task as active (completed: false)
      await dispatch(updateTaskAsync({ ...revertTask, completed: false, manuallyUnchecked: false })).unwrap();

      toast('Task reverted to active and all subtasks reset! 🧭🧱', 'info');
    } catch {
      toast('Failed to revert task and reset subtasks.', 'error');
    } finally {
      setRevertTask(null);
    }
  };

  const handleRevertTaskKeepSubtasks = async () => {
    if (!revertTask) return;
    try {
      // Mark parent task as active (completed: false) and set manuallyUnchecked: true
      await dispatch(updateTaskAsync({ ...revertTask, completed: false, manuallyUnchecked: true })).unwrap();

      toast('Task reverted to active. Subtasks remain completed. 🧭', 'info');
    } catch {
      toast('Failed to revert task.', 'error');
    } finally {
      setRevertTask(null);
    }
  };

  // Task Toggle Complete Handler
  const handleToggleComplete = async (task: Task) => {
    if (!checkAuth('toggle task completion')) return;
    const completedState = !task.completed;

    if (completedState) {
      const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
      const hasIncompleteSubtasks = taskSubtasks.some(s => !s.completed);
      if (hasIncompleteSubtasks) {
        setWarningTask(task);
        return;
      }
    } else {
      // The task is being UNCHECKED (completedState is false)
      // Check if all subtasks are completed
      const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
      const allSubtasksCompleted = taskSubtasks.length > 0 && taskSubtasks.every(s => s.completed);

      if (allSubtasksCompleted) {
        setRevertTask(task);
        return;
      }
    }

    try {
      await dispatch(updateTaskAsync({ ...task, completed: completedState, manuallyUnchecked: false })).unwrap();
      
      if (completedState) {
        dispatch(incrementXP(50));
        dispatch(updateStreak());
        playCompletionSound(soundEnabled);
        toast('Primary task completed! +50 XP Score! 🔔', 'success');
      } else {
        toast('Task reverted back to active.', 'info');
      }
    } catch {
      toast('Failed to toggle task completion.', 'error');
    }
  };

  // Task Delete Handler
  const handleDeleteTask = (id: string) => {
    if (!checkAuth('delete this task')) return;
    setTaskToDeleteId(id);
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDeleteId) return;
    const deletedTask = tasks.find(t => t.id === taskToDeleteId);
    try {
      await dispatch(deleteTaskAsync(taskToDeleteId)).unwrap();
      toast('Task removed successfully.', 'info', undefined, deletedTask ? {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreTaskAsync(deletedTask.id));
          toast('Task restored.', 'success');
        }
      } : undefined);
    } catch {
      toast('Failed to delete task.', 'error');
    } finally {
      setTaskToDeleteId(null);
    }
  };

  // Task Copy to Clipboard Handler
  const handleCopyTask = (task: Task) => {
    const text = task.overview ? `${task.title}\n\nDescription:\n${task.overview}` : task.title;
    navigator.clipboard.writeText(text);
    toast('Task card content duplicated to clipboard! 📋', 'success');
  };

  const handleToggleSubtaskInline = async (subtaskItem: Subtask, parentTask: Task) => {
    if (!checkAuth('toggle subtask')) return;
    const completedState = !subtaskItem.completed;

    try {
      await dispatch(updateSubtaskAsync({ ...subtaskItem, completed: completedState })).unwrap();
      
      const taskSubtasks = subtasks.filter(s => s.taskId === parentTask.id && !s.deleted);
      const updatedSubtasks = taskSubtasks.map(s => s.id === subtaskItem.id ? { ...s, completed: completedState } : s);
      const allCompleted = updatedSubtasks.every(s => s.completed);

      if (allCompleted && !parentTask.completed && !parentTask.manuallyUnchecked) {
        await dispatch(updateTaskAsync({ ...parentTask, completed: true })).unwrap();
        dispatch(incrementXP(50));
        playCompletionSound(soundEnabled);
        toast('All subtasks completed! Task automatically completed! +50 XP Score! 🏆🔔', 'success');
      } else if (!allCompleted && parentTask.completed) {
        await dispatch(updateTaskAsync({ ...parentTask, completed: false })).unwrap();
        toast('Incomplete subtasks found! Task reverted to active queue. 🧭', 'info');
      }

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

  return (
    <div className={`flex-1 flex flex-col h-full border-r border-gray-border overflow-hidden ${activeTaskId ? 'hidden lg:flex' : 'flex'}`}>
      
      {/* Header Action Strip */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-border/50 bg-[#161616]/40 select-none">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black tracking-tight text-text-primary">{getHeaderTitle()}</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-border/30 text-text-secondary">
            {activeQueue.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Subtasks inline toggle button */}
          <button
            onClick={() => {
              const modes: Array<'none' | 'all' | 'imported-priority'> = ['none', 'all', 'imported-priority'];
              const idx = modes.indexOf(showSubtasksInline);
              const nextMode = modes[(idx + 1) % modes.length];
              dispatch(setShowSubtasksInline(nextMode));
              playCompletionSound(soundEnabled);
              toast(
                nextMode === 'none'
                  ? 'Inline subtasks hidden.'
                  : nextMode === 'all'
                  ? 'Showing all inline subtasks!'
                  : 'Showing priority/imported inline subtasks!',
                'success'
              );
            }}
            className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer text-[10px] font-bold shadow-sm ${
              showSubtasksInline === 'none'
                ? 'border-gray-border bg-[#202020] text-text-secondary hover:text-text-primary hover:bg-[#252525]'
                : showSubtasksInline === 'all'
                  ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                  : 'border-brand-secondary/40 bg-brand-secondary/10 text-brand-secondary shadow-[0_0_10px_rgba(6,182,212,0.15)]'
            }`}
            title={`Inline Subtasks: ${
              showSubtasksInline === 'none' 
                ? 'Hidden' 
                : showSubtasksInline === 'all' 
                  ? 'All' 
                  : 'Priority/Imported'
            } (Click to cycle)`}
            aria-label="Cycle inline subtasks options"
          >
            <LayoutList className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${
              showSubtasksInline === 'none'
                ? 'text-text-secondary'
                : showSubtasksInline === 'all'
                  ? 'text-brand-primary'
                  : 'text-brand-secondary'
            }`} />
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-text-secondary/50 select-none">Subtasks:</span>
              <span className="text-text-primary text-[10px] font-extrabold">
                {showSubtasksInline === 'none' ? 'Hide' : showSubtasksInline === 'all' ? 'All' : 'Priority'}
              </span>
            </div>
          </button>

          {/* List badges toggle button */}
          <button
            onClick={() => {
              dispatch(setShowListBadges(!showListBadges));
              playCompletionSound(soundEnabled);
              toast(!showListBadges ? 'Workspace list badges visible!' : 'Workspace list badges hidden.', 'success');
            }}
            className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer text-[10px] font-bold shadow-sm ${
              !showListBadges
                ? 'border-gray-border bg-[#202020] text-text-secondary hover:text-text-primary hover:bg-[#252525]'
                : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
            }`}
            title={`Workspace Badges: ${showListBadges ? 'Visible' : 'Hidden'} (Click to toggle)`}
            aria-label="Toggle workspace badges"
          >
            <Folder className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${showListBadges ? 'text-brand-primary' : 'text-text-secondary'}`} />
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-text-secondary/50 select-none">Badges:</span>
              <span className="text-text-primary text-[10px] font-extrabold">{showListBadges ? 'On' : 'Off'}</span>
            </div>
          </button>

          <button
            onClick={() => {
              const order: Array<
                'custom' | 'priority-desc' | 'priority-asc' | 'dueDate-asc' | 'dueDate-desc' | 'title-asc' | 'title-desc' | 'createdAt-desc' | 'createdAt-asc'
              > = [
                'custom', 'priority-desc', 'priority-asc', 'dueDate-asc', 'dueDate-desc', 'title-asc', 'title-desc', 'createdAt-desc', 'createdAt-asc'
              ];
              const idx = order.indexOf(sortBy);
              const nextSort = order[(idx + 1) % order.length];
              dispatch(setSortBy(nextSort));
              toast(`Sorted by: ${taskSortOptions[nextSort]?.label || 'Manual Order'} 🔄`, 'info');
            }}
            className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer text-[10px] font-bold shadow-sm ${
              sortBy === 'custom'
                ? 'border-gray-border bg-[#202020] text-text-secondary hover:text-text-primary hover:bg-[#252525]'
                : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
            }`}
            title={`Active Sort: ${currentSort.label} (Click to cycle)`}
            aria-label="Cycle sorting options"
          >
            <ActiveSortIcon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${sortBy === 'custom' ? 'text-text-secondary' : 'text-brand-primary'}`} />
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-text-secondary/50 select-none">Sort:</span>
              <span className="text-text-primary text-[10px] font-extrabold">{currentSort.label}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Add Task Input Box */}
      {filter !== 'trash' && (
        <div className="px-6 pt-4 pb-2 select-none">
          <form onSubmit={handleQuickAddTask} className="relative flex items-center">
            <Plus className="absolute left-3 w-4 h-4 text-text-secondary/70 pointer-events-none" />
            <input
              type="text"
              placeholder={`+ Add Task to "${getHeaderTitle()}"`}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full pl-9.5 pr-4 py-3 rounded-2xl border border-gray-border bg-[#181818] text-text-primary text-xs font-semibold placeholder:text-text-secondary/50 focus:outline-hidden focus:border-brand-primary/50 focus:bg-[#1a1a1a] transition-all"
            />
          </form>
        </div>
      )}


      {/* Active and Completed Task Lists Panel scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-4 no-scrollbar">
        {filter === 'trash' ? (
          <TrashQueueView
            tasks={allTasks.filter(t => t.deleted)}
            collections={allCollections.filter(c => c.deleted)}
            subcollections={allSubcollections.filter(s => s.deleted)}
            subtasks={allSubtasks.filter(s => s.deleted)}
            dispatch={dispatch}
            toast={toast}
          />
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
            {activeQueue.length > 0 ? (

            <Reorder.Group
              axis="y"
              values={activeQueue}
              onReorder={(newOrder) => {
                if (sortBy !== 'custom') {
                  dispatch(setSortBy('custom'));
                }
                const updated = newOrder.map((task, index) => ({
                  ...task,
                  position: index,
                }));
                dispatch(updateTasksPositionsAsync(updated));
              }}
              className="flex flex-col gap-1.5"
            >
              {activeQueue.map(task => (
                <ActiveTaskItem
                  key={task.id}
                  task={task}
                  isSelected={task.id === activeTaskId}
                  subtasks={subtasks}
                  editingTaskId={editingTaskId}
                  setEditingTaskId={setEditingTaskId}
                  editingTaskTitle={editingTaskTitle}
                  setEditingTaskTitle={setEditingTaskTitle}
                  editingTaskPriority={editingTaskPriority}
                  setEditingTaskPriority={setEditingTaskPriority}
                  handleUpdateTaskInline={handleUpdateTaskInline}
                  handleToggleComplete={handleToggleComplete}
                  handleDeleteTask={handleDeleteTask}
                  handleCopyTask={handleCopyTask}
                  activeCollectionId={activeCollectionId}
                  activeSubcollectionId={activeSubcollectionId}
                  draggedTaskId={draggedTaskId}
                  setDraggedTaskId={setDraggedTaskId}
                  dragOverTaskId={dragOverTaskId}
                  setDragOverTaskId={setDragOverTaskId}
                  dropPosition={dropPosition}
                  setDropPosition={setDropPosition}
                  activeQueue={activeQueue}
                  sortBy={sortBy}
                  dispatch={dispatch}
                  toast={toast}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 text-text-secondary/40 gap-3 border border-dashed border-gray-border/50 rounded-3xl mt-2 select-none">
              <Smile className="w-12 h-12 text-brand-primary/40 animate-bounce" />
              <div>
                <h3 className="text-xs font-black text-text-primary">Task queue cleared!</h3>
                <p className="text-[10px] mt-0.5">Establish a new productive action item to begin.</p>
              </div>
            </div>
          )}
        </div>

        {/* Completed Tasks Queue */}
        {completedQueue.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            <button
              onClick={() => setExpandedCompleted(!expandedCompleted)}
              className="flex items-center gap-2 px-1 py-1.5 text-[11px] font-bold text-text-secondary/60 hover:text-text-primary select-none cursor-pointer transition-colors border-b border-gray-border/20 w-fit"
            >
              <span>{expandedCompleted ? 'Hide Completed' : 'Show Completed'} ({completedQueue.length})</span>
            </button>

            {expandedCompleted && (
              <div className="flex flex-col gap-1.5 animate-slide-in">
                {completedQueue.map(task => {
                  const isSelected = task.id === activeTaskId;
                  const col = collections.find(c => c.id === task.collectionId);
                  const sub = subcollections.find(s => s.id === task.subcollectionId);

                  const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
                  const inlineSubtasks = taskSubtasks.filter(s => {
                    if (showSubtasksInline === 'all') return true;
                    if (showSubtasksInline === 'imported-priority') {
                      return (
                        s.priority === 'high' || 
                        s.priority === 'medium' || 
                        task.imported === true || 
                        task.priority >= 4
                      );
                    }
                    return false;
                  });

                  return editingTaskId === task.id ? (
                    <form
                      key={task.id}
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateTaskInline(task);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-success/15 bg-success/5 select-none transition-all border-l-4 ${
                        editingTaskPriority >= 4
                          ? 'border-l-error/40'
                          : editingTaskPriority >= 2
                            ? 'border-l-warning/40'
                            : 'border-l-success/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        {/* Priority Dots */}
                        <div className="flex items-center gap-1 shrink-0 bg-[#202020] border border-gray-border/20 px-2 py-1.5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setEditingTaskPriority(1)}
                            className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                              editingTaskPriority <= 1
                                ? 'bg-success ring-2 ring-success/40 scale-110'
                                : 'bg-success/30 hover:bg-success/60'
                            }`}
                            title="Low Priority"
                            aria-label="Set low priority"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingTaskPriority(3)}
                            className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                              editingTaskPriority >= 2 && editingTaskPriority <= 3
                                ? 'bg-warning ring-2 ring-warning/40 scale-110'
                                : 'bg-warning/30 hover:bg-warning/60'
                            }`}
                            title="Medium Priority"
                            aria-label="Set medium priority"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingTaskPriority(5)}
                            className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                              editingTaskPriority >= 4
                                ? 'bg-error ring-2 ring-error/40 scale-110'
                                : 'bg-error/30 hover:bg-error/60'
                            }`}
                            title="High Priority"
                            aria-label="Set high priority"
                          />
                        </div>

                        {/* Title Input */}
                        <input
                          autoFocus
                          type="text"
                          value={editingTaskTitle}
                          onChange={(e) => setEditingTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingTaskId(null);
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-border bg-bg-primary text-text-primary text-[11px] font-semibold focus:outline-hidden focus:border-brand-primary"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2.5">
                        <button
                          type="submit"
                          className="p-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                          aria-label="Save task"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                          className="p-1.5 border border-gray-border hover:bg-white/5 text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                          aria-label="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div key={task.id} className="flex flex-col gap-1.5">
                      <div
                        onClick={() => dispatch(setActiveTaskId(task.id))}
                        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-success/15 bg-success/5 opacity-60 select-none cursor-pointer transition-all border-l-4 ${
                          task.priority >= 4
                            ? 'border-l-error/40'
                            : task.priority >= 2
                              ? 'border-l-warning/40'
                              : 'border-l-success/40'
                        } ${isSelected ? 'bg-[#222] border-[#383838] opacity-100' : 'hover:opacity-100'}`}
                      >
                        <div className="flex items-start gap-3 overflow-hidden flex-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                            className="w-4.5 h-4.5 rounded-full border border-success bg-success text-white flex items-center justify-center shrink-0 cursor-pointer mt-0.5"
                            aria-label="Revert task active"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
                            <TaskTitleText title={task.title} lineClass="text-text-secondary line-through opacity-60" />
                            {showListBadges && (col || sub) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {col && (
                                  <span 
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#202020] border border-gray-border/50 text-text-secondary select-none"
                                    style={{ borderColor: `${col.color}33`, color: col.color }}
                                  >
                                    <Folder className="w-2.5 h-2.5" style={{ color: col.color }} />
                                    <span>{col.name}</span>
                                  </span>
                                )}
                                {sub && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#202020] border border-gray-border/50 text-text-secondary select-none">
                                    <LayoutList className="w-2.5 h-2.5 text-brand-secondary" />
                                    <span>{sub.name}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <SubtaskProgress taskId={task.id} subtasks={subtasks} />
                          {/* Go to position button */}
                          {!activeCollectionId && !activeSubcollectionId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(setActiveCollectionId(task.collectionId));
                                dispatch(setActiveSubcollectionId(task.subcollectionId));
                                dispatch(setActiveTaskId(task.id));
                                dispatch(setFilter('all'));
                                toast("Navigated to task's workspace location! 🧭", 'success');
                              }}
                              className="p-1 hover:bg-[#2e2e2e] rounded text-brand-primary hover:text-brand-primary/80 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Go to Task Position (List/Sublist)"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTask(task);
                            }}
                            className="p-1 hover:bg-[#2e2e2e] rounded text-text-secondary hover:text-text-primary opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Copy Task"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTaskId(task.id);
                              setEditingTaskTitle(task.title);
                              setEditingTaskPriority(task.priority || 1);
                            }}
                            className="p-1 hover:bg-[#2e2e2e] rounded text-text-secondary opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            className="p-1 hover:bg-[#2e2e2e] rounded text-error/60 hover:text-error opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Subtasks List for Completed Task */}
                      {showSubtasksInline !== 'none' && inlineSubtasks.length > 0 && (
                        <div className="mt-0.5 mb-1.5 ml-8 mr-2 flex flex-col gap-1.5 pl-3 border-l border-gray-border/40 select-none animate-slide-in">
                          {inlineSubtasks.map(subtaskItem => (
                            <div 
                              key={subtaskItem.id} 
                              onClick={(e) => e.stopPropagation()} 
                              className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all bg-[#1a1a1a]/40 ${
                                subtaskItem.completed
                                  ? 'border-success/20 border-l-2 border-l-success opacity-60 bg-success/5'
                                  : subtaskItem.priority === 'high'
                                    ? 'border-error/20 border-l-2 border-l-error bg-error/5'
                                    : subtaskItem.priority === 'medium'
                                      ? 'border-warning/20 border-l-2 border-l-warning bg-warning/5'
                                      : 'border-gray-border/60 border-l-2 border-l-success bg-[#121212]/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSubtaskInline(subtaskItem, task);
                                  }}
                                  className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                                    subtaskItem.completed
                                      ? 'bg-success border-success text-white'
                                      : subtaskItem.priority === 'high'
                                        ? 'border-error hover:border-error/80'
                                        : subtaskItem.priority === 'medium'
                                          ? 'border-warning hover:border-warning/80'
                                          : 'border-gray-border hover:border-text-secondary'
                                  }`}
                                  aria-label="Toggle subtask completion"
                                >
                                  {subtaskItem.completed && <Check className="w-2.5 h-2.5 text-white" />}
                                </button>
                                <span className={`truncate text-left ${subtaskItem.completed ? 'text-text-secondary line-through opacity-60' : 'text-text-primary'}`}>
                                  {subtaskItem.title}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Incomplete Subtasks Warning Modal */}
      <Modal
        isOpen={warningTask !== null}
        onClose={() => {
          if (!isBulkCompleting) setWarningTask(null);
        }}
        title="Incomplete Subtasks Warning ⚠️"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold text-text-secondary leading-relaxed select-text">
            You haven't completed all the subtasks for <span className="text-brand-primary">"{warningTask?.title}"</span>. What would you like to do?
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="primary"
              size="sm"
              className="w-full font-bold select-none cursor-pointer"
              disabled={isBulkCompleting}
              onClick={handleCompleteAllSubtasksAndTask}
            >
              {isBulkCompleting ? 'Completing…' : 'Complete all subtasks & continue'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full font-bold select-none cursor-pointer text-text-secondary hover:text-text-primary"
              disabled={isBulkCompleting}
              onClick={() => setWarningTask(null)}
            >
              Go back
            </Button>
          </div>
        </div>
      </Modal>

      {/* Task Reversion Confirmation Modal */}
      <Modal
        isOpen={revertTask !== null}
        onClose={() => setRevertTask(null)}
        title="Task Reversion Options 🔄"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold text-text-secondary leading-relaxed select-text">
            All the subtasks for <span className="text-brand-primary">"{revertTask?.title}"</span> are currently completed. How would you like to handle them?
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="danger"
              size="sm"
              className="w-full font-bold select-none cursor-pointer"
              onClick={handleRevertTaskResetSubtasks}
            >
              Reset all subtasks to active
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="w-full font-bold select-none cursor-pointer"
              onClick={handleRevertTaskKeepSubtasks}
            >
              Keep subtasks completed
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full font-bold select-none cursor-pointer text-text-secondary hover:text-text-primary"
              onClick={() => setRevertTask(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={taskToDeleteId !== null}
        onClose={() => setTaskToDeleteId(null)}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task?"
        message={`Are you sure you want to permanently delete "${tasks.find(t => t.id === taskToDeleteId)?.title || 'this task'}"?`}
        confirmLabel="Delete"
        isDanger={true}
      />
    </div>
  );
};

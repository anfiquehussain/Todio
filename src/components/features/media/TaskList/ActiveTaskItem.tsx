import { useState } from 'react';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';
import { 
  Check, GripVertical, Folder, LayoutList, ArrowRight, Copy, Edit2, Trash2, X, ChevronDown, MoreVertical
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useRedux';
import { 
  setActiveTaskId, setSortBy, updateTasksPositionsAsync, updateSubtaskAsync, updateTaskAsync,
  setActiveCollectionId, setActiveSubcollectionId, setFilter
} from '../../../../store/slices/todoSlice';
import { incrementXP, updateStreak } from '../../../../store/slices/profileSlice';
import { playCompletionSound } from '../../../../lib/sound';
import { useToast } from '../../../../hooks/useToast';
import { useAuthGuard } from '../../../../hooks/useAuthGuard';
import type { Task, Subtask } from '../../../../types';
import { ExpandableText } from '../../../patterns/ExpandableText';
import { SubtaskProgress } from './SubtaskProgress';

interface ActiveTaskItemProps {
  task: Task;
  isSelected: boolean;
  subtasks: Array<{ taskId: string; completed: boolean }>;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  editingTaskTitle: string;
  setEditingTaskTitle: (title: string) => void;
  editingTaskPriority: 'low' | 'medium' | 'high';
  setEditingTaskPriority: (priority: 'low' | 'medium' | 'high') => void;
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
  manuallyExpandedTaskIds: Record<string, boolean>;
  setManuallyExpandedTaskIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isSelectionMode?: boolean;
  isSelectedForBulk?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const ActiveTaskItem = ({
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
  manuallyExpandedTaskIds,
  setManuallyExpandedTaskIds,
  isSelectionMode = false,
  isSelectedForBulk = false,
  onToggleSelect,
}: ActiveTaskItemProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const dragControls = useDragControls();
  const { checkAuth } = useAuthGuard();
  const [showMenu, setShowMenu] = useState(false);

  const { showListBadges, subtaskFilter } = useAppSelector((state) => state.settings);
  const { collections, subcollections, subtasks: allSubtasks, soundEnabled } = useAppSelector((state) => state.todo);

  const col = collections.find(c => c.id === task.collectionId);
  const sub = subcollections.find(s => s.id === task.subcollectionId);

  const taskSubtasks = allSubtasks.filter(s => s.taskId === task.id && !s.deleted);

  const isExpanded = manuallyExpandedTaskIds[task.id] === true;

  const inlineSubtasks = taskSubtasks.filter(s => {
    if (s.completed) return false;
    if (subtaskFilter === 'priority') {
      return (
        s.priority === 'high' ||
        s.priority === 'medium' ||
        task.imported === true ||
        task.priority === 'high'
      );
    }
    return true;
  }).sort((a, b) => {
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    const weightA = priorityWeights[a.priority || 'low'] || 1;
    const weightB = priorityWeights[b.priority || 'low'] || 1;
    return weightB - weightA;
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
      draggable={editingTaskId !== task.id && !isSelectionMode}
      onDragStart={() => {
        if (!isSelectionMode) setDraggedTaskId(task.id);
      }}
      onDragOver={(e) => {
        if (isSelectionMode) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const isTop = relativeY < rect.height / 2;
        setDragOverTaskId(task.id);
        setDropPosition(isTop ? 'top' : 'bottom');
      }}
      onDragLeave={() => {
        if (isSelectionMode) return;
        setDragOverTaskId(null);
        setDropPosition(null);
      }}
      onDragEnd={() => {
        if (isSelectionMode) return;
        setDraggedTaskId(null);
        setDragOverTaskId(null);
        setDropPosition(null);
      }}
      onDrop={(e) => {
        if (isSelectionMode) return;
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
            editingTaskPriority === 'high'
              ? 'bg-error/5 border-error/20 border-l-error'
              : editingTaskPriority === 'medium'
                ? 'bg-warning/5 border-warning/20 border-l-warning'
                : 'bg-bg-primary/60 dark:bg-[#181818]/60 border-gray-border border-l-success'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="flex items-center gap-1 shrink-0 bg-bg-primary/85 dark:bg-[#202020] border border-gray-border/40 px-2 py-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setEditingTaskPriority('low')}
                className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                  editingTaskPriority === 'low'
                    ? 'bg-success ring-2 ring-success/40 scale-110'
                    : 'bg-success/30 hover:bg-success/60'
                }`}
                title="Low Priority"
                aria-label="Set low priority"
              />
              <button
                type="button"
                onClick={() => setEditingTaskPriority('medium')}
                className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                  editingTaskPriority === 'medium'
                    ? 'bg-warning ring-2 ring-warning/40 scale-110'
                    : 'bg-warning/30 hover:bg-warning/60'
                }`}
                title="Medium Priority"
                aria-label="Set medium priority"
              />
              <button
                type="button"
                onClick={() => setEditingTaskPriority('high')}
                className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                  editingTaskPriority === 'high'
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
          onClick={() => {
            if (isSelectionMode) {
              onToggleSelect?.(task.id);
            } else {
              dispatch(setActiveTaskId(task.id));
            }
          }}
          className={`group flex items-center justify-between px-3.5 py-3 rounded-2xl border cursor-pointer select-none transition-all ${
            isSelected 
              ? 'bg-brand-primary/10 border-brand-primary/45 shadow-xs' 
              : 'bg-card border-gray-border/80 hover:border-brand-primary/25 hover:shadow-xs'
          } ${isSelected ? 'shadow-md shadow-brand-primary/5' : ''}`}
        >
          <div className="flex items-start gap-3 overflow-hidden flex-1">
            {isSelectionMode ? (
              <input
                type="checkbox"
                checked={isSelectedForBulk}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(task.id);
                }}
                className="w-4 h-4 rounded border-gray-border bg-bg-primary text-brand-primary focus:ring-brand-primary shrink-0 mt-1.5 cursor-pointer accent-brand-primary"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {sortBy === 'custom' && (
                  <div
                    onPointerDown={(e) => {
                      dragControls.start(e);
                    }}
                    className="p-1 -ml-1 text-text-secondary/30 group-hover:text-text-secondary/70 hover:bg-bg-primary rounded cursor-grab active:cursor-grabbing transition-colors shrink-0 mt-0.5 touch-none"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                )}
                {taskSubtasks.length > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setManuallyExpandedTaskIds(prev => ({
                        ...prev,
                        [task.id]: !isExpanded
                      }));
                    }}
                    className="p-1 -ml-1 text-text-secondary/50 hover:text-text-primary hover:bg-bg-primary rounded transition-colors shrink-0 mt-0.5 cursor-pointer flex items-center justify-center"
                    title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                    aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <div className="w-5.5 h-5.5 shrink-0" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                  className={`w-4.5 h-4.5 rounded-full border bg-bg-secondary flex items-center justify-center text-transparent transition-all shrink-0 cursor-pointer mt-0.5 ${
                    task.priority === 'high'
                      ? 'border-error hover:border-error/80'
                      : task.priority === 'medium'
                        ? 'border-warning hover:border-warning/80'
                        : 'border-text-secondary/40 hover:border-brand-primary/80'
                  }`}
                  aria-label="Mark task completed"
                >
                  <Check className={`w-3 h-3 ${
                    task.priority === 'high' ? 'hover:text-error' : task.priority === 'medium' ? 'hover:text-warning' : 'hover:text-brand-primary'
                  }`} />
                </button>
              </>
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
              <ExpandableText text={task.title} lineClass="text-text-primary" />
              {showListBadges && (
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/5 dark:bg-[#202020] border select-none ${
                    task.priority === 'high'
                      ? 'border-error/25 text-error'
                      : task.priority === 'medium'
                        ? 'border-warning/25 text-warning'
                        : 'border-success/25 text-success'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      task.priority === 'high' ? 'bg-error' : task.priority === 'medium' ? 'bg-warning' : 'bg-success'
                    }`} />
                    <span>{task.priority}</span>
                  </span>
                  {col && (
                    <span 
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/5 dark:bg-[#202020] border border-gray-border/50 text-text-secondary select-none"
                      style={{ borderColor: `${col.color}33`, color: col.color }}
                    >
                      <Folder className="w-2.5 h-2.5" style={{ color: col.color }} />
                      <span>{col.name}</span>
                    </span>
                  )}
                  {sub && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/5 dark:bg-[#202020] border border-gray-border/50 text-text-secondary select-none">
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
            {!isSelectionMode && (
              <div className="relative">
                {showMenu && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setShowMenu(false); 
                    }} 
                  />
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1.5 hover:bg-bg-primary rounded-xl text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0 relative z-50 flex items-center justify-center"
                  title="More actions"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-1.5 w-36 bg-white/95 dark:bg-card/95 backdrop-blur-md border border-gray-border/60 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!activeCollectionId && !activeSubcollectionId && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            dispatch(setActiveCollectionId(task.collectionId));
                            dispatch(setActiveSubcollectionId(task.subcollectionId));
                            dispatch(setActiveTaskId(task.id));
                            dispatch(setFilter('all'));
                            toast("Navigated to task's workspace location! 🧭", 'success');
                          }}
                          className="w-full px-3 py-2 text-left text-[11px] font-bold text-brand-primary hover:bg-slate-100 dark:hover:bg-bg-primary transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Go to List</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleCopyTask(task);
                        }}
                        className="w-full px-3 py-2 text-left text-[11px] font-bold text-text-primary hover:bg-slate-100 dark:hover:bg-bg-primary transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-text-secondary" />
                        <span>Copy Task</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setEditingTaskId(task.id);
                          setEditingTaskTitle(task.title);
                          setEditingTaskPriority(task.priority || 'medium');
                        }}
                        className="w-full px-3 py-2 text-left text-[11px] font-bold text-text-primary hover:bg-slate-100 dark:hover:bg-bg-primary transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-text-secondary" />
                        <span>Edit Task</span>
                      </button>
                      <div className="h-px bg-gray-border/30 my-0.5" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleDeleteTask(task.id);
                        }}
                        className="w-full px-3 py-2 text-left text-[11px] font-bold text-error hover:bg-error/10 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Task</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Subtasks List */}
      <AnimatePresence initial={false}>
        {isExpanded && inlineSubtasks.length > 0 && !editingTaskId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="mt-0.5 mb-1.5 ml-8 mr-2 flex flex-col gap-1.5 pl-3 border-l border-gray-border/40 select-none overflow-hidden"
          >
            {inlineSubtasks.map(subtaskItem => (
              <div 
                key={subtaskItem.id} 
                onClick={(e) => e.stopPropagation()} 
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all bg-bg-secondary/40 border-gray-border/50 hover:bg-bg-primary/50 ${
                  subtaskItem.completed ? 'opacity-60' : ''
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
               </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {dragOverTaskId === task.id && dropPosition === 'bottom' && draggedTaskId !== task.id && (
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-brand-primary shadow-[0_0_10px_#6366f1] rounded-full z-50 pointer-events-none" />
      )}
    </Reorder.Item>
  );
};

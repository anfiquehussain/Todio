import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Check, Trash2, ArrowUpDown, Smile, Edit2, X, Copy, ChevronDown, ChevronUp, GripVertical, ArrowRight 
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  createTaskAsync, updateTaskAsync, deleteTaskAsync, 
  setActiveTaskId, setSortBy, updateTasksPositionsAsync,
  setActiveCollectionId, setActiveSubcollectionId, setFilter
} from '../../../store/slices/todoSlice';
import { incrementXP, updateStreak } from '../../../store/slices/profileSlice';
import { playCompletionSound } from '../../../lib/sound';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import type { Task } from '../../../types';

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

export const TaskList = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();

  const { 
    tasks, collections, subcollections, activeCollectionId, 
    activeSubcollectionId, activeTaskId, filter, sortBy, soundEnabled, subtasks
  } = useAppSelector((state) => state.todo);
  const { user } = useAppSelector((state) => state.auth);

  const [newTitle, setNewTitle] = useState('');
  const [expandedCompleted, setExpandedCompleted] = useState(false);

  // Drag and Drop Placement Indicator States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

  // Task Editing Inline State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [editingTaskPriority, setEditingTaskPriority] = useState<number>(1);

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
    if (sortBy === 'priority') return b.priority - a.priority;
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'createdAt') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'title') {
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

  // Task Toggle Complete Handler
  const handleToggleComplete = async (task: Task) => {
    if (!checkAuth('toggle task completion')) return;
    const completedState = !task.completed;

    try {
      await dispatch(updateTaskAsync({ ...task, completed: completedState })).unwrap();
      
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
  const handleDeleteTask = async (id: string) => {
    if (!checkAuth('delete this task')) return;
    try {
      await dispatch(deleteTaskAsync(id)).unwrap();
      toast('Task removed successfully.', 'info');
    } catch {
      toast('Failed to delete task.', 'error');
    }
  };

  // Task Copy to Clipboard Handler
  const handleCopyTask = (task: Task) => {
    const text = task.overview ? `${task.title}\n\nDescription:\n${task.overview}` : task.title;
    navigator.clipboard.writeText(text);
    toast('Task card content duplicated to clipboard! 📋', 'success');
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
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const order: Array<'custom' | 'priority' | 'dueDate' | 'title' | 'createdAt'> = ['custom', 'priority', 'dueDate', 'title', 'createdAt'];
              const idx = order.indexOf(sortBy);
              dispatch(setSortBy(order[(idx + 1) % order.length]));
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#1f1f1f] text-text-secondary hover:text-text-primary rounded-xl cursor-pointer transition-colors"
            title="Cycle sorting mode"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">
              {sortBy === 'custom' ? 'Manual' : sortBy === 'priority' ? 'Priority' : sortBy === 'dueDate' ? 'Due Date' : sortBy === 'title' ? 'Title' : 'Created'}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Add Task Input Box */}
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

      {/* Active and Completed Task Lists Panel scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-4 no-scrollbar">
        
        {/* Active Tasks Queue */}
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
              {activeQueue.map(task => {
                const isSelected = task.id === activeTaskId;

                return (
                  <Reorder.Item
                    key={task.id}
                    value={task}
                    dragListener={editingTaskId !== task.id}
                    className="w-full focus:outline-hidden relative"
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
                          // Calculate exact landing index in the updated (shrunk) list
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
                          <div className="p-1 -ml-1 text-text-secondary/30 group-hover:text-text-secondary/70 hover:bg-[#282828] rounded cursor-grab active:cursor-grabbing transition-colors shrink-0 mt-0.5" title="Drag to reorder">
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
                          <TaskTitleText title={task.title} lineClass="text-text-primary" />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
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

                          {/* Copy action only shown on hover */}
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

                          {/* Edit action only shown on hover */}
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

                          {/* Deletion action only shown on hover */}
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

                    {dragOverTaskId === task.id && dropPosition === 'bottom' && draggedTaskId !== task.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-brand-primary shadow-[0_0_10px_#6366f1] rounded-full z-50 pointer-events-none" />
                    )}
                  </Reorder.Item>
                );
              })}
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
                    <div
                      key={task.id}
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
                        <TaskTitleText title={task.title} lineClass="text-text-secondary line-through opacity-60" />
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
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

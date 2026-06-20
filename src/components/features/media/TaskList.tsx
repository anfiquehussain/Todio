import React, { useState } from 'react';
import { 
  Plus, Check, Trash2, Smile, Edit2, X, Copy, GripVertical, ArrowRight,
  ArrowDown, ArrowUp, ArrowDownAZ, ArrowDownZA, Clock, Calendar, Folder, LayoutList, ChevronDown,
  ListFilter, ChevronsUpDown, Upload, CheckSquare
} from 'lucide-react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  createTaskAsync, updateTaskAsync, deleteTaskAsync, 
  setActiveTaskId, setSortBy, updateTasksPositionsAsync,
  setActiveCollectionId, setActiveSubcollectionId, setFilter,
  restoreTaskAsync, updateSubtaskAsync, updateSubtasksPositionsAsync,
  deleteTasksBulkAsync, restoreTasksBulkAsync
} from '../../../store/slices/todoSlice';
import { incrementXP, updateStreak } from '../../../store/slices/profileSlice';
import { playCompletionSound } from '../../../lib/sound';
import { setShowListBadges, setSubtaskFilter } from '../../../store/slices/settingsSlice';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { Modal } from '../../patterns/Modal';
import { ConfirmationModal } from '../../patterns/ConfirmationModal';
import { Button } from '../../ui/Button';
import type { Task, Subtask } from '../../../types';

import { ExpandableText } from '../../patterns/ExpandableText';
import { ActiveTaskItem } from './TaskList/ActiveTaskItem';
import { TrashQueueView } from './TaskList/TrashQueueView';
import { SubtaskProgress } from './TaskList/SubtaskProgress';
import { BulkImportModal } from './TaskList/BulkImportModal';

export const TaskList = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();

  const { 
    tasks: allTasks, collections: allCollections, subcollections: allSubcollections, activeCollectionId, 
    activeSubcollectionId, activeTaskId, filter, sortBy, soundEnabled, subtasks: allSubtasks
  } = useAppSelector((state) => state.todo);
  const { showListBadges, subtaskFilter, defaultTaskPriority, autoArchiveCompleted } = useAppSelector((state) => state.settings);

  const collections = allCollections.filter(c => !c.deleted);
  const subcollections = allSubcollections.filter(s => !s.deleted);
  const tasks = filter === 'trash' ? allTasks.filter(t => t.deleted) : allTasks.filter(t => !t.deleted);
  const subtasks = allSubtasks.filter(s => !s.deleted);

  const { user } = useAppSelector((state) => state.auth);

  const [newTitle, setNewTitle] = useState('');
  const [expandedCompleted, setExpandedCompleted] = useState(false);
  const [manuallyExpandedTaskIds, setManuallyExpandedTaskIds] = useState<Record<string, boolean>>({});

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

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [editingTaskPriority, setEditingTaskPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Record<string, boolean>>({});
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
        return t.imported === true || t.priority === 'high';
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
    if (sortBy === 'priority-desc') {
      const w = { high: 3, medium: 2, low: 1 };
      return w[b.priority] - w[a.priority];
    }
    if (sortBy === 'priority-asc') {
      const w = { high: 3, medium: 2, low: 1 };
      return w[a.priority] - w[b.priority];
    }
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
    const w = { high: 3, medium: 2, low: 1 };
    if (sortBy as string === 'priority') return w[b.priority] - w[a.priority];
    if (sortBy as string === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy as string === 'createdAt') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy as string === 'title') {
      return a.title.localeCompare(b.title);
    }

    // 'custom' manual dragging sorting
    const posA = a.position ?? 0;
    const posB = b.position ?? 0;
    if (posA !== posB) return posA - posB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const activeQueue = sortedTasks.filter(t => !t.completed);
  const completedQueue = autoArchiveCompleted ? [] : sortedTasks.filter(t => t.completed);

  const visibleTasks = getFilteredTasks();
  const anyExpanded = visibleTasks.some(t => manuallyExpandedTaskIds[t.id] === true);

  const handleToggleExpandAll = () => {
    if (anyExpanded) {
      setManuallyExpandedTaskIds({});
    } else {
      const newExpanded: Record<string, boolean> = {};
      visibleTasks.forEach(t => {
        const hasSubtasks = subtasks.some(s => s.taskId === t.id && !s.deleted);
        if (hasSubtasks) {
          newExpanded[t.id] = true;
        }
      });
      setManuallyExpandedTaskIds(newExpanded);
    }
  };

  // Quick Add Task Form Submit
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!checkAuth('create a task') || !user) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      overview: '',
      priority: defaultTaskPriority,
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

  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = () => {
    const nextSelected: Record<string, boolean> = {};
    sortedTasks.forEach(t => {
      nextSelected[t.id] = true;
    });
    setSelectedTaskIds(nextSelected);
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds({});
  };

  const selectedTaskCount = Object.values(selectedTaskIds).filter(Boolean).length;

  const handleBulkDeleteClick = () => {
    if (selectedTaskCount === 0) return;
    if (!checkAuth('delete tasks')) return;
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    const idsToDelete = Object.keys(selectedTaskIds).filter(id => selectedTaskIds[id]);
    if (idsToDelete.length === 0) return;

    setIsBulkDeleting(true);
    try {
      await dispatch(deleteTasksBulkAsync(idsToDelete)).unwrap();
      toast(`Successfully deleted ${idsToDelete.length} tasks.`, 'info', undefined, {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreTasksBulkAsync(idsToDelete));
          toast(`Restored ${idsToDelete.length} tasks.`, 'success');
        }
      });
      setSelectedTaskIds({});
      setIsSelectionMode(false);
    } catch {
      toast('Failed to delete selected tasks.', 'error');
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteModalOpen(false);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4.5 border-b border-gray-border/50 bg-bg-secondary/80 dark:bg-[#161616]/40 backdrop-blur-md select-none">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black tracking-tight text-text-primary truncate max-w-[200px] xs:max-w-[280px] sm:max-w-none">{getHeaderTitle()}</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-bg-primary dark:bg-gray-border/30 border border-gray-border/50 text-text-secondary tabular-nums">
            {activeQueue.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap justify-start sm:justify-end">
          {/* Expand/Collapse All Button */}
          <button
            onClick={() => {
              handleToggleExpandAll();
              playCompletionSound(soundEnabled);
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer shadow-sm ${
              !anyExpanded
                ? 'border-gray-border/85 bg-bg-primary/50 hover:bg-bg-secondary dark:bg-[#202020] text-text-secondary hover:text-text-primary dark:hover:bg-[#252525]'
                : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
            }`}
            title={anyExpanded ? 'Collapse All Tasks' : 'Expand All Tasks'}
            aria-label="Toggle expand all tasks"
          >
            <ChevronsUpDown className="w-4 h-4 text-inherit" />
          </button>

          {/* Subtasks Filter Button */}
          <button
            onClick={() => {
              const nextFilter = subtaskFilter === 'all' ? 'priority' : 'all';
              dispatch(setSubtaskFilter(nextFilter));
              playCompletionSound(soundEnabled);
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer shadow-sm ${
              subtaskFilter === 'all'
                ? 'border-gray-border/85 bg-bg-primary/50 hover:bg-bg-secondary dark:bg-[#202020] text-text-secondary hover:text-text-primary dark:hover:bg-[#252525]'
                : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
            }`}
            title={`Subtask Filter: ${subtaskFilter === 'all' ? 'All Active' : 'Priority Only'}`}
            aria-label="Toggle subtask filter"
          >
            <ListFilter className="w-4 h-4 text-inherit" />
          </button>

          {/* List badges toggle button */}
          <button
            onClick={() => {
              dispatch(setShowListBadges(!showListBadges));
              playCompletionSound(soundEnabled);
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer shadow-sm ${
              !showListBadges
                ? 'border-gray-border/85 bg-bg-primary/50 hover:bg-bg-secondary dark:bg-[#202020] text-text-secondary hover:text-text-primary dark:hover:bg-[#252525]'
                : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
            }`}
            title={`Workspace Badges: ${showListBadges ? 'Visible' : 'Hidden'}`}
            aria-label="Toggle workspace badges"
          >
            <Folder className="w-4 h-4 text-inherit" />
          </button>

          {/* Bulk Import Button */}
          {filter !== 'trash' && (
            <button
              onClick={() => {
                setIsBulkImportOpen(true);
                dispatch(setActiveTaskId(null));
                playCompletionSound(soundEnabled);
              }}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-border/85 bg-bg-primary/50 hover:bg-bg-secondary dark:bg-[#202020] text-text-secondary hover:text-text-primary dark:hover:bg-[#252525] transition-all cursor-pointer shadow-sm"
              title="Bulk Import Tasks"
              aria-label="Bulk Import Tasks"
            >
              <Upload className="w-4 h-4 text-inherit" />
            </button>
          )}

          {/* Multi-Select Toggle Button */}
          {filter !== 'trash' && (
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedTaskIds({});
                dispatch(setActiveTaskId(null));
                playCompletionSound(soundEnabled);
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer shadow-sm ${
                isSelectionMode
                  ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                  : 'border-gray-border/85 bg-bg-primary/50 hover:bg-bg-secondary dark:bg-[#202020] text-text-secondary hover:text-text-primary dark:hover:bg-[#252525]'
              }`}
              title={isSelectionMode ? 'Exit Selection Mode' : 'Select Multiple Tasks'}
              aria-label="Toggle multi-select mode"
            >
              <CheckSquare className="w-4 h-4 text-inherit" />
            </button>
          )}

          {/* Sort Button */}
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
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer shadow-sm ${
              sortBy === 'custom'
                ? 'border-gray-border/85 bg-bg-primary/50 hover:bg-bg-secondary dark:bg-[#202020] text-text-secondary hover:text-text-primary dark:hover:bg-[#252525]'
                : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
            }`}
            title={`Active Sort: ${currentSort.label} (Click to cycle)`}
            aria-label="Cycle sorting options"
          >
            <ActiveSortIcon className="w-4 h-4 text-inherit" />
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
              className="w-full pl-9.5 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-gray-border/80 bg-slate-100/90 dark:bg-[#181818] text-text-primary text-xs font-semibold placeholder:text-text-secondary/50 focus:outline-hidden focus:border-brand-primary/50 focus:bg-white dark:focus:bg-[#1a1a1a] transition-all"
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
                  manuallyExpandedTaskIds={manuallyExpandedTaskIds}
                  setManuallyExpandedTaskIds={setManuallyExpandedTaskIds}
                  isSelectionMode={isSelectionMode}
                  isSelectedForBulk={!!selectedTaskIds[task.id]}
                  onToggleSelect={handleToggleSelectTask}
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
                        editingTaskPriority === 'high'
                          ? 'border-l-error/40'
                          : editingTaskPriority === 'medium'
                            ? 'border-l-warning/40'
                            : 'border-l-success/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        {/* Priority Dots */}
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
                        onClick={() => {
                          if (isSelectionMode) {
                            handleToggleSelectTask(task.id);
                          } else {
                            dispatch(setActiveTaskId(task.id));
                          }
                        }}
                        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl border opacity-60 select-none cursor-pointer transition-all ${
                          isSelected ? 'bg-brand-primary/10 border-brand-primary/45 opacity-100 shadow-xs' : 'bg-card border-gray-border/60 hover:opacity-100 hover:border-brand-primary/25'
                        }`}
                      >
                        <div className="flex items-start gap-3 overflow-hidden flex-1">
                          {isSelectionMode ? (
                            <input
                              type="checkbox"
                              checked={!!selectedTaskIds[task.id]}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleSelectTask(task.id);
                              }}
                              className="w-4 h-4 rounded border-gray-border bg-bg-primary dark:bg-[#202020] text-brand-primary focus:ring-brand-primary shrink-0 mt-1.5 cursor-pointer accent-brand-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                              className="w-4.5 h-4.5 rounded-full border border-success bg-success text-white flex items-center justify-center shrink-0 cursor-pointer mt-0.5"
                              aria-label="Revert task active"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {taskSubtasks.length > 0 && !isSelectionMode ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setManuallyExpandedTaskIds(prev => ({
                                  ...prev,
                                  [task.id]: !isExpanded
                                }));
                              }}
                              className="p-1 -ml-1 text-text-secondary/50 hover:text-text-primary hover:bg-black/5 dark:hover:bg-[#282828] rounded transition-colors shrink-0 mt-0.5 cursor-pointer flex items-center justify-center"
                              title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                              aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                            >
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                            </button>
                          ) : (
                            taskSubtasks.length > 0 && isSelectionMode ? null : <div className="w-5.5 h-5.5 shrink-0" />
                          )}
                          
                          <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
                            <ExpandableText text={task.title} lineClass="text-text-secondary line-through opacity-60" />
                            {showListBadges && (col || sub) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
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

                        <div className="flex items-center gap-1 shrink-0">
                          <SubtaskProgress taskId={task.id} subtasks={subtasks} />
                          {/* Go to position button */}
                          {!activeCollectionId && !activeSubcollectionId && !isSelectionMode && (
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
                          {!isSelectionMode && (
                            <>
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
                                  setEditingTaskPriority(task.priority || 'low');
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
                            </>
                          )}
                        </div>
                      </div>

                      {/* Inline Subtasks List for Completed Task */}
                      <AnimatePresence initial={false}>
                        {isExpanded && inlineSubtasks.length > 0 && (
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
                                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all bg-[#1a1a1a]/40 ${
                                  subtaskItem.completed
                                    ? 'border-success/20 border-l-2 border-l-success opacity-60 bg-success/5'
                                    : subtaskItem.priority === 'high'
                                      ? 'border-error/20 border-l-2 border-l-error bg-error/5'
                                      : subtaskItem.priority === 'medium'
                                        ? 'border-warning/20 border-l-2 border-l-warning bg-warning/5'
                                        : 'border-gray-border/60 border-l-2 border-l-success bg-bg-primary/40'
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
                          </motion.div>
                        )}
                      </AnimatePresence>
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

      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => {
          if (!isBulkDeleting) setIsBulkDeleteModalOpen(false);
        }}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${selectedTaskCount} Tasks?`}
        message={`Are you sure you want to delete the ${selectedTaskCount} selected tasks and move them to the trash?`}
        confirmLabel="Delete Tasks"
        isDanger={true}
        isLoading={isBulkDeleting}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        activeCollectionId={activeCollectionId}
        activeSubcollectionId={activeSubcollectionId}
        user={user}
      />

      {/* Floating Action Bar for Bulk Task Operations */}
      <AnimatePresence>
        {isSelectionMode && selectedTaskCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#181818]/95 backdrop-blur-md border border-brand-primary/20 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_15px_rgba(99,102,241,0.15)] rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 z-50 select-none w-[calc(100%-2rem)] sm:w-auto max-w-md sm:max-w-none"
          >
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <span className="text-[11px] font-black text-text-primary uppercase tracking-widest tabular-nums shrink-0">
                {selectedTaskCount} {selectedTaskCount === 1 ? 'task' : 'tasks'} selected
              </span>
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedTaskIds({});
                }}
                className="p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0 sm:hidden"
                aria-label="Cancel Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:block h-4 w-px bg-gray-border/40 shrink-0" />
            
            <div className="flex flex-wrap items-center justify-center gap-1.5 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                className="font-bold select-none cursor-pointer flex-1 sm:flex-initial text-[10px] sm:text-xs py-1.5 px-3"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="font-bold select-none cursor-pointer text-text-secondary hover:text-text-primary flex-1 sm:flex-initial text-[10px] sm:text-xs py-1.5 px-3"
                onClick={handleDeselectAll}
              >
                Deselect
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="font-bold select-none cursor-pointer flex-1 sm:flex-initial text-[10px] sm:text-xs py-1.5 px-3"
                onClick={handleBulkDeleteClick}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            </div>
            
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedTaskIds({});
              }}
              className="hidden sm:block p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
              aria-label="Cancel Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

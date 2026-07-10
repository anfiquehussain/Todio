import { useState, useEffect, useRef } from 'react';
import { Folder, Type, Smile, CheckSquare, Calendar } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  updateTaskAsync, deleteTaskAsync, setActiveTaskId, restoreTaskAsync
} from '../../../store/slices/todoSlice';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { TaskDetailHeader } from './TaskDetailPane/TaskDetailHeader';
import { ConfirmationModal } from '../../patterns/ConfirmationModal';
import { TaskDescription } from './TaskDetailPane/TaskDescription';
import { SubtaskChecklist } from './TaskDetailPane/SubtaskChecklist';
import { ExportModal } from './TaskDetailPane/ExportModal';
import type { Task } from '../../../types';

export const TaskDetailPane = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();

  const { 
    tasks, collections, subcollections, subtasks: allSubtasks,
    activeTaskId, activeCollectionId, activeSubcollectionId,
    soundEnabled, isDetailsPaneExpanded 
  } = useAppSelector((state) => state.todo);
  const { user } = useAppSelector((state) => state.auth);

  const subtasks = allSubtasks.filter(s => !s.deleted);

  // Input ref for title
  const rightPanelTitleInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Details panel states for inputs auto-saving
  const [detailTitle, setDetailTitle] = useState('');
  const [detailOverview, setDetailOverview] = useState('');
  const [detailDueDate, setDetailDueDate] = useState('');
  const [detailPriority, setDetailPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [detailCollectionId, setDetailCollectionId] = useState<string>('');
  const [detailSubcollectionId, setDetailSubcollectionId] = useState<string | null>(null);

  // Export Modal state managers
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState<'task' | 'subtask'>('task');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Auto-grow Title Textarea height to prevent clipping
  useEffect(() => {
    const el = rightPanelTitleInputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [detailTitle, activeTaskId]);

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  // Auto-clear detail pane when navigating to a different list/sublist context
  // so the subtask session goes blank instead of showing a stale task
  useEffect(() => {
    if (!activeTask || !activeTaskId) return;
    const taskCollection = activeTask.collectionId || null;
    const taskSubcollection = activeTask.subcollectionId || null;

    // If a specific collection is active, the task must belong to it
    if (activeCollectionId && taskCollection !== activeCollectionId) {
      dispatch(setActiveTaskId(null));
      return;
    }
    // If a specific subcollection is active, the task must also belong to it
    if (activeSubcollectionId && taskSubcollection !== activeSubcollectionId) {
      dispatch(setActiveTaskId(null));
    }
  }, [activeCollectionId, activeSubcollectionId, activeTask, activeTaskId, dispatch]);

  // Sync details pane inputs with active task
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (activeTask) {
      setDetailTitle(activeTask.title);
      setDetailOverview(activeTask.overview || '');
      setDetailDueDate(activeTask.dueDate || '');
      setDetailPriority(activeTask.priority || 'medium');
      setDetailCollectionId(activeTask.collectionId || '');
      setDetailSubcollectionId(activeTask.subcollectionId || null);
    } else {
      setDetailTitle('');
      setDetailOverview('');
      setDetailDueDate('');
      setDetailPriority('medium');
      setDetailCollectionId('');
      setDetailSubcollectionId(null);
    }
  }, [activeTaskId, activeTask]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-save logic
  const handleUpdateActiveTask = (fields: Partial<Task>) => {
    if (!activeTask) return;
    const updated = { ...activeTask, ...fields };
    dispatch(updateTaskAsync(updated));
  };

  const handleDeleteTask = () => {
    if (!checkAuth('delete this task')) return;
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeTaskId) return;
    const deletedTask = tasks.find(t => t.id === activeTaskId);
    try {
      await dispatch(deleteTaskAsync(activeTaskId)).unwrap();
      toast('Task removed successfully.', 'info', undefined, deletedTask ? {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreTaskAsync(deletedTask.id));
          toast('Task restored.', 'success');
        }
      } : undefined);
    } catch {
      toast('Failed to delete task.', 'error');
    }
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden bg-bg-secondary select-none ${
      isDetailsPaneExpanded 
        ? 'flex-1 w-full animate-slide-in' 
        : 'w-full lg:w-[440px] xl:w-[480px] shrink-0'
    } ${activeTaskId ? 'flex' : 'hidden lg:flex'}`}>
      
      {activeTask ? (
        <div className="flex flex-col h-full overflow-hidden animate-slide-in relative">
          
          {/* 1. Header Subcomponent */}
          <TaskDetailHeader
            activeTask={activeTask}
            onClose={() => dispatch(setActiveTaskId(null))}
            handleDeleteTask={handleDeleteTask}
            onTriggerExport={(mode) => {
              setExportMode(mode);
              setIsExportModalOpen(true);
            }}
            detailCollectionId={detailCollectionId}
            collections={collections}
            setDetailCollectionId={setDetailCollectionId}
            detailSubcollectionId={detailSubcollectionId}
            subcollections={subcollections}
            setDetailSubcollectionId={setDetailSubcollectionId}
            handleUpdateActiveTask={handleUpdateActiveTask}
            toast={(msg, type) => toast(msg, type)}
          />

          {/* Editable Content Pane scrollable */}
          <div className="flex-1 overflow-y-auto pt-3.5 px-6 pb-10 flex flex-col gap-3.5 no-scrollbar">
            
            {/* Title & Metadata Properties Row */}
            {!isDetailsPaneExpanded && (
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-border/20 pb-2.5 select-none">
                {/* Title Textarea (Left) */}
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={rightPanelTitleInputRef}
                    placeholder="Task title..."
                    value={detailTitle}
                    onChange={(e) => {
                      setDetailTitle(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onBlur={() => handleUpdateActiveTask({ title: detailTitle })}
                    rows={1}
                    className="w-full text-base font-black tracking-tight text-text-primary bg-transparent border-0 resize-none focus:outline-hidden focus:ring-0 placeholder:text-text-secondary/40 overflow-hidden min-h-[28px] leading-tight"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  />
                </div>

                {/* Compact Properties Row (Right) */}
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                  {/* Due Date Pill (Icon + Selected Date, or Icon only if empty) */}
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-text-secondary bg-bg-primary/80 dark:bg-[#1a1a1a] hover:bg-bg-primary dark:hover:bg-[#222222] border border-gray-border/50 px-2.5 py-1.5 rounded-xl relative overflow-hidden hover:text-text-primary transition-all cursor-pointer shrink-0" title={detailDueDate ? `Due Date: ${detailDueDate}` : 'Add Due Date'}>
                    <Calendar className={`w-3.5 h-3.5 ${
                      detailDueDate
                        ? detailPriority === 'high'
                          ? 'text-error animate-pulse'
                          : detailPriority === 'medium'
                            ? 'text-warning'
                            : 'text-success'
                        : 'text-text-secondary/50'
                    }`} />
                    <input
                      type="date"
                      value={detailDueDate}
                      onChange={(e) => {
                        setDetailDueDate(e.target.value);
                        handleUpdateActiveTask({ dueDate: e.target.value });
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {detailDueDate && (
                      <span className={`text-[10px] font-bold ${
                        detailPriority === 'high'
                          ? 'text-error'
                          : detailPriority === 'medium'
                            ? 'text-warning'
                            : 'text-success'
                      }`}>{detailDueDate}</span>
                    )}
                  </div>

                  {/* Priority Selector Pill */}
                  <div className="flex items-center bg-bg-primary/80 dark:bg-[#1a1a1a] border border-gray-border/50 px-2.5 py-1.5 rounded-xl gap-2 select-none shrink-0" title="Priority Weight">
                    <button
                      onClick={() => {
                        setDetailPriority('low');
                        handleUpdateActiveTask({ priority: 'low' });
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        detailPriority === 'low'
                          ? 'bg-success ring-2 ring-success/40 scale-110 shadow-md shadow-success/30'
                          : 'bg-success/30 hover:bg-success/60'
                      }`}
                      title="Low Priority"
                      aria-label="Set low priority"
                    />
                    <button
                      onClick={() => {
                        setDetailPriority('medium');
                        handleUpdateActiveTask({ priority: 'medium' });
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        detailPriority === 'medium'
                          ? 'bg-warning ring-2 ring-warning/40 scale-110 shadow-md shadow-warning/30'
                          : 'bg-warning/30 hover:bg-warning/60'
                      }`}
                      title="Medium Priority"
                      aria-label="Set medium priority"
                    />
                    <button
                      onClick={() => {
                        setDetailPriority('high');
                        handleUpdateActiveTask({ priority: 'high' });
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        detailPriority === 'high'
                          ? 'bg-error ring-2 ring-error/40 scale-110 shadow-md shadow-error/30'
                          : 'bg-error/30 hover:bg-error/60'
                      }`}
                      title="High Priority"
                      aria-label="Set high priority"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Description Subcomponent */}
            {!isDetailsPaneExpanded && (
              <TaskDescription
                detailOverview={detailOverview}
                setDetailOverview={setDetailOverview}
                handleUpdateActiveTask={handleUpdateActiveTask}
              />
            )}

            {/* 3. Checklist Subcomponent */}
            <SubtaskChecklist
              activeTask={activeTask}
              subtasks={subtasks}
              user={user}
              soundEnabled={soundEnabled}
              checkAuth={checkAuth}
              toast={toast}

              onTriggerExport={(mode) => {
                setExportMode(mode);
                setIsExportModalOpen(true);
              }}
            />

          </div>
          
          {/* Details panel bottom formatting strip decoration */}
          {!isDetailsPaneExpanded && (
            <div className="px-6 py-4.5 border-t border-gray-border/50 bg-bg-primary/30 dark:bg-[#161616]/40 select-none flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1">
                <Folder className="w-4 h-4 text-text-secondary/50 shrink-0" />
                <span className="text-[10px] font-extrabold text-text-secondary/70">
                  {collections.find(c => c.id === activeTask.collectionId)?.name || 'Inbox'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-[#202020] rounded text-text-secondary/40 hover:text-text-primary transition-colors cursor-pointer">
                  <Type className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-[#202020] rounded text-text-secondary/40 hover:text-text-primary transition-colors cursor-pointer">
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Interactive Task & Subtask Export Configurator Dialog */}
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            activeTask={activeTask}
            subtasks={subtasks}
            mode={exportMode}
          />

          <ConfirmationModal
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Task?"
            message={`Are you sure you want to permanently delete "${activeTask.title}"?`}
            confirmLabel="Delete"
            isDanger={true}
          />
        </div>
      ) : (
        /* Empty details status display */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-secondary/40 gap-4 border-l border-gray-border/40 select-none">
          <div className="w-16 h-16 rounded-2xl bg-gray-border/10 border border-gray-border/20 flex items-center justify-center text-text-secondary/30">
            <CheckSquare className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xs font-black text-text-primary">Select a task</h2>
            <p className="text-[10px] mt-1 leading-relaxed max-w-[220px]">
              Click any task card in the active queue to view checklist parameters, targets, and notes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

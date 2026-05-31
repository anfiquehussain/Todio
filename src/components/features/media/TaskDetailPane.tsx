import { useState, useEffect, useRef } from 'react';
import { Folder, Type, Smile, CheckSquare } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  updateTaskAsync, deleteTaskAsync, setActiveTaskId 
} from '../../../store/slices/todoSlice';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { TaskDetailHeader } from './TaskDetailPane/TaskDetailHeader';
import { TaskDescription } from './TaskDetailPane/TaskDescription';
import { SubtaskChecklist } from './TaskDetailPane/SubtaskChecklist';
import type { Task } from '../../../types';

export const TaskDetailPane = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();

  const { 
    tasks, collections, subtasks, activeTaskId, soundEnabled, isDetailsPaneExpanded 
  } = useAppSelector((state) => state.todo);
  const { user } = useAppSelector((state) => state.auth);

  // Input ref for title
  const rightPanelTitleInputRef = useRef<HTMLInputElement | null>(null);

  // Details panel states for inputs auto-saving
  const [detailTitle, setDetailTitle] = useState('');
  const [detailOverview, setDetailOverview] = useState('');
  const [detailDueDate, setDetailDueDate] = useState('');
  const [detailPriority, setDetailPriority] = useState<number>(0);
  const [detailCollectionId, setDetailCollectionId] = useState<string>('');

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  // Sync details pane inputs with active task
  useEffect(() => {
    if (activeTask) {
      setDetailTitle(activeTask.title);
      setDetailOverview(activeTask.overview || '');
      setDetailDueDate(activeTask.dueDate || '');
      setDetailPriority(activeTask.priority || 0);
      setDetailCollectionId(activeTask.collectionId || '');
    } else {
      setDetailTitle('');
      setDetailOverview('');
      setDetailDueDate('');
      setDetailPriority(0);
      setDetailCollectionId('');
    }
  }, [activeTaskId, activeTask]);

  // Auto-save logic
  const handleUpdateActiveTask = (fields: Partial<Task>) => {
    if (!activeTask) return;
    const updated = { ...activeTask, ...fields };
    dispatch(updateTaskAsync(updated));
  };

  const handleDeleteTask = async (id: string) => {
    if (!checkAuth('delete this task')) return;
    try {
      await dispatch(deleteTaskAsync(id)).unwrap();
      toast('Task removed successfully.', 'info');
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
            detailDueDate={detailDueDate}
            detailPriority={detailPriority}
            detailCollectionId={detailCollectionId}
            collections={collections}
            activeTask={activeTask}
            onClose={() => dispatch(setActiveTaskId(null))}
            setDetailDueDate={setDetailDueDate}
            setDetailPriority={setDetailPriority}
            setDetailCollectionId={setDetailCollectionId}
            handleUpdateActiveTask={handleUpdateActiveTask}
            handleDeleteTask={handleDeleteTask}
            toast={(msg, type) => toast(msg, type)}
          />

          {/* Editable Content Pane scrollable */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 no-scrollbar pb-10">
            
            {/* Expanded mode Title Header */}
            {isDetailsPaneExpanded && (
              <div className="border-b border-gray-border/20 pb-4 mb-2 select-none animate-slide-in">
                <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary/50">Active Task Scope</span>
                <h1 className="text-xl font-black text-brand-primary mt-1">{activeTask.title}</h1>
              </div>
            )}

            {/* Bold Title Input */}
            {!isDetailsPaneExpanded && (
              <div className="flex flex-col gap-1 select-none">
                <input
                  ref={rightPanelTitleInputRef}
                  type="text"
                  placeholder="Task title..."
                  value={detailTitle}
                  onChange={(e) => setDetailTitle(e.target.value)}
                  onBlur={() => handleUpdateActiveTask({ title: detailTitle })}
                  className="w-full text-base font-black tracking-tight text-text-primary bg-transparent border-0 focus:outline-hidden focus:ring-0 placeholder:text-text-secondary/40"
                />
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
              toast={(msg, type) => toast(msg, type)}
            />

          </div>
          
          {/* Details panel bottom formatting strip decoration */}
          {!isDetailsPaneExpanded && (
            <div className="px-6 py-4.5 border-t border-gray-border/50 bg-[#161616]/40 select-none flex items-center justify-between shrink-0">
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

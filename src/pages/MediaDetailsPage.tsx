import { Calendar, Star, ChevronLeft, Trash2, Edit2 } from 'lucide-react';
import { useTaskDetailsPage } from '../hooks/useTaskDetailsPage';
import { StatusBadge } from '../components/patterns/StatusBadge';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { ChecklistActivity } from '../components/features/media/ChecklistActivity';
import { MediaScroll } from '../components/patterns/MediaScroll';
import { MediaCard } from '../components/patterns/MediaCard';
import { TaskFormModal } from '../components/features/media/TaskFormModal';
import { ConfirmationModal } from '../components/patterns/ConfirmationModal';
import { updateTaskAsync } from '../store/slices/todoSlice';

import { useAppSelector } from '../hooks/useRedux';

export const MediaDetailsPage = () => {
  const { showGlowBackdrops } = useAppSelector((state) => state.settings);
  const {
    task,
    collections,
    recommendations,
    isFormOpen,
    setIsFormOpen,
    taskToDeleteId,
    setTaskToDeleteId,
    isDescriptionOpen,
    handleToggleDescription,
    handleToggleComplete,
    handleEdit,
    handleDelete,
    checkAuth,
    dispatch,
    navigate,
    tasks,
  } = useTaskDetailsPage();

  if (!task) return null;

  const cat = collections.find((c) => c.id === task.collectionId);
  const isOverdue = task.dueDate
    ? new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) && !task.completed
    : false;

  return (
    <div className="flex flex-col gap-8 relative font-sans">
      {showGlowBackdrops && (
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
        />
      )}


      <div className="flex items-center justify-between border-b border-gray-border/50 pb-5 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
          Back to list
        </button>

        <div className="flex items-center gap-2">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => {
              if (checkAuth('edit this task')) setIsFormOpen(true);
            }}
            title="Modify task parameters"
          >
            <Edit2 className="w-4.5 h-4.5 text-text-secondary hover:text-text-primary shrink-0" />
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => {
              if (checkAuth('delete this task')) setTaskToDeleteId(task.id);
            }}
            title="Wipe out task"
          >
            <Trash2 className="w-4.5 h-4.5 text-error shrink-0" />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 bg-card border border-gray-border rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {task.completed ? (
                <StatusBadge type="completed" />
              ) : isOverdue ? (
                <StatusBadge type="overdue" />
              ) : (
                <StatusBadge type="active" />
              )}

              {cat && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white border"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    borderColor: `${cat.color}35`,
                  }}
                >
                  {cat.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight leading-snug">
              {task.title}
            </h1>
          </div>

          <div className="flex flex-col gap-2 border-t border-b border-gray-border/50 py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                Task Notes Overview
              </h3>
              <button
                type="button"
                onClick={handleToggleDescription}
                className="text-[9px] font-bold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1.5 cursor-pointer bg-brand-primary/10 px-1.5 py-0.5 rounded-md hover:bg-brand-primary/15"
              >
                {isDescriptionOpen ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {isDescriptionOpen && (
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap select-text animate-slide-in">
                {task.overview || 'No notes available.'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                task.dueDate
                  ? task.priority === 'high'
                    ? 'bg-error/10 border-error/20 text-error'
                    : task.priority === 'medium'
                      ? 'bg-warning/10 border-warning/20 text-warning'
                      : 'bg-success/10 border-success/20 text-success'
                  : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
              }`}>
                <Calendar className={`w-5 h-5 ${task.dueDate ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                  Due Target Date
                </span>
                <span className={`text-sm font-bold mt-0.5 ${
                  task.dueDate
                    ? task.priority === 'high'
                      ? 'text-error'
                      : task.priority === 'medium'
                        ? 'text-warning'
                        : 'text-success'
                    : 'text-text-primary'
                }`}>
                  {task.dueDate || 'No due date'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                  Task Priority Weight
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-xs font-black text-brand-accent">
                    {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-border/50 pt-5 flex justify-end mt-4">
            <Button
              variant={task.completed ? 'secondary' : 'primary'}
              size="md"
              onClick={handleToggleComplete}
            >
              {task.completed ? 'Revert to Active' : 'Complete Primary Task'}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <ChecklistActivity taskId={String(task.id)} />
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="relative z-10 mt-4">
          <MediaScroll title="Related Workplace Pipelines 📁">
            {recommendations.map((rec) => {
              const recCat = collections.find((c) => c.id === rec.collectionId);
              return (
                <div key={rec.id} className="w-[320px] shrink-0 snap-start">
                  <MediaCard
                    media={rec}
                    category={recCat}
                    onToggleComplete={(id) => {
                      if (!checkAuth('toggle task completion')) return;
                      const rTask = tasks.find(t => t.id === id);
                      if (rTask) {
                        dispatch(updateTaskAsync({ ...rTask, completed: !rTask.completed }));
                      }
                    }}
                    onDelete={(id) => {
                      if (checkAuth('delete this task')) setTaskToDeleteId(id);
                    }}
                  />
                </div>
              );
            })}
          </MediaScroll>
        </div>
      )}

      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleEdit}
        editingTask={task}
      />

      <ConfirmationModal
        isOpen={taskToDeleteId !== null}
        onClose={() => setTaskToDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task?"
        message={
          taskToDeleteId === task.id
            ? "This operation will permanently delete the task and its associated subtask logs."
            : `Are you sure you want to permanently delete "${tasks.find(t => t.id === taskToDeleteId)?.title || 'this task'}"?`
        }
        confirmLabel="Delete"
        isDanger={true}
      />
    </div>
  );
};

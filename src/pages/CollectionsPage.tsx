import { useState } from 'react';
import { Plus, Folder, LayoutList } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { createTaskAsync } from '../store/slices/todoSlice';
import { incrementXP, updateStreak } from '../store/slices/profileSlice';
import { useToast } from '../hooks/useToast';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { MediaCard } from '../components/patterns/MediaCard';
import { Button } from '../components/ui/Button';
import { TaskFormModal } from '../components/features/media/TaskFormModal';
import { CategoryManager } from '../components/features/collections/CategoryManager';
import type { Task } from '../types';

export const CollectionsPage = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();
  
  const { collections, subcollections, tasks } = useAppSelector((state) => state.todo);

  // Selected workspace identifiers
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedSubcollectionId, setSelectedSubcollectionId] = useState<string | null>(null);
  
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const handleCreateTask = async (task: Task) => {
    try {
      await dispatch(createTaskAsync(task)).unwrap();
      dispatch(incrementXP(10));
      dispatch(updateStreak());
      toast('Action task successfully created! +10 XP 🚀', 'success');
    } catch {
      toast('Failed to create task', 'error');
    }
  };

  const displayedTasks = tasks.filter(t => {
    if (selectedSubcollectionId) {
      return t.subcollectionId === selectedSubcollectionId;
    } else if (selectedCollectionId) {
      return t.collectionId === selectedCollectionId;
    }
    return false;
  });

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 font-sans">
      
      {/* 1. LEFT SIDEBAR: Extracted Category Manager feature */}
      <CategoryManager
        selectedCollectionId={selectedCollectionId}
        selectedSubcollectionId={selectedSubcollectionId}
        setSelectedCollectionId={setSelectedCollectionId}
        setSelectedSubcollectionId={setSelectedSubcollectionId}
      />

      {/* 2. RIGHT MAIN PANEL: Task List for selected node */}
      <div className="flex-1 bg-card border border-gray-border rounded-3xl p-6 md:p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar">
        {(!selectedCollectionId && !selectedSubcollectionId) ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary/50 gap-4">
            <LayoutList className="w-16 h-16 opacity-20" />
            <h2 className="text-xl font-bold text-text-primary">No Selection</h2>
            <p className="text-sm">Select a Collection or Subcollection from the sidebar to view tasks.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-border/50 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
                  {selectedSubcollectionId 
                    ? subcollections.find(s => s.id === selectedSubcollectionId)?.name 
                    : collections.find(c => c.id === selectedCollectionId)?.name}
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  {displayedTasks.length} active tasks found in this view.
                </p>
              </div>
              <Button variant="primary" size="md" onClick={() => { if (checkAuth('create a task')) setIsTaskFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1.5" />
                New Task Here
              </Button>
            </div>

            {displayedTasks.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {displayedTasks.map(task => {
                  const cat = collections.find(c => c.id === task.collectionId);
                  return (
                    <MediaCard
                      key={task.id}
                      media={task}
                      category={cat}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-text-secondary/40 gap-3 border border-dashed border-gray-border rounded-3xl">
                <Folder className="w-10 h-10 opacity-50" />
                <p className="text-sm font-bold text-text-primary">No tasks found here.</p>
                <p className="text-xs">Go to the Home dashboard to draft new tasks.</p>
              </div>
            )}
          </>
        )}
      </div>

      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleCreateTask}
        defaultCollectionId={selectedCollectionId}
        defaultSubcollectionId={selectedSubcollectionId}
      />
    </div>
  );
};

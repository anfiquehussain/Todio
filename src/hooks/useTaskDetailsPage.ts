import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './useRedux';
import { updateTaskAsync, deleteTaskAsync, restoreTaskAsync } from '../store/slices/todoSlice';
import { incrementXP, updateStreak } from '../store/slices/profileSlice';
import { playCompletionSound } from '../lib/sound';
import { useToast } from './useToast';
import { useAuthGuard } from './useAuthGuard';
import type { Task } from '../types';

export const useTaskDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();
  
  const { tasks, collections, soundEnabled } = useAppSelector((state) => state.todo);
  
  const [task, setTask] = useState<Task | null>(null);
  const [recommendations, setRecommendations] = useState<Task[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(() => {
    const cached = localStorage.getItem('todo_description_expanded');
    return cached === null ? true : cached === 'true';
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!id) return;
    const foundTask = tasks.find(t => t.id === id);
    if (foundTask) {
      setTask(foundTask);
      setRecommendations(tasks.filter(t => t.subcollectionId === foundTask.subcollectionId && t.id !== foundTask.id));
    } else {
      setTask(null);
    }
  }, [id, tasks]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleToggleComplete = () => {
    if (!task) return;
    if (!checkAuth('toggle task completion')) return;
    dispatch(updateTaskAsync({ ...task, completed: !task.completed }));
    if (!task.completed) {
      dispatch(incrementXP(50));
      dispatch(updateStreak());
      playCompletionSound(soundEnabled);
      toast('Task completed! +50 XP Score! 🔔', 'success');
    } else {
      toast('Task reverted to active.', 'info');
    }
  };

  const handleEdit = (edited: Task) => {
    dispatch(updateTaskAsync(edited));
    toast('Task details saved! 🛠️', 'success');
  };

  const handleDelete = () => {
    if (taskToDeleteId) {
      const deletedTask = tasks.find(t => t.id === taskToDeleteId);
      dispatch(deleteTaskAsync(taskToDeleteId));
      toast('Task card deleted.', 'info', undefined, deletedTask ? {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreTaskAsync(deletedTask.id));
          toast('Task restored.', 'success');
        }
      } : undefined);
      if (taskToDeleteId === task?.id) {
        navigate('/');
      }
      setTaskToDeleteId(null);
    }
  };

  const handleToggleDescription = () => {
    const newState = !isDescriptionOpen;
    setIsDescriptionOpen(newState);
    localStorage.setItem('todo_description_expanded', String(newState));
  };

  return {
    id,
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
    toast,
    navigate,
    tasks,
  };
};

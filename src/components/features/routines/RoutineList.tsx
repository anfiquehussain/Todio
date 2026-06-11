import { useState } from 'react';
import { Plus, Archive, Trash2, CalendarRange, ListChecks } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { useRoutineSchedule } from '../../../hooks/useRoutineSchedule';
import { PageHeader } from '../../patterns/PageHeader';
import { RoutineCard } from './RoutineList/RoutineCard';
import { RoutineFormModal } from './RoutineFormModal';
import { createRoutineAsync, setFilter } from '../../../store/slices/routineSlice';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../ui/Button';
import type { Routine } from '../../../types';

export const RoutineList = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isDueToday } = useRoutineSchedule();

  const { routines, activeRoutineId, filter } = useAppSelector((state) => state.routine);
  
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter routines based on selected tab
  const getFilteredRoutines = () => {
    switch (filter) {
      case 'trash':
        return routines.filter(r => r.deleted);
      case 'archived':
        return routines.filter(r => !r.deleted && r.archived);
      case 'due':
        return routines.filter(r => !r.deleted && !r.archived && isDueToday(r));
      case 'all':
      default:
        return routines.filter(r => !r.deleted && !r.archived);
    }
  };

  const filteredRoutines = getFilteredRoutines();

  // Badge count for sidebar/tabs
  const getCount = (tab: typeof filter) => {
    switch (tab) {
      case 'trash':
        return routines.filter(r => r.deleted).length;
      case 'archived':
        return routines.filter(r => !r.deleted && r.archived).length;
      case 'due':
        return routines.filter(r => !r.deleted && !r.archived && isDueToday(r)).length;
      case 'all':
      default:
        return routines.filter(r => !r.deleted && !r.archived).length;
    }
  };

  const handleCreateSubmit = async (routineData: Routine) => {
    try {
      await dispatch(createRoutineAsync(routineData)).unwrap();
      toast('Routine successfully drafted! ⚡', 'success');
    } catch {
      toast('Failed to draft routine.', 'error');
    }
  };

  const renderEmptyState = () => {
    let icon = <ListChecks className="w-12 h-12 text-text-secondary/20" />;
    let title = "No routines drafted yet";
    let desc = "Draft recurring daily, weekly, or monthly routines to keep your focus on autopilot.";

    if (filter === 'due') {
      icon = <CalendarRange className="w-12 h-12 text-text-secondary/20 animate-pulse" />;
      title = "All routines completed! 🌟";
      desc = "You have checked off all routines due for today. Keep up the high streak!";
    } else if (filter === 'archived') {
      icon = <Archive className="w-12 h-12 text-text-secondary/20" />;
      title = "Archive is clean";
      desc = "No archived habits. Keep them in active focus or archive them if you need to pause.";
    } else if (filter === 'trash') {
      icon = <Trash2 className="w-12 h-12 text-text-secondary/20" />;
      title = "Trash bin is empty";
      desc = "No soft-deleted routines in the trash bin. Deleted items stay for 30 days.";
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-8 mt-12 select-none max-w-sm mx-auto">
        <div className="p-4 bg-[#1a1a1a] border border-gray-border/30 rounded-3xl mb-4 shadow-xl">
          {icon}
        </div>
        <h4 className="text-sm font-bold text-text-primary mb-1">
          {title}
        </h4>
        <p className="text-xs text-text-secondary/70 leading-relaxed font-medium">
          {desc}
        </p>
        {filter === 'all' && (
          <Button 
            onClick={() => setIsFormOpen(true)}
            variant="primary" 
            size="sm" 
            className="mt-5"
          >
            Create First Habit
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary font-sans p-6 select-none overflow-hidden">
      {/* Page Header */}
      <div className="shrink-0">
        <PageHeader
          title="Routines"
          subtitle="Track recurring habits and rituals"
          action={
            <Button
              onClick={() => setIsFormOpen(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 shrink-0"
              aria-label="Create new routine"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Add Habit</span>
            </Button>
          }
        />

        {/* Filters Row */}
        <div className="flex items-center gap-1.5 border-b border-gray-border/30 pb-3 mb-4 overflow-x-auto no-scrollbar">
          {(['due', 'all', 'archived', 'trash'] as const).map((tab) => {
            const isActive = filter === tab;
            const count = getCount(tab);
            const label = tab === 'due' ? 'Due Today' : tab;

            return (
              <button
                key={tab}
                onClick={() => dispatch(setFilter(tab))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold capitalize select-none cursor-pointer transition-all border shrink-0 ${
                  isActive
                    ? 'bg-card text-brand-primary border-brand-primary/20 shadow-md shadow-brand-primary/5'
                    : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-card/40 border-transparent'
                }`}
              >
                <span>{label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                    isActive ? 'bg-brand-primary/10 text-brand-primary' : 'bg-card text-text-secondary/70'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Cards Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-2.5 min-h-0">
        {filteredRoutines.length > 0 ? (
          filteredRoutines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              isSelected={activeRoutineId === routine.id}
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </div>

      {/* Form modal */}
      <RoutineFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
};

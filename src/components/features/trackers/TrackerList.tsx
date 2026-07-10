import { useState } from 'react';
import { Plus, BarChart3, Archive, Trash2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { PageHeader } from '../../patterns/PageHeader';
import { TrackerCard } from './TrackerList/TrackerCard';
import { TrackerFormModal } from './TrackerFormModal';
import { createTrackerAsync, setTrackerFilter } from '../../../store/slices/trackerSlice';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../ui/Button';
import type { Tracker } from '../../../types';

export const TrackerList = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { trackers, activeTrackerId, filter } = useAppSelector((state) => state.tracker);

  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter trackers based on selected tab
  const getFilteredTrackers = () => {
    switch (filter) {
      case 'trash':
        return trackers.filter(t => t.deleted);
      case 'archived':
        return trackers.filter(t => !t.deleted && t.archived);
      case 'active':
        return trackers.filter(t => !t.deleted && !t.archived);
      case 'all':
      default:
        return trackers.filter(t => !t.deleted && !t.archived);
    }
  };

  const filteredTrackers = getFilteredTrackers();

  // Badge count for tabs
  const getCount = (tab: typeof filter) => {
    switch (tab) {
      case 'trash':
        return trackers.filter(t => t.deleted).length;
      case 'archived':
        return trackers.filter(t => !t.deleted && t.archived).length;
      case 'active':
        return trackers.filter(t => !t.deleted && !t.archived).length;
      case 'all':
      default:
        return trackers.filter(t => !t.deleted && !t.archived).length;
    }
  };

  const handleCreateSubmit = async (trackerData: Tracker) => {
    try {
      await dispatch(createTrackerAsync(trackerData)).unwrap();
      toast('Tracker created successfully! 📊', 'success');
    } catch {
      toast('Failed to create tracker.', 'error');
    }
  };

  const renderEmptyState = () => {
    let icon = <BarChart3 className="w-12 h-12 text-text-secondary/20" />;
    let title = 'No trackers created yet';
    let desc = 'Create custom trackers to measure and analyze any activity — finance, health, fitness, productivity, and more.';

    if (filter === 'active') {
      icon = <BarChart3 className="w-12 h-12 text-text-secondary/20 animate-pulse" />;
      title = 'No active trackers';
      desc = 'Create a new tracker or check your archived trackers.';
    } else if (filter === 'archived') {
      icon = <Archive className="w-12 h-12 text-text-secondary/20" />;
      title = 'Archive is clean';
      desc = 'No archived trackers. Archive trackers you want to keep but temporarily pause.';
    } else if (filter === 'trash') {
      icon = <Trash2 className="w-12 h-12 text-text-secondary/20" />;
      title = 'Trash bin is empty';
      desc = 'No soft-deleted trackers in the trash bin.';
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
        {(filter === 'all' || filter === 'active') && (
          <Button
            onClick={() => setIsFormOpen(true)}
            variant="primary"
            size="sm"
            className="mt-5"
          >
            Create First Tracker
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
          title="Trackers"
          subtitle="Track, visualize, and analyze anything"
          action={
            <Button
              onClick={() => setIsFormOpen(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 shrink-0"
              aria-label="Create new tracker"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Add Tracker</span>
            </Button>
          }
        />

        {/* Filters Row */}
        <div className="flex items-center gap-1.5 border-b border-gray-border/30 pb-3 mb-4 overflow-x-auto no-scrollbar">
          {(['all', 'active', 'archived', 'trash'] as const).map((tab) => {
            const isActive = filter === tab;
            const count = getCount(tab);
            const labels: Record<string, string> = {
              all: 'All',
              active: 'Active',
              archived: 'Archived',
              trash: 'Trash',
            };

            return (
              <button
                key={tab}
                onClick={() => dispatch(setTrackerFilter(tab))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold capitalize select-none cursor-pointer transition-all border shrink-0 ${
                  isActive
                    ? 'bg-card text-brand-primary border-brand-primary/20 shadow-md shadow-brand-primary/5'
                    : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-card/40 border-transparent'
                }`}
              >
                <span>{labels[tab]}</span>
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

      {/* Tracker Cards Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-2.5 min-h-0">
        {filteredTrackers.length > 0 ? (
          filteredTrackers.map((tracker) => (
            <TrackerCard
              key={tracker.id}
              tracker={tracker}
              isSelected={activeTrackerId === tracker.id}
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </div>

      {/* Form modal */}
      <TrackerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
};

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  setActiveTrackerId, updateTrackerAsync, deleteTrackerAsync, 
  restoreTrackerAsync, deleteTrackerPermanentAsync 
} from '../../../store/slices/trackerSlice';
import { EntryList } from './TrackerDetailPane/EntryList';
import { AnalyticsPanel } from './TrackerDetailPane/AnalyticsPanel';
import { TrackerFormModal } from './TrackerFormModal';
import { ConfirmationModal } from '../../patterns/ConfirmationModal';
import type { Tracker } from '../../../types';
import { ArrowLeft, BarChart3, Edit2, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

export const TrackerDetailPane = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();
  const { trackers, activeTrackerId } = useAppSelector((state) => state.tracker);

  const activeTracker = trackers.find(t => t.id === activeTrackerId) || null;

  const [activeTab, setActiveTab] = useState<'entries' | 'analytics'>('entries');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPermanentDeleteOpen, setIsPermanentDeleteOpen] = useState(false);

  if (!activeTracker) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
        <div className="p-5 bg-[#1a1a1a] border border-gray-border/30 rounded-3xl mb-5 shadow-xl">
          <BarChart3 className="w-14 h-14 text-text-secondary/15" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-1.5">
          Select a Tracker
        </h3>
        <p className="text-xs text-text-secondary/60 font-medium max-w-xs leading-relaxed">
          Choose a tracker from the list to view entries, statistics, and charts.
        </p>
      </div>
    );
  }

  const handleEditSubmit = async (updatedTracker: Tracker) => {
    try {
      await dispatch(updateTrackerAsync(updatedTracker)).unwrap();
      toast('Tracker configurations saved! ✏️', 'success');
    } catch {
      toast('Failed to update tracker.', 'error');
    }
  };

  const handleSoftDelete = async () => {
    if (!checkAuth('delete tracker')) return;
    try {
      const trackerId = activeTracker.id;
      await dispatch(deleteTrackerAsync(trackerId)).unwrap();
      toast('Tracker moved to trash bin.', 'info', undefined, {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreTrackerAsync(trackerId));
          dispatch(setActiveTrackerId(trackerId));
          toast('Tracker restored.', 'success');
        }
      });
    } catch {
      toast('Failed to move tracker to trash.', 'error');
    }
  };

  const handleToggleArchive = async () => {
    try {
      const updated = { ...activeTracker, archived: !activeTracker.archived };
      await dispatch(updateTrackerAsync(updated)).unwrap();
      toast(activeTracker.archived ? 'Tracker unarchived and active.' : 'Tracker archived successfully.', 'success');
    } catch {
      toast('Failed to toggle archive status.', 'error');
    }
  };

  const handleRestore = async () => {
    try {
      await dispatch(restoreTrackerAsync(activeTracker.id)).unwrap();
      toast('Tracker restored successfully!', 'success');
    } catch {
      toast('Failed to restore tracker.', 'error');
    }
  };

  const handlePermanentDelete = async () => {
    if (!checkAuth('permanently delete tracker')) return;
    try {
      await dispatch(deleteTrackerPermanentAsync(activeTracker.id)).unwrap();
      toast('Tracker permanently purged from database.', 'info');
    } catch {
      toast('Failed to delete tracker permanently.', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Mobile Back Button & Desktop Toolbar Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-border/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => dispatch(setActiveTrackerId(null))}
            className="p-1.5 hover:bg-card rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer md:hidden shrink-0"
            aria-label="Back to tracker list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-text-primary truncate">{activeTracker.name}</h3>
            {activeTracker.description && (
              <p className="text-[10px] text-text-secondary/70 truncate hidden md:block">
                {activeTracker.description}
              </p>
            )}
          </div>
        </div>

        {/* Toolbar action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {!activeTracker.deleted ? (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 hover:bg-card rounded-xl text-text-secondary hover:text-brand-primary transition-colors cursor-pointer"
                title="Edit Tracker Config"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleArchive}
                className={`p-1.5 hover:bg-card rounded-xl transition-colors cursor-pointer ${
                  activeTracker.archived ? 'text-brand-primary' : 'text-text-secondary hover:text-brand-primary'
                }`}
                title={activeTracker.archived ? 'Unarchive Tracker' : 'Archive Tracker'}
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="p-1.5 hover:bg-error/15 rounded-xl text-text-secondary hover:text-error transition-colors cursor-pointer"
                title="Move to Trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRestore}
                className="p-1.5 hover:bg-success/15 rounded-xl text-text-secondary hover:text-success transition-colors cursor-pointer"
                title="Restore Tracker"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPermanentDeleteOpen(true)}
                className="p-1.5 hover:bg-error/15 rounded-xl text-text-secondary hover:text-error transition-colors cursor-pointer"
                title="Delete Permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 px-5 pt-4 pb-2 shrink-0">
        {(['entries', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer transition-all border ${
              activeTab === tab
                ? 'bg-card text-brand-primary border-brand-primary/20 shadow-sm'
                : 'bg-transparent text-text-secondary hover:text-text-primary border-transparent hover:bg-card/40'
            }`}
          >
            {tab === 'entries' ? '📝 Entries' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'entries' ? (
          <EntryList tracker={activeTracker} />
        ) : (
          <AnalyticsPanel tracker={activeTracker} />
        )}
      </div>

      {/* Tracker Form Modal (Edit Mode) */}
      <TrackerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        editingTracker={activeTracker}
      />

      {/* Soft Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleSoftDelete}
        title="Delete Tracker?"
        message={`Are you sure you want to move "${activeTracker.name}" to the trash bin? All associated entries will be hidden.`}
        confirmLabel="Move to Trash"
        isDanger={true}
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isPermanentDeleteOpen}
        onClose={() => setIsPermanentDeleteOpen(false)}
        onConfirm={handlePermanentDelete}
        title="Delete Tracker Permanently?"
        message={`This action is irreversible. All entries associated with "${activeTracker.name}" will be permanently removed.`}
        confirmLabel="Delete Permanently"
        isDanger={true}
      />
    </div>
  );
};

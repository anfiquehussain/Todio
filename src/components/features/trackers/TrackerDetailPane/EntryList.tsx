import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Calendar, FileText } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useRedux';
import type { Tracker, TrackerEntry, TrackerFieldValue } from '../../../../types';
import { deleteEntryAsync } from '../../../../store/slices/trackerSlice';
import { useToast } from '../../../../hooks/useToast';
import { ConfirmationModal } from '../../../patterns/ConfirmationModal';
import { EntryFormModal } from './EntryFormModal';

interface EntryListProps {
  tracker: Tracker;
}

export const EntryList = ({ tracker }: EntryListProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { entries } = useAppSelector((state) => state.tracker);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrackerEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrackerEntry | null>(null);

  const trackerEntries = [...entries]
    .filter(e => e.trackerId === tracker.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteEntryAsync(deleteTarget.id)).unwrap();
      toast('Entry deleted.', 'info');
    } catch {
      toast('Failed to delete entry.', 'error');
    }
  };

  const handleEditClick = (e: React.MouseEvent, entry: TrackerEntry) => {
    e.stopPropagation();
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, entry: TrackerEntry) => {
    e.stopPropagation();
    setDeleteTarget(entry);
  };

  const formatFieldValue = (fieldId: string, value: TrackerFieldValue): string => {
    const field = tracker.fields.find(f => f.id === fieldId);
    if (!field || value === null || value === undefined) return '—';

    switch (field.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return field.unit ? `${value} ${field.unit}` : String(value);
      default:
        return String(value);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group entries by date
  const groupedEntries: Record<string, TrackerEntry[]> = {};
  trackerEntries.forEach(entry => {
    if (!groupedEntries[entry.date]) {
      groupedEntries[entry.date] = [];
    }
    groupedEntries[entry.date].push(entry);
  });

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-secondary/50" aria-hidden="true" />
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            {trackerEntries.length} {trackerEntries.length === 1 ? 'Entry' : 'Entries'}
          </span>
        </div>
        <button
          onClick={() => {
            setEditingEntry(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/15 transition-colors cursor-pointer"
          aria-label="Add new entry"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          <span>Add Entry</span>
        </button>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 min-h-0">
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-text-secondary/40" aria-hidden="true" />
                <span className="text-[11px] font-bold text-text-secondary/60 uppercase tracking-wider">
                  {formatDate(date)}
                </span>
                <div className="flex-1 h-px bg-gray-border/20" />
              </div>

              {/* Entries for this date */}
              <div className="space-y-2">
                {groupedEntries[date].map(entry => (
                  <div
                    key={entry.id}
                    className="group flex items-start justify-between p-3.5 rounded-xl border border-gray-border/20 bg-card/30 hover:bg-card/50 hover:border-gray-border/40 transition-all"
                  >
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      {/* Field values */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {tracker.fields.map(field => (
                          <div key={field.id} className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-semibold text-text-secondary/50 uppercase tracking-wide">
                              {field.name}
                            </span>
                            <span className="text-sm font-bold text-text-primary tabular-nums">
                              {formatFieldValue(field.id, entry.values[field.id])}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Note */}
                      {entry.note && (
                        <p className="text-[11px] text-text-secondary/70 font-medium leading-relaxed mt-0.5">
                          {entry.note}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditClick(e, entry)}
                        className="p-1.5 hover:bg-brand-primary/10 rounded-lg text-text-secondary hover:text-brand-primary transition-colors cursor-pointer"
                        aria-label="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, entry)}
                        className="p-1.5 hover:bg-error/10 rounded-lg text-text-secondary hover:text-error transition-colors cursor-pointer"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 select-none">
            <div className="p-4 bg-[#1a1a1a] border border-gray-border/30 rounded-3xl mb-4">
              <FileText className="w-10 h-10 text-text-secondary/15" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">No entries yet</h4>
            <p className="text-xs text-text-secondary/60 font-medium max-w-xs">
              Start adding entries to track your progress and see insights.
            </p>
          </div>
        )}
      </div>

      {/* Entry Form Modal */}
      <EntryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEntry(null);
        }}
        tracker={tracker}
        editingEntry={editingEntry}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Entry?"
        message="Are you sure you want to permanently delete this tracker entry? This action cannot be undone."
        confirmLabel="Delete"
        isDanger={true}
      />
    </div>
  );
};

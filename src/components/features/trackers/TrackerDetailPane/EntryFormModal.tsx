import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useRedux';
import type { Tracker, TrackerEntry, TrackerFieldValue } from '../../../../types';
import { createEntryAsync, updateEntryAsync } from '../../../../store/slices/trackerSlice';
import { useToast } from '../../../../hooks/useToast';
import { Modal } from '../../../patterns/Modal';
import { Button } from '../../../ui/Button';

interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracker: Tracker;
  editingEntry?: TrackerEntry | null;
}

export const EntryFormModal = ({
  isOpen,
  onClose,
  tracker,
  editingEntry,
}: EntryFormModalProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);

  const [values, setValues] = useState<Record<string, TrackerFieldValue>>({});
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  // Format today as YYYY-MM-DD
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Hydrate form on open/edit
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editingEntry) {
      setValues(editingEntry.values || {});
      setDate(editingEntry.date || getTodayStr());
      setNote(editingEntry.note || '');
    } else {
      // Reset with default values per field type
      const defaults: Record<string, TrackerFieldValue> = {};
      tracker.fields.forEach(field => {
        switch (field.type) {
          case 'number':
            defaults[field.id] = '';
            break;
          case 'boolean':
            defaults[field.id] = false;
            break;
          case 'text':
          case 'date':
          case 'time':
          case 'select':
          default:
            defaults[field.id] = '';
            break;
        }
      });
      setValues(defaults);
      setDate(getTodayStr());
      setNote('');
    }
  }, [isOpen, editingEntry, tracker.fields]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateValue = (fieldId: string, value: TrackerFieldValue) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;

    // Validate required fields
    const hasInvalidRequired = tracker.fields.some(field => {
      if (!field.required) return false;
      const val = values[field.id];
      if (val === null || val === undefined || val === '') return true;
      return false;
    });

    if (hasInvalidRequired) {
      toast('Please fill in all required fields.', 'warning');
      return;
    }

    // Clean values: convert numeric strings to numbers, and default other missing fields to null
    const cleanValues: Record<string, TrackerFieldValue> = {};
    tracker.fields.forEach(field => {
      const raw = values[field.id];
      if (raw === undefined || raw === null || raw === '') {
        cleanValues[field.id] = null;
      } else if (field.type === 'number') {
        const num = parseFloat(String(raw));
        cleanValues[field.id] = isNaN(num) ? null : num;
      } else {
        cleanValues[field.id] = raw;
      }
    });

    const entryData: TrackerEntry = {
      id: editingEntry?.id || `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      trackerId: tracker.id,
      userId: user.uid,
      values: cleanValues,
      note: note.trim() || undefined,
      date,
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
    };

    try {
      if (editingEntry) {
        await dispatch(updateEntryAsync(entryData)).unwrap();
        toast('Entry updated! ✏️', 'success');
      } else {
        await dispatch(createEntryAsync(entryData)).unwrap();
        toast('Entry logged! 📊', 'success');
      }
      onClose();
    } catch {
      toast(`Failed to ${editingEntry ? 'update' : 'create'} entry.`, 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEntry ? 'Edit Entry' : 'Add Entry'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Date Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary select-none">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50"
            name="entry-date"
          />
        </div>

        {/* Dynamic Field Inputs */}
        <div className="flex flex-col gap-3">
          {tracker.fields.map(field => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary select-none">
                {field.name}
                {field.required && <span className="text-error ml-0.5">*</span>}
                {field.unit && (
                  <span className="text-text-secondary/50 ml-1 font-normal">({field.unit})</span>
                )}
              </label>

              {/* Number Input */}
              {field.type === 'number' && (
                <input
                  type="number"
                  step="any"
                  placeholder={`Enter ${field.name.toLowerCase()}…`}
                  value={values[field.id] === null || values[field.id] === undefined ? '' : String(values[field.id])}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 tabular-nums"
                  autoComplete="off"
                  name={`entry-${field.id}`}
                />
              )}

              {/* Text Input */}
              {field.type === 'text' && (
                <input
                  type="text"
                  placeholder={`Enter ${field.name.toLowerCase()}…`}
                  value={String(values[field.id] || '')}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50"
                  autoComplete="off"
                  name={`entry-${field.id}`}
                />
              )}

              {/* Date Input */}
              {field.type === 'date' && (
                <input
                  type="date"
                  value={String(values[field.id] || '')}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50"
                  name={`entry-${field.id}`}
                />
              )}

              {/* Time Input */}
              {field.type === 'time' && (
                <input
                  type="time"
                  value={String(values[field.id] || '')}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50"
                  name={`entry-${field.id}`}
                />
              )}

              {/* Boolean Toggle */}
              {field.type === 'boolean' && (
                <button
                  type="button"
                  onClick={() => updateValue(field.id, !values[field.id])}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
                    values[field.id]
                      ? 'bg-success/10 border-success/30 text-success'
                      : 'bg-bg-secondary border-gray-border text-text-secondary'
                  }`}
                >
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${
                    values[field.id] ? 'bg-success' : 'bg-gray-border'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      values[field.id] ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className="text-sm font-semibold">
                    {values[field.id] ? 'Yes' : 'No'}
                  </span>
                </button>
              )}

              {/* Select Dropdown */}
              {field.type === 'select' && (
                <select
                  value={String(values[field.id] || '')}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 cursor-pointer appearance-none"
                  name={`entry-${field.id}`}
                >
                  <option value="">Select…</option>
                  {(field.options || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary select-none">
            Note (optional)
          </label>
          <textarea
            placeholder="Add a note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 resize-none"
            autoComplete="off"
            name="entry-note"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 mt-1 border-t border-gray-border/30 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {editingEntry ? 'Save Changes' : 'Log Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

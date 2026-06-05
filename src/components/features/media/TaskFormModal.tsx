import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../hooks/useRedux';
import type { Task } from '../../../types';
import { Modal } from '../../patterns/Modal';
import { Input } from '../../ui/Input';

import { Button } from '../../ui/Button';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  editingTask?: Task | null;
  defaultCollectionId?: string | null;
  defaultSubcollectionId?: string | null;
}

export const TaskFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  defaultCollectionId,
  defaultSubcollectionId,
}: TaskFormModalProps) => {
  const { collections, subcollections } = useAppSelector((state) => state.todo);
  const { user } = useAppSelector((state) => state.auth);
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [subcollectionId, setSubcollectionId] = useState('');
  const [priority, setPriority] = useState(3);
  const [dueDate, setDueDate] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setOverview(editingTask.overview || '');
      setCollectionId(editingTask.collectionId || '');
      setSubcollectionId(editingTask.subcollectionId || '');
      setPriority(editingTask.priority);
      setDueDate(editingTask.dueDate || '');
    } else {
      setTitle('');
      setOverview('');
      setCollectionId(defaultCollectionId || collections[0]?.id || '');
      setSubcollectionId(defaultSubcollectionId || '');
      setPriority(3);
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingTask, isOpen, collections, defaultCollectionId, defaultSubcollectionId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    const task: Task = {
      id: editingTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      overview: overview.trim(),
      collectionId: collectionId || null,
      subcollectionId: subcollectionId || null,
      priority: priority,
      dueDate: dueDate,
      completed: editingTask?.completed || false,
      userId: user.uid,
      createdAt: editingTask?.createdAt || new Date().toISOString()
    };

    onSubmit(task);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? 'Modify Task Cockpit' : 'Draft New Action Task'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2 font-sans">
        <Input
          label="Task Title"
          type="text"
          placeholder="e.g. Write architecture notes 📄"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-text-secondary select-none">
            Detailed Notes / Overview
          </label>
          <textarea
            placeholder="Outline checklists, milestones, and instructions..."
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            className="w-full min-h-[90px] px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-all placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary select-none">
                Collection
              </label>
            </div>
            
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-all focus:outline-hidden focus:border-brand-primary"
            >
              {collections.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary select-none">
                Subcollection
              </label>
            </div>
            
            <select
              value={subcollectionId}
              onChange={(e) => setSubcollectionId(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-all focus:outline-hidden focus:border-brand-primary"
            >
              <option value="">None</option>
              {subcollections.filter(s => s.collectionId === collectionId).map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Target Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary select-none">
            Task Priority Gauge
          </label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPriority(1)}
              className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                priority <= 1
                  ? 'bg-success ring-2 ring-success/40 scale-110 shadow-md shadow-success/30'
                  : 'bg-success/30 hover:bg-success/60'
              }`}
              title="Low Priority"
              aria-label="Set low priority"
            />
            <button
              type="button"
              onClick={() => setPriority(3)}
              className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                priority >= 2 && priority <= 3
                  ? 'bg-warning ring-2 ring-warning/40 scale-110 shadow-md shadow-warning/30'
                  : 'bg-warning/30 hover:bg-warning/60'
              }`}
              title="Medium Priority"
              aria-label="Set medium priority"
            />
            <button
              type="button"
              onClick={() => setPriority(5)}
              className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                priority >= 4
                  ? 'bg-error ring-2 ring-error/40 scale-110 shadow-md shadow-error/30'
                  : 'bg-error/30 hover:bg-error/60'
              }`}
              title="High Priority"
              aria-label="Set high priority"
            />
            <span className="text-[11px] font-semibold text-text-secondary/70 ml-0.5">
              {priority <= 1 ? 'Low Priority' : priority <= 3 ? 'Medium Priority' : 'Critical Priority 🚨'}
            </span>
          </div>
        </div>



        <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-border/50 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Discard
          </Button>
          <Button type="submit" variant="primary" size="md">
            {editingTask ? 'Save Modifications' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

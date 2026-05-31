import { useState } from 'react';
import type { Task } from '../../../../types';

interface TaskDescriptionProps {
  detailOverview: string;
  setDetailOverview: (overview: string) => void;
  handleUpdateActiveTask: (fields: Partial<Task>) => void;
}

export const TaskDescription = ({
  detailOverview,
  setDetailOverview,
  handleUpdateActiveTask
}: TaskDescriptionProps) => {
  // Load description expand/collapse memory from localStorage
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(() => {
    const cached = localStorage.getItem('todo_description_expanded');
    return cached === null ? true : cached === 'true';
  });

  return (
    <div className="flex flex-col gap-2 border-t border-b border-gray-border/40 py-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary/50">Description</label>
        <button
          type="button"
          onClick={() => {
            const newState = !isDescriptionOpen;
            setIsDescriptionOpen(newState);
            localStorage.setItem('todo_description_expanded', String(newState));
          }}
          className="text-[9px] font-bold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1.5 cursor-pointer bg-brand-primary/10 px-1.5 py-0.5 rounded-md hover:bg-brand-primary/15"
        >
          {isDescriptionOpen ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {isDescriptionOpen && (
        <textarea
          placeholder="Draft checklist details or overview notes here..."
          value={detailOverview}
          onChange={(e) => setDetailOverview(e.target.value)}
          onBlur={() => handleUpdateActiveTask({ overview: detailOverview })}
          rows={4}
          className="w-full text-xs font-semibold leading-relaxed text-text-primary bg-transparent border-0 resize-none focus:outline-hidden focus:ring-0 placeholder:text-text-secondary/35 select-text animate-slide-in"
        />
      )}
    </div>
  );
};

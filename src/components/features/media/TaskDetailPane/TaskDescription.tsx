import { useState, useEffect, useRef } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load description expand/collapse memory from localStorage, defaulting to false to save vertical space
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(() => {
    const cached = localStorage.getItem('todo_description_expanded');
    return cached === null ? false : cached === 'true';
  });

  // Auto-grow Description Textarea height to prevent clipping
  useEffect(() => {
    const el = textareaRef.current;
    if (el && isDescriptionOpen) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [detailOverview, isDescriptionOpen]);

  return (
    <div className={`flex flex-col gap-1.5 border-t border-b border-gray-border/30 select-none transition-all duration-200 ${isDescriptionOpen ? 'py-3.5' : 'py-2'}`}>
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
      {isDescriptionOpen ? (
        <textarea
          ref={textareaRef}
          placeholder="Draft checklist details or overview notes here..."
          value={detailOverview}
          onChange={(e) => {
            setDetailOverview(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={() => handleUpdateActiveTask({ overview: detailOverview })}
          rows={3}
          className="w-full text-xs font-semibold leading-relaxed text-text-primary bg-transparent border-0 resize-none focus:outline-hidden focus:ring-0 placeholder:text-text-secondary/35 select-text animate-slide-in overflow-hidden min-h-[72px]"
        />
      ) : (
        detailOverview.trim() && (
          <p 
            onClick={() => {
              setIsDescriptionOpen(true);
              localStorage.setItem('todo_description_expanded', 'true');
            }}
            className="text-[11px] font-medium text-text-secondary/60 truncate cursor-pointer hover:text-text-secondary transition-colors mt-0.5"
          >
            {detailOverview}
          </p>
        )
      )}
    </div>
  );
};


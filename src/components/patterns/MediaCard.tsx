import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, Edit2, Play, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task, Collection } from '../../types';
import { StatusBadge } from './StatusBadge';
import { IconButton } from '../ui/IconButton';

interface MediaCardProps {
  media: Task;
  category?: Collection;
  onToggleComplete?: (id: string) => void;
  onEdit?: (media: Task) => void;
  onDelete?: (id: string) => void;
}

export const MediaCard = ({
  media,
  category,
  onToggleComplete,
  onEdit,
  onDelete,
}: MediaCardProps) => {
  const navigate = useNavigate();

  const isOverdue = media.dueDate
    ? new Date(media.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) && !media.completed
    : false;

  const cardBorderColor = category ? category.color : 'rgba(255, 255, 255, 0.08)';

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative flex flex-col justify-between bg-card border rounded-3xl p-5 transition-colors shadow-md group overflow-hidden"
      style={{ borderColor: cardBorderColor }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${cardBorderColor}, transparent 65%)`,
        }}
      />

      <div>
        {/* State Tags and Completions Checkbox */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {media.completed ? (
              <StatusBadge type="completed" />
            ) : isOverdue ? (
              <StatusBadge type="overdue" />
            ) : (
              <StatusBadge type="active" />
            )}

            {category && (
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md text-white border"
                style={{
                  backgroundColor: `${category.color}15`,
                  borderColor: `${category.color}30`,
                }}
              >
                {category.name}
              </span>
            )}
          </div>

          {onToggleComplete && (
            <button
              onClick={() => onToggleComplete(media.id)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                media.completed
                  ? 'bg-success border-success text-white shadow-md shadow-success/20'
                  : 'border-gray-border bg-bg-secondary text-transparent hover:border-text-secondary/50'
              }`}
            >
              <Check aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Task Title Link */}
        <h3
          onClick={() => navigate(`/task/${media.id}`)}
          className={`text-base font-bold text-text-primary group-hover:text-brand-primary transition-colors cursor-pointer line-clamp-1 select-none tracking-wide ${
            media.completed ? 'line-through text-text-secondary/40' : ''
          }`}
        >
          {media.title}
        </h3>

        {/* Task Overview */}
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mt-2 select-none">
          {media.overview || 'No notes available.'}
        </p>
      </div>

      <div className="mt-4">
        {/* Due Date Indicator & Priority Weights */}
        <div className="flex items-center justify-between border-t border-gray-border/50 pt-3 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar aria-hidden="true" className="w-3.5 h-3.5" />
            <span>{media.dueDate || 'No due date'}</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-brand-accent">
            <span>Priority: {media.priority === 'high' ? 'High' : media.priority === 'medium' ? 'Medium' : 'Low'}</span>
          </div>
        </div>

        {/* Custom actions strip on Hover */}
        <div className="flex items-center justify-end gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/task/${media.id}`)}
            title="Open detailed dashboard"
          >
            <Play aria-hidden="true" className="w-4 h-4 text-brand-primary" />
          </IconButton>

          {onEdit && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => onEdit(media)}
              title="Edit parameters"
            >
              <Edit2 aria-hidden="true" className="w-4 h-4 text-text-secondary hover:text-text-primary" />
            </IconButton>
          )}

          {onDelete && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => onDelete(media.id)}
              title="Delete task"
            >
              <Trash2 aria-hidden="true" className="w-4 h-4 text-error" />
            </IconButton>
          )}
        </div>
      </div>
    </motion.div>
  );
};

import React from 'react';
import * as Icons from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useRedux';
import type { Tracker } from '../../../../types';
import { setActiveTrackerId } from '../../../../store/slices/trackerSlice';

interface TrackerCardProps {
  tracker: Tracker;
  isSelected: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  finance: '💰 Finance',
  health: '💪 Health',
  productivity: '🎯 Productivity',
  work: '💼 Work',
  lifestyle: '🌿 Lifestyle',
  custom: '⚙️ Custom',
};

export const TrackerCard = ({ tracker, isSelected }: TrackerCardProps) => {
  const dispatch = useAppDispatch();
  const { entries } = useAppSelector((state) => state.tracker);

  // Dynamic Lucide Icon mapping
  const getIcon = (iconName: string) => {
    const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; 'aria-hidden'?: string }>>)[iconName];
    return IconComp ? <IconComp className="w-5 h-5" aria-hidden="true" /> : <Icons.BarChart3 className="w-5 h-5" aria-hidden="true" />;
  };

  const trackerEntries = entries.filter(e => e.trackerId === tracker.id);
  const entryCount = trackerEntries.length;
  const lastEntry = trackerEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const fieldCount = tracker.fields.length;

  const formatRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  return (
    <div
      onClick={() => dispatch(setActiveTrackerId(tracker.id))}
      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? 'bg-card border-brand-primary/30 shadow-lg shadow-brand-primary/5'
          : 'bg-card/40 border-gray-border/30 hover:border-gray-border hover:bg-card/60'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Tracker Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent"
          style={{
            backgroundColor: tracker.color + '15',
            color: tracker.color,
          }}
        >
          {getIcon(tracker.icon)}
        </div>

        {/* Info */}
        <div className="flex flex-col min-w-0">
          <h4 className="text-sm font-bold truncate text-text-primary">
            {tracker.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-text-secondary/70 font-semibold">
              {CATEGORY_LABELS[tracker.category] || tracker.category}
            </span>
            <span className="text-text-secondary/30 text-[10px]">•</span>
            <span className="text-[11px] text-text-secondary/50 font-medium">
              {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Stats */}
      <div className="flex flex-col items-end shrink-0 ml-3 gap-0.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
          isSelected
            ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
            : 'bg-bg-primary border-gray-border/50 text-text-secondary'
        }`}>
          {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
        </span>
        {lastEntry && (
          <span className="text-[10px] text-text-secondary/50 font-medium">
            {formatRelativeDate(lastEntry.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
};

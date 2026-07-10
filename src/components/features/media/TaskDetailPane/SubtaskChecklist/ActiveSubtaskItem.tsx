import { Reorder, useDragControls } from 'framer-motion';
import { 
  Check, GripVertical, Copy, Edit2, Trash2, X
} from 'lucide-react';
import { useAppDispatch } from '../../../../../hooks/useRedux';
import { updateSubtasksPositionsAsync } from '../../../../../store/slices/todoSlice';
import type { Subtask } from '../../../../../types';
import { ExpandableText } from '../../../../patterns/ExpandableText';

interface ActiveSubtaskItemProps {
  sub: Subtask;
  editingSubtaskId: string | null;
  setEditingSubtaskId: (id: string | null) => void;
  editingSubtaskTitle: string;
  setEditingSubtaskTitle: (title: string) => void;
  editingSubtaskPriority: 'low' | 'medium' | 'high';
  setEditingSubtaskPriority: (priority: 'low' | 'medium' | 'high') => void;
  handleUpdateSubtask: (sub: Subtask) => void;
  handleToggleSubtask: (sub: Subtask) => void;
  handleDeleteSubtask: (id: string) => void;
  toast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  draggedSubtaskId: string | null;
  setDraggedSubtaskId: (id: string | null) => void;
  dragOverSubtaskId: string | null;
  setDragOverSubtaskId: (id: string | null) => void;
  dropPosition: 'top' | 'bottom' | null;
  setDropPosition: (pos: 'top' | 'bottom' | null) => void;
  sortedActiveSubtasks: Subtask[];
  subtaskSortOrder: string;
  setSubtaskSortOrder: (order: 'default' | 'priority-desc' | 'priority-asc' | 'title-asc' | 'title-desc' | 'date-desc' | 'date-asc') => void;
  isSelectionMode: boolean;
  isSelectedForBulk: boolean;
  onToggleSelect: (id: string) => void;
}

export const ActiveSubtaskItem = ({
  sub,
  editingSubtaskId,
  setEditingSubtaskId,
  editingSubtaskTitle,
  setEditingSubtaskTitle,
  editingSubtaskPriority,
  setEditingSubtaskPriority,
  handleUpdateSubtask,
  handleToggleSubtask,
  handleDeleteSubtask,
  toast,
  draggedSubtaskId,
  setDraggedSubtaskId,
  dragOverSubtaskId,
  setDragOverSubtaskId,
  dropPosition,
  setDropPosition,
  sortedActiveSubtasks,
  subtaskSortOrder,
  setSubtaskSortOrder,
  isSelectionMode,
  isSelectedForBulk,
  onToggleSelect,
}: ActiveSubtaskItemProps) => {
  const dispatch = useAppDispatch();
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={sub.id}
      value={sub}
      dragControls={dragControls}
      dragListener={false}
      className="w-full focus:outline-hidden relative"
      draggable={editingSubtaskId !== sub.id && !isSelectionMode}
      onDragStart={() => {
        if (!isSelectionMode) setDraggedSubtaskId(sub.id);
      }}
      onDragOver={(e) => {
        if (isSelectionMode) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const isTop = relativeY < rect.height / 2;
        setDragOverSubtaskId(sub.id);
        setDropPosition(isTop ? 'top' : 'bottom');
      }}
      onDragLeave={() => {
        if (isSelectionMode) return;
        setDragOverSubtaskId(null);
        setDropPosition(null);
      }}
      onDragEnd={() => {
        if (isSelectionMode) return;
        setDraggedSubtaskId(null);
        setDragOverSubtaskId(null);
        setDropPosition(null);
      }}
      onDrop={(e) => {
        if (isSelectionMode) return;
        e.preventDefault();
        if (draggedSubtaskId && draggedSubtaskId !== sub.id) {
          const updatedSubtasks = [...sortedActiveSubtasks];
          const fromIdx = updatedSubtasks.findIndex(s => s.id === draggedSubtaskId);
          if (fromIdx !== -1) {
            const [removed] = updatedSubtasks.splice(fromIdx, 1);
            let toIdx = updatedSubtasks.findIndex(s => s.id === sub.id);
            if (toIdx !== -1) {
              if (dropPosition === 'bottom') {
                toIdx = toIdx + 1;
              }
              updatedSubtasks.splice(toIdx, 0, removed);
              
              if (subtaskSortOrder !== 'default') {
                setSubtaskSortOrder('default');
                localStorage.setItem('todo_subtask_sort_order', 'default');
              }
              const updated = updatedSubtasks.map((s, index) => ({
                ...s,
                position: index,
              }));
              dispatch(updateSubtasksPositionsAsync(updated));
            }
          }
        }
        setDraggedSubtaskId(null);
        setDragOverSubtaskId(null);
        setDropPosition(null);
      }}
    >
      {dragOverSubtaskId === sub.id && dropPosition === 'top' && draggedSubtaskId !== sub.id && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-primary shadow-[0_0_8px_#6366f1] rounded-full z-50 pointer-events-none" />
      )}

      <div
        onClick={() => {
          if (isSelectionMode) {
            onToggleSelect(sub.id);
          }
        }}
        className={`group flex flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-l-4 transition-all ${
          isSelectionMode ? 'cursor-pointer' : ''
        } ${
          isSelectedForBulk
            ? 'bg-brand-primary/10 border-brand-primary/45 text-text-primary shadow-xs'
            : sub.completed
              ? 'border-success/20 opacity-60 bg-success/5'
              : sub.priority === 'high'
                ? 'bg-error/5 border-error/20 hover:bg-error/10'
                : sub.priority === 'medium'
                  ? 'bg-warning/5 border-warning/20 hover:bg-warning/10'
                  : 'bg-bg-primary/50 dark:bg-bg-secondary/20 border-gray-border hover:bg-bg-primary dark:hover:bg-bg-secondary/40'
        } ${
          sub.priority === 'high'
            ? 'border-l-error'
            : sub.priority === 'medium'
              ? 'border-l-warning'
              : 'border-l-success'
        }`}
      >
        {editingSubtaskId === sub.id ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateSubtask(sub);
            }}
            className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full flex-1">
              <div className="flex items-center gap-1 shrink-0 bg-bg-primary px-2 py-1.5 rounded-lg border border-gray-border/40 self-start xs:self-auto">
                <button
                  type="button"
                  onClick={() => setEditingSubtaskPriority('low')}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    editingSubtaskPriority === 'low'
                      ? 'bg-success ring-2 ring-success/40 scale-110'
                      : 'bg-success/30 hover:bg-success/60'
                  }`}
                  title="Low"
                  aria-label="Set low priority"
                />
                <button
                  type="button"
                  onClick={() => setEditingSubtaskPriority('medium')}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    editingSubtaskPriority === 'medium'
                      ? 'bg-warning ring-2 ring-warning/40 scale-110'
                      : 'bg-warning/30 hover:bg-warning/60'
                  }`}
                  title="Medium"
                  aria-label="Set medium priority"
                />
                <button
                  type="button"
                  onClick={() => setEditingSubtaskPriority('high')}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    editingSubtaskPriority === 'high'
                      ? 'bg-error ring-2 ring-error/40 scale-110'
                      : 'bg-error/30 hover:bg-error/60'
                  }`}
                  title="High"
                  aria-label="Set high priority"
                />
              </div>
              <input
                autoFocus
                type="text"
                value={editingSubtaskTitle}
                onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingSubtaskId(null);
                  }
                }}
                className="flex-1 min-w-0 px-2 py-1 rounded bg-bg-primary border border-gray-border/20 text-text-primary text-[11px] font-semibold focus:outline-hidden focus:border-brand-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
              <button
                type="submit"
                className="p-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                aria-label="Save subtask"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setEditingSubtaskId(null)}
                className="p-1.5 border border-gray-border hover:bg-bg-secondary text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                aria-label="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start gap-2.5 overflow-hidden flex-1 w-full">
              {isSelectionMode ? (
                <input
                  type="checkbox"
                  checked={isSelectedForBulk}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(sub.id);
                  }}
                  className="w-4 h-4 rounded border-gray-border bg-bg-primary text-brand-primary focus:ring-brand-primary shrink-0 mt-1 cursor-pointer accent-brand-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  {subtaskSortOrder === 'default' && (
                    <div
                      onPointerDown={(e) => {
                        dragControls.start(e);
                      }}
                      className="p-1 -ml-1 text-text-secondary/30 group-hover:text-text-secondary/70 hover:bg-bg-primary rounded cursor-grab active:cursor-grabbing transition-colors shrink-0 mt-0.5 touch-none"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-3 h-3" />
                    </div>
                  )}
                  <button
                    onClick={() => handleToggleSubtask(sub)}
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer mt-0.5 ${
                      sub.priority === 'high'
                        ? 'border-error bg-bg-secondary text-transparent hover:border-error/80'
                        : sub.priority === 'medium'
                          ? 'border-warning bg-bg-secondary text-transparent hover:border-warning/80'
                          : 'border-gray-border bg-bg-secondary text-transparent hover:border-text-secondary'
                    }`}
                    aria-label="Toggle subtask completion"
                  >
                    <Check className="w-2.5 h-2.5 hover:text-text-secondary" />
                  </button>
                </>
              )}
              <ExpandableText text={sub.title} textSize="text-[11px]" />
            </div>

            {!isSelectionMode && (
              <div className="flex items-center justify-end gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(sub.title);
                    toast('Subtask copied to clipboard! 📋', 'success');
                  }}
                  className="p-1 hover:bg-bg-primary rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Copy subtask"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSubtaskId(sub.id);
                    setEditingSubtaskTitle(sub.title);
                    setEditingSubtaskPriority(sub.priority || 'low');
                  }}
                  className="p-1 hover:bg-bg-primary rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Edit subtask"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSubtask(sub.id);
                  }}
                  className="p-1 hover:bg-bg-primary rounded text-error transition-colors cursor-pointer shrink-0"
                  title="Delete subtask"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {dragOverSubtaskId === sub.id && dropPosition === 'bottom' && draggedSubtaskId !== sub.id && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-primary shadow-[0_0_8px_#6366f1] rounded-full z-50 pointer-events-none" />
      )}
    </Reorder.Item>
  );
};

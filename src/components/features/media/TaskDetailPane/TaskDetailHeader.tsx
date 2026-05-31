import { Trash2, X, Calendar, Folder, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useRedux';
import { setIsDetailsPaneExpanded } from '../../../../store/slices/todoSlice';
import type { Collection, Task } from '../../../../types';

interface TaskDetailHeaderProps {
  detailDueDate: string;
  detailPriority: number;
  detailCollectionId: string;
  collections: Collection[];
  activeTask: Task;
  onClose: () => void;
  setDetailDueDate: (date: string) => void;
  setDetailPriority: (priority: number) => void;
  setDetailCollectionId: (collectionId: string) => void;
  handleUpdateActiveTask: (fields: Partial<Task>) => void;
  handleDeleteTask: (id: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const TaskDetailHeader = ({
  detailDueDate,
  detailPriority,
  detailCollectionId,
  collections,
  activeTask,
  onClose,
  setDetailDueDate,
  setDetailPriority,
  setDetailCollectionId,
  handleUpdateActiveTask,
  handleDeleteTask,
  toast
}: TaskDetailHeaderProps) => {
  const dispatch = useAppDispatch();
  const { isDetailsPaneExpanded } = useAppSelector((state) => state.todo);

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4.5 gap-2 border-b border-gray-border/50 bg-[#161616]/40 select-none shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <button
          onClick={onClose}
          className="lg:hidden w-11 h-11 flex items-center justify-center hover:bg-[#202020] text-text-secondary hover:text-text-primary rounded-lg cursor-pointer shrink-0"
          aria-label="Back to tasks queue"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        
        {/* Inline target date selector icon-button */}
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-text-secondary bg-[#202020] border border-gray-border px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl relative hover:text-text-primary transition-all shrink-0">
          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-primary" />
          <input
            type="date"
            value={detailDueDate}
            onChange={(e) => {
              setDetailDueDate(e.target.value);
              handleUpdateActiveTask({ dueDate: e.target.value });
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <span className="hidden sm:inline">{detailDueDate || 'Date and Reminder'}</span>
          <span className="inline sm:hidden">{detailDueDate || 'Date'}</span>
        </div>

        {/* Workspace Tag selector capsule */}
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-text-secondary bg-[#202020] border border-gray-border px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl relative hover:text-text-primary transition-all shrink-0">
          <Folder className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-primary shrink-0" />
          <select
            value={detailCollectionId}
            onChange={(e) => {
              setDetailCollectionId(e.target.value);
              handleUpdateActiveTask({ 
                collectionId: e.target.value || null, 
                subcollectionId: null
              });
              toast('List category updated!', 'info');
            }}
            className="bg-transparent border-0 p-0 text-[10px] sm:text-[11px] font-bold text-text-secondary hover:text-text-primary focus:ring-0 focus:outline-hidden cursor-pointer w-auto max-w-[70px] sm:max-w-[120px] truncate pr-4"
          >
            <option value="" className="bg-[#202020] text-text-primary">Inbox</option>
            {collections.map(c => (
              <option key={c.id} value={c.id} className="bg-[#202020] text-text-primary">{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority color dots & Deletions */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-[#202020] border border-gray-border px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl gap-1 sm:gap-2 relative select-none">
          <button
            onClick={() => {
              setDetailPriority(1);
              handleUpdateActiveTask({ priority: 1 });
            }}
            className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full transition-all cursor-pointer ${
              detailPriority <= 1
                ? 'bg-success ring-2 ring-success/40 scale-110 shadow-md shadow-success/30'
                : 'bg-success/30 hover:bg-success/60'
            }`}
            title="Low Priority"
            aria-label="Set low priority"
          />
          <button
            onClick={() => {
              setDetailPriority(3);
              handleUpdateActiveTask({ priority: 3 });
            }}
            className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full transition-all cursor-pointer ${
              detailPriority >= 2 && detailPriority <= 3
                ? 'bg-warning ring-2 ring-warning/40 scale-110 shadow-md shadow-warning/30'
                : 'bg-warning/30 hover:bg-warning/60'
            }`}
            title="Medium Priority"
            aria-label="Set medium priority"
          />
          <button
            onClick={() => {
              setDetailPriority(5);
              handleUpdateActiveTask({ priority: 5 });
            }}
            className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full transition-all cursor-pointer ${
              detailPriority >= 4
                ? 'bg-error ring-2 ring-error/40 scale-110 shadow-md shadow-error/30'
                : 'bg-error/30 hover:bg-error/60'
            }`}
            title="High Priority"
            aria-label="Set high priority"
          />
        </div>

        <button
          onClick={() => handleDeleteTask(activeTask.id)}
          className="p-2 hover:bg-[#202020] hover:text-error text-text-secondary/70 rounded-xl cursor-pointer transition-colors"
          title="Wipe out task card"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
        
        <button
          onClick={() => dispatch(setIsDetailsPaneExpanded(!isDetailsPaneExpanded))}
          className="hidden lg:block p-2 hover:bg-[#202020] text-text-secondary hover:text-text-primary rounded-xl cursor-pointer transition-colors"
          title={isDetailsPaneExpanded ? "Shrink subtask panel" : "Expand subtask panel"}
        >
          {isDetailsPaneExpanded ? (
            <Minimize2 className="w-4.5 h-4.5" />
          ) : (
            <Maximize2 className="w-4.5 h-4.5" />
          )}
        </button>

        <button
          onClick={onClose}
          className="hidden lg:block p-2 hover:bg-[#202020] text-text-secondary hover:text-text-primary rounded-xl cursor-pointer transition-colors"
          title="Close details"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
};

import { Trash2, X, ArrowLeft, Maximize2, Minimize2, Download, Folder, LayoutList } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useRedux';
import { setIsDetailsPaneExpanded } from '../../../../store/slices/todoSlice';
import type { Collection, Subcollection, Task } from '../../../../types';

interface TaskDetailHeaderProps {
  activeTask: Task;
  onClose: () => void;
  handleDeleteTask: (id: string) => void;
  onTriggerExport: (mode: 'task' | 'subtask') => void;
  detailCollectionId: string;
  collections: Collection[];
  setDetailCollectionId: (collectionId: string) => void;
  detailSubcollectionId: string | null;
  subcollections: Subcollection[];
  setDetailSubcollectionId: (subcollectionId: string | null) => void;
  handleUpdateActiveTask: (fields: Partial<Task>) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const TaskDetailHeader = ({
  activeTask,
  onClose,
  handleDeleteTask,
  onTriggerExport,
  detailCollectionId,
  collections,
  setDetailCollectionId,
  detailSubcollectionId,
  subcollections,
  setDetailSubcollectionId,
  handleUpdateActiveTask,
  toast
}: TaskDetailHeaderProps) => {
  const dispatch = useAppDispatch();
  const { isDetailsPaneExpanded } = useAppSelector((state) => state.todo);

  // Filter sublists for the active Category list selection
  const activeSublists = subcollections.filter(s => s.collectionId === detailCollectionId);

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3.5 py-2.5 border-b border-gray-border/50 bg-[#161616]/40 select-none shrink-0 gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onClose}
          className="lg:hidden w-11 h-11 flex items-center justify-center hover:bg-[#202020] text-text-secondary hover:text-text-primary rounded-lg cursor-pointer shrink-0"
          aria-label="Back to tasks queue"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        
        {/* Workspace Tag selector capsule */}
        <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary bg-[#202020] border border-gray-border/50 px-2.5 py-1.5 rounded-xl relative hover:text-text-primary transition-all shrink-0">
          <Folder className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          <select
            value={detailCollectionId}
            onChange={(e) => {
              const newColId = e.target.value || '';
              setDetailCollectionId(newColId);
              setDetailSubcollectionId(null); // Instantly clear previous invalid sublist relation
              handleUpdateActiveTask({ 
                collectionId: newColId || null, 
                subcollectionId: null
              });
              toast('List category updated!', 'info');
            }}
            className="bg-transparent border-0 p-0 text-[10px] font-bold text-text-secondary hover:text-text-primary focus:ring-0 focus:outline-hidden cursor-pointer w-auto max-w-[120px] truncate pr-4"
          >
            <option value="" className="bg-[#202020] text-text-primary">Inbox</option>
            {collections.map(c => (
              <option key={c.id} value={c.id} className="bg-[#202020] text-text-primary">{c.name}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Subcollection/Sublist selector capsule */}
        {activeSublists.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary bg-[#202020] border border-gray-border/50 px-2.5 py-1.5 rounded-xl relative hover:text-text-primary transition-all shrink-0 animate-scale-in">
            <LayoutList className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <select
              value={detailSubcollectionId || ''}
              onChange={(e) => {
                const newSubId = e.target.value || null;
                setDetailSubcollectionId(newSubId);
                handleUpdateActiveTask({ subcollectionId: newSubId });
                toast('Sublist updated!', 'info');
              }}
              className="bg-transparent border-0 p-0 text-[10px] font-bold text-text-secondary hover:text-text-primary focus:ring-0 focus:outline-hidden cursor-pointer w-auto max-w-[120px] truncate pr-4"
            >
              <option value="" className="bg-[#202020] text-text-primary">Inbox (Root)</option>
              {activeSublists.map(s => (
                <option key={s.id} value={s.id} className="bg-[#202020] text-text-primary">{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Header Actions Panel */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Export Action */}
        <button
          onClick={() => onTriggerExport('task')}
          className="p-2 hover:bg-[#202020] text-text-secondary hover:text-text-primary rounded-xl cursor-pointer transition-colors"
          title="Export task & details"
        >
          <Download className="w-4.5 h-4.5" />
        </button>

        {/* Delete Action */}
        <button
          onClick={() => handleDeleteTask(activeTask.id)}
          className="p-2 hover:bg-[#202020] hover:text-error text-text-secondary/70 rounded-xl cursor-pointer transition-colors"
          title="Wipe out task card"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
        
        {/* Toggle Expand Action */}
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

        {/* Close Action */}
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

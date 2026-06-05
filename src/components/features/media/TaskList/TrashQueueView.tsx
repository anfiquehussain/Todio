import { useState } from 'react';
import { Trash2, Folder, LayoutList, CheckSquare, Smile, RotateCcw, X, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppDispatch } from '../../../../hooks/useRedux';
import { 
  restoreCollectionAsync, deleteCollectionPermanentAsync,
  restoreSubcollectionAsync, deleteSubcollectionPermanentAsync,
  restoreTaskAsync, deleteTaskPermanentAsync,
  restoreSubtaskAsync, deleteSubtaskPermanentAsync,
  emptyTrashAsync,
  restoreTasksBulkAsync, deleteTasksPermanentBulkAsync,
  restoreSubtasksBulkAsync, deleteSubtasksPermanentBulkAsync
} from '../../../../store/slices/todoSlice';
import { useToast } from '../../../../hooks/useToast';
import { ConfirmationModal } from '../../../patterns/ConfirmationModal';
import { Button } from '../../../ui/Button';
import type { Task, Collection, Subcollection, Subtask } from '../../../../types';

interface TrashQueueViewProps {
  tasks: Task[];
  collections: Collection[];
  subcollections: Subcollection[];
  subtasks: Subtask[];
}

export const TrashQueueView = ({
  tasks,
  collections,
  subcollections,
  subtasks,
}: TrashQueueViewProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: 'collection' | 'subcollection' | 'task' | 'subtask';
    name: string;
  } | null>(null);
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getDaysLeft = (deletedAt?: string) => {
    if (!deletedAt) return '30 days left';
    const now = new Date();
    const deletedDate = new Date(deletedAt);
    const diffMs = now.getTime() - deletedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const daysLeft = 30 - diffDays;
    if (daysLeft <= 0) return 'Expiring';
    return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  };

  const handleRestoreCollection = async (id: string) => {
    try {
      await dispatch(restoreCollectionAsync(id)).unwrap();
      toast('Workspace list restored successfully.', 'success');
    } catch {
      toast('Failed to restore list.', 'error');
    }
  };

  const handleRestoreSubcollection = async (id: string) => {
    try {
      await dispatch(restoreSubcollectionAsync(id)).unwrap();
      toast('Sublist restored successfully.', 'success');
    } catch {
      toast('Failed to restore sublist.', 'error');
    }
  };

  const handleRestoreTask = async (id: string) => {
    try {
      await dispatch(restoreTaskAsync(id)).unwrap();
      toast('Task successfully restored.', 'success');
    } catch {
      toast('Failed to restore task.', 'error');
    }
  };

  const handleRestoreSubtask = async (id: string) => {
    try {
      await dispatch(restoreSubtaskAsync(id)).unwrap();
      toast('Subtask restored successfully.', 'success');
    } catch {
      toast('Failed to restore subtask.', 'error');
    }
  };

  const handleDeletePermanent = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    setIsProcessing(true);
    try {
      if (type === 'collection') {
        await dispatch(deleteCollectionPermanentAsync(id)).unwrap();
        toast('Workspace list permanently deleted.', 'info');
      } else if (type === 'subcollection') {
        await dispatch(deleteSubcollectionPermanentAsync(id)).unwrap();
        toast('Sublist permanently deleted.', 'info');
      } else if (type === 'task') {
        await dispatch(deleteTaskPermanentAsync(id)).unwrap();
        toast('Task permanently deleted.', 'info');
      } else if (type === 'subtask') {
        await dispatch(deleteSubtaskPermanentAsync(id)).unwrap();
        toast('Subtask permanently deleted.', 'info');
      }
    } catch {
      toast(`Failed to permanently delete ${type}.`, 'error');
    } finally {
      setIsProcessing(false);
      setDeleteTarget(null);
    }
  };

  const hasDeletedItems =
    collections.length > 0 ||
    subcollections.length > 0 ||
    tasks.length > 0 ||
    subtasks.length > 0;

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = () => {
    const nextSelected: Record<string, boolean> = {};
    collections.forEach(c => { nextSelected[c.id] = true; });
    subcollections.forEach(s => { nextSelected[s.id] = true; });
    tasks.forEach(t => { nextSelected[t.id] = true; });
    subtasks.forEach(s => { nextSelected[s.id] = true; });
    setSelectedIds(nextSelected);
  };

  const handleDeselectAll = () => {
    setSelectedIds({});
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const handleBulkRestore = async () => {
    if (selectedCount === 0) return;
    const idsToRestore = Object.keys(selectedIds).filter(id => selectedIds[id]);
    
    const colIds = collections.filter(c => idsToRestore.includes(c.id)).map(c => c.id);
    const subIds = subcollections.filter(s => idsToRestore.includes(s.id)).map(s => s.id);
    const taskIds = tasks.filter(t => idsToRestore.includes(t.id)).map(t => t.id);
    const subtaskIds = subtasks.filter(s => idsToRestore.includes(s.id)).map(s => s.id);

    setIsProcessing(true);
    try {
      await Promise.all([
        ...colIds.map(id => dispatch(restoreCollectionAsync(id)).unwrap()),
        ...subIds.map(id => dispatch(restoreSubcollectionAsync(id)).unwrap()),
        taskIds.length > 0 ? dispatch(restoreTasksBulkAsync(taskIds)).unwrap() : Promise.resolve(),
        subtaskIds.length > 0 ? dispatch(restoreSubtasksBulkAsync(subtaskIds)).unwrap() : Promise.resolve()
      ]);
      toast(`Successfully restored ${selectedCount} items.`, 'success');
      setSelectedIds({});
      setIsSelectionMode(false);
    } catch {
      toast('Failed to restore selected items.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDeletePermanentClick = () => {
    if (selectedCount === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDeletePermanent = async () => {
    const idsToDelete = Object.keys(selectedIds).filter(id => selectedIds[id]);
    if (idsToDelete.length === 0) return;

    const colIds = collections.filter(c => idsToDelete.includes(c.id)).map(c => c.id);
    const subIds = subcollections.filter(s => idsToDelete.includes(s.id)).map(s => s.id);
    const taskIds = tasks.filter(t => idsToDelete.includes(t.id)).map(t => t.id);
    const subtaskIds = subtasks.filter(s => idsToDelete.includes(s.id)).map(s => s.id);

    setIsProcessing(true);
    try {
      await Promise.all([
        ...colIds.map(id => dispatch(deleteCollectionPermanentAsync(id)).unwrap()),
        ...subIds.map(id => dispatch(deleteSubcollectionPermanentAsync(id)).unwrap()),
        taskIds.length > 0 ? dispatch(deleteTasksPermanentBulkAsync(taskIds)).unwrap() : Promise.resolve(),
        subtaskIds.length > 0 ? dispatch(deleteSubtasksPermanentBulkAsync(subtaskIds)).unwrap() : Promise.resolve()
      ]);
      toast(`Permanently deleted ${selectedCount} items.`, 'info');
      setSelectedIds({});
      setIsSelectionMode(false);
    } catch {
      toast('Failed to permanently delete selected items.', 'error');
    } finally {
      setIsProcessing(false);
      setIsBulkDeleteModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-text-secondary/50 uppercase tracking-wider select-none">
          Soft Deleted Items (Auto-purges after 30 days)
        </div>
        <div className="flex items-center gap-2">
          {hasDeletedItems && (
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-extrabold cursor-pointer transition-all select-none shadow-xs ${
                isSelectionMode
                  ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                  : 'border-gray-border bg-[#202020] text-text-secondary hover:text-text-primary hover:bg-[#252525]'
              }`}
              title={isSelectionMode ? 'Exit Selection Mode' : 'Select Multiple Items'}
              aria-label="Toggle multi-select mode in trash"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isSelectionMode ? 'Exit Selection' : 'Select Items'}</span>
            </button>
          )}
          {hasDeletedItems && (
            <button
              onClick={() => setIsEmptyTrashModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-error/20 bg-error/5 hover:bg-error/15 text-error text-[10px] font-extrabold cursor-pointer transition-all select-none shadow-xs"
              title="Permanently empty all items in the trash"
              aria-label="Empty Trash Bin"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          )}
        </div>
      </div>

      {hasDeletedItems ? (
        <div className="flex flex-col gap-5">
          {/* Collections (Lists) */}
          {collections.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary/40 px-1 select-none">
                Workspace Lists ({collections.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {collections.map(col => (
                  <div
                     key={col.id}
                     onClick={() => {
                       if (isSelectionMode) {
                         handleToggleSelect(col.id);
                       }
                     }}
                     className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 select-none transition-all ${
                       isSelectionMode ? 'cursor-pointer hover:bg-[#202020]' : ''
                     }`}
                     style={{ borderLeftColor: col.color || '#6366f1' }}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      {isSelectionMode ? (
                        <input
                          type="checkbox"
                          checked={!!selectedIds[col.id]}
                          onChange={() => handleToggleSelect(col.id)}
                          className="w-4 h-4 rounded border-gray-border bg-[#202020] text-brand-primary focus:ring-brand-primary shrink-0 cursor-pointer accent-brand-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <Folder className="w-3.5 h-3.5 shrink-0 opacity-55" style={{ color: col.color }} />
                      )}
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {col.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(col.deletedAt)}
                      </span>
                    </div>
                    {!isSelectionMode && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestoreCollection(col.id); }}
                          className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                          title="Restore List"
                        >
                          Restore
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: col.id, type: 'collection', name: col.name }); }}
                          className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                          title="Delete permanently"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subcollections (Sublists) */}
          {subcollections.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary/40 px-1 select-none">
                Workspace Sublists ({subcollections.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {subcollections.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      if (isSelectionMode) {
                        handleToggleSelect(sub.id);
                      }
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-brand-secondary/40 select-none transition-all ${
                      isSelectionMode ? 'cursor-pointer hover:bg-[#202020]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      {isSelectionMode ? (
                        <input
                          type="checkbox"
                          checked={!!selectedIds[sub.id]}
                          onChange={() => handleToggleSelect(sub.id)}
                          className="w-4 h-4 rounded border-gray-border bg-[#202020] text-brand-primary focus:ring-brand-primary shrink-0 cursor-pointer accent-brand-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <LayoutList className="w-3.5 h-3.5 shrink-0 opacity-55 text-brand-secondary" />
                      )}
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {sub.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(sub.deletedAt)}
                      </span>
                    </div>
                    {!isSelectionMode && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestoreSubcollection(sub.id); }}
                          className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                          title="Restore Sublist"
                        >
                          Restore
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: sub.id, type: 'subcollection', name: sub.name }); }}
                          className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                          title="Delete permanently"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary/40 px-1 select-none">
                Tasks ({tasks.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (isSelectionMode) {
                        handleToggleSelect(task.id);
                      }
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-text-secondary/40 select-none transition-all ${
                      isSelectionMode ? 'cursor-pointer hover:bg-[#202020]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      {isSelectionMode ? (
                        <input
                          type="checkbox"
                          checked={!!selectedIds[task.id]}
                          onChange={() => handleToggleSelect(task.id)}
                          className="w-4 h-4 rounded border-gray-border bg-[#202020] text-brand-primary focus:ring-brand-primary shrink-0 cursor-pointer accent-brand-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <CheckSquare className="w-3.5 h-3.5 shrink-0 opacity-55 text-text-secondary" />
                      )}
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {task.title}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(task.deletedAt)}
                      </span>
                    </div>
                    {!isSelectionMode && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestoreTask(task.id); }}
                          className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                          title="Restore Task"
                        >
                          Restore
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: task.id, type: 'task', name: task.title }); }}
                          className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                          title="Delete permanently"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary/40 px-1 select-none">
                Subtasks ({subtasks.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {subtasks.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      if (isSelectionMode) {
                        handleToggleSelect(sub.id);
                      }
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-success/40 select-none transition-all ${
                      isSelectionMode ? 'cursor-pointer hover:bg-[#202020]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      {isSelectionMode ? (
                        <input
                          type="checkbox"
                          checked={!!selectedIds[sub.id]}
                          onChange={() => handleToggleSelect(sub.id)}
                          className="w-4 h-4 rounded border-gray-border bg-[#202020] text-brand-primary focus:ring-brand-primary shrink-0 cursor-pointer accent-brand-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <CheckSquare className="w-3.5 h-3.5 shrink-0 opacity-55 text-success" />
                      )}
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {sub.title}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(sub.deletedAt)}
                      </span>
                    </div>
                    {!isSelectionMode && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestoreSubtask(sub.id); }}
                          className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                          title="Restore Subtask"
                        >
                          Restore
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: sub.id, type: 'subtask', name: sub.title }); }}
                          className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                          title="Delete permanently"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 text-text-secondary/40 gap-3 border border-dashed border-gray-border/50 rounded-3xl mt-2 select-none">
          <Smile className="w-12 h-12 text-brand-primary/40 animate-pulse" />
          <div>
            <h3 className="text-xs font-black text-text-primary">Trash is empty</h3>
            <p className="text-[10px] mt-0.5">Deleted items will stay here for 30 days.</p>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmationModal
          isOpen={deleteTarget !== null}
          onClose={() => {
            if (!isProcessing) setDeleteTarget(null);
          }}
          onConfirm={handleDeletePermanent}
          title={`Delete ${deleteTarget.type === 'collection' ? 'List' : deleteTarget.type === 'subcollection' ? 'Sublist' : deleteTarget.type === 'task' ? 'Task' : 'Subtask'} Permanently?`}
          message="This action cannot be undone. The item and all its contents will be lost forever."
          confirmLabel="Delete Permanently"
          isDanger={true}
          isLoading={isProcessing}
        />
      )}

      {isBulkDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            if (!isProcessing) setIsBulkDeleteModalOpen(false);
          }}
          onConfirm={handleConfirmBulkDeletePermanent}
          title={`Permanently Delete ${selectedCount} Items?`}
          message="This action cannot be undone. All selected items and their nested contents will be lost forever."
          confirmLabel="Delete Permanently"
          isDanger={true}
          isLoading={isProcessing}
        />
      )}

      {isEmptyTrashModalOpen && (
        <ConfirmationModal
          isOpen={isEmptyTrashModalOpen}
          onClose={() => {
            if (!isProcessing) setIsEmptyTrashModalOpen(false);
          }}
          onConfirm={async () => {
            setIsProcessing(true);
            try {
              await dispatch(emptyTrashAsync()).unwrap();
              toast('Trash bin successfully cleared.', 'info');
            } catch {
              toast('Failed to empty trash bin.', 'error');
            } finally {
              setIsProcessing(false);
              setIsEmptyTrashModalOpen(false);
            }
          }}
          title="Empty Trash Bin?"
          message="Are you sure you want to permanently delete all items in the trash? This action cannot be undone."
          confirmLabel="Empty Trash"
          isDanger={true}
          isLoading={isProcessing}
        />
      )}

      {/* Floating Action Bar for Bulk Trash Operations */}
      <AnimatePresence>
        {isSelectionMode && selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#181818]/95 backdrop-blur-md border border-brand-primary/20 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_15px_rgba(99,102,241,0.15)] rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 z-50 select-none w-[calc(100%-2rem)] sm:w-auto max-w-md sm:max-w-none"
          >
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <span className="text-[11px] font-black text-text-primary uppercase tracking-widest tabular-nums shrink-0">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds({});
                }}
                disabled={isProcessing}
                className="p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0 sm:hidden disabled:opacity-50"
                aria-label="Cancel Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:block h-4 w-px bg-gray-border/40 shrink-0" />
            
            <div className="flex flex-wrap items-center justify-center gap-1.5 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                disabled={isProcessing}
                className="font-bold select-none cursor-pointer flex-1 sm:flex-initial text-[10px] sm:text-xs py-1.5 px-3"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isProcessing}
                className="font-bold select-none cursor-pointer text-text-secondary hover:text-text-primary flex-1 sm:flex-initial text-[10px] sm:text-xs py-1.5 px-3"
                onClick={handleDeselectAll}
              >
                Deselect
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isProcessing}
                className="font-bold select-none cursor-pointer bg-brand-primary text-white flex-1 sm:flex-initial text-[10px] sm:text-xs py-1.5 px-3 inline-flex items-center justify-center"
                onClick={handleBulkRestore}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                )}
                Restore
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isProcessing}
                className="font-bold select-none cursor-pointer flex-1 sm:flex-initial text-[10px] sm:text-xs py-1.5 px-3 inline-flex items-center justify-center"
                onClick={handleBulkDeletePermanentClick}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete Perm
              </Button>
            </div>
            
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds({});
              }}
              disabled={isProcessing}
              className="hidden sm:block p-1 hover:bg-[#282828] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              aria-label="Cancel Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

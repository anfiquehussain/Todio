import { useState } from 'react';
import { Trash2, Folder, LayoutList, CheckSquare, Smile } from 'lucide-react';
import { useAppDispatch } from '../../../../hooks/useRedux';
import { 
  restoreCollectionAsync, deleteCollectionPermanentAsync,
  restoreSubcollectionAsync, deleteSubcollectionPermanentAsync,
  restoreTaskAsync, deleteTaskPermanentAsync,
  restoreSubtaskAsync, deleteSubtaskPermanentAsync,
  emptyTrashAsync
} from '../../../../store/slices/todoSlice';
import { useToast } from '../../../../hooks/useToast';
import { ConfirmationModal } from '../../../patterns/ConfirmationModal';
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
      setDeleteTarget(null);
    }
  };

  const hasDeletedItems =
    collections.length > 0 ||
    subcollections.length > 0 ||
    tasks.length > 0 ||
    subtasks.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-text-secondary/50 uppercase tracking-wider select-none">
          Soft Deleted Items (Auto-purges after 30 days)
        </div>
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
                     className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 select-none transition-all"
                     style={{ borderLeftColor: col.color || '#6366f1' }}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <Folder className="w-3.5 h-3.5 shrink-0 opacity-55" style={{ color: col.color }} />
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {col.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(col.deletedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreCollection(col.id)}
                        className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Restore List"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: col.id, type: 'collection', name: col.name })}
                        className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Delete permanently"
                      >
                        Delete
                      </button>
                    </div>
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
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-brand-secondary/40 select-none transition-all"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <LayoutList className="w-3.5 h-3.5 shrink-0 opacity-55 text-brand-secondary" />
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {sub.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(sub.deletedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreSubcollection(sub.id)}
                        className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Restore Sublist"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: sub.id, type: 'subcollection', name: sub.name })}
                        className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Delete permanently"
                      >
                        Delete
                      </button>
                    </div>
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
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-text-secondary/40 select-none transition-all"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <CheckSquare className="w-3.5 h-3.5 shrink-0 opacity-55 text-text-secondary" />
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {task.title}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(task.deletedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreTask(task.id)}
                        className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Restore Task"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: task.id, type: 'task', name: task.title })}
                        className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Delete permanently"
                      >
                        Delete
                      </button>
                    </div>
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
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-gray-border bg-[#181818]/60 text-text-primary border-l-4 border-l-success/40 select-none transition-all"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <CheckSquare className="w-3.5 h-3.5 shrink-0 opacity-55 text-success" />
                      <span className="text-xs font-bold truncate text-text-secondary/60 line-through">
                        {sub.title}
                      </span>
                      <span className="text-[9px] font-extrabold text-error/60 bg-error/5 border border-error/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {getDaysLeft(sub.deletedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreSubtask(sub.id)}
                        className="px-2.5 py-1 hover:bg-[#2e2e2e] rounded-xl text-brand-primary hover:text-brand-primary/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Restore Subtask"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: sub.id, type: 'subtask', name: sub.title })}
                        className="px-2.5 py-1 hover:bg-error/20 rounded-xl text-error hover:text-error/80 transition-all cursor-pointer text-[10px] font-bold"
                        title="Delete permanently"
                      >
                        Delete
                      </button>
                    </div>
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
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeletePermanent}
          title={`Delete ${deleteTarget.type === 'collection' ? 'List' : deleteTarget.type === 'subcollection' ? 'Sublist' : deleteTarget.type === 'task' ? 'Task' : 'Subtask'} Permanently?`}
          message="This action cannot be undone. The item and all its contents will be lost forever."
          confirmLabel="Delete Permanently"
          isDanger={true}
        />
      )}

      {isEmptyTrashModalOpen && (
        <ConfirmationModal
          isOpen={isEmptyTrashModalOpen}
          onClose={() => setIsEmptyTrashModalOpen(false)}
          onConfirm={async () => {
            try {
              await dispatch(emptyTrashAsync()).unwrap();
              toast('Trash bin successfully cleared.', 'info');
            } catch {
              toast('Failed to empty trash bin.', 'error');
            } finally {
              setIsEmptyTrashModalOpen(false);
            }
          }}
          title="Empty Trash Bin?"
          message="Are you sure you want to permanently delete all items in the trash? This action cannot be undone."
          confirmLabel="Empty Trash"
          isDanger={true}
        />
      )}
    </div>
  );
};

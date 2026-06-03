import React, { useState } from 'react';
import { 
  ChevronRight, ChevronDown, Folder, Plus, Trash2, LayoutList, Check, X 
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  createCollectionAsync, deleteCollectionAsync, createSubcollectionAsync, deleteSubcollectionAsync 
} from '../../../store/slices/todoSlice';
import { useToast } from '../../../hooks/useToast';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { IconButton } from '../../ui/IconButton';
import { ConfirmationModal } from '../../patterns/ConfirmationModal';

interface CategoryManagerProps {
  selectedCollectionId: string | null;
  selectedSubcollectionId: string | null;
  setSelectedCollectionId: (id: string | null) => void;
  setSelectedSubcollectionId: (id: string | null) => void;
}

export const CategoryManager = ({
  selectedCollectionId,
  selectedSubcollectionId,
  setSelectedCollectionId,
  setSelectedSubcollectionId
}: CategoryManagerProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();

  const { collections: allCollections, subcollections: allSubcollections } = useAppSelector((state) => state.todo);
  const collections = allCollections.filter(c => !c.deleted);
  const subcollections = allSubcollections.filter(s => !s.deleted);
  const { user } = useAppSelector((state) => state.auth);

  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  
  const [creatingSubcollectionFor, setCreatingSubcollectionFor] = useState<string | null>(null);
  const [newSubcollectionName, setNewSubcollectionName] = useState('');
  const [isSavingSubcollection, setIsSavingSubcollection] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'collection' | 'subcollection'; name: string } | null>(null);

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingCollection) return;
    if (!checkAuth('create collection') || !user || !newCollectionName.trim()) return;

    try {
      setIsSavingCollection(true);
      await dispatch(createCollectionAsync({
        id: `col-${Date.now()}`,
        name: newCollectionName.trim(),
        color: '#6366f1',
        icon: 'Folder',
        userId: user.uid,
        createdAt: new Date().toISOString()
      })).unwrap();
      setNewCollectionName('');
      setIsCreatingCollection(false);
      toast('Collection created!', 'success');
    } catch {
      toast('Failed to create collection', 'error');
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleCreateSubcollection = async (e: React.FormEvent, collectionId: string) => {
    e.preventDefault();
    if (isSavingSubcollection) return;
    if (!checkAuth('create subcollection') || !user || !newSubcollectionName.trim()) return;

    try {
      setIsSavingSubcollection(true);
      await dispatch(createSubcollectionAsync({
        id: `sub-${Date.now()}`,
        collectionId: collectionId,
        name: newSubcollectionName.trim(),
        color: '#06b6d4',
        icon: 'List',
        userId: user.uid,
        createdAt: new Date().toISOString()
      })).unwrap();
      setNewSubcollectionName('');
      setCreatingSubcollectionFor(null);
      setExpandedCollections(prev => ({ ...prev, [collectionId]: true }));
      toast('Subcollection created!', 'success');
    } catch {
      toast('Failed to create subcollection', 'error');
    } finally {
      setIsSavingSubcollection(false);
    }
  };

  const handleDeleteCollection = (id: string) => {
    if (!checkAuth('delete collection')) return;
    const col = collections.find(c => c.id === id);
    if (col) {
      setDeleteTarget({ id, type: 'collection', name: col.name });
    }
  };

  const handleDeleteSubcollection = (id: string) => {
    if (!checkAuth('delete subcollection')) return;
    const sub = subcollections.find(s => s.id === id);
    if (sub) {
      setDeleteTarget({ id, type: 'subcollection', name: sub.name });
    }
  };

  return (
    <div className="w-full lg:w-72 shrink-0 bg-card border border-gray-border rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto no-scrollbar select-none">
      <div className="flex items-center justify-between px-2 mb-2">
        <h2 className="text-lg font-bold text-text-primary tracking-wide">Workspace</h2>
        <IconButton variant="ghost" size="sm" onClick={() => setIsCreatingCollection(true)}>
          <Plus className="w-5 h-5 text-text-secondary hover:text-brand-primary" />
        </IconButton>
      </div>

      {isCreatingCollection && (
        <form onSubmit={handleCreateCollection} className="px-2 mb-4 flex items-center gap-1.5">
          <input
            autoFocus
            type="text"
            placeholder="Workspace name..."
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            disabled={isSavingCollection}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !isSavingCollection) {
                setNewCollectionName('');
                setIsCreatingCollection(false);
              }
            }}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-brand-primary/30 bg-bg-secondary text-text-primary text-sm focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSavingCollection}
            className="p-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Save workspace"
          >
            {isSavingCollection ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            disabled={isSavingCollection}
            onClick={() => {
              setNewCollectionName('');
              setIsCreatingCollection(false);
            }}
            className="p-2 border border-gray-border hover:bg-white/5 text-text-secondary hover:text-text-primary rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="flex flex-col gap-1">
        {collections.map(collection => {
          const isExpanded = expandedCollections[collection.id];
          const isSelected = selectedCollectionId === collection.id && !selectedSubcollectionId;
          const subs = subcollections.filter(s => s.collectionId === collection.id);

          return (
            <div key={collection.id} className="flex flex-col">
              {/* Collection Row */}
              <div 
                className={`group flex items-center justify-between px-2 py-2 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-bg-secondary text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => {
                  setSelectedCollectionId(collection.id);
                  setSelectedSubcollectionId(null);
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleCollection(collection.id); }}
                    className="p-0.5 hover:bg-gray-border rounded"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <Folder className="w-4 h-4 shrink-0" style={{ color: collection.color }} />
                  <span className="text-sm font-semibold truncate">{collection.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setCreatingSubcollectionFor(collection.id); 
                      setExpandedCollections(prev => ({ ...prev, [collection.id]: true }));
                    }}
                    className="p-1 hover:bg-gray-border rounded text-text-secondary"
                    title="Add Subcollection"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCollection(collection.id); }}
                    className="p-1 hover:bg-error/20 rounded text-error"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subcollections List */}
              {isExpanded && (
                <div className="flex flex-col gap-0.5 ml-6 mt-1 border-l border-gray-border pl-2">
                  {subs.map(sub => {
                    const isSubSelected = selectedSubcollectionId === sub.id;
                    return (
                      <div 
                        key={sub.id}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          isSubSelected ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-bg-secondary text-text-secondary hover:text-text-primary'
                        }`}
                        onClick={() => {
                          setSelectedCollectionId(collection.id);
                          setSelectedSubcollectionId(sub.id);
                        }}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <LayoutList className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="text-sm font-medium truncate">{sub.name}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSubcollection(sub.id); }}
                          className="p-1 hover:bg-error/20 rounded text-error opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  
                  {creatingSubcollectionFor === collection.id && (
                    <form onSubmit={(e) => handleCreateSubcollection(e, collection.id)} className="px-2 mt-1.5 flex items-center gap-1.5">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Subcollection..."
                        value={newSubcollectionName}
                        onChange={(e) => setNewSubcollectionName(e.target.value)}
                        disabled={isSavingSubcollection}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape' && !isSavingSubcollection) {
                            setNewSubcollectionName('');
                            setCreatingSubcollectionFor(null);
                          }
                        }}
                        className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-brand-primary/30 bg-bg-secondary text-text-primary text-xs focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isSavingSubcollection}
                        className="p-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                        aria-label="Save subcollection"
                      >
                        {isSavingSubcollection ? (
                          <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingSubcollection}
                        onClick={() => {
                          setNewSubcollectionName('');
                          setCreatingSubcollectionFor(null);
                        }}
                        className="p-1.5 border border-gray-border hover:bg-white/5 text-text-secondary hover:text-text-primary rounded-lg cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                        aria-label="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            if (deleteTarget.type === 'collection') {
              const deletedCol = collections.find(c => c.id === deleteTarget.id);
              await dispatch(deleteCollectionAsync(deleteTarget.id));
              if (selectedCollectionId === deleteTarget.id) setSelectedCollectionId(null);
              toast('Collection deleted', 'info', undefined, deletedCol ? {
                label: 'Undo',
                onClick: () => {
                  dispatch(createCollectionAsync(deletedCol));
                  toast('Collection restored', 'success');
                }
              } : undefined);
            } else {
              const deletedSub = subcollections.find(s => s.id === deleteTarget.id);
              await dispatch(deleteSubcollectionAsync(deleteTarget.id));
              if (selectedSubcollectionId === deleteTarget.id) setSelectedSubcollectionId(null);
              toast('Subcollection deleted', 'info', undefined, deletedSub ? {
                label: 'Undo',
                onClick: () => {
                  dispatch(createSubcollectionAsync(deletedSub));
                  toast('Subcollection restored', 'success');
                }
              } : undefined);
            }
          } catch {
            toast(`Failed to delete ${deleteTarget.type}`, 'error');
          }
        }}
        title={`Delete ${deleteTarget?.type === 'collection' ? 'Collection' : 'Subcollection'}?`}
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        isDanger={true}
      />
    </div>
  );
};

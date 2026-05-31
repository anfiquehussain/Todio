import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Calendar, Folder, Plus, Check, X, Edit2, Trash2, LayoutList, ChevronDown, ChevronRight, Download 
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useRedux';
import { usePWA } from '../../../../hooks/usePWA';
import { 
  setActiveCollectionId, setActiveSubcollectionId, setFilter, 
  createCollectionAsync, deleteCollectionAsync, createSubcollectionAsync, deleteSubcollectionAsync,
  updateCollectionAsync, updateSubcollectionAsync 
} from '../../../../store/slices/todoSlice';
import type { Collection, Subcollection } from '../../../../types';
import { useToast } from '../../../../hooks/useToast';
import { useAuthGuard } from '../../../../hooks/useAuthGuard';

interface OrganizerSidebarProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const OrganizerSidebar = ({
  setIsMobileMenuOpen
}: OrganizerSidebarProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { checkAuth } = useAuthGuard();
  const { shouldShowButton, triggerInstall } = usePWA();

  const { 
    collections, subcollections, tasks, activeCollectionId, 
    activeSubcollectionId, filter 
  } = useAppSelector((state) => state.todo);
  const { user } = useAppSelector((state) => state.auth);

  // Sidebar states
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [creatingSubcollectionFor, setCreatingSubcollectionFor] = useState<string | null>(null);
  const [newSubcollectionName, setNewSubcollectionName] = useState('');
  const [isSavingSubcollection, setIsSavingSubcollection] = useState(false);

  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState('');
  const [editingSubcollectionId, setEditingSubcollectionId] = useState<string | null>(null);
  const [editingSubcollectionName, setEditingSubcollectionName] = useState('');

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingCollection) return;
    if (!checkAuth('create collection') || !user || !newCollectionName.trim()) return;

    try {
      setIsSavingCollection(true);
      const newCol = {
        id: `col-${Date.now()}`,
        name: newCollectionName.trim(),
        color: '#c2883c',
        icon: 'Folder',
        userId: user.uid,
        createdAt: new Date().toISOString()
      };
      await dispatch(createCollectionAsync(newCol)).unwrap();
      setNewCollectionName('');
      setIsCreatingCollection(false);
      dispatch(setActiveCollectionId(newCol.id));
      dispatch(setActiveSubcollectionId(null));
      dispatch(setFilter('all'));
      navigate('/');
      setIsMobileMenuOpen(false);
      toast('Workspace list established!', 'success');
    } catch {
      toast('Failed to create list.', 'error');
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleCreateSubcollection = async (e: React.FormEvent, collectionId: string) => {
    e.preventDefault();
    if (isSavingSubcollection) return;
    if (!checkAuth('create sublist') || !user || !newSubcollectionName.trim()) return;

    try {
      setIsSavingSubcollection(true);
      const newSub = {
        id: `sub-${Date.now()}`,
        collectionId: collectionId,
        name: newSubcollectionName.trim(),
        color: '#c2883c',
        icon: 'List',
        userId: user.uid,
        createdAt: new Date().toISOString()
      };
      await dispatch(createSubcollectionAsync(newSub)).unwrap();
      setNewSubcollectionName('');
      setCreatingSubcollectionFor(null);
      setExpandedCollections(prev => ({ ...prev, [collectionId]: true }));
      dispatch(setActiveCollectionId(collectionId));
      dispatch(setActiveSubcollectionId(newSub.id));
      dispatch(setFilter('all'));
      navigate('/');
      setIsMobileMenuOpen(false);
      toast('Sublist established under workspace!', 'success');
    } catch {
      toast('Failed to create sublist.', 'error');
    } finally {
      setIsSavingSubcollection(false);
    }
  };

  const handleDeleteCollection = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!checkAuth('delete list')) return;
    try {
      await dispatch(deleteCollectionAsync(id));
      toast('List deleted.', 'info');
    } catch {
      toast('Failed to delete list.', 'error');
    }
  };

  const handleDeleteSubcollection = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!checkAuth('delete sublist')) return;
    try {
      await dispatch(deleteSubcollectionAsync(id));
      toast('Sublist deleted.', 'info');
    } catch {
      toast('Failed to delete sublist.', 'error');
    }
  };

  const handleUpdateCollection = async (e: React.FormEvent, collection: Collection) => {
    e.preventDefault();
    if (!editingCollectionName.trim() || !user) return;
    try {
      await dispatch(updateCollectionAsync({ ...collection, name: editingCollectionName.trim() })).unwrap();
      setEditingCollectionId(null);
      toast('Workspace list renamed successfully! 📁', 'success');
    } catch {
      toast('Failed to rename list.', 'error');
    }
  };

  const handleUpdateSubcollection = async (e: React.FormEvent, sub: Subcollection) => {
    e.preventDefault();
    if (!editingSubcollectionName.trim() || !user) return;
    try {
      await dispatch(updateSubcollectionAsync({ ...sub, name: editingSubcollectionName.trim() })).unwrap();
      setEditingSubcollectionId(null);
      toast('Sublist renamed successfully! 🧱', 'success');
    } catch {
      toast('Failed to rename sublist.', 'error');
    }
  };

  // Helper counts
  const getTaskCountForCollection = (colId: string, subId?: string | null) => {
    return tasks.filter(t => {
      if (t.completed) return false;
      if (subId) return t.subcollectionId === subId;
      return t.collectionId === colId && !t.subcollectionId;
    }).length;
  };

  const getSmartViewCount = (type: 'today' | 'week' | 'inbox') => {
    const today = new Date().setHours(0, 0, 0, 0);
    const in7Days = new Date().setDate(new Date().getDate() + 7);

    return tasks.filter(t => {
      if (t.completed) return false;
      if (type === 'today') {
        return t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) === today;
      }
      if (type === 'week') {
        if (!t.dueDate) return false;
        const taskTime = new Date(t.dueDate).getTime();
        return taskTime >= today && taskTime <= in7Days;
      }
      if (type === 'inbox') {
        return !t.collectionId;
      }
      return false;
    }).length;
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-r border-gray-border p-4 w-60 shrink-0 select-none">
      {/* Smart views section */}
      <div className="flex flex-col gap-1 mb-6">
        <button
          onClick={() => {
            dispatch(setActiveCollectionId(null));
            dispatch(setActiveSubcollectionId(null));
            dispatch(setFilter('active'));
            navigate('/');
            setIsMobileMenuOpen(false);
          }}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold select-none cursor-pointer transition-all ${
            filter === 'active' && !activeCollectionId
              ? 'bg-[#242424] text-brand-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1a1a]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-4 h-4" />
            <span>Today</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#202020] text-text-secondary">
            {getSmartViewCount('today')}
          </span>
        </button>

        <button
          onClick={() => {
            dispatch(setActiveCollectionId(null));
            dispatch(setActiveSubcollectionId(null));
            dispatch(setFilter('all'));
            navigate('/');
            setIsMobileMenuOpen(false);
          }}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold select-none cursor-pointer transition-all ${
            filter === 'all' && !activeCollectionId
              ? 'bg-[#242424] text-brand-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1a1a]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4" />
            <span>Next 7 Days</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#202020] text-text-secondary">
            {getSmartViewCount('week')}
          </span>
        </button>

        <button
          onClick={() => {
            dispatch(setActiveCollectionId(null));
            dispatch(setActiveSubcollectionId(null));
            dispatch(setFilter('overdue'));
            navigate('/');
            setIsMobileMenuOpen(false);
          }}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold select-none cursor-pointer transition-all ${
            filter === 'overdue' && !activeCollectionId
              ? 'bg-[#242424] text-brand-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1a1a]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Folder className="w-4 h-4" />
            <span>Inbox</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#202020] text-text-secondary">
            {getSmartViewCount('inbox')}
          </span>
        </button>
      </div>

      {/* Lists / Collection Manager Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary/50">Lists</span>
          <button 
            onClick={() => setIsCreatingCollection(true)}
            className="p-1 hover:bg-[#1a1a1a] rounded text-text-secondary hover:text-brand-primary transition-colors cursor-pointer"
            aria-label="Add list"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Create Collection input */}
        {isCreatingCollection && (
          <form onSubmit={handleCreateCollection} className="px-2 mb-3 flex items-center gap-1.5">
            <input
              autoFocus
              type="text"
              placeholder="List name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              disabled={isSavingCollection}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && !isSavingCollection) {
                  setNewCollectionName('');
                  setIsCreatingCollection(false);
                }
              }}
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-brand-primary/20 bg-bg-primary text-text-primary text-xs focus:outline-hidden focus:border-brand-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSavingCollection}
              className="p-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Save list"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={isSavingCollection}
              onClick={() => {
                setNewCollectionName('');
                setIsCreatingCollection(false);
              }}
              className="p-1.5 border border-gray-border hover:bg-white/5 text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Collections Tree Render */}
        <div className="flex flex-col gap-0.5">
          {collections.map(collection => {
            const isExpanded = expandedCollections[collection.id];
            const isSelected = activeCollectionId === collection.id && !activeSubcollectionId;
            const subs = subcollections.filter(s => s.collectionId === collection.id);
            const totalActiveTasks = getTaskCountForCollection(collection.id) + subs.reduce((acc, sub) => acc + getTaskCountForCollection(collection.id, sub.id), 0);

            return (
              <div key={collection.id} className="flex flex-col">
                {editingCollectionId === collection.id ? (
                  <form 
                    onSubmit={(e) => handleUpdateCollection(e, collection)} 
                    className="px-2 py-1.5 flex items-center gap-1.5 w-full bg-[#1a1a1a] rounded-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Folder className="w-4 h-4 shrink-0 text-brand-primary" style={{ color: collection.color }} />
                    <input
                      autoFocus
                      type="text"
                      value={editingCollectionName}
                      onChange={(e) => setEditingCollectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingCollectionId(null);
                        }
                      }}
                      className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-brand-primary/20 bg-bg-primary text-text-primary text-xs focus:outline-hidden focus:border-brand-primary"
                    />
                    <button
                      type="submit"
                      className="p-1 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                      aria-label="Save"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCollectionId(null)}
                      className="p-1 border border-gray-border hover:bg-white/5 text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                      aria-label="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <div
                    onClick={() => {
                      dispatch(setActiveCollectionId(collection.id));
                      dispatch(setActiveSubcollectionId(null));
                      dispatch(setFilter('all'));
                      navigate('/');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`group flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[#242424] text-brand-primary' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCollections(prev => ({ ...prev, [collection.id]: !prev[collection.id] }));
                        }}
                        className="p-0.5 hover:bg-[#1a1a1a] rounded text-text-secondary/70 shrink-0"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {subs.length > 0 ? (
                          isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Folder className="w-4 h-4 shrink-0 text-brand-primary" style={{ color: collection.color }} />
                      <span className="text-sm font-semibold truncate">{collection.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#202020] text-text-secondary/70 lg:group-hover:hidden hidden lg:block">
                        {totalActiveTasks}
                      </span>
                      <div className="flex lg:hidden lg:group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreatingSubcollectionFor(collection.id);
                            setExpandedCollections(prev => ({ ...prev, [collection.id]: true }));
                          }}
                          className="p-0.5 hover:bg-[#202020] rounded text-text-secondary"
                          title="Add Sublist"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCollectionId(collection.id);
                            setEditingCollectionName(collection.name);
                          }}
                          className="p-0.5 hover:bg-[#202020] rounded text-text-secondary"
                          title="Rename List"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCollection(e, collection.id)}
                          className="p-0.5 hover:bg-error/20 rounded text-error"
                          title="Delete List"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subcollections List */}
                {isExpanded && (
                  <div className="flex flex-col gap-0.5 ml-5 border-l border-gray-border pl-2.5 mt-0.5">
                    {subs.map(sub => {
                      const isSubSelected = activeSubcollectionId === sub.id;
                      const subTasksCount = getTaskCountForCollection(collection.id, sub.id);
                      return (
                        <div key={sub.id} className="w-full">
                          {editingSubcollectionId === sub.id ? (
                            <form 
                              onSubmit={(e) => handleUpdateSubcollection(e, sub)} 
                              className="px-2 py-1 flex items-center gap-1 w-full bg-[#1a1a1a] rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LayoutList className="w-3.5 h-3.5 shrink-0 opacity-60" />
                              <input
                                autoFocus
                                type="text"
                                value={editingSubcollectionName}
                                onChange={(e) => setEditingSubcollectionName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setEditingSubcollectionId(null);
                                  }
                                }}
                                className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-brand-primary/20 bg-bg-primary text-text-primary text-[11px] focus:outline-hidden focus:border-brand-primary"
                              />
                              <button
                                type="submit"
                                className="p-1 bg-brand-primary text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                                aria-label="Save"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubcollectionId(null)}
                                className="p-1 border border-gray-border text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                                aria-label="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </form>
                          ) : (
                            <div
                              onClick={() => {
                                dispatch(setActiveCollectionId(collection.id));
                                dispatch(setActiveSubcollectionId(sub.id));
                                dispatch(setFilter('all'));
                                navigate('/');
                                setIsMobileMenuOpen(false);
                              }}
                              className={`group flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-all ${
                                isSubSelected
                                  ? 'bg-[#242424] text-brand-primary font-bold'
                                  : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1a1a]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                                <LayoutList className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                <span className="text-xs font-semibold truncate">{sub.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[9px] font-semibold px-1 rounded bg-[#202020] text-text-secondary/60 lg:group-hover:hidden hidden lg:block">
                                  {subTasksCount}
                                </span>
                                <div className="flex lg:hidden lg:group-hover:flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingSubcollectionId(sub.id);
                                      setEditingSubcollectionName(sub.name);
                                    }}
                                    className="p-0.5 hover:bg-[#202020] rounded text-text-secondary"
                                    title="Rename Sublist"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteSubcollection(e, sub.id)}
                                    className="p-0.5 hover:bg-error/20 rounded text-error"
                                    title="Delete Sublist"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {creatingSubcollectionFor === collection.id && (
                      <form onSubmit={(e) => handleCreateSubcollection(e, collection.id)} className="px-2 mt-1.5 flex items-center gap-1">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Sublist name..."
                          value={newSubcollectionName}
                          onChange={(e) => setNewSubcollectionName(e.target.value)}
                          disabled={isSavingSubcollection}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape' && !isSavingSubcollection) {
                              setNewSubcollectionName('');
                              setCreatingSubcollectionFor(null);
                            }
                          }}
                          className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-brand-primary/20 bg-bg-primary text-text-primary text-[11px] focus:outline-hidden focus:border-brand-primary disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={isSavingSubcollection}
                          className="p-1 bg-brand-primary text-white rounded-lg cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isSavingSubcollection}
                          onClick={() => {
                            setNewSubcollectionName('');
                            setCreatingSubcollectionFor(null);
                          }}
                          className="p-1 border border-gray-border text-text-secondary rounded-lg cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
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
      </div>

      {/* Completed & Trash footer block */}
      <div className="flex flex-col gap-1 border-t border-gray-border/50 pt-3 mt-3">
        <button
          onClick={() => {
            dispatch(setActiveCollectionId(null));
            dispatch(setActiveSubcollectionId(null));
            dispatch(setFilter('completed'));
            navigate('/');
            setIsMobileMenuOpen(false);
          }}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold select-none cursor-pointer transition-all ${
            filter === 'completed' && !activeCollectionId
              ? 'bg-[#242424] text-brand-primary font-bold animate-pulse'
              : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1a1a]'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Completed</span>
        </button>

        {/* PWA Install Banner */}
        {shouldShowButton && (
          <div className="mt-2 mb-1 p-3 rounded-2xl bg-linear-to-br from-brand-primary/10 to-brand-accent/5 border border-brand-primary/20 hover:border-brand-primary/35 transition-colors select-none text-left shrink-0">
            <h4 className="text-xs font-bold text-text-primary mb-0.5">Get Todio App</h4>
            <p className="text-[10px] text-text-secondary mb-2 leading-relaxed">Install for a faster, offline-ready productivity experience.</p>
            <button
              onClick={triggerInstall}
              className="w-full py-1.5 px-3 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 transition-all shadow-md hover:shadow-lg glow-primary"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Workspace</span>
            </button>
          </div>
        )}

        <div className="text-[10px] text-text-secondary/40 font-medium px-3 mt-2 select-none">
          v1.3.0 • Premium 3-Column
        </div>
      </div>
    </div>
  );
};

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Collection, Subcollection, Task, Subtask } from '../../types';
import { firestoreService } from '../../api/todo/firestoreService';

export interface TodoState {
  collections: Collection[];
  subcollections: Subcollection[];
  tasks: Task[];
  subtasks: Subtask[];
  activeCollectionId: string | null;
  activeSubcollectionId: string | null;
  activeTaskId: string | null;
  filter: 'all' | 'active' | 'completed' | 'overdue' | 'trash';
  searchQuery: string;
  sortBy: 'custom' | 'priority-desc' | 'priority-asc' | 'dueDate-asc' | 'dueDate-desc' | 'title-asc' | 'title-desc' | 'createdAt-desc' | 'createdAt-asc';
  soundEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  isDetailsPaneExpanded: boolean;
}

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const initialState: TodoState = {
  collections: loadFromLocalStorage('todio_collections', []),
  subcollections: loadFromLocalStorage('todio_subcollections', []),
  tasks: loadFromLocalStorage('todio_tasks', []),
  subtasks: loadFromLocalStorage('todio_subtasks', []),
  activeCollectionId: localStorage.getItem('todio_active_collection_id') || null,
  activeSubcollectionId: localStorage.getItem('todio_active_subcollection_id') || null,
  activeTaskId: localStorage.getItem('todio_active_task_id') || null,
  filter: (localStorage.getItem('todio_active_filter') as TodoState['filter']) || 'active',
  searchQuery: '',
  sortBy: 'custom',
  soundEnabled: true,
  isLoading: false,
  error: null,
  isDetailsPaneExpanded: false,
};

export const fetchAllTodoData = createAsyncThunk(
  'todo/fetchAll',
  async (userId: string) => {
    const [collections, subcollections, tasks, subtasks] = await Promise.all([
      firestoreService.getCollections(userId),
      firestoreService.getSubcollections(userId),
      firestoreService.getTasks(userId),
      firestoreService.getSubtasks(userId)
    ]);
    return { collections, subcollections, tasks, subtasks };
  }
);

export const createCollectionAsync = createAsyncThunk(
  'todo/createCollection',
  async (collection: Collection) => {
    await firestoreService.createCollection(collection);
    return collection;
  }
);

export const updateCollectionAsync = createAsyncThunk(
  'todo/updateCollection',
  async (collection: Collection) => {
    await firestoreService.createCollection(collection);
    return collection;
  }
);

export const deleteCollectionAsync = createAsyncThunk(
  'todo/deleteCollection',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    const timestamp = new Date().toISOString();
    const collection = state.todo.collections.find(c => c.id === id);
    if (collection) {
      const updatedCollection = { ...collection, deleted: true, deletedAt: timestamp };
      await firestoreService.createCollection(updatedCollection);

      // Cascading soft-delete child subcollections
      const childSubs = state.todo.subcollections.filter(s => s.collectionId === id);
      await Promise.all(childSubs.map(s => {
        const updatedSub = { ...s, deleted: true, deletedAt: timestamp };
        return firestoreService.createSubcollection(updatedSub);
      }));

      // Cascading soft-delete child tasks
      const childTasks = state.todo.tasks.filter(t => t.collectionId === id);
      await Promise.all(childTasks.map(t => {
        const updatedTask = { ...t, deleted: true, deletedAt: timestamp };
        return firestoreService.updateTask(updatedTask);
      }));

      return {
        collectionId: id,
        timestamp,
        subcollectionIds: childSubs.map(s => s.id),
        taskIds: childTasks.map(t => t.id)
      };
    }
    return { collectionId: id, timestamp: '', subcollectionIds: [], taskIds: [] };
  }
);

export const restoreCollectionAsync = createAsyncThunk(
  'todo/restoreCollection',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    const collection = state.todo.collections.find(c => c.id === id);
    if (collection) {
      const deletedAtTime = collection.deletedAt;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deletedAt, ...restCol } = collection;
      const updatedCollection = { ...restCol, deleted: false };
      await firestoreService.createCollection(updatedCollection);

      // Restore child subcollections deleted in the same batch
      const childSubs = state.todo.subcollections.filter(s => s.collectionId === id && s.deleted && s.deletedAt === deletedAtTime);
      await Promise.all(childSubs.map(s => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { deletedAt: d, ...restSub } = s;
        const restoredSub = { ...restSub, deleted: false };
        return firestoreService.createSubcollection(restoredSub);
      }));

      // Restore child tasks deleted in the same batch
      const childTasks = state.todo.tasks.filter(t => t.collectionId === id && t.deleted && t.deletedAt === deletedAtTime);
      await Promise.all(childTasks.map(t => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { deletedAt: d, ...restTask } = t;
        const restoredTask = { ...restTask, deleted: false };
        return firestoreService.updateTask(restoredTask);
      }));

      return {
        collectionId: id,
        subcollectionIds: childSubs.map(s => s.id),
        taskIds: childTasks.map(t => t.id)
      };
    }
    return { collectionId: id, subcollectionIds: [], taskIds: [] };
  }
);

export const deleteCollectionPermanentAsync = createAsyncThunk(
  'todo/deleteCollectionPermanent',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    await firestoreService.deleteCollection(id);

    const childSubs = state.todo.subcollections.filter(s => s.collectionId === id);
    await Promise.all(childSubs.map(s => firestoreService.deleteSubcollection(s.id)));

    const childTasks = state.todo.tasks.filter(t => t.collectionId === id);
    await Promise.all(childTasks.map(t => firestoreService.deleteTask(t.id)));

    return {
      collectionId: id,
      subcollectionIds: childSubs.map(s => s.id),
      taskIds: childTasks.map(t => t.id)
    };
  }
);

export const createSubcollectionAsync = createAsyncThunk(
  'todo/createSubcollection',
  async (subcollection: Subcollection) => {
    await firestoreService.createSubcollection(subcollection);
    return subcollection;
  }
);

export const updateSubcollectionAsync = createAsyncThunk(
  'todo/updateSubcollection',
  async (subcollection: Subcollection) => {
    await firestoreService.createSubcollection(subcollection);
    return subcollection;
  }
);

export const deleteSubcollectionAsync = createAsyncThunk(
  'todo/deleteSubcollection',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    const timestamp = new Date().toISOString();
    const subcollection = state.todo.subcollections.find(s => s.id === id);
    if (subcollection) {
      const updatedSub = { ...subcollection, deleted: true, deletedAt: timestamp };
      await firestoreService.createSubcollection(updatedSub);

      const childTasks = state.todo.tasks.filter(t => t.subcollectionId === id);
      await Promise.all(childTasks.map(t => {
        const updatedTask = { ...t, deleted: true, deletedAt: timestamp };
        return firestoreService.updateTask(updatedTask);
      }));

      return {
        subcollectionId: id,
        timestamp,
        taskIds: childTasks.map(t => t.id)
      };
    }
    return { subcollectionId: id, timestamp: '', taskIds: [] };
  }
);

export const restoreSubcollectionAsync = createAsyncThunk(
  'todo/restoreSubcollection',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    const subcollection = state.todo.subcollections.find(s => s.id === id);
    if (subcollection) {
      const deletedAtTime = subcollection.deletedAt;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deletedAt, ...restSub } = subcollection;
      const restoredSub = { ...restSub, deleted: false };
      await firestoreService.createSubcollection(restoredSub);

      const childTasks = state.todo.tasks.filter(t => t.subcollectionId === id && t.deleted && t.deletedAt === deletedAtTime);
      await Promise.all(childTasks.map(t => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { deletedAt: d, ...restTask } = t;
        const restoredTask = { ...restTask, deleted: false };
        return firestoreService.updateTask(restoredTask);
      }));

      return {
        subcollectionId: id,
        taskIds: childTasks.map(t => t.id)
      };
    }
    return { subcollectionId: id, taskIds: [] };
  }
);

export const deleteSubcollectionPermanentAsync = createAsyncThunk(
  'todo/deleteSubcollectionPermanent',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    await firestoreService.deleteSubcollection(id);

    const childTasks = state.todo.tasks.filter(t => t.subcollectionId === id);
    await Promise.all(childTasks.map(t => firestoreService.deleteTask(t.id)));

    return {
      subcollectionId: id,
      taskIds: childTasks.map(t => t.id)
    };
  }
);

export const createTaskAsync = createAsyncThunk(
  'todo/createTask',
  async (task: Task) => {
    await firestoreService.createTask(task);
    return task;
  }
);

export const updateTaskAsync = createAsyncThunk(
  'todo/updateTask',
  async (task: Task) => {
    await firestoreService.updateTask(task);
    return task;
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'todo/deleteTask',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    const timestamp = new Date().toISOString();
    const task = state.todo.tasks.find(t => t.id === id);
    if (task) {
      const updatedTask = { ...task, deleted: true, deletedAt: timestamp };
      await firestoreService.updateTask(updatedTask);

      // Cascading soft-delete associated subtasks
      const childSubtasks = state.todo.subtasks.filter(s => s.taskId === id);
      await Promise.all(childSubtasks.map(s => {
        const updatedSubtask = { ...s, deleted: true, deletedAt: timestamp };
        return firestoreService.createSubtask(updatedSubtask);
      }));

      return {
        taskId: id,
        timestamp,
        subtaskIds: childSubtasks.map(s => s.id)
      };
    }
    return { taskId: id, timestamp: '', subtaskIds: [] };
  }
);

export const restoreTaskAsync = createAsyncThunk(
  'todo/restoreTask',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    const task = state.todo.tasks.find(t => t.id === id);
    if (task) {
      const deletedAtTime = task.deletedAt;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deletedAt, ...restTask } = task;
      const restoredTask = { ...restTask, deleted: false };
      await firestoreService.updateTask(restoredTask);

      // Restore child subtasks deleted in the same batch
      const childSubtasks = state.todo.subtasks.filter(s => s.taskId === id && s.deleted && s.deletedAt === deletedAtTime);
      await Promise.all(childSubtasks.map(s => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { deletedAt: d, ...restSub } = s;
        const restoredSubtask = { ...restSub, deleted: false };
        return firestoreService.createSubtask(restoredSubtask);
      }));

      return {
        taskId: id,
        subtaskIds: childSubtasks.map(s => s.id)
      };
    }
    return { taskId: id, subtaskIds: [] };
  }
);

export const deleteTaskPermanentAsync = createAsyncThunk(
  'todo/deleteTaskPermanent',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    await firestoreService.deleteTask(id);

    const childSubtasks = state.todo.subtasks.filter(s => s.taskId === id);
    await Promise.all(childSubtasks.map(s => firestoreService.deleteSubtask(s.id)));

    return {
      taskId: id,
      subtaskIds: childSubtasks.map(s => s.id)
    };
  }
);

export const createSubtaskAsync = createAsyncThunk(
  'todo/createSubtask',
  async (subtask: Subtask) => {
    await firestoreService.createSubtask(subtask);
    return subtask;
  }
);

export const updateSubtaskAsync = createAsyncThunk(
  'todo/updateSubtask',
  async (subtask: Subtask) => {
    await firestoreService.updateSubtask(subtask);
    return subtask;
  }
);

export const deleteSubtaskAsync = createAsyncThunk(
  'todo/deleteSubtask',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    const timestamp = new Date().toISOString();
    const subtask = state.todo.subtasks.find(s => s.id === id);
    if (subtask) {
      const updated = { ...subtask, deleted: true, deletedAt: timestamp };
      await firestoreService.createSubtask(updated);
      return updated;
    }
    return id;
  }
);

export const restoreSubtaskAsync = createAsyncThunk(
  'todo/restoreSubtask',
  async (id: string, { getState }) => {
    const state = getState() as { todo: TodoState };
    const subtask = state.todo.subtasks.find(s => s.id === id);
    if (subtask) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deletedAt, ...restSub } = subtask;
      const restored = { ...restSub, deleted: false };
      await firestoreService.createSubtask(restored);
      return restored;
    }
    return id;
  }
);

export const deleteSubtaskPermanentAsync = createAsyncThunk(
  'todo/deleteSubtaskPermanent',
  async (id: string) => {
    await firestoreService.deleteSubtask(id);
    return id;
  }
);

export const cleanupExpiredTrashAsync = createAsyncThunk(
  'todo/cleanupExpiredTrash',
  async (_, { getState, dispatch }) => {
    const state = getState() as { todo: TodoState };
    const now = new Date();
    const threshold = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

    const expiredTasks = state.todo.tasks.filter(t => 
      t.deleted && t.deletedAt && (now.getTime() - new Date(t.deletedAt).getTime() > threshold)
    );
    const expiredCols = state.todo.collections.filter(c => 
      c.deleted && c.deletedAt && (now.getTime() - new Date(c.deletedAt).getTime() > threshold)
    );
    const expiredSubs = state.todo.subcollections.filter(s => 
      s.deleted && s.deletedAt && (now.getTime() - new Date(s.deletedAt).getTime() > threshold)
    );
    const expiredSubtasks = state.todo.subtasks.filter(s => 
      s.deleted && s.deletedAt && (now.getTime() - new Date(s.deletedAt).getTime() > threshold)
    );

    await Promise.all([
      ...expiredTasks.map(t => dispatch(deleteTaskPermanentAsync(t.id))),
      ...expiredCols.map(c => dispatch(deleteCollectionPermanentAsync(c.id))),
      ...expiredSubs.map(s => dispatch(deleteSubcollectionPermanentAsync(s.id))),
      ...expiredSubtasks.map(s => dispatch(deleteSubtaskPermanentAsync(s.id)))
    ]);
  }
);

export const emptyTrashAsync = createAsyncThunk(
  'todo/emptyTrash',
  async (_, { getState, dispatch }) => {
    const state = getState() as { todo: TodoState };

    const deletedTasks = state.todo.tasks.filter(t => t.deleted);
    const deletedCols = state.todo.collections.filter(c => c.deleted);
    const deletedSubs = state.todo.subcollections.filter(s => s.deleted);
    const deletedSubtasks = state.todo.subtasks.filter(s => s.deleted);

    await Promise.all([
      ...deletedTasks.map(t => dispatch(deleteTaskPermanentAsync(t.id))),
      ...deletedCols.map(c => dispatch(deleteCollectionPermanentAsync(c.id))),
      ...deletedSubs.map(s => dispatch(deleteSubcollectionPermanentAsync(s.id))),
      ...deletedSubtasks.map(s => dispatch(deleteSubtaskPermanentAsync(s.id)))
    ]);
  }
);


export const createSubtasksBulkAsync = createAsyncThunk(
  'todo/createSubtasksBulk',
  async (subtasks: Subtask[]) => {
    await Promise.all(subtasks.map(s => firestoreService.createSubtask(s)));
    return subtasks;
  }
);

export const createTasksBulkAsync = createAsyncThunk(
  'todo/createTasksBulk',
  async (payload: { tasks: Task[]; subtasks: Subtask[] }) => {
    await Promise.all([
      ...payload.tasks.map(t => firestoreService.createTask(t)),
      ...payload.subtasks.map(s => firestoreService.createSubtask(s))
    ]);
    return payload;
  }
);

export const updateTasksPositionsAsync = createAsyncThunk(
  'todo/updateTasksPositions',
  async (tasks: Task[]) => {
    await Promise.all(tasks.map(t => firestoreService.updateTask(t)));
    return tasks;
  }
);

export const updateSubtasksPositionsAsync = createAsyncThunk(
  'todo/updateSubtasksPositions',
  async (subtasks: Subtask[]) => {
    await Promise.all(subtasks.map(s => firestoreService.updateSubtask(s)));
    return subtasks;
  }
);

const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
    setActiveCollectionId: (state, action: PayloadAction<string | null>) => {
      state.activeCollectionId = action.payload;
      if (action.payload) {
        localStorage.setItem('todio_active_collection_id', action.payload);
      } else {
        localStorage.removeItem('todio_active_collection_id');
        localStorage.removeItem('todio_active_subcollection_id');
      }
      if (!action.payload) {
        state.activeSubcollectionId = null;
      }
    },
    setActiveSubcollectionId: (state, action: PayloadAction<string | null>) => {
      state.activeSubcollectionId = action.payload;
      if (action.payload) {
        localStorage.setItem('todio_active_subcollection_id', action.payload);
      } else {
        localStorage.removeItem('todio_active_subcollection_id');
      }
    },
    setActiveTaskId: (state, action: PayloadAction<string | null>) => {
      state.activeTaskId = action.payload;
      if (action.payload) {
        localStorage.setItem('todio_active_task_id', action.payload);
      } else {
        localStorage.removeItem('todio_active_task_id');
      }
      if (!action.payload) {
        state.isDetailsPaneExpanded = false;
      }
    },
    setIsDetailsPaneExpanded: (state, action: PayloadAction<boolean>) => {
      state.isDetailsPaneExpanded = action.payload;
    },
    setFilter: (state, action: PayloadAction<TodoState['filter']>) => {
      state.filter = action.payload;
      localStorage.setItem('todio_active_filter', action.payload);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action: PayloadAction<TodoState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
    wipeData: (state) => {
      state.collections = [];
      state.subcollections = [];
      state.tasks = [];
      state.subtasks = [];
      state.activeCollectionId = null;
      state.activeSubcollectionId = null;
      state.activeTaskId = null;
      state.isDetailsPaneExpanded = false;
      localStorage.removeItem('todio_active_collection_id');
      localStorage.removeItem('todio_active_subcollection_id');
      localStorage.removeItem('todio_active_task_id');
      localStorage.removeItem('todio_active_filter');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTodoData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTodoData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collections = action.payload.collections;
        state.subcollections = action.payload.subcollections;
        state.tasks = action.payload.tasks;
        state.subtasks = action.payload.subtasks;
      })
      .addCase(fetchAllTodoData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch data';
      })
      // Collections
      .addCase(createCollectionAsync.fulfilled, (state, action) => {
        state.collections.push(action.payload);
      })
      .addCase(updateCollectionAsync.fulfilled, (state, action) => {
        const index = state.collections.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.collections[index] = action.payload;
        }
      })
      .addCase(deleteCollectionAsync.fulfilled, (state, action) => {
        const { collectionId, timestamp, subcollectionIds, taskIds } = action.payload;
        state.collections = state.collections.map(c => 
          c.id === collectionId ? { ...c, deleted: true, deletedAt: timestamp } : c
        );
        state.subcollections = state.subcollections.map(s => 
          subcollectionIds.includes(s.id) ? { ...s, deleted: true, deletedAt: timestamp } : s
        );
        state.tasks = state.tasks.map(t => 
          taskIds.includes(t.id) ? { ...t, deleted: true, deletedAt: timestamp } : t
        );
        if (state.activeCollectionId === collectionId) {
          state.activeCollectionId = null;
          state.activeSubcollectionId = null;
          state.activeTaskId = null;
          localStorage.removeItem('todio_active_collection_id');
          localStorage.removeItem('todio_active_subcollection_id');
          localStorage.removeItem('todio_active_task_id');
        }
      })
      // Subcollections
      .addCase(createSubcollectionAsync.fulfilled, (state, action) => {
        state.subcollections.push(action.payload);
      })
      .addCase(updateSubcollectionAsync.fulfilled, (state, action) => {
        const index = state.subcollections.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.subcollections[index] = action.payload;
        }
      })
      .addCase(deleteSubcollectionAsync.fulfilled, (state, action) => {
        const { subcollectionId, timestamp, taskIds } = action.payload;
        state.subcollections = state.subcollections.map(s => 
          s.id === subcollectionId ? { ...s, deleted: true, deletedAt: timestamp } : s
        );
        state.tasks = state.tasks.map(t => 
          taskIds.includes(t.id) ? { ...t, deleted: true, deletedAt: timestamp } : t
        );
        if (state.activeSubcollectionId === subcollectionId) {
          state.activeSubcollectionId = null;
          state.activeTaskId = null;
          localStorage.removeItem('todio_active_subcollection_id');
          localStorage.removeItem('todio_active_task_id');
        }
      })
      // Tasks
      .addCase(updateTaskAsync.pending, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.meta.arg.id);
        if (index !== -1) {
          state.tasks[index] = action.meta.arg;
        }
      })
      .addCase(createTaskAsync.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        const { taskId, timestamp, subtaskIds } = action.payload;
        state.tasks = state.tasks.map(t => 
          t.id === taskId ? { ...t, deleted: true, deletedAt: timestamp } : t
        );
        state.subtasks = state.subtasks.map(s => 
          subtaskIds.includes(s.id) ? { ...s, deleted: true, deletedAt: timestamp } : s
        );
        if (state.activeTaskId === taskId) {
          state.activeTaskId = null;
          localStorage.removeItem('todio_active_task_id');
        }
      })
      // Subtasks
      .addCase(updateSubtaskAsync.pending, (state, action) => {
        const index = state.subtasks.findIndex(s => s.id === action.meta.arg.id);
        if (index !== -1) {
          state.subtasks[index] = action.meta.arg;
        }
      })
      .addCase(createSubtaskAsync.fulfilled, (state, action) => {
        state.subtasks.push(action.payload);
      })
      .addCase(createSubtasksBulkAsync.fulfilled, (state, action) => {
        state.subtasks.push(...action.payload);
      })
      .addCase(createTasksBulkAsync.fulfilled, (state, action) => {
        state.tasks.push(...action.payload.tasks);
        state.subtasks.push(...action.payload.subtasks);
      })
      .addCase(updateSubtaskAsync.fulfilled, (state, action) => {
        const index = state.subtasks.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.subtasks[index] = action.payload;
        }
      })
      .addCase(deleteSubtaskAsync.fulfilled, (state, action) => {
        const payload = action.payload;
        if (payload && typeof payload === 'object' && 'id' in payload) {
          const index = state.subtasks.findIndex(s => s.id === payload.id);
          if (index !== -1) {
            state.subtasks[index] = payload as Subtask;
          }
        }
      })
      // Restore Collection
      .addCase(restoreCollectionAsync.fulfilled, (state, action) => {
        const { collectionId, subcollectionIds, taskIds } = action.payload;
        state.collections = state.collections.map(c => 
          c.id === collectionId ? { ...c, deleted: false, deletedAt: undefined } : c
        );
        state.subcollections = state.subcollections.map(s => 
          subcollectionIds.includes(s.id) ? { ...s, deleted: false, deletedAt: undefined } : s
        );
        state.tasks = state.tasks.map(t => 
          taskIds.includes(t.id) ? { ...t, deleted: false, deletedAt: undefined } : t
        );
      })
      // Restore Subcollection
      .addCase(restoreSubcollectionAsync.fulfilled, (state, action) => {
        const { subcollectionId, taskIds } = action.payload;
        state.subcollections = state.subcollections.map(s => 
          s.id === subcollectionId ? { ...s, deleted: false, deletedAt: undefined } : s
        );
        state.tasks = state.tasks.map(t => 
          taskIds.includes(t.id) ? { ...t, deleted: false, deletedAt: undefined } : t
        );
      })
      // Restore Task
      .addCase(restoreTaskAsync.fulfilled, (state, action) => {
        const { taskId, subtaskIds } = action.payload;
        state.tasks = state.tasks.map(t => 
          t.id === taskId ? { ...t, deleted: false, deletedAt: undefined } : t
        );
        state.subtasks = state.subtasks.map(s => 
          subtaskIds.includes(s.id) ? { ...s, deleted: false, deletedAt: undefined } : s
        );
      })
      // Restore Subtask
      .addCase(restoreSubtaskAsync.fulfilled, (state, action) => {
        const payload = action.payload;
        if (payload && typeof payload === 'object' && 'id' in payload) {
          const index = state.subtasks.findIndex(s => s.id === payload.id);
          if (index !== -1) {
            state.subtasks[index] = payload as Subtask;
          }
        }
      })
      // Permanent Delete Collection
      .addCase(deleteCollectionPermanentAsync.fulfilled, (state, action) => {
        const { collectionId, subcollectionIds, taskIds } = action.payload;
        state.collections = state.collections.filter(c => c.id !== collectionId);
        state.subcollections = state.subcollections.filter(s => !subcollectionIds.includes(s.id));
        state.tasks = state.tasks.filter(t => !taskIds.includes(t.id));
      })
      // Permanent Delete Subcollection
      .addCase(deleteSubcollectionPermanentAsync.fulfilled, (state, action) => {
        const { subcollectionId, taskIds } = action.payload;
        state.subcollections = state.subcollections.filter(s => s.id !== subcollectionId);
        state.tasks = state.tasks.filter(t => !taskIds.includes(t.id));
      })
      // Permanent Delete Task
      .addCase(deleteTaskPermanentAsync.fulfilled, (state, action) => {
        const { taskId, subtaskIds } = action.payload;
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        state.subtasks = state.subtasks.filter(s => !subtaskIds.includes(s.id));
      })
      // Permanent Delete Subtask
      .addCase(deleteSubtaskPermanentAsync.fulfilled, (state, action) => {
        state.subtasks = state.subtasks.filter(s => s.id !== action.payload);
      })

      .addCase(updateTasksPositionsAsync.fulfilled, (state, action) => {
        action.payload.forEach(updatedTask => {
          const idx = state.tasks.findIndex(t => t.id === updatedTask.id);
          if (idx !== -1) {
            state.tasks[idx] = updatedTask;
          }
        });
      })
      .addCase(updateSubtasksPositionsAsync.fulfilled, (state, action) => {
        action.payload.forEach(updatedSubtask => {
          const idx = state.subtasks.findIndex(s => s.id === updatedSubtask.id);
          if (idx !== -1) {
            state.subtasks[idx] = updatedSubtask;
          }
        });
      });
  }
});

export const {
  setActiveCollectionId,
  setActiveSubcollectionId,
  setActiveTaskId,
  setIsDetailsPaneExpanded,
  setFilter,
  setSearchQuery,
  setSortBy,
  setSoundEnabled,
  wipeData,
} = todoSlice.actions;

export default todoSlice.reducer;

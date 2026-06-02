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
  filter: 'all' | 'active' | 'completed' | 'overdue';
  searchQuery: string;
  sortBy: 'dueDate' | 'priority' | 'title' | 'createdAt' | 'custom';
  soundEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  isDetailsPaneExpanded: boolean;
}

const initialState: TodoState = {
  collections: [],
  subcollections: [],
  tasks: [],
  subtasks: [],
  activeCollectionId: null,
  activeSubcollectionId: null,
  activeTaskId: null,
  filter: 'all',
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
  async (id: string) => {
    await firestoreService.deleteCollection(id);
    return id;
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
  async (id: string) => {
    await firestoreService.deleteSubcollection(id);
    return id;
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
  async (id: string) => {
    await firestoreService.deleteTask(id);
    return id;
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
  async (id: string) => {
    await firestoreService.deleteSubtask(id);
    return id;
  }
);

export const createSubtasksBulkAsync = createAsyncThunk(
  'todo/createSubtasksBulk',
  async (subtasks: Subtask[]) => {
    await Promise.all(subtasks.map(s => firestoreService.createSubtask(s)));
    return subtasks;
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
      if (!action.payload) {
        state.activeSubcollectionId = null;
      }
    },
    setActiveSubcollectionId: (state, action: PayloadAction<string | null>) => {
      state.activeSubcollectionId = action.payload;
    },
    setActiveTaskId: (state, action: PayloadAction<string | null>) => {
      state.activeTaskId = action.payload;
      if (!action.payload) {
        state.isDetailsPaneExpanded = false;
      }
    },
    setIsDetailsPaneExpanded: (state, action: PayloadAction<boolean>) => {
      state.isDetailsPaneExpanded = action.payload;
    },
    setFilter: (state, action: PayloadAction<TodoState['filter']>) => {
      state.filter = action.payload;
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
        state.collections = state.collections.filter(c => c.id !== action.payload);
        if (state.activeCollectionId === action.payload) {
          state.activeCollectionId = null;
          state.activeSubcollectionId = null;
          state.activeTaskId = null;
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
        state.subcollections = state.subcollections.filter(s => s.id !== action.payload);
        if (state.activeSubcollectionId === action.payload) {
          state.activeSubcollectionId = null;
          state.activeTaskId = null;
        }
      })
      // Tasks
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
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
        if (state.activeTaskId === action.payload) {
          state.activeTaskId = null;
        }
      })
      // Subtasks
      .addCase(createSubtaskAsync.fulfilled, (state, action) => {
        state.subtasks.push(action.payload);
      })
      .addCase(createSubtasksBulkAsync.fulfilled, (state, action) => {
        state.subtasks.push(...action.payload);
      })
      .addCase(updateSubtaskAsync.fulfilled, (state, action) => {
        const index = state.subtasks.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.subtasks[index] = action.payload;
        }
      })
      .addCase(deleteSubtaskAsync.fulfilled, (state, action) => {
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

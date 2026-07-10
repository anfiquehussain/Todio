import { configureStore } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import todoReducer from './slices/todoSlice';
import settingsReducer from './slices/settingsSlice';
import routineReducer from './slices/routineSlice';
import trackerReducer from './slices/trackerSlice';

const localStorageMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  if (action && typeof action === 'object' && 'type' in action && typeof action.type === 'string') {
    if (action.type.startsWith('todo/')) {
      const state = store.getState() as { todo: { collections: unknown[]; subcollections: unknown[]; tasks: unknown[]; subtasks: unknown[] } };
      const todoState = state.todo;
      try {
        localStorage.setItem('todio_collections', JSON.stringify(todoState.collections));
        localStorage.setItem('todio_subcollections', JSON.stringify(todoState.subcollections));
        localStorage.setItem('todio_tasks', JSON.stringify(todoState.tasks));
        localStorage.setItem('todio_subtasks', JSON.stringify(todoState.subtasks));
      } catch (e) {
        console.error('Failed to sync todo state to localStorage:', e);
      }
    } else if (action.type.startsWith('routine/')) {
      const state = store.getState() as { routine: { routines: unknown[]; routineLogs: unknown[] } };
      const routineState = state.routine;
      try {
        localStorage.setItem('todio_routines', JSON.stringify(routineState.routines));
        localStorage.setItem('todio_routine_logs', JSON.stringify(routineState.routineLogs));
      } catch (e) {
        console.error('Failed to sync routine state to localStorage:', e);
      }
    } else if (action.type.startsWith('tracker/')) {
      const state = store.getState() as { tracker: { trackers: unknown[]; entries: unknown[] } };
      const trackerState = state.tracker;
      try {
        localStorage.setItem('todio_trackers', JSON.stringify(trackerState.trackers));
        localStorage.setItem('todio_tracker_entries', JSON.stringify(trackerState.entries));
      } catch (e) {
        console.error('Failed to sync tracker state to localStorage:', e);
      }
    }
  }
  
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    todo: todoReducer,
    settings: settingsReducer,
    routine: routineReducer,
    tracker: trackerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disabled for fast LocalStorage mocks
    }).concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


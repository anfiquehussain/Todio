import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import todoReducer from './slices/todoSlice';
import settingsReducer from './slices/settingsSlice';

const localStorageMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);
  
  if (action.type && action.type.startsWith('todo/')) {
    const todoState = store.getState().todo;
    try {
      localStorage.setItem('todio_collections', JSON.stringify(todoState.collections));
      localStorage.setItem('todio_subcollections', JSON.stringify(todoState.subcollections));
      localStorage.setItem('todio_tasks', JSON.stringify(todoState.tasks));
      localStorage.setItem('todio_subtasks', JSON.stringify(todoState.subtasks));
    } catch (e) {
      console.error('Failed to sync todo state to localStorage:', e);
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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disabled for fast LocalStorage mocks
    }).concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

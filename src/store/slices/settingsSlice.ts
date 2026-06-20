import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SettingsState, SettingsFontFamily, SettingsFontSize } from '../../types';

const initialState: SettingsState = {
  fontFamily: (localStorage.getItem('todo_font_family') as SettingsFontFamily) || 'default',
  fontSize: (localStorage.getItem('todo_font_size') as SettingsFontSize) || 'md',
  subtaskFilter: (localStorage.getItem('todo_subtask_filter') as SettingsState['subtaskFilter']) || 'all',
  showListBadges: localStorage.getItem('todo_show_list_badges') === 'true',
  showGlowBackdrops: localStorage.getItem('todo_show_glow_backdrops') !== 'false',
  defaultTaskPriority: (localStorage.getItem('todo_default_task_priority') as SettingsState['defaultTaskPriority']) || 'low',
  autoArchiveCompleted: localStorage.getItem('todo_auto_archive_completed') === 'true',
  routineNotesPrompt: localStorage.getItem('todo_routine_notes_prompt') === 'true',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setFontFamily: (state, action: PayloadAction<SettingsFontFamily>) => {
      state.fontFamily = action.payload;
      localStorage.setItem('todo_font_family', action.payload);
    },
    setFontSize: (state, action: PayloadAction<SettingsFontSize>) => {
      state.fontSize = action.payload;
      localStorage.setItem('todo_font_size', action.payload);
    },
    setSubtaskFilter: (state, action: PayloadAction<'all' | 'priority'>) => {
      state.subtaskFilter = action.payload;
      localStorage.setItem('todo_subtask_filter', action.payload);
    },
    setShowListBadges: (state, action: PayloadAction<boolean>) => {
      state.showListBadges = action.payload;
      localStorage.setItem('todo_show_list_badges', String(action.payload));
    },
    setShowGlowBackdrops: (state, action: PayloadAction<boolean>) => {
      state.showGlowBackdrops = action.payload;
      localStorage.setItem('todo_show_glow_backdrops', String(action.payload));
    },
    setDefaultTaskPriority: (state, action: PayloadAction<SettingsState['defaultTaskPriority']>) => {
      state.defaultTaskPriority = action.payload;
      localStorage.setItem('todo_default_task_priority', action.payload);
    },
    setAutoArchiveCompleted: (state, action: PayloadAction<boolean>) => {
      state.autoArchiveCompleted = action.payload;
      localStorage.setItem('todo_auto_archive_completed', String(action.payload));
    },
    setRoutineNotesPrompt: (state, action: PayloadAction<boolean>) => {
      state.routineNotesPrompt = action.payload;
      localStorage.setItem('todo_routine_notes_prompt', String(action.payload));
    },
  },
});

export const { 
  setFontFamily, 
  setFontSize, 
  setSubtaskFilter, 
  setShowListBadges,
  setShowGlowBackdrops,
  setDefaultTaskPriority,
  setAutoArchiveCompleted,
  setRoutineNotesPrompt
} = settingsSlice.actions;
export default settingsSlice.reducer;


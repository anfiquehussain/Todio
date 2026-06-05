import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SettingsState, SettingsFontFamily, SettingsFontSize } from '../../types';

const initialState: SettingsState = {
  fontFamily: (localStorage.getItem('todo_font_family') as SettingsFontFamily) || 'default',
  fontSize: (localStorage.getItem('todo_font_size') as SettingsFontSize) || 'md',
  showSubtasksInline: (localStorage.getItem('todo_show_subtasks_inline') as SettingsState['showSubtasksInline']) || 'none',
  showListBadges: localStorage.getItem('todo_show_list_badges') === 'true',
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
    setShowSubtasksInline: (state, action: PayloadAction<'none' | 'all' | 'imported-priority'>) => {
      state.showSubtasksInline = action.payload;
      localStorage.setItem('todo_show_subtasks_inline', action.payload);
    },
    setShowListBadges: (state, action: PayloadAction<boolean>) => {
      state.showListBadges = action.payload;
      localStorage.setItem('todo_show_list_badges', String(action.payload));
    },
  },
});

export const { setFontFamily, setFontSize, setShowSubtasksInline, setShowListBadges } = settingsSlice.actions;
export default settingsSlice.reducer;

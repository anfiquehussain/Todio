import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SettingsState, SettingsFontFamily, SettingsFontSize } from '../../types';

const initialState: SettingsState = {
  fontFamily: (localStorage.getItem('todo_font_family') as SettingsFontFamily) || 'default',
  fontSize: (localStorage.getItem('todo_font_size') as SettingsFontSize) || 'md',
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
  },
});

export const { setFontFamily, setFontSize } = settingsSlice.actions;
export default settingsSlice.reducer;

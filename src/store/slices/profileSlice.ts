import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ProfileState {
  streak: number;
  xp: number;
  lastActiveDate: string | null;
}

const initialState: ProfileState = {
  streak: Number(localStorage.getItem('todo_streak')) || 0,
  xp: Number(localStorage.getItem('todo_xp')) || 100, // Base level initialization
  lastActiveDate: localStorage.getItem('todo_last_active') || null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    incrementXP: (state, action: PayloadAction<number>) => {
      state.xp = Math.min(1000, Math.max(0, state.xp + action.payload));
      localStorage.setItem('todo_xp', String(state.xp));
    },
    decrementXP: (state, action: PayloadAction<number>) => {
      state.xp = Math.min(1000, Math.max(0, state.xp - action.payload));
      localStorage.setItem('todo_xp', String(state.xp));
    },
    updateStreak: (state) => {
      const todayStr = new Date().toDateString();
      if (!state.lastActiveDate) {
        state.streak = 1;
        state.lastActiveDate = todayStr;
      } else {
        const lastDate = new Date(state.lastActiveDate);
        const today = new Date(todayStr);
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          state.streak += 1;
          state.lastActiveDate = todayStr;
        } else if (diffDays > 1) {
          state.streak = 1;
          state.lastActiveDate = todayStr;
        }
      }
      localStorage.setItem('todo_streak', String(state.streak));
      localStorage.setItem('todo_last_active', state.lastActiveDate || '');
    },
    resetProfile: (state) => {
      state.streak = 0;
      state.xp = 100;
      state.lastActiveDate = null;
      localStorage.setItem('todo_streak', '0');
      localStorage.setItem('todo_xp', '100');
      localStorage.removeItem('todo_last_active');
    },
    setProfileData: (state, action: PayloadAction<{ xp: number; streak: number; lastActiveDate: string | null }>) => {
      state.xp = action.payload.xp;
      state.streak = action.payload.streak;
      state.lastActiveDate = action.payload.lastActiveDate;
      localStorage.setItem('todo_xp', String(state.xp));
      localStorage.setItem('todo_streak', String(state.streak));
      if (state.lastActiveDate) {
        localStorage.setItem('todo_last_active', state.lastActiveDate);
      } else {
        localStorage.removeItem('todo_last_active');
      }
    }
  },
});

export const { incrementXP, decrementXP, updateStreak, resetProfile, setProfileData } = profileSlice.actions;
export default profileSlice.reducer;

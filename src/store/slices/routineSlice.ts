import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Routine, RoutineLog } from '../../types';
import { routineService } from '../../api/routines/routineService';

export interface RoutineState {
  routines: Routine[];
  routineLogs: RoutineLog[];
  activeRoutineId: string | null;
  filter: 'all' | 'due' | 'archived' | 'trash';
  isLoading: boolean;
  error: string | null;
}

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const initialState: RoutineState = {
  routines: loadFromLocalStorage('todio_routines', []),
  routineLogs: loadFromLocalStorage('todio_routine_logs', []),
  activeRoutineId: localStorage.getItem('todio_active_routine_id') || null,
  filter: (localStorage.getItem('todio_routine_filter') as RoutineState['filter']) || 'due',
  isLoading: false,
  error: null,
};

// Date Helpers
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isDueOnDate = (routine: Routine, dateStr: string): boolean => {
  if (dateStr < routine.startDate) return false;
  if (routine.endDate && dateStr > routine.endDate) return false;

  const date = parseLocalDate(dateStr);

  switch (routine.recurrenceType) {
    case 'daily':
      return true;
    case 'weekly':
      return routine.recurrenceDays.includes(date.getDay());
    case 'monthly':
      return routine.recurrenceDays.includes(date.getDate());
    case 'custom': {
      if (!routine.customIntervalDays) return true;
      const start = parseLocalDate(routine.startDate);
      const diffTime = Math.abs(date.getTime() - start.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays % routine.customIntervalDays === 0;
    }
    default:
      return false;
  }
};

const getDueDates = (routine: Routine, endDateStr: string): string[] => {
  const dueDates: string[] = [];
  const start = parseLocalDate(routine.startDate);
  const end = parseLocalDate(endDateStr);

  if (start > end) return [];

  const current = new Date(start);
  while (current <= end) {
    const dateStr = formatDate(current);
    if (isDueOnDate(routine, dateStr)) {
      dueDates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }
  return dueDates;
};

// Streak & Rate calculation helper
export const calculateStreakAndRate = (
  routine: Routine,
  logs: RoutineLog[]
): { currentStreak: number; bestStreak: number; completionRate: number } => {
  const todayStr = formatDate(new Date());
  
  // Filter logs for this routine
  const routineLogs = logs.filter(log => log.routineId === routine.id);
  const completedDates = new Set(routineLogs.map(log => log.scheduledDate));
  
  // Get all due dates from startDate to today
  const dueDates = getDueDates(routine, todayStr);
  
  let currentStreak = 0;
  let runningStreak = 0;
  let bestStreak = routine.bestStreak || 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = formatDate(thirtyDaysAgo);
  
  let dueInLast30 = 0;
  let completedInLast30 = 0;
  
  // Sort due dates ascending to compute best streak
  dueDates.forEach(dateStr => {
    const isCompleted = completedDates.has(dateStr);
    
    if (isCompleted) {
      runningStreak += 1;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else {
      if (dateStr !== todayStr) {
        runningStreak = 0;
      }
    }
    
    if (dateStr >= thirtyDaysAgoStr) {
      dueInLast30 += 1;
      if (isCompleted) {
        completedInLast30 += 1;
      }
    }
  });
  
  // Calculate current streak descending (newest to oldest)
  const dueDatesDesc = [...dueDates].reverse();
  
  for (const dateStr of dueDatesDesc) {
    const isCompleted = completedDates.has(dateStr);
    
    if (isCompleted) {
      currentStreak += 1;
    } else {
      if (dateStr === todayStr) {
        continue;
      }
      break;
    }
  }
  
  const completionRate = dueInLast30 > 0 ? Math.round((completedInLast30 / dueInLast30) * 100) : 0;
  
  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    completionRate
  };
};

// Async Thunks
export const fetchAllRoutineData = createAsyncThunk(
  'routine/fetchAll',
  async (userId: string) => {
    const [routines, routineLogs] = await Promise.all([
      routineService.getRoutines(userId),
      routineService.getRoutineLogs(userId)
    ]);
    return { routines, routineLogs };
  }
);

export const createRoutineAsync = createAsyncThunk(
  'routine/create',
  async (routine: Routine) => {
    await routineService.createRoutine(routine);
    return routine;
  }
);

export const updateRoutineAsync = createAsyncThunk(
  'routine/update',
  async (routine: Routine) => {
    await routineService.updateRoutine(routine);
    return routine;
  }
);

export const deleteRoutineAsync = createAsyncThunk(
  'routine/delete',
  async (id: string, { getState }) => {
    const state = getState() as { routine: RoutineState };
    const routine = state.routine.routines.find(r => r.id === id);
    const timestamp = new Date().toISOString();
    if (routine) {
      const updated = { ...routine, deleted: true, deletedAt: timestamp };
      await routineService.updateRoutine(updated);
      return { id, timestamp };
    }
    return { id, timestamp };
  }
);

export const restoreRoutineAsync = createAsyncThunk(
  'routine/restore',
  async (id: string, { getState }) => {
    const state = getState() as { routine: RoutineState };
    const routine = state.routine.routines.find(r => r.id === id);
    if (routine) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deletedAt, ...rest } = routine;
      const restored = { ...rest, deleted: false };
      await routineService.updateRoutine(restored);
      return id;
    }
    return id;
  }
);

export const deleteRoutinePermanentAsync = createAsyncThunk(
  'routine/deletePermanent',
  async (id: string, { getState }) => {
    const state = getState() as { routine: RoutineState };
    await routineService.deleteRoutine(id);

    const relatedLogs = state.routine.routineLogs.filter(log => log.routineId === id);
    await Promise.all(relatedLogs.map(log => routineService.deleteRoutineLog(log.id)));

    return { id, logIds: relatedLogs.map(log => log.id) };
  }
);

export const createRoutineLogAsync = createAsyncThunk(
  'routine/createLog',
  async (log: RoutineLog, { getState, dispatch }) => {
    // 1. Create the log entry
    await routineService.createRoutineLog(log);

    // 2. Re-calculate and update routine streak/rate
    const state = getState() as { routine: RoutineState };
    const routine = state.routine.routines.find(r => r.id === log.routineId);
    if (routine) {
      const updatedLogs = [...state.routine.routineLogs, log];
      const stats = calculateStreakAndRate(routine, updatedLogs);
      const updatedRoutine = {
        ...routine,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
      };
      await routineService.updateRoutine(updatedRoutine);
      // We dispatch update locally so they stay in sync
      dispatch(updateRoutineLocally(updatedRoutine));
    }

    return log;
  }
);

export const deleteRoutineLogAsync = createAsyncThunk(
  'routine/deleteLog',
  async (logId: string, { getState, dispatch }) => {
    const state = getState() as { routine: RoutineState };
    const log = state.routine.routineLogs.find(l => l.id === logId);

    if (log) {
      await routineService.deleteRoutineLog(logId);

      // Re-calculate streak/rate after removing the log
      const routine = state.routine.routines.find(r => r.id === log.routineId);
      if (routine) {
        const updatedLogs = state.routine.routineLogs.filter(l => l.id !== logId);
        const stats = calculateStreakAndRate(routine, updatedLogs);
        const updatedRoutine = {
          ...routine,
          currentStreak: stats.currentStreak,
          bestStreak: stats.bestStreak,
        };
        await routineService.updateRoutine(updatedRoutine);
        dispatch(updateRoutineLocally(updatedRoutine));
      }
    }

    return logId;
  }
);

const routineSlice = createSlice({
  name: 'routine',
  initialState,
  reducers: {
    setActiveRoutineId: (state, action: PayloadAction<string | null>) => {
      state.activeRoutineId = action.payload;
      if (action.payload) {
        localStorage.setItem('todio_active_routine_id', action.payload);
      } else {
        localStorage.removeItem('todio_active_routine_id');
      }
    },
    setFilter: (state, action: PayloadAction<RoutineState['filter']>) => {
      state.filter = action.payload;
      localStorage.setItem('todio_routine_filter', action.payload);
    },
    wipeData: (state) => {
      state.routines = [];
      state.routineLogs = [];
      state.activeRoutineId = null;
      state.filter = 'due';
      localStorage.removeItem('todio_routines');
      localStorage.removeItem('todio_routine_logs');
      localStorage.removeItem('todio_active_routine_id');
      localStorage.removeItem('todio_routine_filter');
    },
    updateRoutineLocally: (state, action: PayloadAction<Routine>) => {
      const idx = state.routines.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) {
        state.routines[idx] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch data
      .addCase(fetchAllRoutineData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllRoutineData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.routines = action.payload.routines;
        state.routineLogs = action.payload.routineLogs;
      })
      .addCase(fetchAllRoutineData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch routines';
      })
      // Create routine
      .addCase(createRoutineAsync.fulfilled, (state, action) => {
        state.routines.push(action.payload);
      })
      // Update routine
      .addCase(updateRoutineAsync.fulfilled, (state, action) => {
        const idx = state.routines.findIndex(r => r.id === action.payload.id);
        if (idx !== -1) {
          state.routines[idx] = action.payload;
        }
      })
      // Delete routine (soft)
      .addCase(deleteRoutineAsync.fulfilled, (state, action) => {
        const { id, timestamp } = action.payload;
        const idx = state.routines.findIndex(r => r.id === id);
        if (idx !== -1) {
          state.routines[idx].deleted = true;
          state.routines[idx].deletedAt = timestamp;
        }
        if (state.activeRoutineId === id) {
          state.activeRoutineId = null;
          localStorage.removeItem('todio_active_routine_id');
        }
      })
      // Restore routine
      .addCase(restoreRoutineAsync.fulfilled, (state, action) => {
        const id = action.payload;
        const idx = state.routines.findIndex(r => r.id === id);
        if (idx !== -1) {
          state.routines[idx].deleted = false;
          delete state.routines[idx].deletedAt;
        }
      })
      // Delete routine permanent
      .addCase(deleteRoutinePermanentAsync.fulfilled, (state, action) => {
        const { id, logIds } = action.payload;
        state.routines = state.routines.filter(r => r.id !== id);
        state.routineLogs = state.routineLogs.filter(log => !logIds.includes(log.id));
        if (state.activeRoutineId === id) {
          state.activeRoutineId = null;
          localStorage.removeItem('todio_active_routine_id');
        }
      })
      // Create log
      .addCase(createRoutineLogAsync.fulfilled, (state, action) => {
        state.routineLogs.push(action.payload);
      })
      // Delete log
      .addCase(deleteRoutineLogAsync.fulfilled, (state, action) => {
        state.routineLogs = state.routineLogs.filter(l => l.id !== action.payload);
      });
  }
});

export const {
  setActiveRoutineId,
  setFilter,
  wipeData,
  updateRoutineLocally
} = routineSlice.actions;

export default routineSlice.reducer;

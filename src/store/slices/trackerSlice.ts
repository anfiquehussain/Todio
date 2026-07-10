import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Tracker, TrackerEntry } from '../../types';
import { trackerService } from '../../api/trackers/trackerService';

export interface TrackerState {
  trackers: Tracker[];
  entries: TrackerEntry[];
  activeTrackerId: string | null;
  filter: 'all' | 'active' | 'archived' | 'trash';
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

const initialState: TrackerState = {
  trackers: loadFromLocalStorage('todio_trackers', []),
  entries: loadFromLocalStorage('todio_tracker_entries', []),
  activeTrackerId: localStorage.getItem('todio_active_tracker_id') || null,
  filter: (localStorage.getItem('todio_tracker_filter') as TrackerState['filter']) || 'all',
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchAllTrackerData = createAsyncThunk(
  'tracker/fetchAll',
  async (userId: string) => {
    const [trackers, entries] = await Promise.all([
      trackerService.getTrackers(userId),
      trackerService.getEntries(userId)
    ]);
    return { trackers, entries };
  }
);

export const createTrackerAsync = createAsyncThunk(
  'tracker/create',
  async (tracker: Tracker) => {
    await trackerService.createTracker(tracker);
    return tracker;
  }
);

export const updateTrackerAsync = createAsyncThunk(
  'tracker/update',
  async (tracker: Tracker) => {
    await trackerService.updateTracker(tracker);
    return tracker;
  }
);

export const deleteTrackerAsync = createAsyncThunk(
  'tracker/delete',
  async (id: string, { getState }) => {
    const state = getState() as { tracker: TrackerState };
    const tracker = state.tracker.trackers.find(t => t.id === id);
    const timestamp = new Date().toISOString();
    if (tracker) {
      const updated = { ...tracker, deleted: true, deletedAt: timestamp };
      await trackerService.updateTracker(updated);
      return { id, timestamp };
    }
    return { id, timestamp };
  }
);

export const restoreTrackerAsync = createAsyncThunk(
  'tracker/restore',
  async (id: string, { getState }) => {
    const state = getState() as { tracker: TrackerState };
    const tracker = state.tracker.trackers.find(t => t.id === id);
    if (tracker) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deletedAt, ...rest } = tracker;
      const restored = { ...rest, deleted: false };
      await trackerService.updateTracker(restored);
      return id;
    }
    return id;
  }
);

export const deleteTrackerPermanentAsync = createAsyncThunk(
  'tracker/deletePermanent',
  async (id: string, { getState }) => {
    const state = getState() as { tracker: TrackerState };
    await trackerService.deleteTracker(id);

    const relatedEntries = state.tracker.entries.filter(e => e.trackerId === id);
    await Promise.all(relatedEntries.map(e => trackerService.deleteEntry(e.id)));

    return { id, entryIds: relatedEntries.map(e => e.id) };
  }
);

export const createEntryAsync = createAsyncThunk(
  'tracker/createEntry',
  async (entry: TrackerEntry) => {
    await trackerService.createEntry(entry);
    return entry;
  }
);

export const updateEntryAsync = createAsyncThunk(
  'tracker/updateEntry',
  async (entry: TrackerEntry) => {
    await trackerService.updateEntry(entry);
    return entry;
  }
);

export const deleteEntryAsync = createAsyncThunk(
  'tracker/deleteEntry',
  async (entryId: string) => {
    await trackerService.deleteEntry(entryId);
    return entryId;
  }
);

const trackerSlice = createSlice({
  name: 'tracker',
  initialState,
  reducers: {
    setActiveTrackerId: (state, action: PayloadAction<string | null>) => {
      state.activeTrackerId = action.payload;
      if (action.payload) {
        localStorage.setItem('todio_active_tracker_id', action.payload);
      } else {
        localStorage.removeItem('todio_active_tracker_id');
      }
    },
    setTrackerFilter: (state, action: PayloadAction<TrackerState['filter']>) => {
      state.filter = action.payload;
      localStorage.setItem('todio_tracker_filter', action.payload);
    },
    wipeTrackerData: (state) => {
      state.trackers = [];
      state.entries = [];
      state.activeTrackerId = null;
      state.filter = 'all';
      localStorage.removeItem('todio_trackers');
      localStorage.removeItem('todio_tracker_entries');
      localStorage.removeItem('todio_active_tracker_id');
      localStorage.removeItem('todio_tracker_filter');
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch data
      .addCase(fetchAllTrackerData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTrackerData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trackers = action.payload.trackers;
        state.entries = action.payload.entries;
      })
      .addCase(fetchAllTrackerData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch trackers';
      })
      // Create tracker
      .addCase(createTrackerAsync.fulfilled, (state, action) => {
        state.trackers.push(action.payload);
      })
      // Update tracker
      .addCase(updateTrackerAsync.fulfilled, (state, action) => {
        const idx = state.trackers.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) {
          state.trackers[idx] = action.payload;
        }
      })
      // Delete tracker (soft)
      .addCase(deleteTrackerAsync.fulfilled, (state, action) => {
        const { id, timestamp } = action.payload;
        const idx = state.trackers.findIndex(t => t.id === id);
        if (idx !== -1) {
          state.trackers[idx].deleted = true;
          state.trackers[idx].deletedAt = timestamp;
        }
        if (state.activeTrackerId === id) {
          state.activeTrackerId = null;
          localStorage.removeItem('todio_active_tracker_id');
        }
      })
      // Restore tracker
      .addCase(restoreTrackerAsync.fulfilled, (state, action) => {
        const id = action.payload;
        const idx = state.trackers.findIndex(t => t.id === id);
        if (idx !== -1) {
          state.trackers[idx].deleted = false;
          delete state.trackers[idx].deletedAt;
        }
      })
      // Delete tracker permanent
      .addCase(deleteTrackerPermanentAsync.fulfilled, (state, action) => {
        const { id, entryIds } = action.payload;
        state.trackers = state.trackers.filter(t => t.id !== id);
        state.entries = state.entries.filter(e => !entryIds.includes(e.id));
        if (state.activeTrackerId === id) {
          state.activeTrackerId = null;
          localStorage.removeItem('todio_active_tracker_id');
        }
      })
      // Create entry
      .addCase(createEntryAsync.pending, (state, action) => {
        const entry = action.meta.arg;
        if (!state.entries.some(e => e.id === entry.id)) {
          state.entries.push(entry);
        }
      })
      .addCase(createEntryAsync.fulfilled, (state, action) => {
        const idx = state.entries.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) {
          state.entries[idx] = action.payload;
        }
      })
      .addCase(createEntryAsync.rejected, (state, action) => {
        const entry = action.meta.arg;
        state.entries = state.entries.filter(e => e.id !== entry.id);
      })
      // Update entry
      .addCase(updateEntryAsync.fulfilled, (state, action) => {
        const idx = state.entries.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) {
          state.entries[idx] = action.payload;
        }
      })
      // Delete entry
      .addCase(deleteEntryAsync.pending, (state, action) => {
        const entryId = action.meta.arg;
        state.entries = state.entries.filter(e => e.id !== entryId);
      })
      .addCase(deleteEntryAsync.fulfilled, (state, action) => {
        state.entries = state.entries.filter(e => e.id !== action.payload);
      });
  }
});

export const {
  setActiveTrackerId,
  setTrackerFilter,
  wipeTrackerData,
} = trackerSlice.actions;

export default trackerSlice.reducer;

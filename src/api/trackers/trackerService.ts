import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { db, isMock } from '../../lib/firebase';
import type { Tracker, TrackerEntry } from '../../types';

// Helper for Mock mode (LocalStorage storage engine)
const mockDb = {
  get: <T>(key: string): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  set: <T>(key: string, data: T[]): void => {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const trackerService = {
  // Trackers
  async getTrackers(userId: string): Promise<Tracker[]> {
    if (isMock) {
      const all = mockDb.get<Tracker>('mock_db_trackers');
      return all.filter(item => item.userId === userId);
    }
    const q = query(collection(db as Firestore, 'trackers'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Tracker);
  },

  async createTracker(data: Tracker): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Tracker>('mock_db_trackers');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
      } else {
        all.push(data);
      }
      mockDb.set('mock_db_trackers', all);
      return;
    }
    await setDoc(doc(db as Firestore, 'trackers', data.id), data);
  },

  async updateTracker(data: Tracker): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Tracker>('mock_db_trackers');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
        mockDb.set('mock_db_trackers', all);
      }
      return;
    }
    await setDoc(doc(db as Firestore, 'trackers', data.id), data);
  },

  async deleteTracker(id: string): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Tracker>('mock_db_trackers');
      mockDb.set('mock_db_trackers', all.filter(item => item.id !== id));
      return;
    }
    await deleteDoc(doc(db as Firestore, 'trackers', id));
  },

  // Tracker Entries
  async getEntries(userId: string): Promise<TrackerEntry[]> {
    if (isMock) {
      const all = mockDb.get<TrackerEntry>('mock_db_tracker_entries');
      return all.filter(item => item.userId === userId);
    }
    const q = query(collection(db as Firestore, 'trackerEntries'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as TrackerEntry);
  },

  async createEntry(data: TrackerEntry): Promise<void> {
    if (isMock) {
      const all = mockDb.get<TrackerEntry>('mock_db_tracker_entries');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
      } else {
        all.push(data);
      }
      mockDb.set('mock_db_tracker_entries', all);
      return;
    }
    await setDoc(doc(db as Firestore, 'trackerEntries', data.id), data);
  },

  async updateEntry(data: TrackerEntry): Promise<void> {
    if (isMock) {
      const all = mockDb.get<TrackerEntry>('mock_db_tracker_entries');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
        mockDb.set('mock_db_tracker_entries', all);
      }
      return;
    }
    await setDoc(doc(db as Firestore, 'trackerEntries', data.id), data);
  },

  async deleteEntry(id: string): Promise<void> {
    if (isMock) {
      const all = mockDb.get<TrackerEntry>('mock_db_tracker_entries');
      mockDb.set('mock_db_tracker_entries', all.filter(item => item.id !== id));
      return;
    }
    await deleteDoc(doc(db as Firestore, 'trackerEntries', id));
  }
};

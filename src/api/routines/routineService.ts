import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { db, isMock } from '../../lib/firebase';
import type { Routine, RoutineLog } from '../../types';

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

export const routineService = {
  // Routines
  async getRoutines(userId: string): Promise<Routine[]> {
    if (isMock) {
      const all = mockDb.get<Routine>('mock_db_routines');
      return all.filter(item => item.userId === userId);
    }
    const q = query(collection(db as Firestore, 'routines'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Routine);
  },

  async createRoutine(data: Routine): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Routine>('mock_db_routines');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
      } else {
        all.push(data);
      }
      mockDb.set('mock_db_routines', all);
      return;
    }
    await setDoc(doc(db as Firestore, 'routines', data.id), data);
  },

  async updateRoutine(data: Routine): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Routine>('mock_db_routines');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
        mockDb.set('mock_db_routines', all);
      }
      return;
    }
    await setDoc(doc(db as Firestore, 'routines', data.id), data);
  },

  async deleteRoutine(id: string): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Routine>('mock_db_routines');
      mockDb.set('mock_db_routines', all.filter(item => item.id !== id));
      return;
    }
    await deleteDoc(doc(db as Firestore, 'routines', id));
  },

  // Routine Logs
  async getRoutineLogs(userId: string): Promise<RoutineLog[]> {
    if (isMock) {
      const all = mockDb.get<RoutineLog>('mock_db_routine_logs');
      return all.filter(item => item.userId === userId);
    }
    const q = query(collection(db as Firestore, 'routineLogs'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as RoutineLog);
  },

  async createRoutineLog(data: RoutineLog): Promise<void> {
    if (isMock) {
      const all = mockDb.get<RoutineLog>('mock_db_routine_logs');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
      } else {
        all.push(data);
      }
      mockDb.set('mock_db_routine_logs', all);
      return;
    }
    await setDoc(doc(db as Firestore, 'routineLogs', data.id), data);
  },

  async deleteRoutineLog(id: string): Promise<void> {
    if (isMock) {
      const all = mockDb.get<RoutineLog>('mock_db_routine_logs');
      mockDb.set('mock_db_routine_logs', all.filter(item => item.id !== id));
      return;
    }
    await deleteDoc(doc(db as Firestore, 'routineLogs', id));
  }
};

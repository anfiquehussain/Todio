import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db, isMock } from '../../lib/firebase';
import type { Collection, Subcollection, Task, Subtask } from '../../types';

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

export const firestoreService = {
  // Collections
  async getCollections(userId: string): Promise<Collection[]> {
    if (isMock) {
      const all = mockDb.get<Collection>('mock_db_collections');
      return all.filter(item => item.userId === userId);
    }
    const q = query(collection(db, 'collections'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Collection);
  },
  async createCollection(data: Collection): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Collection>('mock_db_collections');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
      } else {
        all.push(data);
      }
      mockDb.set('mock_db_collections', all);
      return;
    }
    await setDoc(doc(db, 'collections', data.id), data);
  },
  async deleteCollection(id: string): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Collection>('mock_db_collections');
      mockDb.set('mock_db_collections', all.filter(item => item.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'collections', id));
  },

  // Subcollections
  async getSubcollections(userId: string): Promise<Subcollection[]> {
    if (isMock) {
      const all = mockDb.get<Subcollection>('mock_db_subcollections');
      return all.filter(item => item.userId === userId);
    }
    const q = query(collection(db, 'subcollections'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Subcollection);
  },
  async createSubcollection(data: Subcollection): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Subcollection>('mock_db_subcollections');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
      } else {
        all.push(data);
      }
      mockDb.set('mock_db_subcollections', all);
      return;
    }
    await setDoc(doc(db, 'subcollections', data.id), data);
  },
  async deleteSubcollection(id: string): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Subcollection>('mock_db_subcollections');
      mockDb.set('mock_db_subcollections', all.filter(item => item.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'subcollections', id));
  },

  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    if (isMock) {
      const all = mockDb.get<Task>('mock_db_tasks');
      return all.filter(item => item.userId === userId);
    }
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Task);
  },
  async createTask(data: Task): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Task>('mock_db_tasks');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
      } else {
        all.push(data);
      }
      mockDb.set('mock_db_tasks', all);
      return;
    }
    await setDoc(doc(db, 'tasks', data.id), data);
  },
  async updateTask(data: Task): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Task>('mock_db_tasks');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
        mockDb.set('mock_db_tasks', all);
      }
      return;
    }
    await setDoc(doc(db, 'tasks', data.id), data);
  },
  async deleteTask(id: string): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Task>('mock_db_tasks');
      mockDb.set('mock_db_tasks', all.filter(item => item.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'tasks', id));
  },

  // Subtasks
  async getSubtasks(userId: string): Promise<Subtask[]> {
    if (isMock) {
      const all = mockDb.get<Subtask>('mock_db_subtasks');
      return all.filter(item => item.userId === userId);
    }
    const q = query(collection(db, 'subtasks'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Subtask);
  },
  async createSubtask(data: Subtask): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Subtask>('mock_db_subtasks');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
      } else {
        all.push(data);
      }
      mockDb.set('mock_db_subtasks', all);
      return;
    }
    await setDoc(doc(db, 'subtasks', data.id), data);
  },
  async updateSubtask(data: Subtask): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Subtask>('mock_db_subtasks');
      const idx = all.findIndex(item => item.id === data.id);
      if (idx !== -1) {
        all[idx] = data;
        mockDb.set('mock_db_subtasks', all);
      }
      return;
    }
    await setDoc(doc(db, 'subtasks', data.id), data);
  },
  async deleteSubtask(id: string): Promise<void> {
    if (isMock) {
      const all = mockDb.get<Subtask>('mock_db_subtasks');
      mockDb.set('mock_db_subtasks', all.filter(item => item.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'subtasks', id));
  }
};

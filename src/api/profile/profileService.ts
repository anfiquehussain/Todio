import { db } from '../../lib/firebase';
import type { MockFirestore } from '../../lib/firebase';
import { sleep } from '../base';

export const profileService = {
  async fetchProfile(userId: string) {
    await sleep();
    if (!db) return null;
    const docRef = (db as unknown as MockFirestore).collection('profiles').doc(userId);
    const snap = await docRef.get();
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  },

  async syncProfile(userId: string, data: { xp: number; streak: number; lastActiveDate: string | null }) {
    await sleep();
    if (!db) return data;
    const docRef = (db as unknown as MockFirestore).collection('profiles').doc(userId);
    await docRef.set(data as unknown as Record<string, unknown>);
    return data;
  }
};

import { db } from '../../lib/firebase';
import { sleep } from '../base';

export const profileService = {
  async fetchProfile(userId: string) {
    await sleep();
    const docRef = db.collection('profiles').doc(userId);
    const snap = await docRef.get();
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  },

  async syncProfile(userId: string, data: { xp: number; streak: number; lastActiveDate: string | null }) {
    await sleep();
    const docRef = db.collection('profiles').doc(userId);
    await docRef.set(data);
    return data;
  }
};

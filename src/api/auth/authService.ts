import { auth } from '../../lib/firebase';
import { sleep } from '../base';
import type { UserProfile } from '../../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut
} from 'firebase/auth';

export const authService = {
  async loginWithEmail(email: string, password?: string): Promise<UserProfile> {
    await sleep();
    if (auth && 'mockSignIn' in auth) {
      const user = await auth.mockSignIn(email);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: user.metadata.creationTime,
      };
    }

    if (!password) {
      throw new Error('Password is required for email authentication.');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: user.metadata.creationTime || new Date().toISOString(),
    };
  },

  async signUpWithEmail(email: string, password?: string, displayName?: string): Promise<UserProfile> {
    await sleep();
    if (auth && 'mockSignIn' in auth) {
      const user = await auth.mockSignIn(email);
      if (displayName) {
        user.displayName = displayName;
      }
      return {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName,
        photoURL: user.photoURL,
        createdAt: user.metadata.creationTime,
      };
    }

    if (!password) {
      throw new Error('Password is required for creating an account.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Refresh user object to get the updated profile values
    const user = userCredential.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName,
      photoURL: user.photoURL,
      createdAt: user.metadata.creationTime || new Date().toISOString(),
    };
  },

  async loginWithGoogle(): Promise<UserProfile> {
    await sleep();
    if (auth && 'mockSignIn' in auth) {
      const user = await auth.mockSignIn('google-user@gmail.com');
      return {
        uid: "google-" + user.uid,
        email: "google-user@gmail.com",
        displayName: "Google Commander",
        photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=google",
        createdAt: user.metadata.creationTime,
      };
    }

    const provider = new GoogleAuthProvider();
    // Prompt Google accounts popup
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: user.metadata.creationTime || new Date().toISOString(),
    };
  },

  async logout(): Promise<void> {
    await sleep();
    if (auth && 'mockSignOut' in auth) {
      await auth.mockSignOut();
      return;
    }
    await signOut(auth);
  }
};

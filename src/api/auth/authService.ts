import { auth, isMock } from '../../lib/firebase';
import type { MockAuth } from '../../lib/firebase';
import type { Auth } from 'firebase/auth';
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
    if (!auth) {
      throw new Error('Authentication is not initialized.');
    }
    
    if (isMock) {
      const user = await (auth as unknown as MockAuth).mockSignIn(email);
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

    const userCredential = await signInWithEmailAndPassword(auth as Auth, email, password);
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
    if (!auth) {
      throw new Error('Authentication is not initialized.');
    }

    if (isMock) {
      const user = await (auth as unknown as MockAuth).mockSignIn(email);
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

    const userCredential = await createUserWithEmailAndPassword(auth as Auth, email, password);
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
    if (!auth) {
      throw new Error('Authentication is not initialized.');
    }

    if (isMock) {
      const user = await (auth as unknown as MockAuth).mockSignIn('google-user@gmail.com');
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
    
    const userCredential = await signInWithPopup(auth as Auth, provider);
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
    if (!auth) {
      return;
    }

    if (isMock) {
      await (auth as unknown as MockAuth).mockSignOut();
      return;
    }
    await signOut(auth as Auth);
  }
};

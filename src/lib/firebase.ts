import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged as fbOnAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  metadata: { creationTime: string };
}

export interface MockAuth {
  currentUser: MockUser | null;
  onAuthStateChanged: (callback: (user: MockUser | null) => void) => () => void;
  mockSignIn: (email: string) => Promise<MockUser>;
  mockSignOut: () => Promise<void>;
}

export interface MockFirestore {
  collection: (path: string) => {
    path: string;
    doc: (docId: string) => {
      id: string;
      set: (data: Record<string, unknown>) => Promise<void>;
      get: () => Promise<{
        exists: () => boolean;
        data: () => Record<string, unknown> | null;
      }>;
    };
  };
}

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id"
};

// Check if running in full mock environment or actual firebase env
export let isMock = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'mock-api-key';

let appInstance: FirebaseApp | { name: string } | null = null;
let authInstance: Auth | MockAuth | null = null;
let dbInstance: Firestore | MockFirestore | null = null;

if (!isMock) {
  try {
    const realApp = initializeApp(firebaseConfig);
    appInstance = realApp;
    authInstance = getAuth(realApp);
    
    // Create an adapter for the real Firestore so that it supports collection().doc().get() / .set()
    const realDb = getFirestore(realApp);
    
    // Add legacy compatibility helper for db.collection().doc().get() / .set()
    Object.defineProperty(realDb, 'collection', {
      value: (path: string) => {
        return {
          path,
          doc: (docId: string) => {
            return {
              id: docId,
              set: async (data: Record<string, unknown>) => {
                const docRef = doc(realDb, path, docId);
                await setDoc(docRef, data);
              },
              get: async () => {
                const docRef = doc(realDb, path, docId);
                const snap = await getDoc(docRef);
                return {
                  exists: () => snap.exists(),
                  data: () => snap.data() as Record<string, unknown> | null
                };
              }
            };
          }
        };
      },
      writable: true,
      configurable: true
    });
    dbInstance = realDb as unknown as Firestore;
  } catch (error) {
    console.warn("Firebase failed to initialize, switching to Local Mock adapter.", error);
    isMock = true;
    setupMock();
  }
} else {
  setupMock();
}

function setupMock() {
  appInstance = { name: "[MockApp]" };
  
  // High-fidelity Mock Auth Listener
  const authListeners = new Set<(user: MockUser | null) => void>();
  let currentUserProfile: MockUser | null = null;
  
  const cachedMockUser = localStorage.getItem('mock_todo_user');
  if (cachedMockUser) {
    try {
      currentUserProfile = JSON.parse(cachedMockUser);
    } catch {
      currentUserProfile = null;
    }
  }

  authInstance = {
    currentUser: currentUserProfile,
    onAuthStateChanged: (callback: (user: MockUser | null) => void) => {
      authListeners.add(callback);
      // Immediately notify the listener on start
      setTimeout(() => callback(currentUserProfile), 0);
      return () => {
        authListeners.delete(callback);
      };
    },
    mockSignIn: (email: string) => {
      const newUser: MockUser = {
        uid: "mock-user-uid-12345",
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
        metadata: { creationTime: new Date().toISOString() }
      };
      currentUserProfile = newUser;
      (authInstance as MockAuth).currentUser = currentUserProfile;
      localStorage.setItem('mock_todo_user', JSON.stringify(currentUserProfile));
      authListeners.forEach(listener => listener(currentUserProfile));
      return Promise.resolve(newUser);
    },
    mockSignOut: () => {
      currentUserProfile = null;
      (authInstance as MockAuth).currentUser = null;
      localStorage.removeItem('mock_todo_user');
      authListeners.forEach(listener => listener(null));
      return Promise.resolve();
    }
  };

  // High-fidelity Mock Firestore database
  dbInstance = {
    collection: (path: string) => {
      return {
        path,
        doc: (docId: string) => {
          return {
            id: docId,
            set: (data: Record<string, unknown>) => {
              localStorage.setItem(`mock_db_${path}_${docId}`, JSON.stringify(data));
              return Promise.resolve();
            },
            get: () => {
              const item = localStorage.getItem(`mock_db_${path}_${docId}`);
              return Promise.resolve({
                exists: () => !!item,
                data: () => (item ? JSON.parse(item) as Record<string, unknown> : null)
              });
            }
          };
        }
      };
    }
  };
}

// Custom wrapper to route onAuthStateChanged properly
export const onAuthStateChanged = (
  authInst: Auth | MockAuth | null,
  callback: (user: User | MockUser | null) => void,
  errorCallback?: (err: Error) => void
) => {
  if (authInst && 'mockSignIn' in authInst) {
    return (authInst as MockAuth).onAuthStateChanged(callback as (user: MockUser | null) => void);
  }
  return fbOnAuthStateChanged(authInst as Auth, callback as (user: User | null) => void, errorCallback);
};

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

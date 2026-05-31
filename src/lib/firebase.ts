import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged as fbOnAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import type { FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id"
};

// Check if running in full mock environment or actual firebase env
const isMock = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'mock-api-key';

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;

if (!isMock) {
  try {
    appInstance = initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    
    // Create an adapter for the real Firestore so that it supports collection().doc().get() / .set()
    const realDb = getFirestore(appInstance);
    
    // Add legacy compatibility helper for db.collection().doc().get() / .set()
    Object.defineProperty(realDb, 'collection', {
      value: (path: string) => {
        return {
          path,
          doc: (docId: string) => {
            return {
              id: docId,
              set: async (data: any) => {
                const docRef = doc(realDb, path, docId);
                await setDoc(docRef, data);
              },
              get: async () => {
                const docRef = doc(realDb, path, docId);
                const snap = await getDoc(docRef);
                return {
                  exists: () => snap.exists(),
                  data: () => snap.data()
                };
              }
            };
          }
        };
      },
      writable: true,
      configurable: true
    });
    dbInstance = realDb;
  } catch (error) {
    console.warn("Firebase failed to initialize, switching to Local Mock adapter.", error);
    setupMock();
  }
} else {
  setupMock();
}

function setupMock() {
  appInstance = { name: "[MockApp]" };
  
  // High-fidelity Mock Auth Listener
  const authListeners = new Set<(user: any) => void>();
  let currentUserProfile: any = null;
  
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
    onAuthStateChanged: (callback: (user: any) => void) => {
      authListeners.add(callback);
      // Immediately notify the listener on start
      setTimeout(() => callback(currentUserProfile), 0);
      return () => {
        authListeners.delete(callback);
      };
    },
    mockSignIn: (email: string) => {
      const newUser = {
        uid: "mock-user-uid-12345",
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
        metadata: { creationTime: new Date().toISOString() }
      };
      currentUserProfile = newUser;
      authInstance.currentUser = currentUserProfile;
      localStorage.setItem('mock_todo_user', JSON.stringify(currentUserProfile));
      authListeners.forEach(listener => listener(currentUserProfile));
      return Promise.resolve(newUser);
    },
    mockSignOut: () => {
      currentUserProfile = null;
      authInstance.currentUser = null;
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
            set: (data: any) => {
              localStorage.setItem(`mock_db_${path}_${docId}`, JSON.stringify(data));
              return Promise.resolve();
            },
            get: () => {
              const item = localStorage.getItem(`mock_db_${path}_${docId}`);
              return Promise.resolve({
                exists: () => !!item,
                data: () => (item ? JSON.parse(item) : null)
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
  authInst: any,
  callback: (user: any) => void,
  errorCallback?: (err: any) => void
) => {
  if (authInst && 'mockSignIn' in authInst) {
    return authInst.onAuthStateChanged(callback);
  }
  return fbOnAuthStateChanged(authInst, callback, errorCallback);
};

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export { isMock };


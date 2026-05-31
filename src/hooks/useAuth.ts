import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { setUser, setLoading, setError } from '../store/slices/authSlice';
import { fetchAllTodoData, wipeData } from '../store/slices/todoSlice';
import { auth, onAuthStateChanged } from '../lib/firebase';
import type { UserProfile } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(setLoading(true));
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          };
          dispatch(setUser(profile));
          dispatch(fetchAllTodoData(profile.uid));
        } else {
          dispatch(setUser(null));
          dispatch(wipeData());
        }
        dispatch(setLoading(false));
      },
      (err) => {
        dispatch(setError(err.message));
        dispatch(setLoading(false));
      }
    );

    return () => unsubscribe();
  }, [dispatch]);

  return { user, isAuthenticated: !!user, isLoading, error };
};

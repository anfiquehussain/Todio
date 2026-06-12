import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { setUser, setLoading, setError } from '../store/slices/authSlice';
import { fetchAllTodoData, wipeData as wipeTodoData, cleanupExpiredTrashAsync } from '../store/slices/todoSlice';
import { fetchAllRoutineData, wipeData as wipeRoutineData } from '../store/slices/routineSlice';
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
          
          // Fetch all todo and routine data concurrently
          Promise.all([
            dispatch(fetchAllTodoData(profile.uid)).unwrap(),
            dispatch(fetchAllRoutineData(profile.uid)).unwrap()
          ]).then(() => {
            dispatch(cleanupExpiredTrashAsync());
          });
        } else {
          dispatch(setUser(null));
          dispatch(wipeTodoData());
          dispatch(wipeRoutineData());
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

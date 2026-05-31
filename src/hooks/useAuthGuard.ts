import { useAppSelector, useAppDispatch } from './useRedux';
import { setAuthModalOpen } from '../store/slices/authSlice';
import { useToast } from './useToast';

export const useAuthGuard = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);

  const checkAuth = (actionDescription?: string): boolean => {
    if (!user) {
      toast(`Authentication Required. Please sign in to ${actionDescription || 'modify your cockpit'}! 🔒`, 'warning');
      dispatch(setAuthModalOpen(true));
      return false;
    }
    return true;
  };

  return { checkAuth, isAuthenticated: !!user };
};
export default useAuthGuard;

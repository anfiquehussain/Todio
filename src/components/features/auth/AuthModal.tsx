import { useState } from 'react';
import { LogIn, UserPlus, Lock } from 'lucide-react';
import { useAppDispatch } from '../../../hooks/useRedux';
import { authService } from '../../../api/auth/authService';
import { setUser, setLoading, setError } from '../../../store/slices/authSlice';
import { useToast } from '../../../hooks/useToast';
import { Modal } from '../../patterns/Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast('Please enter a valid email address.', 'warning');
      return;
    }

    if (!password || password.length < 6) {
      toast('Password must be at least 6 characters.', 'warning');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      toast('Please enter your name.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      dispatch(setLoading(true));

      let userProfile;
      if (isSignUp) {
        userProfile = await authService.signUpWithEmail(email, password, displayName);
        toast(`Welcome aboard, ${userProfile.displayName}! 🎉`, 'success');
      } else {
        userProfile = await authService.loginWithEmail(email, password);
        toast(`Welcome back, ${userProfile.displayName}! 🚀`, 'success');
      }

      dispatch(setUser(userProfile));
      onClose();
        } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed.';
      dispatch(setError(errorMessage));
      toast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      dispatch(setLoading(true));
      const userProfile = await authService.loginWithGoogle();
      dispatch(setUser(userProfile));
      toast(`Successfully synced via Google as ${userProfile.displayName}! 🚀`, 'success');
      onClose();
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code !== 'auth/popup-closed-by-user') {
        const errorMessage = error.message || 'Google Sign-In failed.';
        dispatch(setError(errorMessage));
        toast(errorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSignUp ? "Create Todo Profile" : "Access Todio Control"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center glow-primary transition-all duration-300">
            {isSignUp ? <UserPlus className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
          </div>
          <h4 className="font-bold text-text-primary tracking-wide text-base font-sans">
            {isSignUp ? "Create Your Account" : "Sign In to Sync"}
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed max-w-[250px]">
            {isSignUp
              ? "Register to preserve streaks, sync workspace lists, and rank up your level profile!"
              : "Access your dashboard, preserve your streaks, and keep your XP profile synced."}
          </p>
        </div>

        {isSignUp && (
          <Input
            label="Full Name"
            type="text"
            placeholder="Ada Lovelace"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
            required
            id="auth-display-name"
          />
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="hero@productivity.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
          id="auth-email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="•••••••• (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          required
          id="auth-password"
        />

        <Button type="submit" variant="primary" fullWidth className="mt-2" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              {isSignUp ? "Creating account..." : "Syncing cockpit..."}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {isSignUp ? "Register & Sync" : "Sign In to Sync"}
            </span>
          )}
        </Button>

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-border"></div>
          </div>
          <span className="relative bg-bg-secondary px-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest select-none">
            or continue with
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl border border-gray-border bg-transparent text-text-primary text-sm font-semibold transition-all hover:bg-white/5 active:scale-98 cursor-pointer disabled:opacity-50 disabled:pointer-events-none hover:shadow-md hover:shadow-brand-primary/5 select-none"
        >
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 15.01.5 12 .5 7.42.5 3.51 3.12 1.6 6.94l3.85 2.99C6.38 6.97 8.97 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.49z"
            />
            <path
              fill="#FBBC05"
              d="M5.45 14.93c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.6 7.54C.58 9.58 0 11.87 0 14.25s.58 4.67 1.6 6.71l3.85-3.03z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.03 0-5.62-1.93-6.54-4.89L1.6 16.98c1.91 3.82 5.82 6.52 10.4 6.52z"
            />
          </svg>
          Google Identity Sync
        </button>

        <div className="text-center mt-2 text-xs">
          <span className="text-text-secondary select-none">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              dispatch(setError(null));
            }}
            disabled={isSubmitting}
            className="text-brand-primary font-bold hover:underline hover:text-brand-primary/80 transition-all cursor-pointer bg-transparent border-0 p-0"
          >
            {isSignUp ? "Sign In" : "Register Now"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

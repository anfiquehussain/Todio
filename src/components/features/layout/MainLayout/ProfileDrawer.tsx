import { Flame, Sparkles, LogOut, LogIn } from 'lucide-react';
import { useAppDispatch } from '../../../../hooks/useRedux';
import { setAuthModalOpen } from '../../../../store/slices/authSlice';
import type { UserProfile } from '../../../../types';

interface ProfileDrawerProps {
  user: UserProfile | null;
  streak: number;
  xp: number;
  handleLogout: () => void;
}

export const ProfileDrawer = ({
  user,
  streak,
  xp,
  handleLogout
}: ProfileDrawerProps) => {
  const dispatch = useAppDispatch();

  return (
    <div className="absolute left-12 bottom-0 w-64 bg-bg-secondary/95 border border-gray-border rounded-3xl p-4 shadow-2xl glow-primary flex flex-col gap-4 z-50 backdrop-blur-md transition-colors">
      {user ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 border-b border-gray-border/50 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold uppercase shrink-0">
              {user.displayName ? user.displayName[0] : 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-black text-text-primary truncate">{user.displayName || 'Productive Hero'}</span>
              <span className="text-[10px] text-text-secondary truncate">{user.email}</span>
            </div>
          </div>

          {/* Gamified streaks and scores indicators */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col p-2 bg-card border border-gray-border rounded-2xl select-none">
              <div className="flex items-center gap-1 text-[9px] font-bold text-warning uppercase tracking-wider">
                <Flame aria-hidden="true" className="w-3.5 h-3.5 fill-warning shrink-0 animate-pulse" />
                <span>Streak</span>
              </div>
              <span className="text-sm font-black text-text-primary mt-1">{streak} Days</span>
            </div>

            <div className="flex flex-col p-2 bg-card border border-gray-border rounded-2xl select-none">
              <div className="flex items-center gap-1 text-[9px] font-bold text-brand-primary uppercase tracking-wider">
                <Sparkles aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                <span>XP Level</span>
              </div>
              <span className="text-sm font-black text-text-primary mt-1">{xp}/1000</span>
            </div>
          </div>

          {/* Level progress bar */}
          <div className="w-full bg-gray-border/40 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-brand-primary h-1.5 rounded-full transition-colors duration-500 ease-out" 
              style={{ width: `${Math.min((xp / 1000) * 100, 100)}%` }}
            />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-error bg-error/5 border border-error/10 hover:bg-error/10 transition-colors select-none cursor-pointer mt-1 focus-visible:ring-2 focus-visible:ring-error/50"
          >
            <LogOut aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Logout Account</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center p-2 gap-3">
          <LogIn aria-hidden="true" className="w-8 h-8 text-brand-primary animate-bounce mt-1" />
          <div>
            <h4 className="text-sm font-bold text-text-primary">Cloud Sync Control</h4>
            <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed">
              Login to synchronize Streaks, XP scores, and workspace lists with our Firestore servers.
            </p>
          </div>
          <button
            onClick={() => dispatch(setAuthModalOpen(true))}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/10 hover:bg-brand-primary/15 transition-colors select-none cursor-pointer mt-1 focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          >
            <LogIn aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Sign In Now</span>
          </button>
        </div>
      )}
    </div>
  );
};

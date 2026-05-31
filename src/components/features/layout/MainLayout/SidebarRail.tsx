import { useNavigate, useLocation } from 'react-router-dom';
import { CheckSquare, Award, Settings, RefreshCw, Volume2, VolumeX, User } from 'lucide-react';
import { useAppDispatch } from '../../../../hooks/useRedux';
import { setActiveCollectionId, setActiveSubcollectionId, setFilter } from '../../../../store/slices/todoSlice';
import type { UserProfile } from '../../../../types';

interface SidebarRailProps {
  user: UserProfile | null;
  soundEnabled: boolean;
  isLoading: boolean;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  handleSync: () => void;
  handleToggleSound: () => void;
}

export const SidebarRail = ({
  user,
  soundEnabled,
  isLoading,
  isProfileOpen,
  setIsProfileOpen,
  handleSync,
  handleToggleSound
}: SidebarRailProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();


  return (
    <nav className="hidden md:flex flex-col justify-between items-center bg-bg-secondary border-r border-gray-border py-6 w-14 shrink-0 h-full relative z-20">
      
      {/* Logo & Top vertical options */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Custom geometric logo button */}
        <button 
          type="button"
          className="w-8 h-8 rounded-xl bg-linear-to-br from-brand-primary/20 to-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary glow-primary cursor-pointer active:scale-95 transition-colors select-none shrink-0 focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          onClick={() => {
            dispatch(setActiveCollectionId(null));
            dispatch(setActiveSubcollectionId(null));
            dispatch(setFilter('all'));
            navigate('/');
          }}
          title="Simple Todo Cockpit"
          aria-label="Home Workspace"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-brand-primary">
            <path d="M12 2L2 22h20L12 2zM12 6.5L18.5 19H5.5L12 6.5z" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-1.5 w-full">
          <button
            onClick={() => {
              dispatch(setActiveCollectionId(null));
              dispatch(setActiveSubcollectionId(null));
              dispatch(setFilter('all'));
              navigate('/');
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
              location.pathname === '/' 
                ? 'bg-card text-brand-primary shadow-lg border border-gray-border' 
                : 'text-text-secondary hover:text-text-primary hover:bg-card/50'
            }`}
            title="Tasks Workspace"
          >
            <CheckSquare aria-hidden="true" className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => navigate('/profile')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
              location.pathname === '/profile' 
                ? 'bg-card text-brand-primary shadow-lg border border-gray-border' 
                : 'text-text-secondary hover:text-text-primary hover:bg-card/50'
            }`}
            title="Analytics & Badges"
          >
            <Award aria-hidden="true" className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => navigate('/settings')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
              location.pathname === '/settings' 
                ? 'bg-card text-brand-primary shadow-lg border border-gray-border' 
                : 'text-text-secondary hover:text-text-primary hover:bg-card/50'
            }`}
            title="Workspace Customization"
          >
            <Settings aria-hidden="true" className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Action buttons (Sync, Sound, Profile) */}
      <div className="flex flex-col items-center gap-4 w-full">
        
        {/* Sync trigger */}
        <button
          onClick={handleSync}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-card/50 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          title="Force Database Sync 🔄"
        >
          <RefreshCw aria-hidden="true" className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-primary' : ''}`} />
        </button>

        {/* Sound toggle */}
        <button
          onClick={handleToggleSound}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-card/50 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          title={soundEnabled ? 'Synthesizer Audio Enabled 🔔' : 'Audio bells muted'}
        >
          {soundEnabled ? <Volume2 aria-hidden="true" className="w-4.5 h-4.5" /> : <VolumeX aria-hidden="true" className="w-4.5 h-4.5 text-error" />}
        </button>

        {/* User Profile avatar trigger */}
        <div className="relative shrink-0 select-none">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
              user 
                ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/15' 
                : 'bg-transparent border-gray-border text-text-secondary hover:text-text-primary hover:bg-card/50'
            }`}
            title={user ? `${user.displayName}'s Profile Stats` : 'Sign In to Sync'}
          >
            {user ? (
              <span className="text-[10px] font-black uppercase">{user.displayName ? user.displayName[0] : 'U'}</span>
            ) : (
              <User aria-hidden="true" className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { 
  setSoundEnabled, fetchAllTodoData 
} from '../../../store/slices/todoSlice';
import { setAuthModalOpen, setUser } from '../../../store/slices/authSlice';
import { authService } from '../../../api/auth/authService';
import { useToast } from '../../../hooks/useToast';
import { AuthModal } from '../auth/AuthModal';
import { SidebarRail } from './MainLayout/SidebarRail';
import { ProfileDrawer } from './MainLayout/ProfileDrawer';
import { OrganizerSidebar } from './MainLayout/OrganizerSidebar';

export const MainLayout = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();


  const { soundEnabled, isLoading, isDetailsPaneExpanded } = useAppSelector((state) => state.todo);
  const { user, isAuthModalOpen } = useAppSelector((state) => state.auth);
  const { streak, xp } = useAppSelector((state) => state.profile);

  // Mobile layout state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sync handler
  const handleSync = async () => {
    if (!user) {
      toast('Please sign in to sync with cloud database.', 'info');
      dispatch(setAuthModalOpen(true));
      return;
    }
    try {
      await dispatch(fetchAllTodoData(user.uid)).unwrap();
      toast('Workspace successfully synchronized! 🔄', 'success');
    } catch {
      toast('Failed to synchronize workspace.', 'error');
    }
  };

  // Sound toggle handler
  const handleToggleSound = () => {
    dispatch(setSoundEnabled(!soundEnabled));
    toast(soundEnabled ? 'Synthesizer sound bells muted.' : 'Synthesizer sound bells enabled! 🔔', 'info');
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(setUser(null));
      setIsProfileOpen(false);
      toast('Logged out successfully. See you soon! 👋', 'info');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed.';
      toast(message, 'error');
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-bg-primary text-text-primary h-screen overflow-hidden font-sans relative">
        
        {/* 1. COLUMN 1 navigation rail (Part A - Desktop always visible) */}
        {!isDetailsPaneExpanded && (
          <div className="relative h-full flex shrink-0">
            <SidebarRail
              user={user}
              soundEnabled={soundEnabled}
              isLoading={isLoading}
              isProfileOpen={isProfileOpen}
              setIsProfileOpen={setIsProfileOpen}
              handleSync={handleSync}
              handleToggleSound={handleToggleSound}
            />

            {/* Floating profile drawer subcomponent */}
            {isProfileOpen && (
              <ProfileDrawer
                user={user}
                streak={streak}
                xp={xp}
                handleLogout={handleLogout}
              />
            )}
          </div>
        )}

        {/* 2. COLUMN 1 Part B (Sidebar list panel - Desktop always visible) */}
        {!isDetailsPaneExpanded && (
          <div className="hidden md:block">
            <OrganizerSidebar setIsMobileMenuOpen={setIsMobileMenuOpen} />
          </div>
        )}

        {/* MOBILE NAVIGATION LAYOUT OVERLAYS */}
        {isMobileMenuOpen && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsMobileMenuOpen(false);
              }
            }}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs select-none"
          >
            <div className="w-[296px] h-dvh relative z-50 animate-slide-in flex bg-bg-secondary">
              <SidebarRail
                user={user}
                soundEnabled={soundEnabled}
                isLoading={isLoading}
                isProfileOpen={isProfileOpen}
                setIsProfileOpen={setIsProfileOpen}
                handleSync={handleSync}
                handleToggleSound={handleToggleSound}
                className="flex flex-col justify-between items-center bg-bg-secondary border-r border-gray-border/50 py-6 w-14 shrink-0 h-dvh relative z-20"
              />

              <div className="flex-1 h-dvh flex flex-col min-w-0">
                <OrganizerSidebar setIsMobileMenuOpen={setIsMobileMenuOpen} />
              </div>

              {/* Floating profile drawer subcomponent inside mobile drawer */}
              {isProfileOpen && (
                <ProfileDrawer
                  user={user}
                  streak={streak}
                  xp={xp}
                  handleLogout={handleLogout}
                />
              )}
            </div>
          </div>
        )}

        {/* COLUMN 2 & 3 content container wrapper */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Mobile responsive header bar */}
          <header className="md:hidden flex items-center justify-between px-6 py-3 bg-bg-secondary border-b border-gray-border/50 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-11 h-11 flex items-center justify-center hover:bg-[#202020] text-text-secondary hover:text-text-primary rounded-xl cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-black tracking-tight select-none">Todio</span>
            <div className="w-11 h-11" />
          </header>

          <main className="flex-1 overflow-hidden h-full">
            <Outlet />
          </main>
        </div>

      </div>

      {/* Cloud Authentication Modal Popups */}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => dispatch(setAuthModalOpen(false))} 
        />
      )}
    </>
  );
};


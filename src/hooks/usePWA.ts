import { useEffect, useState } from 'react';
import { useToast } from './useToast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if currently running in standalone (installed) mode
    const checkStandalone = async () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const isLocallyInstalled = localStorage.getItem('todio_pwa_installed') === 'true';
      
      let isRelatedAppInstalled = false;
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> }).getInstalledRelatedApps();
          isRelatedAppInstalled = relatedApps.length > 0;
        } catch (e) {
          console.warn('Failed to query installed related apps:', e);
        }
      }

      setIsInstalled(isStandaloneMedia || isIOSStandalone || isLocallyInstalled || isRelatedAppInstalled);
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayChange);
    } else {
      mediaQuery.addListener(handleDisplayChange);
    }

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      localStorage.setItem('todio_pwa_installed', 'true');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast('Todio has been installed successfully! 🎉', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayChange);
      } else {
        mediaQuery.removeListener(handleDisplayChange);
      }
    };
  }, [toast]);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      toast('Installation is not supported on this browser or the app is already installed.', 'error');
      return;
    }
    try {
      toast('Installing Todio…', 'info');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('todio_pwa_installed', 'true');
        setIsInstalled(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during installation';
      toast(`Installation failed: ${errorMessage}`, 'error');
    } finally {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Button should only show when natively installable AND not already installed
  const shouldShowButton = isInstallable && !isInstalled;

  return {
    isInstallable,
    isInstalled,
    shouldShowButton,
    triggerInstall
  };
};

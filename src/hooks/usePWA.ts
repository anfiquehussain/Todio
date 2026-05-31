import { useEffect, useState } from 'react';

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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if currently running in standalone (installed) mode
    const checkStandalone = async () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const isLocallyInstalled = localStorage.getItem('todio_pwa_installed') === 'true';
      
      let isRelatedAppInstalled = false;
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          isRelatedAppInstalled = relatedApps.length > 0;
        } catch (e) {
          console.warn('Failed to query installed related apps:', e);
        }
      }

      setIsInstalled(isStandaloneMedia || isIOSStandalone || isLocallyInstalled || isRelatedAppInstalled);
    };

    checkStandalone();

    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileUA);
    };
    checkMobile();

    // Listen for display mode changes (e.g. user launches or exits standalone)
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
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      localStorage.setItem('todio_pwa_installed', 'true');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
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
  }, []);

  const triggerInstall = async (): Promise<'installed' | 'cancelled' | 'fallback'> => {
    if (!deferredPrompt) {
      return 'fallback';
    }
    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      // Clear the prompt since it can only be used once
      setDeferredPrompt(null);
      setIsInstallable(false);

      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('todio_pwa_installed', 'true');
        setIsInstalled(true);
        return 'installed';
      }
      return 'cancelled';
    } catch {
      return 'fallback';
    }
  };

  // The button should be shown ONLY if:
  // 1. The browser flags the page as installable (we received the prompt event) OR is a mobile device
  // 2. The app is not already running or installed in standalone mode
  const shouldShowButton = !isInstalled && (isInstallable || isMobile);

  return {
    isInstallable,
    isInstalled,
    isMobile,
    shouldShowButton,
    triggerInstall
  };
};

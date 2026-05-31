import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export const useIntersectionObserver = ({
  threshold = 0,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [element, setElement] = useState<HTMLElement | null>(null);

  // Callback ref as mandated in §15.3 for connection/disconnection stability
  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;
    if (freezeOnceVisible && isIntersecting) return;

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      ([obsEntry]) => {
        setIsIntersecting(obsEntry.isIntersecting);
        setEntry(obsEntry);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [element, threshold, rootMargin, freezeOnceVisible, isIntersecting]);

  return { ref, isIntersecting, entry };
};

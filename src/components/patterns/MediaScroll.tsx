import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

interface MediaScrollProps {
  title: string;
  children: React.ReactNode;
}

export const MediaScroll = ({
  title,
  children,
}: MediaScrollProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 relative w-full mb-8">
      {/* Scroll Header Titles and Direction Buttons */}
      <div className="flex items-center justify-between border-b border-gray-border/50 pb-2.5">
        <h2 className="text-lg font-bold text-text-primary tracking-wide font-sans">
          {title}
        </h2>
        <div className="flex items-center gap-1.5">
          <IconButton
            variant="border"
            size="sm"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          </IconButton>
          <IconButton
            variant="border"
            size="sm"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight aria-hidden="true" className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {/* Snap container scrolling */}
      <div
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
};

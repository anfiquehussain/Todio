import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  lineClass?: string;
  textSize?: string;
}

export const ExpandableText = ({ text, lineClass = '', textSize = 'text-xs' }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLSpanElement | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsExpanded(false);

    const measure = () => {
      const el = textRef.current;
      if (el) {
        const hasVerticalOverflow = el.scrollHeight > el.clientHeight;
        const hasHorizontalOverflow = el.scrollWidth > el.clientWidth;
        setIsOverflowing(hasVerticalOverflow || hasHorizontalOverflow);
      }
    };

    measure();
    const timeout = setTimeout(measure, 100);
    return () => clearTimeout(timeout);
  }, [text]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="flex items-start gap-1.5 flex-1 min-w-0">
      <span
        ref={textRef}
        title={text}
        className={`${textSize} font-bold text-left select-text wrap-break-word flex-1 ${lineClass} ${
          isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2 md:line-clamp-1 overflow-hidden'
        }`}
      >
        {text}
      </span>
      {isOverflowing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-0.5 hover:bg-[#2e2e2e] rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0 mt-0.5"
          title={isExpanded ? "Collapse" : "Expand"}
          aria-label={isExpanded ? "Collapse text" : "Expand text"}
        >
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
};

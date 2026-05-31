interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton = ({
  className = '',
  variant = 'rect',
}: SkeletonProps) => {
  const baseStyle = 'animate-pulse bg-gray-border/30';

  const variants = {
    text: 'h-4 w-full rounded-md',
    rect: 'h-24 w-full rounded-2xl',
    circle: 'rounded-full shrink-0',
  };

  return <div className={`${baseStyle} ${variants[variant]} ${className}`} />;
};

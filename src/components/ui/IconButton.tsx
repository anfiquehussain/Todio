import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'border';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = ({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-2xl transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';


  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95',
    secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90 hover:shadow-lg hover:shadow-brand-secondary/20 active:scale-95',
    accent: 'bg-brand-accent text-white hover:bg-brand-accent/90 hover:shadow-lg hover:shadow-brand-accent/20 active:scale-95',
    danger: 'bg-error text-white hover:bg-error/90 hover:shadow-lg hover:shadow-error/20 active:scale-95',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-gray-border active:scale-95',
    border: 'bg-transparent border border-gray-border text-text-secondary hover:text-text-primary hover:bg-gray-border active:scale-95',
  };

  const sizes = {
    sm: 'w-8 h-8 p-1.5 text-xs',
    md: 'w-10 h-10 p-2 text-sm',
    lg: 'w-12 h-12 p-2.5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

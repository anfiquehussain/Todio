import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-2xl transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-lg hover:shadow-brand-primary/20 active:scale-98',
    secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90 hover:shadow-lg hover:shadow-brand-secondary/20 active:scale-98',
    accent: 'bg-brand-accent text-white hover:bg-brand-accent/90 hover:shadow-lg hover:shadow-brand-accent/20 active:scale-98',
    danger: 'bg-error text-white hover:bg-error/90 hover:shadow-lg hover:shadow-error/20 active:scale-98',
    ghost: 'bg-transparent text-text-primary hover:bg-gray-border',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

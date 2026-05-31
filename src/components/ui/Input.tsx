import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`;


  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-text-secondary select-none">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3.5 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 disabled:opacity-50 disabled:pointer-events-none ${
          error ? 'border-error/50 focus:border-error focus:ring-error/50' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-error font-medium">{error}</span>}
    </div>
  );
};

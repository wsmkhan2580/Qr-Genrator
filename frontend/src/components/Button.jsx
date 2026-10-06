import React from 'react';

const VARIANTS = {
  primary: 'bg-ink-900 text-white hover:bg-ink-800 focus-visible:outline-ink-900',
  secondary: 'bg-white text-ink-900 border border-ink-300 hover:bg-ink-50 focus-visible:outline-ink-900',
  danger: 'bg-white text-red-700 border border-red-300 hover:bg-red-50 focus-visible:outline-red-700',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 focus-visible:outline-ink-900',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...rest
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium
        transition-colors disabled:cursor-not-allowed disabled:opacity-50
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        ${VARIANTS[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </Component>
  );
}

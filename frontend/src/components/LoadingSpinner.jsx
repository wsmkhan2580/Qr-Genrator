import React from 'react';

export default function LoadingSpinner({ label = 'Loading…', size = 'md' }) {
  const dimension = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span
        className={`${dimension} animate-spin rounded-full border-2 border-ink-300 border-t-ink-900`}
        aria-hidden="true"
      />
      <span className="text-sm text-ink-600">{label}</span>
    </div>
  );
}

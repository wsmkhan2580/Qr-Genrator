import React, { forwardRef, useId } from 'react';

/**
 * Accessible text input: explicit <label htmlFor>, aria-invalid,
 * aria-describedby pointing at the error message, and the error
 * announced via role="alert" so screen readers pick it up immediately.
 */
const TextField = forwardRef(function TextField(
  { label, error, hint, type = 'text', required, className = '', ...rest },
  ref
) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-800">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        ref={ref}
        type={type}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
        className={`w-full rounded-md border px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400
          focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-ink-900
          ${error ? 'border-red-400' : 'border-ink-300'}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});

export default TextField;

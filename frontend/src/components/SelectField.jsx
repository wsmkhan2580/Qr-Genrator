import React, { forwardRef, useId } from 'react';

const SelectField = forwardRef(function SelectField(
  { label, error, options, required, className = '', placeholder, ...rest },
  ref
) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-800">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={id}
        ref={ref}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-ink-900
          focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-ink-900
          ${error ? 'border-red-400' : 'border-ink-300'}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});

export default SelectField;

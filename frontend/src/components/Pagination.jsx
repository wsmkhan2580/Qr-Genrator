import React from 'react';
import Button from './Button.jsx';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between border-t border-ink-200 px-2 py-3" aria-label="Pagination">
      <p className="text-sm text-ink-600">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

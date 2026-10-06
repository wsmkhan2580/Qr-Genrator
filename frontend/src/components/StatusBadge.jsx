import React from 'react';
import { STATUS_LABELS } from '../utils/format.js';

// Each status pairs a color with a distinct symbol/label so status is
// never conveyed by color alone (WCAG 1.4.1).
const STYLES = {
  ACTIVE: { classes: 'bg-green-50 text-green-800 border-green-300', symbol: '●' },
  USED: { classes: 'bg-ink-100 text-ink-700 border-ink-300', symbol: '✓' },
  CANCELLED: { classes: 'bg-red-50 text-red-700 border-red-300', symbol: '✕' },
  EXPIRED: { classes: 'bg-amber-50 text-amber-800 border-amber-300', symbol: '!' },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.ACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.classes}`}
    >
      <span aria-hidden="true">{style.symbol}</span>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

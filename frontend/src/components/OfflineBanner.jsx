import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div
      role="status"
      className="no-print bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900"
    >
      You&apos;re offline. Changes won&apos;t be saved until your connection returns.
    </div>
  );
}

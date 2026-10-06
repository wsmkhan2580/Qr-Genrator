import React, { useEffect, useState } from 'react';
import { fetchOverview, fetchActivity } from '../services/analyticsService.js';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatDateTime } from '../utils/format.js';

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-ink-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { isManagerOrAdmin } = useAuth();
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([fetchOverview(), isManagerOrAdmin ? fetchActivity() : Promise.resolve([])])
      .then(([overviewData, activityData]) => {
        if (cancelled) return;
        setOverview(overviewData);
        setActivity(activityData);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load dashboard data.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isManagerOrAdmin]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner label="Loading dashboard…" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500">Overview of ticket activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Tickets" value={overview.total} />
        <StatCard label="Active" value={overview.ACTIVE} />
        <StatCard label="Used" value={overview.USED} />
        <StatCard label="Cancelled" value={overview.CANCELLED} />
        <StatCard label="Today" value={overview.todayCount} />
      </div>

      {isManagerOrAdmin && overview.ticketsByWorker && (
        <section aria-labelledby="by-worker-heading">
          <h2 id="by-worker-heading" className="text-sm font-semibold text-ink-800">
            Tickets by Worker
          </h2>
          <ul className="mt-2 divide-y divide-ink-100 rounded-lg border border-ink-200">
            {overview.ticketsByWorker.map((w) => (
              <li key={w.workerId} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{w.workerName}</span>
                <span className="font-medium text-ink-900">{w.ticketCount}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isManagerOrAdmin && activity && activity.length > 0 && (
        <section aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="text-sm font-semibold text-ink-800">
            Recent Activity
          </h2>
          <ul className="mt-2 divide-y divide-ink-100 rounded-lg border border-ink-200">
            {activity.map((item) => (
              <li key={item.id} className="px-4 py-2 text-sm">
                <span className="font-medium text-ink-900">{item.userName || 'System'}</span>{' '}
                <span className="text-ink-600">{item.action.replace(/_/g, ' ')}</span>{' '}
                <span className="text-ink-400">· {formatDateTime(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchTickets, exportCsvUrl } from '../services/ticketService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import TicketTable from '../components/TicketTable.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Pagination from '../components/Pagination.jsx';
import Button from '../components/Button.jsx';
import { STATUS_LABELS } from '../utils/format.js';

export default function TicketsListPage() {
  const { isManagerOrAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    searchTickets({ q: debouncedQuery || undefined, status: status || undefined, page, pageSize: 10 })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load tickets.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, status, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Tickets</h1>
          <p className="text-sm text-ink-500">Search, filter, and manage tickets.</p>
        </div>
        <div className="flex gap-2">
          <Button as={Link} to="/tickets/new">
            + Create Ticket
          </Button>
          {isManagerOrAdmin && (
            <Button as="a" href={exportCsvUrl()} variant="secondary">
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="ticket-search" className="sr-only">
            Search tickets
          </label>
          <input
            id="ticket-search"
            type="search"
            placeholder="Search by name, phone, email, ticket code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-900"
          />
        </div>
        <div>
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-900"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Loading tickets…" />
        </div>
      )}

      {!isLoading && error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!isLoading && !error && result && result.tickets.length === 0 && (
        <EmptyState
          title="No tickets found."
          description="Create your first ticket to get started."
          action={
            <Button as={Link} to="/tickets/new">
              + Create Ticket
            </Button>
          }
        />
      )}

      {!isLoading && !error && result && result.tickets.length > 0 && (
        <>
          <TicketTable tickets={result.tickets} />
          <Pagination
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

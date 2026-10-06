import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import Button from './Button.jsx';
import { formatDate } from '../utils/format.js';

export default function TicketTable({ tickets }) {
  return (
    <>
      {/* Desktop / tablet: real table, horizontally scrollable if needed */}
      <div className="no-scrollbar hidden overflow-x-auto rounded-lg border border-ink-200 sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">List of tickets</caption>
          <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Ticket Code</th>
              <th scope="col" className="px-4 py-3 font-medium">Customer</th>
              <th scope="col" className="px-4 py-3 font-medium">Event</th>
              <th scope="col" className="px-4 py-3 font-medium">Type</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Created By</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 font-mono text-xs">{ticket.ticketCode}</td>
                <td className="px-4 py-3">{ticket.customerName}</td>
                <td className="px-4 py-3">{ticket.eventName}</td>
                <td className="px-4 py-3">{ticket.ticketType}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3">{ticket.createdByName || '—'}</td>
                <td className="px-4 py-3">{formatDate(ticket.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button as={Link} to={`/tickets/${ticket.id}`} variant="secondary">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <ul className="space-y-3 sm:hidden">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="rounded-lg border border-ink-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-ink-500">{ticket.ticketCode}</p>
                <p className="font-medium text-ink-900">{ticket.customerName}</p>
                <p className="text-sm text-ink-600">{ticket.eventName}</p>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-600">
              <div>
                <dt className="font-medium">Type</dt>
                <dd>{ticket.ticketType}</dd>
              </div>
              <div>
                <dt className="font-medium">Created</dt>
                <dd>{formatDate(ticket.createdAt)}</dd>
              </div>
            </dl>
            <Button as={Link} to={`/tickets/${ticket.id}`} variant="secondary" className="mt-3 w-full">
              View ticket
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}

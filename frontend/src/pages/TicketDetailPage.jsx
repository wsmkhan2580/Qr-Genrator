import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTicket, cancelTicket } from '../services/ticketService.js';
import QRTicketCard from '../components/QRTicketCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Button from '../components/Button.jsx';

export default function TicketDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getTicket(id)
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load this ticket.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = () => {
    if (!data?.qrImage) return;
    const link = document.createElement('a');
    link.href = data.qrImage;
    link.download = `${data.ticket.ticketCode}.png`;
    link.click();
  };

  const handlePrint = () => window.print();

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ticket? This cannot be undone.')) return;
    try {
      await cancelTicket(id);
      setActionMessage('Ticket cancelled.');
      load();
    } catch (err) {
      setActionMessage(err.message || 'Could not cancel this ticket.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner label="Loading ticket…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <Button as={Link} to="/tickets" variant="secondary">
          Back to tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button as={Link} to="/tickets" variant="ghost" className="no-print">
        ← Back to tickets
      </Button>

      {actionMessage && (
        <p role="status" className="rounded-md bg-ink-50 px-4 py-3 text-sm text-ink-800">
          {actionMessage}
        </p>
      )}

      <QRTicketCard ticket={data.ticket} qrImage={data.qrImage} onDownload={handleDownload} onPrint={handlePrint} />

      {data.ticket.status === 'ACTIVE' && (
        <div className="no-print mx-auto flex max-w-md justify-center">
          <Button variant="danger" onClick={handleCancel}>
            Cancel Ticket
          </Button>
        </div>
      )}
    </div>
  );
}

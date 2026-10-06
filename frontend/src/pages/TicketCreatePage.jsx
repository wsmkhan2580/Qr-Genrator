import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../services/ticketService.js';
import { ticketFormSchema } from '../validation/schemas.js';
import TextField from '../components/TextField.jsx';
import SelectField from '../components/SelectField.jsx';
import Button from '../components/Button.jsx';
import { TICKET_TYPES } from '../utils/format.js';

const ticketTypeOptions = TICKET_TYPES.map((t) => ({ value: t, label: t }));

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: { quantity: 1, ticketType: 'General' },
  });

  // React Hook Form + isSubmitting already disables the submit button
  // during the request, which combined with awaiting the server
  // response before navigating prevents duplicate ticket creation from
  // a double click or a flaky connection retry.
  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const { ticket } = await createTicket({
        ...values,
        customerEmail: values.customerEmail || undefined,
      });
      navigate(`/tickets/${ticket.id}`, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Could not create the ticket. Please try again.');
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-ink-900">Create Ticket</h1>
      <p className="mt-1 text-sm text-ink-500">A unique QR code is generated automatically.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <TextField label="Customer Name" required error={errors.customerName?.message} {...register('customerName')} />
        <TextField
          label="Customer Phone"
          type="tel"
          required
          hint="e.g. 98765 43210"
          error={errors.customerPhone?.message}
          {...register('customerPhone')}
        />
        <TextField
          label="Customer Email"
          type="email"
          hint="Optional"
          error={errors.customerEmail?.message}
          {...register('customerEmail')}
        />
        <TextField label="Event Name" required error={errors.eventName?.message} {...register('eventName')} />
        <TextField
          label="Event Date"
          type="date"
          required
          error={errors.eventDate?.message}
          {...register('eventDate')}
        />
        <SelectField
          label="Ticket Type"
          required
          options={ticketTypeOptions}
          error={errors.ticketType?.message}
          {...register('ticketType')}
        />
        <TextField
          label="Quantity"
          type="number"
          min={1}
          max={1000}
          required
          error={errors.quantity?.message}
          {...register('quantity')}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" isLoading={isSubmitting}>
            Generate Ticket
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

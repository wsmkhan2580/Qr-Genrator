import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { validateCodeSchema } from '../validation/schemas.js';
import { validateTicketByCode } from '../services/ticketService.js';
import TextField from '../components/TextField.jsx';
import Button from '../components/Button.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ValidateTicketPage() {
  const [result, setResult] = useState(null); // { ok: bool, message, ticket? }
  const [scannerOn, setScannerOn] = useState(false);
  const scannerRef = useRef(null);
  // The camera fires the decode callback ~10x/second while a QR is in view.
  // Without these guards the same ticket gets validated repeatedly: the first
  // call succeeds, the next ones return "already used" and overwrite the
  // green success message with a red error.
  const busyRef = useRef(false);
  const lastScanRef = useRef({ text: '', at: 0 });
  const DUPLICATE_SCAN_WINDOW_MS = 8000;
  const scannerElId = 'qr-scanner-region';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: zodResolver(validateCodeSchema) });

  const runValidation = async (code) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setResult(null);
    try {
      const { ticket, message } = await validateTicketByCode(code);
      setResult({ ok: true, message, ticket });
      reset();
    } catch (err) {
      setResult({ ok: false, message: err.message || 'Validation failed.' });
    } finally {
      busyRef.current = false;
    }
  };

  const onSubmit = (values) => runValidation(values.code);

  // Lazily load the camera scanner only when the worker opts in - avoids
  // requesting camera permission unnecessarily and keeps this working on
  // devices/browsers without camera support (manual entry still works).
  useEffect(() => {
    if (!scannerOn) return undefined;
    let cancelled = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(scannerElId);
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (decodedText) => {
            const now = Date.now();
            const last = lastScanRef.current;
            if (busyRef.current) return;
            if (last.text === decodedText && now - last.at < DUPLICATE_SCAN_WINDOW_MS) return;
            lastScanRef.current = { text: decodedText, at: now };
            setValue('code', decodedText);
            runValidation(decodedText);
          },
          () => {} // ignore per-frame scan misses
        )
        .catch(() => {
          setResult({ ok: false, message: 'Could not access the camera. Use manual entry instead.' });
          setScannerOn(false);
        });
    });

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOn]);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Validate Ticket</h1>
        <p className="mt-1 text-sm text-ink-500">Scan a QR code or enter the ticket code manually.</p>
      </div>

      <div className="rounded-lg border border-ink-200 p-4">
        <Button type="button" variant="secondary" onClick={() => setScannerOn((v) => !v)}>
          {scannerOn ? 'Stop Scanner' : 'Start Camera Scanner'}
        </Button>
        {scannerOn && <div id={scannerElId} className="mt-4 overflow-hidden rounded-md" />}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3" noValidate>
        <TextField
          label="Ticket Code"
          hint="Enter the code printed under the QR"
          error={errors.code?.message}
          className="flex-1"
          {...register('code')}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Validate
        </Button>
      </form>

      {result && (
        <div
          role="status"
          aria-live="assertive"
          className={`rounded-lg border p-4 ${
            result.ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}
        >
          <p className={`text-sm font-semibold ${result.ok ? 'text-green-800' : 'text-red-700'}`}>
            {result.message}
          </p>
          {result.ticket && (
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-700">
              <span>{result.ticket.customerName}</span>
              <StatusBadge status={result.ticket.status} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

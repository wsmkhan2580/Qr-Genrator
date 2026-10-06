import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-semibold text-ink-900">404</h1>
      <p className="text-sm text-ink-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Button as={Link} to="/dashboard">
        Back to Dashboard
      </Button>
    </div>
  );
}

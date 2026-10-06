import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

describe('StatusBadge', () => {
  it.each([
    ['ACTIVE', 'Active'],
    ['USED', 'Used'],
    ['CANCELLED', 'Cancelled'],
    ['EXPIRED', 'Expired'],
  ])('renders a text label for %s status, not just a color', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('shows the required empty-tickets copy', () => {
    render(<EmptyState title="No tickets found." description="Create your first ticket to get started." />);
    expect(screen.getByText('No tickets found.')).toBeInTheDocument();
    expect(screen.getByText('Create your first ticket to get started.')).toBeInTheDocument();
  });
});

describe('LoadingSpinner', () => {
  it('exposes a status role for screen readers', () => {
    render(<LoadingSpinner label="Loading tickets…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading tickets…');
  });
});

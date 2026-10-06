import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

vi.mock('../services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  fetchCurrentUser: vi.fn().mockRejectedValue(new Error('not authenticated')),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('shows inline validation errors for empty required fields', async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows a server error message when login fails', async () => {
    const { login } = await import('../services/authService.js');
    login.mockRejectedValueOnce({ message: 'Invalid email or password.' });

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'worker@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
    });
  });
});

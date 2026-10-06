import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

vi.mock('../services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  fetchCurrentUser: vi.fn().mockRejectedValue(new Error('not authenticated')),
}));

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login screen</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });
});

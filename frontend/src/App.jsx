import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TicketsListPage from './pages/TicketsListPage.jsx';
import TicketCreatePage from './pages/TicketCreatePage.jsx';
import TicketDetailPage from './pages/TicketDetailPage.jsx';
import ValidateTicketPage from './pages/ValidateTicketPage.jsx';
import WorkersPage from './pages/WorkersPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/new" element={<TicketCreatePage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/validate" element={<ValidateTicketPage />} />
        <Route
          path="/workers"
          element={
            <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
              <WorkersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

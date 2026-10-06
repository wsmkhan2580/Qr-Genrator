import { api } from './api.js';

export async function createTicket(payload) {
  const { data } = await api.post('/tickets', payload);
  return data.data; // { ticket, qrImage }
}

export async function searchTickets(params) {
  const { data } = await api.get('/tickets', { params });
  return data.data; // { tickets, pagination }
}

export async function getTicket(id) {
  const { data } = await api.get(`/tickets/${id}`);
  return data.data; // { ticket, qrImage }
}

export async function validateTicketByCode(code) {
  const { data } = await api.post('/tickets/verify', { code });
  return data.data; // { ticket, message }
}

export async function cancelTicket(id) {
  await api.delete(`/tickets/${id}`);
}

// Downloads through axios (cookie + CORS handled like every other call) instead
// of navigating the browser to the API URL. A plain link navigation fails
// silently or shows a raw JSON error page when the cookie isn't sent.
export async function downloadTicketsCsv() {
  const response = await api.get('/export/tickets', { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportCsvUrl() {
  return `${api.defaults.baseURL}/export/tickets`;
}

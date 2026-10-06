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

export function exportCsvUrl() {
  return `${api.defaults.baseURL}/export/tickets`;
}

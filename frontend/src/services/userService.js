import { api } from './api.js';

export async function listWorkers(params) {
  const { data } = await api.get('/users', { params });
  return data.data; // { users, pagination }
}

export async function createWorker(payload) {
  const { data } = await api.post('/users', payload);
  return data.data.user;
}

export async function updateWorker(id, payload) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data.data.user;
}

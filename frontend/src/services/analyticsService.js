import { api } from './api.js';

export async function fetchOverview() {
  const { data } = await api.get('/analytics/overview');
  return data.data;
}

export async function fetchActivity() {
  const { data } = await api.get('/analytics/activity');
  return data.data.items;
}

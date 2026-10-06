import axios from 'axios';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  // eslint-disable-next-line no-console
  console.error('VITE_API_URL is not set - the app will try to call http://localhost:4000/api.');
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true, // send/receive the HTTP-only auth cookie
  timeout: 15000,
});

/**
 * Normalizes every failure into a plain object the UI can render
 * directly: { status, code, message, details }. Network failures and
 * timeouts (no response at all) get a friendly message instead of a
 * raw axios error.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        status: 0,
        code: error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR',
        message:
          error.code === 'ECONNABORTED'
            ? 'The request timed out. Please try again.'
            : 'Unable to reach the server. Check your connection and try again.',
      });
    }
    const body = error.response.data?.error;
    return Promise.reject({
      status: error.response.status,
      code: body?.code || 'UNKNOWN_ERROR',
      message: body?.message || 'Something went wrong. Please try again.',
      details: body?.details,
    });
  }
);

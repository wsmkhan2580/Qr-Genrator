import dotenv from 'dotenv';
import { assertProductionSecrets } from './secrets.js';

dotenv.config();

function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    // Fail loudly at boot rather than silently running insecurely.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// CLIENT_URL may be a comma-separated list (e.g. production + a preview URL).
// Trailing slashes are stripped because browsers send Origin without one.
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const ALLOWED_SAMESITE = ['strict', 'lax', 'none'];
// Frontend and API on different registrable domains (e.g. *.vercel.app +
// *.onrender.com) need SameSite=None; same-site deployments can use strict.
const defaultSameSite = isProd ? 'none' : 'lax';
const cookieSameSite = (process.env.COOKIE_SAMESITE || defaultSameSite).toLowerCase();
if (!ALLOWED_SAMESITE.includes(cookieSameSite)) {
  throw new Error(`COOKIE_SAMESITE must be one of: ${ALLOWED_SAMESITE.join(', ')}`);
}

const jwtSecret = required('JWT_SECRET');
const ticketTokenSecret = process.env.TICKET_TOKEN_SECRET || (isProd ? '' : jwtSecret);

if (isProd) {
  assertProductionSecrets({ jwtSecret, ticketTokenSecret });
}

export const env = {
  nodeEnv,
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: process.env.COOKIE_NAME || 'tqg_session',
  cookieSameSite,
  clientUrls,
  clientUrl: clientUrls[0],
  trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS || '1', 10),
  authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  apiRateLimitWindowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000', 10),
  apiRateLimitMax: parseInt(process.env.API_RATE_LIMIT_MAX || '120', 10),
  ticketTokenSecret,
  isProd,
  isTest: nodeEnv === 'test',
};

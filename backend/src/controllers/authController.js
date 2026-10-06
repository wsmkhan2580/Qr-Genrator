import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authenticate } from '../modules/users/user.service.js';
import { recordAudit } from '../modules/audit/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { track } from '../utils/analytics.js';

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    // SameSite=None requires Secure; browsers reject the cookie otherwise.
    secure: env.isProd || env.cookieSameSite === 'none',
    sameSite: env.cookieSameSite,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: '/',
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticate(email, password);
  setSessionCookie(res, user);
  await recordAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id, req });
  track('login', { userId: user.id });
  res.json({ success: true, data: { user } });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.cookieName, {
    path: '/',
    httpOnly: true,
    secure: env.isProd || env.cookieSameSite === 'none',
    sameSite: env.cookieSameSite,
  });
  if (req.user) {
    await recordAudit({ userId: req.user.id, action: 'logout', entityType: 'user', entityId: req.user.id, req });
    track('logout', { userId: req.user.id });
  }
  res.json({ success: true, data: {} });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

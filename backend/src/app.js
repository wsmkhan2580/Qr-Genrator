import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import { env } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { originGuard } from './middleware/originGuard.js';

import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import userRoutes from './routes/user.routes.js';
import exportRoutes from './routes/export.routes.js';
import healthRoutes from './routes/health.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', env.trustProxyHops);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header = non-browser client (curl, health checks): allow.
        if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(compression());
  if (!env.isTest) {
    app.use(morgan(env.isProd ? 'combined' : 'dev'));
  }
  // Request body size limit - defense against oversized payload abuse.
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(originGuard);

  app.use('/api', apiRateLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/health', healthRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

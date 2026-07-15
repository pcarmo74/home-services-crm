import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';

import { initializeDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';

import { setupRoutes } from './routes/index.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Logging
app.use(pinoHttp({ logger }));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// INITIALIZE DATABASE
// ============================================================================

initializeDatabase()
  .then(() => {
    logger.info('✅ Database initialized');
  })
  .catch((err) => {
    logger.error('❌ Database initialization failed:', err);
    process.exit(1);
  });

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no auth, no rate limit)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Setup all routes
setupRoutes(app);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// ============================================================================
// ERROR HANDLER (LAST MIDDLEWARE)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`✅ Server running on http://localhost:${PORT}`);
});

export default app;
import { Express } from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';

import { setupHealthRoutes } from './health.js';
import { setupJobRoutes } from './jobs.js';
import { setupContactRoutes } from './contacts.js';
import { setupCrewRoutes } from './crews.js';
import { setupPropertyRoutes } from './properties.js';
import { setupInvoiceRoutes } from './invoices.js';
import { setupMCPRoutes } from './mcp.js';

export function setupRoutes(app: Express) {
  // Health check (no auth, no rate limit)
  setupHealthRoutes(app);

  // MCP/Agent routes (rate limited, no JWT)
  app.use('/api/mcp', rateLimiter, setupMCPRoutes);

  // Regular API routes (NO AUTH for now - dev only)
  setupJobRoutes(app);
  setupContactRoutes(app);
  setupCrewRoutes(app);
  setupPropertyRoutes(app);
  setupInvoiceRoutes(app);
}
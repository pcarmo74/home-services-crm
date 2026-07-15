import { Express, Request, Response } from 'express';

export function setupHealthRoutes(app: Express) {
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 1000; // requests per minute

export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = rateLimitMap.get(key);

  // Reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    throw new AppError(
      429,
      'Too many requests. Rate limit exceeded.'
    );
  }

  res.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  res.set('X-RateLimit-Remaining', (RATE_LIMIT_MAX - entry.count).toString());
  res.set('X-RateLimit-Reset', entry.resetTime.toString());

  next();
}
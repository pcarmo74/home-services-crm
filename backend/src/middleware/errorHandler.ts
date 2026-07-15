import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logger.error({
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { details: err.details }),
  });
}
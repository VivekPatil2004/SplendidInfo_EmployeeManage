import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { HTTP_STATUS } from '../utils/constants';

// Custom Application Error
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let errorCode: string | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.code;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
  } else if (err.name === 'CastError') {
    // Mongoose cast error (e.g. invalid ObjectId)
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid ID format';
  } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    // MongoDB duplicate key
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Duplicate field value entered';
  }

  // Log error (only warn for expected operational errors, error for 500s)
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${message}`);
  }

  res.status(statusCode).json({
    message,
    ...(errorCode && { code: errorCode }),
    // Only send stack trace in dev
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

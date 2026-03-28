import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, TIMEOUTS } from '../utils/constants';

/**
 * Middleware that sends a 408 Request Timeout if the response hasn't
 * finished within TIMEOUTS.REQUEST_TIMEOUT_MS.
 * This prevents worker threads from being blocked forever by hanging requests.
 */
export const requestTimeout = (req: Request, res: Response, next: NextFunction): void => {
  // Set the timeout timer
  const timer = setTimeout(() => {
    // If headers are already sent, we can't do anything
    if (!res.headersSent) {
      res.status(HTTP_STATUS.REQUEST_TIMEOUT).json({
        message: 'Request Timeout: The server took too long to process the request.',
      });
    }
  }, TIMEOUTS.REQUEST_TIMEOUT_MS);

  // Clear the timer if the response finishes normally
  res.on('finish', () => {
    clearTimeout(timer);
  });

  // Also clear if the client drops the connection
  req.on('close', () => {
    clearTimeout(timer);
  });

  next();
};

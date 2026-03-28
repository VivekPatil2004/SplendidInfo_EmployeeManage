import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console (readable dev format)
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Create Winston logger instance
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // capture stack traces
    env.NODE_ENV === 'development' ? colorize() : json(), // colorize in dev, JSON string in prod
    env.NODE_ENV === 'development' ? consoleFormat : json()
  ),
  transports: [
    new winston.transports.Console(),
    // In production, we could add file transports here
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Graceful logging for uncaught exceptions/rejections
logger.exceptions.handle(
  new winston.transports.Console({
    format: combine(colorize(), consoleFormat),
  })
);
logger.rejections.handle(
  new winston.transports.Console({
    format: combine(colorize(), consoleFormat),
  })
);

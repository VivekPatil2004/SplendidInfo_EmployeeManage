import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { env } from './env';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections 
      minPoolSize: 2,  // Keep at least 2 connections alive
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
      family: 4,                      // Use IPv4, skip trying IPv6
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Setup event listeners for connection issues
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
  } catch (error: any) {
    logger.error(`MongoDB Connection Fatal Error: ${error.message}`);
    process.exit(1);
  }
};

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestTimeout } from './middleware/requestTimeout';

// Routes
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import chatRoutes from './routes/chatRoutes';
import meetingRoutes from './routes/meetingRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';

const app = express();

// ==========================================
// 1. Security & Performance Middlewares
// ==========================================
app.use(helmet()); 
app.use(compression()); 
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    exposedHeaders: ['Set-Cookie'],
  })
);
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(hpp()); 
app.use(requestTimeout);

// ==========================================
// 2. Logging Middleware
// ==========================================
app.use(morgan('short', {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// ==========================================
// 3. API Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);

// Fallback for 404
app.use((req, res) => {
  res.status(404).json({ message: 'API Endpoint Not Found' });
});

// ==========================================
// 4. Global Error Handler
// ==========================================
app.use(errorHandler);

export default app;

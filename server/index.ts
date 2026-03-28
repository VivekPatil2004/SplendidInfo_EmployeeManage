import { createServer } from 'http';
import { Server } from 'socket.io';
import cluster from 'cluster';
import os from 'os';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import { AuthPayload } from './middleware/auth';

const numCPUs = os.cpus().length;

if (cluster.isPrimary && env.NODE_ENV === 'production') {
  logger.info(`Primary process ${process.pid} is running. Setting up ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
    logger.info('Starting a new worker...');
    cluster.fork();
  });
} else {
  // Connect to the database inside the worker
  connectDB();

  const server = createServer(app);

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Required for cluster mode to work with Socket.io properly in multi-node setups
    // (requires Redis adapter if scaling across physical machines, but fine for multi-core single-machine if using sticky sessions at proxy)
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: No token provided'));
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      (socket as any).userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    socket.join(userId);

    socket.on('sendMessage', (data) => {
      io.to(data.receiverId).emit('newMessage', {
        ...data,
        senderId: userId,
      });
    });

    // --- WebRTC signaling logic ---
    socket.on('join-meeting', (roomId: string, userDetails) => {
      socket.join(roomId);
      // Let everyone else in the meeting room know we arrived
      socket.broadcast.to(roomId).emit('user-joined-meeting', {
        socketId: socket.id,
        userId,
        ...userDetails
      });

      socket.on('webrtc-offer', (data: { offer: RTCSessionDescriptionInit, to: string }) => {
        io.to(data.to).emit('webrtc-offer', { offer: data.offer, from: socket.id, userId, ...userDetails });
      });

      socket.on('webrtc-answer', (data: { answer: RTCSessionDescriptionInit, to: string }) => {
        io.to(data.to).emit('webrtc-answer', { answer: data.answer, from: socket.id });
      });

      socket.on('webrtc-ice-candidate', (data: { candidate: RTCIceCandidateInit, to: string }) => {
        io.to(data.to).emit('webrtc-ice-candidate', { candidate: data.candidate, from: socket.id });
      });
      
      // Meeting room chatting feature
      socket.on('meeting-message', (data: { message: string }) => {
         io.to(roomId).emit('meeting-message', {
             message: data.message,
             senderId: socket.id,
             userId,
             ...userDetails
         });
      });
    });

    // When connection is closing, inform remaining peers to remove their video elements
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        // Broadcast to all rooms (like meeting rooms) except the automatic user/socket rooms
        if (room !== socket.id && room !== userId) {
          socket.broadcast.to(room).emit('user-left-meeting', socket.id);
        }
      }
    });

    socket.on('disconnect', () => {
      // Clean up implicitly handled by Socket.IO
    });
  });

  const PORT = env.PORT;

  const httpServer = server.listen(PORT, () => {
    logger.info(`Worker ${process.pid} is listening on port ${PORT}`);
  });

  // ==========================================
  // Graceful Shutdown
  // ==========================================
  const shutdown = () => {
    logger.info(`Worker ${process.pid} gracefully shutting down from SIGINT/SIGTERM...`);
    
    // Stop accepting new connections
    httpServer.close(async () => {
      logger.info('HTTP server closed.');
      // Close Database Connection
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });

    // Force close after 10s if requests are hanging
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

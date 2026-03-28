import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineStatuses: Record<string, string>;
  sendMessage: (receiverId: string, message: unknown) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineStatuses: {},
  sendMessage: () => {},
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { userInfo, updateStatus } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userInfo?.token) {
      // Disconnect and clean up if user logs out
      setSocket((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      return;
    }

    // ── SECURITY: Pass JWT in socket handshake auth ──────────────────────────
    // The server-side Socket.IO auth middleware will verify this token.
    // If invalid/expired, the connection is rejected before any event is processed.
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: userInfo.token, // verified server-side — server extracts userId from this
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setSocket(newSocket);
      // NOTE: We no longer emit 'userOnline' with userId here.
      // The server now marks the user online automatically using the JWT payload
      // on socket connection (see server/index.ts socket 'connection' event).
    });

    newSocket.on('statusUpdate', ({ userId, onlineStatus }: { userId: string; onlineStatus: string }) => {
      setOnlineStatuses((prev) => ({ ...prev, [userId]: onlineStatus }));
      if (userId === userInfo._id) {
        updateStatus(onlineStatus);
      }
    });

    newSocket.on('connect_error', (err) => {
      // Connection errors include auth failures (JWT invalid/expired)
      console.warn('Socket connection error:', err.message);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [userInfo?._id, userInfo?.token]); // reconnect if token changes (after refresh)

  const sendMessage = (receiverId: string, message: unknown) => {
    if (socket && userInfo) {
      socket.emit('sendMessage', { receiverId, message });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineStatuses, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

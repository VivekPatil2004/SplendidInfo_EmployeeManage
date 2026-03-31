import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
  
  // Real-time Incoming Call State
  const [incomingCall, setIncomingCall] = useState<{ roomId: string; callerName: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!userInfo?.token) {
      setTimeout(() => {
        setSocket((prev) => {
          if (prev) prev.disconnect();
          return null;
        });
      }, 0);
      return;
    }

    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: userInfo.token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on('statusUpdate', ({ userId, onlineStatus }: { userId: string; onlineStatus: string }) => {
      setOnlineStatuses((prev) => ({ ...prev, [userId]: onlineStatus }));
      if (userId === userInfo._id) {
        updateStatus(onlineStatus);
      }
    });

    newSocket.on('newMessage', (data: { message?: { type?: string; meetingId?: string; callerName?: string } }) => {
      // Intercept special Real-time Call Commands mapped directly via universal sendMessage
      if (data?.message?.type === 'INCOMING_CALL' && data.message.meetingId && data.message.callerName) {
         // Don't ring if user is already in THAT meeting room
         if (!location.pathname.includes(`/meeting/${data.message.meetingId}`)) {
            setIncomingCall({
              roomId: data.message.meetingId,
              callerName: data.message.callerName,
            });
         }
      }
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    return () => {
      newSocket.disconnect();
      // Avoid calling setSocket(null) synchronously inside cleanup if it causes teardown issues, 
      // but usually state update in cleanup is ignored by React anyway.
    };
  }, [userInfo?._id, userInfo?.token, location.pathname, updateStatus]); 

  const sendMessage = (receiverId: string, message: unknown) => {
    if (socket && userInfo) {
      socket.emit('sendMessage', { receiverId, message });
    }
  };

  const acceptCall = () => {
    if (incomingCall) {
       navigate(`/meeting/${incomingCall.roomId}`);
       setIncomingCall(null);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineStatuses, sendMessage }}>
      {children}
      
      {/* Global Real-time Ringing / Incoming Call Modal overlay */}
      {incomingCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl shadow-indigo-500/20 text-center transform scale-100 animate-in zoom-in-95 duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-indigo-400 via-fuchsia-400 to-rose-400"></div>
               <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                  <span className="text-4xl animate-bounce">📱</span>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-75"></div>
               </div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Incoming Call</h3>
               <p className="text-slate-500 font-medium mt-2 mb-8">
                  <strong className="text-indigo-600 block text-lg font-bold">{incomingCall.callerName}</strong> 
                  is inviting you to a meeting!
               </p>
               <div className="flex items-center gap-4 justify-center">
                  <button 
                    onClick={() => setIncomingCall(null)}
                    className="flex-1 rounded-2xl bg-rose-50 text-rose-600 font-bold py-3.5 border border-rose-200 shadow-sm hover:bg-rose-100 transition-colors"
                  >
                     Decline
                  </button>
                  <button 
                    onClick={acceptCall}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold py-3.5 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
                  >
                     Accept Call
                  </button>
               </div>
           </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

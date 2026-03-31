/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface PeerDescriptor {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  pc: RTCPeerConnection;
}

export interface Message {
  senderId: string;
  name: string;
  message: string;
  time: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  name: string;
  left: number;
}

export interface RemoteMediaState {
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
}

export interface UseWebRTCReturn {
  socket: Socket | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, { stream: MediaStream; name: string }>;
  remoteMediaStates: Map<string, RemoteMediaState>;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  chatMessages: Message[];
  reactions: Reaction[];
  toggleVideo: () => void;
  toggleAudio: () => void;
  handleScreenShare: () => Promise<void>;
  sendMessage: (msg: string) => void;
  sendReaction: (emoji: string) => void;
  error: string | null;
}

export function useWebRTC(roomId: string | undefined, userInfo: any): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; name: string }>>(new Map());
  const [remoteMediaStates, setRemoteMediaStates] = useState<Map<string, RemoteMediaState>>(new Map());
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, PeerDescriptor>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const syncMediaStatus = useCallback((v: boolean, a: boolean, s: boolean) => {
    socketRef.current?.emit('webrtc-track-status', { isVideoOn: v, isAudioOn: a, isScreenSharing: s });
  }, []);

  const createPeerConnection = useCallback((socketId: string, name: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    peersRef.current.set(socketId, { socketId, userId: '', name, email: '', pc });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc-ice-candidate', { candidate: event.candidate, to: socketId });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const map = new Map(prev);
        map.set(socketId, { stream: event.streams[0], name });
        return map;
      });
      // Ping current status so the new peer knows
      setTimeout(() => {
        syncMediaStatus(
          localStreamRef.current?.getVideoTracks()[0]?.enabled ?? false,
          localStreamRef.current?.getAudioTracks()[0]?.enabled ?? false,
          false
        );
      }, 500);
    };

    return pc;
  }, [syncMediaStatus]);

  useEffect(() => {
    if (!userInfo || !roomId) return;

    const stored = localStorage.getItem('userInfo');
    const token = stored ? JSON.parse(stored).token : null;
    const socket = io(SOCKET_URL, {
      auth: { token },
    });
    socket.on('connect', () => {
      setSocketInstance(socket);
    });

    let localMediaStream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localMediaStream = stream;
      localStreamRef.current = stream;
      setLocalStream(stream);

      socket.emit('join-meeting', roomId, { name: userInfo.name, email: userInfo.email });

      socket.on('user-joined-meeting', async (user: any) => {
        const pc = createPeerConnection(user.socketId, user.name);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-offer', { offer, to: user.socketId });
      });

      socket.on('webrtc-offer', async (data: any) => {
        const pc = createPeerConnection(data.from, data.name);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', { answer, to: data.from });
      });

      socket.on('webrtc-answer', async (data: any) => {
        const peer = peersRef.current.get(data.from);
        if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      });

      socket.on('webrtc-ice-candidate', async (data: any) => {
        const peer = peersRef.current.get(data.from);
        if (peer && data.candidate) {
          await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socket.on('user-left-meeting', (socketId: string) => {
        const peer = peersRef.current.get(socketId);
        if (peer) {
          peer.pc.close();
          peersRef.current.delete(socketId);
          setRemoteStreams(prev => {
            const next = new Map(prev);
            next.delete(socketId);
            return next;
          });
          setRemoteMediaStates(prev => {
            const next = new Map(prev);
            next.delete(socketId);
            return next;
          });
        }
      });
      
      socket.on('webrtc-reaction', (data: any) => {
        const reactionId = Math.random().toString(36).substring(2, 9);
        const leftPos = 10 + Math.random() * 80;
        setReactions(prev => [...prev, { id: reactionId, emoji: data.reaction, name: data.name, left: leftPos }]);
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reactionId));
        }, 4000); // Overlay disappears after 4 seconds
      });

      socket.on('webrtc-track-status', (data: any) => {
        setRemoteMediaStates(prev => {
          const next = new Map(prev);
          next.set(data.from, { isVideoOn: data.isVideoOn, isAudioOn: data.isAudioOn, isScreenSharing: data.isScreenSharing });
          return next;
        });
      });

      socket.on('meeting-message', (data: any) => {
          setChatMessages(prev => [...prev, {
              senderId: data.senderId,
              name: data.name || data.email,
              message: data.message,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
      });

    }).catch(err => {
       console.error("Camera access denied", err);
       setError("Camera/Microphone access is required to join the meeting.");
    });
    
    // Copy ref to a constant for safe cleanup
    const safePeers = peersRef.current;

    return () => {
      safePeers.forEach(peer => peer.pc.close());
      if (localMediaStream) {
        localMediaStream.getTracks().forEach(track => track.stop());
      }
      socket.disconnect();
    };
  }, [roomId, userInfo, createPeerConnection]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const nextState = !isVideoOn;
      localStreamRef.current.getVideoTracks().forEach(track => (track.enabled = nextState));
      setIsVideoOn(nextState);
      syncMediaStatus(nextState, isAudioOn, isScreenSharing);
    }
  }, [isVideoOn, isAudioOn, isScreenSharing, syncMediaStatus]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const nextState = !isAudioOn;
      localStreamRef.current.getAudioTracks().forEach(track => (track.enabled = nextState));
      setIsAudioOn(nextState);
      syncMediaStatus(isVideoOn, nextState, isScreenSharing);
    }
  }, [isAudioOn, isVideoOn, isScreenSharing, syncMediaStatus]);

  const stopScreenSharing = useCallback(() => {
    if (localStreamRef.current) {
       const videoTrack = localStreamRef.current.getVideoTracks()[0];
       peersRef.current.forEach(peer => {
         const sender = peer.pc.getSenders().find(s => s.track?.kind === 'video');
         if (sender) sender.replaceTrack(videoTrack);
       });
       setLocalStream(localStreamRef.current);
       setIsScreenSharing(false);
       syncMediaStatus(isVideoOn, isAudioOn, false);
    }
  }, [isVideoOn, isAudioOn, syncMediaStatus]);

  const handleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        peersRef.current.forEach(peer => {
          const sender = peer.pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        
        setLocalStream(screenStream);
        setIsScreenSharing(true);
        syncMediaStatus(isVideoOn, isAudioOn, true);

        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } else {
        stopScreenSharing();
      }
    } catch (e) {
      console.error("Screen share failed", e);
    }
  }, [isScreenSharing, stopScreenSharing, isVideoOn, isAudioOn, syncMediaStatus]);

  const sendMessage = useCallback((msg: string) => {
    if (!msg.trim() || !socketRef.current) return;
    socketRef.current.emit('meeting-message', { message: msg.trim() });
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    socketRef.current?.emit('webrtc-reaction', { reaction: emoji });
  }, []);

  return {
    socket: socketInstance,
    localStream,
    remoteStreams,
    remoteMediaStates,
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    chatMessages,
    reactions,
    toggleVideo,
    toggleAudio,
    handleScreenShare,
    sendMessage,
    sendReaction,
    error
  };
}

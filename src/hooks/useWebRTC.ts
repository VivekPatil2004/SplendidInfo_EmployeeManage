import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Stable reference — keeps createPeerConnection's useCallback deps clean
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

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, { stream: MediaStream; name: string }>;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  chatMessages: Message[];
  toggleVideo: () => void;
  toggleAudio: () => void;
  handleScreenShare: () => Promise<void>;
  sendMessage: (msg: string) => void;
  error: string | null;
}

export function useWebRTC(roomId: string | undefined, userInfo: any): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; name: string }>>(new Map());
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, PeerDescriptor>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

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
    };

    return pc;
  }, []);

  useEffect(() => {
    if (!userInfo || !roomId) return;

    // Read token from 'userInfo' key — that's where the app stores the JWT
    const stored = localStorage.getItem('userInfo');
    const token = stored ? JSON.parse(stored).token : null;
    const socket = io(SOCKET_URL, {
      auth: { token },
    });
    socketRef.current = socket;

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
        }
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

    return () => {
      peersRef.current.forEach(peer => peer.pc.close());
      if (localMediaStream) {
        localMediaStream.getTracks().forEach(track => track.stop());
      }
      socket.disconnect();
    };
  }, [roomId, userInfo, createPeerConnection]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => (track.enabled = !isVideoOn));
      setIsVideoOn(!isVideoOn);
    }
  }, [isVideoOn]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => (track.enabled = !isAudioOn));
      setIsAudioOn(!isAudioOn);
    }
  }, [isAudioOn]);

  const stopScreenSharing = useCallback(() => {
    if (localStreamRef.current) {
       const videoTrack = localStreamRef.current.getVideoTracks()[0];
       peersRef.current.forEach(peer => {
         const sender = peer.pc.getSenders().find(s => s.track?.kind === 'video');
         if (sender) sender.replaceTrack(videoTrack);
       });
       setLocalStream(localStreamRef.current);
       setIsScreenSharing(false);
    }
  }, []);

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

        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } else {
        stopScreenSharing();
      }
    } catch (e) {
      console.error("Screen share failed", e);
    }
  }, [isScreenSharing, stopScreenSharing]);

  const sendMessage = useCallback((msg: string) => {
    if (!msg.trim() || !socketRef.current) return;
    socketRef.current.emit('meeting-message', { message: msg.trim() });
  }, []);

  return {
    localStream,
    remoteStreams,
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    chatMessages,
    toggleVideo,
    toggleAudio,
    handleScreenShare,
    sendMessage,
    error
  };
}

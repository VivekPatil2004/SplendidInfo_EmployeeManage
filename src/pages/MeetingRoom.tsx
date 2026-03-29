import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';

export default function MeetingRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  const {
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
  } = useWebRTC(roomId, userInfo);
  
  // UI Tabs State
  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants');
  const [newMessage, setNewMessage] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
       localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Navigate away on error
  useEffect(() => {
    if (error) {
      alert(error);
      navigate('/meetings');
    }
  }, [error, navigate]);

  const leaveCall = () => {
    navigate('/meetings');
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      sendMessage(newMessage.trim());
      setNewMessage('');
  };

  if (!userInfo) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">Authenticating...</div>;

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col md:flex-row text-white font-sans overflow-hidden">
      {/* Video Grid Section */}
      <div className="flex-1 flex flex-col bg-black relative">
        <div className="flex-1 p-4 grid gap-4 grid-cols-1 md:grid-cols-2 overflow-auto auto-rows-fr">
          
          {/* Local Camera */}
          <div className="relative bg-slate-800 rounded-2xl overflow-hidden shadow-xl aspect-video md:aspect-auto">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
              You {isScreenSharing ? '(Screen)' : ''}
              {!isAudioOn && <span className="text-rose-500">🔇</span>}
            </div>
          </div>

          {/* Remote Cameras */}
          {Array.from(remoteStreams.entries()).map(([socketId, remote]) => (
            <div key={socketId} className="relative bg-slate-800 rounded-2xl overflow-hidden shadow-xl aspect-video md:aspect-auto">
               <VideoFeed stream={remote.stream} />
               <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-200">
                  {remote.name}
               </div>
            </div>
          ))}

        </div>

        {/* Toolbar */}
        <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 px-6 z-10 w-full shrink-0">
           <button onClick={toggleAudio} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${isAudioOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-700'}`}>
              <span className="text-xl">{isAudioOn ? '🎤' : '🔇'}</span>
           </button>
           <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${isVideoOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-700'}`}>
              <span className="text-xl">{isVideoOn ? '📹' : '🚫'}</span>
           </button>
           <button onClick={handleScreenShare} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${isScreenSharing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-600'}`}>
              <span className="text-xl">🖥️</span>
           </button>
           <button onClick={leaveCall} className="px-6 h-12 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-sm font-bold tracking-wider uppercase transition-colors shadow-lg shadow-rose-600/20 ml-4">
              Leave
           </button>
        </div>
      </div>

      {/* Sidebar Overlay (Tabs) */}
      <div className="w-full md:w-80 h-1/2 md:h-full bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="flex p-2 gap-2 bg-slate-950">
             <button onClick={() => setActiveTab('participants')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'participants' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
                Participants ({remoteStreams.size + 1})
             </button>
             <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
                Chat
             </button>
          </div>

          {/* Participants Tab */}
          {activeTab === 'participants' && (
             <div className="flex-1 p-4 overflow-y-auto space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">{userInfo.name.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{userInfo.name} (You)</p>
                    </div>
                 </div>
                 {Array.from(remoteStreams.entries()).map(([sid, remote]) => (
                    <div key={sid} className="flex items-center gap-3 p-3 bg-slate-800/20 rounded-xl border border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-sm">{remote.name.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-300">{remote.name}</p>
                    </div>
                 </div>
                 ))}
             </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
             <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                   {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                         <span>No messages yet.</span>
                         <span>Start the conversation!</span>
                      </div>
                   ) : (
                     chatMessages.map((msg, idx) => (
                       <div key={idx} className={`flex flex-col ${msg.name === userInfo.name ? 'items-end' : 'items-start'}`}>
                           <p className="text-xs text-slate-400 mb-1">{msg.name} <span className="opacity-50 text-[10px] ml-1">{msg.time}</span></p>
                           <div className={`px-4 py-2 rounded-2xl text-sm ${msg.name === userInfo.name ? 'bg-indigo-600 rounded-br-none' : 'bg-slate-800 rounded-bl-none'}`}>
                              {msg.message}
                           </div>
                       </div>
                     ))
                   )}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 flex gap-2 shrink-0">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="px-4 bg-indigo-600 rounded-xl font-bold flex flex-col items-center justify-center disabled:opacity-50 text-xl overflow-hidden hover:bg-indigo-500 transition-colors">
                       »
                    </button>
                </form>
             </div>
          )}
      </div>
    </div>
  );
}

// Extracted component to safely render React Video Tracks
function VideoFeed({ stream }: { stream: MediaStream }) {
   const ref = useRef<HTMLVideoElement>(null);

   useEffect(() => {
      if (ref.current) ref.current.srcObject = stream;
   }, [stream]);

   return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover bg-black" />;
}

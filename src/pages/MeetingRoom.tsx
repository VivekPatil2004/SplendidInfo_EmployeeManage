import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import api from '../api';
import type { Employee } from '../data/employees';

export default function MeetingRoom() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const { onlineStatuses, sendMessage: sendSocketMessage } = useSocket();

  const {
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
  } = useWebRTC(roomId, userInfo);
  
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'invite' | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
       localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (error) {
      alert(error);
      navigate('/meetings');
    }
  }, [error, navigate]);

  useEffect(() => {
    api.get('/employees').then(res => setEmployees(res.data)).catch(console.error);
  }, []);

  const leaveCall = () => {
    navigate('/meetings');
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      sendMessage(newMessage.trim());
      setNewMessage('');
  };

  const inviteUser = (employee: Employee) => {
     sendSocketMessage(employee._id || employee.id?.toString() || '', {
        type: 'INCOMING_CALL',
        meetingId: roomId,
        callerName: userInfo?.name || 'A Colleague'
     });
     alert(`Called ${employee.firstName}! They will see a ringing notification.`);
  };

  const copyInvite = () => {
     const link = `${window.location.origin}/meeting/${roomId}`;
     navigator.clipboard.writeText(link);
     alert("Link Copied to Clipboard!");
  };

  const currentReactions = reactions;

  if (!userInfo) return <div className="min-h-screen w-full flex items-center justify-center bg-transparent">Authenticating...</div>;

  // Dynamic Grid Computation
  const participantsCount = remoteStreams.size + 1;
  let gridClass = "grid-cols-1";
  if (participantsCount === 2) gridClass = "grid-cols-1 md:grid-cols-2";
  else if (participantsCount > 2 && participantsCount <= 4) gridClass = "grid-cols-2";
  else if (participantsCount > 4 && participantsCount <= 6) gridClass = "grid-cols-3";
  else if (participantsCount > 6) gridClass = "grid-cols-3 md:grid-cols-4";

  return (
    <div className="relative h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Dynamic Animated Mesh Background */}
      <div className="absolute inset-0 bg-white/40 mix-blend-overlay z-[1] pointer-events-none"></div>
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-400/20 mix-blend-multiply filter blur-[100px] animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-amber-300/20 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
         <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-lg px-6 py-3 rounded-2xl flex items-center gap-4 pointer-events-auto">
             <div className="flex -space-x-2">
                 <div className="w-4 h-4 rounded-full bg-rose-500 animate-pulse border-2 border-white shadow-sm shadow-rose-500"></div>
             </div>
             <div>
                <h1 className="text-sm font-black tracking-wider text-slate-800 uppercase">Live Meeting</h1>
                <p className="text-xs font-bold text-slate-500">{roomId?.substring(0,8)}... | {participantsCount} Online</p>
             </div>
         </div>
      </div>

      {/* Main Video Stage */}
      <div className="absolute inset-0 z-10 p-6 pt-24 pb-32 flex items-center justify-center">
         <div className={`w-full h-full grid gap-6 transition-all duration-700 ${gridClass}`}>
            
            {/* Local Client Camera */}
            <div className={`relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/10 border-4 border-white/60 group`}>
                <video 
                   ref={localVideoRef} 
                   autoPlay 
                   playsInline 
                   muted 
                   className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`} 
                />
                {!isVideoOn && (
                   <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                       <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold text-white shadow-inner">
                          {userInfo.name.charAt(0)}
                       </div>
                   </div>
                )}
                <div className="absolute bottom-4 left-4 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-3 shadow-md border border-white/50 text-slate-800">
                    <span className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${!isAudioOn ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                      You {isScreenSharing ? '(Screen)' : ''}
                    </span>
                    {!isAudioOn && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-rose-500">
                         <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                         <path d="M15.932 7.757a.75.75 0 011.061 0 5.25 5.25 0 010 7.424.75.75 0 11-1.06-1.06 3.75 3.75 0 000-5.303.75.75 0 010-1.061z" />
                      </svg>
                    )}
                </div>
            </div>

            {/* Remote Streams */}
            {Array.from(remoteStreams.entries()).map(([socketId, remote]) => {
                const state = remoteMediaStates.get(socketId);
                return (
                  <div key={socketId} className={`relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/10 border-4 border-white/60`}>
                     <VideoFeed stream={remote.stream} isVideoOn={state?.isVideoOn ?? true} name={remote.name} />
                     <div className="absolute bottom-4 left-4 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-3 shadow-md border border-white/50 text-slate-800">
                         <span className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${state?.isAudioOn === false ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                           {remote.name}
                         </span>
                     </div>
                  </div>
                )
            })}
         </div>
      </div>

      {/* Floating Dock Interactions / Controls */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30 flex items-center justify-center gap-4 bg-white/70 backdrop-blur-xl border border-white px-8 py-4 rounded-[2rem] shadow-2xl shadow-indigo-500/20 shrink-0">
          
          <button 
             onClick={toggleAudio} 
             title="Toggle Audio"
             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md group border ${isAudioOn ? 'bg-white text-slate-600 hover:text-indigo-600 border-white hover:scale-105' : 'bg-rose-50 text-rose-600 border-rose-200 shadow-rose-500/30'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
             </svg>
          </button>
          
          <button 
             onClick={toggleVideo} 
             title="Toggle Video"
             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md group border ${isVideoOn ? 'bg-white text-slate-600 hover:text-indigo-600 border-white hover:scale-105' : 'bg-rose-50 text-rose-600 border-rose-200 shadow-rose-500/30'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
             </svg>
          </button>

          <button 
             onClick={handleScreenShare} 
             title="Share Screen"
             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md group border ${isScreenSharing ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-indigo-500/30' : 'bg-white text-slate-600 hover:text-indigo-600 border-white hover:scale-105'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                 <path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zM21 9.375A.375.375 0 0020.625 9h-7.5a.375.375 0 00-.375.375v5.25c0 .207.168.375.375.375h7.5a.375.375 0 00.375-.375v-5.25zm-6.75.375v4.5h6v-4.5h-6z" clipRule="evenodd" />
             </svg>
          </button>

          <div className="w-px h-10 bg-slate-200 mx-2"></div>
          
          <button 
             onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
             title="Open Chat"
             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md group border ${activeTab === 'chat' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-indigo-500/30' : 'bg-white text-slate-600 hover:text-indigo-600 border-white hover:scale-105'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
               <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
             </svg>
          </button>

          <button 
             onClick={() => setActiveTab(activeTab === 'participants' ? null : 'participants')}
             title="Participants"
             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md group border relative ${activeTab === 'participants' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-indigo-500/30' : 'bg-white text-slate-600 hover:text-indigo-600 border-white hover:scale-105'}`}
          >
              <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md border-2 border-white">{participantsCount}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                 <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
                 <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 016.576-2.462.75.75 0 01-.983.985 2.25 2.25 0 00-2.024 2.503zM21.11 19.349a9.687 9.687 0 01-1.764.44l-.115.04a.563.563 0 01-.373.487l-.01.121a3.75 3.75 0 016.576-2.462.75.75 0 01-.983.985 2.25 2.25 0 00-2.024 2.503a8.287 8.287 0 00-1.308-5.135z" />
              </svg>
          </button>

          <button 
             onClick={() => setActiveTab(activeTab === 'invite' ? null : 'invite')}
             title="Ring / Invite Colleagues"
             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md group border ${activeTab === 'invite' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-amber-500/30' : 'bg-white text-slate-600 hover:text-amber-600 border-white hover:scale-105'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
                <path fillRule="evenodd" d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z" clipRule="evenodd" />
             </svg>
          </button>

          {/* Quick Reactions */}
          <div className="w-px h-10 bg-slate-200 mx-2 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
             {['👍', '👏', '🎉', '❤️', '😂'].map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-xl bg-white rounded-xl shadow-sm border border-slate-100 hover:scale-110 hover:-translate-y-1 transition-all"
                >
                   {emoji}
                </button>
             ))}
          </div>

          <div className="w-px h-10 bg-slate-200 mx-2"></div>

          <button onClick={leaveCall} className="pr-6 pl-4 h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 flex items-center justify-center text-sm font-bold tracking-wider uppercase transition-all shadow-lg shadow-rose-500/30 text-white gap-2 border border-rose-400/50 hover:-translate-y-0.5">
             <span className="bg-white/20 p-1.5 rounded-xl block">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.696.579 1.01 0 .314-.152.69-.579 1.01a2.008 2.008 0 01-.921.383z" />
                  <path fillRule="evenodd" d="M12 22.5c-5.385 0-9.75-4.365-9.75-9.75s4.365-9.75 9.75-9.75 9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75zM12.75 3.03v.296A7.478 7.478 0 0118.966 9.4c.005.05.034.095.076.126l.243.181a.75.75 0 01.442.928 6.002 6.002 0 00-6.227 10.334V21c0 .034-.002.067-.004.1A8.25 8.25 0 1012.75 3.03z" clipRule="evenodd" />
               </svg>
             </span>
             End Call
          </button>
      </div>

      {/* Slide-out Drawer Tab */}
      <div 
         className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-40 bg-white/80 backdrop-blur-3xl shadow-2xl border-l border-white/50 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col ${activeTab ? 'translate-x-0' : 'translate-x-full'}`}
      >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">
               {activeTab === 'chat' && 'Room Chat'}
               {activeTab === 'participants' && 'Participants'}
               {activeTab === 'invite' && 'Ring Employees'}
             </h2>
             <button onClick={() => setActiveTab(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
             </button>
          </div>

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
             <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                   {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                         <span className="text-4xl mb-4">💬</span>
                         <span className="font-bold">No messages yet.</span>
                         <span className="text-sm">Start the conversation!</span>
                      </div>
                   ) : (
                     chatMessages.map((msg, idx) => (
                       <div key={idx} className={`flex flex-col ${msg.name === userInfo.name ? 'items-end' : 'items-start'}`}>
                           <p className="text-xs font-bold text-slate-400 mb-1">{msg.name} <span className="opacity-50 font-normal ml-1">{msg.time}</span></p>
                           <div className={`px-5 py-2.5 rounded-2xl text-sm font-medium shadow-sm ${msg.name === userInfo.name ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                              {msg.message}
                           </div>
                       </div>
                     ))
                   )}
                </div>
                <form onSubmit={handleSendMessage} className="p-6 bg-white/50 border-t border-slate-100 flex gap-3 shrink-0">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-sm"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="px-5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl font-bold flex flex-col items-center justify-center disabled:opacity-50 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                    </button>
                </form>
             </div>
          )}

          {/* PARTICIPANTS TAB */}
          {activeTab === 'participants' && (
             <div className="flex-1 p-6 overflow-y-auto space-y-4">
                 <button onClick={copyInvite} className="w-full mb-6 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.5 22.5a3 3 0 003-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 01-.712 1.321l-5.683-3.06a1.5 1.5 0 00-1.422 0l-5.683 3.06a.75.75 0 01-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 003 3h15z" /><path d="M1.5 9.589v-.745a3 3 0 011.57-2.641l7.5-4.039a3 3 0 012.86 0l7.5 4.039a3 3 0 011.57 2.641v.745l-8.426 4.926a1.5 1.5 0 01-1.548 0L1.5 9.589z" /></svg>
                    Share / Copy Invite Link
                 </button>

                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2">In Meeting</h3>

                 <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                    <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center font-black text-white text-lg border-2 border-white shadow-md">{userInfo.name.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{userInfo.name} <span className="text-xs font-semibold text-slate-400 ml-1">(You)</span></p>
                    </div>
                    <div className="flex gap-2 text-slate-400">
                       {(!isAudioOn) && <span className="text-rose-500">🔇</span>}
                    </div>
                 </div>

                 {Array.from(remoteStreams.entries()).map(([sid, remote]) => {
                    const state = remoteMediaStates.get(sid);
                    return (
                        <div key={sid} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                        <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-white text-lg border-2 border-white shadow-md">{remote.name.charAt(0)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{remote.name}</p>
                        </div>
                        <div className="flex gap-2 text-slate-400">
                          {(state?.isAudioOn === false) && <span title="Muted" className="text-rose-500">🔇</span>}
                          {(state?.isVideoOn === false) && <span title="Video Off" className="text-slate-400">🚫</span>}
                        </div>
                     </div>
                    )
                 })}
             </div>
          )}

          {/* INVITE TAB (RING FEATURE) */}
          {activeTab === 'invite' && (
             <div className="flex-1 p-6 overflow-y-auto space-y-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 mb-4">Enterprise Directory</h3>
                 
                 {employees.length === 0 && <p className="text-sm text-slate-500">Loading directory...</p>}
                 {employees.filter(emp => String(emp._id || emp.id) !== String(userInfo._id)).map(emp => {
                     const isOnline = onlineStatuses[String(emp._id || emp.id)] === 'online';
                     return (
                        <div key={String(emp._id || emp.id)} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative w-12 h-12 rounded-[1rem] bg-slate-100 flex items-center justify-center font-black text-slate-500 text-lg border-2 border-white shadow-sm">
                               {emp.firstName.charAt(0)}
                               <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs font-medium text-slate-400 truncate">{emp.role}</p>
                            </div>
                            
                            <button 
                               onClick={() => isOnline ? inviteUser(emp) : alert('User is offline!')}
                               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isOnline ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200' : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'}`}
                            >
                               {isOnline ? 'Ring 🔔' : 'Offline'}
                            </button>
                        </div>
                     );
                 })}
             </div>
          )}
      </div>

      {/* Floating Reaction Effects rendering Engine */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
         {currentReactions.map((reaction) => (
             <div 
               key={reaction.id} 
               className="absolute bottom-32 left-1/2 -ml-6 text-6xl animate-float-up"
               style={{
                  left: `${reaction.left}%`, // random horizontal spread
               }}
             >
                {reaction.emoji}
                <div className="text-[10px] font-bold bg-black/50 text-white rounded-full px-2 py-0.5 mt-1 text-center backdrop-blur-sm -ml-4 w-max">
                  {reaction.name}
                </div>
             </div>
         ))}
      </div>

    </div>
  );
}

function VideoFeed({ stream, isVideoOn, name }: { stream: MediaStream, isVideoOn: boolean, name: string }) {
   const ref = useRef<HTMLVideoElement>(null);

   useEffect(() => {
      if (ref.current) ref.current.srcObject = stream;
   }, [stream]);

   return (
      <>
        <video 
           ref={ref} 
           autoPlay 
           playsInline 
           className={`w-full h-full object-cover transition-opacity duration-300 ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`} 
        />
        {!isVideoOn && (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-800 pointer-events-none">
               <div className="w-24 h-24 rounded-[2rem] bg-slate-700 flex items-center justify-center text-5xl font-black text-white shadow-inner">
                  {name.charAt(0)}
               </div>
           </div>
        )}
      </>
   );
}

import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';

interface ChatUser {
  _id: string;
  name: string;
  email: string;
  onlineStatus: string;
}

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: string;
}

export default function Chat() {
  const { userInfo } = useAuth();
  const { socket, onlineStatuses } = useSocket();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/chat/users').then(r => setUsers(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    api.get(`/chat/${selectedUser._id}`).then(r => setMessages(r.data)).catch(console.error);
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: Message) => {
      if (
        (msg.senderId === selectedUser?._id && msg.receiverId === userInfo?._id) ||
        (msg.senderId === userInfo?._id && msg.receiverId === selectedUser?._id)
      ) {
        setMessages(prev => [...prev, msg]);
      }
    };
    socket.on('newMessage', handler);
    return () => { socket.off('newMessage', handler); };
  }, [socket, selectedUser, userInfo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedUser || !userInfo) return;
    try {
      const { data } = await api.post('/chat', { receiverId: selectedUser._id, content: newMsg.trim() });
      setMessages(prev => [...prev, data]);
      socket?.emit('sendMessage', { receiverId: selectedUser._id, message: data });
      setNewMsg('');
    } catch (err) { console.error(err); }
  };


  const filteredUsers = users.filter(u =>
    (u.name || u.email).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      {/* Users list */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800 mb-3">Messages</h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredUsers.map(u => {
            const liveStatus = onlineStatuses[u._id] || u.onlineStatus;
            return (
              <button
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors
                  ${selectedUser?._id === u._id ? 'bg-indigo-50' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {(u.name || u.email).slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white
                    ${liveStatus === 'online' ? 'bg-emerald-500' :
                      liveStatus === 'away' ? 'bg-amber-500' :
                      liveStatus === 'busy' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-sm truncate">{u.name || u.email}</p>
                  <p className="text-xs text-slate-400 capitalize">{liveStatus}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {(selectedUser.name || selectedUser.email).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-800">{selectedUser.name || selectedUser.email}</p>
                <StatusBadge status={onlineStatuses[selectedUser._id] || selectedUser.onlineStatus} size="sm" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 mt-20">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="font-semibold">No messages yet. Say hi!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === userInfo?._id;
                  return (
                    <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 shadow-sm
                        ${isMe
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        {msg.createdAt && (
                          <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {format(new Date(msg.createdAt), 'hh:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 p-4 flex items-center gap-3">
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`Message ${selectedUser.name || selectedUser.email}...`}
                className="flex-1 rounded-xl bg-slate-50 border border-slate-200 py-3 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <button
                onClick={sendMessage}
                disabled={!newMsg.trim()}
                className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="text-7xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-slate-600 mb-1">Select a conversation</h2>
            <p className="text-sm">Choose a person from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

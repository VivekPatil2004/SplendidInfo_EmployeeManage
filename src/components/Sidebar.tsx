import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';

const navItems = [
  { to: '/',           label: 'Dashboard',  icon: '🏠', exact: true },
  { to: '/chat',       label: 'Chat',        icon: '💬' },
  { to: '/meetings',   label: 'Meetings',    icon: '📅' },
  { to: '/calendar',   label: 'Calendar',    icon: '🗓️' },
  { to: '/attendance', label: 'Attendance',  icon: '⏱️' },
  { to: '/leave',      label: 'Leave',       icon: '🌴' },
];

const adminItems = [
  { to: '/admin', label: 'Admin Panel', icon: '⚙️' },
];

const statusOptions = ['online', 'away', 'busy', 'offline'];
const statusColors: Record<string, string> = {
  online: 'bg-emerald-400', away: 'bg-amber-400', busy: 'bg-rose-400', offline: 'bg-slate-500'
};
const statusRingColors: Record<string, string> = {
  online: 'ring-emerald-400', away: 'ring-amber-400', busy: 'ring-rose-400', offline: 'ring-slate-500'
};

export default function Sidebar() {
  const { userInfo, logout, updateStatus } = useAuth();
  const { socket } = useSocket();
  const [collapsed, setCollapsed] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleStatusChange = async (status: string) => {
    setShowStatusMenu(false);
    updateStatus(status);
    try { await api.patch('/auth/status', { onlineStatus: status }); } catch {}
    if (socket && userInfo) {
      socket.emit('changeStatus', { userId: userInfo._id, onlineStatus: status });
    }
  };

  const currentStatus = userInfo?.onlineStatus || 'online';
  const initials = (userInfo?.name || userInfo?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 bg-slate-900 transition-all duration-300 shadow-2xl ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ minWidth: collapsed ? '4rem' : '16rem' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="h-9 w-9 rounded-xl flex-shrink-0 bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-black text-sm shadow-lg">
          S
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-black text-white text-sm leading-tight truncate">Splendidinfo</p>
            <p className="text-xs text-slate-400 truncate">Employee Portal</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="ml-auto p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group
               ${isActive
                 ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/20'
                 : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'}`
            }
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        {userInfo?.role === 'admin' && (
          <>
            {!collapsed && (
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider px-3 pt-4 pb-1">Admin</p>
            )}
            {adminItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                   ${isActive
                     ? 'bg-rose-500/20 text-rose-300 shadow-sm border border-rose-500/20'
                     : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'}`
                }
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User area */}
      <div className={`border-t border-slate-700/50 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : ''}`}>
          {/* Avatar + status dot */}
          <div className="relative flex-shrink-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <button
              onClick={() => setShowStatusMenu(p => !p)}
              title="Change status"
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${statusColors[currentStatus]} cursor-pointer hover:scale-110 transition-transform`}
            />
            {showStatusMenu && (
              <div className={`absolute ${collapsed ? 'left-10 bottom-0' : 'bottom-10 left-0'} bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-1.5 z-50 min-w-[140px]`}>
                {statusOptions.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 capitalize font-medium transition-colors"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${statusColors[s]}`} />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-100 truncate">{userInfo?.name || userInfo?.email}</p>
              <p className={`text-xs capitalize truncate font-medium ${statusRingColors[currentStatus].replace('ring-', 'text-')}`}>{currentStatus}</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={logout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all hover:border-rose-500/40"
          >
            <span>🚪</span> Logout
          </button>
        )}
      </div>
    </aside>
  );
}

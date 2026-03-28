import { useEffect, useState } from 'react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';

type TabType = 'overview' | 'employees' | 'attendance' | 'leave' | 'meetings';

interface TodayRecord {
  user: { _id: string; name: string; email: string; onlineStatus: string; role: string };
  attendance: { loginTime?: string; logoutTime?: string; totalHours?: number } | null;
  status: string;
}

interface LeaveReq {
  _id: string;
  userId: { name: string; email: string };
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  adminComment?: string;
}

interface Meeting {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  organizer: { name: string; email: string };
  participants: { name: string; email: string }[];
}

export default function AdminPanel() {
  const [tab, setTab] = useState<TabType>('overview');
  const [todayData, setTodayData] = useState<TodayRecord[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveReq[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [todayRes, leavesRes, meetingsRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/leave/all'),
        api.get('/meetings/all'),
      ]);
      setTodayData(todayRes.data);
      setAllLeaves(leavesRes.data);
      setAllMeetings(meetingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      await api.put(`/leave/${id}`, { status, adminComment: comment || '' });
      setActionMsg(`Leave ${status} successfully`);
      fetchAll();
      setTimeout(() => setActionMsg(''), 3000);
    } catch {}
  };

  const onlineCount = todayData.filter(r => r.user.onlineStatus === 'online').length;
  const presentCount = todayData.filter(r => r.status === 'present').length;
  const leaveCount = todayData.filter(r => r.status === 'leave').length;
  const absentCount = todayData.filter(r => r.status === 'absent').length;
  const pendingLeaves = allLeaves.filter(l => l.status === 'pending').length;
  const todayMeetings = allMeetings.filter(m => m.startTime?.startsWith(new Date().toISOString().split('T')[0])).length;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview',   label: 'Overview',    icon: '📊' },
    { id: 'employees',  label: 'Employees',   icon: '👥' },
    { id: 'attendance', label: 'Attendance',  icon: '⏱️' },
    { id: 'leave',      label: 'Leave',       icon: '🌴' },
    { id: 'meetings',   label: 'Meetings',    icon: '📅' },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 pb-1">Admin Panel</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage all employee data, attendance, leaves & meetings</p>
        </div>

        {actionMsg && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold animate-fade-in">
            ✅ {actionMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 glass-panel p-1.5 rounded-2xl w-fit !translate-y-0 hover:!translate-y-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150
                ${tab === t.id ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {t.id === 'leave' && pendingLeaves > 0 && (
                <span className="relative inline-flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-rose-500 text-white text-xs font-bold">{pendingLeaves}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {[
                    { label: 'Total', value: todayData.length, color: 'from-indigo-500 to-indigo-700', icon: '👥' },
                    { label: 'Online Now', value: onlineCount, color: 'from-emerald-500 to-emerald-700', icon: '🟢' },
                    { label: 'Present Today', value: presentCount, color: 'from-blue-500 to-blue-700', icon: '✅' },
                    { label: 'Absent', value: absentCount, color: 'from-slate-500 to-slate-700', icon: '❌' },
                    { label: 'On Leave', value: leaveCount, color: 'from-amber-500 to-amber-700', icon: '🌴' },
                    { label: "Today's Meetings", value: todayMeetings, color: 'from-purple-500 to-purple-700', icon: '📅' },
                  ].map(card => (
                    <div key={card.label} className={`relative bg-gradient-to-br ${card.color} text-white rounded-2xl p-5 shadow-lg overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] rounded-2xl" />
                      <div className="relative z-10">
                        <div className="text-2xl mb-1">{card.icon}</div>
                        <div className="text-3xl font-black">{card.value}</div>
                        <div className="text-xs font-semibold opacity-90 mt-1">{card.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick employee list */}
                <div className="glass-panel rounded-2xl overflow-hidden !translate-y-0 hover:!translate-y-0">
                  <div className="px-6 py-4 border-b border-slate-100/60">
                    <h2 className="font-bold text-slate-800">Today's Status</h2>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {todayData.slice(0, 8).map(rec => (
                      <div key={rec.user._id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-indigo-50/40 transition-colors">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(rec.user.name || rec.user.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{rec.user.name || rec.user.email}</p>
                          <p className="text-xs text-slate-400 truncate">{rec.user.email}</p>
                        </div>
                        <StatusBadge status={rec.user.onlineStatus} size="sm" />
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg capitalize
                          ${rec.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                            rec.status === 'leave' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-100 text-slate-500'}`}>
                          {rec.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Employees */}
            {tab === 'employees' && (
              <div className="glass-panel rounded-2xl overflow-hidden !translate-y-0 hover:!translate-y-0">
                <div className="px-6 py-4 border-b border-slate-100/60">
                  <h2 className="font-bold text-slate-800">All Employees — Live Status</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/40 text-xs text-slate-500 uppercase tracking-wider backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Employee</th>
                        <th className="px-6 py-3 text-left font-semibold">Status</th>
                        <th className="px-6 py-3 text-left font-semibold">Attendance</th>
                        <th className="px-6 py-3 text-left font-semibold">Login Time</th>
                        <th className="px-6 py-3 text-left font-semibold">Logout Time</th>
                        <th className="px-6 py-3 text-left font-semibold">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                      {todayData.map(rec => (
                        <tr key={rec.user._id} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {(rec.user.name || rec.user.email).slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{rec.user.name || '—'}</p>
                                <p className="text-xs text-slate-400">{rec.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3"><StatusBadge status={rec.user.onlineStatus} size="sm" /></td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg capitalize
                              ${rec.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                                rec.status === 'leave' ? 'bg-amber-50 text-amber-700' :
                                'bg-slate-100 text-slate-500'}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-600 font-mono text-xs">
                            {rec.attendance?.loginTime ? format(new Date(rec.attendance.loginTime), 'hh:mm a') : '—'}
                          </td>
                          <td className="px-6 py-3 text-slate-600 font-mono text-xs">
                            {rec.attendance?.logoutTime ? format(new Date(rec.attendance.logoutTime), 'hh:mm a') : '—'}
                          </td>
                          <td className="px-6 py-3 text-slate-600 text-xs font-semibold">
                            {rec.attendance?.totalHours ? `${rec.attendance.totalHours}h` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attendance */}
            {tab === 'attendance' && (
              <div className="glass-panel rounded-2xl overflow-hidden !translate-y-0 hover:!translate-y-0">
                <div className="px-6 py-4 border-b border-slate-100/60">
                  <h2 className="font-bold text-slate-800">Today's Attendance Report</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/40 text-xs text-slate-500 uppercase tracking-wider backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Employee</th>
                        <th className="px-6 py-3 text-left font-semibold">Attendance</th>
                        <th className="px-6 py-3 text-left font-semibold">Login</th>
                        <th className="px-6 py-3 text-left font-semibold">Logout</th>
                        <th className="px-6 py-3 text-left font-semibold">Total Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                      {todayData.map(rec => (
                        <tr key={rec.user._id} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="px-6 py-3 font-semibold text-slate-800">{rec.user.name || rec.user.email}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize
                              ${rec.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                rec.status === 'leave' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-50 text-red-600'}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-mono text-slate-600 text-xs">
                            {rec.attendance?.loginTime ? format(new Date(rec.attendance.loginTime), 'hh:mm:ss a') : '—'}
                          </td>
                          <td className="px-6 py-3 font-mono text-slate-600 text-xs">
                            {rec.attendance?.logoutTime ? format(new Date(rec.attendance.logoutTime), 'hh:mm:ss a') : 'Still Active'}
                          </td>
                          <td className="px-6 py-3 font-semibold text-slate-700">
                            {rec.attendance?.totalHours ? `${rec.attendance.totalHours} hrs` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Leave Requests */}
            {tab === 'leave' && (
              <div className="space-y-4">
                {allLeaves.length === 0 ? (
                  <div className="glass-panel text-center py-16 text-slate-500 rounded-2xl !translate-y-0 hover:!translate-y-0">
                    <div className="text-5xl mb-3">🌴</div>
                    <p className="font-semibold">No leave requests found</p>
                  </div>
                ) : (
                  allLeaves.map(leave => (
                    <div key={leave._id} className="glass-panel rounded-2xl p-5 !translate-y-0 hover:!translate-y-0">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-white font-bold text-xs">
                              {(leave.userId?.name || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{leave.userId?.name || leave.userId?.email}</p>
                              <p className="text-xs text-slate-400">{leave.userId?.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold capitalize">{leave.type}</span>
                            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                              {leave.startDate} → {leave.endDate}
                            </span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold capitalize
                              ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'}`}>
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 italic">"{leave.reason}"</p>
                        </div>
                        {leave.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleLeaveAction(leave._id, 'approved')}
                              className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleLeaveAction(leave._id, 'rejected', 'Not approved by admin')}
                              className="px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Meetings */}
            {tab === 'meetings' && (
              <div className="space-y-4">
                {allMeetings.length === 0 ? (
                  <div className="glass-panel text-center py-16 text-slate-500 rounded-2xl !translate-y-0 hover:!translate-y-0">
                    <div className="text-5xl mb-3">📅</div>
                    <p className="font-semibold">No meetings found</p>
                  </div>
                ) : (
                  allMeetings.map(m => (
                    <div key={m._id} className="glass-panel rounded-2xl p-5 !translate-y-0 hover:!translate-y-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-slate-800 mb-1">{m.title}</h3>
                          <p className="text-sm text-slate-500 mb-2">
                            📍 {m.location} &nbsp;|&nbsp; 🕐 {format(new Date(m.startTime), 'MMM d, yyyy hh:mm a')}
                          </p>
                          <p className="text-xs text-slate-400">
                            Organizer: <span className="font-semibold text-slate-600">{m.organizer?.name || m.organizer?.email}</span>
                            &nbsp;·&nbsp; {m.participants?.length} participant(s)
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0
                          ${m.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                            m.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-500'}`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

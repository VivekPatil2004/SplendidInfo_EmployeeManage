import { useEffect, useState } from 'react';
import api from '../api';
import { format } from 'date-fns';

interface AttendanceLog {
  _id: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  totalHours?: number;
  status: string;
}

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/me').then(r => setLogs(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const presentDays = logs.filter(l => l.status === 'present').length;
  const leaveDays = logs.filter(l => l.status === 'leave').length;
  const avgHours = logs.filter(l => l.totalHours && l.totalHours > 0).length > 0
    ? (logs.reduce((sum, l) => sum + (l.totalHours || 0), 0) / logs.filter(l => l.totalHours && l.totalHours > 0).length).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800">My Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">Your login/logout history and working hours</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Days Present', value: presentDays, color: 'from-emerald-500 to-emerald-600', icon: '✅' },
            { label: 'Days on Leave', value: leaveDays, color: 'from-amber-500 to-amber-600', icon: '🌴' },
            { label: 'Avg. Hours/Day', value: `${avgHours}h`, color: 'from-indigo-500 to-indigo-600', icon: '⏱️' },
          ].map(card => (
            <div key={card.label} className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-5 shadow-md`}>
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="text-3xl font-black">{card.value}</div>
              <div className="text-xs font-semibold opacity-80 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Attendance History</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-3">⏱️</div>
              <p className="font-semibold">No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Login Time</th>
                    <th className="px-6 py-3 text-left font-semibold">Logout Time</th>
                    <th className="px-6 py-3 text-left font-semibold">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-800">
                        {format(new Date(log.date), 'EEE, MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize
                          ${log.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                            log.status === 'leave' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-500'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-600 text-xs">
                        {log.loginTime ? format(new Date(log.loginTime), 'hh:mm:ss a') : '—'}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-600 text-xs">
                        {log.logoutTime ? format(new Date(log.logoutTime), 'hh:mm:ss a') : 'Still Active'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-700">
                        {log.totalHours ? `${log.totalHours} hrs` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

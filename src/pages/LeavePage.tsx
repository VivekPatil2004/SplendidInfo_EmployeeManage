import { useEffect, useState } from 'react';
import api from '../api';

interface LeaveReq {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  adminComment?: string;
  createdAt: string;
}

const emptyForm = { type: 'casual', startDate: '', endDate: '', reason: '' };
const leaveTypes = ['casual', 'sick', 'annual', 'other'];

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveReq[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLeaves = () => {
    api.get('/leave/me').then(r => setLeaves(r.data)).catch(console.error);
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/leave', form);
      setSuccess('Leave request submitted successfully!');
      setShowForm(false);
      setForm(emptyForm);
      fetchLeaves();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      setError(((err as {response?: {data?: {message?: string}}}).response?.data?.message) || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this leave request?')) return;
    try { await api.delete(`/leave/${id}`); fetchLeaves(); } catch {}
  };

  const approved = leaves.filter(l => l.status === 'approved').length;
  const pending = leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Leave Requests</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your time-off requests</p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition-colors shadow-md"
          >
            🌴 Request Leave
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: leaves.length, color: 'from-indigo-500 to-indigo-600', icon: '📋' },
            { label: 'Approved', value: approved, color: 'from-emerald-500 to-emerald-600', icon: '✅' },
            { label: 'Pending', value: pending, color: 'from-amber-500 to-amber-600', icon: '⏳' },
          ].map(card => (
            <div key={card.label} className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-5 shadow-md`}>
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="text-3xl font-black">{card.value}</div>
              <div className="text-xs font-semibold opacity-80 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {success && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold">
            ✅ {success}
          </div>
        )}

        {/* Request form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="font-bold text-slate-800 mb-5 text-lg">New Leave Request</h2>
            {error && <p className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Leave Type *</label>
                <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {leaveTypes.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div />
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Start Date *</label>
                <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">End Date *</label>
                <input required type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Reason *</label>
                <textarea required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3} placeholder="Brief reason for your leave..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Leave list */}
        <div className="space-y-4">
          {leaves.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <div className="text-5xl mb-3">🌴</div>
              <p className="font-semibold">No leave requests yet</p>
            </div>
          ) : (
            leaves.map(leave => (
              <div key={leave._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold capitalize">{leave.type}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold capitalize ${statusColor[leave.status] || 'bg-slate-100 text-slate-500'}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      📅 {leave.startDate} → {leave.endDate}
                    </p>
                    <p className="text-sm text-slate-500 italic">"{leave.reason}"</p>
                    {leave.adminComment && (
                      <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <span className="font-semibold">Admin note:</span> {leave.adminComment}
                      </p>
                    )}
                  </div>
                  {leave.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(leave._id)}
                      className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex-shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  meetingLink?: string;
  organizer: { _id: string; name: string; email: string };
  participants: { _id: string; name: string; email: string }[];
}

interface ChatUser {
  _id: string;
  name: string;
  email: string;
}

const emptyForm = {
  title: '', description: '', startTime: '', endTime: '',
  location: 'Online', participants: [] as string[],
};

export default function Meetings() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const endpoint = userInfo?.role === 'admin' ? '/meetings/all' : '/meetings';
      const { data } = await api.get(endpoint);
      setMeetings(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMeetings();
    api.get('/chat/users').then(r => setUsers(r.data)).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/meetings', form);
      setShowForm(false);
      setForm(emptyForm);
      fetchMeetings();
    } catch (err: unknown) {
      setError(((err as {response?: {data?: {message?: string}}}).response?.data?.message) || 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this meeting?')) return;
    try { await api.delete(`/meetings/${id}`); fetchMeetings(); } catch (err) { console.error(err); }
  };

  const toggleParticipant = (uid: string) => {
    setForm(f => ({
      ...f,
      participants: f.participants.includes(uid)
        ? f.participants.filter(p => p !== uid)
        : [...f.participants, uid],
    }));
  };

  const upcoming = meetings.filter(m => new Date(m.startTime) > new Date() && m.status === 'scheduled');
  const past = meetings.filter(m => new Date(m.startTime) <= new Date() || m.status !== 'scheduled');

  const MeetingCard = ({ m }: { m: Meeting }) => {
    const isOrganizer = m.organizer?._id === userInfo?._id;
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{m.title}</h3>
            {m.description && <p className="text-sm text-slate-500 mt-1">{m.description}</p>}
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0
            ${m.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
              m.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
              'bg-slate-100 text-slate-500'}`}>
            {m.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium mb-3">
          <div className="flex items-center gap-1.5"><span>📅</span>{format(new Date(m.startTime), 'MMM d, yyyy')}</div>
          <div className="flex items-center gap-1.5"><span>🕐</span>{format(new Date(m.startTime), 'hh:mm a')} – {format(new Date(m.endTime), 'hh:mm a')}</div>
          <div className="flex items-center gap-1.5"><span>📍</span>{m.location}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">By <span className="font-semibold text-slate-600">{m.organizer?.name || m.organizer?.email}</span></p>
            {m.participants?.length > 0 && (
              <span className="text-xs text-slate-400">· {m.participants.length} participant{m.participants.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {m.status === 'scheduled' && (
              <button
                onClick={() => navigate(`/meeting/${m._id}`)}
                className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-bold px-4 py-1.5 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
              >
                Join Call
              </button>
            )}
            {(isOrganizer || userInfo?.role === 'admin') && (
              <button
                onClick={() => handleDelete(m._id)}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-1.5 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Meetings</h1>
            <p className="text-slate-500 text-sm mt-1">{meetings.length} total meetings</p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
          >
            <span>+</span> Schedule Meeting
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="font-bold text-slate-800 mb-5 text-lg">New Meeting</h2>
            {error && <p className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Start Time *</label>
                <input required type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">End Time *</label>
                <input required type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Participants</label>
                <div className="flex flex-wrap gap-2">
                  {users.map(u => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => toggleParticipant(u._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                        ${form.participants.includes(u._id)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                    >
                      {u.name || u.email}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {submitting ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase text-slate-500 tracking-wider mb-4">Upcoming ({upcoming.length})</h2>
                <div className="grid gap-4">{upcoming.map(m => <MeetingCard key={m._id} m={m} />)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase text-slate-500 tracking-wider mb-4">Past ({past.length})</h2>
                <div className="grid gap-4 opacity-70">{past.map(m => <MeetingCard key={m._id} m={m} />)}</div>
              </section>
            )}
            {meetings.length === 0 && (
              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <div className="text-5xl mb-3">📅</div>
                <p className="font-semibold">No meetings yet. Schedule your first one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

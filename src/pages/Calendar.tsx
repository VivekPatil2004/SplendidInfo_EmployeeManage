import { useEffect, useState } from 'react';
import api from '../api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

interface Meeting {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  location: string;
  organizer: { name: string; email: string };
}

interface LeaveReq {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [leaves, setLeaves] = useState<LeaveReq[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/meetings'),
      api.get('/leave/me'),
    ]).then(([mRes, lRes]) => {
      setMeetings(mRes.data);
      setLeaves(lRes.data.filter((l: LeaveReq) => l.status === 'approved'));
    }).catch(console.error);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad beginning
  const startPad = monthStart.getDay();
  const padDays = Array.from({ length: startPad }, (_, i) => i);

  const getMeetingsForDay = (day: Date) =>
    meetings.filter(m => isSameDay(new Date(m.startTime), day));

  const getLeavesForDay = (day: Date) =>
    leaves.filter(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return day >= start && day <= end;
    });

  const selectedMeetings = selectedDay ? getMeetingsForDay(selectedDay) : [];
  const selectedLeaves = selectedDay ? getLeavesForDay(selectedDay) : [];

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Calendar</h1>
            <p className="text-slate-500 text-sm mt-1">Your meetings and approved leaves</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-slate-600 font-bold">‹</button>
            <h2 className="text-lg font-bold text-slate-800 w-36 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={nextMonth} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-slate-600 font-bold">›</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-indigo-500" />Meeting</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500" />Leave</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-emerald-600" />Today</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS.map(d => (
              <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {padDays.map(i => <div key={`pad-${i}`} className="h-24 border-b border-r border-slate-50" />)}
            {days.map(day => {
              const dayMeetings = getMeetingsForDay(day);
              const dayLeaves = getLeavesForDay(day);
              const today = isToday(day);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`h-24 border-b border-r border-slate-50 p-1.5 cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden
                    ${isSelected ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300' : ''}`}
                >
                  <div className={`text-sm font-bold mb-1 h-6 w-6 flex items-center justify-center rounded-full
                    ${today ? 'bg-emerald-500 text-white' : 'text-slate-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayMeetings.slice(0, 2).map(m => (
                      <div key={m._id} className="text-xs bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5 truncate font-medium">
                        📅 {m.title}
                      </div>
                    ))}
                    {dayLeaves.slice(0, 1).map(l => (
                      <div key={l._id} className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 truncate font-medium">
                        🌴 {l.type} leave
                      </div>
                    ))}
                    {(dayMeetings.length + dayLeaves.length) > 3 && (
                      <div className="text-xs text-slate-400 font-medium px-1">+{dayMeetings.length + dayLeaves.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && (selectedMeetings.length > 0 || selectedLeaves.length > 0) && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 text-lg">
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-3">
              {selectedMeetings.map(m => (
                <div key={m._id} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="font-bold text-indigo-800">{m.title}</p>
                    <p className="text-xs text-indigo-600">
                      {format(new Date(m.startTime), 'hh:mm a')} – {format(new Date(m.endTime), 'hh:mm a')} · {m.location}
                    </p>
                  </div>
                  <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full capitalize
                    ${m.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {m.status}
                  </span>
                </div>
              ))}
              {selectedLeaves.map(l => (
                <div key={l._id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-2xl">🌴</span>
                  <div>
                    <p className="font-bold text-amber-800 capitalize">{l.type} Leave</p>
                    <p className="text-xs text-amber-600">{l.startDate} → {l.endDate}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Approved</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Employee } from "../data/employees";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  const [emp, setEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        // Find employee among all (or hit a specific /:id endpoint if created. using global list array find equivalent for ease)
        const { data } = await api.get('/employees');
        const found = data.find((e: Employee) => String(e._id || e.id) === String(id));
        setEmp(found || null);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (!emp) return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-transparent">
      <div className="text-center glass-panel p-10 rounded-3xl">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Employee Not Found</h2>
        <p className="text-slate-500 mb-8">The record you are looking for does not exist in the database.</p>
        <button onClick={() => navigate("/")} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md">
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this employee? This cannot be undone.")) {
      try {
        await api.delete(`/employees/${emp._id || emp.id}`);
        navigate("/");
      } catch (err: unknown) {
        console.error("Failed to delete record:", err);
        alert("Failed to delete record.");
      }
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          {userInfo?.role === 'admin' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/edit/${emp._id || emp.id}`)}
                className="inline-flex items-center justify-center rounded-xl bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-white transition-all shadow-slate-200/50"
              >
                Edit Profile
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center rounded-xl bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-600 border border-rose-200 shadow-sm hover:bg-rose-100 transition-all shadow-rose-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="glass-panel overflow-hidden rounded-[2rem] shadow-xl shadow-slate-200/50 border-white/80">
          <div className="h-32 sm:h-48 bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm mix-blend-overlay"></div>
          </div>
          
          <div className="px-6 pb-8 sm:px-12 sm:pb-12 relative z-10">
            <div className="relative -mt-16 sm:-mt-24 mb-8 flex justify-between items-end">
              <div className="flex items-end">
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-[2rem] border-4 border-white bg-slate-50 flex items-center justify-center text-5xl sm:text-7xl font-bold text-slate-300 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-transparent"></div>
                  <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-fuchsia-400">
                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="pb-4 sm:pb-6">
                <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase shadow-sm ${
                  emp.isActive 
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" 
                    : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                }`}>
                  <span className="mr-2.5 text-sm">{emp.isActive ? '🟢' : '🔴'}</span>
                  {emp.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>

            <div className="mb-10">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">
                {emp.firstName} {emp.lastName}
              </h1>
              <p className="text-xl text-indigo-600 font-bold tracking-wide mt-2">
                {emp.role || "No Role Assigned"}
              </p>
              <p className="text-slate-500 mt-3 flex items-center gap-2 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {emp.address?.city || "Unknown City"}, {emp.address?.country || "Earth"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-200/60 pt-10">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Contact Info</h3>
                <dl className="space-y-5">
                  <div className="bg-white/50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</dt>
                    <dd className="text-base text-slate-800 font-medium">{emp.email}</dd>
                  </div>
                  <div className="bg-white/50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Phone Number</dt>
                    <dd className="text-base text-slate-800 font-medium">{emp.phone}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Employment</h3>
                <dl className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Department</dt>
                      <dd className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700 border border-indigo-100">
                        {emp.department}
                      </dd>
                    </div>
                    <div className="bg-white/50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Salary</dt>
                      <dd className="text-slate-800 font-bold">₹{emp.salary?.toLocaleString()}</dd>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                      Performance Rating
                      <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        {emp.performanceRating?.toFixed(1) || "N/A"} / 5.0
                      </span>
                    </dt>
                    <dd className="flex items-center">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm transition-all duration-1000 ease-out"
                          style={{ width: `${((emp.performanceRating || 0) / 5) * 100}%` }}
                        ></div>
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="border-t border-slate-200/60 mt-10 pt-10">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2.5">
                {emp.skills && emp.skills.length > 0 ? (
                  emp.skills.map((s, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center rounded-xl bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 shadow-sm hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all cursor-default"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400 italic bg-white/40 px-4 py-2 rounded-xl border border-slate-100">No skills currently listed.</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', { email, password });
      login(data);
    } catch (err: unknown) {
      setError(((err as {response?: {data?: {message?: string}}}).response?.data?.message) || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 font-sans text-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 pb-2 drop-shadow-sm">
            Splendidinfo System
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium tracking-wide">Personnel Registration</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-[2rem] relative overflow-hidden p-8 sm:p-10">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 opacity-80"></div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Create Clearance</h2>
          
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm mb-6">
              <h3 className="text-sm font-bold text-rose-800">{error}</h3>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 mb-2">Password (Min 6 Chars)</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full mt-8 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
          >
            Register Personnel
          </button>

          <p className="mt-6 text-center text-sm text-slate-500 font-medium">
            Already have clearance? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

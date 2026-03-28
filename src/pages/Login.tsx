import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
    } catch (err: unknown) {
      setError(((err as {response?: {data?: {message?: string}}}).response?.data?.message) || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 font-sans text-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Logo badge */}
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 text-white font-black text-2xl shadow-lg mb-4 mx-auto">
            S
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 pb-2 drop-shadow-sm">
            Splendidinfo System
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium tracking-wide">Secure Operational Access</p>
        </div>

        <form onSubmit={handleSubmit} className="shimmer-card glass-panel rounded-[2rem] relative overflow-hidden p-8 sm:p-10">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500 opacity-80"></div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Sign In</h2>
          
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm mb-6">
              <h3 className="text-sm font-bold text-rose-800">{error}</h3>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@splendidinfo.com"
                className="input-glass"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-glass"
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary mt-8">
            Authenticate
          </button>

          <p className="mt-6 text-center text-sm text-slate-500 font-medium">
            No active clearance? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Request access</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

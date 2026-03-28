import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AddEmployee() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    salary: "",
    joiningDate: new Date().toISOString().split("T")[0],
    performanceRating: "4.0",
    isActive: true,
    skills: "",
    city: "",
    country: "India",
  });

  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.department || !form.salary || !form.role || !form.joiningDate || !form.city || !form.country) {
      setError("Please fill in all core text fields.");
      return;
    }

    if (!form.email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (isNaN(Number(form.salary)) || Number(form.salary) <= 0) {
      setError("Salary must be a valid positive number.");
      return;
    }

    const rating = Number(form.performanceRating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      setError("Performance Rating must be between 1.0 and 5.0");
      return;
    }

    try {
      const newEmployee = {
        id: Date.now(),
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || "Not Provided",
        department: form.department,
        role: form.role,
        salary: Number(form.salary),
        joiningDate: form.joiningDate,
        isActive: form.isActive,
        performanceRating: rating,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        address: { city: form.city, country: form.country },
      };

      await api.post('/employees', newEmployee);
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        // Handle Axios error structure
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || "Failed to create employee.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create employee.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-6 font-sans text-slate-800">
      <div className="w-full max-w-4xl">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 border border-slate-200/60 shadow-sm backdrop-blur-md hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all text-slate-500 hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Assign New Employee</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Register a new team member and all associated database fields.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-[2rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 via-fuchsia-400 to-rose-400"></div>

          <div className="p-8 sm:p-12 space-y-8 relative z-10">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-white rounded-full p-1 shadow-sm mr-4">
                    <svg className="h-6 w-6 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-rose-800">{error}</h3>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">First Name</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Last Name</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Job Role / Title</label>
                <input
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Department</label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium cursor-pointer appearance-none"
                >
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Annual Salary</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-400 font-bold text-lg">₹</span>
                  </div>
                  <input
                    name="salary"
                    type="number"
                    value={form.salary}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-white/70 border border-slate-200 pl-9 pr-4 py-3.5 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Joining Date</label>
                <input
                  name="joiningDate"
                  type="date"
                  value={form.joiningDate}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-[13px] px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Country</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Skills (Comma Separated)</label>
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                  placeholder="e.g. React, Node.js, Excel"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Performance Rating (1.0 - 5.0)</label>
                <input
                  name="performanceRating"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={form.performanceRating}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white/70 border border-slate-200 py-3.5 px-4 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="flex items-center space-x-3 pt-6 pl-2">
                <input
                  name="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
                <label className="text-sm font-bold text-slate-800">
                  Active Operative Status {form.isActive ? '🟢' : '🔴'}
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-4 border-t border-slate-200/60 bg-slate-50/50 px-8 py-6 flex-wrap">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-10 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              Init Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
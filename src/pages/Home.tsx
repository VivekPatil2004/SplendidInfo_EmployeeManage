import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import EmployeeTable from "../components/EmployeeTable";
import type { Employee } from "../data/employees";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [highRating, setHighRating] = useState(false);
  const [sortType, setSortType] = useState<"salary" | "date" | "">("");

  const { userInfo } = useAuth();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/employees');
        setEmployees(data);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      emp.firstName.toLowerCase().includes(normalizedSearch) ||
      emp.lastName.toLowerCase().includes(normalizedSearch) ||
      emp.email.toLowerCase().includes(normalizedSearch);

    return (
      matchesSearch &&
      (department ? emp.department === department : true) &&
      (status ? (status === "active" ? emp.isActive : !emp.isActive) : true) &&
      (highRating ? emp.performanceRating >= 4 : true)
    );
  });

  const sortedEmployees = [...filteredEmployees];

  if (sortType === "salary") {
    sortedEmployees.sort((a, b) => b.salary - a.salary);
  }

  if (sortType === "date") {
    sortedEmployees.sort(
      (a, b) =>
        new Date(b.joiningDate).getTime() -
        new Date(a.joiningDate).getTime()
    );
  }

  const totalEmployees = sortedEmployees.length;
  const activeEmployees = sortedEmployees.filter((emp) => emp.isActive).length;

  const avgSalary =
    sortedEmployees.length > 0
      ? sortedEmployees.reduce((acc, emp) => acc + emp.salary, 0) /
        sortedEmployees.length
      : 0;

  const highestRated =
    sortedEmployees.length > 0
      ? sortedEmployees.reduce((prev, curr) =>
          curr.performanceRating > prev.performanceRating ? curr : prev
        )
      : null;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 md:p-10 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 pb-2 drop-shadow-sm">
              Splendidinfo System
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium tracking-wide">Enterprise Operations Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {userInfo?.role === 'admin' && (
              <Link
                to="/add"
                className="group relative inline-flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-md px-6 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-200/50 overflow-hidden transition-all hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  New Employee
                </span>
              </Link>
            )}
            {/* User avatar */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-white flex-shrink-0" title={userInfo?.name || userInfo?.email}>
              {(userInfo?.name || userInfo?.email || 'U').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <div className="glass-panel relative overflow-hidden rounded-2xl p-6 group">
            <dt className="truncate text-sm font-semibold text-slate-500">Total Employees</dt>
            <dd className="mt-2 text-5xl font-black tracking-tight text-slate-800">{totalEmployees}</dd>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-80 group-hover:bg-indigo-400 transition-colors"></div>
          </div>
          <div className="glass-panel relative overflow-hidden rounded-2xl p-6 group">
            <dt className="truncate text-sm font-semibold text-slate-500">Active Employees</dt>
            <dd className="mt-2 text-5xl font-black tracking-tight text-slate-800">{activeEmployees}</dd>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-80 group-hover:bg-emerald-400 transition-colors"></div>
          </div>
          <div className="glass-panel relative overflow-hidden rounded-2xl p-6 group">
            <dt className="truncate text-sm font-semibold text-slate-500">Avg. Salary</dt>
            <dd className="mt-2 text-5xl font-black tracking-tight text-slate-800">₹{avgSalary.toFixed(0)}</dd>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 opacity-80 group-hover:bg-amber-400 transition-colors"></div>
          </div>
          <div className="glass-panel relative overflow-hidden rounded-2xl p-6 group">
            <dt className="truncate text-sm font-semibold text-slate-500">Top Performer</dt>
            <dd className="mt-2 text-2xl font-black tracking-tight text-slate-800 truncate">
              {highestRated ? `${highestRated.firstName} ${highestRated.lastName}` : "N/A"}
            </dd>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-400 opacity-80 group-hover:bg-rose-300 transition-colors"></div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-10 flex flex-col xl:flex-row flex-wrap items-center gap-4 glass-panel p-4 rounded-2xl">
          <div className="flex-1 w-full min-w-[250px]">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl bg-white/60 border border-slate-200 py-3.5 px-5 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl bg-white/60 border border-slate-200 py-3.5 pl-5 pr-10 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer appearance-none font-medium"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl bg-white/60 border border-slate-200 py-3.5 pl-5 pr-10 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer appearance-none font-medium"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as "salary" | "date" | "")}
            className="rounded-xl bg-white/60 border border-slate-200 py-3.5 pl-5 pr-10 text-slate-800 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer appearance-none font-medium"
          >
            <option value="">Default Sort</option>
            <option value="salary">Highest Salary</option>
            <option value="date">Newest Hires</option>
          </select>

          <label className="flex items-center gap-3 cursor-pointer group px-5 py-3.5 bg-white/60 border border-slate-200 rounded-xl hover:bg-white transition-all shadow-sm">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={highRating}
                onChange={(e) => setHighRating(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-slate-300 transition-all checked:border-amber-500 checked:bg-amber-500"
              />
              <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-none font-bold" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Top Performers (≥4.0)</span>
          </label>
        </div>

        <div className="glass-panel !p-0 rounded-2xl overflow-hidden">
          <EmployeeTable employees={sortedEmployees} />
        </div>
      </div>
    </div>
  );
}

export default Home;
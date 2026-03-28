import { useNavigate } from "react-router-dom";
import type { Employee } from "../data/employees";

type Props = {
  employees: Employee[];
};

// Department color map
const deptColors: Record<string, string> = {
  Engineering: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  HR:          "bg-rose-50   text-rose-700   border-rose-200/60",
  Sales:       "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  Marketing:   "bg-amber-50  text-amber-700  border-amber-200/60",
  Finance:     "bg-purple-50 text-purple-700 border-purple-200/60",
};

const deptDot: Record<string, string> = {
  Engineering: "bg-indigo-500",
  HR:          "bg-rose-500",
  Sales:       "bg-emerald-500",
  Marketing:   "bg-amber-500",
  Finance:     "bg-purple-500",
};

export default function EmployeeTable({ employees }: Props) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-md">
          <tr>
            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Employee</th>
            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Department</th>
            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Salary</th>
            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Rating</th>
            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((emp) => (
            <tr
              key={emp.id}
              className="group cursor-pointer hover:bg-indigo-50/40 transition-colors relative"
              onClick={() => navigate(`/employee/${emp.id}`)}
            >
              {/* Employee name + email */}
              <td className="px-6 py-5 relative">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span className="text-slate-400 text-xs mt-0.5">{emp.email}</span>
                  </div>
                </div>
              </td>

              {/* Color-coded department badge */}
              <td className="px-6 py-5">
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold border ${deptColors[emp.department] ?? "bg-slate-100 text-slate-600 border-slate-200/60"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${deptDot[emp.department] ?? "bg-slate-400"}`} />
                  {emp.department}
                </span>
              </td>

              {/* Salary */}
              <td className="px-6 py-5 text-slate-700 font-medium">
                <span className="text-slate-400 mr-0.5">₹</span>{emp.salary.toLocaleString()}
              </td>

              {/* Star rating */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-slate-700 font-semibold text-sm">{emp.performanceRating.toFixed(1)}</span>
                </div>
              </td>

              {/* Active/Inactive status */}
              <td className="px-6 py-5">
                <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                  emp.isActive
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-sm"
                    : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 shadow-sm"
                }`}>
                  <span className="mr-1.5 text-sm">{emp.isActive ? '🟢' : '🔴'}</span>
                  {emp.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-medium text-lg">
                No employees found matching the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

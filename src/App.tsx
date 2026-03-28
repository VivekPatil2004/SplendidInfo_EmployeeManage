import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";

import Home from "./pages/Home";
import EmployeeDetails from "./pages/EmployeeDetails";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import Chat from "./pages/Chat";
import CalendarPage from "./pages/Calendar";
import Meetings from "./pages/Meetings";
import MeetingRoom from "./pages/MeetingRoom";
import AttendancePage from "./pages/AttendancePage";
import LeavePage from "./pages/LeavePage";

// Layout wrapper with sidebar for authenticated pages
function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public routes - no sidebar */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes - with sidebar (any authenticated user) */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Home />} />
                <Route path="/employee/:id" element={<EmployeeDetails />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:userId" element={<Chat />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/meeting/:id" element={<MeetingRoom />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/leave" element={<LeavePage />} />

                {/* Admin-only routes — redirect non-admins to home */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/add"
                  element={
                    <AdminRoute>
                      <AddEmployee />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/edit/:id"
                  element={
                    <AdminRoute>
                      <EditEmployee />
                    </AdminRoute>
                  }
                />
              </Route>
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
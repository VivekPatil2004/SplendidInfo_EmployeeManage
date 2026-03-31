import { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export interface UserInfo {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  /** Access token — stored in memory (this object) NOT separately in localStorage */
  token: string;
  onlineStatus?: string;
}

/** What we persist in localStorage — only non-sensitive display info + token for page refresh */
type StoredUserInfo = UserInfo;

interface AuthContextType {
  userInfo: UserInfo | null;
  login: (userData: UserInfo) => Promise<void>;
  logout: () => Promise<void>;
  updateStatus: (status: string) => void;
  updateToken: (newToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    try {
      const saved = localStorage.getItem('userInfo');
      if (!saved) return null;
      const parsed: StoredUserInfo = JSON.parse(saved);
      // Basic sanity check — ensure required fields exist
      if (!parsed._id || !parsed.email || !parsed.token) {
        localStorage.removeItem('userInfo');
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem('userInfo');
      return null;
    }
  });

  // Track if a logout is in progress to prevent duplicate calls
  const isLoggingOut = useRef(false);
  const navigate = useNavigate();

  const login = async (userData: UserInfo): Promise<void> => {
    // Validate required fields before storing
    if (!userData._id || !userData.email || !userData.token) {
      throw new Error('Invalid login data received');
    }

    // Store in state + localStorage (token included for page refresh persistence)
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUserInfo(userData);

    // Record attendance login — token is now available for the interceptor
    try {
      await api.post('/attendance/login');
    } catch {
      // Non-critical — attendance failure should not block login
    }

    navigate('/');
  };

  const logout = async (): Promise<void> => {
    if (isLoggingOut.current) return; // Prevent double-logout
    isLoggingOut.current = true;

    try {
      // Attempt graceful cleanup — these calls use the current access token
      await api.post('/attendance/logout').catch(console.error);
      await api.post('/auth/logout').catch(console.error); // Also clears httpOnly refresh token cookie
    } finally {
      // Always clear local state regardless of API success
      setUserInfo(null);
      localStorage.removeItem('userInfo');
      isLoggingOut.current = false;
      navigate('/login');
    }
  };

  /** Called by the API interceptor when a new access token is obtained via refresh */
  const updateToken = (newToken: string): void => {
    if (!userInfo) return;
    const updated = { ...userInfo, token: newToken };
    setUserInfo(updated);
    localStorage.setItem('userInfo', JSON.stringify(updated));
  };

  const updateStatus = (status: string): void => {
    const VALID_STATUSES = ['online', 'away', 'busy', 'offline'];
    if (!userInfo || !VALID_STATUSES.includes(status)) return;
    const updated = { ...userInfo, onlineStatus: status };
    setUserInfo(updated);
    localStorage.setItem('userInfo', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ userInfo, login, logout, updateStatus, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

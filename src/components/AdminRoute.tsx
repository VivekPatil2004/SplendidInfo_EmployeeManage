import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * AdminRoute — frontend route guard for admin-only pages.
 * If the user is not authenticated → redirect to /login
 * If the user is authenticated but not admin → redirect to / with a message
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { userInfo } = useAuth();

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (userInfo.role !== 'admin') {
    // Non-admin employees get redirected to home (not a 403 page — avoids confusion)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

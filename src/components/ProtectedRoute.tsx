import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { userInfo } = useAuth();

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

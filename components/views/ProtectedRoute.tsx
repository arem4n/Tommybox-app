import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, children }: { user: any, children: React.ReactNode }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

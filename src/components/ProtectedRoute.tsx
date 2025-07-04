import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompanySelected?: boolean;
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  requireCompanySelected = false,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) => {
  const { user, selectedCompany, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // For supervisors, allow access even without selectedCompany since they can access all branches in their companies
  if (requireCompanySelected && !selectedCompany && user.global_user_level !== 'DEVELOPER') {
    // Check if user is a supervisor with company memberships
    const isSupervisor = user.company_memberships?.some(membership => 
      membership.role === 'SUPERVISOR' || membership.role === 'OWNER'
    );
    
    if (!isSupervisor) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
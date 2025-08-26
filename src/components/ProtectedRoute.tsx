import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  requiredRole?: string;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, hasPermission, hasRole } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check if user has required permission
  if (requiredPermission) {
    const { resource, action } = requiredPermission;
    if (!hasPermission(resource, action)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">
              You don't have permission to access this resource.
            </p>
            <p className="text-sm text-gray-500">
              Required permission: {resource}:{action}
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check if user has required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-12 w-12 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            You don't have the required role to access this resource.
          </p>
          <p className="text-sm text-gray-500">
            Required role: {requiredRole}
            <br />
            Your role: {user?.role}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User has all required permissions/roles, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;

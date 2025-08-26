import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: Array<{
    resource: string;
    action: string;
    source: string;
    role?: string;
    granted?: boolean;
  }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Verify token is still valid
        verifyToken(token);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearAuth();
      }
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearAuth();
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearAuth();
    
    // Call logout API
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(console.error);
    }
  };

  const clearAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }

    return user.permissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

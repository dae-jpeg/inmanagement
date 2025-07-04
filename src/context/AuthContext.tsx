import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import { Company, Branch } from '@/types/supabase';

// Dummy interfaces to satisfy types until a shared types package is created.
export interface Company {
  id: string;
  name: string;
}
export interface Branch {
  id: string;
  name: string;
}

interface CompanyMembership {
  id: string;
  user: string;
  company: string;
  role: 'OWNER' | 'SUPERVISOR' | 'BRANCH_MANAGER' | 'USER';
  branch: string | null;
  user_name: string;
  company_name: string;
  branch_name: string | null;
  company_logo?: string;
}

export interface User {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  global_user_level: 'DEVELOPER' | 'MEMBER';
  id_number?: string;
  department?: string;
  contact_number?: string;
  company_memberships: CompanyMembership[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedCompany: CompanyMembership | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  selectCompany: (companyMembership: CompanyMembership) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    // Clear all app-related items from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('selectedCompany');
    // Also clear old keys just in case
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    
    setUser(null);
    setToken(null);
    setSelectedCompany(null);
    setIsLoading(false); 
    if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
    }
  }, [navigate]);

  const login = useCallback((userData: User, token: string) => {
    setIsLoading(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('access_token', token);
    setUser(userData);
    setToken(token);
    
    // Auto-select company on login if there's only one
    if (userData.company_memberships?.length === 1) {
      const singleMembership = userData.company_memberships[0];
      setSelectedCompany(singleMembership);
      localStorage.setItem('selectedCompany', JSON.stringify(singleMembership));
    } else {
      setSelectedCompany(null);
      localStorage.removeItem('selectedCompany');
    }
    setIsLoading(false);
    navigate('/dashboard');
  }, [navigate]);

  const selectCompany = useCallback((companyMembership: CompanyMembership) => {
    setSelectedCompany(companyMembership);
    localStorage.setItem('selectedCompany', JSON.stringify(companyMembership));
  }, []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('access_token');
      const storedCompany = localStorage.getItem('selectedCompany');

      if (storedUser && storedToken) {
        const parsedUser: User = JSON.parse(storedUser);
        
        // Basic validation to check if the stored user object is compatible
        if (parsedUser && typeof parsedUser === 'object' && Array.isArray(parsedUser.company_memberships)) {
          setUser(parsedUser);
          setToken(storedToken);

          if (storedCompany) {
            setSelectedCompany(JSON.parse(storedCompany));
          } else if (parsedUser.company_memberships?.length === 1) {
            const singleMembership = parsedUser.company_memberships[0];
            setSelectedCompany(singleMembership);
            localStorage.setItem('selectedCompany', JSON.stringify(singleMembership));
          }
        } else {
          // Stored data is invalid, so clear it
          throw new Error("Invalid user data in localStorage");
        }
      }
    } catch (error) {
      console.error("Failed to load user from localStorage, logging out:", error);
      logout(); // This will clear localStorage and reset state
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, selectedCompany, login, logout, selectCompany, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}; 
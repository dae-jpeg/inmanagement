import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (userStr && accessToken && refreshToken) {
          try {
            // Verify the token by making a request to the profile endpoint
            const response = await fetch('http://localhost:8000/api/profile/', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            if (response.ok) {
              setUser(JSON.parse(userStr));
              setIsAuthenticated(true);
            } else if (response.status === 401) {
              // Try to refresh the token
              try {
                const refreshResponse = await fetch('http://localhost:8000/api/token/refresh/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ refresh: refreshToken }),
                });
                
                if (refreshResponse.ok) {
                  const { access } = await refreshResponse.json();
                  localStorage.setItem('access_token', access);
                  setUser(JSON.parse(userStr));
                  setIsAuthenticated(true);
                } else {
                  // If refresh fails, clear everything
                  localStorage.removeItem('user');
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  setUser(null);
                  setIsAuthenticated(false);
                }
              } catch (error) {
                console.error('Error refreshing token:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          } catch (error) {
            console.error('Error verifying authentication:', error);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false); // Set loading to false regardless of the outcome
      }
    };

    checkAuth();
  }, []);

  const login = (userData: any) => {
    console.log("User data received", userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('access_token', userData.tokens.access);
    localStorage.setItem('refresh_token', userData.tokens.refresh);
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    navigate('/');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}; 
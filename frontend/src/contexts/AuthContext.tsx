import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const API_BASE_URL = '/api';

  useEffect(() => {
    // Check for existing token in localStorage on app load
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { username, API_BASE_URL });
      console.log('API_BASE_URL:', API_BASE_URL);
      // Create form data to match FastAPI's OAuth2PasswordRequestForm expectation
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      console.log('Sending request to API...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}/company/token`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response received - Status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        console.log('Response is OK, parsing JSON...');
        
        // Check if response has content
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON:', contentType);
          return false;
        }

        const data = await response.json();
        console.log('Response data:', data);
        
        // Check if response has the expected structure
        if (data && data.access_token && data.token_type === 'bearer') {
          console.log('Login successful, setting token...');
          setToken(data.access_token);
          setIsAuthenticated(true);
          localStorage.setItem('access_token', data.access_token);
          return true;
        } else {
          console.error('Invalid response structure:', data);
        }
      } else {
        console.log('Response not OK, reading error...');
        const errorData = await response.text();
        console.error('Login failed with status:', response.status, 'Error:', errorData);
      }
      
      return false;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out - API is taking too long to respond');
      } else {
        console.error('Login error:', error);
      }
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      token,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 
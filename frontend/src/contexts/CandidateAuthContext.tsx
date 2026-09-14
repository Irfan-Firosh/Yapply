import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { readErrorDetail } from '@/lib/api';

interface CandidateUser {
  email: string;
}

interface CandidateAuthContextType {
  token: string | null;
  user: CandidateUser | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = 'candidate_token';
const USER_KEY = 'candidate_user';
// CandidateDashboard caches these for 24h; clear them so a new login never shows the previous candidate.
const DASHBOARD_CACHE_KEYS = ['candidate_dashboard_data', 'candidate_company_data'];

const CandidateAuthContext = createContext<CandidateAuthContextType | undefined>(undefined);

export const useCandidateAuth = () => {
  const context = useContext(CandidateAuthContext);
  if (context === undefined) {
    throw new Error('useCandidateAuth must be used within a CandidateAuthProvider');
  }
  return context;
};

interface CandidateAuthProviderProps {
  children: ReactNode;
}

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  DASHBOARD_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const CandidateAuthProvider: React.FC<CandidateAuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CandidateUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored candidate session:', error);
        clearStoredSession();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    const formData = new FormData();
    formData.append('email', email);
    const response = await fetch('/api/candidate/token', { method: 'POST', body: formData });
    if (!response.ok) {
      throw new Error(await readErrorDetail(response, 'Login failed. Please try again.'));
    }
    const data = await response.json();
    const nextUser = { email: email.trim().toLowerCase() };
    clearStoredSession();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(data.access_token);
    setUser(nextUser);
  };

  const logout = () => {
    clearStoredSession();
    setToken(null);
    setUser(null);
  };

  return (
    <CandidateAuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </CandidateAuthContext.Provider>
  );
};

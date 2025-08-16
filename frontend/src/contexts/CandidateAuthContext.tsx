import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CandidateUser {
  id: string;
  email: string;
  [key: string]: any;
}

interface CandidateAuthContextType {
  token: string | null;
  user: CandidateUser | null;
  loading: boolean;
  logout: () => void;
}

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

export const CandidateAuthProvider: React.FC<CandidateAuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CandidateUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simply check for stored token and user - no validation
    const storedToken = localStorage.getItem('candidate_token');
    const storedUser = localStorage.getItem('candidate_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('candidate_token');
        localStorage.removeItem('candidate_user');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('candidate_token');
    localStorage.removeItem('candidate_user');
  };

  return (
    <CandidateAuthContext.Provider value={{
      token,
      user,
      loading,
      logout
    }}>
      {children}
    </CandidateAuthContext.Provider>
  );
};

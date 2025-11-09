import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, type User, type Session } from '../lib/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    api.getSession().then((data) => {
      if (data?.user) {
        setUser(data.user);
        const token = api.getToken();
        if (token) {
          setSession({
            access_token: token,
            user: data.user,
          });
        }
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const signUp = async (email: string, password: string) => {
    const { user, session } = await api.signUp(email, password);
    setUser(user);
    setSession(session);
  };

  const signIn = async (email: string, password: string) => {
    const { user, session } = await api.signIn(email, password);
    setUser(user);
    setSession(session);
  };

  const signOut = async () => {
    await api.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

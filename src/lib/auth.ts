import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

type User = {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedSession = localStorage.getItem('paeam_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUser(session.user);
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // For demo, accept any email/password
      const user = { id: '1', email, fullName: email.split('@')[0] };
      localStorage.setItem('paeam_session', JSON.stringify({ user }));
      setUser(user);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const user = { id: Date.now().toString(), email, fullName: metadata?.fullName || email.split('@')[0] };
      localStorage.setItem('paeam_session', JSON.stringify({ user }));
      setUser(user);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('paeam_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
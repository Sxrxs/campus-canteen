import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/canteen.ts';
import { api } from '../lib/api.ts';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  register: (fullName: string, email: string, role?: UserRole, collegeId?: string) => Promise<void>;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isStudent: boolean;
  isStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const token = localStorage.getItem('cb_auth_token');
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
        } else {
          // Default to student demo user initially so the app is instantly usable
          const res = await api.quickSwitchRole('student');
          setUser(res.user);
        }
      } catch (err) {
        console.warn('Initial session restore failed, switching to default demo user:', err);
        try {
          const res = await api.quickSwitchRole('student');
          setUser(res.user);
        } catch (e) {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.login(email);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, role: UserRole = 'student', collegeId?: string) => {
    setLoading(true);
    try {
      const res = await api.register({ fullName, collegeEmail: email, role, collegeId });
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const quickSwitchRole = async (role: UserRole) => {
    setLoading(true);
    try {
      const res = await api.quickSwitchRole(role);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cb_auth_token');
    setUser(null);
  };

  const isStudent = user?.role === 'student';
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        quickSwitchRole,
        logout,
        isAuthenticated: !!user,
        isStudent,
        isStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

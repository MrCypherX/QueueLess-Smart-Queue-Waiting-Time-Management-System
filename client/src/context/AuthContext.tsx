import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginInput, RegisterInput, UserRole } from '../../../shared/schemas';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  demoLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('queueless_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (err) {
        console.warn('Failed to load authenticated user:', err);
        localStorage.removeItem('queueless_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (data: LoginInput) => {
    const res = await api.auth.login(data);
    localStorage.setItem('queueless_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: RegisterInput) => {
    const res = await api.auth.register(data);
    localStorage.setItem('queueless_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('queueless_token');
    setToken(null);
    setUser(null);
  };

  const demoLogin = async (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      superadmin: 'superadmin@queueless.io',
      admin: 'admin@queueless.io',
      operator: 'operator@queueless.io',
      citizen: 'citizen@queueless.io',
    };
    await login({
      email: emailMap[role],
      password: 'Password123!',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        demoLogin,
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

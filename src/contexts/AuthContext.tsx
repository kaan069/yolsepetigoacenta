import { useState, type ReactNode } from 'react';
import { loginCompany } from '../api';
import { AuthContext, type AuthUser } from './auth';

const clearStoredSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Oturum localStorage'dan senkron okunur; ayri bir yukleme durumuna gerek yok
const readStoredUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('access_token');
  if (!storedUser || !storedToken) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    clearStoredSession();
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = async (email: string, password: string) => {
    const response = await loginCompany({ email, password });
    const authUser: AuthUser = {
      id: response.company.id,
      name: response.company.name,
      contact_person: response.company.contact_person,
      contact_email: response.company.contact_email,
    };
    localStorage.setItem('access_token', response.tokens.access_token);
    localStorage.setItem('refresh_token', response.tokens.refresh_token);
    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

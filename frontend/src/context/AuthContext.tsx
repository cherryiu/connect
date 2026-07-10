import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  AuthContextType,
  getAuthStatus,
  logout as submitLogout,
  submitAuthCredentials,
} from '../api/authApi';

/**
 * Auth provider component to wrap around the app and provide auth state
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  // auth status lambda to check if user is authenticated and get user info
  const refreshAuthStatus = async () => {
    try {
      const response = await getAuthStatus();
      if (response.authenticated) {
        setUser({
          authUserId: response.authUserId,
          email: response.email,
          displayName: response.displayName,
          avatarUrl: response.avatarUrl,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  // login lambda to submit login information
  const login = async (email: string, password: string) => {
    await submitAuthCredentials(email, password);
    await refreshAuthStatus();
  };

  const logout = async () => {
    await submitLogout();
    setUser(null);
  };

  useEffect(() => {
    refreshAuthStatus().finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: user !== null,
        isLoading,
        user,
        login,
        logout,
        refreshAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;

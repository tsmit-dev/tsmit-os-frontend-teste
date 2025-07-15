"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '@/lib/types';
import { login as apiLogin, logout as apiLogout, getMe } from '@/lib/api';
import { PermissionsProvider, usePermissions } from '@/context/PermissionsContext';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMe();
      const apiUser = response.data.user;
      
      const userData: User = {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.user_metadata.name,
        roleId: apiUser.user_metadata.roleId,
        role: null, // Role details will be fetched by PermissionsProvider
      };
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user data", error);
      setUser(null);
      apiLogout(); // Clear token if fetching user fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [fetchUserData]);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
      await apiLogin(email, pass);
      await fetchUserData(); // Fetch user data after successful login
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setLoading(false);
      return false;
    }
  }, [fetchUserData]);

  const handleLogout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout: handleLogout, loading }}>
      <PermissionsProvider>{children}</PermissionsProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { userPermissions, userRole, hasPermission, loadingPermissions } = usePermissions();

  return {
    ...context,
    userPermissions,
    userRole,
    hasPermission,
    loadingPermissions,
  };
};

"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Role, Permissions } from '@/lib/types';
import { rolesApi } from '@/lib/api';
import { useAuth as useAuthFromProvider } from '@/components/auth-provider'; // Renamed to avoid circular dependency

interface PermissionsContextType {
  userRole: Role | null;
  userPermissions: Permissions;
  loadingPermissions: boolean;
  hasPermission: (resource: string, action: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthFromProvider();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState<boolean>(true);

  const fetchRole = useCallback(async (roleId: string) => {
    setLoadingPermissions(true);
    try {
      const role = await rolesApi.getById(roleId);
      setUserRole(role);
    } catch (error) {
      console.error("Failed to fetch user role", error);
      setUserRole(null);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.roleId) {
      fetchRole(user.roleId);
    } else {
      setUserRole(null);
      setLoadingPermissions(false);
    }
  }, [user, fetchRole]);

  const userPermissions = userRole?.permissions || {};

  const hasPermission = (resource: string, action: string): boolean => {
    const resourcePermissions = userPermissions[resource];
    if (!resourcePermissions) {
      return false; // No permissions for this resource
    }
    return resourcePermissions.includes(action) || resourcePermissions.includes('all');
  };

  return (
    <PermissionsContext.Provider value={{ userRole, userPermissions, loadingPermissions, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

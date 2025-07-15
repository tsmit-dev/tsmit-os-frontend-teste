"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, Permissions } from '@/lib/types';
import { getRoleById } from '@/lib/data'; 
import { useAuth } from '@/components/auth-provider';

interface PermissionsContextType {
  userPermissions: Permissions | null;
  userRole: Role | null;
  hasPermission: (permissionKey: keyof Permissions) => boolean;
  loadingPermissions: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [userPermissions, setUserPermissions] = useState<Permissions | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user && user.roleId) {
        setLoadingPermissions(true);
        try {
          // Fetch role from the new API
          const role = await getRoleById(user.roleId); 
          if (role) {
            setUserPermissions(role.permissions);
            setUserRole(role);
          } else {
            setUserPermissions(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching role and permissions:", error);
          setUserPermissions(null);
          setUserRole(null);
        } finally {
          setLoadingPermissions(false);
        }
      } else {
        setUserPermissions(null);
        setUserRole(null);
        setLoadingPermissions(false);
      }
    };

    if (!authLoading) {
      fetchPermissions();
    }
  }, [user, authLoading]);

  const hasPermission = (permissionKey: keyof Permissions): boolean => {
    if (loadingPermissions || !userPermissions) return false;
    return userPermissions[permissionKey] === true;
  };

  return (
    <PermissionsContext.Provider value={{ userPermissions, userRole, hasPermission, loadingPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getStatuses as fetchStatusesFromApi } from '@/lib/data';
import { Status } from '@/lib/types';

interface StatusesContextType {
  statuses: Status[];
  loading: boolean;
  getStatusById: (id: string) => Status | undefined;
  refreshStatuses: () => void;
}

const StatusesContext = createContext<StatusesContextType | undefined>(undefined);

export function StatusesProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const statusesData = await fetchStatusesFromApi();
      setStatuses(statusesData);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
      // Optionally, you could add toast notifications here
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const getStatusById = (id: string) => {
    return statuses.find((status) => status.id === id);
  };

  const value = {
    statuses,
    loading,
    getStatusById,
    refreshStatuses: fetchStatuses,
  };

  return <StatusesContext.Provider value={value}>{children}</StatusesContext.Provider>;
}

export function useStatuses() {
  const context = useContext(StatusesContext);
  if (context === undefined) {
    throw new Error('useStatuses must be used within a StatusesProvider');
  }
  return context;
}

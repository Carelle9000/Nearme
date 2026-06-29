import React, { createContext, useContext, useState } from 'react';

export interface DiscoverFilters {
  minAge: number;
  maxAge: number;
  maxDistance: number; // in km
  interests: string[];
  gender?: 'male' | 'female' | 'other' | 'all';
}

interface DiscoverFiltersContextType {
  filters: DiscoverFilters;
  updateFilters: (updates: Partial<DiscoverFilters>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: DiscoverFilters = {
  minAge: 18,
  maxAge: 65,
  maxDistance: 50,
  interests: [],
  gender: 'all',
};

const DiscoverFiltersContext = createContext<DiscoverFiltersContextType | undefined>(undefined);

export function DiscoverFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);

  const updateFilters = (updates: Partial<DiscoverFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <DiscoverFiltersContext.Provider
      value={{
        filters,
        updateFilters,
        resetFilters,
      }}
    >
      {children}
    </DiscoverFiltersContext.Provider>
  );
}

export function useDiscoverFilters() {
  const context = useContext(DiscoverFiltersContext);
  if (!context) {
    throw new Error('useDiscoverFilters must be used within DiscoverFiltersProvider');
  }
  return context;
}

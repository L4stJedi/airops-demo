'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Company } from './mock-data';
import { DataProvider } from './data-provider';

export interface AppUser {
  name: string;
  email: string;
  picture?: string;
  company: Company;
  authenticated: boolean;
}

type AppContextType = {
  company: Company;
  setCompany: (c: Company) => void;
  activeModule: string;
  setActiveModule: (m: string) => void;
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
};

const AppContext = createContext<AppContextType>({
  company: 'silesia_air',
  setCompany: () => {},
  activeModule: 'pilots',
  setActiveModule: () => {},
  user: null,
  setUser: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company>('silesia_air');
  const [activeModule, setActiveModule] = useState('pilots');
  const [user, setUser] = useState<AppUser | null>(null);

  return (
    <AppContext.Provider value={{ company, setCompany, activeModule, setActiveModule, user, setUser }}>
      <DataProvider company={company}>
        {children}
      </DataProvider>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

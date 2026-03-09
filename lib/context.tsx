'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Company } from './mock-data';

type AppContextType = {
  company: Company;
  setCompany: (c: Company) => void;
  activeModule: string;
  setActiveModule: (m: string) => void;
};

const AppContext = createContext<AppContextType>({
  company: 'silesia_air',
  setCompany: () => {},
  activeModule: 'pilots',
  setActiveModule: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company>('silesia_air');
  const [activeModule, setActiveModule] = useState('pilots');
  return (
    <AppContext.Provider value={{ company, setCompany, activeModule, setActiveModule }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

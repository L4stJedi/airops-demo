'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FLIGHTS, AIRCRAFT, PILOTS } from './mock-data';
import { cacheData, getCached, getLastUpdated } from './idb';
import type { Company } from './mock-data';

type DataSource = 'live' | 'cache' | 'mock';

interface DataState<T> {
  data: T[];
  loading: boolean;
  source: DataSource;
  lastUpdated: Date | null;
}

interface DataContextType {
  flights: DataState<(typeof FLIGHTS)[number]>;
  aircraft: DataState<(typeof AIRCRAFT)[number]>;
  pilots: DataState<(typeof PILOTS)[number]>;
  refresh: () => void;
  fl3xxConfigured: boolean;
}

const DataContext = createContext<DataContextType>({
  flights: { data: [], loading: false, source: 'mock', lastUpdated: null },
  aircraft: { data: [], loading: false, source: 'mock', lastUpdated: null },
  pilots: { data: [], loading: false, source: 'mock', lastUpdated: null },
  refresh: () => {},
  fl3xxConfigured: false,
});

export function DataProvider({ children, company }: { children: ReactNode; company: Company }) {
  const mockFlights = FLIGHTS.filter(f => f.company === company);
  const mockAircraft = AIRCRAFT.filter(a => a.company === company);
  const mockPilots = PILOTS.filter(p => p.company === company);

  const [flights, setFlights] = useState<DataState<(typeof FLIGHTS)[number]>>({
    data: mockFlights, loading: false, source: 'mock', lastUpdated: null,
  });
  const [aircraft, setAircraft] = useState<DataState<(typeof AIRCRAFT)[number]>>({
    data: mockAircraft, loading: false, source: 'mock', lastUpdated: null,
  });
  const [pilots] = useState<DataState<(typeof PILOTS)[number]>>({
    data: mockPilots, loading: false, source: 'mock', lastUpdated: null,
  });
  const [fl3xxConfigured, setFl3xxConfigured] = useState(false);

  const fetchData = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const [flightsRes, aircraftRes] = await Promise.all([
        fetch(`/api/fl3xx/flights?company=${company}`).then(r => r.json()),
        fetch(`/api/fl3xx/aircraft?company=${company}`).then(r => r.json()),
      ]);

      setFl3xxConfigured(flightsRes.configured ?? false);

      if (flightsRes.data?.length) {
        const source: DataSource = flightsRes.demo ? 'mock' : 'live';
        setFlights({ data: flightsRes.data, loading: false, source, lastUpdated: new Date() });
        if (!flightsRes.demo) {
          await cacheData('flights', flightsRes.data).catch(() => {});
        }
      } else {
        // Try IDB cache
        const cached = await getCached<(typeof FLIGHTS)[number]>('flights');
        const ts = await getLastUpdated('flights');
        if (cached.length) {
          const companyFlights = cached.filter((f: (typeof FLIGHTS)[number]) => f.company === company);
          setFlights({ data: companyFlights, loading: false, source: 'cache', lastUpdated: ts });
        }
      }

      if (aircraftRes.data?.length) {
        const source: DataSource = aircraftRes.demo ? 'mock' : 'live';
        setAircraft({ data: aircraftRes.data, loading: false, source, lastUpdated: new Date() });
        if (!aircraftRes.demo) {
          await cacheData('aircraft', aircraftRes.data).catch(() => {});
        }
      }
    } catch {
      // Network unavailable — load from IDB
      const [cachedFlights, cachedAircraft, tsF, tsA] = await Promise.all([
        getCached<(typeof FLIGHTS)[number]>('flights'),
        getCached<(typeof AIRCRAFT)[number]>('aircraft'),
        getLastUpdated('flights'),
        getLastUpdated('aircraft'),
      ]);
      if (cachedFlights.length) {
        setFlights({ data: cachedFlights.filter(f => f.company === company), loading: false, source: 'cache', lastUpdated: tsF });
      }
      if (cachedAircraft.length) {
        setAircraft({ data: cachedAircraft.filter(a => a.company === company), loading: false, source: 'cache', lastUpdated: tsA });
      }
    }
  }, [company]);

  // Initial load + refresh every 60s when visible
  useEffect(() => {
    fetchData();
    const id = setInterval(() => {
      if (!document.hidden) fetchData();
    }, 60000);
    const onVisible = () => { if (!document.hidden) fetchData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [fetchData]);

  return (
    <DataContext.Provider value={{ flights, aircraft, pilots, refresh: fetchData, fl3xxConfigured }}>
      {children}
    </DataContext.Provider>
  );
}

export const useFlights = () => useContext(DataContext).flights;
export const useAircraft = () => useContext(DataContext).aircraft;
export const usePilots = () => useContext(DataContext).pilots;
export const useDataMeta = () => {
  const { fl3xxConfigured, refresh } = useContext(DataContext);
  return { fl3xxConfigured, refresh };
};

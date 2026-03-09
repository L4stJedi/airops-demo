'use client';
import { useApp } from '@/lib/context';
import { COMPANIES } from '@/lib/mock-data';
import { useOffline } from '@/lib/use-offline';
import { useDataMeta } from '@/lib/data-provider';
import PilotsModule from './modules/PilotsModule';
import FinanceModule from './modules/FinanceModule';
import OperationsModule from './modules/OperationsModule';
import MaintenanceModule from './modules/MaintenanceModule';

const NAV = [
  { id: 'pilots', label: 'Pilots', icon: '👤' },
  { id: 'operations', label: 'Operations', icon: '✈' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
];

export default function MainLayout() {
  const { company, setCompany, activeModule, setActiveModule, user } = useApp();
  const co = COMPANIES[company];
  const { isOffline, pendingCount } = useOffline();
  const { fl3xxConfigured } = useDataMeta();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'KK';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Offline banner */}
      {isOffline && (
        <div className="px-4 py-2 text-xs flex items-center justify-between"
          style={{ background: '#7c3a00', color: '#fcd3a0' }}>
          <span>📵 Offline — zobrazují se naposledy synchronizovaná data{pendingCount > 0 ? ` · ${pendingCount} akcí čeká na sync` : ''}</span>
          <span className="opacity-60">Data budou aktualizována po obnovení připojení</span>
        </div>
      )}

      {/* Top nav */}
      <header className="border-b px-4 h-14 flex items-center justify-between sticky top-0 z-50"
        style={{ background: co.navBg, borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded flex items-center justify-center text-sm font-black text-white"
              style={{ background: co.color }}>
              {co.icao}
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-semibold text-sm leading-none">{co.name}</div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs leading-none mt-0.5" style={{ color: co.color }}>{co.tagline}</div>
                {fl3xxConfigured && (
                  <span className="text-xs px-1 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>FL3XX</span>
                )}
              </div>
            </div>
          </div>

          {/* Company switcher — hidden if authenticated via OAuth (company is fixed by email) */}
          {!user?.authenticated && (
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {(Object.entries(COMPANIES) as [keyof typeof COMPANIES, typeof COMPANIES[keyof typeof COMPANIES]][]).map(([key, c]) => (
                <button key={key} onClick={() => setCompany(key)}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                  style={company === key
                    ? { background: c.color, color: c.gold ? '#1a0e00' : 'white' }
                    : { color: 'rgba(255,255,255,0.35)' }}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden md:flex gap-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setActiveModule(n.id)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={activeModule === n.id
                  ? { background: co.subtle, color: co.color }
                  : { color: 'rgba(255,255,255,0.4)' }}>
                <span className="mr-1.5">{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>

          {/* Sync indicator */}
          {!isOffline && (
            <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} title="Online · data synchronizována" />
          )}

          {/* User avatar + logout */}
          <div className="flex items-center gap-1 ml-1">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: co.color, color: co.gold ? '#1a0e00' : 'white' }}>
                {initials}
              </div>
            )}
            {user?.authenticated && (
              <a href="/api/auth/logout"
                className="text-xs px-2 py-1 rounded-lg transition-colors hidden md:block"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                Odhlásit
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden flex border-b" style={{ background: co.navBg, borderColor: 'rgba(255,255,255,0.07)' }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setActiveModule(n.id)}
            className="flex-1 py-2 text-xs font-medium transition-all border-b-2"
            style={activeModule === n.id
              ? { color: co.color, borderColor: co.color }
              : { color: 'rgba(255,255,255,0.35)', borderColor: 'transparent' }}>
            <div className="text-base">{n.icon}</div>
            {n.label}
          </button>
        ))}
      </nav>

      <main className="flex-1">
        {activeModule === 'pilots' && <PilotsModule />}
        {activeModule === 'finance' && <FinanceModule />}
        {activeModule === 'operations' && <OperationsModule />}
        {activeModule === 'maintenance' && <MaintenanceModule />}
      </main>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useApp } from '@/lib/context';
import { FLIGHTS, AIRCRAFT, PILOTS, getAircraftById, getPilotById, COMPANIES } from '@/lib/mock-data';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; label: string; dot: string }> = {
    active:    { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Letí', dot: '●' },
    planned:   { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Plán', dot: '○' },
    completed: { bg: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Dokončeno', dot: '✓' },
    cancelled: { bg: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Zrušeno', dot: '✕' },
  };
  const s = map[status] || map.planned;
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${s.bg} font-medium`}>{s.dot} {s.label}</span>;
}

function AircraftStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    aog: 'bg-red-500/20 text-red-400 border-red-500/30',
    maintenance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  const labels: Record<string, string> = { active: 'Aktivní', aog: 'AOG ⚠', maintenance: 'Údržba' };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status] || map.active}`}>{labels[status]}</span>;
}

export default function OperationsModule() {
  const { company } = useApp();
  const co = COMPANIES[company];
  const flights = FLIGHTS.filter(f => f.company === company);
  const aircraft = AIRCRAFT.filter(a => a.company === company);
  const pilots = PILOTS.filter(p => p.company === company);
  const [tab, setTab] = useState<'overview' | 'flights' | 'fleet'>('overview');

  const activeFlights = flights.filter(f => f.status === 'active');

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations</h1>
          <p className="text-gray-400 text-sm">Po 9. března 2026 · {co.name}</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ background: co.color }}>
          + Nový let
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Lety dnes', value: flights.length, icon: '✈', color: co.color },
          { label: 'Ve vzduchu', value: activeFlights.length, icon: '🟢', color: '#10b981' },
          { label: 'Letadla', value: aircraft.filter(a => a.status === 'active').length + '/' + aircraft.length, icon: '🛩', color: '#6366f1' },
          { label: 'Piloti v provozu', value: pilots.filter(p => p.status === 'active').length, icon: '👤', color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-2xl font-bold text-white">{k.value}</div>
            <div className="text-xs text-gray-400">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {aircraft.some(a => a.status === 'aog') && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
            ⚠ AOG Alert
          </div>
          {aircraft.filter(a => a.status === 'aog').map(a => (
            <p key={a.id} className="text-red-300 text-sm mt-1">{a.registration} ({a.type}) — vyžaduje technický zásah</p>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-black/30 p-1 rounded-xl mb-4 w-fit">
        {(['overview', 'flights', 'fleet'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {{ overview: '📊 Přehled', flights: '✈ Lety', fleet: '🛩 Fleet' }[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's flights */}
          <div className="bg-[#1a1d27] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-white">Dnešní lety</h3>
            </div>
            <div className="divide-y divide-white/5">
              {flights.map(f => {
                const aircraft = getAircraftById(f.aircraftId);
                const pic = f.crew.find(c => c.role === 'PIC');
                const picPilot = pic ? getPilotById(pic.pilotId) : null;
                return (
                  <div key={f.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{f.flightNumber}</span>
                        <span className="text-gray-400 text-sm">{f.depCity} → {f.arrCity}</span>
                        <StatusBadge status={f.status} />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {aircraft?.registration} · {picPilot?.name || '—'} · {f.paxCount} PAX
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm">
                        {new Date(f.eobt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {f.delayMin > 0 && (
                        <div className="text-amber-400 text-xs">+{f.delayMin} min</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fleet status */}
          <div className="bg-[#1a1d27] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-white">Stav flotily</h3>
            </div>
            <div className="divide-y divide-white/5">
              {aircraft.map(a => {
                const currentFlight = flights.find(f => f.aircraftId === a.id && f.status === 'active');
                return (
                  <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{a.registration}</span>
                        <span className="text-gray-400 text-xs">{a.icaoType}</span>
                        <AircraftStatusBadge status={a.status} />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {currentFlight ? `${currentFlight.depCity} → ${currentFlight.arrCity}` : `Základna ${a.base}`}
                        {a.seats && ` · ${a.seats} seats`}
                      </div>
                    </div>
                    {currentFlight && (
                      <div className="text-right text-xs text-gray-400">
                        ETA {new Date(currentFlight.eldt!).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FTL Watch */}
          <div className="bg-[#1a1d27] border border-white/10 rounded-xl overflow-hidden lg:col-span-2">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-white">FTL Watch — piloti v provozu dnes</h3>
            </div>
            <div className="divide-y divide-white/5">
              {pilots.filter(p => p.status === 'active').map(p => {
                const dutyH = Math.round(p.ftl.dutyToday / 60);
                const dutyMaxH = Math.round(p.ftl.dutyMaxToday / 60);
                const pct = (dutyH / dutyMaxH) * 100;
                return (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{p.name}</span>
                      <span className="text-gray-400 text-xs">{p.position} · Duty {dutyH}h / {dutyMaxH}h max · Block {p.ftl.weeklyBlock}h/{p.ftl.weeklyMax}h týden</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : co.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'flights' && (
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Let', 'Trasa', 'EOBT', 'ETA', 'Letadlo', 'PIC', 'PAX', 'Status', 'Zpoždění'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {flights.map(f => {
                  const ac = getAircraftById(f.aircraftId);
                  const pic = f.crew.find(c => c.role === 'PIC');
                  const picP = pic ? getPilotById(pic.pilotId) : null;
                  return (
                    <tr key={f.id} className="hover:bg-white/3 cursor-pointer">
                      <td className="px-4 py-3 text-white font-medium text-sm">{f.flightNumber}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{f.depIcao} → {f.arrIcao}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{new Date(f.eobt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{new Date(f.eldt!).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{ac?.registration}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{picP?.name}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{f.paxCount}</td>
                      <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                      <td className="px-4 py-3 text-sm">{f.delayMin > 0 ? <span className="text-amber-400">+{f.delayMin} min</span> : <span className="text-gray-600">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aircraft.map(a => {
            const currentFlight = flights.find(f => f.aircraftId === a.id && f.status === 'active');
            return (
              <div key={a.id} className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xl font-bold text-white">{a.registration}</div>
                    <div className="text-sm text-gray-400">{a.type}</div>
                  </div>
                  <AircraftStatusBadge status={a.status} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sedadla</span>
                    <span className="text-white">{a.seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Základna</span>
                    <span className="text-white">{a.base}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">C of A platí do</span>
                    <span className="text-white">{a.coaUntil}</span>
                  </div>
                  {currentFlight && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-gray-400 mb-1">Aktuální let</div>
                      <div className="text-white text-sm font-medium">{currentFlight.flightNumber}: {currentFlight.depCity} → {currentFlight.arrCity}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

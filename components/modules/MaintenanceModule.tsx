'use client';
import { useState } from 'react';
import { useApp } from '@/lib/context';
import { AIRCRAFT, COMPANIES } from '@/lib/mock-data';

// ─── Mock maintenance data ───────────────────────────────────────────────────

interface TechLogEntry {
  id: string; aircraftReg: string; date: string; ataChapter: string;
  description: string; deferral: 'MEL' | 'CDL' | 'none'; melRef?: string;
  melCategory?: 'A' | 'B' | 'C' | 'D'; dueDate?: string;
  status: 'open' | 'deferred' | 'closed'; reportedBy: string;
}

interface ScheduledMx {
  id: string; aircraftReg: string; type: string;
  lastDone: string; interval: string; nextDue: string;
  remainingDays: number; remainingHours: number; status: 'ok' | 'due_soon' | 'overdue';
}

interface WorkOrder {
  id: string; aircraftReg: string; woNumber: string; description: string;
  type: 'scheduled' | 'unscheduled' | 'aog'; status: 'planned' | 'in_progress' | 'completed';
  mechanic?: string; startDate?: string; estimatedHours: number;
}

const TECH_LOG: TechLogEntry[] = [
  { id: 't1', aircraftReg: 'OK-SIB', date: '2026-03-08', ataChapter: '29 - Hydraulics', description: 'Hydraulic system low pressure indication during approach. Crew reported amber caution. System pressure fluctuating. Grounded pending inspection.', deferral: 'none', status: 'open', reportedBy: 'Capt. Blaha' },
  { id: 't2', aircraftReg: 'OK-SIA', date: '2026-03-07', ataChapter: '23 - Communications', description: 'COM2 radio intermittent — static noise reported on 121.5 MHz.', deferral: 'MEL', melRef: 'MEL 23-11-01', melCategory: 'B', dueDate: '2026-03-12', status: 'deferred', reportedBy: 'FO Marek' },
  { id: 't3', aircraftReg: 'OK-SIC', date: '2026-03-06', ataChapter: '21 - Air Conditioning', description: 'Cabin temperature control slightly erratic on ground. Resolved in flight. No recurrence.', deferral: 'none', status: 'closed', reportedBy: 'Capt. Blaha' },
  { id: 't4', aircraftReg: 'OK-SIA', date: '2026-03-09', ataChapter: '32 - Landing Gear', description: 'Nose wheel steering slightly stiff during pushback. Checked OK after warmup.', deferral: 'MEL', melRef: 'MEL 32-50-01', melCategory: 'C', dueDate: '2026-03-19', status: 'deferred', reportedBy: 'Capt. Kovář' },
  { id: 't5', aircraftReg: 'OK-ASJ', date: '2026-03-05', ataChapter: '34 - Navigation', description: 'GPS NOTAM database out of date. Updated via datalink.', deferral: 'none', status: 'closed', reportedBy: 'FO Kosová' },
];

const SCHEDULED_MX: ScheduledMx[] = [
  { id: 'm1', aircraftReg: 'OK-SIA', type: '100-Hour Inspection', lastDone: '2026-01-15', interval: '100 FH', nextDue: '2026-04-20', remainingDays: 42, remainingHours: 284, status: 'ok' },
  { id: 'm2', aircraftReg: 'OK-SIA', type: 'Engine Oil Change', lastDone: '2026-02-20', interval: '200 FH', nextDue: '2026-03-18', remainingDays: 9, remainingHours: 48, status: 'due_soon' },
  { id: 'm3', aircraftReg: 'OK-SIA', type: 'Pitot/Static Check', lastDone: '2025-09-01', interval: '24 months', nextDue: '2027-09-01', remainingDays: 541, remainingHours: 0, status: 'ok' },
  { id: 'm4', aircraftReg: 'OK-SIB', type: '100-Hour Inspection', lastDone: '2025-12-01', interval: '100 FH', nextDue: '2026-03-10', remainingDays: 1, remainingHours: 0, status: 'due_soon' },
  { id: 'm5', aircraftReg: 'OK-SIB', type: '6-Year Inspection', lastDone: '2024-06-01', interval: '72 months', nextDue: '2030-06-01', remainingDays: 1545, remainingHours: 0, status: 'ok' },
  { id: 'm6', aircraftReg: 'OK-SIC', type: 'Phase Check', lastDone: '2026-02-01', interval: '150 FH', nextDue: '2026-05-01', remainingDays: 53, remainingHours: 210, status: 'ok' },
  { id: 'm7', aircraftReg: 'OK-SIC', type: 'Fire Extinguisher Check', lastDone: '2025-09-15', interval: '6 months', nextDue: '2026-03-15', remainingDays: 6, remainingHours: 0, status: 'due_soon' },
  { id: 'm8', aircraftReg: 'OK-ASJ', type: '100-Hour Inspection', lastDone: '2026-01-20', interval: '100 FH', nextDue: '2026-05-10', remainingDays: 62, remainingHours: 320, status: 'ok' },
  { id: 'm9', aircraftReg: 'OK-ASK', type: 'Phase Check', lastDone: '2025-11-10', interval: '150 FH', nextDue: '2026-03-05', remainingDays: -4, remainingHours: 0, status: 'overdue' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'wo1', aircraftReg: 'OK-SIB', woNumber: 'WO-2026-0312', description: 'Hydraulic system inspection — replace actuator seals, pressure test, return to service', type: 'aog', status: 'in_progress', mechanic: 'Petr Novotný', startDate: '2026-03-09', estimatedHours: 8 },
  { id: 'wo2', aircraftReg: 'OK-SIA', woNumber: 'WO-2026-0308', description: 'COM2 radio replacement and test per MEL 23-11-01', type: 'unscheduled', status: 'planned', estimatedHours: 3 },
  { id: 'wo3', aircraftReg: 'OK-SIB', woNumber: 'WO-2026-0290', description: '100-Hour Inspection due — structural inspection, lubrication, avionics system checks', type: 'scheduled', status: 'planned', estimatedHours: 12 },
  { id: 'wo4', aircraftReg: 'OK-ASK', woNumber: 'WO-2026-0305', description: 'Overdue Phase Check — expedite scheduling', type: 'scheduled', status: 'planned', estimatedHours: 10 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function MelCategoryBadge({ cat }: { cat?: string }) {
  const map: Record<string, string> = {
    A: 'bg-red-500/20 text-red-400 border-red-500/30',
    B: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    D: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  if (!cat) return null;
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${map[cat]}`}>MEL CAT {cat}</span>;
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-red-400', deferred: 'bg-amber-400', closed: 'bg-emerald-400',
    ok: 'bg-emerald-400', due_soon: 'bg-amber-400', overdue: 'bg-red-400',
    planned: 'bg-blue-400', in_progress: 'bg-yellow-400', completed: 'bg-emerald-400',
    active: 'bg-emerald-400', aog: 'bg-red-400', maintenance: 'bg-amber-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-gray-400'}`} />;
}

function RemainingBadge({ days, hours }: { days: number; hours: number }) {
  const color = days < 0 ? 'text-red-400' : days <= 14 ? 'text-amber-400' : 'text-gray-400';
  if (days < 0) return <span className="text-xs text-red-400 font-bold">OVERDUE {Math.abs(days)} dní</span>;
  return (
    <span className={`text-xs ${color}`}>
      {days} dní{hours > 0 ? ` / ${hours} FH` : ''}
    </span>
  );
}

// ─── Main Module ─────────────────────────────────────────────────────────────

export default function MaintenanceModule() {
  const { company } = useApp();
  const co = COMPANIES[company];
  const aircraft = AIRCRAFT.filter(a => a.company === company);
  const [selectedAc, setSelectedAc] = useState<string | null>(null);
  const [tab, setTab] = useState<'techlog' | 'scheduled' | 'workorders'>('techlog');
  const [showNewDefect, setShowNewDefect] = useState(false);
  const [newDefect, setNewDefect] = useState({ ata: '', description: '', deferral: 'none', melCat: 'C' });

  const filteredTech = selectedAc ? TECH_LOG.filter(t => t.aircraftReg === selectedAc) : TECH_LOG.filter(t => aircraft.some(a => a.registration === t.aircraftReg));
  const filteredSched = selectedAc ? SCHEDULED_MX.filter(m => m.aircraftReg === selectedAc) : SCHEDULED_MX.filter(m => aircraft.some(a => a.registration === m.aircraftReg));
  const filteredWO = selectedAc ? WORK_ORDERS.filter(w => w.aircraftReg === selectedAc) : WORK_ORDERS.filter(w => aircraft.some(a => a.registration === w.aircraftReg));

  const openDefects = filteredTech.filter(t => t.status === 'open' || t.status === 'deferred');
  const dueSoon = filteredSched.filter(m => m.status === 'due_soon' || m.status === 'overdue');

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-gray-400 text-sm">{co.name} · Tech Log & Plánovaná údržba</p>
        </div>
        <button onClick={() => setShowNewDefect(true)}
          className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ background: co.color }}>
          + Nová závada
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1a1d27] border border-red-500/20 rounded-xl p-4">
          <div className="text-2xl mb-1">🔴</div>
          <div className="text-2xl font-bold text-red-400">{aircraft.filter(a => a.status === 'aog').length}</div>
          <div className="text-xs text-gray-400">AOG letadla</div>
        </div>
        <div className="bg-[#1a1d27] border border-amber-500/20 rounded-xl p-4">
          <div className="text-2xl mb-1">⚠</div>
          <div className="text-2xl font-bold text-amber-400">{openDefects.length}</div>
          <div className="text-xs text-gray-400">Otevřené závady</div>
        </div>
        <div className="bg-[#1a1d27] border border-yellow-500/20 rounded-xl p-4">
          <div className="text-2xl mb-1">🔔</div>
          <div className="text-2xl font-bold text-yellow-400">{dueSoon.length}</div>
          <div className="text-xs text-gray-400">Plánovaná údržba brzy</div>
        </div>
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
          <div className="text-2xl mb-1">🔧</div>
          <div className="text-2xl font-bold text-white">{filteredWO.filter(w => w.status === 'in_progress').length}</div>
          <div className="text-xs text-gray-400">Work orders aktivní</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Aircraft selector sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1d27] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-medium text-sm">Letadla</h3>
            </div>
            <div className="divide-y divide-white/5">
              <button
                onClick={() => setSelectedAc(null)}
                className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${!selectedAc ? 'bg-white/8 border-l-2' : ''}`}
                style={!selectedAc ? { borderLeftColor: co.color } : {}}>
                <div className="text-white text-sm font-medium">Všechna letadla</div>
                <div className="text-gray-500 text-xs">{aircraft.length} letadel</div>
              </button>
              {aircraft.map(a => (
                <button key={a.id}
                  onClick={() => setSelectedAc(a.registration)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${selectedAc === a.registration ? 'bg-white/8 border-l-2' : ''}`}
                  style={selectedAc === a.registration ? { borderLeftColor: co.color } : {}}>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-bold">{a.registration}</span>
                    <StatusDot status={a.status} />
                  </div>
                  <div className="text-gray-500 text-xs">{a.icaoType}</div>
                  {a.status === 'aog' && <div className="text-red-400 text-xs mt-0.5 font-medium">AOG</div>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-black/30 p-1 rounded-xl mb-4 w-fit">
            {([
              { id: 'techlog', label: '📓 Tech Log' },
              { id: 'scheduled', label: '📅 Plánovaná údržba' },
              { id: 'workorders', label: '🔧 Work Orders' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tech Log */}
          {tab === 'techlog' && (
            <div className="space-y-3">
              {filteredTech.map(entry => (
                <div key={entry.id} className={`bg-[#1a1d27] border rounded-xl p-4 ${
                  entry.status === 'open' ? 'border-red-500/30' :
                  entry.status === 'deferred' ? 'border-amber-500/30' :
                  'border-white/10'
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{entry.aircraftReg}</span>
                      <span className="text-gray-400 text-sm">{entry.ataChapter}</span>
                      <StatusDot status={entry.status} />
                      <span className={`text-xs ${entry.status === 'open' ? 'text-red-400' : entry.status === 'deferred' ? 'text-amber-400' : 'text-gray-400'}`}>
                        {entry.status === 'open' ? 'Otevřeno' : entry.status === 'deferred' ? 'Odloženo (MEL)' : 'Uzavřeno'}
                      </span>
                      {entry.deferral === 'MEL' && <MelCategoryBadge cat={entry.melCategory} />}
                    </div>
                    <div className="text-xs text-gray-500">{entry.date} · {entry.reportedBy}</div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{entry.description}</p>
                  {entry.deferral === 'MEL' && (
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="text-gray-500">Ref: {entry.melRef}</span>
                      {entry.dueDate && <span className="text-amber-400">Splatnost: {entry.dueDate}</span>}
                    </div>
                  )}
                  {entry.status !== 'closed' && (
                    <div className="mt-3 flex gap-2">
                      <button className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors">Uzavřít</button>
                      {entry.status === 'open' && <button className="text-xs px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-colors">Odložit (MEL)</button>}
                      <button className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors">Work Order</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Scheduled Maintenance */}
          {tab === 'scheduled' && (
            <div className="bg-[#1a1d27] border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Letadlo', 'Typ údržby', 'Poslední', 'Interval', 'Příští', 'Zbývá', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSched.sort((a, b) => a.remainingDays - b.remainingDays).map(m => (
                      <tr key={m.id} className="hover:bg-white/3">
                        <td className="px-4 py-3 text-white font-bold text-sm">{m.aircraftReg}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{m.type}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{m.lastDone}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{m.interval}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{m.nextDue}</td>
                        <td className="px-4 py-3"><RemainingBadge days={m.remainingDays} hours={m.remainingHours} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusDot status={m.status} />
                            <span className={`text-xs ${m.status === 'overdue' ? 'text-red-400' : m.status === 'due_soon' ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {m.status === 'overdue' ? 'Overdue' : m.status === 'due_soon' ? 'Brzy' : 'V pořádku'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Work Orders */}
          {tab === 'workorders' && (
            <div className="space-y-3">
              {filteredWO.map(wo => {
                const typeColors: Record<string, string> = {
                  aog: 'bg-red-500/20 text-red-400 border-red-500/30',
                  unscheduled: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                };
                const statusColors: Record<string, string> = {
                  planned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                  in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                };
                return (
                  <div key={wo.id} className={`bg-[#1a1d27] border rounded-xl p-4 ${wo.type === 'aog' ? 'border-red-500/30' : 'border-white/10'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{wo.aircraftReg}</span>
                        <span className="text-gray-500 text-sm font-mono">{wo.woNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[wo.type]}`}>
                          {wo.type === 'aog' ? '🔴 AOG' : wo.type === 'unscheduled' ? '⚠ Neplánovaná' : '📅 Plánovaná'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[wo.status]}`}>
                          {wo.status === 'planned' ? 'Plánováno' : wo.status === 'in_progress' ? '⚙ Probíhá' : '✅ Dokončeno'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{wo.estimatedHours}h est.</span>
                    </div>
                    <p className="text-gray-300 text-sm">{wo.description}</p>
                    {(wo.mechanic || wo.startDate) && (
                      <div className="mt-2 text-xs text-gray-500">
                        {wo.mechanic && <span>Technik: {wo.mechanic} · </span>}
                        {wo.startDate && <span>Zahájeno: {wo.startDate}</span>}
                      </div>
                    )}
                    {wo.status !== 'completed' && (
                      <div className="mt-3 flex gap-2">
                        {wo.status === 'planned' && <button className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg">Zahájit</button>}
                        {wo.status === 'in_progress' && <button className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">Uzavřít</button>}
                        <button className="text-xs px-3 py-1 bg-white/5 text-gray-300 border border-white/10 rounded-lg">Detail</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Defect Modal */}
      {showNewDefect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Zaznamenat závadu / Tech Log Entry</h3>
              <button onClick={() => setShowNewDefect(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Letadlo</label>
                <select className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                  {aircraft.map(a => <option key={a.id}>{a.registration} ({a.type})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">ATA kapitola</label>
                <input value={newDefect.ata} onChange={e => setNewDefect(p => ({ ...p, ata: e.target.value }))}
                  placeholder="napr. 29 - Hydraulics"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Popis závady</label>
                <textarea value={newDefect.description} onChange={e => setNewDefect(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Podrobný popis závady…"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Deferral</label>
                  <select value={newDefect.deferral} onChange={e => setNewDefect(p => ({ ...p, deferral: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                    <option value="none">Žádný (opravit ihned)</option>
                    <option value="MEL">MEL</option>
                    <option value="CDL">CDL</option>
                  </select>
                </div>
                {newDefect.deferral === 'MEL' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">MEL kategorie</label>
                    <select value={newDefect.melCat} onChange={e => setNewDefect(p => ({ ...p, melCat: e.target.value }))}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                      <option>A</option><option>B</option><option>C</option><option>D</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNewDefect(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors">Zrušit</button>
              <button onClick={() => setShowNewDefect(false)}
                className="flex-1 py-2.5 rounded-lg text-sm text-white font-semibold transition-colors" style={{ background: co.color }}>
                Uložit do Tech Logu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

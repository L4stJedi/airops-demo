'use client';
import { useState } from 'react';
import { useApp } from '@/lib/context';
import { FLIGHTS, getAircraftById, COMPANIES } from '@/lib/mock-data';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    invoiced: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  const labels: Record<string, string> = { draft: '📝 Draft', approved: '✅ Schváleno', invoiced: '🧾 Fakturováno', paid: '💚 Zaplaceno' };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status]}`}>{labels[status]}</span>;
}

function EurFormat(v: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

export default function FinanceModule() {
  const { company } = useApp();
  const co = COMPANIES[company];
  const flights = FLIGHTS.filter(f => f.company === company);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedFlight = flights.find(f => f.id === selected);

  const totalRevenue = flights.reduce((s, f) => s + f.financials.revenueCharter + f.financials.revenueExtras, 0);
  const totalCost = flights.reduce((s, f) => s + f.financials.costFuel + f.financials.costFees + f.financials.costCrew + f.financials.costCatering + f.financials.costOther, 0);
  const totalMargin = totalRevenue - totalCost;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left: list */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 border-r border-white/10 bg-[#13151f]`}>
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold text-white mb-3">Finance — {co.name}</h2>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-xs text-gray-400">Výnosy</div>
              <div className="text-white font-bold text-sm">{EurFormat(totalRevenue)}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-xs text-gray-400">Náklady</div>
              <div className="text-white font-bold text-sm">{EurFormat(totalCost)}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-xs text-gray-400">Marže</div>
              <div className={`font-bold text-sm ${totalMargin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{EurFormat(totalMargin)}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-xs text-gray-400">Marže %</div>
              <div className="text-white font-bold text-sm">{((totalMargin / totalRevenue) * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 transition-colors">Export Excel</button>
            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 transition-colors">Export PDF</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {flights.map(f => {
            const rev = f.financials.revenueCharter + f.financials.revenueExtras;
            const cost = f.financials.costFuel + f.financials.costFees + f.financials.costCrew + f.financials.costCatering;
            const margin = rev - cost;
            const marginPct = (margin / rev) * 100;
            const aircraft = getAircraftById(f.aircraftId);
            return (
              <button
                key={f.id}
                onClick={() => setSelected(f.id)}
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${selected === f.id ? 'bg-white/8 border-l-2' : ''}`}
                style={selected === f.id ? { borderLeftColor: co.color } : {}}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-white text-sm">{f.flightNumber}</div>
                    <div className="text-xs text-gray-500">{f.depCity} → {f.arrCity} · {aircraft?.registration}</div>
                  </div>
                  <StatusBadge status={f.financials.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-400">Rev: <span className="text-white">{EurFormat(rev)}</span></span>
                    <span className="text-gray-400">Náklady: <span className="text-white">{EurFormat(cost)}</span></span>
                  </div>
                  <span className={`text-xs font-medium ${margin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {marginPct.toFixed(1)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: detail */}
      {selectedFlight ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl">
            {/* Back btn mobile */}
            <div className="lg:hidden mb-4">
              <button onClick={() => setSelected(null)} className="text-sm text-gray-400 flex items-center gap-1">← Zpět</button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedFlight.flightNumber}</h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                  <span>{selectedFlight.depCity} → {selectedFlight.arrCity}</span>
                  <span className="text-gray-600">·</span>
                  <span>{new Date(selectedFlight.eobt).toLocaleDateString('cs-CZ')}</span>
                  <span className="text-gray-600">·</span>
                  <StatusBadge status={selectedFlight.financials.status} />
                </div>
              </div>
              <div className="flex gap-2">
                {selectedFlight.financials.status === 'draft' && (
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">Schválit</button>
                )}
                {selectedFlight.financials.status === 'approved' && (
                  <button className="px-4 py-2 rounded-lg text-sm text-white font-medium transition-colors" style={{ background: co.color }}>Fakturovat</button>
                )}
              </div>
            </div>

            {/* Revenue vs Cost summary */}
            {(() => {
              const f = selectedFlight.financials;
              const rev = f.revenueCharter + f.revenueExtras;
              const cost = f.costFuel + f.costFees + f.costCrew + f.costCatering + f.costOther;
              const margin = rev - cost;
              const blockH = selectedFlight.blockTimePlanned / 60;
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Výnosy', value: EurFormat(rev), color: 'text-white' },
                    { label: 'Náklady', value: EurFormat(cost), color: 'text-white' },
                    { label: 'Marže', value: EurFormat(margin), color: margin > 0 ? 'text-emerald-400' : 'text-red-400' },
                    { label: 'Cost / blk hr', value: EurFormat(cost / blockH), color: 'text-white' },
                  ].map(k => (
                    <div key={k.label} className="bg-[#1a1d27] border border-white/10 rounded-xl p-3 text-center">
                      <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                      <div className="text-xs text-gray-400">{k.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revenue detail */}
              <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span style={{ color: co.color }}>▲</span> Výnosy
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Charter cena</span>
                    <span className="text-white">{EurFormat(selectedFlight.financials.revenueCharter)}</span>
                  </div>
                  {selectedFlight.financials.revenueExtras > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Extras</span>
                      <span className="text-white">{EurFormat(selectedFlight.financials.revenueExtras)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10 flex justify-between font-semibold">
                    <span className="text-gray-300">Celkem výnosy</span>
                    <span className="text-white">{EurFormat(selectedFlight.financials.revenueCharter + selectedFlight.financials.revenueExtras)}</span>
                  </div>
                  {selectedFlight.financials.invoiceNumber && (
                    <div className="pt-2 text-xs text-gray-500">
                      Faktura: {selectedFlight.financials.invoiceNumber}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">Zákazník: {selectedFlight.clientName}</div>
                </div>
              </div>

              {/* Cost detail */}
              <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-red-400">▼</span> Náklady
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: '⛽ Palivo', value: selectedFlight.financials.costFuel },
                    { label: '🏢 Letištní poplatky', value: selectedFlight.financials.costFees },
                    { label: '👤 Posádka (per diem, hotel)', value: selectedFlight.financials.costCrew },
                    { label: '🍽 Catering', value: selectedFlight.financials.costCatering },
                    { label: '📦 Ostatní', value: selectedFlight.financials.costOther },
                  ].map(c => c.value > 0 && (
                    <div key={c.label} className="flex justify-between">
                      <span className="text-gray-400">{c.label}</span>
                      <span className="text-white">{EurFormat(c.value)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex justify-between font-semibold">
                    <span className="text-gray-300">Celkem náklady</span>
                    <span className="text-white">{EurFormat(
                      selectedFlight.financials.costFuel + selectedFlight.financials.costFees +
                      selectedFlight.financials.costCrew + selectedFlight.financials.costCatering +
                      selectedFlight.financials.costOther
                    )}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost breakdown visual */}
            {(() => {
              const f = selectedFlight.financials;
              const total = f.costFuel + f.costFees + f.costCrew + f.costCatering + f.costOther;
              const items = [
                { label: 'Palivo', value: f.costFuel, color: '#f59e0b' },
                { label: 'Poplatky', value: f.costFees, color: '#6366f1' },
                { label: 'Posádka', value: f.costCrew, color: '#10b981' },
                { label: 'Catering', value: f.costCatering, color: '#ec4899' },
              ].filter(i => i.value > 0);
              return (
                <div className="mt-4 bg-[#1a1d27] border border-white/10 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3 text-sm">Struktura nákladů</h3>
                  <div className="flex rounded-full overflow-hidden h-4 mb-3">
                    {items.map(i => (
                      <div key={i.label} style={{ width: `${(i.value / total) * 100}%`, background: i.color }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {items.map(i => (
                      <div key={i.label} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ background: i.color }} />
                        <span className="text-gray-400">{i.label}</span>
                        <span className="text-white">{((i.value / total) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center text-gray-600">
          <div className="text-center">
            <div className="text-4xl mb-2">💰</div>
            <p>Vyberte let ze seznamu</p>
          </div>
        </div>
      )}
    </div>
  );
}

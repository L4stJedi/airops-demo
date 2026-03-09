'use client';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { PILOTS, FLIGHTS, AIRCRAFT, getExpiryDays, getExpiryColor, getExpiryBg, getAircraftById, COMPANIES } from '@/lib/mock-data';

// ─── helpers ────────────────────────────────────────────────────────────────

function FtlBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : color }} />
      </div>
      <span className="text-xs text-gray-400 w-16 text-right">{value}h / {max}h</span>
    </div>
  );
}

function ExpiryBadge({ validUntil }: { validUntil: string | null }) {
  if (!validUntil) return <span className="text-xs text-gray-500">bez omezení</span>;
  const days = getExpiryDays(validUntil);
  const color = getExpiryColor(days);
  const bg = getExpiryBg(days);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${bg} ${color} font-medium`}>
      {days !== null && days < 0 ? 'EXPIROVÁNO' : days !== null && days <= 90 ? `${days} dní` : validUntil}
    </span>
  );
}

function QualIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    licence: '📋', type_rating: '🛩', medical: '🏥', language: '🌐',
    instructor: '🎓', dangerous_goods: '⚠', other: '📄',
  };
  return <span>{icons[type] || '📄'}</span>;
}

// ─── Invoice Upload ──────────────────────────────────────────────────────────

const INVOICE_TYPES = ['Hotel', 'Taxi', 'Fuel', 'Catering', 'Parking', 'Other'];

const OCR_MOCK: Record<string, { type: string; amount: string; vendor: string }> = {
  hotel: { type: 'Hotel', amount: '189.00', vendor: 'Marriott Vienna' },
  taxi: { type: 'Taxi', amount: '24.50', vendor: 'Taxi Wien' },
  receipt: { type: 'Other', amount: '45.00', vendor: 'Unknown vendor' },
};

interface UploadedInvoice {
  id: string; name: string; amount: string; currency: string;
  type: string; flight: string; date: string; status: 'uploaded' | 'processing';
}

function InvoiceUpload({ pilotName, company }: { pilotName: string; company: string }) {
  const co = COMPANIES[company as keyof typeof COMPANIES];
  const flights = FLIGHTS.filter(f => f.company === company);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocr, setOcr] = useState<{ type: string; amount: string; vendor: string } | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [docName, setDocName] = useState('');
  const [selectedFlight, setSelectedFlight] = useState(flights[0]?.id || '');
  const [invoiceType, setInvoiceType] = useState('Hotel');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedInvoice[]>([
    { id: 'inv1', name: 'VIE | Hotel | Jan Kovář | 2026-03-09', amount: '189.00', currency: 'EUR', type: 'Hotel', flight: 'SA-201', date: '2026-03-09', status: 'uploaded' },
    { id: 'inv2', name: 'PRG | Taxi | Jan Kovář | 2026-03-08', amount: '24.50', currency: 'EUR', type: 'Taxi', flight: 'SA-115', date: '2026-03-08', status: 'uploaded' },
  ]);

  const flight = flights.find(f => f.id === selectedFlight);

  function buildDocName(icao: string, type: string, pilot: string, date: string) {
    return `${icao} | ${type} | ${pilot} | ${date}`;
  }

  function handleFile(f: File) {
    setFile(f);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);

    // Simulate OCR
    setOcrRunning(true);
    setOcr(null);
    setTimeout(() => {
      const key = Object.keys(OCR_MOCK).find(k => f.name.toLowerCase().includes(k)) || 'receipt';
      const result = OCR_MOCK[key];
      setOcr(result);
      setInvoiceType(result.type);
      setAmount(result.amount);
      const icao = flight ? flight.arrIcao.slice(1) : 'PRG';
      const date = new Date().toISOString().slice(0, 10);
      setDocName(buildDocName(icao, result.type, pilotName, date));
      setOcrRunning(false);
    }, 1800);
  }

  useEffect(() => {
    if (!flight) return;
    const icao = flight.arrIcao.slice(1);
    const date = new Date().toISOString().slice(0, 10);
    setDocName(buildDocName(icao, invoiceType, pilotName, date));
  }, [selectedFlight, invoiceType, pilotName, flight]);

  function handleUpload() {
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploaded(prev => [{
            id: Date.now().toString(),
            name: docName,
            amount,
            currency,
            type: invoiceType,
            flight: flight?.flightNumber || '—',
            date: new Date().toISOString().slice(0, 10),
            status: 'uploaded',
          }, ...prev]);
          setFile(null);
          setPreview(null);
          setOcr(null);
          setAmount('');
          return 100;
        }
        return p + 12;
      });
    }, 180);
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h3 className="text-white font-semibold text-lg">Nahrát doklad / fakturu</h3>
      <p className="text-gray-400 text-sm">Vyfotte účtenku nebo vyberte PDF. OCR automaticky rozpozná typ a částku. Název souboru bude upraven podle letu.</p>

      {/* Upload area */}
      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl p-8 cursor-pointer hover:border-white/40 transition-colors">
          <div className="text-4xl mb-3">📷</div>
          <div className="text-white font-medium mb-1">Vyberte foto nebo PDF</div>
          <div className="text-gray-500 text-sm">Foto účtenky, PDF faktury</div>
          <input type="file" accept="image/*,application/pdf" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="bg-[#1a1d27] border border-white/10 rounded-2xl overflow-hidden">
          {/* Preview */}
          <div className="p-4 border-b border-white/10 flex items-center gap-4">
            {preview && preview.startsWith('data:image') ? (
              <img src={preview} alt="preview" className="w-20 h-20 object-cover rounded-lg" />
            ) : (
              <div className="w-20 h-20 bg-red-500/20 rounded-lg flex items-center justify-center text-3xl">📄</div>
            )}
            <div className="flex-1">
              <div className="text-white text-sm font-medium truncate">{file.name}</div>
              <div className="text-gray-400 text-xs">{(file.size / 1024).toFixed(0)} KB</div>
              {ocrRunning && (
                <div className="flex items-center gap-2 mt-2 text-xs text-blue-400">
                  <span className="animate-pulse">⚙</span> OCR zpracovává…
                </div>
              )}
              {ocr && !ocrRunning && (
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
                  ✅ OCR rozpoznal: {ocr.vendor} · {ocr.type} · {ocr.amount} EUR
                </div>
              )}
            </div>
            <button onClick={() => { setFile(null); setPreview(null); setOcr(null); }}
              className="text-gray-500 hover:text-white text-xl">✕</button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Let</label>
              <select value={selectedFlight} onChange={e => setSelectedFlight(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30">
                {flights.map(f => (
                  <option key={f.id} value={f.id}>{f.flightNumber} — {f.depCity} → {f.arrCity}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Typ dokladu</label>
                <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30">
                  {INVOICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Částka</label>
                <div className="flex gap-1">
                  <input value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none">
                    {['EUR', 'CZK', 'USD', 'GBP', 'PLN'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Název souboru v Google Drive</label>
              <input value={docName} onChange={e => setDocName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-white/30" />
              <p className="text-xs text-gray-600 mt-1">Formát: ICAO | Typ | Pilot | Datum</p>
            </div>

            {uploading ? (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Nahrávám do Google Drive…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: co.color }} />
                </div>
              </div>
            ) : (
              <button onClick={handleUpload} disabled={!ocr && !amount}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-40"
                style={{ background: co.color }}>
                ☁ Nahrát do Google Drive
              </button>
            )}
          </div>
        </div>
      )}

      {/* Uploaded list */}
      <div>
        <h4 className="text-gray-400 text-sm font-medium mb-2">Nahrané doklady</h4>
        <div className="space-y-2">
          {uploaded.map(inv => (
            <div key={inv.id} className="bg-[#1a1d27] border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🧾</span>
                <div>
                  <div className="text-white text-sm font-medium font-mono">{inv.name}</div>
                  <div className="text-gray-500 text-xs">{inv.flight} · {inv.amount} {inv.currency}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400">✅ Drive</span>
                <button className="text-xs text-gray-500 hover:text-gray-300">Otevřít →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Signature Pad ───────────────────────────────────────────────────────────

function SignaturePad({ label, onSign }: { label: string; onSign: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    drawing.current = true;
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function endDraw() {
    drawing.current = false;
    const canvas = canvasRef.current; if (!canvas) return;
    setSigned(true);
    onSign(canvas.toDataURL());
  }

  function clear() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onSign('');
  }

  return (
    <div className="bg-[#0f1117] border border-white/10 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        {signed && <button onClick={clear} className="text-xs text-red-400 hover:text-red-300">Vymazat</button>}
      </div>
      <canvas
        ref={canvasRef}
        width={400} height={100}
        className="w-full rounded-lg bg-[#1a1d27] cursor-crosshair touch-none"
        style={{ height: '80px' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      {!signed && <p className="text-xs text-gray-600 mt-1 text-center">Podepište prstem nebo myší</p>}
      {signed && <p className="text-xs text-emerald-500 mt-1 text-center">✅ Podpis zaznamenán</p>}
    </div>
  );
}

// ─── Weight & Balance ────────────────────────────────────────────────────────

// Aircraft W&B configurations for private jets
const WB_CONFIGS: Record<string, {
  name: string; oew: number; oewArm: number; oewMoment: number;
  lemac: number; mac: number;
  zones: Array<{ id: string; label: string; arm: number; maxPax?: number; isKg?: boolean }>;
  fuel: { arm: number }; mtow: number; mlw: number; mzfw: number;
  fwdLimit: number; aftLimit: number;
}> = {
  C56X: {
    name: 'Cessna Citation XLS/XLS+ 560',
    oew: 5800, oewArm: 9.82, oewMoment: 56956,
    lemac: 9.46, mac: 1.651,
    zones: [
      { id: 'fwd', label: 'Přední kabina (řady 1–4)', arm: 8.60, maxPax: 4 },
      { id: 'aft', label: 'Zadní kabina (řady 5–8)', arm: 11.20, maxPax: 5 },
      { id: 'fwdBag', label: 'Přední zavazadelník', arm: 4.80, isKg: true },
      { id: 'aftBag', label: 'Zadní zavazadelník', arm: 13.40, isKg: true },
    ],
    fuel: { arm: 9.44 },
    mtow: 9163, mlw: 8709, mzfw: 7938,
    fwdLimit: 13, aftLimit: 33,
  },
  BE90: {
    name: 'Beechcraft King Air 90',
    oew: 2935, oewArm: 4.88, oewMoment: 14321,
    lemac: 4.52, mac: 1.601,
    zones: [
      { id: 'fwd', label: 'Přední sedadla (řady 1–2)', arm: 4.20, maxPax: 2 },
      { id: 'mid', label: 'Střední sedadla (řady 3–4)', arm: 5.10, maxPax: 2 },
      { id: 'aft', label: 'Zadní sedadla (řady 5–6)', arm: 6.00, maxPax: 2 },
      { id: 'bag', label: 'Zavazadla (nose + aft)', arm: 6.80, isKg: true },
    ],
    fuel: { arm: 4.96 },
    mtow: 4581, mlw: 4354, mzfw: 3900,
    fwdLimit: 14, aftLimit: 30,
  },
};

function WeightBalance({ pilotName, company }: { pilotName: string; company: string }) {
  const co = COMPANIES[company as keyof typeof COMPANIES];
  const flights = FLIGHTS.filter(f => f.company === company);
  const [selectedFlight, setSelectedFlight] = useState(flights[0]?.id || '');
  const [picSig, setPicSig] = useState('');
  const [sicSig, setSicSig] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [isDemoUpload, setIsDemoUpload] = useState(false);

  const flight = flights.find(f => f.id === selectedFlight);
  const aircraft = flight ? AIRCRAFT.find(a => a.id === flight.aircraftId) : null;
  const icaoType = aircraft?.icaoType || 'C56X';
  const WB_CONFIG = WB_CONFIGS[icaoType] || WB_CONFIGS['C56X'];

  // Dynamic state based on zones
  const [zoneValues, setZoneValues] = useState<Record<string, number>>({
    fwd: 4, aft: 3, fwdBag: 80, aftBag: 60,
    mid: 2, bag: 120,
  });
  const [fuelKg, setFuelKg] = useState(980);
  const paxWeightKg = 84;

  function setZone(id: string, val: number) {
    setZoneValues(prev => ({ ...prev, [id]: val }));
  }

  // Calculate moments
  let paxWeight = 0, paxMoment = 0, cargoWeight = 0, cargoMoment = 0;
  for (const zone of WB_CONFIG.zones) {
    const val = zoneValues[zone.id] ?? 0;
    if (zone.isKg) {
      cargoWeight += val;
      cargoMoment += val * zone.arm;
    } else {
      const w = val * paxWeightKg;
      paxWeight += w;
      paxMoment += w * zone.arm;
    }
  }

  const zfw = WB_CONFIG.oew + paxWeight + cargoWeight;
  const zfwMoment = WB_CONFIG.oewMoment + paxMoment + cargoMoment;
  const zfwCG = ((zfwMoment / zfw) - WB_CONFIG.lemac) / WB_CONFIG.mac * 100;

  const tow = zfw + fuelKg;
  const towMoment = zfwMoment + fuelKg * WB_CONFIG.fuel.arm;
  const towCG = ((towMoment / tow) - WB_CONFIG.lemac) / WB_CONFIG.mac * 100;

  const fuelBurn = Math.round(fuelKg * 0.72);
  const lw = tow - fuelBurn;
  const lwMoment = towMoment - fuelBurn * WB_CONFIG.fuel.arm;
  const lwCG = ((lwMoment / lw) - WB_CONFIG.lemac) / WB_CONFIG.mac * 100;

  const towOk = tow <= WB_CONFIG.mtow;
  const zfwOk = zfw <= WB_CONFIG.mzfw;
  const lwOk = lw <= WB_CONFIG.mlw;
  const cgFwdOk = towCG >= WB_CONFIG.fwdLimit;
  const cgAftOk = towCG <= WB_CONFIG.aftLimit;
  const allOk = towOk && zfwOk && lwOk && cgFwdOk && cgAftOk;

  async function handleSave() {
    if (!picSig || !sicSig) return;
    setSaving(true);
    setSaved(false);
    setDriveLink(null);

    try {
      // Dynamically import jsPDF (avoids SSR issues)
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = 210;
      const margin = 20;
      let y = 20;

      // ── Header ──────────────────────────────────────────
      doc.setFillColor(co.gold ? 10 : 0, co.gold ? 32 : 54, co.gold ? 76 : 113);
      doc.rect(0, 0, pageW, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(co.name.toUpperCase(), margin, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('WEIGHT & BALANCE LOAD SHEET', margin, 21);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`, pageW - margin, 21, { align: 'right' });

      y = 42;
      doc.setTextColor(0, 0, 0);

      // ── Flight info ──────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('FLIGHT INFORMATION', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const flightInfo = [
        ['Flight Number', flight?.flightNumber || '—'],
        ['Route', `${flight?.depCity} (${flight?.depIcao}) → ${flight?.arrCity} (${flight?.arrIcao})`],
        ['Aircraft', `${aircraft?.registration} — ${aircraft?.type}`],
        ['Date', new Date().toLocaleDateString('cs-CZ')],
        ['Passengers', String(WB_CONFIG.zones.filter(z => !z.isKg).reduce((s, z) => s + (zoneValues[z.id] ?? 0), 0))],
      ];
      for (const [label, value] of flightInfo) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 40, y);
        y += 6;
      }

      y += 4;
      // ── Weight Summary ───────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('WEIGHT SUMMARY', margin, y);
      y += 7;

      // Table header
      doc.setFillColor(240, 240, 245);
      doc.rect(margin, y - 5, pageW - margin * 2, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Item', margin + 2, y);
      doc.text('Weight [kg]', margin + 65, y);
      doc.text('CG [% MAC]', margin + 100, y);
      doc.text('Limit [kg]', margin + 135, y);
      doc.text('Status', margin + 160, y);
      y += 5;

      const rows = [
        { label: 'Zero Fuel Weight (ZFW)', weight: Math.round(zfw), cg: zfwCG, limit: WB_CONFIG.mzfw, ok: zfwOk },
        { label: 'Take-Off Weight (TOW)', weight: Math.round(tow), cg: towCG, limit: WB_CONFIG.mtow, ok: towOk && cgFwdOk && cgAftOk },
        { label: 'Landing Weight (LW)', weight: Math.round(lw), cg: lwCG, limit: WB_CONFIG.mlw, ok: lwOk },
      ];
      for (const row of rows) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(row.label, margin + 2, y);
        doc.text(row.weight.toLocaleString(), margin + 65, y);
        doc.text(row.cg.toFixed(1), margin + 100, y);
        doc.text(row.limit.toLocaleString(), margin + 135, y);
        doc.setFont('helvetica', 'bold');
        if (row.ok) { doc.setTextColor(0, 150, 0); doc.text('OK ✓', margin + 160, y); }
        else { doc.setTextColor(200, 0, 0); doc.text('EXCEEDS ✗', margin + 160, y); }
        doc.setTextColor(0, 0, 0);
        y += 7;
      }

      y += 3;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`CG Envelope Limits: FWD ${WB_CONFIG.fwdLimit}% MAC — AFT ${WB_CONFIG.aftLimit}% MAC`, margin, y);
      doc.setTextColor(0, 0, 0);

      y += 8;
      // Overall status box
      if (allOk) {
        doc.setFillColor(220, 255, 220);
        doc.setDrawColor(0, 150, 0);
      } else {
        doc.setFillColor(255, 220, 220);
        doc.setDrawColor(200, 0, 0);
      }
      doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      if (allOk) { doc.setTextColor(0, 100, 0); doc.text('✓  WEIGHT & BALANCE ACCEPTABLE — CLEARED FOR DEPARTURE', pageW / 2, y + 7, { align: 'center' }); }
      else { doc.setTextColor(180, 0, 0); doc.text('✗  OUT OF LIMITS — DO NOT DEPART', pageW / 2, y + 7, { align: 'center' }); }
      doc.setTextColor(0, 0, 0);

      y += 18;
      // ── Loading details ──────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('LOADING DETAILS', margin, y);
      y += 7;
      doc.setFillColor(240, 240, 245);
      doc.rect(margin, y - 5, pageW - margin * 2, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Compartment / Zone', margin + 2, y);
      doc.text('Qty / kg', margin + 90, y);
      doc.text('Arm [m]', margin + 120, y);
      doc.text('Moment [kg·m]', margin + 150, y);
      y += 5;

      for (const zone of WB_CONFIG.zones) {
        const val = zoneValues[zone.id] ?? 0;
        const weight = zone.isKg ? val : val * paxWeightKg;
        const moment = weight * zone.arm;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(zone.label, margin + 2, y);
        doc.text(zone.isKg ? `${val} kg` : `${val} pax (${weight} kg)`, margin + 90, y);
        doc.text(zone.arm.toFixed(2), margin + 120, y);
        doc.text(Math.round(moment).toLocaleString(), margin + 150, y);
        y += 6;
      }
      // Fuel row
      doc.setFont('helvetica', 'normal');
      doc.text('Fuel (centre tank)', margin + 2, y);
      doc.text(`${fuelKg} kg`, margin + 90, y);
      doc.text(WB_CONFIG.fuel.arm.toFixed(2), margin + 120, y);
      doc.text(Math.round(fuelKg * WB_CONFIG.fuel.arm).toLocaleString(), margin + 150, y);
      y += 6;
      // OEW row
      doc.setFont('helvetica', 'bold');
      doc.text('Operating Empty Weight', margin + 2, y);
      doc.text(`${WB_CONFIG.oew.toLocaleString()} kg`, margin + 90, y);
      doc.text(WB_CONFIG.oewArm.toFixed(2), margin + 120, y);
      doc.text(Math.round(WB_CONFIG.oewMoment).toLocaleString(), margin + 150, y);

      y += 14;
      // ── Signatures ───────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('CREW SIGNATURES', margin, y);
      y += 6;

      const sigBoxW = (pageW - margin * 2 - 10) / 2;
      const sigBoxH = 30;

      // PIC box
      doc.setDrawColor(180, 180, 180);
      doc.rect(margin, y, sigBoxW, sigBoxH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('PIC (Pilot In Command)', margin + 2, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(pilotName, margin + 2, y + 10);
      if (picSig && picSig.startsWith('data:image')) {
        try { doc.addImage(picSig, 'PNG', margin + 2, y + 12, sigBoxW - 4, 15); } catch (_) { /* skip */ }
      }

      // SIC box
      const sicX = margin + sigBoxW + 10;
      doc.rect(sicX, y, sigBoxW, sigBoxH);
      doc.setFont('helvetica', 'bold');
      doc.text('SIC (Second In Command)', sicX + 2, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('—', sicX + 2, y + 10);
      if (sicSig && sicSig.startsWith('data:image')) {
        try { doc.addImage(sicSig, 'PNG', sicX + 2, y + 12, sigBoxW - 4, 15); } catch (_) { /* skip */ }
      }

      y += sigBoxH + 8;
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text('This document was generated by AirOps Suite and serves as an official W&B record for the above flight.', margin, y);
      doc.text('Both crew members confirm that the weight and balance is within prescribed limits.', margin, y + 5);

      // ── Upload to Drive ───────────────────────────────────
      const pdfBlob = doc.output('blob');
      const docName = `${flight?.flightNumber || 'WB'} | W&B | ${aircraft?.registration || ''} | ${new Date().toISOString().slice(0, 10)}.pdf`;

      const fd = new FormData();
      fd.append('file', pdfBlob, docName);
      fd.append('name', docName);
      fd.append('company', company);
      fd.append('mimeType', 'application/pdf');

      const resp = await fetch('/api/drive/upload', { method: 'POST', body: fd });
      const result = await resp.json();

      setSaving(false);
      setSaved(true);
      setDriveLink(result.webViewLink || null);
      setIsDemoUpload(result.demo === true);
    } catch (err) {
      console.error('W&B save error:', err);
      setSaving(false);
      // Fallback: still show success in demo
      setSaved(true);
      setIsDemoUpload(true);
    }
  }

  const WeightRow = ({ label, weight, cg, ok }: { label: string; weight: number; cg: number; ok: boolean }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${ok ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/10 border-red-500/30'}`}>
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-white font-mono">{weight.toLocaleString()} kg</span>
        <span className="text-gray-400 font-mono">CG {cg.toFixed(1)}% MAC</span>
        <span className={`font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{ok ? '✅' : '⚠'}</span>
      </div>
    </div>
  );

  // CG Envelope SVG
  const envWidth = 280, envHeight = 120;
  const wRange = WB_CONFIG.mtow - WB_CONFIG.oew;
  const cgRange = WB_CONFIG.aftLimit - WB_CONFIG.fwdLimit + 6;
  const cgMin = WB_CONFIG.fwdLimit - 3;
  function toSvg(w: number, cg: number) {
    return {
      x: ((cg - cgMin) / cgRange) * envWidth,
      y: envHeight - ((w - WB_CONFIG.oew) / wRange) * (envHeight - 10) - 5,
    };
  }
  const fwd = WB_CONFIG.fwdLimit, aft = WB_CONFIG.aftLimit;
  const oewW = WB_CONFIG.oew, mtowW = WB_CONFIG.mtow;
  const points = [toSvg(oewW, fwd), toSvg(oewW, aft), toSvg(mtowW, aft), toSvg(mtowW, fwd + 1)];
  const polyStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const towPt = toSvg(clamp(tow, oewW, mtowW * 1.02), clamp(towCG, cgMin + 0.2, cgMin + cgRange - 0.2));
  const zfwPt = toSvg(clamp(zfw, oewW, mtowW * 1.02), clamp(zfwCG, cgMin + 0.2, cgMin + cgRange - 0.2));
  const cgTicks = [fwd, Math.round((fwd + aft) / 2), aft];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <h3 className="text-white font-semibold text-lg">Weight & Balance / CG kalkulačka</h3>
        {aircraft && <p className="text-sm mt-0.5" style={{ color: co.color }}>{WB_CONFIG.name} · {aircraft.registration}</p>}
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Let</label>
        <select value={selectedFlight} onChange={e => { setSelectedFlight(e.target.value); setSaved(false); }}
          className="w-full bg-[#1a1d27] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
          {flights.map(f => {
            const ac = AIRCRAFT.find(a => a.id === f.aircraftId);
            return <option key={f.id} value={f.id}>{f.flightNumber} — {f.depCity} → {f.arrCity} · {ac?.registration} ({ac?.icaoType})</option>;
          })}
        </select>
      </div>

      <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
        <h4 className="text-white font-medium mb-3 text-sm">Cestující & náklad — {WB_CONFIG.name}</h4>
        <div className="grid grid-cols-2 gap-3">
          {WB_CONFIG.zones.map(zone => (
            <div key={zone.id}>
              <label className="text-xs text-gray-400 mb-1 block">{zone.label} {zone.isKg ? '[kg]' : `(max ${zone.maxPax})`}</label>
              <input type="number" min={0} max={zone.isKg ? 999 : zone.maxPax}
                value={zoneValues[zone.id] ?? 0}
                onChange={e => setZone(zone.id, +e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Palivo [kg] (max {Math.round(WB_CONFIG.mtow * 0.32)})</label>
            <input type="number" min={0} max={Math.round(WB_CONFIG.mtow * 0.32)}
              value={fuelKg} onChange={e => setFuelKg(+e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center outline-none" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Std. hmotnost cestujícího: {paxWeightKg} kg (s příručním zavazadlem)
        </div>
      </div>

      <div className="space-y-2">
        <WeightRow label="ZFW (Zero Fuel Weight)" weight={Math.round(zfw)} cg={zfwCG} ok={zfwOk} />
        <WeightRow label="TOW (Take-Off Weight)" weight={Math.round(tow)} cg={towCG} ok={towOk && cgFwdOk && cgAftOk} />
        <WeightRow label="LW (Landing Weight)" weight={Math.round(lw)} cg={lwCG} ok={lwOk} />
      </div>

      <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
        <h4 className="text-white font-medium mb-3 text-sm">CG Envelope — {WB_CONFIG.name}</h4>
        <svg width="100%" viewBox={`0 0 ${envWidth} ${envHeight}`} className="rounded-lg bg-black/30">
          <polygon points={polyStr} fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1.5" />
          {cgTicks.map(cg => (
            <g key={cg}>
              <line x1={toSvg(oewW, cg).x} y1={0} x2={toSvg(oewW, cg).x} y2={envHeight}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={toSvg(oewW, cg).x} y={envHeight - 2} fontSize="8" fill="#6b7280" textAnchor="middle">{cg}%</text>
            </g>
          ))}
          <circle cx={zfwPt.x} cy={zfwPt.y} r="5" fill="#6366f1" stroke="white" strokeWidth="1.5" />
          <text x={zfwPt.x + 8} y={zfwPt.y + 4} fontSize="9" fill="#a5b4fc">ZFW</text>
          <circle cx={towPt.x} cy={towPt.y} r="5" fill={allOk ? '#10b981' : '#ef4444'} stroke="white" strokeWidth="1.5" />
          <text x={towPt.x + 8} y={towPt.y + 4} fontSize="9" fill={allOk ? '#6ee7b7' : '#fca5a5'}>TOW</text>
        </svg>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>● ZFW: {zfwCG.toFixed(1)}% MAC</span>
          <span className={allOk ? 'text-emerald-400' : 'text-red-400'}>● TOW: {towCG.toFixed(1)}% MAC</span>
          <span>Limity: {WB_CONFIG.fwdLimit}–{WB_CONFIG.aftLimit}% MAC</span>
        </div>
      </div>

      <div className={`p-4 rounded-xl border font-semibold text-center ${allOk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
        {allOk ? '✅ W&B v pořádku — lze pokračovat k podpisům' : '⚠ W&B MIMO LIMITY — zkontrolujte rozložení'}
      </div>

      {allOk && (
        <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-4 space-y-4">
          <h4 className="text-white font-medium text-sm">Podpisy posádky</h4>
          <SignaturePad label={`PIC — ${pilotName}`} onSign={setPicSig} />
          <SignaturePad label="SIC / FO" onSign={setSicSig} />
          {saved ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
              <div className="text-emerald-400 font-semibold">
                {isDemoUpload ? '✅ W&B LoadSheet vygenerována (demo)' : '✅ W&B LoadSheet uložena do Google Drive'}
              </div>
              <div className="text-gray-400 text-xs mt-1 font-mono">
                {flight?.flightNumber} | W&B | {aircraft?.registration} | {new Date().toISOString().slice(0, 10)}.pdf
              </div>
              {isDemoUpload && (
                <div className="text-amber-400 text-xs mt-1">Nakonfigurujte Google Drive pro skutečné uložení</div>
              )}
              {driveLink && (
                <a href={driveLink} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 text-xs mt-1 block hover:underline">
                  Otevřít v Google Drive →
                </a>
              )}
            </div>
          ) : (
            <button onClick={handleSave} disabled={!picSig || !sicSig || saving}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: co.color, color: co.gold ? '#1a0e00' : 'white' }}>
              {saving ? '⏳ Ukládám do Google Drive…' : '☁ Podepsat & Uložit LoadSheet do Google Drive'}
            </button>
          )}
          {(!picSig || !sicSig) && <p className="text-xs text-gray-600 text-center">Vyžadovány podpisy PIC i SIC</p>}
        </div>
      )}
    </div>
  );
}

// ─── Main Pilots Module ──────────────────────────────────────────────────────

export default function PilotsModule() {
  const { company } = useApp();
  const co = COMPANIES[company];
  const pilots = PILOTS.filter(p => p.company === company);
  const [selected, setSelected] = useState(pilots[0]?.id || null);
  const [tab, setTab] = useState<'profile' | 'invoices' | 'wb' | 'documents'>('profile');
  const pilot = pilots.find(p => p.id === selected);
  const pilotFlights = FLIGHTS.filter(f => f.company === company && f.crew.some(c => c.pilotId === selected));

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      leave: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const labels: Record<string, string> = { active: 'Aktivní', leave: 'Dovolená', inactive: 'Neaktivní' };
    return <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      {/* Pilot list */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 border-r border-white/10 bg-[#13151f]`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Piloti ({pilots.length})</h2>
            <button className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: co.color }}>+ Přidat</button>
          </div>
          <input placeholder="Hledat pilota…" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {pilots.map(p => {
            const expiring = p.qualifications.filter(q => { const d = getExpiryDays(q.validUntil); return d !== null && d <= 90 && d >= 0; });
            return (
              <button key={p.id} onClick={() => { setSelected(p.id); setTab('profile'); }}
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${selected === p.id ? 'bg-white/8 border-l-2' : ''}`}
                style={selected === p.id ? { borderLeftColor: co.color } : {}}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: co.color + '40', border: `1px solid ${co.color}60` }}>
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.position} · {p.base}</div>
                    </div>
                  </div>
                  {statusBadge(p.status)}
                </div>
                {expiring.length > 0 && <div className="mt-2 text-xs text-amber-400">⚠ {expiring.length} expirující</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {pilot && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1117]">
          {/* Back + tabs header */}
          <div className="border-b border-white/10 bg-[#13151f]">
            <div className="md:hidden px-4 pt-3 pb-0">
              <button onClick={() => setSelected(null)} className="text-sm text-gray-400 flex items-center gap-1 mb-2">← Zpět</button>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: co.color }}>
                {pilot.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-white font-semibold">{pilot.name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{pilot.position} · {pilot.base}</span>
                  {statusBadge(pilot.status)}
                </div>
              </div>
            </div>
            {/* Tab bar */}
            <div className="flex px-4 gap-1 overflow-x-auto">
              {([
                { id: 'profile', label: '👤 Profil' },
                { id: 'invoices', label: '🧾 Doklady' },
                { id: 'wb', label: '⚖ W&B' },
                { id: 'documents', label: '📋 Kvalifikace' },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'text-white' : 'text-gray-400 border-transparent hover:text-white'}`}
                  style={tab === t.id ? { borderColor: co.color } : {}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'profile' && (
              <div className="p-4 md:p-6 max-w-4xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-4">⏱ FTL — Aktuální stav</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Týdenní block time</div>
                        <FtlBar value={pilot.ftl.weeklyBlock} max={pilot.ftl.weeklyMax} color={co.color} />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Duty time dnes</div>
                        <FtlBar value={Math.round(pilot.ftl.dutyToday / 60)} max={Math.round(pilot.ftl.dutyMaxToday / 60)} color={co.color} />
                      </div>
                      <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                        <span className="text-gray-400">Měsíční block time</span>
                        <span className="text-white font-medium">{pilot.ftl.monthlyBlock}h</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-4">✈ Nadcházející lety</h3>
                    {pilotFlights.length === 0 ? <p className="text-gray-500 text-sm">Žádné naplánované lety</p> : (
                      <div className="space-y-2">
                        {pilotFlights.slice(0, 3).map(f => {
                          const crewRole = f.crew.find(c => c.pilotId === pilot.id);
                          const aircraft = getAircraftById(f.aircraftId);
                          return (
                            <div key={f.id} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400 text-xs">●</span>
                                  <span className="text-white text-sm font-medium">{f.flightNumber}</span>
                                  <span className="text-gray-400 text-sm">{f.depCity} → {f.arrCity}</span>
                                </div>
                                <div className="text-xs text-gray-500 ml-4">{aircraft?.registration} · {crewRole?.role}</div>
                              </div>
                              <span className="text-xs text-gray-400">{new Date(f.eobt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'invoices' && <InvoiceUpload pilotName={pilot.name} company={company} />}
            {tab === 'wb' && <WeightBalance pilotName={pilot.name} company={company} />}

            {tab === 'documents' && (
              <div className="p-4 md:p-6 max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Kvalifikace a dokumenty</h3>
                  <button className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: co.color }}>+ Přidat</button>
                </div>
                <div className="space-y-2">
                  {pilot.qualifications.map(q => {
                    const days = getExpiryDays(q.validUntil);
                    const bg = getExpiryBg(days);
                    return (
                      <div key={q.id} className={`flex items-center justify-between p-3 rounded-lg border ${bg}`}>
                        <div className="flex items-center gap-3">
                          <QualIcon type={q.type} />
                          <div>
                            <div className="text-white text-sm font-medium">{q.name}</div>
                            {q.number && <div className="text-gray-500 text-xs">{q.number}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <ExpiryBadge validUntil={q.validUntil} />
                          <button className="text-xs text-gray-500 hover:text-gray-300">PDF →</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

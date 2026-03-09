// FL3XX API integration — falls back to mock data when credentials are absent
import { FLIGHTS, AIRCRAFT, PILOTS } from './mock-data';

export const FL3XX_CONFIGURED =
  !!process.env.FL3XX_CLIENT_ID && !!process.env.FL3XX_CLIENT_SECRET;

const FL3XX_BASE = process.env.FL3XX_BASE_URL ?? 'https://api.fl3xx.com/api/v1';

// ── OAuth token cache ──────────────────────────────────────────────────────
let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const res = await fetch(`${FL3XX_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FL3XX_CLIENT_ID!,
      client_secret: process.env.FL3XX_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`FL3XX auth failed: ${res.status}`);
  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _token!;
}

async function fl3xxGet(path: string): Promise<unknown> {
  const token = await getToken();
  const res = await fetch(`${FL3XX_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`FL3XX GET ${path} failed: ${res.status}`);
  return res.json();
}

// ── Type definitions matching our app's format ────────────────────────────
export type AppFlight = (typeof FLIGHTS)[number];
export type AppAircraft = (typeof AIRCRAFT)[number];
export type AppPilot = (typeof PILOTS)[number];

// ── FL3XX response shapes (simplified) ───────────────────────────────────
interface FL3XXFlight {
  id: string; flightId: string; acReg: string; acType: string;
  from: string; to: string; fromCity?: string; toCity?: string;
  std: string; sta: string; atd?: string; ata?: string;
  status: 'SCHEDULED' | 'AIRBORNE' | 'LANDED' | 'CANCELLED';
  crew: Array<{ id: string; firstName: string; lastName: string; role: string; pf?: boolean }>;
  paxCount: number; clientName?: string;
  fuelPlanned?: number; fuelUplift?: number;
  operator: string;
}

interface FL3XXAircraft {
  id: string; registration: string; typeDesignator: string; typeName: string;
  seats: number; mtow: number; status: string; homeBase: string;
  coaExpiry?: string; insuranceExpiry?: string; range?: number; cruiseSpeed?: number;
  operator: string;
}

// ── Normalisation functions ───────────────────────────────────────────────
function mapStatus(s: string): string {
  const m: Record<string, string> = {
    SCHEDULED: 'planned', AIRBORNE: 'active', LANDED: 'completed', CANCELLED: 'cancelled',
  };
  return m[s] ?? 'planned';
}

function mapFlight(f: FL3XXFlight, company: string): AppFlight {
  return {
    id: f.id,
    company: company as AppFlight['company'],
    flightNumber: f.flightId,
    type: 'charter',
    status: mapStatus(f.status) as AppFlight['status'],
    aircraftId: f.acReg,
    depIcao: f.from, arrIcao: f.to,
    depCity: f.fromCity ?? f.from, arrCity: f.toCity ?? f.to,
    eobt: f.std, etot: f.std, eldt: f.sta, eibt: f.sta,
    aobt: f.atd ?? null, atot: f.atd ?? null, aldt: f.ata ?? null, aibt: f.ata ?? null,
    blockTimePlanned: Math.round((new Date(f.sta).getTime() - new Date(f.std).getTime()) / 60000),
    blockTimeActual: null,
    paxCount: f.paxCount, clientName: f.clientName ?? '—', delayMin: 0,
    crew: f.crew.map(c => ({ pilotId: c.id, role: c.role as 'PIC'|'SIC'|'SCCM', isPF: c.pf ?? false })),
    fuelPlanKg: f.fuelPlanned ?? null, fuelUpliftKg: f.fuelUplift ?? null, fuelRemainingKg: null,
    financials: { revenueCharter: 0, revenueExtras: 0, costFuel: 0, costFees: 0, costCrew: 0, costCatering: 0, costOther: 0, status: 'draft', invoiceNumber: null },
  } as AppFlight;
}

function mapAircraft(a: FL3XXAircraft, company: string): AppAircraft {
  return {
    id: a.registration,
    company: company as AppAircraft['company'],
    registration: a.registration, type: a.typeName, icaoType: a.typeDesignator,
    seats: a.seats, mtow: a.mtow,
    status: a.status === 'ACTIVE' ? 'active' : a.status === 'AOG' ? 'aog' : 'maintenance',
    base: a.homeBase, coaUntil: a.coaExpiry ?? '', insuranceUntil: a.insuranceExpiry ?? '',
    range: `${a.range ?? 0} km`, cruiseSpeed: `${a.cruiseSpeed ?? 0} km/h`,
  } as AppAircraft;
}

// ── Public API ────────────────────────────────────────────────────────────
export type CompanySlug = 'silesia_air' | 'stream_air';

export async function getFlights(company: CompanySlug): Promise<{ data: AppFlight[]; demo: boolean }> {
  if (!FL3XX_CONFIGURED) {
    return { data: FLIGHTS.filter(f => f.company === company), demo: true };
  }
  try {
    const companyId = company === 'silesia_air'
      ? process.env.FL3XX_COMPANY_ID_SILESIA : process.env.FL3XX_COMPANY_ID_STREAM;
    const today = new Date().toISOString().slice(0, 10);
    const raw = await fl3xxGet(`/flights?from=${today}&to=${today}&companyId=${companyId}`) as { flights: FL3XXFlight[] };
    return { data: (raw.flights ?? []).map(f => mapFlight(f, company)), demo: false };
  } catch (e) {
    console.error('[FL3XX] getFlights failed, falling back to mock:', e);
    return { data: FLIGHTS.filter(f => f.company === company), demo: true };
  }
}

export async function getAircraft(company: CompanySlug): Promise<{ data: AppAircraft[]; demo: boolean }> {
  if (!FL3XX_CONFIGURED) {
    return { data: AIRCRAFT.filter(a => a.company === company), demo: true };
  }
  try {
    const companyId = company === 'silesia_air'
      ? process.env.FL3XX_COMPANY_ID_SILESIA : process.env.FL3XX_COMPANY_ID_STREAM;
    const raw = await fl3xxGet(`/aircraft?companyId=${companyId}`) as { aircraft: FL3XXAircraft[] };
    return { data: (raw.aircraft ?? []).map(a => mapAircraft(a, company)), demo: false };
  } catch (e) {
    console.error('[FL3XX] getAircraft failed, falling back to mock:', e);
    return { data: AIRCRAFT.filter(a => a.company === company), demo: true };
  }
}

export async function getPilots(company: CompanySlug): Promise<{ data: AppPilot[]; demo: boolean }> {
  // FL3XX crew endpoint varies — always fall back to our pilot DB / mock for now
  return { data: PILOTS.filter(p => p.company === company), demo: true };
}

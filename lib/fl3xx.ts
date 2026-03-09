/**
 * FL3XX API integration
 *
 * Real API base:  https://app.fl3xx.com
 * External paths: /api/external/flight/flights
 *                 /api/external/staff/crew
 *                 /api/external/aircraft/{uuid}
 * Auth:           Bearer token — API key generated in FL3XX Settings → API
 *
 * ForeFlight note: FL3XX has a native bidirectional integration with ForeFlight
 * Dispatch (Settings → Integrations → ForeFlight). Once configured in FL3XX with
 * a ForeFlight API key, flights sync automatically every 20 min and crew receive
 * full briefing packages on their iPads. AirOps does NOT need to call ForeFlight
 * directly — FL3XX handles the FL3XX↔ForeFlight data flow.
 *
 * Webhook endpoint for FL3XX events: POST /api/webhooks/fl3xx
 * Register in FL3XX: Settings → Integrations → Webhooks → add URL
 * Events: FLIGHT_CREATE, FLIGHT_UPDATE, FLIGHT_TIME_UPDATE,
 *         FLIGHT_AIRCRAFT_UPDATE, FLIGHT_PAX_COUNT_UPDATE, FLIGHT_CANCEL
 */

import { FLIGHTS, AIRCRAFT, PILOTS } from './mock-data';

export const FL3XX_CONFIGURED = !!process.env.FL3XX_API_KEY;

// FL3XX uses a single API key (Bearer token), not OAuth client credentials
const FL3XX_BASE = process.env.FL3XX_BASE_URL ?? 'https://app.fl3xx.com';

async function fl3xxGet(path: string, tags?: string[]): Promise<unknown> {
  const res = await fetch(`${FL3XX_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.FL3XX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60, tags },
  });
  if (!res.ok) throw new Error(`FL3XX GET ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Type definitions ──────────────────────────────────────────────────────
export type AppFlight   = (typeof FLIGHTS)[number];
export type AppAircraft = (typeof AIRCRAFT)[number];
export type AppPilot    = (typeof PILOTS)[number];
export type CompanySlug = 'silesia_air' | 'stream_air';

// ── FL3XX actual response shapes ──────────────────────────────────────────
interface FL3XXFlight {
  id: string;
  flightId: string;          // e.g. "SA-201"
  acReg: string;             // e.g. "OK-SIA"
  acType: string;            // ICAO type, e.g. "C56X"
  from: string;              // ICAO dep
  to: string;                // ICAO arr
  fromCity?: string;
  toCity?: string;
  std: string;               // Scheduled Time Departure (ISO)
  sta: string;               // Scheduled Time Arrival (ISO)
  atd?: string;              // Actual Time Departure
  ata?: string;              // Actual Time Arrival
  etd?: string;              // Estimated (from ForeFlight webhook)
  eta?: string;
  status: 'SCHEDULED' | 'AIRBORNE' | 'LANDED' | 'CANCELLED';
  crew: Array<{
    id: string; firstName: string; lastName: string;
    role: string;            // "PIC" | "SIC" | "SCCM" | "OBS"
    pf?: boolean;
  }>;
  paxCount: number;
  clientName?: string;
  fuelPlanned?: number;      // kg
  fuelUplift?: number;       // kg
  callSign?: string;
  operator: string;
}

interface FL3XXCrewMember {
  id: string; firstName: string; lastName: string;
  email?: string; phone?: string;
  position: string;          // "CPT" | "FO" | "SCCM"
  base?: string;
  licenses: Array<{ type: string; number: string; expiry?: string }>;
  modifiedSince?: string;
}

interface FL3XXAircraft {
  id: string; registration: string;
  typeDesignator: string;    // ICAO type, e.g. "C56X"
  typeName: string;          // full name
  seats: number; mtow: number;
  status: 'ACTIVE' | 'AOG' | 'MAINTENANCE' | 'SOLD';
  homeBase: string;
  coaExpiry?: string; insuranceExpiry?: string;
  range?: number; cruiseSpeed?: number;
  operator: string;
}

// ── FL3XX webhook event shape ─────────────────────────────────────────────
export interface FL3XXWebhookEvent {
  event: 'FLIGHT_CREATE' | 'FLIGHT_UPDATE' | 'FLIGHT_TIME_UPDATE' |
         'FLIGHT_AIRCRAFT_UPDATE' | 'FLIGHT_PAX_COUNT_UPDATE' | 'FLIGHT_CANCEL';
  flightId: string;
  timestamp: string;
  data: Partial<FL3XXFlight>;
}

// ── Normalisation ─────────────────────────────────────────────────────────
function mapStatus(s: string): AppFlight['status'] {
  const m: Record<string, AppFlight['status']> = {
    SCHEDULED: 'planned', AIRBORNE: 'active', LANDED: 'completed', CANCELLED: 'cancelled',
  };
  return m[s] ?? 'planned';
}

function mapFlight(f: FL3XXFlight, company: CompanySlug): AppFlight {
  const depMs  = new Date(f.std).getTime();
  const arrMs  = new Date(f.sta).getTime();
  return {
    id: f.id,
    company,
    flightNumber: f.flightId,
    type: 'charter',
    status: mapStatus(f.status),
    aircraftId: f.acReg,
    depIcao: f.from, arrIcao: f.to,
    depCity: f.fromCity ?? f.from, arrCity: f.toCity ?? f.to,
    eobt: f.std, etot: f.etd ?? f.std, eldt: f.eta ?? f.sta, eibt: f.sta,
    aobt: f.atd ?? null, atot: f.atd ?? null, aldt: f.ata ?? null, aibt: f.ata ?? null,
    blockTimePlanned: Math.round((arrMs - depMs) / 60000),
    blockTimeActual: null,
    paxCount: f.paxCount,
    clientName: f.clientName ?? '—',
    delayMin: f.atd ? Math.max(0, Math.round((new Date(f.atd).getTime() - depMs) / 60000)) : 0,
    crew: f.crew.map(c => ({
      pilotId: c.id,
      role: c.role as 'PIC' | 'SIC' | 'SCCM',
      isPF: c.pf ?? c.role === 'PIC',
    })),
    fuelPlanKg: f.fuelPlanned ?? null,
    fuelUpliftKg: f.fuelUplift ?? null,
    fuelRemainingKg: null,
    financials: {
      revenueCharter: 0, revenueExtras: 0,
      costFuel: 0, costFees: 0, costCrew: 0, costCatering: 0, costOther: 0,
      status: 'draft', invoiceNumber: null,
    },
  } as AppFlight;
}

function mapAircraft(a: FL3XXAircraft, company: CompanySlug): AppAircraft {
  return {
    id: a.registration,
    company,
    registration: a.registration,
    type: a.typeName,
    icaoType: a.typeDesignator,
    seats: a.seats,
    mtow: a.mtow,
    status: a.status === 'ACTIVE' ? 'active' : a.status === 'AOG' ? 'aog' : 'maintenance',
    base: a.homeBase,
    coaUntil: a.coaExpiry ?? '',
    insuranceUntil: a.insuranceExpiry ?? '',
    range: `${a.range ?? 0} km`,
    cruiseSpeed: `${a.cruiseSpeed ?? 0} km/h`,
  } as AppAircraft;
}

// ── Public data functions ─────────────────────────────────────────────────

export async function getFlights(company: CompanySlug): Promise<{ data: AppFlight[]; demo: boolean }> {
  if (!FL3XX_CONFIGURED) {
    return { data: FLIGHTS.filter(f => f.company === company), demo: true };
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const companyId = company === 'silesia_air'
      ? process.env.FL3XX_COMPANY_ID_SILESIA : process.env.FL3XX_COMPANY_ID_STREAM;
    // Real FL3XX external API path
    const raw = await fl3xxGet(
      `/api/external/flight/flights?from=${today}&to=${tomorrow}&value=ALL&timeZone=UTC&companyId=${companyId}`,
      ['fl3xx-flights']
    ) as { flights?: FL3XXFlight[] };
    return { data: (raw.flights ?? []).map(f => mapFlight(f, company)), demo: false };
  } catch (e) {
    console.error('[FL3XX] getFlights failed → mock fallback:', e);
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
    const raw = await fl3xxGet(
      `/api/external/aircraft?companyId=${companyId}`,
      ['fl3xx-aircraft']
    ) as { aircraft?: FL3XXAircraft[] };
    return { data: (raw.aircraft ?? []).map(a => mapAircraft(a, company)), demo: false };
  } catch (e) {
    console.error('[FL3XX] getAircraft failed → mock fallback:', e);
    return { data: AIRCRAFT.filter(a => a.company === company), demo: true };
  }
}

export async function getCrew(company: CompanySlug): Promise<{ data: AppPilot[]; demo: boolean }> {
  if (!FL3XX_CONFIGURED) {
    return { data: PILOTS.filter(p => p.company === company), demo: true };
  }
  try {
    const companyId = company === 'silesia_air'
      ? process.env.FL3XX_COMPANY_ID_SILESIA : process.env.FL3XX_COMPANY_ID_STREAM;
    // Crew endpoint supports modifiedSince for incremental sync
    const raw = await fl3xxGet(
      `/api/external/staff/crew?companyId=${companyId}`
    ) as { crew?: FL3XXCrewMember[] };
    // Map to AppPilot — qualifications come from our own DB (FL3XX has them too
    // but our structure is richer; treat FL3XX crew as identity/roster source)
    const mapped = (raw.crew ?? []).map(c => {
      const existing = PILOTS.find(p => p.name === `${c.firstName} ${c.lastName}`);
      if (existing) return { ...existing, id: c.id };
      return {
        id: c.id,
        company,
        name: `${c.firstName} ${c.lastName}`,
        position: c.position ?? 'FO',
        base: c.base ?? 'PRG',
        employmentType: 'full_time' as const,
        contractStart: '', contractEnd: null,
        phone: c.phone ?? '',
        status: 'active' as const,
        ftl: { weeklyBlock: 0, weeklyMax: 60, monthlyBlock: 0, dutyToday: 0, dutyMaxToday: 840 },
        qualifications: [],
        upcomingFlights: [],
      };
    });
    return { data: mapped as AppPilot[], demo: false };
  } catch (e) {
    console.error('[FL3XX] getCrew failed → mock fallback:', e);
    return { data: PILOTS.filter(p => p.company === company), demo: true };
  }
}

// ── Webhook secret verification ───────────────────────────────────────────
// FL3XX signs webhook payloads with HMAC-SHA256 using a shared secret.
// Verify the X-FL3XX-Signature header before processing.
import { createHmac } from 'crypto';

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.FL3XX_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification in demo mode
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${expected}` === signature;
}

export type Company = 'silesia_air' | 'stream_air';

export const COMPANIES = {
  silesia_air: {
    name: 'Silesia Air',
    icao: 'SA',
    // Real brand colors from silesiaair.cz logo
    color: '#1a6bd4',       // interactive blue (lightened from brand #003671)
    brand: '#003671',       // logo/brand dark navy
    accent: '#2278e8',
    subtle: 'rgba(26,107,212,0.12)',
    gold: false,
    navBg: '#040c1e',
    tagline: 'Style & Privacy',
  },
  stream_air: {
    name: 'Airstream Jets',
    icao: 'ST',
    // Real brand colors from airstreamjets.aero logo (#04204c dark navy → gold accent)
    color: '#c9963e',       // gold accent for luxury private aviation
    brand: '#04204c',       // logo/brand very dark navy
    accent: '#d9a84e',
    subtle: 'rgba(201,150,62,0.12)',
    gold: true,
    navBg: '#02091a',
    tagline: 'Privacy · Flexibility · Freedom',
  },
};

export const PILOTS = [
  {
    id: 'p1', company: 'silesia_air' as Company,
    name: 'Jan Kovář', position: 'CPT', base: 'PRG',
    employmentType: 'full_time', contractStart: '2019-03-01', contractEnd: null,
    phone: '+420 777 123 456', status: 'active',
    ftl: { weeklyBlock: 18, weeklyMax: 60, monthlyBlock: 38, dutyToday: 360, dutyMaxToday: 840 },
    qualifications: [
      { id: 'q1', type: 'licence', name: 'ATPL(A)', number: 'CZ-ATPL-0123', validUntil: null, status: 'valid' },
      { id: 'q2', type: 'type_rating', name: 'Citation XLS 560', number: 'TR-C56X-456', validUntil: '2027-06-30', status: 'valid' },
      { id: 'q3', type: 'medical', name: 'Medical Class 1', number: 'MED-789', validUntil: '2026-04-01', status: 'valid' },
      { id: 'q4', type: 'language', name: 'English ICAO Level 6', number: null, validUntil: null, status: 'valid' },
      { id: 'q5', type: 'other', name: 'SEP Proficiency', number: null, validUntil: '2026-04-29', status: 'valid' },
    ],
    upcomingFlights: ['f1', 'f2', 'f5'],
  },
  {
    id: 'p2', company: 'silesia_air' as Company,
    name: 'Pavel Marek', position: 'FO', base: 'PRG',
    employmentType: 'full_time', contractStart: '2021-06-01', contractEnd: null,
    phone: '+420 777 234 567', status: 'active',
    ftl: { weeklyBlock: 14, weeklyMax: 60, monthlyBlock: 28, dutyToday: 360, dutyMaxToday: 840 },
    qualifications: [
      { id: 'q6', type: 'licence', name: 'CPL(A)', number: 'CZ-CPL-0234', validUntil: null, status: 'valid' },
      { id: 'q7', type: 'type_rating', name: 'Citation XLS 560', number: 'TR-C56X-789', validUntil: '2026-09-15', status: 'valid' },
      { id: 'q8', type: 'medical', name: 'Medical Class 1', number: 'MED-012', validUntil: '2026-12-01', status: 'valid' },
      { id: 'q9', type: 'language', name: 'English ICAO Level 5', number: null, validUntil: '2026-06-30', status: 'valid' },
    ],
    upcomingFlights: ['f1', 'f2'],
  },
  {
    id: 'p3', company: 'silesia_air' as Company,
    name: 'Martin Blaha', position: 'CPT', base: 'PRG',
    employmentType: 'contract', contractStart: '2023-01-01', contractEnd: '2026-12-31',
    phone: '+420 777 456 789', status: 'active',
    ftl: { weeklyBlock: 12, weeklyMax: 60, monthlyBlock: 24, dutyToday: 0, dutyMaxToday: 840 },
    qualifications: [
      { id: 'q13', type: 'licence', name: 'ATPL(A)', number: 'CZ-ATPL-0567', validUntil: null, status: 'valid' },
      { id: 'q14', type: 'type_rating', name: 'Citation XLS+ 560', number: 'TR-C56X-999', validUntil: '2026-03-22', status: 'valid' },
      { id: 'q15', type: 'medical', name: 'Medical Class 1', number: 'MED-234', validUntil: '2026-03-31', status: 'valid' },
      { id: 'q16', type: 'other', name: 'King Air 90 rating', number: 'TR-BE90-221', validUntil: '2027-01-15', status: 'valid' },
    ],
    upcomingFlights: ['f3'],
  },
  {
    id: 'p4', company: 'stream_air' as Company,
    name: 'Radek Sivák', position: 'CPT', base: 'PRG',
    employmentType: 'full_time', contractStart: '2018-05-01', contractEnd: null,
    phone: '+420 600 123 456', status: 'active',
    ftl: { weeklyBlock: 20, weeklyMax: 60, monthlyBlock: 44, dutyToday: 420, dutyMaxToday: 840 },
    qualifications: [
      { id: 'q17', type: 'licence', name: 'ATPL(A)', number: 'CZ-ATPL-1111', validUntil: null, status: 'valid' },
      { id: 'q18', type: 'type_rating', name: 'Citation XLS 560', number: 'TR-C56X-222', validUntil: '2027-02-28', status: 'valid' },
      { id: 'q19', type: 'medical', name: 'Medical Class 1', number: 'MED-333', validUntil: '2026-11-15', status: 'valid' },
      { id: 'q20', type: 'language', name: 'English ICAO Level 6', number: null, validUntil: null, status: 'valid' },
    ],
    upcomingFlights: ['f4', 'f6'],
  },
  {
    id: 'p5', company: 'stream_air' as Company,
    name: 'Lucie Kosová', position: 'FO', base: 'PRG',
    employmentType: 'full_time', contractStart: '2022-03-01', contractEnd: null,
    phone: '+420 600 234 567', status: 'active',
    ftl: { weeklyBlock: 16, weeklyMax: 60, monthlyBlock: 32, dutyToday: 420, dutyMaxToday: 840 },
    qualifications: [
      { id: 'q21', type: 'licence', name: 'CPL(A)', number: 'CZ-CPL-4444', validUntil: null, status: 'valid' },
      { id: 'q22', type: 'type_rating', name: 'Citation XLS 560', number: 'TR-C56X-555', validUntil: '2026-08-30', status: 'valid' },
      { id: 'q23', type: 'medical', name: 'Medical Class 1', number: 'MED-666', validUntil: '2027-01-15', status: 'valid' },
    ],
    upcomingFlights: ['f4'],
  },
  {
    id: 'p6', company: 'stream_air' as Company,
    name: 'Tomáš Krejčí', position: 'CPT', base: 'PRG',
    employmentType: 'full_time', contractStart: '2020-08-01', contractEnd: null,
    phone: '+420 600 345 678', status: 'active',
    ftl: { weeklyBlock: 10, weeklyMax: 60, monthlyBlock: 22, dutyToday: 0, dutyMaxToday: 840 },
    qualifications: [
      { id: 'q24', type: 'licence', name: 'ATPL(A)', number: 'CZ-ATPL-7777', validUntil: null, status: 'valid' },
      { id: 'q25', type: 'type_rating', name: 'King Air 90', number: 'TR-BE90-888', validUntil: '2026-05-30', status: 'valid' },
      { id: 'q26', type: 'medical', name: 'Medical Class 1', number: 'MED-999', validUntil: '2026-07-20', status: 'valid' },
      { id: 'q27', type: 'other', name: 'Citation XLS rating', number: 'TR-C56X-012', validUntil: '2027-03-10', status: 'valid' },
    ],
    upcomingFlights: ['f7'],
  },
];

// Private jet fleet — Cessna Citation XLS 560, XLS+ 560, King Air 90
export const AIRCRAFT = [
  {
    id: 'a1', company: 'silesia_air' as Company,
    registration: 'OK-SIA', type: 'Cessna Citation XLS 560', icaoType: 'C56X',
    seats: 8, mtow: 9163, status: 'active', base: 'LKPR',
    coaUntil: '2027-06-01', insuranceUntil: '2026-12-31',
    range: '3706 km', cruiseSpeed: '778 km/h',
  },
  {
    id: 'a2', company: 'silesia_air' as Company,
    registration: 'OK-SIB', type: 'Cessna Citation XLS+ 560', icaoType: 'C56X',
    seats: 9, mtow: 9163, status: 'active', base: 'LKPR',
    coaUntil: '2027-03-15', insuranceUntil: '2026-12-31',
    range: '3779 km', cruiseSpeed: '796 km/h',
  },
  {
    id: 'a3', company: 'silesia_air' as Company,
    registration: 'OK-SIC', type: 'Beechcraft King Air 90', icaoType: 'BE90',
    seats: 6, mtow: 4581, status: 'maintenance', base: 'LKPR',
    coaUntil: '2026-09-30', insuranceUntil: '2026-12-31',
    range: '1760 km', cruiseSpeed: '463 km/h',
  },
  {
    id: 'a4', company: 'stream_air' as Company,
    registration: 'OK-ASJ', type: 'Cessna Citation XLS 560', icaoType: 'C56X',
    seats: 8, mtow: 9163, status: 'active', base: 'LKPR',
    coaUntil: '2027-04-01', insuranceUntil: '2026-12-31',
    range: '3706 km', cruiseSpeed: '778 km/h',
  },
  {
    id: 'a5', company: 'stream_air' as Company,
    registration: 'OK-ASK', type: 'Beechcraft King Air 90', icaoType: 'BE90',
    seats: 6, mtow: 4581, status: 'active', base: 'LKPR',
    coaUntil: '2026-11-30', insuranceUntil: '2026-12-31',
    range: '1760 km', cruiseSpeed: '463 km/h',
  },
];

export const FLIGHTS = [
  {
    id: 'f1', company: 'silesia_air' as Company,
    flightNumber: 'SA-201', type: 'charter', status: 'active',
    aircraftId: 'a1', depIcao: 'LKPR', arrIcao: 'LOWW',
    depCity: 'Praha', arrCity: 'Vídeň',
    eobt: '2026-03-09T08:30:00Z', etot: '2026-03-09T08:45:00Z',
    eldt: '2026-03-09T09:40:00Z', eibt: '2026-03-09T09:50:00Z',
    aobt: '2026-03-09T08:32:00Z', atot: '2026-03-09T08:47:00Z', aldt: null, aibt: null,
    blockTimePlanned: 80, blockTimeActual: null,
    paxCount: 6, clientName: 'Acme Group s.r.o.', delayMin: 2,
    crew: [{ pilotId: 'p1', role: 'PIC', isPF: true }, { pilotId: 'p2', role: 'SIC', isPF: false }],
    fuelPlanKg: 980, fuelUpliftKg: 990, fuelRemainingKg: null,
    financials: { revenueCharter: 8500, revenueExtras: 400, costFuel: 1485, costFees: 820, costCrew: 320, costCatering: 180, costOther: 0, status: 'invoiced', invoiceNumber: 'INV-2026-0412' },
  },
  {
    id: 'f2', company: 'silesia_air' as Company,
    flightNumber: 'SA-208', type: 'charter', status: 'planned',
    aircraftId: 'a1', depIcao: 'LOWW', arrIcao: 'LKPR',
    depCity: 'Vídeň', arrCity: 'Praha',
    eobt: '2026-03-09T16:00:00Z', etot: '2026-03-09T16:15:00Z',
    eldt: '2026-03-09T17:10:00Z', eibt: '2026-03-09T17:20:00Z',
    aobt: null, atot: null, aldt: null, aibt: null,
    blockTimePlanned: 80, blockTimeActual: null,
    paxCount: 6, clientName: 'Acme Group s.r.o.', delayMin: 0,
    crew: [{ pilotId: 'p1', role: 'PIC', isPF: false }, { pilotId: 'p2', role: 'SIC', isPF: true }],
    fuelPlanKg: 960, fuelUpliftKg: null, fuelRemainingKg: null,
    financials: { revenueCharter: 8500, revenueExtras: 0, costFuel: 1440, costFees: 800, costCrew: 320, costCatering: 180, costOther: 0, status: 'draft', invoiceNumber: null },
  },
  {
    id: 'f3', company: 'silesia_air' as Company,
    flightNumber: 'SA-315', type: 'charter', status: 'planned',
    aircraftId: 'a2', depIcao: 'LKPR', arrIcao: 'EDDF',
    depCity: 'Praha', arrCity: 'Frankfurt',
    eobt: '2026-03-10T07:00:00Z', etot: '2026-03-10T07:15:00Z',
    eldt: '2026-03-10T08:20:00Z', eibt: '2026-03-10T08:30:00Z',
    aobt: null, atot: null, aldt: null, aibt: null,
    blockTimePlanned: 90, blockTimeActual: null,
    paxCount: 5, clientName: 'Bayern Partners GmbH', delayMin: 0,
    crew: [{ pilotId: 'p3', role: 'PIC', isPF: true }, { pilotId: 'p2', role: 'SIC', isPF: false }],
    fuelPlanKg: 1050, fuelUpliftKg: null, fuelRemainingKg: null,
    financials: { revenueCharter: 9800, revenueExtras: 200, costFuel: 1575, costFees: 940, costCrew: 380, costCatering: 150, costOther: 0, status: 'draft', invoiceNumber: null },
  },
  {
    id: 'f4', company: 'stream_air' as Company,
    flightNumber: 'ST-101', type: 'charter', status: 'active',
    aircraftId: 'a4', depIcao: 'LKPR', arrIcao: 'LFPB',
    depCity: 'Praha', arrCity: 'Paříž Le Bourget',
    eobt: '2026-03-09T09:00:00Z', etot: '2026-03-09T09:15:00Z',
    eldt: '2026-03-09T11:05:00Z', eibt: '2026-03-09T11:15:00Z',
    aobt: '2026-03-09T09:02:00Z', atot: '2026-03-09T09:17:00Z', aldt: null, aibt: null,
    blockTimePlanned: 135, blockTimeActual: null,
    paxCount: 7, clientName: 'Bussard Capital SA', delayMin: 2,
    crew: [{ pilotId: 'p4', role: 'PIC', isPF: true }, { pilotId: 'p5', role: 'SIC', isPF: false }],
    fuelPlanKg: 1580, fuelUpliftKg: 1590, fuelRemainingKg: null,
    financials: { revenueCharter: 14500, revenueExtras: 600, costFuel: 2385, costFees: 1240, costCrew: 480, costCatering: 350, costOther: 0, status: 'approved', invoiceNumber: null },
  },
  {
    id: 'f5', company: 'silesia_air' as Company,
    flightNumber: 'SA-420', type: 'charter', status: 'planned',
    aircraftId: 'a1', depIcao: 'LKPR', arrIcao: 'LYBE',
    depCity: 'Praha', arrCity: 'Bělehrad',
    eobt: '2026-03-12T11:00:00Z', etot: '2026-03-12T11:15:00Z',
    eldt: '2026-03-12T13:10:00Z', eibt: '2026-03-12T13:20:00Z',
    aobt: null, atot: null, aldt: null, aibt: null,
    blockTimePlanned: 140, blockTimeActual: null,
    paxCount: 4, clientName: 'Adriatic Holdings', delayMin: 0,
    crew: [{ pilotId: 'p1', role: 'PIC', isPF: true }, { pilotId: 'p2', role: 'SIC', isPF: false }],
    fuelPlanKg: 1620, fuelUpliftKg: null, fuelRemainingKg: null,
    financials: { revenueCharter: 12800, revenueExtras: 0, costFuel: 2430, costFees: 1180, costCrew: 420, costCatering: 120, costOther: 0, status: 'draft', invoiceNumber: null },
  },
  {
    id: 'f6', company: 'stream_air' as Company,
    flightNumber: 'ST-108', type: 'charter', status: 'planned',
    aircraftId: 'a4', depIcao: 'LFPB', arrIcao: 'LKPR',
    depCity: 'Paříž Le Bourget', arrCity: 'Praha',
    eobt: '2026-03-09T15:30:00Z', etot: '2026-03-09T15:45:00Z',
    eldt: '2026-03-09T17:35:00Z', eibt: '2026-03-09T17:45:00Z',
    aobt: null, atot: null, aldt: null, aibt: null,
    blockTimePlanned: 135, blockTimeActual: null,
    paxCount: 7, clientName: 'Bussard Capital SA', delayMin: 0,
    crew: [{ pilotId: 'p4', role: 'PIC', isPF: false }, { pilotId: 'p5', role: 'SIC', isPF: true }],
    fuelPlanKg: 1560, fuelUpliftKg: null, fuelRemainingKg: null,
    financials: { revenueCharter: 14500, revenueExtras: 0, costFuel: 2340, costFees: 1220, costCrew: 480, costCatering: 350, costOther: 0, status: 'draft', invoiceNumber: null },
  },
  {
    id: 'f7', company: 'stream_air' as Company,
    flightNumber: 'ST-205', type: 'charter', status: 'planned',
    aircraftId: 'a5', depIcao: 'LKPR', arrIcao: 'LKTB',
    depCity: 'Praha', arrCity: 'Brno',
    eobt: '2026-03-10T14:00:00Z', etot: '2026-03-10T14:10:00Z',
    eldt: '2026-03-10T14:45:00Z', eibt: '2026-03-10T14:50:00Z',
    aobt: null, atot: null, aldt: null, aibt: null,
    blockTimePlanned: 50, blockTimeActual: null,
    paxCount: 5, clientName: 'Moravian Steel a.s.', delayMin: 0,
    crew: [{ pilotId: 'p6', role: 'PIC', isPF: true }],
    fuelPlanKg: 380, fuelUpliftKg: null, fuelRemainingKg: null,
    financials: { revenueCharter: 4200, revenueExtras: 0, costFuel: 570, costFees: 480, costCrew: 180, costCatering: 100, costOther: 0, status: 'draft', invoiceNumber: null },
  },
];

export function getExpiryDays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date('2026-03-09');
  const expiry = new Date(dateStr);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
export function getExpiryColor(days: number | null): string {
  if (days === null) return 'text-gray-400';
  if (days < 0) return 'text-red-400';
  if (days <= 30) return 'text-red-400';
  if (days <= 60) return 'text-amber-400';
  if (days <= 90) return 'text-yellow-400';
  return 'text-emerald-400';
}
export function getExpiryBg(days: number | null): string {
  if (days === null) return 'bg-gray-500/10 border-gray-500/20';
  if (days < 0) return 'bg-red-500/10 border-red-500/20';
  if (days <= 30) return 'bg-red-500/10 border-red-500/20';
  if (days <= 60) return 'bg-amber-500/10 border-amber-500/20';
  if (days <= 90) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-emerald-500/10 border-emerald-500/20';
}
export function getPilotById(id: string) { return PILOTS.find(p => p.id === id); }
export function getAircraftById(id: string) { return AIRCRAFT.find(a => a.id === id); }

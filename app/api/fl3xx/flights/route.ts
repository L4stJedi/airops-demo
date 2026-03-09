import { NextRequest, NextResponse } from 'next/server';
import { getFlights, FL3XX_CONFIGURED, type CompanySlug } from '@/lib/fl3xx';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const company = (req.nextUrl.searchParams.get('company') ?? 'silesia_air') as CompanySlug;
  try {
    const result = await getFlights(company);
    return NextResponse.json({
      ...result,
      configured: FL3XX_CONFIGURED,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

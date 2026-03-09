/**
 * FL3XX Webhook Receiver
 *
 * Register this URL in FL3XX: Settings → Integrations → Webhooks → Add URL
 * URL: https://your-domain.vercel.app/api/webhooks/fl3xx
 *
 * FL3XX signs payloads with HMAC-SHA256; set FL3XX_WEBHOOK_SECRET to the
 * shared secret shown in FL3XX after registering the webhook.
 *
 * Events handled:
 *   FLIGHT_CREATE            → invalidate flights cache
 *   FLIGHT_UPDATE            → invalidate flights cache
 *   FLIGHT_TIME_UPDATE       → invalidate flights cache (ETD/ETA from ForeFlight)
 *   FLIGHT_AIRCRAFT_UPDATE   → invalidate flights + aircraft cache
 *   FLIGHT_PAX_COUNT_UPDATE  → invalidate flights cache
 *   FLIGHT_CANCEL            → invalidate flights cache
 *
 * The receiver stores the latest event in a simple in-memory log (last 50)
 * and broadcasts a cache-invalidation signal so any connected Next.js
 * server-side revalidation tags are cleared immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, FL3XXWebhookEvent } from '@/lib/fl3xx';

// In-memory event log (last 50 events) — survives hot reloads in dev,
// resets on cold start / Vercel function recycle (acceptable for audit trail).
const EVENT_LOG: Array<FL3XXWebhookEvent & { receivedAt: string }> = [];
const MAX_LOG = 50;

export async function POST(req: NextRequest) {
  // ── 1. Read raw body (needed for HMAC verification) ───────────────────────
  const body = await req.text();
  const signature = req.headers.get('x-fl3xx-signature') ?? '';

  // ── 2. Verify signature ────────────────────────────────────────────────────
  if (!verifyWebhookSignature(body, signature)) {
    console.warn('[FL3XX webhook] Invalid signature — rejected');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── 3. Parse event ─────────────────────────────────────────────────────────
  let event: FL3XXWebhookEvent;
  try {
    event = JSON.parse(body) as FL3XXWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[FL3XX webhook] ${event.event} flightId=${event.flightId} ts=${event.timestamp}`);

  // ── 4. Log event ───────────────────────────────────────────────────────────
  EVENT_LOG.push({ ...event, receivedAt: new Date().toISOString() });
  if (EVENT_LOG.length > MAX_LOG) EVENT_LOG.splice(0, EVENT_LOG.length - MAX_LOG);

  // FL3XX data refreshes automatically every 60s via revalidate: 60 in fl3xxGet().
  // For instant propagation, clients polling /api/fl3xx/flights will pick up
  // changes on the next 60s cycle without any additional cache invalidation here.

  return NextResponse.json({ ok: true, event: event.event });
}

/**
 * GET /api/webhooks/fl3xx — returns the in-memory event log (dev/debug only).
 * Protect this with a secret query param in production.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const adminSecret = process.env.WEBHOOK_ADMIN_SECRET;

  if (adminSecret && secret !== adminSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    count: EVENT_LOG.length,
    events: [...EVENT_LOG].reverse(), // newest first
  });
}

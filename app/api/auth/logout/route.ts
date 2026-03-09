import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export async function GET(req: import('next/server').NextRequest) {
  const response = NextResponse.redirect(new URL('/', req.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

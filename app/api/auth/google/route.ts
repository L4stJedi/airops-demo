import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 501 });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXTAUTH_URL}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
  response.cookies.set('oauth_state', state, { httpOnly: true, secure: true, maxAge: 600, sameSite: 'lax' });
  return response;
}

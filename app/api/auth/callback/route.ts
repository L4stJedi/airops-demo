import { NextRequest, NextResponse } from 'next/server';
import { createSession, getCompanyFromEmail, SESSION_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = req.cookies.get('oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXTAUTH_URL}/api/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token');

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userRes.json();
    if (!profile.email) throw new Error('No email in profile');

    const company = getCompanyFromEmail(profile.email);
    const session = await createSession({
      name: profile.name ?? profile.email,
      email: profile.email,
      picture: profile.picture,
      company,
    });

    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
      sameSite: 'lax',
    });
    response.cookies.delete('oauth_state');
    return response;
  } catch (e) {
    console.error('[OAuth callback]', e);
    return NextResponse.redirect(new URL('/?error=oauth_failed', req.url));
  }
}

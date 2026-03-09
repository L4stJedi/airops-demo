import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'airops_session';
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'airops-demo-secret-change-in-production-32x'
);

export interface SessionUser {
  name: string;
  email: string;
  picture?: string;
  company: 'silesia_air' | 'stream_air';
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export function getCompanyFromEmail(email: string): 'silesia_air' | 'stream_air' {
  const domain = email.split('@')[1] ?? '';
  const map: Record<string, 'silesia_air' | 'stream_air'> = {
    'silesiaair.cz': 'silesia_air',
    'airstreamjets.aero': 'stream_air',
  };
  // Also support custom env var overrides
  try {
    const envMap = process.env.GOOGLE_DOMAIN_MAP
      ? JSON.parse(process.env.GOOGLE_DOMAIN_MAP)
      : {};
    if (envMap[domain]) return envMap[domain];
  } catch { /* ignore */ }
  return map[domain] ?? 'silesia_air';
}

export { SESSION_COOKIE };

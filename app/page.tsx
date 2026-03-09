'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { COMPANIES } from '@/lib/mock-data';
import MainLayout from '@/components/MainLayout';

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const { company, setCompany, setUser } = useApp();
  const co = COMPANIES[company];

  // Check for existing Google session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser({ ...data.user, authenticated: true });
          setCompany(data.user.company);
          setLoggedIn(true);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));

    // Check if Google OAuth is configured
    fetch('/api/auth/google', { method: 'HEAD' })
      .then(r => setGoogleConfigured(r.status !== 501))
      .catch(() => {});
  }, [setUser, setCompany]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070e1d' }}>
        <div className="text-gray-500 text-sm animate-pulse">Ověřuji přihlášení…</div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${co.brand}40 0%, #070e1d 60%)` }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-black text-white shadow-2xl"
              style={{ background: co.color }}>
              {co.icao}
            </div>
            <h1 className="text-3xl font-bold text-white">{co.name}</h1>
            <p className="text-sm mt-1" style={{ color: co.color }}>{co.tagline}</p>
          </div>

          <div className="rounded-2xl p-6 border"
            style={{ background: 'rgba(13,21,38,0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>

            {/* Google Sign In */}
            {googleConfigured && (
              <>
                <a href="/api/auth/google"
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 mb-4 border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Přihlásit se přes Google Workspace
                </a>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <span className="text-xs text-gray-600">nebo demo přístup</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                </div>
              </>
            )}

            <p className="text-sm mb-4 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Vyberte společnost
            </p>

            <div className="space-y-2 mb-4">
              {(Object.entries(COMPANIES) as [keyof typeof COMPANIES, typeof COMPANIES[keyof typeof COMPANIES]][]).map(([key, c]) => (
                <button key={key} onClick={() => setCompany(key)}
                  className="w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all"
                  style={company === key
                    ? { background: c.subtle, borderColor: c.color }
                    : { background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: c.color, color: c.gold ? '#1a0e00' : 'white' }}>
                    {c.icao}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{c.name}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.tagline}</div>
                  </div>
                  {company === key && (
                    <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center text-xs"
                      style={{ background: co.color, color: co.gold ? '#1a0e00' : 'white' }}>✓</div>
                  )}
                </button>
              ))}
            </div>

            <button onClick={() => setLoggedIn(true)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: co.color, color: co.gold ? '#1a0e00' : 'white' }}>
              Demo přístup (bez přihlášení)
            </button>
            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
              AirOps Suite · Demo mode
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}

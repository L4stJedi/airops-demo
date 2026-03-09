'use client';
import { useState } from 'react';
import { useApp } from '@/lib/context';
import { COMPANIES } from '@/lib/mock-data';
import MainLayout from '@/components/MainLayout';

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const { company, setCompany } = useApp();
  const co = COMPANIES[company];

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${co.brand}40 0%, #070e1d 60%)` }}>
        <div className="w-full max-w-sm">
          {/* Logo area */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-black text-white shadow-2xl"
              style={{ background: co.color }}>
              {co.icao}
            </div>
            <h1 className="text-3xl font-bold text-white">{co.name}</h1>
            <p className="text-sm mt-1" style={{ color: co.color }}>{co.tagline}</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-6 border"
            style={{ background: 'rgba(13,21,38,0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>

            <p className="text-sm mb-4 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Vyberte společnost
            </p>

            <div className="space-y-2 mb-6">
              {(Object.entries(COMPANIES) as [keyof typeof COMPANIES, typeof COMPANIES[keyof typeof COMPANIES]][]).map(([key, c]) => (
                <button
                  key={key}
                  onClick={() => setCompany(key)}
                  className="w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all"
                  style={company === key
                    ? { background: c.subtle, borderColor: c.color }
                    : { background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
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

            <button
              onClick={() => setLoggedIn(true)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: co.color, color: co.gold ? '#1a0e00' : 'white' }}
            >
              Přihlásit se · Demo
            </button>

            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
              AirOps Suite v1.0 · Demo mode
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}

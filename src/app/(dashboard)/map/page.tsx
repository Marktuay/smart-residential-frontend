"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Map as MapIcon, ShieldAlert } from 'lucide-react';

// Importación dinámica para evitar problemas de SSR con react-leaflet (window is not defined)
const LiveMap = dynamic(() => import('@/components/map/LiveMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', color: 'white', borderRadius: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <MapIcon size={40} className="animate-pulse" color="#FACC15" />
        <span>Inicializando motores del mapa...</span>
      </div>
    </div>
  )
});

export default function OperativeMapPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapIcon color="#FACC15" />
            Mapa Operativo
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Visualización en tiempo real de guardias activos y puntos de control (Casas).
          </p>
        </div>
        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
          <ShieldAlert size={18} />
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Actualización Automática (10s)</span>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <LiveMap />
      </div>
    </div>
  );
}

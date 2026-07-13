'use client';

import React from 'react';
import { LifeBuoy, Hammer } from 'lucide-react';

export default function AyudaPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <Hammer size={64} color="var(--primary)" style={{ opacity: 0.5 }} />
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
        Temas de Ayuda
      </h1>
      <p style={{ color: 'var(--text-muted)' }}>Esta sección se encuentra en construcción.</p>
    </div>
  );
}

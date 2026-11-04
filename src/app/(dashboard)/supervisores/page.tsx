'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupervisoresRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/usuarios');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #f3f3f3', borderTop: '3px solid #FACC15', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontWeight: '500' }}>Redirigiendo a Gestión Centralizada de Personal...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { finanzasApi, ResumenFinanzas } from '@/lib/api';
import { DollarSign, AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';

export default function CobrosPage() {
  const [resumen, setResumen] = useState<ResumenFinanzas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResumen = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await finanzasApi.getResumen();
      setResumen(data);
    } catch (err: any) {
      console.error("Error fetching finanzas:", err);
      setError("No se pudo obtener la información financiera. El servicio puede estar temporalmente no disponible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumen();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Estado de Cuenta y Cobros</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Resumen financiero consolidado desde el sistema central.</p>
        </div>
        <button 
          onClick={fetchResumen}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          Actualizar Datos
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Cargando información financiera...</p>
      ) : resumen ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Tarjeta 1: Total Recaudado */}
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>Total Recaudado (Mes)</h3>
                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', color: '#10b981' }}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {formatCurrency(resumen.total_recaudado)}
              </div>
            </div>

            {/* Tarjeta 2: Morosidad */}
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>Total Morosidad</h3>
                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', color: '#ef4444' }}>
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
                {formatCurrency(resumen.total_morosidad)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {resumen.cobros_pendientes} residentes en mora
              </div>
            </div>

            {/* Tarjeta 3: Cumplimiento */}
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>Tasa de Cumplimiento</h3>
                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: '#3b82f6' }}>
                  <TrendingUp size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {resumen.tasa_cumplimiento}%
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '2rem', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Información del Sistema</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Este módulo consume información directamente desde el sistema contable corporativo. Las gestiones de cobro, reportes detallados y facturación se realizan exclusivamente en dicho sistema.
            </p>
            {resumen.fuente && (
              <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Aviso: {resumen.fuente}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

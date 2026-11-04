'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Search, 
  RefreshCw, 
  Download, 
  Building, 
  Clock, 
  User, 
  Terminal,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { auditoriaApi, LogAuditoria, residencialApi, ResidencialInfo } from '@/lib/api';

const CATEGORIAS = [
  { id: 'TODAS', label: 'Todas las Acciones' },
  { id: 'USUARIO', label: 'Usuarios y Seguridad' },
  { id: 'TURNO', label: 'Turnos y Rol' },
  { id: 'RONDA', label: 'Rondas y Marcaciones' },
  { id: 'INCIDENTE', label: 'Incidencias' },
  { id: 'VISITA', label: 'Accesos y Visitas' },
  { id: 'FLOTA', label: 'Flota 360' }
];

export default function AuditoriaPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencial, setSelectedResidencial] = useState<string>('GLOBAL');
  const [rol, setRol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('TODAS');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('user_role');
      setRol(userRole);

      if (userRole !== 'ADMIN' && userRole !== 'SISADMIN') {
        router.push('/');
        return;
      }

      if (userRole === 'SISADMIN') {
        cargarResidenciales();
      }
      fetchLogs('GLOBAL');
    }
  }, [router]);

  const cargarResidenciales = async () => {
    try {
      const data = await residencialApi.getResidenciales();
      setResidenciales(data || []);
    } catch (err) {
      console.error("Error al cargar residenciales:", err);
    }
  };

  const fetchLogs = async (resId?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const targetResId = resId !== undefined ? resId : selectedResidencial;
      const data = await auditoriaApi.getLogs(targetResId === 'GLOBAL' ? '' : targetResId);
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setErrorMsg('No se pudo cargar el historial de auditoría del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleResidencialChange = (newResId: string) => {
    setSelectedResidencial(newResId);
    fetchLogs(newResId);
  };

  const handleExportCSV = () => {
    if (logsFiltrados.length === 0) return;

    const headers = ['ID', 'Residencial', 'Acción', 'Actor / Usuario', 'IP', 'Detalles', 'Fecha y Hora'];
    const rows = logsFiltrados.map(l => [
      l.id,
      l.residencial_id || 'N/A',
      l.accion,
      `"${(l.actor || '').replace(/"/g, '""')}"`,
      l.ip || 'N/A',
      `"${(l.detalles || '').replace(/"/g, '""')}"`,
      new Date(l.created_at).toLocaleString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const logsFiltrados = logs.filter(log => {
    // Filtro por categoría
    if (categoriaActiva !== 'TODAS') {
      const act = log.accion.toUpperCase();
      if (categoriaActiva === 'USUARIO' && !act.includes('USUARIO') && !act.includes('AUTH') && !act.includes('LOGIN')) return false;
      if (categoriaActiva === 'TURNO' && !act.includes('TURNO')) return false;
      if (categoriaActiva === 'RONDA' && !act.includes('RONDA') && !act.includes('MARCACION') && !act.includes('QR')) return false;
      if (categoriaActiva === 'INCIDENTE' && !act.includes('INCIDENTE')) return false;
      if (categoriaActiva === 'VISITA' && !act.includes('VISITA')) return false;
      if (categoriaActiva === 'FLOTA' && !act.includes('FLOTA') && !act.includes('INSPECCION_360') && !act.includes('FSM')) return false;
    }

    // Filtro de texto
    const q = searchTerm.toLowerCase();
    return (
      (log.accion || '').toLowerCase().includes(q) ||
      (log.actor || '').toLowerCase().includes(q) ||
      (log.detalles || '').toLowerCase().includes(q) ||
      (log.ip || '').toLowerCase().includes(q) ||
      (log.residencial_id || '').toLowerCase().includes(q)
    );
  });

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREA') || act.includes('REGISTR') || act.includes('CHECKIN')) {
      return { bg: '#dcfce7', color: '#15803d' };
    }
    if (act.includes('ELIMIN') || act.includes('DELETE') || act.includes('ERROR') || act.includes('RECHAZ')) {
      return { bg: '#fee2e2', color: '#b91c1c' };
    }
    if (act.includes('ACTUALIZ') || act.includes('MODIF') || act.includes('TRANSICION') || act.includes('ASIGN')) {
      return { bg: '#e0f2fe', color: '#0369a1' };
    }
    return { bg: '#f1f5f9', color: '#475569' };
  };

  if (loading && logs.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando bitácora de auditoría inmutable...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={28} color="#FACC15" />
            Bitácora de Auditoría y Trazabilidad (AuditLog)
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Registro inmutable de actividades sensibles, transiciones y accesos en el sistema.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {rol === 'SISADMIN' && residenciales.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0f172a', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
              <Building size={16} color="#FACC15" />
              <select
                value={selectedResidencial}
                onChange={e => handleResidencialChange(e.target.value)}
                style={{ backgroundColor: 'transparent', color: '#ffffff', border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
              >
                <option value="GLOBAL" style={{ backgroundColor: '#0f172a' }}>🏢 Todas las Instalaciones (Global)</option>
                {residenciales.map(r => (
                  <option key={r.id} value={r.id} style={{ backgroundColor: '#0f172a' }}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => fetchLogs()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
          >
            <RefreshCw size={18} />
            Actualizar
          </button>

          <button
            onClick={handleExportCSV}
            disabled={logsFiltrados.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1e293b', color: 'white', padding: '0.65rem 1.25rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: logsFiltrados.length === 0 ? 'not-allowed' : 'pointer', opacity: logsFiltrados.length === 0 ? 0.6 : 1 }}
          >
            <Download size={18} />
            Exportar CSV ({logsFiltrados.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filtros por Categoría */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: categoriaActiva === cat.id ? '#FACC15' : 'white',
              color: categoriaActiva === cat.id ? '#1e293b' : '#64748b'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '500px' }}>
        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          placeholder="Filtrar por acción, usuario, IP, residencial o detalles..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Tabla de Logs */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem' }}>Fecha y Hora</th>
                <th style={{ padding: '0.75rem 1rem' }}>Acción</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actor</th>
                <th style={{ padding: '0.75rem 1rem' }}>IP Origen</th>
                <th style={{ padding: '0.75rem 1rem' }}>Residencial</th>
                <th style={{ padding: '0.75rem 1rem' }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <Terminal size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    <p style={{ margin: 0, fontWeight: '500' }}>No se encontraron registros de auditoría que coincidan.</p>
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log, idx) => {
                  const badge = getActionBadgeColor(log.accion);
                  return (
                    <tr key={log.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={14} color="#94a3b8" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                          {log.accion}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontWeight: '600', color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={14} color="#64748b" />
                          <span>{log.actor || 'SISTEMA'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {log.ip || '127.0.0.1'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.8rem' }}>
                        {log.residencial_id || 'GLOBAL'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155', maxWidth: '350px' }}>
                        {log.detalles}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

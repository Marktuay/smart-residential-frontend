'use client';

import React, { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  AlertCircle, 
  Users, 
  MapPin, 
  RefreshCw, 
  Clock, 
  Shield, 
  UserCheck,
  CheckCircle2,
  Navigation,
  ExternalLink,
  QrCode,
  Building,
  Car,
  Siren,
  ArrowRight,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { 
  rondasApi, 
  incidentesApi, 
  visitasApi, 
  usuariosApi, 
  residencialApi,
  trackingApi,
  AsignacionRonda, 
  ProgramaRonda, 
  Incidente, 
  Visita, 
  Usuario,
  MarcacionRonda,
  ResidencialInfo,
  Ubicacion
} from '@/lib/api';

const getNombreFromEmail = (email: string) => {
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[\._\-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

export default function OperativoPage() {
  const [activeRounds, setActiveRounds] = useState<AsignacionRonda[]>([]);
  const [programas, setProgramas] = useState<ProgramaRonda[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incidente[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visita[]>([]);
  const [staffStatus, setStaffStatus] = useState<Usuario[]>([]);
  const [marcaciones, setMarcaciones] = useState<MarcacionRonda[]>([]);
  const [guardiasLive, setGuardiasLive] = useState<Ubicacion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // SISADMIN Multi-tenant
  const [userRole, setUserRole] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [roundsData, programData, incidentsData, visitsData, staffData, marcsData, liveData] = await Promise.all([
        rondasApi.getAsignaciones().catch(() => []),
        rondasApi.getProgramas().catch(() => []),
        incidentesApi.getIncidentes().catch(() => []),
        visitasApi.getVisitas().catch(() => []),
        usuariosApi.getUsuarios().catch(() => []),
        rondasApi.getMarcaciones(20).catch(() => []),
        trackingApi.getUbicaciones().catch(() => [])
      ]);

      setActiveRounds(roundsData || []);
      setProgramas(programData || []);
      setRecentIncidents(incidentsData || []);
      setRecentVisits(visitsData || []);
      setStaffStatus(staffData || []);
      setMarcaciones(marcsData || []);
      setGuardiasLive(liveData || []);
    } catch (e) {
      console.error('Error fetching Operativo data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    const resId = localStorage.getItem('residencial_id') || '';
    setUserRole(role);
    setSelectedResidencialId(resId);

    if (role === 'SISADMIN') {
      residencialApi.getResidenciales().then(list => setResidenciales(list || [])).catch(() => {});
    }

    fetchData();

    // Auto-refresh cada 15 segundos para monitoreo operativo en vivo
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleResidencialChange = (newResId: string) => {
    setSelectedResidencialId(newResId);
    localStorage.setItem('residencial_id', newResId);
    fetchData();
  };

  const handleResolverIncidente = async (id: number) => {
    setResolvingId(id);
    try {
      await incidentesApi.resolverIncidente(id);
      fetchData(true);
    } catch (e) {
      console.error(e);
      alert('Error resolviendo el incidente.');
    } finally {
      setResolvingId(null);
    }
  };

  const getGuardiaName = (usuarioId: number) => {
    const user = staffStatus.find(u => u.id === usuarioId);
    return user ? (user.nombre_completo || getNombreFromEmail(user.email)) : `Guardia #${usuarioId}`;
  };

  const getProgramaNombre = (programaId: number) => {
    const prog = programas.find(p => p.id === programaId);
    return prog ? prog.nombre : `Programa #${programaId}`;
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '1rem',
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    minHeight: '280px'
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
    marginBottom: '0.25rem'
  };

  const sectionTitleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.05rem',
    fontWeight: '800' as const,
    color: 'var(--text-primary)'
  };

  return (
    <div style={{ padding: '1rem', color: 'var(--text-primary)', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
            <Shield size={24} color="#FACC15" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Consola de Operaciones en Vivo
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Supervisión de rondas, incidencias activas, accesos en garita y geoposición satelital (NCS365).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', 
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', 
              padding: '0.625rem 1.15rem', borderRadius: '0.5rem', fontWeight: '700', 
              cursor: refreshing ? 'not-allowed' : 'pointer', color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)', fontSize: '0.8125rem'
            }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{refreshing ? "Sincronizando..." : "Actualizar"}</span>
          </button>

          <Link
            href="/map"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FACC15',
              color: '#0f172a',
              padding: '0.625rem 1.15rem',
              borderRadius: '0.5rem',
              fontWeight: '800',
              fontSize: '0.8125rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(250, 204, 21, 0.25)'
            }}
          >
            <Navigation size={15} /> Ver Mapa Satelital
          </Link>
        </div>
      </div>

      {/* Selector Multi-Tenant SISADMIN */}
      {userRole === 'SISADMIN' && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Building size={18} color="#FACC15" />
          <label style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>Residencial Activo:</label>
          <select
            value={selectedResidencialId}
            onChange={(e) => handleResidencialChange(e.target.value)}
            style={{ padding: '0.45rem 1rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '600' }}
          >
            {residenciales.map(r => (
              <option key={r.id} value={r.id}>{r.nombre} ({r.id})</option>
            ))}
          </select>
        </div>
      )}

      {/* Grid de Monitoreo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        
        {/* Card 1: Rondas Activas y Progreso */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <ClipboardList size={20} color="#ca8a04" />
              <span>Rondas de Patrullaje Activas</span>
            </div>
            <Link href="/rondas" style={{ fontSize: '0.75rem', color: '#FACC15', textDecoration: 'none', fontWeight: '700' }}>
              Ver Rondas &gt;
            </Link>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '280px' }}>
            {activeRounds.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem 1rem' }}>
                <ClipboardList size={36} color="#64748b" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: '700' }}>No hay rondas asignadas activas</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Programe una ruta para los guardias en servicio.</p>
              </div>
            ) : (
              activeRounds.map((r) => {
                const completados = r.puntos_completados || 0;
                const total = r.puntos_total || 1;
                const pct = r.porcentaje_cumplimiento || Math.round((completados / total) * 100);

                return (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.875rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.625rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Shield size={16} color="#ca8a04" />
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{getProgramaNombre(r.programa_id)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Oficial: <strong>{getGuardiaName(r.usuario_id)}</strong></div>
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: '800',
                        backgroundColor: r.estado === 'FINALIZADA' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(250, 204, 21, 0.15)',
                        color: r.estado === 'FINALIZADA' ? '#16a34a' : '#ca8a04'
                      }}>
                        {r.estado || 'PENDIENTE'}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct === 100 ? '#22c55e' : '#FACC15', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card 2: Incidentes Reportados (Con botón de resolver) */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <AlertCircle size={20} color="#ef4444" />
              <span>Incidentes y Novedades</span>
            </div>
            <Link href="/incidentes" style={{ fontSize: '0.75rem', color: '#ef4444', textDecoration: 'none', fontWeight: '700' }}>
              Bitácora Completa &gt;
            </Link>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '280px' }}>
            {recentIncidents.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem 1rem' }}>
                <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0, fontWeight: '700' }}>Sin incidentes pendientes</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>El residencial opera con normalidad.</p>
              </div>
            ) : (
              recentIncidents.slice(0, 5).map((inc) => (
                <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.625rem', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '4px', height: '32px', borderRadius: '2px',
                      backgroundColor: inc.nivel_gravedad === 'ALTA' || inc.nivel_gravedad === 'CRITICA' ? '#ef4444' : inc.nivel_gravedad === 'MEDIA' ? '#f59e0b' : '#3b82f6'
                    }} />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{inc.tipo}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inc.descripcion}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', padding: '0.2rem 0.45rem', borderRadius: '4px', fontWeight: '800',
                      backgroundColor: inc.estado === 'RESUELTO' ? '#dcfce7' : '#fee2e2',
                      color: inc.estado === 'RESUELTO' ? '#16a34a' : '#dc2626'
                    }}>
                      {inc.estado}
                    </span>

                    {inc.estado !== 'RESUELTO' && inc.id && (
                      <button
                        onClick={() => handleResolverIncidente(inc.id!)}
                        disabled={resolvingId === inc.id}
                        title="Marcar como Resuelto"
                        style={{
                          padding: '0.35rem 0.5rem',
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <Check size={12} /> {resolvingId === inc.id ? '...' : 'Resolver'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Auditoría en Vivo de Marcaciones QR */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <QrCode size={20} color="#ca8a04" />
              <span>Escaneos QR en Directo</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '800' }}>● En tiempo real</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', maxHeight: '280px' }}>
            {marcaciones.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem 1rem' }}>
                <QrCode size={36} color="#64748b" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: '700' }}>Sin marcaciones registradas</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Los escaneos de la app móvil aparecerán al instante.</p>
              </div>
            ) : (
              marcaciones.slice(0, 6).map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: '800', color: 'var(--text-primary)', display: 'block' }}>
                      {m.punto_nombre || `Punto #${m.punto_qr_id}`} {m.numero_casa ? `(Casa ${m.numero_casa})` : ''}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                      Oficial: {m.guardia_nombre || 'Guardia Activo'}
                    </span>
                  </div>

                  <span style={{ fontWeight: '700', color: '#16a34a' }}>
                    {m.fecha_hora ? new Date(m.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 4: Control de Accesos y Visitas Recientes */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <Car size={20} color="#2563eb" />
              <span>Accesos y Visitas en Garita</span>
            </div>
            <Link href="/visitas" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', fontWeight: '700' }}>
              Ver Garita &gt;
            </Link>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', maxHeight: '280px' }}>
            {recentVisits.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem 1rem' }}>
                <Car size={36} color="#64748b" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: '700' }}>Sin visitas registradas hoy</p>
              </div>
            ) : (
              recentVisits.slice(0, 5).map((v) => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{v.nombre_visitante}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Destino: <strong>Casa {v.numero_casa}</strong> {v.placa_vehiculo ? `| Placa: ${v.placa_vehiculo}` : ''}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontWeight: '800',
                    backgroundColor: v.estado === 'EN_CURSO' ? '#dcfce7' : '#f1f5f9',
                    color: v.estado === 'EN_CURSO' ? '#15803d' : '#64748b'
                  }}>
                    {v.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

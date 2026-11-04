'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  ShieldCheck, 
  Users,
  Home,
  Activity,
  Bell,
  RefreshCw,
  Building,
  Navigation,
  ArrowRight,
  Clock,
  Car,
  QrCode,
  Shield,
  Siren,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Link from 'next/link';
import { dashboardApi, residencialApi, DashboardStats, ResidencialInfo } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // SISADMIN Multi-tenant
  const [userRole, setUserRole] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      if (err.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jwt_token');
          window.location.href = '/login';
        }
      } else {
        setError('Error al cargar métricas del centro de mando. Verifique la conexión.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
    const resId = typeof window !== 'undefined' ? (localStorage.getItem('residencial_id') || '') : '';
    setUserRole(role);
    setSelectedResidencialId(resId);

    const init = async () => {
      if (role === 'SISADMIN') {
        try {
          const list = await residencialApi.getResidenciales();
          setResidenciales(list || []);
        } catch (e) {
          console.error(e);
        }
      }
      fetchStats();
    };

    init();

    // Auto-refresh cada 30 segundos para reflejar escaneos móviles e incidentes
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleResidencialChange = (newResId: string) => {
    setSelectedResidencialId(newResId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('residencial_id', newResId);
    }
    fetchStats();
  };

  // Gráfica de actividad dinámica: si el backend envía datos reales, los usamos; si está vacío, mostrar los 7 días con 0
  const chartData = (stats?.actividad_semanal && stats.actividad_semanal.length > 0)
    ? stats.actividad_semanal
    : [
        { name: 'Lun', accesos: 0, rondas: 0 },
        { name: 'Mar', accesos: 0, rondas: 0 },
        { name: 'Mié', accesos: 0, rondas: 0 },
        { name: 'Jue', accesos: 0, rondas: 0 },
        { name: 'Vie', accesos: 0, rondas: 0 },
        { name: 'Sáb', accesos: 0, rondas: 0 },
        { name: 'Dom', accesos: 0, rondas: 0 },
      ];

  const novedades = stats?.ultimas_novedades || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Encabezado y Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
              <Shield size={24} color="#FACC15" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Centro de Mando & Control
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.875rem' }}>
                Métricas operativas en tiempo real conectadas con la terminal móvil de guardias y garita.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '0.625rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '700',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Sincronizando...' : 'Actualizar'}
          </button>

          <Link
            href="/operativo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#1e293b',
              color: '#FACC15',
              border: '1px solid #334155',
              padding: '0.625rem 1.15rem',
              borderRadius: '0.5rem',
              fontWeight: '800',
              fontSize: '0.8125rem',
              textDecoration: 'none'
            }}
          >
            <Activity size={15} /> Consola Operativa
          </Link>

          <Link
            href="/map"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FACC15',
              color: '#0f172a',
              border: 'none',
              padding: '0.625rem 1.15rem',
              borderRadius: '0.5rem',
              fontWeight: '800',
              fontSize: '0.8125rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(250, 204, 21, 0.25)'
            }}
          >
            <Navigation size={15} /> Mapa Táctico en Vivo
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

      {error && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '0.625rem', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Cargando datos en vivo del centro de mando...
        </div>
      ) : (
        <>
          {/* Tarjetas de Métricas Principales (KPIs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            
            {/* KPI 1: Incidentes Activos */}
            <Link href="/incidentes" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.875rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Incidentes Activos</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.875rem', fontWeight: '900', color: stats?.criticos ? '#ef4444' : 'var(--text-primary)' }}>
                  {stats?.activos || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: stats?.criticos ? '#ef4444' : 'var(--text-secondary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {stats?.criticos ? `⚠️ ${stats.criticos} de prioridad Crítica/Alta` : `${stats?.resueltos_hoy || 0} resueltos hoy`}
                </div>
              </div>
            </Link>

            {/* KPI 2: Rondas Realizadas Hoy */}
            <Link href="/rondas" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.875rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Rondas / Marcaciones</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.875rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {stats?.rondas_hoy || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700' }}>
                  {stats?.casas_qr || 0} Puntos QR bajo monitoreo
                </div>
              </div>
            </Link>

            {/* KPI 3: Visitas y Control Garita */}
            <Link href="/visitas" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.875rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Visitas Registradas Hoy</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(250, 204, 21, 0.15)', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.875rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {stats?.visitas_hoy || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ca8a04', fontWeight: '700' }}>
                  Control de accesos en garita activo
                </div>
              </div>
            </Link>

            {/* KPI 4: Residentes & Seguridad */}
            <Link href="/residencial" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.875rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Residentes Oficiales</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Home size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.875rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {stats?.residentes || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                  {stats?.usuarios_activos || 0} Personal de guardia activo
                </div>
              </div>
            </Link>

          </div>

          {/* Gráficos Dinámicos y Feed de Novedades */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Gráfico de Actividad Semanal */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="#FACC15" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    Actividad Operativa Semanal
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: '700' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb' }}>
                    <span style={{ width: '8px', height: '8px', backgroundColor: '#2563eb', borderRadius: '50%' }} /> Accesos / Visitas
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a' }}>
                    <span style={{ width: '8px', height: '8px', backgroundColor: '#16a34a', borderRadius: '50%' }} /> Rondas QR
                  </span>
                </div>
              </div>

              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAccesos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRondas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="accesos" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorAccesos)" name="Accesos Garita" />
                    <Area type="monotone" dataKey="rondas" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorRondas)" name="Rondas QR" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Últimas Novedades en Vivo */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={20} color="#ca8a04" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    Últimas Novedades en Terreno
                  </h2>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '800' }}>● En Directo</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '260px' }}>
                {novedades.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    <Shield size={36} color="#64748b" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: '700' }}>Sin eventos recientes</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Cuando los oficiales reporten incidencias, escaneen códigos o den paso a visitantes desde la terminal móvil, aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  novedades.map((item, idx) => {
                    const isIncidente = item.tipo === 'INCIDENTE';
                    const isRonda = item.tipo === 'RONDA';
                    const isVisita = item.tipo === 'VISITA';

                    const iconColor = isIncidente ? '#ef4444' : isRonda ? '#16a34a' : '#2563eb';
                    const iconBg = isIncidente ? 'rgba(239, 68, 68, 0.12)' : isRonda ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)';

                    return (
                      <div
                        key={item.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-body)',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border-color)',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isIncidente ? <Siren size={18} /> : isRonda ? <QrCode size={18} /> : <Car size={18} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                              {item.titulo}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {item.time}
                          </span>
                          {item.nivel && (
                            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: '800', color: '#ef4444' }}>
                              [{item.nivel}]
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <Link
                  href="/operativo"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8125rem',
                    fontWeight: '800',
                    color: '#ca8a04',
                    textDecoration: 'none'
                  }}
                >
                  Abrir Consola Operativa Completa <ArrowRight size={14} />
                </Link>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

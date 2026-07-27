'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  ShieldCheck, 
  Users,
  Home,
  Activity,
  Bell
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
import api from '@/lib/api';

interface DashboardStats {
  activos: number;
  criticos: number;
  resueltos_hoy: number;
  total_historico: number;
  rondas_hoy: number;
  visitas_hoy: number;
  complejos: number;
  casas_qr: number;
  residentes: number;
  usuarios_activos: number;
}

// Datos estáticos para simular la gráfica de actividad semanal
const chartData = [
  { name: 'Lun', accesos: 120, rondas: 15 },
  { name: 'Mar', accesos: 150, rondas: 18 },
  { name: 'Mié', accesos: 180, rondas: 16 },
  { name: 'Jue', accesos: 130, rondas: 20 },
  { name: 'Vie', accesos: 210, rondas: 25 },
  { name: 'Sáb', accesos: 250, rondas: 22 },
  { name: 'Dom', accesos: 190, rondas: 18 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
        if (!token) {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }

        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        if (err.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('jwt_token');
            window.location.href = '/login';
          }
        } else {
          setError('Error al cargar los datos del dashboard. Verifique su conexión al backend.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="section-title">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Resumen General</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Panel de Control · Centro de Mando</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '0.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando estadísticas...</div>
      ) : (
        <>
          {/* Tarjetas Principales (KPIs) */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {/* Tarjeta 1: Incidentes */}
            <div className="stat-card blue">
              <div className="stat-card-header">
                <div className="stat-card-title">Incidentes Activos</div>
                <div className="stat-card-icon blue"><AlertCircle size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.activos || 0}</div>
              <div className="stat-card-desc" style={stats?.criticos ? { color: 'var(--danger)' } : {}}>
                {stats?.criticos || 0} de prioridad Crítica
              </div>
            </div>

            {/* Tarjeta 2: Rondas */}
            <div className="stat-card green">
              <div className="stat-card-header">
                <div className="stat-card-title">Rondas Realizadas</div>
                <div className="stat-card-icon green"><ShieldCheck size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.rondas_hoy || 0}</div>
              <div className="stat-card-desc">Registradas el día de hoy</div>
            </div>

            {/* Tarjeta 3: Visitas */}
            <div className="stat-card orange">
              <div className="stat-card-header">
                <div className="stat-card-title">Visitas Registradas</div>
                <div className="stat-card-icon orange"><Users size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.visitas_hoy || 0}</div>
              <div className="stat-card-desc">Ingresos validados hoy</div>
            </div>

            {/* Tarjeta 4: Residentes */}
            <div className="stat-card purple">
              <div className="stat-card-header">
                <div className="stat-card-title">Total Residentes</div>
                <div className="stat-card-icon purple"><Home size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.residentes || 0}</div>
              <div className="stat-card-desc">{stats?.casas_qr || 0} Puntos QR habitacionales</div>
            </div>
          </div>

          {/* Sección de Gráficos y Actividad Reciente */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Gráfico */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Activity size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Actividad Semanal</h2>
              </div>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAccesos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRondas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="accesos" stroke="var(--primary)" fillOpacity={1} fill="url(#colorAccesos)" name="Accesos" />
                    <Area type="monotone" dataKey="rondas" stroke="var(--success)" fillOpacity={1} fill="url(#colorRondas)" name="Rondas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Últimas Novedades */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Bell size={20} color="var(--warning)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Últimas Novedades</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { id: 1, title: 'Nueva Visita', desc: 'Ingreso peatonal - Proveedor', time: 'Hace 5 min' },
                  { id: 2, title: 'Ronda Completada', desc: 'Sector Norte - Sin novedades', time: 'Hace 12 min' },
                  { id: 3, title: 'Alerta Abierta', desc: 'Vehículo mal estacionado - Zona B', time: 'Hace 45 min' },
                  { id: 4, title: 'Alerta Abierta', desc: 'Ruido excesivo - Casa 42', time: 'Hace 2 horas' },
                ].map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.desc}</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {item.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

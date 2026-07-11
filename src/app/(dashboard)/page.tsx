'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database,
  Building,
  Home,
  Users,
  ShieldCheck,
  UserX,
  MapPin
} from 'lucide-react';
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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Error al cargar los datos del dashboard. Verifique su conexión al backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="section-title">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Resumen General</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Panel de Control · informatica@newcentury.net</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando estadísticas...</div>
      ) : (
        <>
          <div className="sidebar-section-title" style={{ paddingLeft: 0 }}>INCIDENCIAS</div>
          <div className="dashboard-grid">
            <div className="stat-card blue">
              <div className="stat-card-header">
                <div className="stat-card-title">Activos</div>
                <div className="stat-card-icon blue"><Clock size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.activos || 0}</div>
              <div className="stat-card-desc">Pendientes de resolución</div>
            </div>
            
            <div className="stat-card red">
              <div className="stat-card-header">
                <div className="stat-card-title">Críticos</div>
                <div className="stat-card-icon red"><AlertCircle size={16} /></div>
              </div>
              <div className="stat-card-value" style={{ color: 'var(--danger)' }}>{stats?.criticos || 0}</div>
              <div className="stat-card-desc" style={{ color: 'var(--danger)' }}>Atención inmediata</div>
            </div>

            <div className="stat-card green">
              <div className="stat-card-header">
                <div className="stat-card-title">Resueltos Hoy</div>
                <div className="stat-card-icon green"><CheckCircle size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.resueltos_hoy || 0}</div>
              <div className="stat-card-desc" style={{ color: 'var(--success)' }}>Cerrados hoy</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-title">Total Histórico</div>
                <div className="stat-card-icon" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)' }}><Database size={16} color="var(--text-secondary)" /></div>
              </div>
              <div className="stat-card-value">{stats?.total_historico || 0}</div>
              <div className="stat-card-desc">Registrados</div>
            </div>
          </div>

          <div className="sidebar-section-title" style={{ paddingLeft: 0 }}>OPERACIONES</div>
          <div className="dashboard-grid">
            <div className="stat-card green">
              <div className="stat-card-header">
                <div className="stat-card-title">Rondas Hoy</div>
                <div className="stat-card-icon green"><ShieldCheck size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.rondas_hoy || 0}</div>
              <div className="stat-card-desc">Completadas hoy</div>
            </div>

            <div className="stat-card orange">
              <div className="stat-card-header">
                <div className="stat-card-title">Visitas Hoy</div>
                <div className="stat-card-icon orange"><Users size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.visitas_hoy || 0}</div>
              <div className="stat-card-desc">Ingresos registrados</div>
            </div>

            <div className="stat-card blue">
              <div className="stat-card-header">
                <div className="stat-card-title">Puntos QR</div>
                <div className="stat-card-icon blue"><MapPin size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.casas_qr || 0}</div>
              <div className="stat-card-desc">Registrados</div>
            </div>
          </div>

          <div className="sidebar-section-title" style={{ paddingLeft: 0 }}>RESIDENCIAL & PERSONAL</div>
          <div className="dashboard-grid">
            <div className="stat-card purple">
              <div className="stat-card-header">
                <div className="stat-card-title">Complejos</div>
                <div className="stat-card-icon purple"><Building size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.complejos || 1}</div>
            </div>

            <div className="stat-card green">
              <div className="stat-card-header">
                <div className="stat-card-title">Residentes</div>
                <div className="stat-card-icon blue"><Home size={16} /></div>
              </div>
              <div className="stat-card-value">{stats?.residentes || 0}</div>
            </div>

            <div className="stat-card green">
              <div className="stat-card-header">
                <div className="stat-card-title">Usuarios Activos</div>
                <div className="stat-card-icon green"><ShieldCheck size={16} /></div>
              </div>
              <div className="stat-card-value" style={{ color: 'var(--success)' }}>{stats?.usuarios_activos || 0}</div>
              <div className="stat-card-desc" style={{ color: 'var(--success)' }}>En servicio</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-title">Usuarios Inactivos</div>
                <div className="stat-card-icon" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)' }}><UserX size={16} color="var(--text-secondary)" /></div>
              </div>
              <div className="stat-card-value">0</div>
              <div className="stat-card-desc">Dados de baja</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

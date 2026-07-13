"use client";

import React, { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  AlertCircle, 
  Users, 
  MapPin, 
  RefreshCw, 
  Clock, 
  Shield, 
  UserCheck 
} from 'lucide-react';
import { rondasApi, incidentesApi, visitasApi, usuariosApi, AsignacionRonda, ProgramaRonda, Incidente, Visita, Usuario } from '@/lib/api';

// Helper para formatear nombre desde el email
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [roundsData, programData, incidentsData, visitsData, staffData] = await Promise.all([
        rondasApi.getAsignaciones(),
        rondasApi.getProgramas(),
        incidentesApi.getIncidentes(),
        visitasApi.getVisitas(),
        usuariosApi.getUsuarios(),
      ]);

      setActiveRounds(roundsData || []);
      setProgramas(programData || []);
      setRecentIncidents(incidentsData || []);
      setRecentVisits(visitsData || []);
      setStaffStatus(staffData || []);
    } catch (e) {
      console.error('Error fetching Operativo data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh cada 30 segundos para simular tiempo real
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const getGuardiaName = (usuarioId: number) => {
    const user = staffStatus.find(u => u.id === usuarioId);
    return user ? getNombreFromEmail(user.email) : `Guardia #${usuarioId}`;
  };

  const getProgramaNombre = (programaId: number) => {
    const prog = programas.find(p => p.id === programaId);
    return prog ? prog.nombre : `Programa #${programaId}`;
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    minHeight: '260px'
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
    fontSize: '1.1rem',
    fontWeight: 650,
    color: '#1e293b',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando panel operativo en tiempo real...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: '#1e293b', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Monitoreo Operativo</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Estado y control de seguridad en tiempo real (NCS365).</p>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            backgroundColor: '#white', border: '1px solid var(--border-color)', 
            padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: '600', 
            cursor: refreshing ? 'not-allowed' : 'pointer', color: '#475569',
            boxShadow: 'var(--shadow-sm)', transition: 'background-color 0.2s'
          }}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{refreshing ? "Actualizando..." : "Actualizar"}</span>
        </button>
      </div>

      {/* Grid de Monitoreo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '1.5rem' }}>
        
        {/* Card 1: Rondas Activas */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <ClipboardList size={20} color="#FACC15" />
              <span>Rondas de Patrullaje Activas</span>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600' }}>
              {activeRounds.filter(r => r.estado === 'ACTIVO' || r.estado === 'INICIADO').length} Ejecutando
            </span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px' }}>
            {activeRounds.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                No hay rondas activas programadas en este momento.
              </div>
            ) : (
              activeRounds.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={18} color="#64748b" />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{getProgramaNombre(r.programa_id)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Asignado a: {getGuardiaName(r.usuario_id)}</div>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: '700',
                    backgroundColor: r.estado === 'COMPLETADO' ? '#dcfce3' : r.estado === 'ACTIVO' || r.estado === 'INICIADO' ? '#dbeafe' : '#f1f5f9',
                    color: r.estado === 'COMPLETADO' ? '#16a34a' : r.estado === 'ACTIVO' || r.estado === 'INICIADO' ? '#2563eb' : '#64748b'
                  }}>
                    {r.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Incidentes Recientes */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <AlertCircle size={20} color="#ef4444" />
              <span>Incidentes Reportados</span>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: '600' }}>
              {recentIncidents.filter(i => i.estado === 'ABIERTO').length} Abiertos
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px' }}>
            {recentIncidents.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                No hay incidentes reportados en el historial.
              </div>
            ) : (
              recentIncidents.slice(0, 5).map((inc) => (
                <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '6px', height: '24px', borderRadius: '2px',
                      backgroundColor: inc.nivel_gravedad === 'ALTA' ? '#ef4444' : inc.nivel_gravedad === 'MEDIA' ? '#f59e0b' : '#3b82f6'
                    }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{inc.tipo}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{inc.descripcion}</div>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: '700',
                    backgroundColor: inc.estado === 'RESUELTO' ? '#dcfce3' : '#fef3c7',
                    color: inc.estado === 'RESUELTO' ? '#16a34a' : '#d97706'
                  }}>
                    {inc.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Accesos y Visitas Recientes */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <MapPin size={20} color="#3b82f6" />
              <span>Accesos y Visitas Recientes</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px' }}>
            {recentVisits.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                No hay visitas registradas hoy.
              </div>
            ) : (
              recentVisits.slice(0, 5).map((v) => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={16} color="#64748b" />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{v.nombre_visitante}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Destino: Casa {v.numero_casa} | Medio: {v.medio_ingreso.toLowerCase()}</div>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: '700',
                    backgroundColor: v.estado === 'FINALIZADA' ? '#f1f5f9' : v.estado === 'EN_CURSO' ? '#dcfce3' : '#fef3c7',
                    color: v.estado === 'FINALIZADA' ? '#64748b' : v.estado === 'EN_CURSO' ? '#16a34a' : '#d97706'
                  }}>
                    {v.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 4: Personal Operativo en Servicio */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <Users size={20} color="#10b981" />
              <span>Personal Operativo Activo</span>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', backgroundColor: '#dcfce3', color: '#16a34a', fontWeight: '600' }}>
              {staffStatus.filter(s => s.rol === 'GUARDIA' || s.rol === 'SUPERVISOR').length} Registrados
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px' }}>
            {staffStatus.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                No hay personal registrado en el residencial.
              </div>
            ) : (
              staffStatus.filter(s => s.rol === 'GUARDIA' || s.rol === 'SUPERVISOR').map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserCheck size={18} color="#64748b" />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{getNombreFromEmail(s.email)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.email}</div>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: '750',
                    backgroundColor: s.rol === 'SUPERVISOR' ? '#fef3c7' : '#d1fae5',
                    color: s.rol === 'SUPERVISOR' ? '#d97706' : '#065f46'
                  }}>
                    {s.rol}
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

'use client';

import React from 'react';
import { ClipboardList, Hammer, AlertCircle, User, MapPin } from 'lucide-react';

export default function OperativoPage() {
  const [activeRounds, setActiveRounds] = React.useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = React.useState<any[]>([]);
  const [recentVisits, setRecentVisits] = React.useState<any[]>([]);
  const [staffStatus, setStaffStatus] = React.useState<any[]>([]);

  React.useEffect(() => {
    const residencialId = localStorage.getItem('residencial_id') || '';
    const token = localStorage.getItem('token') || '';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Residencial-ID': residencialId,
    };
    const fetchData = async () => {
      try {
        const [roundsRes, incidentsRes, visitsRes, staffRes] = await Promise.all([
          fetch('/api/v1/rondas/asignaciones', { headers }),
          fetch('/api/v1/incidentes', { headers }),
          fetch('/api/v1/visitas', { headers }),
          fetch('/api/v1/usuarios', { headers }),
        ]);
        if (roundsRes.ok) setActiveRounds(await roundsRes.json());
        if (incidentsRes.ok) setRecentIncidents(await incidentsRes.json());
        if (visitsRes.ok) setRecentVisits(await visitsRes.json());
        if (staffRes.ok) setStaffStatus(await staffRes.json());
      } catch (e) {
        console.error('Error fetching Operativo data', e);
      }
    };
    fetchData();
  }, []);


  const cardStyle = {
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    padding: '1.5rem',
    color: '#fff',
    boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
  };

  const sectionTitle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#facc15',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: '#fff',
        textAlign: 'center',
        marginBottom: '1rem',
      }}>
        Gestión Operativo
      </h1>

      {/* Rondas activas */}
      <div style={cardStyle}>
        <div style={sectionTitle}>
          <ClipboardList size={20} />
          <span>Rondas Activas</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {activeRounds.map((r, i) => (
            <li key={i} style={{ marginBottom: '0.75rem' }}>
              <strong>{r.guardia}</strong> – {r.zona} – Progreso: {r.progreso}
            </li>
          ))}
        </ul>
      </div>

      {/* Incidentes recientes */}
      <div style={cardStyle}>
        <div style={sectionTitle}>
          <AlertCircle size={20} />
          <span>Incidentes Recientes</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recentIncidents.map((inc, i) => (
            <li key={i} style={{ marginBottom: '0.75rem' }}>
              [{inc.hora}] <strong>{inc.tipo}</strong>: {inc.descripcion}
            </li>
          ))}
        </ul>
      </div>

      {/* Visitas recientes */}
      <div style={cardStyle}>
        <div style={sectionTitle}>
          <MapPin size={20} />
          <span>Visitas Recientes</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recentVisits.map((v, i) => (
            <li key={i} style={{ marginBottom: '0.75rem' }}>
              [{v.hora}] {v.visitante} → Casa {v.casa}
            </li>
          ))}
        </ul>
      </div>

      {/* Estado del personal */}
      <div style={cardStyle}>
        <div style={sectionTitle}>
          <User size={20} />
          <span>Personal en Línea</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {staffStatus.map((s, i) => (
            <li key={i} style={{ marginBottom: '0.75rem' }}>
              {s.nombre} ({s.rol}) – {s.activo ? '🟢 Activo' : '⚪ Inactivo'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

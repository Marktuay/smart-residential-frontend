'use client';

import React, { useState, useEffect } from 'react';
import { Map as MapIcon, History, Crosshair, Users, Calendar, ShieldAlert } from 'lucide-react';
import { trackingApi, usuariosApi, residencialApi, Ubicacion, HistorialUbicacion, Usuario } from '@/lib/api';
import LiveMap from '@/components/map/LiveMap';

export default function OperativeMapPage() {
  const [modo, setModo] = useState<'vivo' | 'historial'>('vivo');
  const [guardiasLive, setGuardiasLive] = useState<Ubicacion[]>([]);
  const [guardiasDisponibles, setGuardiasDisponibles] = useState<Usuario[]>([]);
  
  // Estados para historial
  const [guardiaSeleccionado, setGuardiaSeleccionado] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [historial, setHistorial] = useState<HistorialUbicacion[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [residencialInfo, setResidencialInfo] = useState<{latitud: number, longitud: number, zoom: number} | null>(null);

  // Cargar live tracking y info del residencial
  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    const fetchLive = async () => {
      try {
        if (modo === 'vivo') {
          const data = await trackingApi.getUbicaciones();
          setGuardiasLive(data);
        }
      } catch (err) {
        console.error('Error fetching live tracking:', err);
      }
    };

    const fetchResidencial = async () => {
      try {
        const info = await residencialApi.getInfo();
        setResidencialInfo({
          latitud: info.latitud_centro,
          longitud: info.longitud_centro,
          zoom: info.zoom_defecto
        });
      } catch (err) {
        console.error('Error fetching residencial info:', err);
      }
    };

    fetchResidencial();

    if (modo === 'vivo') {
      fetchLive();
      intervalo = setInterval(fetchLive, 5000); // Actualizar cada 5s
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [modo]);

  // Cargar usuarios para el select de historial
  useEffect(() => {
    const fetchGuardias = async () => {
      try {
        const users = await usuariosApi.getUsuarios();
        // Filtrar solo guardias
        setGuardiasDisponibles(users.filter(u => u.rol === 'GUARDIA'));
      } catch (err) {
        console.error('Error fetching usuarios:', err);
      }
    };
    fetchGuardias();
  }, []);

  const buscarHistorial = async () => {
    if (!guardiaSeleccionado || !fechaInicio || !fechaFin) {
      alert("Por favor selecciona un guardia y un rango de fechas.");
      return;
    }
    setCargandoHistorial(true);
    try {
      const fInicio = `${fechaInicio} 00:00:00`;
      const fFin = `${fechaFin} 23:59:59`;
      const data = await trackingApi.getHistorial(parseInt(guardiaSeleccionado), fInicio, fFin);
      setHistorial(data);
    } catch (err) {
      console.error('Error fetching historial:', err);
      alert("Hubo un error obteniendo el historial.");
    } finally {
      setCargandoHistorial(false);
    }
  };

  return (
    <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapIcon color="#FACC15" />
            Mapa Operativo
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Visualización en tiempo real e historial de rutas de guardias.
          </p>
        </div>
        {modo === 'vivo' && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
            <ShieldAlert size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Actualización Automática (5s)</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '1.5rem', minHeight: '600px' }}>
        {/* Panel lateral de controles */}
        <div style={{ width: '320px', backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', backgroundColor: '#1e293b', borderRadius: '0.5rem', padding: '0.25rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setModo('vivo')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 0',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.375rem',
                transition: 'background-color 0.2s, color 0.2s',
                border: 'none',
                cursor: 'pointer',
                ...(modo === 'vivo'
                  ? { backgroundColor: '#FACC15', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                  : { backgroundColor: 'transparent', color: '#94a3b8' })
              }}
            >
              <Crosshair size={16} style={{ marginRight: '0.5rem' }} /> En Vivo
            </button>
            <button
              onClick={() => setModo('historial')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 0',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.375rem',
                transition: 'background-color 0.2s, color 0.2s',
                border: 'none',
                cursor: 'pointer',
                ...(modo === 'historial'
                  ? { backgroundColor: '#FACC15', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                  : { backgroundColor: 'transparent', color: '#94a3b8' })
              }}
            >
              <History size={16} style={{ marginRight: '0.5rem' }} /> Historial
            </button>
          </div>

          {modo === 'vivo' ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0 }}>Guardias Activos</h3>
              {guardiasLive.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>No hay guardias transmitiendo su ubicación en este momento.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {guardiasLive.map(g => {
                    const nombre = g.email ? g.email.split('@')[0].replace(/[\._\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : `Guardia #${g.usuario_id}`;
                    return (
                      <li key={g.usuario_id} style={{ padding: '0.75rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#ffffff', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                          <Users size={16} color="#FACC15" style={{ marginRight: '0.5rem' }} />
                          {nombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {g.email} (ID: {g.usuario_id})
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.25rem' }}>
                          • Señal en vivo activada
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#94a3b8', marginBottom: '0.25rem' }}>Seleccionar Guardia</label>
                <select
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#ffffff', outline: 'none' }}
                  value={guardiaSeleccionado}
                  onChange={(e) => setGuardiaSeleccionado(e.target.value)}
                >
                  <option value="">-- Seleccione un guardia --</option>
                  {guardiasDisponibles.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.email} (ID: {g.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#94a3b8', marginBottom: '0.25rem' }}>Fecha Inicio</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="date"
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', paddingLeft: '2.5rem', color: '#ffffff', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#94a3b8', marginBottom: '0.25rem' }}>Fecha Fin</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="date"
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', paddingLeft: '2.5rem', color: '#ffffff', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={buscarHistorial}
                disabled={cargandoHistorial}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  backgroundColor: '#FACC15',
                  color: '#0f172a',
                  fontWeight: 'bold',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: cargandoHistorial ? 'not-allowed' : 'pointer',
                  opacity: cargandoHistorial ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
              >
                {cargandoHistorial ? 'Buscando...' : 'Buscar Historial'}
              </button>

              {historial.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', fontSize: '0.875rem', color: '#ffffff' }}>
                  <span style={{ color: '#FACC15', fontWeight: 'bold' }}>{historial.length}</span> puntos encontrados en la ruta.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mapa */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <LiveMap 
            guardiasActivos={guardiasLive} 
            historial={historial} 
            mostrarHistorial={modo === 'historial'} 
            residencialInfo={residencialInfo}
          />
        </div>
      </div>
    </div>
  );
}

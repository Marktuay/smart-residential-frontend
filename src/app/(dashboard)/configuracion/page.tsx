'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Map, Navigation, Bell, Save, CheckCircle, AlertTriangle, Building, HelpCircle } from 'lucide-react';
import { residencialApi, ResidencialInfo } from '@/lib/api';

export default function ConfiguracionPage() {
  const [rol, setRol] = useState<string | null>(null);
  
  // Estados de datos
  const [loading, setLoading] = useState(true);
  const [residencial, setResidencial] = useState<ResidencialInfo | null>(null);
  
  // Campos del formulario
  const [latitud, setLatitud] = useState<string>('12.1364');
  const [longitud, setLongitud] = useState<string>('-86.2514');
  const [zoom, setZoom] = useState<number>(13);
  const [tolerancia, setTolerancia] = useState<number>(15);
  const [frecuencia, setFrecuencia] = useState<number>(10);
  const [emailAlertas, setEmailAlertas] = useState<string>('');
  const [telEmergencia, setTelEmergencia] = useState<string>('');

  // Estados de retroalimentación
  const [cargandoGuardar, setCargandoGuardar] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string>('');
  const [mensajeError, setMensajeError] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('user_role');
      setRol(userRole);

      if (userRole === 'ADMIN' || userRole === 'SISADMIN') {
        cargarConfiguracion();
      }
    }
  }, []);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const info = await residencialApi.getInfo();
      setResidencial(info);
      setLatitud(info.latitud_centro?.toString() || '12.1364');
      setLongitud(info.longitud_centro?.toString() || '-86.2514');
      setZoom(info.zoom_defecto || 13);
      setTolerancia(info.tolerancia_ronda_mins || 15);
      setFrecuencia(info.frecuencia_gps_seg || 10);
      setEmailAlertas(info.email_alerta_incidentes || '');
      setTelEmergencia(info.telefono_emergencia || '');
    } catch (err) {
      console.error("Error al cargar configuración:", err);
      setMensajeError("No se pudo cargar la configuración del residencial.");
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoGuardar(true);
    setMensajeExito('');
    setMensajeError('');

    try {
      await residencialApi.updateConfig({
        latitud_centro: Number(latitud),
        longitud_centro: Number(longitud),
        zoom_defecto: Number(zoom),
        tolerancia_ronda_mins: Number(tolerancia),
        frecuencia_gps_seg: Number(frecuencia),
        email_alerta_incidentes: emailAlertas,
        telefono_emergencia: telEmergencia
      });

      setMensajeExito("¡Configuración del residencial actualizada correctamente!");
      
      // Actualizar info en local
      if (residencial) {
        setResidencial({
          ...residencial,
          latitud_centro: Number(latitud),
          longitud_centro: Number(longitud),
          zoom_defecto: Number(zoom),
          tolerancia_ronda_mins: Number(tolerancia),
          frecuencia_gps_seg: Number(frecuencia),
          email_alerta_incidentes: emailAlertas,
          telefono_emergencia: telEmergencia
        });
      }
    } catch (err: any) {
      console.error("Error guardando configuración:", err);
      setMensajeError("Error al guardar la configuración: " + (err.response?.data || err.message));
    } finally {
      setCargandoGuardar(false);
    }
  };

  if (rol !== 'ADMIN' && rol !== 'SISADMIN') {
    return (
      <div style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center', color: '#1e293b' }}>
        <AlertTriangle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b' }}>
          Esta pantalla de **Configuración** está restringida exclusivamente para usuarios con privilegios de Administrador.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando parámetros del residencial...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: '#1e293b', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings color="#FACC15" size={32} />
            Parámetros del Residencial
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Personaliza el comportamiento operativo, geográfico y de notificaciones para **{residencial?.nombre}**.
          </p>
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{mensajeError}</span>
        </div>
      )}

      <form onSubmit={guardarConfiguracion} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Ficha General Informativa */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', padding: '1.5rem', color: 'white', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '50%' }}>
            <Building color="#FACC15" size={32} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#FACC15', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyecto Activo</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.15rem 0' }}>{residencial?.nombre}</h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Dirección: {residencial?.direccion || 'No registrada'}</p>
          </div>
        </div>

        {/* Mallas de Configuración */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          
          {/* Tarjeta 1: Configuración de Mapas */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Map size={20} color="#FACC15" />
              Centro Geográfico y Zoom
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Latitud Centro</label>
                <input
                  type="number" step="any" required value={latitud} onChange={e => setLatitud(e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Longitud Centro</label>
                <input
                  type="number" step="any" required value={longitud} onChange={e => setLongitud(e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Zoom por Defecto (1 - 22)</label>
                <input
                  type="number" min="1" max="22" required value={zoom} onChange={e => setZoom(Number(e.target.value))}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Reglas Operativas */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Navigation size={20} color="#FACC15" />
              Reglas del Servicio de Seguridad
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                  Tolerancia de Rondas (minutos)
                  <span title="Minutos de retraso permitidos antes de marcar alerta de demora." style={{ display: 'inline-flex', cursor: 'help' }}>
                    <HelpCircle size={14} color="#94a3b8" />
                  </span>
                </label>
                <input
                  type="number" min="1" required value={tolerancia} onChange={e => setTolerancia(Number(e.target.value))}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                  Transmisión de GPS (segundos)
                  <span title="Intervalo de envío de coordenadas por el dispositivo del guardia." style={{ display: 'inline-flex', cursor: 'help' }}>
                    <HelpCircle size={14} color="#94a3b8" />
                  </span>
                </label>
                <input
                  type="number" min="5" required value={frecuencia} onChange={e => setFrecuencia(Number(e.target.value))}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Contacto y Alertas */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Bell size={20} color="#FACC15" />
              Notificaciones de Emergencia y Contacto
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Email de Reporte de Incidentes</label>
                <input
                  type="email" value={emailAlertas} onChange={e => setEmailAlertas(e.target.value)}
                  placeholder="ejemplo@residencial.com"
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Teléfono de Garita / Emergencias</label>
                <input
                  type="text" value={telEmergencia} onChange={e => setTelEmergencia(e.target.value)}
                  placeholder="+505 8888-8888"
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Botón de Guardado */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={cargandoGuardar}
            style={{
              backgroundColor: '#FACC15',
              color: '#0f172a',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              cursor: cargandoGuardar ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(250, 204, 21, 0.2)',
              opacity: cargandoGuardar ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            <Save size={18} />
            {cargandoGuardar ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

      </form>

    </div>
  );
}

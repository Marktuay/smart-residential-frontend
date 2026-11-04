'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Map, 
  Navigation, 
  Bell, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Building, 
  HelpCircle,
  Shield,
  Layers,
  MapPin,
  ExternalLink,
  Users
} from 'lucide-react';
import { residencialApi, ResidencialInfo } from '@/lib/api';

const ROLES_MATRIZ = [
  { rol: 'SISADMIN', nivel: 'Super Administrador', desc: 'Acceso global multi-inquilino, provisión de residenciales y configuración del sistema.' },
  { rol: 'ADMIN', nivel: 'Administrador Residencial', desc: 'Gestión completa del residencial: inmuebles, residentes, rol de turnos, puntos QR y reportes.' },
  { rol: 'SUPERVISOR', nivel: 'Operaciones y Ronda', desc: 'Supervisión en terreno, auditoría de rondas en tiempo real y resolución de incidencias.' },
  { rol: 'OPERADOR_C2', nivel: 'Centro de Mando', desc: 'Monitoreo de centro de control de alarmas, mapa satelital y despacho de patrullas.' },
  { rol: 'GESTOR_TRANSPORTE', nivel: 'Gestor de Flota', desc: 'Asignación de choferes y unidades pesadas en traslados de maquinaria.' },
  { rol: 'MECANICO_TALLER', nivel: 'Taller Mecánico', desc: 'Inspecciones técnicas de Checklist 360 previo a salida de patio.' },
  { rol: 'GUARDIA', nivel: 'Seguridad en Garita', desc: 'Control de accesos y visitas, escaneo de puntos QR satelitales y reporte exprés de novedades.' },
  { rol: 'RESIDENTE', nivel: 'Habitante / Propietario', desc: 'Registro de visitas anticipadas, visualización de estado de seguridad y alertas comunitarias.' }
];

export default function ConfiguracionPage() {
  const [rol, setRol] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResId, setSelectedResId] = useState<string>('');
  
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
        init();
      }
    }
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      let list: ResidencialInfo[] = [];
      try {
        list = await residencialApi.getResidenciales();
        setResidenciales(list || []);
      } catch (err) {
        console.warn("No se pudo listar residenciales globales:", err);
      }

      let defaultId = typeof window !== 'undefined' ? localStorage.getItem('residencial_id') : '';
      if ((!defaultId || defaultId === 'GLOBAL') && list && list.length > 0) {
        defaultId = list[0].id;
        setSelectedResId(defaultId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('residencial_id', defaultId);
        }
      }

      await cargarConfiguracion(defaultId || undefined);
    } catch (e) {
      console.error("Error inicializando configuración:", e);
    } finally {
      setLoading(false);
    }
  };

  const cargarConfiguracion = async (overrideId?: string) => {
    try {
      const targetId = overrideId || selectedResId || (typeof window !== 'undefined' ? localStorage.getItem('residencial_id') : undefined) || undefined;
      const info = await residencialApi.getInfo(targetId === 'GLOBAL' ? undefined : targetId);
      if (info) {
        setResidencial(info);
        setSelectedResId(info.id || '');
        if (typeof window !== 'undefined' && info.id) {
          localStorage.setItem('residencial_id', info.id);
        }
        setLatitud(info.latitud_centro?.toString() || '12.1364');
        setLongitud(info.longitud_centro?.toString() || '-86.2514');
        setZoom(info.zoom_defecto || 13);
        setTolerancia(info.tolerancia_ronda_mins || 15);
        setFrecuencia(info.frecuencia_gps_seg || 10);
        setEmailAlertas(info.email_alerta_incidentes || '');
        setTelEmergencia(info.telefono_emergencia || '');
        setMensajeError('');
      }
    } catch (err) {
      console.error("Error al cargar configuración:", err);
      setMensajeError("No se pudo cargar la configuración del residencial.");
    }
  };

  const handleSelectResidencialChange = async (newId: string) => {
    setSelectedResId(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('residencial_id', newId);
    }
    await cargarConfiguracion(newId);
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoGuardar(true);
    setMensajeExito('');
    setMensajeError('');

    try {
      const targetId = selectedResId || residencial?.id;
      await residencialApi.updateConfig({
        id: targetId,
        latitud_centro: Number(latitud),
        longitud_centro: Number(longitud),
        zoom_defecto: Number(zoom),
        tolerancia_ronda_mins: Number(tolerancia),
        frecuencia_gps_seg: Number(frecuencia),
        email_alerta_incidentes: emailAlertas.trim(),
        telefono_emergencia: telEmergencia.trim()
      }, targetId);

      setMensajeExito("¡Configuración operativa y geográfica actualizada exitosamente!");
      setTimeout(() => setMensajeExito(''), 4000);
      
      if (residencial) {
        setResidencial({
          ...residencial,
          latitud_centro: Number(latitud),
          longitud_centro: Number(longitud),
          zoom_defecto: Number(zoom),
          tolerancia_ronda_mins: Number(tolerancia),
          frecuencia_gps_seg: Number(frecuencia),
          email_alerta_incidentes: emailAlertas.trim(),
          telefono_emergencia: telEmergencia.trim()
        });
      }
    } catch (err: any) {
      console.error("Error guardando configuración:", err);
      setMensajeError("Error al guardar la configuración: " + (err.response?.data?.message || err.message));
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
          La pantalla de <strong>Configuración</strong> está restringida exclusivamente para usuarios con privilegios de Administrador o Super Administrador.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando parámetros del residencial...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: '#1e293b', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings color="#FACC15" size={30} />
            Configuración Operativa del Residencial
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Ajuste de parámetros cartográficos, tiempos de tolerancia de rondas y canales de alerta.
          </p>
        </div>

        {/* Selector de instalación */}
        {residenciales.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0f172a', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
            <Building size={18} color="#FACC15" />
            <select
              value={selectedResId}
              onChange={e => handleSelectResidencialChange(e.target.value)}
              style={{ backgroundColor: 'transparent', color: '#ffffff', border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
            >
              {residenciales.map(r => (
                <option key={r.id} value={r.id} style={{ backgroundColor: '#0f172a' }}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '0.875rem 1.25rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.875rem 1.25rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{mensajeError}</span>
        </div>
      )}

      <form onSubmit={guardarConfiguracion} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Ficha General Informativa */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', padding: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '50%' }}>
              <Building color="#FACC15" size={28} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#FACC15', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instalación Activa</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: '0.15rem 0' }}>{residencial?.nombre}</h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Dirección: {residencial?.direccion || 'No registrada'}</p>
            </div>
          </div>

          <Link href="/map">
            <button
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#FACC15', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <MapPin size={16} />
              <span>Ver en Mapa</span>
              <ExternalLink size={14} />
            </button>
          </Link>
        </div>

        {/* Tarjetas de Configuración */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          
          {/* Tarjeta 1: Configuración de Mapas */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Map size={18} color="#FACC15" />
              Centro Geográfico y Nivel de Zoom
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Latitud Centro *</label>
                <input
                  type="number" step="any" required value={latitud} onChange={e => setLatitud(e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.65rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Longitud Centro *</label>
                <input
                  type="number" step="any" required value={longitud} onChange={e => setLongitud(e.target.value)}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.65rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Zoom por Defecto (1 a 20) *</label>
                <input
                  type="number" min="1" max="20" required value={zoom} onChange={e => setZoom(Number(e.target.value))}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.65rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Reglas Operativas */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Navigation size={18} color="#FACC15" />
              Reglas de Rondas y Geoposición
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                  Tolerancia de Ronda (minutos) *
                  <span title="Minutos de gracia permitidos antes de clasificar la ronda como demorada." style={{ display: 'inline-flex', cursor: 'help' }}>
                    <HelpCircle size={14} color="#94a3b8" />
                  </span>
                </label>
                <input
                  type="number" min="1" required value={tolerancia} onChange={e => setTolerancia(Number(e.target.value))}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.65rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                  Frecuencia de Baliza GPS (segundos) *
                  <span title="Intervalo de envío automático de geolocalización desde el terminal del guardia." style={{ display: 'inline-flex', cursor: 'help' }}>
                    <HelpCircle size={14} color="#94a3b8" />
                  </span>
                </label>
                <input
                  type="number" min="5" required value={frecuencia} onChange={e => setFrecuencia(Number(e.target.value))}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.65rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Contacto y Alertas */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Bell size={18} color="#FACC15" />
              Canales de Alerta de Seguridad y Emergencias
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Email de Reporte de Incidentes</label>
                <input
                  type="email" value={emailAlertas} onChange={e => setEmailAlertas(e.target.value)}
                  placeholder="seguridad@residencial.com"
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.65rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Teléfono Garita / Despacho Inmediato</label>
                <input
                  type="text" value={telEmergencia} onChange={e => setTelEmergencia(e.target.value)}
                  placeholder="+505 8888-0000"
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.65rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Botón de Guardado */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
              boxShadow: '0 4px 6px -1px rgba(250, 204, 21, 0.25)',
              opacity: cargandoGuardar ? 0.7 : 1
            }}
          >
            <Save size={18} />
            {cargandoGuardar ? "Guardando..." : "Guardar Cambios de Configuración"}
          </button>
        </div>

      </form>

      {/* Matriz de Seguridad y Roles del Sistema */}
      <div style={{ marginTop: '2.5rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} color="#FACC15" />
          Matriz de Privilegios y Roles RBAC NCS365
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
          Arquitectura de seguridad basada en roles (RBAC) con aislamiento por fila multi-tenant.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {ROLES_MATRIZ.map(r => (
            <div key={r.rol} style={{ border: '1px solid #f1f5f9', borderRadius: '0.5rem', padding: '0.85rem 1rem', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>{r.rol}</span>
                <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600' }}>{r.nivel}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  MapPin, 
  Wrench, 
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
  Eye,
  Sliders,
  History,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { flotaApi, usuariosApi, SolicitudFlota, VehiculoFlota, Usuario, Inspeccion360 } from '@/lib/api';

const ESTADOS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Aperturada', bg: '#f1f5f9', color: '#475569' },
  ASIGNADA: { label: 'Unidad Asignada', bg: '#e0f2fe', color: '#0369a1' },
  INSPECCION_TALLER_PENDIENTE: { label: 'En Taller (Pendiente)', bg: '#fef3c7', color: '#d97706' },
  APROBADA_TALLER: { label: 'Aprobado Taller', bg: '#dcfce7', color: '#15803d' },
  RECHAZADA_TALLER: { label: 'Rechazado Taller', bg: '#fee2e2', color: '#b91c1c' },
  GARITA_SALIDA_PENDIENTE: { label: 'En Garita Origen', bg: '#fef3c7', color: '#b45309' },
  RECHAZADA_GARITA_SALIDA: { label: 'Rechazado en Garita', bg: '#fee2e2', color: '#991b1b' },
  EN_TRANSITO: { label: 'En Tránsito 🚚', bg: '#dbeafe', color: '#1d4ed8' },
  GARITA_LLEGADA_PENDIENTE: { label: 'En Garita Destino', bg: '#ffedd5', color: '#c2410c' },
  CHECKIN_CONFORME: { label: 'Llegada Conforme', bg: '#d1fae5', color: '#047857' },
  CHECKIN_CON_OBSERVACION: { label: 'Llegada c/Obs.', bg: '#fef3c7', color: '#d97706' },
  INVESTIGACION_INCIDENTE: { label: 'Investigación Incidente', bg: '#fee2e2', color: '#dc2626' },
  INSPECCION_CIERRE_TALLER: { label: 'Cierre Taller', bg: '#e2e8f0', color: '#334155' },
  CERRADO_FINALIZADO: { label: 'Cerrado Conforme', bg: '#bbf7d0', color: '#166534' }
};

export default function FlotaPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudFlota[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoFlota[]>([]);
  const [conductores, setConductores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Nueva Solicitud (Operaciones)
  const [showNuevaModal, setShowNuevaModal] = useState(false);
  const [puntoOrigen, setPuntoOrigen] = useState('');
  const [puntoDestino, setPuntoDestino] = useState('');
  const [equipoAdicional, setEquipoAdicional] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Asignar (Transporte)
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudFlota | null>(null);
  const [vehiculoId, setVehiculoId] = useState<number | ''>('');
  const [conductorId, setConductorId] = useState<number | ''>('');

  // Modal Historial de Inspecciones 360
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialInspecciones, setHistorialInspecciones] = useState<Inspeccion360[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Modal Cambio de Estado FSM
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [nuevoEstadoFSM, setNuevoEstadoFSM] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [sData, vData, uData] = await Promise.all([
        flotaApi.getSolicitudes(),
        flotaApi.getVehiculos(),
        usuariosApi.getUsuarios()
      ]);
      setSolicitudes(sData || []);
      setVehiculos(vData || []);
      setConductores((uData || []).filter(u => u.rol === 'GUARDIA' || u.rol === 'GUARDIA_MOTORIZADO' || u.rol === 'SUPERVISOR' || u.rol === 'RESIDENTE' || u.rol === 'ADMIN'));
    } catch (e) {
      console.error("Error cargando datos de flota:", e);
      setErrorMsg("No se pudieron cargar los datos de flota y maquinaria.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puntoOrigen || !puntoDestino) {
      setErrorMsg("Debe especificar punto de origen y destino.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await flotaApi.createSolicitud({
        punto_origen_id: puntoOrigen,
        punto_destino_id: puntoDestino,
        equipo_adicional_json: equipoAdicional.trim()
      });
      setShowNuevaModal(false);
      setPuntoOrigen('');
      setPuntoDestino('');
      setEquipoAdicional('');
      setSuccessMsg("✅ Solicitud de traslado creada con éxito.");
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (e: any) {
      console.error("Error creando solicitud:", e);
      setErrorMsg(e.response?.data?.message || "No se pudo aperturar la solicitud de traslado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAsignarUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudSeleccionada?.id || !vehiculoId || !conductorId) {
      setErrorMsg("Seleccione vehículo y chofer asignado.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await flotaApi.asignarSolicitud(solicitudSeleccionada.id, Number(vehiculoId), Number(conductorId));
      setShowAsignarModal(false);
      setSolicitudSeleccionada(null);
      setVehiculoId('');
      setConductorId('');
      setSuccessMsg("✅ Unidad y conductor asignados a la solicitud.");
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (e: any) {
      console.error("Error asignando unidad:", e);
      setErrorMsg(e.response?.data?.message || "No se pudo asignar el vehículo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerHistorial = async (sol: SolicitudFlota) => {
    if (!sol.id) return;
    setSolicitudSeleccionada(sol);
    setShowHistorialModal(true);
    setLoadingHistorial(true);
    try {
      const data = await flotaApi.getInspecciones(sol.id);
      setHistorialInspecciones(data || []);
    } catch (err) {
      console.error("Error al obtener inspecciones:", err);
      setHistorialInspecciones([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleCambiarEstadoFSM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudSeleccionada?.id || !nuevoEstadoFSM) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await flotaApi.transicionEstado(solicitudSeleccionada.id, nuevoEstadoFSM);
      setShowEstadoModal(false);
      setSolicitudSeleccionada(null);
      setNuevoEstadoFSM('');
      setSuccessMsg("✅ Estado de la solicitud actualizado.");
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (e: any) {
      console.error("Error al cambiar estado:", e);
      setErrorMsg(e.response?.data?.message || "No se pudo actualizar el estado de la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(s => {
    const matchesEstado = filtroEstado === 'TODOS' || s.estado_actual === filtroEstado;
    const q = busqueda.toLowerCase();
    const matchesBusqueda = (s.codigo_solicitud || '').toLowerCase().includes(q) ||
      (s.punto_origen_id || '').toLowerCase().includes(q) ||
      (s.punto_destino_id || '').toLowerCase().includes(q) ||
      (s.vehiculo_codigo || '').toLowerCase().includes(q);
    return matchesEstado && matchesBusqueda;
  });

  // Métricas
  const totalSolicitudes = solicitudes.length;
  const enTransito = solicitudes.filter(s => s.estado_actual === 'EN_TRANSITO').length;
  const pendientes = solicitudes.filter(s => s.estado_actual === 'DRAFT' || s.estado_actual === 'ASIGNADA' || s.estado_actual === 'INSPECCION_TALLER_PENDIENTE').length;
  const cerradas = solicitudes.filter(s => s.estado_actual === 'CERRADO_FINALIZADO' || s.estado_actual === 'CHECKIN_CONFORME').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando Control de Flota y Checklist 360...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      
      {/* Alertas */}
      {successMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', borderRadius: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header y Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Truck size={30} color="#FACC15" />
            Control de Flota Pesada y Checklist 360
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Gestión de traslados, inspecciones de taller y control en garitas por máquina de estados finita (FSM).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
          <Link href="/flota/vehiculos">
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#1e293b', fontWeight: '600', cursor: 'pointer' }}>
              <Wrench size={18} color="#d97706" />
              Catálogo Unidades ({vehiculos.length})
            </button>
          </Link>
          <Link href="/flota/inspeccion">
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#1e293b', fontWeight: '600', cursor: 'pointer' }}>
              <ClipboardCheck size={18} color="#FACC15" />
              Checklist 360 (PWA)
            </button>
          </Link>
          <button
            onClick={() => { setShowNuevaModal(true); setErrorMsg(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FACC15', color: '#1e293b', padding: '0.65rem 1.25rem', borderRadius: '0.5rem', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
            <Plus size={20} />
            Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', color: '#475569' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Total Solicitudes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{totalSolicitudes}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
            <Truck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>En Tránsito</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d4ed8' }}>{enTransito}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Wrench size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Pendiente Asignar / Taller</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{pendientes}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#dcfce7', color: '#15803d' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Finalizadas / Conformes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>{cerradas}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '400px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por código, ruta o unidad..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {['TODOS', 'DRAFT', 'ASIGNADA', 'EN_TRANSITO', 'CHECKIN_CONFORME', 'CERRADO_FINALIZADO'].map(est => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: filtroEstado === est ? '#1e293b' : 'white',
                color: filtroEstado === est ? 'white' : '#475569'
              }}
            >
              {est === 'TODOS' ? 'Todos' : (ESTADOS_BADGES[est]?.label || est)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Solicitudes */}
      {solicitudesFiltradas.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <Truck size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#334155' }}>No hay solicitudes de traslado en esta categoría.</p>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Haga clic en &quot;Nueva Solicitud&quot; para aperturar un traslado de maquinaria o carga pesada.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {solicitudesFiltradas.map((sol) => {
            const estado = sol.estado_actual || 'DRAFT';
            const badge = ESTADOS_BADGES[estado] || { label: estado, bg: '#f1f5f9', color: '#475569' };

            return (
              <div key={sol.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                
                {/* Header solicitud */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>{sol.codigo_solicitud}</span>
                    <span style={{ padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Aperturada: {new Date(sol.creado_en || '').toLocaleString()}
                  </div>
                </div>

                {/* Contenido principal */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
                  
                  {/* Origen ➔ Destino */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Ruta Solicitada</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#334155' }}>
                      <MapPin size={16} color="#ef4444" />
                      <span>{sol.punto_origen_id}</span>
                      <ArrowRight size={16} color="#94a3b8" />
                      <MapPin size={16} color="#10b981" />
                      <span>{sol.punto_destino_id}</span>
                    </div>
                  </div>

                  {/* Unidad y Conductor */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Unidad y Chofer</div>
                    {sol.vehiculo_codigo ? (
                      <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '600' }}>
                        🚜 {sol.vehiculo_codigo} ({sol.vehiculo_tipo}) <br />
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>👤 Chofer: {sol.conductor_nombre || 'Asignado'}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontStyle: 'italic' }}>Pendiente de asignación por Transporte</span>
                    )}
                  </div>

                  {/* Equipo Adicional */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Equipo Adicional</div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {sol.equipo_adicional_json || 'Sin equipamiento extra'}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {sol.estado_actual === 'DRAFT' && (
                      <button
                        onClick={() => { setSolicitudSeleccionada(sol); setShowAsignarModal(true); setErrorMsg(''); }}
                        style={{ padding: '0.5rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#1e293b', color: 'white', border: 'none', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Asignar Unidad
                      </button>
                    )}

                    <button
                      onClick={() => handleVerHistorial(sol)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <History size={15} />
                      Inspecciones
                    </button>

                    <button
                      onClick={() => { setSolicitudSeleccionada(sol); setNuevoEstadoFSM(sol.estado_actual || 'DRAFT'); setShowEstadoModal(true); setErrorMsg(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <Sliders size={15} />
                      FSM
                    </button>

                    <Link href={`/flota/inspeccion?solicitud_id=${sol.id}`}>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#FACC15', color: '#1e293b', border: 'none', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <ClipboardCheck size={16} />
                        Evaluar 360
                      </button>
                    </Link>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nueva Solicitud */}
      {showNuevaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '500px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} color="#FACC15" />
                Aperturar Solicitud de Flota
              </h2>
              <button onClick={() => setShowNuevaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            {errorMsg && (
              <div style={{ margin: '1rem 1.5rem 0', padding: '0.75rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCrearSolicitud} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Punto u Origen de Salida *</label>
                <select required value={puntoOrigen} onChange={e => setPuntoOrigen(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">-- Seleccionar Origen --</option>
                  <option value="Taller Central CED">Taller Central CED</option>
                  <option value="Planta Blockon Campuzano">Planta Blockon Campuzano</option>
                  <option value="Planta Blockon Mateare">Planta Blockon Mateare</option>
                  <option value="Garita Ciudad Doral">Garita Ciudad Doral</option>
                  <option value="Garita Ciudad Campuzano">Garita Ciudad Campuzano</option>
                  <option value="Garita Praderas de Mombacho">Garita Praderas de Mombacho</option>
                  <option value="Proyectos Menaggio">Proyectos Menaggio</option>
                  <option value="Bodega Bismark Martínez">Bodega Bismark Martínez</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Punto de Destino *</label>
                <select required value={puntoDestino} onChange={e => setPuntoDestino(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">-- Seleccionar Destino --</option>
                  <option value="Garita Ciudad Doral">Garita Ciudad Doral</option>
                  <option value="Garita Ciudad Campuzano">Garita Ciudad Campuzano</option>
                  <option value="Garita Praderas de Mombacho">Garita Praderas de Mombacho</option>
                  <option value="Planta Blockon Mateare">Planta Blockon Mateare</option>
                  <option value="Planta Blockon Campuzano">Planta Blockon Campuzano</option>
                  <option value="Taller Central CED">Taller Central CED</option>
                  <option value="Proyectos Menaggio">Proyectos Menaggio</option>
                  <option value="Bodega Bismark Martínez">Bodega Bismark Martínez</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Equipo o Carga Adicional (Opcional)</label>
                <textarea 
                  rows={2} 
                  value={equipoAdicional} 
                  onChange={e => setEquipoAdicional(e.target.value)} 
                  placeholder="Ej: Cemento 500 bolsas, Martillo Hidráulico, Cadenas..." 
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowNuevaModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Aperturando...' : 'Aperturar Solicitud'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Conductor y Unidad */}
      {showAsignarModal && solicitudSeleccionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '480px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Asignar Unidad y Chofer</h2>
              <button onClick={() => setShowAsignarModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            {errorMsg && (
              <div style={{ margin: '1rem 1.5rem 0', padding: '0.75rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAsignarUnidad} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                <strong>Solicitud:</strong> {solicitudSeleccionada.codigo_solicitud} ({solicitudSeleccionada.punto_origen_id} ➔ {solicitudSeleccionada.punto_destino_id})
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Unidad de Flota *</label>
                <select required value={vehiculoId} onChange={e => setVehiculoId(Number(e.target.value) || '')} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">-- Seleccionar Unidad --</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.codigo_unidad} ({v.tipo_unidad}) - {v.marca_modelo || 'Sin marca'} [{v.estado}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Conductor / Operador Responsable *</label>
                <select required value={conductorId} onChange={e => setConductorId(Number(e.target.value) || '')} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">-- Seleccionar Chofer --</option>
                  {conductores.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_completo || u.email} ({u.email}) - {u.rol}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAsignarModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Asignando...' : 'Confirmar Asignación'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Inspecciones 360 */}
      {showHistorialModal && solicitudSeleccionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="#FACC15" />
                Historial de Inspecciones 360 ({solicitudSeleccionada.codigo_solicitud})
              </h2>
              <button onClick={() => setShowHistorialModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {loadingHistorial ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Cargando bitácora de inspecciones...</div>
              ) : historialInspecciones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <ShieldCheck size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                  <p>Aún no se han firmado inspecciones 360 para esta solicitud.</p>
                  <Link href={`/flota/inspeccion?solicitud_id=${solicitudSeleccionada.id}`}>
                    <button style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#FACC15', color: '#1e293b', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      Realizar Primera Inspección
                    </button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {historialInspecciones.map((insp, i) => (
                    <div key={insp.id || i} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ color: '#1e293b' }}>Etapa: {insp.etapa}</strong>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', backgroundColor: insp.resultado === 'APROBADO' ? '#dcfce7' : '#fee2e2', color: insp.resultado === 'APROBADO' ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
                            {insp.resultado}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(insp.fecha_inspeccion || '').toLocaleString()}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span>Horómetro/KM: <strong>{insp.horometro_km}</strong></span>
                        <span>Combustible: <strong>{insp.nivel_combustible}</strong></span>
                      </div>

                      {insp.observaciones && (
                        <div style={{ fontSize: '0.85rem', color: '#334155', backgroundColor: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>
                          <em>&quot;{insp.observaciones}&quot;</em>
                        </div>
                      )}

                      {/* Detalles con fotos */}
                      {insp.detalles && insp.detalles.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                          {insp.detalles.filter(d => d.estado_item !== 'BUENO' || d.foto_url).map((det, dIdx) => (
                            <div key={dIdx} style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', backgroundColor: 'white', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>
                              <strong>{det.item_nombre}:</strong> <span style={{ color: det.estado_item === 'MALO' ? '#ef4444' : '#f59e0b' }}>{det.estado_item}</span>
                              {det.foto_url && (
                                <div style={{ marginTop: '0.25rem' }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={det.foto_url} alt="Evidencia" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '0.25rem' }} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button onClick={() => setShowHistorialModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal FSM Forzar Transición */}
      {showEstadoModal && solicitudSeleccionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '440px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Control de Estado (FSM)</h2>
              <button onClick={() => setShowEstadoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCambiarEstadoFSM} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Transicionar solicitud <strong>{solicitudSeleccionada.codigo_solicitud}</strong> a un nuevo estado:
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Nuevo Estado FSM *</label>
                <select required value={nuevoEstadoFSM} onChange={e => setNuevoEstadoFSM(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  {Object.entries(ESTADOS_BADGES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowEstadoModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Actualizando...' : 'Guardar Estado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

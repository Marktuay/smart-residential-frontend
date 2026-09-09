'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  UserCheck, 
  MapPin, 
  ShieldCheck, 
  Wrench, 
  ArrowRight,
  ClipboardCheck
} from 'lucide-react';
import { flotaApi, usuariosApi, SolicitudFlota, VehiculoFlota, Usuario } from '@/lib/api';

const ESTADOS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Aperturada', bg: '#f1f5f9', color: '#475569' },
  ASIGNADA: { label: 'Unidad Asignada', bg: '#e0f2fe', color: '#0369a1' },
  INSPECCION_TALLER_PENDIENTE: { label: 'En Taller (Pendiente)', bg: '#fef3c7', color: '#d97706' },
  APROBADA_TALLER: { label: 'Aprobado Taller', bg: '#dcfce3', color: '#15803d' },
  RECHAZADA_TALLER: { label: 'Rechazado en Taller', bg: '#fee2e2', color: '#b91c1c' },
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sData, vData, uData] = await Promise.all([
        flotaApi.getSolicitudes(),
        flotaApi.getVehiculos(),
        usuariosApi.getUsuarios()
      ]);
      setSolicitudes(sData || []);
      setVehiculos(vData || []);
      setConductores((uData || []).filter(u => u.rol === 'GUARDIA' || u.rol === 'GUARDIA_MOTORIZADO' || u.rol === 'SUPERVISOR' || u.rol === 'RESIDENTE'));
    } catch (e) {
      console.error("Error cargando datos de flota:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puntoOrigen || !puntoDestino) return;
    setIsSubmitting(true);
    try {
      await flotaApi.createSolicitud({
        punto_origen_id: puntoOrigen,
        punto_destino_id: puntoDestino,
        equipo_adicional_json: equipoAdicional
      });
      setShowNuevaModal(false);
      setPuntoOrigen('');
      setPuntoDestino('');
      setEquipoAdicional('');
      fetchData();
    } catch (e) {
      console.error("Error creando solicitud:", e);
      alert("No se pudo aperturar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAsignarUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudSeleccionada?.id || !vehiculoId || !conductorId) return;
    setIsSubmitting(true);
    try {
      await flotaApi.asignarSolicitud(solicitudSeleccionada.id, Number(vehiculoId), Number(conductorId));
      setShowAsignarModal(false);
      setSolicitudSeleccionada(null);
      setVehiculoId('');
      setConductorId('');
      fetchData();
    } catch (e) {
      console.error("Error asignando unidad:", e);
      alert("No se pudo asignar el vehículo.");
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando Control de Flota y Checklist 360...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      
      {/* Header y Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Truck size={32} color="#FACC15" />
            Control de Flota y Checklist 360
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Gestión orquestada por máquina de estados para camiones y maquinaria pesada.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/flota/inspeccion">
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#1e293b', fontWeight: '600', cursor: 'pointer' }}>
              <ClipboardCheck size={18} color="#FACC15" />
              Checklist 360 (PWA)
            </button>
          </Link>
          <Link href="/flota/vehiculos">
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
              <Wrench size={18} />
              Catálogo de Flota
            </button>
          </Link>
          <button
            onClick={() => setShowNuevaModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FACC15', color: '#1e293b', padding: '0.65rem 1.25rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
            <Plus size={20} />
            Nueva Solicitud (Operaciones)
          </button>
        </div>
      </div>

      {/* Buscador y Filtros por Estado */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por código, origen, destino o vehículo..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select 
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#334155', outline: 'none', cursor: 'pointer' }}
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="DRAFT">1. Aperturadas (Operaciones)</option>
          <option value="ASIGNADA">2. Asignadas (Transporte)</option>
          <option value="APROBADA_TALLER">3. Aprobado Taller</option>
          <option value="EN_TRANSITO">4. En Tránsito</option>
          <option value="CHECKIN_CONFORME">5. Llegada Conforme</option>
          <option value="CERRADO_FINALIZADO">6. Cerradas Conforme</option>
        </select>
      </div>

      {/* Listado de Solicitudes */}
      {solicitudesFiltradas.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <Truck size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No hay solicitudes de flota registradas.</p>
          <p style={{ fontSize: '0.875rem' }}>Haz clic en "Nueva Solicitud" para aperturar un flujo de traslado.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {solicitudesFiltradas.map((sol) => {
            const badge = ESTADOS_BADGES[sol.estado_actual || 'DRAFT'] || { label: sol.estado_actual, bg: '#f1f5f9', color: '#475569' };

            return (
              <div key={sol.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Header de la tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>{sol.codigo_solicitud}</span>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700', backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Aperturada: {new Date(sol.creado_en || '').toLocaleString()}
                  </div>
                </div>

                {/* Contenido principal */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                  
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
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Unidad y Conductor</div>
                    {sol.vehiculo_codigo ? (
                      <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '600' }}>
                        🚜 {sol.vehiculo_codigo} ({sol.vehiculo_tipo}) <br />
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>👤 Chofer: {sol.conductor_nombre || 'No asignado'}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontStyle: 'italic' }}>Pendiente de asignación por Transporte</span>
                    )}
                  </div>

                  {/* Equipo Adicional */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Equipo Adicional Declarado</div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {sol.equipo_adicional_json || 'Sin equipamiento adicional'}
                    </div>
                  </div>

                  {/* Acciones por Rol según FSM */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    {sol.estado_actual === 'DRAFT' && (
                      <button
                        onClick={() => { setSolicitudSeleccionada(sol); setShowAsignarModal(true); }}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#1e293b', color: 'white', border: 'none', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        Asignar Unidad (Transporte)
                      </button>
                    )}

                    <Link href={`/flota/inspeccion?solicitud_id=${sol.id}`}>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#FACC15', color: '#1e293b', border: 'none', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <ClipboardCheck size={16} />
                        Inspección 360
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '500px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Aperturar Solicitud de Flota</h2>
              <button onClick={() => setShowNuevaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCrearSolicitud} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Punto u Origen de Salida</label>
                <select required value={puntoOrigen} onChange={e => setPuntoOrigen(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">-- Seleccionar Origen --</option>
                  <option value="Taller CED">Taller CED</option>
                  <option value="Blockon Campuzano">Blockon Campuzano</option>
                  <option value="Blockon Mateare">Blockon Mateare</option>
                  <option value="Garita Ciudad Doral">Garita Ciudad Doral</option>
                  <option value="Garita Ciudad Campuzano">Garita Ciudad Campuzano</option>
                  <option value="Garita Praderas de Mombacho">Garita Praderas de Mombacho</option>
                  <option value="Proyectos Menaggio">Proyectos Menaggio</option>
                  <option value="Bodega Bismark Martínez">Bodega Bismark Martínez</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Punto o Destino de Llegada</label>
                <select required value={puntoDestino} onChange={e => setPuntoDestino(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">-- Seleccionar Destino --</option>
                  <option value="Taller CED">Taller CED</option>
                  <option value="Blockon Campuzano">Blockon Campuzano</option>
                  <option value="Blockon Mateare">Blockon Mateare</option>
                  <option value="Garita Ciudad Doral">Garita Ciudad Doral</option>
                  <option value="Garita Ciudad Campuzano">Garita Ciudad Campuzano</option>
                  <option value="Garita Praderas de Mombacho">Garita Praderas de Mombacho</option>
                  <option value="Proyectos Menaggio">Proyectos Menaggio</option>
                  <option value="Bodega Bismark Martínez">Bodega Bismark Martínez</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Equipo Adicional Requerido / Declarado</label>
                <textarea 
                  rows={3}
                  value={equipoAdicional}
                  onChange={e => setEquipoAdicional(e.target.value)}
                  placeholder="Ej: Generador eléctrico 5000W, 2 cajas de herramientas, 1 soldadora remolcable..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowNuevaModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Aperturando...' : 'Aperturar Solicitud'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Unidad (Transporte) */}
      {showAsignarModal && solicitudSeleccionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '450px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Asignar Unidad y Chofer</h2>
              <button onClick={() => setShowAsignarModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAsignarUnidad} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Seleccionar Camión / Maquinaria</label>
                <select required value={vehiculoId} onChange={e => setVehiculoId(e.target.value ? Number(e.target.value) : '')} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.codigo_unidad} - {v.tipo_unidad} ({v.marca_modelo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Seleccionar Conductor Responsable</label>
                <select required value={conductorId} onChange={e => setConductorId(e.target.value ? Number(e.target.value) : '')} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">-- Seleccionar Chofer --</option>
                  {conductores.map(c => (
                    <option key={c.id} value={c.id}>{c.email} (ID: {c.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAsignarModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Asignando...' : 'Confirmar Asignación'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ClipboardCheck, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Wrench, 
  ArrowLeft,
  QrCode
} from 'lucide-react';
import { flotaApi, SolicitudFlota, Inspeccion360, ItemInspeccion360 } from '@/lib/api';

const ITEMS_CHECKLIST_BASE = [
  { categoria: 'MECANICA', nombre: 'Sistema de Frenos y Presión de Aire' },
  { categoria: 'MECANICA', nombre: 'Niveles de Aceite de Motor y Refrigerante' },
  { categoria: 'MECANICA', nombre: 'Sistema Hidráulico y Ausencia de Fugas' },
  { categoria: 'MECANICA', nombre: 'Estado de Neumáticos / Orugas de Tracción' },
  { categoria: 'LUCES', nombre: 'Luces Principales, Dirección y Stop' },
  { categoria: 'LUCES', nombre: 'Alarma de Retroceso y Pértiga de Advertencia' },
  { categoria: 'SEGURIDAD', nombre: 'Extintor Vigente y Llanta de Repuesto' },
  { categoria: 'EPP_CONDUCTOR', nombre: 'Casco de Seguridad y Chaleco Reflectivo del Chofer' },
  { categoria: 'EPP_CONDUCTOR', nombre: 'Botas de Seguridad con Puntera de Acero' },
  { categoria: 'ESTRUCTURA_CARGA', nombre: 'Amarre de Carga y Precintos de Seguridad' }
];

function Inspeccion360Form() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const solicitudIdParam = searchParams.get('solicitud_id');

  const [solicitudes, setSolicitudes] = useState<SolicitudFlota[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudFlota | null>(null);
  const [etapa, setEtapa] = useState<string>('TALLER_SALIDA');
  const [horometroKm, setHorometroKm] = useState<number>(0);
  const [nivelCombustible, setNivelCombustible] = useState<string>('3/4');
  const [resultadoDictamen, setResultadoDictamen] = useState<string>('APROBADO');
  const [observaciones, setObservaciones] = useState<string>('');

  // Items de evaluación
  const [itemsEvaluados, setItemsEvaluados] = useState<Record<string, { estado: string; foto: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const data = await flotaApi.getSolicitudes();
      setSolicitudes(data || []);
      
      if (solicitudIdParam) {
        const encontrada = (data || []).find(s => String(s.id) === solicitudIdParam);
        if (encontrada) setSolicitudSeleccionada(encontrada);
      }
    } catch (e) {
      console.error("Error al obtener solicitudes:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoItemChange = (nombre: string, nuevoEstado: string) => {
    setItemsEvaluados(prev => ({
      ...prev,
      [nombre]: {
        estado: nuevoEstado,
        foto: prev[nombre]?.foto || ''
      }
    }));
  };

  const handleFotoSimulada = (nombre: string) => {
    const fotoUrlSimulada = `https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80`;
    setItemsEvaluados(prev => ({
      ...prev,
      [nombre]: {
        estado: prev[nombre]?.estado || 'MALO',
        foto: fotoUrlSimulada
      }
    }));
    alert(`📷 Fotografía capturada para "${nombre}".`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudSeleccionada?.id) {
      alert("Por favor seleccione una solicitud activa.");
      return;
    }

    setSubmitting(true);
    try {
      const detallesList: ItemInspeccion360[] = ITEMS_CHECKLIST_BASE.map(item => {
        const evalData = itemsEvaluados[item.nombre] || { estado: 'BUENO', foto: '' };
        return {
          categoria: item.categoria,
          item_nombre: item.nombre,
          estado_item: evalData.estado,
          foto_url: evalData.foto
        };
      });

      const inspeccionData: Inspeccion360 = {
        solicitud_id: solicitudSeleccionada.id,
        etapa: etapa,
        resultado: resultadoDictamen,
        horometro_km: horometroKm,
        nivel_combustible: nivelCombustible,
        observaciones: observaciones,
        detalles: detallesList
      };

      await flotaApi.registrarInspeccion(solicitudSeleccionada.id, inspeccionData);
      alert("✅ Inspección Checklist 360 registrada con éxito.");
      router.push('/flota');
    } catch (e: any) {
      console.error("Error al registrar inspección:", e);
      alert(e.response?.data?.message || "Error al registrar la inspección 360.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando terminal de inspección PWA...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto', color: '#1e293b' }}>
      
      {/* Header PWA Rugged */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => router.push('/flota')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
            <ClipboardCheck size={26} color="#FACC15" />
            Terminal Checklist 360 PWA
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Inspección para Garitas de Seguridad y Taller (IP68 Rugged Ready).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Selección de Solicitud y Etapa */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={18} color="#3b82f6" /> 1. Datos de la Solicitud y Punto de Control
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Solicitud de Flota</label>
              <select 
                required 
                value={solicitudSeleccionada?.id || ''} 
                onChange={e => {
                  const sel = solicitudes.find(s => String(s.id) === e.target.value);
                  setSolicitudSeleccionada(sel || null);
                }}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
              >
                <option value="">-- Seleccionar Solicitud --</option>
                {solicitudes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.codigo_solicitud} | {s.vehiculo_codigo || 'Sin Unidad'} ({s.punto_origen_id} ➔ {s.punto_destino_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Etapa del Checklist</label>
              <select 
                required 
                value={etapa} 
                onChange={e => setEtapa(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="TALLER_SALIDA">🛠️ Taller (Salida Inicial)</option>
                <option value="GARITA_SALIDA">👮 Garita Origen (Check-out Punto A)</option>
                <option value="GARITA_LLEGADA">👮 Garita Destino (Check-in Punto B)</option>
                <option value="TALLER_CIERRE">🛠️ Taller (Cierre Final)</option>
              </select>
            </div>
          </div>

          {solicitudSeleccionada && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
              <strong>Unidad Asignada:</strong> {solicitudSeleccionada.vehiculo_codigo || 'N/A'} ({solicitudSeleccionada.vehiculo_tipo || 'N/A'}) <br />
              <strong>Conductor Responsable:</strong> {solicitudSeleccionada.conductor_nombre || 'N/A'} <br />
              <strong>Equipo Adicional:</strong> {solicitudSeleccionada.equipo_adicional_json || 'Ninguno'}
            </div>
          )}
        </div>

        {/* Datos Técnicos: Horómetro/KM y Combustible */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={18} color="#d97706" /> 2. Lectura Técnica de la Unidad
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Horómetro (Horas) o Kilometraje</label>
              <input 
                type="number" 
                step="any"
                required
                value={horometroKm}
                onChange={e => setHorometroKm(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                placeholder="Ej. 1250.5"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Nivel de Combustible</label>
              <select 
                value={nivelCombustible} 
                onChange={e => setNivelCombustible(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="reserva">Reserva (Muy Bajo)</option>
                <option value="1/4">1/4 Tanque</option>
                <option value="1/2">1/2 Tanque</option>
                <option value="3/4">3/4 Tanque</option>
                <option value="lleno">Tanque Lleno (100%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evaluación 360 por Ítems */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#10b981" /> 3. Puntos de Evaluación 360 y Fotografías
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ITEMS_CHECKLIST_BASE.map((item, idx) => {
              const evalData = itemsEvaluados[item.nombre] || { estado: 'BUENO', foto: '' };

              return (
                <div key={idx} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                      {idx + 1}. {item.nombre}
                    </span>

                    {/* Botones de Estado */}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {['BUENO', 'REGULAR', 'MALO'].map(est => (
                        <button
                          key={est}
                          type="button"
                          onClick={() => handleEstadoItemChange(item.nombre, est)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            backgroundColor: evalData.estado === est ? (est === 'BUENO' ? '#10b981' : est === 'REGULAR' ? '#f59e0b' : '#ef4444') : '#cbd5e1',
                            color: evalData.estado === est ? 'white' : '#475569'
                          }}
                        >
                          {est}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Captura de Foto si es Malo / Regular */}
                  {(evalData.estado === 'MALO' || evalData.estado === 'REGULAR') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleFotoSimulada(item.nombre)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        <Camera size={14} />
                        {evalData.foto ? 'Foto Capturada ✅' : 'Tomar Foto Obligatoria'}
                      </button>
                      {evalData.foto && <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Evidencia fotográfica adjunta</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dictamen Final y Observaciones */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1e293b' }}>
            4. Dictamen Final del Inspector
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Resultado de la Evaluación</label>
            <select 
              value={resultadoDictamen} 
              onChange={e => setResultadoDictamen(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 'bold', backgroundColor: 'white' }}
            >
              <option value="APROBADO">🟢 APROBADO (Autorizado para continuar)</option>
              <option value="RECHAZADO">🔴 RECHAZADO (Detener unidad / No autorizar)</option>
              <option value="CON_OBSERVACION">🟡 APROBADO CON OBSERVACIÓN</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Observaciones del Inspector</label>
            <textarea 
              rows={3}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Detallar cualquier raspon, falla o nota relevante..."
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Botones de Envío */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <button 
            type="button" 
            onClick={() => router.push('/flota')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={submitting}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
            {submitting ? 'Guardando Inspección...' : 'Firmar y Registrar Inspección 360'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function Inspeccion360Page() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando terminal...</div>}>
      <Inspeccion360Form />
    </Suspense>
  );
}

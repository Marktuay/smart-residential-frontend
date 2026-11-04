'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
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
  QrCode,
  Trash2,
  Eye,
  Fuel,
  Gauge
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

  // Items de evaluación { [nombre]: { estado: 'BUENO' | 'REGULAR' | 'MALO', foto: 'data:image/...' } }
  const [itemsEvaluados, setItemsEvaluados] = useState<Record<string, { estado: string; foto: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Visor de foto ampliada
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  // Referencias a inputs de archivos ocultos
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

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
        if (encontrada) {
          setSolicitudSeleccionada(encontrada);
        }
      }
    } catch (e) {
      console.error("Error al obtener solicitudes:", e);
      setErrorMsg("No se pudieron cargar las solicitudes de traslado.");
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

  const handleFileChange = (nombre: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`La foto para "${nombre}" supera los 5MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setItemsEvaluados(prev => ({
        ...prev,
        [nombre]: {
          estado: prev[nombre]?.estado || 'MALO',
          foto: base64String
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFoto = (nombre: string) => {
    setItemsEvaluados(prev => ({
      ...prev,
      [nombre]: {
        estado: prev[nombre]?.estado || 'BUENO',
        foto: ''
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudSeleccionada?.id) {
      setErrorMsg("Por favor seleccione una solicitud activa.");
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
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
        horometro_km: Number(horometroKm) || 0,
        nivel_combustible: nivelCombustible,
        observaciones: observaciones.trim(),
        detalles: detallesList
      };

      await flotaApi.registrarInspeccion(solicitudSeleccionada.id, inspeccionData);
      setSuccessMsg("✅ Inspección Checklist 360 registrada con éxito.");
      setTimeout(() => {
        router.push('/flota');
      }, 1500);
    } catch (e: any) {
      console.error("Error al registrar inspección:", e);
      setErrorMsg(e.response?.data?.message || e.response?.data?.error || "Error al registrar la inspección 360 en el servidor.");
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
    <div style={{ padding: '1.5rem', maxWidth: '850px', margin: '0 auto', color: '#1e293b' }}>
      
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

      {/* Header PWA Rugged */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/flota')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
            <ClipboardCheck size={28} color="#FACC15" />
            Terminal Checklist 360 PWA
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Inspección fotográfica para Garitas de Control y Taller Mecánico (IP68 Rugged).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* 1. Selección de Solicitud y Etapa */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={18} color="#3b82f6" /> 1. Solicitud y Punto de Control
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Solicitud de Flota *</label>
              <select 
                required 
                value={solicitudSeleccionada?.id || ''} 
                onChange={e => {
                  const sel = solicitudes.find(s => String(s.id) === e.target.value);
                  setSolicitudSeleccionada(sel || null);
                }}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
              >
                <option value="">-- Seleccionar Solicitud Activa --</option>
                {solicitudes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.codigo_solicitud} | {s.vehiculo_codigo || 'Sin Unidad'} ({s.punto_origen_id} ➔ {s.punto_destino_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Etapa del Checklist *</label>
              <select 
                required 
                value={etapa} 
                onChange={e => setEtapa(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="TALLER_SALIDA">🛠️ Taller (Salida Inicial / Aprobación)</option>
                <option value="GARITA_SALIDA">👮 Garita Origen (Check-out Punto A)</option>
                <option value="GARITA_LLEGADA">👮 Garita Destino (Check-in Punto B)</option>
                <option value="TALLER_CIERRE">🛠️ Taller (Cierre Final de Retorno)</option>
              </select>
            </div>
          </div>

          {solicitudSeleccionada && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div><strong>Unidad Asignada:</strong> {solicitudSeleccionada.vehiculo_codigo || 'N/A'} ({solicitudSeleccionada.vehiculo_tipo || 'N/A'})</div>
              <div><strong>Conductor Responsable:</strong> {solicitudSeleccionada.conductor_nombre || 'Sin chofer'}</div>
              <div><strong>Ruta:</strong> {solicitudSeleccionada.punto_origen_id} ➔ {solicitudSeleccionada.punto_destino_id}</div>
              <div><strong>Equipo Adicional:</strong> {solicitudSeleccionada.equipo_adicional_json || 'Ninguno'}</div>
            </div>
          )}
        </div>

        {/* 2. Lectura Técnica: Horómetro/KM y Combustible */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={18} color="#d97706" /> 2. Lectura de Horómetro / Odómetro y Combustible
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                <Gauge size={14} color="#3b82f6" />
                Horómetro (Horas) o Kilometraje Actual *
              </label>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                <Fuel size={14} color="#f59e0b" />
                Nivel de Combustible *
              </label>
              <select 
                value={nivelCombustible} 
                onChange={e => setNivelCombustible(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="reserva">Reserva (Crítico / Muy Bajo)</option>
                <option value="1/4">1/4 Tanque</option>
                <option value="1/2">1/2 Tanque</option>
                <option value="3/4">3/4 Tanque</option>
                <option value="lleno">Tanque Lleno (100%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Evaluación 360 por Ítems con Captura Fotográfica Real */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#10b981" /> 3. Puntos de Inspección 360 y Evidencia Fotográfica
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            Marque cada componente. Para observaciones o desperfectos, capture una fotografía directa desde la cámara del dispositivo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ITEMS_CHECKLIST_BASE.map((item, idx) => {
              const evalData = itemsEvaluados[item.nombre] || { estado: 'BUENO', foto: '' };

              return (
                <div key={idx} style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            backgroundColor: evalData.estado === est ? (est === 'BUENO' ? '#10b981' : est === 'REGULAR' ? '#f59e0b' : '#ef4444') : '#e2e8f0',
                            color: evalData.estado === est ? 'white' : '#475569'
                          }}
                        >
                          {est}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Captura de Foto Real si es Regular o Malo, o voluntario */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      ref={el => { fileInputsRef.current[item.nombre] = el; }}
                      onChange={e => handleFileChange(item.nombre, e)}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputsRef.current[item.nombre]?.click()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.65rem',
                        backgroundColor: evalData.foto ? '#0284c7' : (evalData.estado === 'MALO' ? '#ef4444' : '#64748b'),
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <Camera size={14} />
                      {evalData.foto ? 'Cambiar Foto' : (evalData.estado === 'MALO' ? 'Foto Obligatoria *' : 'Adjuntar Foto')}
                    </button>

                    {evalData.foto && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setFotoModal(evalData.foto)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          <Eye size={12} /> Ver Evidencia
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFoto(item.nombre)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Eliminar foto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Dictamen Final y Observaciones */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#1e293b' }}>
            4. Dictamen Final del Inspector
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Resultado de la Evaluación *</label>
            <select 
              value={resultadoDictamen} 
              onChange={e => setResultadoDictamen(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 'bold', backgroundColor: 'white' }}
            >
              <option value="APROBADO">🟢 APROBADO (Autorizado para continuar operación)</option>
              <option value="RECHAZADO">🔴 RECHAZADO (Detener unidad / No autorizar salida)</option>
              <option value="CON_OBSERVACION">🟡 APROBADO CON OBSERVACIÓN (Condicionado)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Observaciones del Inspector</label>
            <textarea 
              rows={3}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Detallar cualquier rasguño, falla mecánica o nota para el siguiente punto de control..."
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
            {submitting ? 'Firmando y Guardando...' : 'Firmar y Registrar Inspección 360'}
          </button>
        </div>

      </form>

      {/* Modal Zoom Foto */}
      {fotoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ position: 'relative', maxWidth: '600px', width: '100%', backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Evidencia Fotográfica Capturada</span>
              <button onClick={() => setFotoModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#0f172a' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoModal} alt="Evidencia Inspección" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '0.5rem', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

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

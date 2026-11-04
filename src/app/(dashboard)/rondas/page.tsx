'use client';

import { useState, useEffect } from 'react';
import { 
  rondasApi, 
  puntosQrApi, 
  residencialApi, 
  usuariosApi,
  PuntoQR, 
  ProgramaRonda,
  AsignacionRonda, 
  MarcacionRonda,
  Usuario,
  ResidencialInfo 
} from '@/lib/api';
import { 
  Play, 
  CheckCircle, 
  Navigation, 
  MapPin, 
  Plus, 
  QrCode, 
  Home, 
  Shield, 
  X, 
  Building,
  Clock,
  UserCheck,
  AlertTriangle,
  RotateCw,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function RondasPage() {
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'PROGRAMAS' | 'ASIGNAR'>('MONITOR');
  
  // Datos
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [programas, setProgramas] = useState<ProgramaRonda[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionRonda[]>([]);
  const [marcaciones, setMarcaciones] = useState<MarcacionRonda[]>([]);
  const [guardias, setGuardias] = useState<Usuario[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados para multi-tenant selector (SISADMIN)
  const [userRole, setUserRole] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');

  // Modal Crear Programa de Ronda
  const [showProgramaModal, setShowProgramaModal] = useState(false);
  const [isSubmittingPrograma, setIsSubmittingPrograma] = useState(false);
  const [programaForm, setProgramaForm] = useState({
    nombre: '',
    hora_inicio: '22:00',
    hora_fin: '06:00',
    recurrencia: 'DIARIA',
    tolerancia_mins: 15,
    puntos_seleccionados: [] as number[]
  });

  // Modal Asignar Ronda
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [isSubmittingAsignar, setIsSubmittingAsignar] = useState(false);
  const [asignarForm, setAsignarForm] = useState({
    programa_id: '',
    guardia_id: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  // Modal Simular / Test Marcación Rápida
  const [showSimuladorMarcacion, setShowSimuladorMarcacion] = useState(false);
  const [selectedPuntoToScan, setSelectedPuntoToScan] = useState<string>('');
  const [observacionScan, setObservacionScan] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    const resId = localStorage.getItem('residencial_id') || '';
    setUserRole(role);
    setSelectedResidencialId(resId);

    const init = async () => {
      if (role === 'SISADMIN') {
        try {
          const list = await residencialApi.getResidenciales();
          setResidenciales(list || []);
        } catch (err) {
          console.error('Error al cargar residenciales:', err);
        }
      }
      fetchData(resId);
    };

    init();
  }, []);

  const fetchData = async (resId?: string) => {
    const activeResId = resId !== undefined ? resId : (localStorage.getItem('residencial_id') || '');
    if (!activeResId) {
      setPuntos([]);
      setProgramas([]);
      setAsignaciones([]);
      setMarcaciones([]);
      setGuardias([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [puntosData, programasData, asignacionesData, marcacionesData, usuariosData] = await Promise.all([
        puntosQrApi.getPuntos().catch(() => []),
        rondasApi.getProgramas().catch(() => []),
        rondasApi.getAsignaciones().catch(() => []),
        rondasApi.getMarcaciones(30).catch(() => []),
        usuariosApi.getUsuarios({ rol: 'GUARDIA' }).catch(() => [])
      ]);

      setPuntos(puntosData || []);
      setProgramas(programasData || []);
      setAsignaciones(asignacionesData || []);
      setMarcaciones(marcacionesData || []);
      setGuardias(usuariosData || []);
    } catch (err) {
      console.error("Error fetching rondas data:", err);
      setError('Error al cargar la información operativa de rondas.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(selectedResidencialId);
    setRefreshing(false);
  };

  const handleResidencialChange = (resId: string) => {
    setSelectedResidencialId(resId);
    localStorage.setItem('residencial_id', resId);
    fetchData(resId);
  };

  const handleTogglePuntoInPrograma = (puntoId: number) => {
    setProgramaForm(prev => {
      const exists = prev.puntos_seleccionados.includes(puntoId);
      if (exists) {
        return {
          ...prev,
          puntos_seleccionados: prev.puntos_seleccionados.filter(id => id !== puntoId)
        };
      } else {
        return {
          ...prev,
          puntos_seleccionados: [...prev.puntos_seleccionados, puntoId]
        };
      }
    });
  };

  const handleCreatePrograma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (programaForm.puntos_seleccionados.length === 0) {
      alert('Debe seleccionar al menos un punto de control para la ruta de ronda.');
      return;
    }

    setIsSubmittingPrograma(true);
    try {
      await rondasApi.createPrograma({
        nombre: programaForm.nombre.trim(),
        hora_inicio: programaForm.hora_inicio,
        hora_fin: programaForm.hora_fin,
        recurrencia: programaForm.recurrencia,
        tolerancia_mins: programaForm.tolerancia_mins,
        puntos: programaForm.puntos_seleccionados
      });

      setSuccessMsg(`Ruta de patrullaje "${programaForm.nombre}" creada con éxito.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowProgramaModal(false);
      setProgramaForm({
        nombre: '',
        hora_inicio: '22:00',
        hora_fin: '06:00',
        recurrencia: 'DIARIA',
        tolerancia_mins: 15,
        puntos_seleccionados: []
      });
      fetchData(selectedResidencialId);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el programa de ronda.');
    } finally {
      setIsSubmittingPrograma(false);
    }
  };

  const handleDeletePrograma = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta ruta de ronda?')) return;
    try {
      await rondasApi.deletePrograma(id);
      setSuccessMsg('Ruta de ronda eliminada.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData(selectedResidencialId);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la ruta.');
    }
  };

  const handleCreateAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asignarForm.programa_id || !asignarForm.guardia_id) {
      alert('Seleccione tanto el programa de ronda como el oficial asignado.');
      return;
    }

    setIsSubmittingAsignar(true);
    try {
      await rondasApi.createAsignacion({
        programa_id: parseInt(asignarForm.programa_id),
        usuario_id: parseInt(asignarForm.guardia_id),
        fecha: asignarForm.fecha,
        estado: 'PENDIENTE'
      });

      setSuccessMsg('Ronda asignada exitosamente al oficial.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowAsignarModal(false);
      fetchData(selectedResidencialId);
    } catch (err) {
      console.error(err);
      alert('Error al asignar la ronda.');
    } finally {
      setIsSubmittingAsignar(false);
    }
  };

  const handleSimularMarcacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPuntoToScan) {
      alert('Seleccione un punto QR para registrar marcación.');
      return;
    }

    try {
      await rondasApi.registrarMarcacion({
        codigo_qr: selectedPuntoToScan,
        observacion: observacionScan || 'Marcación de verificación desde consola de control'
      });

      setSuccessMsg('Marcación QR procesada e insertada en el historial en vivo.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowSimuladorMarcacion(false);
      setSelectedPuntoToScan('');
      setObservacionScan('');
      fetchData(selectedResidencialId);
    } catch (err) {
      console.error(err);
      alert('Error al registrar la marcación.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
            <Navigation size={24} color="#FACC15" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Gestión y Monitoreo de Rondas
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Planificación de recorridos, asignación de oficiales y auditoría en tiempo real de escaneos QR.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '0.625rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            <RotateCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>

          <Link
            href="/puntos-qr"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--bg-card)',
              color: '#FACC15',
              border: '1px solid #ca8a04',
              padding: '0.625rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '700',
              fontSize: '0.8125rem',
              textDecoration: 'none'
            }}
          >
            <QrCode size={15} /> Administrar Fichas QR
          </Link>

          <button
            onClick={() => setShowProgramaModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#1e293b',
              color: '#FACC15',
              border: '1px solid #334155',
              padding: '0.625rem 1.15rem',
              borderRadius: '0.5rem',
              fontWeight: '800',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Diseñar Ruta
          </button>

          <button
            onClick={() => setShowAsignarModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FACC15',
              color: '#0f172a',
              border: 'none',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: '800',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(250, 204, 21, 0.25)'
            }}
          >
            <UserCheck size={16} /> Asignar Guardia
          </button>
        </div>
      </div>

      {/* Selector Multi-Tenant SISADMIN */}
      {userRole === 'SISADMIN' && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Building size={20} color="#FACC15" />
          <label style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>Residencial Activo:</label>
          <select
            value={selectedResidencialId}
            onChange={(e) => handleResidencialChange(e.target.value)}
            style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '600' }}
          >
            {residenciales.map(r => (
              <option key={r.id} value={r.id}>{r.nombre} ({r.id})</option>
            ))}
          </select>
        </div>
      )}

      {/* Mensajes de feedback */}
      {successMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '0.625rem', border: '1px solid #22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '0.625rem', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Tabs Principales */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setActiveTab('MONITOR')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'MONITOR' ? '3px solid #FACC15' : '3px solid transparent',
            color: activeTab === 'MONITOR' ? '#FACC15' : 'var(--text-secondary)',
            fontWeight: '800',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Clock size={16} /> Monitor en Vivo de Rondas
        </button>

        <button
          onClick={() => setActiveTab('PROGRAMAS')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'PROGRAMAS' ? '3px solid #FACC15' : '3px solid transparent',
            color: activeTab === 'PROGRAMAS' ? '#FACC15' : 'var(--text-secondary)',
            fontWeight: '800',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers size={16} /> Rutas de Patrullaje ({programas.length})
        </button>
      </div>

      {/* TAB 1: MONITOR EN VIVO DE RONDAS */}
      {activeTab === 'MONITOR' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          
          {/* Columna Izquierda: Asignaciones de Rondas Activas */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={20} color="#FACC15" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Rondas Programadas y en Ejecución
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-body)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: '700' }}>
                {asignaciones.length} Asignadas
              </span>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Cargando asignaciones...</p>
            ) : asignaciones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <Navigation size={40} color="#ca8a04" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
                <h4 style={{ fontWeight: '700', color: 'var(--text-primary)' }}>No hay rondas programadas</h4>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Asigne una ruta a un oficial para iniciar la trazabilidad de patrullaje.</p>
                <button
                  onClick={() => setShowAsignarModal(true)}
                  style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#FACC15', color: '#0f172a', fontWeight: '700', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.8125rem' }}
                >
                  Asignar Guardia a Ronda
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {asignaciones.map((asig) => {
                  const completados = asig.puntos_completados || 0;
                  const total = asig.puntos_total || 1;
                  const pct = asig.porcentaje_cumplimiento || Math.round((completados / total) * 100);

                  const statusColor = 
                    asig.estado === 'FINALIZADA' ? '#16a34a' :
                    asig.estado === 'EN_CURSO' ? '#2563eb' : '#ca8a04';
                  
                  const statusBg =
                    asig.estado === 'FINALIZADA' ? 'rgba(34, 197, 94, 0.12)' :
                    asig.estado === 'EN_CURSO' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(250, 204, 21, 0.15)';

                  return (
                    <div
                      key={asig.id}
                      style={{
                        backgroundColor: 'var(--bg-body)',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Ronda #{asig.id} • {asig.fecha}
                          </span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0.15rem 0' }}>
                            {asig.programa_nombre || `Programa ${asig.programa_id}`}
                          </h3>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <UserCheck size={14} color="#FACC15" /> Oficial: <strong>{asig.guardia_nombre || `Guardia ID: ${asig.usuario_id}`}</strong>
                          </div>
                        </div>

                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          backgroundColor: statusBg,
                          color: statusColor,
                          border: `1px solid ${statusColor}`
                        }}>
                          {asig.estado || 'PENDIENTE'}
                        </span>
                      </div>

                      {/* Barra de progreso de escaneo */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                          <span>Progreso de Puntos QR: {completados} / {total}</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: pct === 100 ? '#22c55e' : '#FACC15',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Feed en Vivo de Marcaciones Satelitales / QR */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="#FACC15" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Auditoría de Marcaciones QR en Tiempo Real
                </h2>
              </div>
              <button
                onClick={() => setShowSimuladorMarcacion(true)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  backgroundColor: '#1e293b',
                  color: '#FACC15',
                  border: '1px solid #334155',
                  borderRadius: '0.375rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Registrar Marcación
              </button>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Cargando marcaciones...</p>
            ) : marcaciones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <QrCode size={40} color="#64748b" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h4 style={{ fontWeight: '700', color: 'var(--text-primary)' }}>No hay marcaciones registradas</h4>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Cuando el guardia escanee una ficha QR desde la aplicación móvil o garita, el evento aparecerá aquí con su sello de tiempo y ubicación.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
                {marcaciones.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      backgroundColor: 'var(--bg-body)',
                      borderRadius: '0.625rem',
                      padding: '0.875rem 1rem',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <CheckCircle size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {m.punto_nombre || `Punto QR #${m.punto_qr_id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>Oficial: <strong>{m.guardia_nombre || 'Guardia Activo'}</strong></span>
                          {m.numero_casa && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#ca8a04', fontWeight: '700' }}>Casa {m.numero_casa}</span>
                            </>
                          )}
                        </div>
                        {m.observacion && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.15rem' }}>
                            &quot;{m.observacion}&quot;
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {m.fecha_hora ? new Date(m.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Hora no registrada'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        {m.fecha_hora ? new Date(m.fecha_hora).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: RUTAS DE PATRULLAJE (PROGRAMAS) */}
      {activeTab === 'PROGRAMAS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Catálogo de Rutas Oficiales
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Secuencias de puntos QR estructuradas que los guardias deben completar en sus turnos.
              </p>
            </div>
            <button
              onClick={() => setShowProgramaModal(true)}
              style={{ padding: '0.625rem 1.25rem', backgroundColor: '#FACC15', color: '#0f172a', fontWeight: '800', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Diseñar Nueva Ruta
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {programas.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <Layers size={48} color="#ca8a04" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>No hay rutas diseñadas</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Cree una ruta de patrullaje asignando una secuencia ordenada de puntos QR registrados.
                </p>
                <button
                  onClick={() => setShowProgramaModal(true)}
                  style={{ marginTop: '1.25rem', padding: '0.625rem 1.25rem', backgroundColor: '#FACC15', color: '#0f172a', fontWeight: '800', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                >
                  Diseñar Ruta
                </button>
              </div>
            ) : (
              programas.map((prog) => (
                <div
                  key={prog.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#ca8a04', textTransform: 'uppercase' }}>
                        {prog.recurrencia} • Tolerancia {prog.tolerancia_mins || 15} min
                      </span>
                      <button
                        onClick={() => prog.id && handleDeletePrograma(prog.id)}
                        title="Eliminar Ruta"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      {prog.nombre}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      <Clock size={14} color="#FACC15" /> Horario: <strong>{prog.hora_inicio} - {prog.hora_fin}</strong>
                    </div>

                    {/* Secuencia de Puntos */}
                    <div style={{ backgroundColor: 'var(--bg-body)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Puntos en Ruta:</span>
                        <span style={{ color: '#FACC15', backgroundColor: '#1e293b', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {prog.total_puntos || (prog.puntos_detalle?.length || 0)} Puntos
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {prog.puntos_detalle && prog.puntos_detalle.length > 0 ? (
                          prog.puntos_detalle.map((p, idx) => (
                            <span
                              key={p.id || idx}
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.5rem',
                                backgroundColor: 'var(--bg-card)',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <strong>#{idx + 1}</strong> {p.nombre}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Secuencia de puntos configurada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAsignarForm(prev => ({ ...prev, programa_id: prog.id ? prog.id.toString() : '' }));
                      setShowAsignarModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      backgroundColor: '#1e293b',
                      color: '#FACC15',
                      border: '1px solid #334155',
                      borderRadius: '0.5rem',
                      fontWeight: '800',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <UserCheck size={16} /> Asignar a Guardia Ahora
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL DISEÑAR NUEVA RUTA / PROGRAMA */}
      {showProgramaModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', color: 'var(--text-primary)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers color="#FACC15" size={24} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Diseñar Ruta de Ronda</h3>
              </div>
              <button onClick={() => setShowProgramaModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreatePrograma} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Nombre de la Ruta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ronda Perimetral Nocturna, Ronda Sector Casas B"
                  value={programaForm.nombre}
                  onChange={(e) => setProgramaForm({ ...programaForm, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Hora de Inicio *</label>
                  <input
                    type="time"
                    required
                    value={programaForm.hora_inicio}
                    onChange={(e) => setProgramaForm({ ...programaForm, hora_inicio: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Hora de Fin *</label>
                  <input
                    type="time"
                    required
                    value={programaForm.hora_fin}
                    onChange={(e) => setProgramaForm({ ...programaForm, hora_fin: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Recurrencia *</label>
                  <select
                    value={programaForm.recurrencia}
                    onChange={(e) => setProgramaForm({ ...programaForm, recurrencia: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  >
                    <option value="DIARIA">Diaria (Todos los días)</option>
                    <option value="LUNES_A_VIERNES">Lunes a Viernes</option>
                    <option value="FIN_DE_SEMANA">Fines de Semana</option>
                    <option value="NOCTURNA">Turno Nocturno</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Tolerancia (Minutos)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={programaForm.tolerancia_mins}
                    onChange={(e) => setProgramaForm({ ...programaForm, tolerancia_mins: parseInt(e.target.value) || 15 })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Selector de Puntos QR Registrados */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700' }}>
                    Seleccionar Puntos QR para la Ruta ({programaForm.puntos_seleccionados.length} seleccionados) *
                  </label>
                  <Link href="/puntos-qr" style={{ fontSize: '0.75rem', color: '#FACC15', textDecoration: 'none', fontWeight: '700' }}>
                    + Crear más puntos QR
                  </Link>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-body)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {puntos.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>
                      No hay puntos QR registrados en el residencial. Registre puntos en el catálogo primero.
                    </p>
                  ) : (
                    puntos.map(p => {
                      const selected = p.id ? programaForm.puntos_seleccionados.includes(p.id) : false;
                      return (
                        <div
                          key={p.id}
                          onClick={() => p.id && handleTogglePuntoInPrograma(p.id)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            backgroundColor: selected ? '#1e293b' : 'var(--bg-card)',
                            color: selected ? '#FACC15' : 'var(--text-primary)',
                            border: selected ? '1px solid #FACC15' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.8125rem',
                            fontWeight: selected ? '700' : '500'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={selected}
                              readOnly
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{p.nombre}</span>
                            {p.numero_casa && (
                              <span style={{ fontSize: '0.7rem', color: '#ca8a04' }}>(Casa {p.numero_casa})</span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {p.codigo_qr}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProgramaModal(false)}
                  style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPrograma}
                  style={{ padding: '0.625rem 1.5rem', backgroundColor: '#FACC15', color: '#0f172a', border: 'none', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  {isSubmittingPrograma ? 'Guardando...' : 'Crear Ruta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR GUARDIA A RONDA */}
      {showAsignarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '480px', padding: '2rem', color: 'var(--text-primary)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck color="#FACC15" size={24} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Asignar Guardia a Ronda</h3>
              </div>
              <button onClick={() => setShowAsignarModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateAsignacion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Ruta de Ronda *</label>
                <select
                  required
                  value={asignarForm.programa_id}
                  onChange={(e) => setAsignarForm({ ...asignarForm, programa_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                >
                  <option value="">-- Seleccione una Ruta --</option>
                  {programas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.hora_inicio} - {p.hora_fin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Oficial de Seguridad (Guardia) *</label>
                <select
                  required
                  value={asignarForm.guardia_id}
                  onChange={(e) => setAsignarForm({ ...asignarForm, guardia_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                >
                  <option value="">-- Seleccione un Guardia --</option>
                  {guardias.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.nombre_completo || g.email} ({g.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Fecha de Ejecución *</label>
                <input
                  type="date"
                  required
                  value={asignarForm.fecha}
                  onChange={(e) => setAsignarForm({ ...asignarForm, fecha: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAsignarModal(false)}
                  style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAsignar}
                  style={{ padding: '0.625rem 1.5rem', backgroundColor: '#FACC15', color: '#0f172a', border: 'none', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  {isSubmittingAsignar ? 'Asignando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR MARCACIÓN MANUAL / SIMULADOR GARITA */}
      {showSimuladorMarcacion && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '480px', padding: '2rem', color: 'var(--text-primary)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode color="#FACC15" size={24} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Registrar Marcación Manual</h3>
              </div>
              <button onClick={() => setShowSimuladorMarcacion(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Permite certificar la visita a un punto QR desde la consola web o probar la sincronización satelital.
            </p>

            <form onSubmit={handleSimularMarcacion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Punto QR a Marcar *</label>
                <select
                  required
                  value={selectedPuntoToScan}
                  onChange={(e) => setSelectedPuntoToScan(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                >
                  <option value="">-- Seleccionar Punto QR --</option>
                  {puntos.map(p => (
                    <option key={p.id} value={p.codigo_qr}>
                      {p.nombre} ({p.codigo_qr}) {p.numero_casa ? `- Casa ${p.numero_casa}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Observación o Nota de Seguridad</label>
                <input
                  type="text"
                  placeholder="Ej: Perímetro sin novedades, portón asegurado"
                  value={observacionScan}
                  onChange={(e) => setObservacionScan(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowSimuladorMarcacion(false)}
                  style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.625rem 1.5rem', backgroundColor: '#FACC15', color: '#0f172a', border: 'none', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  Certificar Marcación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

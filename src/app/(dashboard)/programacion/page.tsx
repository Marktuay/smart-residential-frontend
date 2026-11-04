'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
  Grid,
  Filter,
  Download,
  AlertTriangle,
  History,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { turnosApi, usuariosApi, Turno, Usuario } from '@/lib/api';

const calcularHoras = (horaInicio: string, horaFin: string): number => {
  if (!horaInicio || !horaFin) return 0;
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFin.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60; // Cruza medianoche
  return Math.round((mins / 60) * 10) / 10;
};

export default function ProgramacionPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [guardias, setGuardias] = useState<Usuario[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userRole, setUserRole] = useState<string>('');

  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMassiveModal, setShowMassiveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Formulario Individual
  const [editingTurnoId, setEditingTurnoId] = useState<number | null>(null);
  const [guardiaId, setGuardiaId] = useState<number>(0);
  const [fecha, setFecha] = useState<string>('');
  const [tipoTurno, setTipoTurno] = useState<string>('TD');
  const [horaInicio, setHoraInicio] = useState<string>('07:00');
  const [horaFin, setHoraFin] = useState<string>('19:00');
  const [ubicacion, setUbicacion] = useState<string>('Garita Principal');
  const [descripcion, setDescripcion] = useState<string>('');

  // Formulario Masivo
  const [selectedGuardiaIds, setSelectedGuardiaIds] = useState<number[]>([]);
  const [mDesde, setMDesde] = useState<string>('');
  const [mHasta, setMHasta] = useState<string>('');
  const [mTipoTurno, setMTipoTurno] = useState<string>('TD');
  const [mHoraInicio, setMHoraInicio] = useState<string>('07:00');
  const [mHoraFin, setMHoraFin] = useState<string>('19:00');
  const [mUbicacion, setMUbicacion] = useState<string>('Garita Principal');
  const [mNotas, setMNotas] = useState<string>('');

  // Filtros
  const [filtroGuardia, setFiltroGuardia] = useState<string>('TODOS');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('TODOS');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('user_role') || '');
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [turnosData, usuariosData] = await Promise.all([
        turnosApi.getTurnos(),
        usuariosApi.getUsuarios()
      ]);
      setTurnos(turnosData || []);
      
      const filteredGuardias = (usuariosData || []).filter(u => 
        u.rol === 'GUARDIA' || u.rol === 'GUARDIA_PATRULLERO' || 
        u.rol === 'GUARDIA_MOTORIZADO' || u.rol === 'SUPERVISOR' || u.rol === 'ADMIN'
      );
      setGuardias(filteredGuardias);
    } catch (err: any) {
      console.error('Error al cargar turnos:', err);
      setError('No se pudieron cargar los turnos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4500);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 5500);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const setMonthToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getMonthName = (monthIndex: number) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[monthIndex];
  };

  const duracionHorasIndividual = useMemo(() => {
    return calcularHoras(horaInicio, horaFin);
  }, [horaInicio, horaFin]);

  const duracionHorasMasivo = useMemo(() => {
    return calcularHoras(mHoraInicio, mHoraFin);
  }, [mHoraInicio, mHoraFin]);

  // Turnos del mes filtrados
  const turnosDelMes = useMemo(() => {
    const monthStr = String(month + 1).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    return turnos.filter(t => {
      const matchMonth = (t.fecha || '').startsWith(prefix);
      const matchGuardia = filtroGuardia === 'TODOS' || String(t.guardia_id) === filtroGuardia;
      const matchUbicacion = filtroUbicacion === 'TODOS' || (t.ubicacion || '') === filtroUbicacion;
      return matchMonth && matchGuardia && matchUbicacion;
    });
  }, [turnos, year, month, filtroGuardia, filtroUbicacion]);

  // Métricas del mes
  const metricas = useMemo(() => {
    const totalTurnos = turnosDelMes.length;
    let totalHoras = 0;
    const guardiasSet = new Set<number>();
    let presentes = 0;
    let ausentes = 0;

    turnosDelMes.forEach(t => {
      totalHoras += (t.horas || calcularHoras(t.hora_inicio, t.hora_fin));
      guardiasSet.add(t.guardia_id);
      if (t.asistencia === 'PRESENTE' || t.estado === 'EN_CURSO' || t.estado === 'COMPLETADO') {
        presentes++;
      } else if (t.asistencia === 'AUSENTE') {
        ausentes++;
      }
    });

    return {
      totalTurnos,
      totalHoras: Math.round(totalHoras * 10) / 10,
      totalGuardias: guardiasSet.size,
      presentes,
      ausentes
    };
  }, [turnosDelMes]);

  const handleOpenAddModal = (dateStr?: string) => {
    setEditingTurnoId(null);
    setGuardiaId(guardias.length > 0 ? guardias[0].id! : 0);
    setFecha(dateStr || new Date().toISOString().split('T')[0]);
    setTipoTurno('TD');
    setHoraInicio('07:00');
    setHoraFin('19:00');
    setUbicacion('Garita Principal');
    setDescripcion('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (t: Turno) => {
    setEditingTurnoId(t.id || null);
    setGuardiaId(t.guardia_id);
    setFecha(t.fecha);
    setHoraInicio(t.hora_inicio);
    setHoraFin(t.hora_fin);
    setUbicacion(t.ubicacion || 'Garita Principal');
    setDescripcion(t.descripcion || '');
    setShowDetailModal(false);
    setShowAddModal(true);
  };

  const handleSaveTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardiaId || !fecha || !horaInicio || !horaFin) {
      showNotification('Complete todos los campos obligatorios del turno.', 'error');
      return;
    }

    if (duracionHorasIndividual <= 0) {
      showNotification('La hora de inicio y fin no pueden ser idénticas.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload: Turno = {
        guardia_id: guardiaId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        horas: duracionHorasIndividual,
        ubicacion,
        descripcion: `${tipoTurno} - ${descripcion}`.trim(),
        estado: 'PROGRAMADO'
      };

      if (editingTurnoId) {
        payload.id = editingTurnoId;
        const actualizado = await turnosApi.updateTurno(editingTurnoId, payload);
        setTurnos(turnos.map(t => t.id === editingTurnoId ? actualizado : t));
        showNotification('Turno actualizado con éxito', 'success');
      } else {
        const creado = await turnosApi.createTurno(payload);
        setTurnos([creado, ...turnos]);
        showNotification('Turno programado exitosamente', 'success');
      }

      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data || err.message || 'Error guardando turno';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMassiveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuardiaIds.length === 0) {
      showNotification('Seleccione al menos un colaborador para asignar.', 'error');
      return;
    }
    if (!mDesde || !mHasta || !mUbicacion) {
      showNotification('Complete las fechas de inicio, fin y ubicación.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const result = await turnosApi.createTurnoMasivo({
        guardia_ids: selectedGuardiaIds,
        fecha_desde: mDesde,
        fecha_hasta: mHasta,
        hora_inicio: mHoraInicio,
        hora_fin: mHoraFin,
        tipo_turno: mTipoTurno,
        ubicacion: mUbicacion,
        notas: mNotas
      });

      let mensaje = `Programación masiva: ${result.creados} turnos creados exitosamente.`;
      if (result.conflictos > 0) {
        mensaje += ` (${result.conflictos} omitidos por solapamiento horario).`;
      }
      showNotification(mensaje, 'success');
      setShowMassiveModal(false);
      resetMassiveForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data || err.message || 'Error en programación masiva', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarcarAsistencia = async (id: number, nuevoEstado: string) => {
    setActionLoading(true);
    try {
      await turnosApi.marcarAsistencia(id, nuevoEstado);
      setTurnos(turnos.map(t => t.id === id ? { ...t, asistencia: nuevoEstado, estado: nuevoEstado === 'PRESENTE' ? 'EN_CURSO' : nuevoEstado === 'COMPLETADO' ? 'COMPLETADO' : t.estado } : t));
      if (selectedTurno && selectedTurno.id === id) {
        setSelectedTurno({ ...selectedTurno, asistencia: nuevoEstado });
      }
      showNotification(`Asistencia registrada: ${nuevoEstado}`, 'success');
    } catch (err: any) {
      showNotification('No se pudo actualizar la asistencia: ' + (err.response?.data || err.message), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTurno = async (id?: number) => {
    if (!id) return;
    if (!confirm('¿Está seguro de cancelar esta asignación de turno? Se registrará en la auditoría.')) return;
    setActionLoading(true);
    try {
      await turnosApi.deleteTurno(id);
      setTurnos(turnos.map(t => t.id === id ? { ...t, estado: 'CANCELADO' } : t));
      showNotification('Turno cancelado y registrado en auditoría', 'success');
      setShowDetailModal(false);
    } catch (err: any) {
      showNotification('No se pudo cancelar el turno', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAuditModal = async () => {
    setShowAuditModal(true);
    setLoadingAudit(true);
    try {
      const logs = await turnosApi.getAuditoria();
      setAuditLogs(logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleExportCSV = () => {
    if (turnosDelMes.length === 0) {
      alert('No hay turnos para exportar en este período.');
      return;
    }

    const headers = ['ID', 'Fecha', 'Colaborador', 'Cedula', 'Login', 'Puesto_Ubicacion', 'Hora_Inicio', 'Hora_Fin', 'Horas_Jornada', 'Estado_Turno', 'Asistencia', 'Creado_Por'];
    const rows = turnosDelMes.map(t => [
      t.id,
      t.fecha,
      `"${(t.guardia_nombre || '').replace(/"/g, '""')}"`,
      `"${t.guardia_cedula || ''}"`,
      t.guardia_email || '',
      `"${(t.ubicacion || '').replace(/"/g, '""')}"`,
      t.hora_inicio,
      t.hora_fin,
      t.horas || calcularHoras(t.hora_inicio, t.hora_fin),
      t.estado,
      t.asistencia || 'PENDIENTE',
      `"${t.creado_por || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rol_turnos_${year}_${month + 1}_ncs365.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setEditingTurnoId(null);
    setGuardiaId(0);
    setFecha('');
    setTipoTurno('TD');
    setHoraInicio('07:00');
    setHoraFin('19:00');
    setUbicacion('Garita Principal');
    setDescripcion('');
  };

  const resetMassiveForm = () => {
    setSelectedGuardiaIds([]);
    setMDesde('');
    setMHasta('');
    setMTipoTurno('TD');
    setMHoraInicio('07:00');
    setMHoraFin('19:00');
    setMUbicacion('Garita Principal');
    setMNotas('');
  };

  const toggleSelectAllGuardias = () => {
    if (selectedGuardiaIds.length === guardias.length) {
      setSelectedGuardiaIds([]);
    } else {
      setSelectedGuardiaIds(guardias.map(g => g.id!));
    }
  };

  const toggleGuardiaSelection = (id: number) => {
    if (selectedGuardiaIds.includes(id)) {
      setSelectedGuardiaIds(selectedGuardiaIds.filter(i => i !== id));
    } else {
      setSelectedGuardiaIds([...selectedGuardiaIds, id]);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%', color: '#1e293b' }}>
      
      {/* Encabezado y Acciones Principales */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarIcon size={28} color="#FACC15" />
            Programación de Turnos y Rol de Guardias
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Gestión horaria estricta anti-solapamiento, consolidación de jornadas y control de asistencia.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenAuditModal}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.65rem 1rem', backgroundColor: '#fff', color: '#334155',
              border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontWeight: '600',
              cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <History size={16} color="#64748b" />
            <span>Auditoría de Turnos</span>
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.65rem 1rem', backgroundColor: '#fff', color: '#047857',
              border: '1px solid #a7f3d0', borderRadius: '0.5rem', fontWeight: '600',
              cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Download size={16} color="#059669" />
            <span>Exportar Rol (.CSV)</span>
          </button>

          <button
            onClick={() => setShowMassiveModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.65rem 1.15rem', backgroundColor: '#1e293b', color: '#fff',
              border: 'none', borderRadius: '0.5rem', fontWeight: 'bold',
              cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            <Users size={16} color="#FACC15" />
            <span>Programación Masiva</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.65rem 1.25rem', backgroundColor: '#FACC15', color: '#1e293b',
              border: 'none', borderRadius: '0.5rem', fontWeight: 'bold',
              cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            <Plus size={18} />
            <span>Nuevo Turno</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.25rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '0.5rem', marginBottom: '1.25rem', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tarjetas de Métricas del Mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Turnos Programados ({getMonthName(month)})</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b', marginTop: '0.25rem' }}>{metricas.totalTurnos}</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>Planilla mensual activa</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Horas Totales Cubiertas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0284c7', marginTop: '0.25rem' }}>{metricas.totalHoras} hrs</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Cálculo automático de jornada</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Guardias en Rol Activo</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#7c3aed', marginTop: '0.25rem' }}>{metricas.totalGuardias}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>De {guardias.length} en plantilla</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Asistencias Marcadas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#16a34a', marginTop: '0.25rem' }}>{metricas.presentes}</div>
          <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.25rem' }}>{metricas.ausentes} ausencias reportadas</div>
        </div>
      </div>

      {/* Controles de Navegación de Mes y Filtros */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Navegador de Mes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={prevMonth} style={{ padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '1.15rem', fontWeight: 'bold', minWidth: '180px', textAlign: 'center', color: '#1e293b' }}>
            {getMonthName(month)} {year}
          </span>
          <button onClick={nextMonth} style={{ padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}>
            <ChevronRight size={18} />
          </button>
          <button onClick={setMonthToday} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
            Hoy
          </button>
        </div>

        {/* Filtros de Puesto y Colaborador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: '600' }}>Guardia:</span>
            <select
              value={filtroGuardia}
              onChange={e => setFiltroGuardia(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.825rem', outline: 'none' }}
            >
              <option value="TODOS">Todos los colaboradores</option>
              {guardias.map(g => (
                <option key={g.id} value={String(g.id)}>{g.nombre_completo || g.email}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: '600' }}>Puesto:</span>
            <select
              value={filtroUbicacion}
              onChange={e => setFiltroUbicacion(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.825rem', outline: 'none' }}
            >
              <option value="TODOS">Todas las ubicaciones</option>
              <option value="Garita Principal">Garita Principal</option>
              <option value="Garita Secundaria">Garita Secundaria</option>
              <option value="Patrullaje Perimetral">Patrullaje Perimetral</option>
              <option value="Centro de Control C2">Centro de Control C2</option>
              <option value="Taller y Maquinaria">Taller y Maquinaria</option>
            </select>
          </div>

          {/* Switch Grid / Calendario */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', padding: '0.2rem' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.35rem 0.65rem', borderRadius: '0.25rem', border: 'none',
                backgroundColor: viewMode === 'grid' ? '#1e293b' : 'transparent',
                color: viewMode === 'grid' ? '#FACC15' : '#64748b',
                fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
              }}
            >
              Matriz / Rol
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '0.35rem 0.65rem', borderRadius: '0.25rem', border: 'none',
                backgroundColor: viewMode === 'calendar' ? '#1e293b' : 'transparent',
                color: viewMode === 'calendar' ? '#FACC15' : '#64748b',
                fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
              }}
            >
              Calendario
            </button>
          </div>

        </div>

      </div>

      {/* Vista 1: Matriz de Rol de Guardias */}
      {viewMode === 'grid' ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', minWidth: '200px', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 10, borderRight: '1px solid #e2e8f0' }}>
                    Colaborador / Puesto
                  </th>
                  {daysArray.map(d => {
                    const dObj = new Date(year, month, d);
                    const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
                    return (
                      <th key={d} style={{ padding: '0.5rem 0.25rem', minWidth: '34px', backgroundColor: isWeekend ? '#f1f5f9' : '#f8fafc', color: isWeekend ? '#b91c1c' : '#475569', fontWeight: 'bold' }}>
                        <div>{d}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 'normal' }}>
                          {['D', 'L', 'M', 'X', 'J', 'V', 'S'][dObj.getDay()]}
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold', minWidth: '60px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {guardias.map(g => {
                  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
                  const guardTurnos = turnos.filter(t => t.guardia_id === g.id && (t.fecha || '').startsWith(monthPrefix) && t.estado !== 'CANCELADO');
                  const totalHorasGuardia = guardTurnos.reduce((acc, curr) => acc + (curr.horas || calcularHoras(curr.hora_inicio, curr.hora_fin)), 0);

                  return (
                    <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 5, borderRight: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{g.nombre_completo || g.email}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{g.rol} {g.cedula ? `• ${g.cedula}` : ''}</div>
                      </td>

                      {daysArray.map(d => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const t = guardTurnos.find(x => x.fecha === dateStr);
                        const isDayWeekend = new Date(year, month, d).getDay() === 0 || new Date(year, month, d).getDay() === 6;

                        if (!t) {
                          return (
                            <td 
                              key={d} 
                              onClick={() => { setGuardiaId(g.id!); handleOpenAddModal(dateStr); }}
                              style={{ padding: '0.25rem', backgroundColor: isDayWeekend ? '#fbfcfd' : 'transparent', cursor: 'pointer', borderRight: '1px solid #f8fafc' }}
                              title={`Asignar turno a ${g.nombre_completo || g.email} el día ${d}`}
                            >
                              <span style={{ color: '#e2e8f0', fontSize: '0.65rem' }}>+</span>
                            </td>
                          );
                        }

                        const isNocturno = t.hora_inicio >= '18:00' || t.hora_inicio <= '06:00';
                        const bg = isNocturno ? '#1e293b' : '#FACC15';
                        const fg = isNocturno ? '#FACC15' : '#1e293b';

                        return (
                          <td 
                            key={d} 
                            onClick={() => { setSelectedTurno(t); setShowDetailModal(true); }}
                            style={{ padding: '0.2rem', cursor: 'pointer', borderRight: '1px solid #f8fafc' }}
                            title={`${t.hora_inicio} - ${t.hora_fin} (${t.horas}h) en ${t.ubicacion}`}
                          >
                            <div style={{ backgroundColor: bg, color: fg, borderRadius: '0.25rem', padding: '0.25rem 0.1rem', fontWeight: 'bold', fontSize: '0.65rem' }}>
                              {isNocturno ? 'TN' : 'TD'}
                            </div>
                          </td>
                        );
                      })}

                      <td style={{ padding: '0.5rem', fontWeight: 'bold', color: totalHorasGuardia > 160 ? '#b45309' : '#059669', backgroundColor: '#f8fafc' }}>
                        {Math.round(totalHorasGuardia)}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista 2: Calendario Mensual */
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 'bold', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
            <div>Domingo</div><div>Lunes</div><div>Martes</div><div>Miércoles</div><div>Jueves</div><div>Viernes</div><div>Sábado</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
            {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: '90px', backgroundColor: '#f8fafc', borderRadius: '0.5rem', opacity: 0.4 }} />
            ))}
            {daysArray.map(d => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const turnosDelDia = turnosDelMes.filter(t => t.fecha === dateStr && t.estado !== 'CANCELADO');

              return (
                <div 
                  key={d}
                  style={{ minHeight: '90px', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.4rem', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155' }}>{d}</span>
                    <button
                      onClick={() => handleOpenAddModal(dateStr)}
                      style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer', padding: 0 }}
                      title="Agregar turno este día"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '110px' }}>
                    {turnosDelDia.map(t => (
                      <div
                        key={t.id}
                        onClick={() => { setSelectedTurno(t); setShowDetailModal(true); }}
                        style={{
                          backgroundColor: '#1e293b', color: '#FACC15',
                          borderRadius: '0.25rem', padding: '0.2rem 0.35rem',
                          fontSize: '0.68rem', fontWeight: '600', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {t.guardia_nombre?.split(' ')[0] || 'Guardia'}
                        </span>
                        <span>{t.hora_inicio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Nuevo / Editar Turno */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '1rem',
            width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                {editingTurnoId ? 'Modificar Turno de Guardia' : 'Programar Turno Individual'}
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTurno} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Colaborador Responsable *
                </label>
                <select
                  required
                  value={guardiaId}
                  onChange={e => setGuardiaId(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff' }}
                >
                  <option value={0}>-- Seleccionar Colaborador --</option>
                  {guardias.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.nombre_completo || g.email} ({g.rol}) {g.cedula ? `- ${g.cedula}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Fecha del Turno *
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Ubicación / Puesto *
                  </label>
                  <select
                    value={ubicacion}
                    onChange={e => setUbicacion(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="Garita Principal">Garita Principal</option>
                    <option value="Garita Secundaria">Garita Secundaria</option>
                    <option value="Patrullaje Perimetral">Patrullaje Perimetral</option>
                    <option value="Centro de Control C2">Centro de Control C2</option>
                    <option value="Taller y Maquinaria">Taller y Maquinaria</option>
                    <option value="Puesto Acceso Proveedores">Puesto Acceso Proveedores</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Hora Entrada (HH:MM) *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={e => setHoraInicio(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Hora Salida (HH:MM) *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaFin}
                    onChange={e => setHoraFin(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Indicador de horas calculadas */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>
                  ⏱️ Duración Calculada de la Jornada:
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#15803d' }}>
                  {duracionHorasIndividual} Horas
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Notas Operativas / Asignación Específica
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cobertura especial en garita poniente"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  {actionLoading ? 'Validando...' : editingTurnoId ? 'Actualizar Turno' : 'Confirmar Programación'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Programación Masiva */}
      {showMassiveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '1rem',
            width: '100%', maxWidth: '620px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={22} color="#0284c7" />
                Generador de Rol Masivo con Anti-Solapamiento
              </h2>
              <button onClick={() => setShowMassiveModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleMassiveCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                    Seleccionar Colaboradores ({selectedGuardiaIds.length} seleccionados) *
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAllGuardias}
                    style={{ border: 'none', background: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {selectedGuardiaIds.length === guardias.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div style={{ maxHeight: '130px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                  {guardias.map(g => {
                    const isSelected = selectedGuardiaIds.includes(g.id!);
                    return (
                      <div
                        key={g.id}
                        onClick={() => toggleGuardiaSelection(g.id!)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.35rem 0.5rem', borderRadius: '0.375rem',
                          backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                          border: `1px solid ${isSelected ? '#93c5fd' : '#e2e8f0'}`,
                          cursor: 'pointer', fontSize: '0.75rem'
                        }}
                      >
                        <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer' }} />
                        <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.nombre_completo || g.email}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Desde Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={mDesde}
                    onChange={e => setMDesde(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Hasta Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={mHasta}
                    onChange={e => setMHasta(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Tipo de Turno
                  </label>
                  <select
                    value={mTipoTurno}
                    onChange={e => {
                      const v = e.target.value;
                      setMTipoTurno(v);
                      if (v === 'TD') { setMHoraInicio('07:00'); setMHoraFin('19:00'); }
                      else if (v === 'TN') { setMHoraInicio('19:00'); setMHoraFin('07:00'); }
                    }}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="TD">Diurno (12h)</option>
                    <option value="TN">Nocturno (12h)</option>
                    <option value="EXTRA">Turno Extra</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Hora Entrada
                  </label>
                  <input
                    type="time"
                    required
                    value={mHoraInicio}
                    onChange={e => setMHoraInicio(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Hora Salida
                  </label>
                  <input
                    type="time"
                    required
                    value={mHoraFin}
                    onChange={e => setMHoraFin(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Puesto Asignado *
                </label>
                <input
                  type="text"
                  required
                  value={mUbicacion}
                  onChange={e => setMUbicacion(e.target.value)}
                  placeholder="Ej: Garita Principal"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#475569', border: '1px solid #e2e8f0' }}>
                🛡️ <b>Control Anti-Solapamiento:</b> El motor en el servidor verificará cada fecha y colaborador. Si alguno ya tiene turno asignado en el mismo horario, se omitirá automáticamente para evitar solapamientos.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowMassiveModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#0284c7', color: '#fff', fontWeight: 'bold', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  {actionLoading ? 'Procesando Rol...' : 'Ejecutar Rol Masivo'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Detalle de Turno y Control de Asistencia */}
      {showDetailModal && selectedTurno && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '1rem',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', border: '1px solid #e2e8f0', padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
                  Ficha de Turno #{selectedTurno.id}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Fecha: {selectedTurno.fecha}</span>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Colaborador:</span>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{selectedTurno.guardia_nombre || selectedTurno.guardia_email}</span>
                {selectedTurno.guardia_cedula && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> (Cédula: {selectedTurno.guardia_cedula})</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Horario:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedTurno.hora_inicio} - {selectedTurno.hora_fin} ({selectedTurno.horas}h)</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Ubicación:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedTurno.ubicacion}</span>
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Descripción:</span>
                <span>{selectedTurno.descripcion || 'Sin descripción adicional'}</span>
              </div>

              {/* Estado de Asistencia */}
              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Marcación de Asistencia Operativa:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleMarcarAsistencia(selectedTurno.id!, 'PRESENTE')}
                    style={{
                      padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: 'none',
                      backgroundColor: selectedTurno.asistencia === 'PRESENTE' ? '#15803d' : '#dcfce7',
                      color: selectedTurno.asistencia === 'PRESENTE' ? '#fff' : '#166534',
                      fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
                    }}
                  >
                    ✅ Presente
                  </button>
                  <button
                    onClick={() => handleMarcarAsistencia(selectedTurno.id!, 'TARDANZA')}
                    style={{
                      padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: 'none',
                      backgroundColor: selectedTurno.asistencia === 'TARDANZA' ? '#b45309' : '#fef3c7',
                      color: selectedTurno.asistencia === 'TARDANZA' ? '#fff' : '#b45309',
                      fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
                    }}
                  >
                    ⏱️ Tardanza
                  </button>
                  <button
                    onClick={() => handleMarcarAsistencia(selectedTurno.id!, 'AUSENTE')}
                    style={{
                      padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: 'none',
                      backgroundColor: selectedTurno.asistencia === 'AUSENTE' ? '#dc2626' : '#fee2e2',
                      color: selectedTurno.asistencia === 'AUSENTE' ? '#fff' : '#dc2626',
                      fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
                    }}
                  >
                    ❌ Ausente
                  </button>
                  <button
                    onClick={() => handleMarcarAsistencia(selectedTurno.id!, 'COMPLETADO')}
                    style={{
                      padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: 'none',
                      backgroundColor: selectedTurno.estado === 'COMPLETADO' ? '#1e293b' : '#f1f5f9',
                      color: selectedTurno.estado === 'COMPLETADO' ? '#FACC15' : '#334155',
                      fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
                    }}
                  >
                    🏁 Concluido
                  </button>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button
                onClick={() => handleDeleteTurno(selectedTurno.id)}
                style={{ padding: '0.5rem 0.85rem', borderRadius: '0.375rem', border: '1px solid #fca5a5', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancelar Asignación
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleOpenEditModal(selectedTurno)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Historial de Auditoría */}
      {showAuditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '1rem',
            width: '100%', maxWidth: '850px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={22} color="#FACC15" />
                Historial de Auditoría de Programación y Turnos
              </h2>
              <button onClick={() => setShowAuditModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
              {loadingAudit ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Cargando registros de auditoría de la base de datos...
                </div>
              ) : auditLogs.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  No hay registros de auditoría registrados para turnos.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 'bold', color: '#475569' }}>Fecha y Hora</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 'bold', color: '#475569' }}>Acción</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 'bold', color: '#475569' }}>Actor / Usuario</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 'bold', color: '#475569' }}>IP</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 'bold', color: '#475569' }}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 'bold',
                            backgroundColor: log.accion.includes('CREAR') ? '#dcfce7' : log.accion.includes('ELIMINAR') ? '#fee2e2' : '#e0f2fe',
                            color: log.accion.includes('CREAR') ? '#15803d' : log.accion.includes('ELIMINAR') ? '#b91c1c' : '#0369a1'
                          }}>
                            {log.accion}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 'bold', color: '#334155' }}>{log.actor}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', color: '#64748b' }}>{log.ip || 'Local'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#334155' }}>{log.detalles}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button
                onClick={() => setShowAuditModal(false)}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

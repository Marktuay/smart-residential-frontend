'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { turnosApi, usuariosApi, Turno, Usuario } from '@/lib/api';

export default function ProgramacionPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [guardias, setGuardias] = useState<Usuario[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1));
  const [userRole, setUserRole] = useState<string>('');

  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMassiveModal, setShowMassiveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [guardiaId, setGuardiaId] = useState<number>(0);
  const [fecha, setFecha] = useState<string>('');
  const [tipoTurno, setTipoTurno] = useState<string>('TD');
  const [horaInicio, setHoraInicio] = useState<string>('07:00');
  const [horaFin, setHoraFin] = useState<string>('19:00');
  const [ubicacion, setUbicacion] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');

  const [selectedGuardiaIds, setSelectedGuardiaIds] = useState<number[]>([]);
  const [mDesde, setMDesde] = useState<string>('');
  const [mHasta, setMHasta] = useState<string>('');
  const [mTipoTurno, setMTipoTurno] = useState<string>('TD');
  const [mUbicacion, setMUbicacion] = useState<string>('');
  const [mNotas, setMNotas] = useState<string>('');
  const [mEsExtra, setMEsExtra] = useState<boolean>(false);

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
      setTurnos(turnosData);
      
      const filteredGuardias = usuariosData.filter(u => u.rol === 'GUARDIA' || u.rol === 'SUPERVISOR' || u.rol === 'ADMIN');
      setGuardias(filteredGuardias);
    } catch (err: any) {
      console.error('Error al cargar datos de programación:', err);
      setError('No se pudieron cargar los turnos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
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

  const getDayNameShort = (dayNumber: number) => {
    const d = new Date(year, month, dayNumber);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dayNames[d.getDay()];
  };

  const formatDateStr = (d: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const dayStr = d.toString().padStart(2, '0');
    return `${year}-${m}-${dayStr}`;
  };

  const handleCreateTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardiaId || !fecha || !ubicacion) {
      showNotification('Por favor complete los campos requeridos', 'error');
      return;
    }

    const exists = turnos.some(t => t.guardia_id === guardiaId && t.fecha === fecha && t.hora_inicio === horaInicio);
    if (exists) {
      showNotification('El colaborador ya tiene asignado un turno en esa fecha y horario.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const nuevoTurno: Turno = {
        guardia_id: guardiaId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        ubicacion,
        descripcion: `${tipoTurno} - ${descripcion}`.trim(),
        estado: 'PROGRAMADO'
      };

      const creado = await turnosApi.createTurno(nuevoTurno);
      setTurnos([...turnos, creado]);
      showNotification('Turno asignado con éxito', 'success');
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      showNotification('Error al crear el turno', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMassiveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuardiaIds.length === 0) {
      showNotification('Seleccione al menos un colaborador', 'error');
      return;
    }
    if (!mDesde || !mHasta || !mUbicacion) {
      showNotification('Complete las fechas y la ubicación de asignación', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const startDate = new Date(mDesde);
      const endDate = new Date(mHasta);
      const newTurnos: Turno[] = [];

      let hInicio = '07:00';
      let hFin = '19:00';
      let tagTurno = 'TD 12h Diurno';

      if (mTipoTurno === 'TN') {
        hInicio = '19:00';
        hFin = '07:00';
        tagTurno = 'TN 12h Nocturno';
      } else if (mTipoTurno === 'EXTRA') {
        hInicio = '08:00';
        hFin = '20:00';
        tagTurno = 'TD Extra';
      }

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        for (const gId of selectedGuardiaIds) {
          const exists = turnos.some(t => t.guardia_id === gId && t.fecha === dateStr && t.hora_inicio === hInicio);
          if (!exists) {
            const turno: Turno = {
              guardia_id: gId,
              fecha: dateStr,
              hora_inicio: hInicio,
              hora_fin: hFin,
              ubicacion: mUbicacion,
              descripcion: `${tagTurno} ${mEsExtra ? '[EXTRA]' : ''} - ${mNotas}`.trim(),
              estado: 'PROGRAMADO'
            };
            const res = await turnosApi.createTurno(turno);
            newTurnos.push(res);
          }
        }
      }

      setTurnos([...turnos, ...newTurnos]);
      showNotification(`Se generaron ${newTurnos.length} turnos masivos con éxito`, 'success');
      setShowMassiveModal(false);
      resetMassiveForm();
    } catch (err: any) {
      console.error(err);
      showNotification('Error al aplicar programación masiva', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTurno = async (id?: number) => {
    if (!id) return;
    if (!confirm('¿Está seguro de eliminar esta asignación de turno?')) return;
    setActionLoading(true);
    try {
      await turnosApi.deleteTurno(id);
      setTurnos(turnos.filter(t => t.id !== id));
      showNotification('Turno eliminado', 'success');
      setShowDetailModal(false);
    } catch (err: any) {
      showNotification('No se pudo eliminar el turno', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setGuardiaId(0);
    setFecha('');
    setTipoTurno('TD');
    setHoraInicio('07:00');
    setHoraFin('19:00');
    setUbicacion('');
    setDescripcion('');
  };

  const resetMassiveForm = () => {
    setSelectedGuardiaIds([]);
    setMDesde('');
    setMHasta('');
    setMTipoTurno('TD');
    setMUbicacion('');
    setMNotas('');
    setMEsExtra(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado y Selector de Vista */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Gráfico de Turnos & Rol de Guardias</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem', fontSize: '0.875rem' }}>Visualiza y gestiona la programación del personal de seguridad</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '0.5rem', padding: '0.25rem', display: 'flex', gap: '0.25rem', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <Grid size={16} /> Matriz GRID
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'calendar' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <CalendarIcon size={16} /> Calendario
            </button>
          </div>

          {(userRole === 'ADMIN' || userRole === 'SISADMIN') && (
            <button
              onClick={() => setShowMassiveModal(true)}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: '#f59e0b',
                color: '#000',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Sparkles size={16} /> Programador Masivo
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #10b981', color: '#10b981', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {getMonthName(month)} {year}
          </h2>
          <button onClick={setMonthToday} style={{ padding: '0.375rem 0.75rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>
            Hoy
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={prevMonth} style={{ padding: '0.5rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} style={{ padding: '0.5rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: 'pointer' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando matriz de turnos...</div>
      ) : (
        <>
          {viewMode === 'grid' && (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', minWidth: '180px', color: 'var(--text-secondary)', fontWeight: '600', position: 'sticky', left: 0, backgroundColor: 'var(--bg-body)', zIndex: 10 }}>
                      Colaborador
                    </th>
                    {daysArray.map(d => (
                      <th key={d} style={{ padding: '0.5rem 0.25rem', textAlign: 'center', minWidth: '36px', color: getDayNameShort(d) === 'Dom' || getDayNameShort(d) === 'Sáb' ? '#ef4444' : 'var(--text-primary)', borderLeft: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{getDayNameShort(d)}</div>
                        <div style={{ fontWeight: '700' }}>{d}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guardias.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 1} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay guardias o supervisores registrados.
                      </td>
                    </tr>
                  ) : (
                    guardias.map(g => (
                      <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--text-primary)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-card)', zIndex: 5, borderRight: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                              {g.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                              {g.email.split('@')[0]}
                            </div>
                          </div>
                        </td>

                        {daysArray.map(d => {
                          const dateStr = formatDateStr(d);
                          const turnosDelDia = turnos.filter(t => t.guardia_id === g.id && t.fecha === dateStr);

                          return (
                            <td 
                              key={d} 
                              onClick={() => {
                                setGuardiaId(g.id!);
                                setFecha(dateStr);
                                setShowAddModal(true);
                              }}
                              style={{ 
                                padding: '0.375rem 0.125rem', 
                                textAlign: 'center', 
                                borderLeft: '1px solid var(--border-color)', 
                                cursor: 'pointer',
                                verticalAlign: 'top',
                                height: '52px',
                                transition: 'background-color 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(243, 244, 246, 0.8)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {turnosDelDia.map(t => {
                                const isExtra = t.descripcion?.includes('[EXTRA]');
                                const isNight = t.hora_inicio >= '18:00' || t.hora_inicio === '19:00';
                                
                                let badgeColor = '#f59e0b';
                                let badgeText = 'TD';

                                if (isNight) {
                                  badgeColor = '#3b82f6';
                                  badgeText = 'TN';
                                }
                                if (isExtra) {
                                  badgeColor = '#ef4444';
                                  badgeText = 'EX';
                                }

                                return (
                                  <div
                                    key={t.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTurno(t);
                                      setShowDetailModal(true);
                                    }}
                                    style={{
                                      backgroundColor: badgeColor,
                                      color: '#fff',
                                      fontSize: '0.65rem',
                                      fontWeight: '800',
                                      padding: '0.2rem 0.3rem',
                                      borderRadius: '0.25rem',
                                      marginBottom: '0.2rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={`${t.ubicacion} (${t.hora_inicio} - ${t.hora_fin})`}
                                  >
                                    {badgeText}
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'calendar' && (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} style={{ textAlign: 'center', padding: '0.5rem', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {day}
                  </div>
                ))}

                {daysArray.map(d => {
                  const dateStr = formatDateStr(d);
                  const turnosDelDia = turnos.filter(t => t.fecha === dateStr);

                  return (
                    <div
                      key={d}
                      style={{
                        backgroundColor: 'var(--bg-body)',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        minHeight: '100px',
                        padding: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{d}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '80px' }}>
                        {turnosDelDia.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTurno(t);
                              setShowDetailModal(true);
                            }}
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              padding: '0.25rem 0.375rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              borderLeft: '3px solid var(--primary)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.guardia_email?.split('@')[0]}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{t.hora_inicio} - {t.ubicacion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL CREAR TURNO */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '450px', padding: '1.5rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Asignar Nuevo Turno</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateTurno} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Guardia / Supervisor</label>
                <select
                  value={guardiaId}
                  onChange={(e) => setGuardiaId(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  required
                >
                  <option value={0}>-- Seleccionar Colaborador --</option>
                  {guardias.map(g => (
                    <option key={g.id} value={g.id}>{g.email} ({g.rol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Fecha de Asignación</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Hora Fin</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Ubicación / Garita / Punto QR</label>
                <input
                  type="text"
                  placeholder="Ej. Garita Principal / Casa A29"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.625rem 1rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={actionLoading} style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}>Guardar Turno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROGRAMACIÓN MASIVA */}
      {showMassiveModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '600px', padding: '1.75rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles style={{ color: '#f59e0b' }} size={22} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Programación Masiva de Turnos</h3>
              </div>
              <button onClick={() => setShowMassiveModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleMassiveCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                    Seleccionar Colaboradores ({selectedGuardiaIds.length} seleccionados)
                  </label>
                  <button type="button" onClick={toggleSelectAllGuardias} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                    {selectedGuardiaIds.length === guardias.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                </div>
                <div style={{ backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', maxHeight: '120px', overflowY: 'auto', padding: '0.5rem' }}>
                  {guardias.map(g => (
                    <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedGuardiaIds.includes(g.id!)}
                        onChange={() => toggleGuardiaSelection(g.id!)}
                      />
                      {g.email} ({g.rol})
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Desde (Fecha Inicio)</label>
                  <input
                    type="date"
                    value={mDesde}
                    onChange={(e) => setMDesde(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Hasta (Fecha Fin)</label>
                  <input
                    type="date"
                    value={mHasta}
                    onChange={(e) => setMHasta(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Tipo de Turno</label>
                  <select
                    value={mTipoTurno}
                    onChange={(e) => setMTipoTurno(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  >
                    <option value="TD">TD - 12h Diurno (07:00 - 19:00)</option>
                    <option value="TN">TN - 12h Nocturno (19:00 - 07:00)</option>
                    <option value="EXTRA">TD Extra (08:00 - 20:00)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Ubicación / Punto QR</label>
                  <input
                    type="text"
                    placeholder="Ej. Garita P1 / Terrazas"
                    value={mUbicacion}
                    onChange={(e) => setMUbicacion(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowMassiveModal(false)} style={{ padding: '0.625rem 1rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={actionLoading} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>
                  {actionLoading ? 'Procesando...' : 'Aplicar Programación Masiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE TURNO */}
      {showDetailModal && selectedTurno && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '400px', padding: '1.5rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>Detalle de Asignación</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Colaborador:</strong> {selectedTurno.guardia_email}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Fecha:</strong> {selectedTurno.fecha}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Horario:</strong> {selectedTurno.hora_inicio} - {selectedTurno.hora_fin}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Ubicación:</strong> {selectedTurno.ubicacion}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Notas:</strong> {selectedTurno.descripcion || 'Sin notas'}</div>
            </div>

            {(userRole === 'ADMIN' || userRole === 'SISADMIN') && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleDeleteTurno(selectedTurno.id)}
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={16} /> Eliminar Asignación
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

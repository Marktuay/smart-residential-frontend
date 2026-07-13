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
  Info
} from 'lucide-react';
import { turnosApi, usuariosApi, Turno, Usuario } from '@/lib/api';

// Paleta de Colores NCS365
// Fondo Principal: #0f172a (Slate 900)
// Fondo de Tarjetas: #1e293b (Slate 800) / Glassmorphism
// Color Primario / Acento: #FACC15 (Yellow 400)
// Texto Principal: #ffffff
// Texto Secundario: #94a3b8 (Slate 400)

export default function ProgramacionPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [guardias, setGuardias] = useState<Usuario[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userRole, setUserRole] = useState<string>('');
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Selección
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  
  // Carga y Errores
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Formulario Nuevo/Edición
  const [guardiaId, setGuardiaId] = useState<number>(0);
  const [fecha, setFecha] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('08:00');
  const [horaFin, setHoraFin] = useState<string>('18:00');
  const [ubicacion, setUbicacion] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [estado, setEstado] = useState<string>('PROGRAMADO');

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
      
      // Filtrar usuarios que son guardias o supervisores para asignación de turnos
      const filteredGuardias = usuariosData.filter(u => u.rol === 'GUARDIA' || u.rol === 'SUPERVISOR');
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

  const handleOpenAddModal = (dateStr: string) => {
    if (userRole !== 'ADMIN' && userRole !== 'SISADMIN') return;
    setSelectedDate(dateStr);
    setFecha(dateStr);
    setGuardiaId(guardias.length > 0 ? (guardias[0].id || 0) : 0);
    setHoraInicio('08:00');
    setHoraFin('18:00');
    setUbicacion('');
    setDescripcion('');
    setEstado('PROGRAMADO');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, turno: Turno) => {
    e.stopPropagation();
    if (userRole !== 'ADMIN' && userRole !== 'SISADMIN') {
      // Si es otro rol, solo ver detalles
      handleOpenDetailModal(turno);
      return;
    }
    setSelectedTurno(turno);
    setGuardiaId(turno.guardia_id);
    setFecha(turno.fecha);
    setHoraInicio(turno.hora_inicio);
    setHoraFin(turno.hora_fin);
    setUbicacion(turno.ubicacion);
    setDescripcion(turno.descripcion);
    setEstado(turno.estado);
    setShowEditModal(true);
  };

  const handleOpenDetailModal = (turno: Turno) => {
    setSelectedTurno(turno);
    setShowDetailModal(true);
  };

  const handleCreateTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardiaId === 0) {
      showNotification('Seleccione un guardia válido.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const nuevoTurno: Turno = {
        guardia_id: Number(guardiaId),
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        ubicacion,
        descripcion,
        estado
      };

      await turnosApi.createTurno(nuevoTurno);
      setShowAddModal(false);
      showNotification('Turno programado exitosamente', 'success');
      fetchData();
    } catch (err: any) {
      console.error('Error al crear turno:', err);
      showNotification('Error al programar el turno en el servidor.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurno || !selectedTurno.id) return;

    setActionLoading(true);
    try {
      const turnoActualizado: Turno = {
        id: selectedTurno.id,
        guardia_id: Number(guardiaId),
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        ubicacion,
        descripcion,
        estado
      };

      await turnosApi.updateTurno(selectedTurno.id, turnoActualizado);
      setShowEditModal(false);
      showNotification('Turno actualizado correctamente', 'success');
      fetchData();
    } catch (err: any) {
      console.error('Error al actualizar turno:', err);
      showNotification('Error al guardar cambios del turno.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTurno = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea cancelar este turno?')) return;
    
    setActionLoading(true);
    try {
      await turnosApi.deleteTurno(id);
      setShowEditModal(false);
      showNotification('Turno cancelado exitosamente', 'success');
      fetchData();
    } catch (err: any) {
      console.error('Error al eliminar turno:', err);
      showNotification('Error al cancelar el turno.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Lógica de Calendario
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0: Dom, 1: Lun, ...
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Rellenar días del mes anterior
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        dateString: formatDateString(prevDate)
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      days.push({
        date: currDate,
        isCurrentMonth: true,
        dateString: formatDateString(currDate)
      });
    }
    
    // Rellenar días del mes siguiente para completar un grid de 6 filas (42 días)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        dateString: formatDateString(nextDate)
      });
    }
    
    return days;
  };

  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const monthsSpanish = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getEstadoBadgeStyle = (est: string) => {
    const base = {
      fontSize: '0.7rem',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: '600',
      display: 'inline-block'
    };
    switch (est) {
      case 'PROGRAMADO':
        return { ...base, backgroundColor: 'rgba(250, 204, 21, 0.2)', color: '#FACC15' };
      case 'EN_CURSO':
        return { ...base, backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
      case 'FINALIZADO':
        return { ...base, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'CANCELADO':
        return { ...base, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      default:
        return base;
    }
  };

  const isEditable = userRole === 'ADMIN' || userRole === 'SISADMIN';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      padding: '2rem',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Header Sección */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarIcon size={32} color="#FACC15" />
            Programación de Turnos
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Planificación y asignación de turnos del personal de seguridad por residencial activo.
          </p>
        </div>
        {isEditable && (
          <button
            onClick={() => handleOpenAddModal(formatDateString(new Date()))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#FACC15',
              color: '#0f172a',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(250, 204, 21, 0.3)'
            }}
          >
            <Plus size={18} />
            Programar Turno
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Controles del Mes */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '1rem 1.5rem',
        borderRadius: '12px'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, textTransform: 'capitalize' }}>
          {monthsSpanish[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={prevMonth}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            Hoy
          </button>
          <button 
            onClick={nextMonth}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Vista de Carga */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
          color: '#94a3b8'
        }}>
          <Clock size={36} className="animate-spin" style={{ marginRight: '1rem' }} />
          <span>Cargando turnos programados del residencial...</span>
        </div>
      ) : (
        /* Calendario Grid */
        <div style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
        }}>
          {/* Cabecera Días de la Semana */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'rgba(15, 23, 42, 0.5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
            padding: '0.75rem 0'
          }}>
            {daysOfWeek.map((day, idx) => (
              <div key={idx} style={{
                fontWeight: 700,
                color: day === 'Dom' || day === 'Sáb' ? '#facc15' : '#94a3b8',
                fontSize: '0.9rem'
              }}>{day}</div>
            ))}
          </div>

          {/* Celdas del Calendario */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: 'minmax(120px, 1fr)',
            gap: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            {getDaysInMonth().map((dayObj, idx) => {
              const dayTurnos = turnos.filter(t => t.fecha === dayObj.dateString && t.estado !== 'CANCELADO');
              const isToday = formatDateString(new Date()) === dayObj.dateString;
              
              return (
                <div 
                  key={idx}
                  onClick={() => handleOpenAddModal(dayObj.dateString)}
                  style={{
                    backgroundColor: dayObj.isCurrentMonth ? '#1e293b' : '#0f172a',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    cursor: isEditable ? 'pointer' : 'default',
                    position: 'relative',
                    transition: 'all 0.15s',
                    opacity: dayObj.isCurrentMonth ? 1 : 0.4
                  }}
                  onMouseEnter={(e) => {
                    if (isEditable) e.currentTarget.style.backgroundColor = 'rgba(250, 204, 21, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = dayObj.isCurrentMonth ? '#1e293b' : '#0f172a';
                  }}
                >
                  {/* Número de Día */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontWeight: isToday ? '800' : '500',
                      fontSize: '0.9rem',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isToday ? '#FACC15' : 'transparent',
                      color: isToday ? '#0f172a' : '#fff'
                    }}>
                      {dayObj.date.getDate()}
                    </span>
                    {dayTurnos.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {dayTurnos.length} turno{dayTurnos.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Listado de Turnos del Día */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    overflowY: 'auto',
                    flex: 1,
                    maxHeight: '110px'
                  }}>
                    {dayTurnos.map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => handleOpenEditModal(e, t)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderLeft: '3px solid #FACC15',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                      >
                        <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.guardia_email ? t.guardia_email.split('@')[0] : `Guardia ID: ${t.guardia_id}`}
                        </div>
                        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Clock size={10} />
                          {t.hora_inicio} - {t.hora_fin}
                        </div>
                        {t.ubicacion && (
                          <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <MapPin size={10} />
                            {t.ubicacion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL AGREGAR TURNO ================= */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus color="#FACC15" />
                Programar Nuevo Turno
              </h3>
              <button onClick={() => setShowAddModal(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateTurno} style={formStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input 
                    type="date" 
                    required 
                    value={fecha} 
                    onChange={(e) => setFecha(e.target.value)} 
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Guardia de Seguridad</label>
                  <select 
                    required 
                    value={guardiaId} 
                    onChange={(e) => setGuardiaId(Number(e.target.value))} 
                    style={inputStyle}
                  >
                    <option value="">Seleccione Guardia...</option>
                    {guardias.map(g => (
                      <option key={g.id} value={g.id}>{g.email} ({g.rol})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Hora Entrada</label>
                  <input 
                    type="time" 
                    required 
                    value={horaInicio} 
                    onChange={(e) => setHoraInicio(e.target.value)} 
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Hora Salida</label>
                  <input 
                    type="time" 
                    required 
                    value={horaFin} 
                    onChange={(e) => setHoraFin(e.target.value)} 
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Ubicación / Sector / Puesto</label>
                <input 
                  type="text" 
                  placeholder="Ej. Puerta Principal, Sector Norte, Garita 1" 
                  value={ubicacion} 
                  onChange={(e) => setUbicacion(e.target.value)} 
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Instrucciones / Detalles</label>
                <textarea 
                  rows={3} 
                  placeholder="Detalles sobre las tareas a realizar durante el turno..." 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)} 
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Estado Inicial</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} style={inputStyle}>
                  <option value="PROGRAMADO">PROGRAMADO</option>
                  <option value="EN_CURSO">EN CURSO</option>
                  <option value="FINALIZADO">FINALIZADO</option>
                </select>
              </div>

              <div style={modalFooterStyle}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  style={cancelBtnStyle}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  style={submitBtnStyle}
                >
                  {actionLoading ? 'Programando...' : 'Programar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDITAR TURNO ================= */}
      {showEditModal && selectedTurno && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit color="#FACC15" />
                Editar Turno Programado
              </h3>
              <button onClick={() => setShowEditModal(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdateTurno} style={formStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input 
                    type="date" 
                    required 
                    value={fecha} 
                    onChange={(e) => setFecha(e.target.value)} 
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Guardia de Seguridad</label>
                  <select 
                    required 
                    value={guardiaId} 
                    onChange={(e) => setGuardiaId(Number(e.target.value))} 
                    style={inputStyle}
                  >
                    <option value="">Seleccione Guardia...</option>
                    {guardias.map(g => (
                      <option key={g.id} value={g.id}>{g.email} ({g.rol})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Hora Entrada</label>
                  <input 
                    type="time" 
                    required 
                    value={horaInicio} 
                    onChange={(e) => setHoraInicio(e.target.value)} 
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Hora Salida</label>
                  <input 
                    type="time" 
                    required 
                    value={horaFin} 
                    onChange={(e) => setHoraFin(e.target.value)} 
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Ubicación / Sector / Puesto</label>
                <input 
                  type="text" 
                  value={ubicacion} 
                  onChange={(e) => setUbicacion(e.target.value)} 
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Instrucciones / Detalles</label>
                <textarea 
                  rows={3} 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)} 
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} style={inputStyle}>
                    <option value="PROGRAMADO">PROGRAMADO</option>
                    <option value="EN_CURSO">EN CURSO</option>
                    <option value="FINALIZADO">FINALIZADO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => selectedTurno.id && handleDeleteTurno(selectedTurno.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={18} />
                    Cancelar Turno
                  </button>
                </div>
              </div>

              <div style={modalFooterStyle}>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  style={cancelBtnStyle}
                >
                  Cerrar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  style={submitBtnStyle}
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DETALLE TURNO (VISTA LECTURA) ================= */}
      {showDetailModal && selectedTurno && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '500px' }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info color="#FACC15" />
                Detalle del Turno
              </h3>
              <button onClick={() => setShowDetailModal(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={getEstadoBadgeStyle(selectedTurno.estado)}>
                  {selectedTurno.estado}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                  {selectedTurno.fecha}
                </span>
              </div>

              <div style={detailItemStyle}>
                <User size={18} color="#FACC15" />
                <div>
                  <div style={detailLabelStyle}>Guardia asignado</div>
                  <div style={detailValueStyle}>{selectedTurno.guardia_email || `ID: ${selectedTurno.guardia_id}`}</div>
                </div>
              </div>

              <div style={detailItemStyle}>
                <Clock size={18} color="#FACC15" />
                <div>
                  <div style={detailLabelStyle}>Horario</div>
                  <div style={detailValueStyle}>{selectedTurno.hora_inicio} - {selectedTurno.hora_fin}</div>
                </div>
              </div>

              {selectedTurno.ubicacion && (
                <div style={detailItemStyle}>
                  <MapPin size={18} color="#FACC15" />
                  <div>
                    <div style={detailLabelStyle}>Puesto / Ubicación</div>
                    <div style={detailValueStyle}>{selectedTurno.ubicacion}</div>
                  </div>
                </div>
              )}

              {selectedTurno.descripcion && (
                <div style={detailItemStyle}>
                  <FileText size={18} color="#FACC15" />
                  <div>
                    <div style={detailLabelStyle}>Detalles / Instrucciones</div>
                    <div style={{ ...detailValueStyle, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {selectedTurno.descripcion}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...modalFooterStyle, borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
              <button 
                onClick={() => setShowDetailModal(false)} 
                style={{ ...cancelBtnStyle, width: '100%' }}
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

// Estilos Modales & Formularios
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '600px',
  padding: '1.5rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
  color: '#fff'
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  paddingBottom: '1rem',
  marginBottom: '1rem'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#94a3b8',
  marginBottom: '0.4rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none'
};

const modalFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '0.5rem'
};

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: '#fff',
  padding: '0.75rem 1.25rem',
  borderRadius: '8px',
  fontWeight: '600',
  border: 'none',
  cursor: 'pointer'
};

const submitBtnStyle: React.CSSProperties = {
  backgroundColor: '#FACC15',
  color: '#0f172a',
  padding: '0.75rem 1.25rem',
  borderRadius: '8px',
  fontWeight: '700',
  border: 'none',
  cursor: 'pointer'
};

const detailItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.03)'
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#94a3b8',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const detailValueStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 500,
  marginTop: '2px'
};

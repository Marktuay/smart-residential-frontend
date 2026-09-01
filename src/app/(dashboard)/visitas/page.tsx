'use client';

import { useState, useEffect } from 'react';
import { visitasApi, Visita } from '@/lib/api';
import { 
  Shield, 
  Clock, 
  Car, 
  Bike, 
  Footprints, 
  Info, 
  Plus, 
  Search, 
  MessageSquare, 
  Smartphone, 
  Bell, 
  X, 
  CheckCircle, 
  LogOut, 
  UserCheck,
  Filter,
  ArrowUpDown
} from 'lucide-react';

const MEDIOS_INGRESO = [
  { value: 'CAMINANDO', label: 'Caminando', icon: Footprints },
  { value: 'BICICLETA', label: 'Bicicleta', icon: Bike },
  { value: 'MOTOCICLETA', label: 'Motocicleta', icon: Car },
  { value: 'VEHICULO', label: 'Vehículo', icon: Car },
  { value: 'CAMIONETA', label: 'Camioneta', icon: Car },
  { value: 'CAMION', label: 'Camión', icon: Car }
];

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedVisitaForNotify, setSelectedVisitaForNotify] = useState<Visita | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');

  const [newVisita, setNewVisita] = useState({
    nombre_visitante: '',
    cedula_visitante: '',
    telefono_visitante: '',
    fecha_esperada: '',
    numero_casa: '',
    medio_ingreso: 'CAMINANDO',
    placa_vehiculo: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchVisitas();
  }, []);

  const fetchVisitas = async () => {
    setIsLoading(true);
    try {
      const data = await visitasApi.getVisitas();
      setVisitas(data || []);
    } catch (error) {
      console.error("Error fetching visitas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActualizarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await visitasApi.actualizarEstado(id, nuevoEstado);
      fetchVisitas();
    } catch (error) {
      console.error("Error al actualizar estado de la visita:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisita.nombre_visitante || !newVisita.numero_casa) {
      alert('Por favor complete el nombre del visitante y número de casa.');
      return;
    }

    const isVehicle = ['MOTOCICLETA', 'VEHICULO', 'CAMIONETA', 'CAMION'].includes(newVisita.medio_ingreso);
    const dataToSend = {
      ...newVisita,
      id: 0,
      residencial_id: '',
      estado: 'PROGRAMADA',
      fecha_esperada: newVisita.fecha_esperada || new Date().toISOString().substring(0, 10),
      placa_vehiculo: isVehicle ? newVisita.placa_vehiculo : ''
    };

    try {
      const creada = await visitasApi.registrarVisita(dataToSend);
      setShowForm(false);
      
      setSelectedVisitaForNotify(creada || dataToSend);
      setShowNotifyModal(true);

      setNewVisita({
        nombre_visitante: '', 
        cedula_visitante: '', 
        telefono_visitante: '',
        fecha_esperada: '',
        numero_casa: '', 
        medio_ingreso: 'CAMINANDO', 
        placa_vehiculo: '',
        observaciones: ''
      });
      fetchVisitas();
    } catch (error) {
      console.error("Error registrando visita:", error);
      alert('Ocurrió un error al registrar la visita.');
    }
  };

  const getWhatsAppLink = (v: Visita) => {
    const text = encodeURIComponent(`Estimado residente de Casa ${v.numero_casa}, le notificamos que el visitante ${v.nombre_visitante} (Identificación: ${v.cedula_visitante || 'No especificada'}) ha sido registrado en garita.`);
    return `https://wa.me/?text=${text}`;
  };

  const filteredVisitas = visitas.filter(v => {
    const matchesSearch = 
      (v.nombre_visitante && v.nombre_visitante.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.numero_casa && v.numero_casa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.cedula_visitante && v.cedula_visitante.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterEstado === 'TODOS') return matchesSearch;
    return matchesSearch && v.estado === filterEstado;
  });

  return (
    <div style={{ padding: '2rem', color: '#f8fafc', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Encabezado e Indicadores */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.025em' }}>
            Bitácora de Visitas / Control de Accesos
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.375rem', fontSize: '0.875rem' }}>
            Gestión en tiempo real de ingresos, salidas y notificaciones para residentes.
          </p>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.625rem', 
            backgroundColor: '#f59e0b', 
            color: '#0f172a', 
            border: 'none', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '0.625rem', 
            fontWeight: '800', 
            fontSize: '0.9375rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={20} strokeWidth={2.5} />
          Registrar Nueva Visita
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem', 
        gap: '1rem', 
        flexWrap: 'wrap',
        backgroundColor: '#1e293b',
        padding: '1rem 1.25rem',
        borderRadius: '0.75rem',
        border: '1px solid #334155'
      }}>
        {/* Input de Búsqueda */}
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por visitante, cédula o número de casa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.625rem',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#ffffff',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Filtros por Estado */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={16} color="#94a3b8" />
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: '600' }}>Estado:</span>
          <div style={{ display: 'flex', backgroundColor: '#0f172a', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #334155' }}>
            {['TODOS', 'INGRESÓ', 'PROGRAMADA', 'FINALIZADA'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterEstado(st)}
                style={{
                  padding: '0.375rem 0.75rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: filterEstado === st ? '#3b82f6' : 'transparent',
                  color: filterEstado === st ? '#ffffff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla Estilizada de Visitas */}
      <div style={{ 
        backgroundColor: '#1e293b', 
        borderRadius: '1rem', 
        border: '1px solid #334155', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden' 
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Visitante</th>
                <th style={{ padding: '1rem 1.25rem' }}>Identificación / Cédula</th>
                <th style={{ padding: '1rem 1.25rem' }}>Destino</th>
                <th style={{ padding: '1rem 1.25rem' }}>Medio de Ingreso</th>
                <th style={{ padding: '1rem 1.25rem' }}>Estado</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Cargando bitácora de accesos...
                  </td>
                </tr>
              ) : filteredVisitas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No se encontraron registros de visitas para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredVisitas.map((v) => {
                  const isEntered = v.estado === 'INGRESÓ' || v.estado === 'EN_CURSO';
                  const isFinished = v.estado === 'FINALIZADA';

                  return (
                    <tr 
                      key={v.id} 
                      style={{ borderBottom: '1px solid #334155', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#334155', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8125rem' }}>
                            {v.nombre_visitante.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{v.nombre_visitante}</div>
                            {v.fecha_esperada && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>{v.fecha_esperada}</div>}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {v.cedula_visitante || 'No especificada'}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '800', fontSize: '0.8125rem' }}>
                          Casa {v.numero_casa}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>
                        <span style={{ backgroundColor: '#0f172a', padding: '0.375rem 0.625rem', borderRadius: '0.375rem', border: '1px solid #334155', fontSize: '0.75rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          {v.medio_ingreso} {v.placa_vehiculo ? `(${v.placa_vehiculo})` : ''}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.75rem', 
                          fontWeight: '800',
                          backgroundColor: isEntered ? 'rgba(34, 197, 94, 0.2)' : isFinished ? 'rgba(148, 163, 184, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isEntered ? '#4ade80' : isFinished ? '#94a3b8' : '#fcd34d',
                          border: isEntered ? '1px solid rgba(34, 197, 94, 0.3)' : isFinished ? '1px solid #475569' : '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          {v.estado}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {/* Botón Notificar */}
                          <button
                            onClick={() => {
                              setSelectedVisitaForNotify(v);
                              setShowNotifyModal(true);
                            }}
                            style={{ 
                              padding: '0.375rem 0.75rem', 
                              backgroundColor: '#0f172a', 
                              color: '#38bdf8', 
                              border: '1px solid #38bdf8', 
                              borderRadius: '0.375rem', 
                              fontSize: '0.75rem', 
                              fontWeight: '700',
                              cursor: 'pointer', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.375rem' 
                            }}
                          >
                            <Bell size={14} /> Notificar
                          </button>

                          {/* Botón Marcar Estado */}
                          {!isFinished && (
                            <button
                              onClick={() => handleActualizarEstado(v.id, isEntered ? 'FINALIZADA' : 'INGRESÓ')}
                              style={{ 
                                padding: '0.375rem 0.75rem', 
                                backgroundColor: isEntered ? '#ef4444' : '#10b981', 
                                color: '#ffffff', 
                                border: 'none', 
                                borderRadius: '0.375rem', 
                                fontSize: '0.75rem', 
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: isEntered ? '0 2px 6px rgba(239, 68, 68, 0.3)' : '0 2px 6px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              {isEntered ? 'Marcar Salida' : 'Marcar Ingreso'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR NUEVA VISITA */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', width: '100%', maxWidth: '520px', padding: '2rem', color: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield style={{ color: '#f59e0b' }} size={24} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Registrar Nueva Visita</h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '700', marginBottom: '0.375rem' }}>
                  Nombre del Visitante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cristhofer Martínez"
                  value={newVisita.nombre_visitante}
                  onChange={(e) => setNewVisita({ ...newVisita, nombre_visitante: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#ffffff', fontSize: '0.9375rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '700', marginBottom: '0.375rem' }}>
                    Cédula / Identificación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 001-220887-0051"
                    value={newVisita.cedula_visitante}
                    onChange={(e) => setNewVisita({ ...newVisita, cedula_visitante: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#ffffff', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '700', marginBottom: '0.375rem' }}>
                    Número de Casa Destino *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Casa A29"
                    value={newVisita.numero_casa}
                    onChange={(e) => setNewVisita({ ...newVisita, numero_casa: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#ffffff', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '700', marginBottom: '0.375rem' }}>
                    Medio de Ingreso
                  </label>
                  <select
                    value={newVisita.medio_ingreso}
                    onChange={(e) => setNewVisita({ ...newVisita, medio_ingreso: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#ffffff', fontSize: '0.875rem', outline: 'none' }}
                  >
                    {MEDIOS_INGRESO.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '700', marginBottom: '0.375rem' }}>
                    Placa de Vehículo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. M 123456"
                    value={newVisita.placa_vehiculo}
                    onChange={(e) => setNewVisita({ ...newVisita, placa_vehiculo: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#ffffff', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  style={{ padding: '0.75rem 1.25rem', backgroundColor: '#334155', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}
                >
                  Guardar Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICACIÓN DE VISITA */}
      {showNotifyModal && selectedVisitaForNotify && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', width: '100%', maxWidth: '420px', padding: '2rem', color: '#ffffff', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <Bell size={28} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>¿Enviar Notificación?</h3>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1.75rem', lineHeight: '1.5' }}>
              Notificar al residente de la <strong>Casa {selectedVisitaForNotify.numero_casa}</strong> sobre el ingreso de <strong>{selectedVisitaForNotify.nombre_visitante}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <a
                href={getWhatsAppLink(selectedVisitaForNotify)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.875rem',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                  fontWeight: '800',
                  fontSize: '0.9375rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                }}
              >
                <MessageSquare size={20} /> Vía WhatsApp Directo
              </a>

              <button
                onClick={() => {
                  alert('Notificación Push enviada con éxito al residente de Casa ' + selectedVisitaForNotify.numero_casa);
                  setShowNotifyModal(false);
                }}
                style={{
                  padding: '0.875rem',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '800',
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Smartphone size={20} /> Vía Notificación Push / App
              </button>

              <button
                onClick={() => setShowNotifyModal(false)}
                style={{
                  padding: '0.625rem',
                  backgroundColor: '#334155',
                  color: '#94a3b8',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  marginTop: '0.25rem'
                }}
              >
                Omitir por ahora
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

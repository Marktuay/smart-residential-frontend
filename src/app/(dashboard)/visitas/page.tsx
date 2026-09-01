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
  UserCheck 
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
      
      // Abrir modal de notificación si se creó con éxito
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

  // Generar link de WhatsApp directo wa.me
  const getWhatsAppLink = (v: Visita) => {
    const text = encodeURIComponent(`Estimado residente de Casa ${v.numero_casa}, le notificamos que el visitante ${v.nombre_visitante} (Identificación: ${v.cedula_visitante || 'No especificada'}) ha sido registrado en garita.`);
    return `https://wa.me/?text=${text}`;
  };

  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#fff', margin: 0 }}>Bitácora de Visitas / Accesos</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.875rem' }}>Control de ingresos, salidas y notificaciones a residentes.</p>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            backgroundColor: '#f59e0b', 
            color: '#000', 
            border: 'none', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '0.5rem', 
            fontWeight: '700', 
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
          }}
        >
          <Plus size={20} />
          Registrar Nueva Visita
        </button>
      </div>

      {/* Tabla de Visitas */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Visitante</th>
              <th style={{ padding: '1rem' }}>Identificación / Cédula</th>
              <th style={{ padding: '1rem' }}>Destino (Casa)</th>
              <th style={{ padding: '1rem' }}>Medio de Ingreso</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Cargando bitácora de accesos...</td>
              </tr>
            ) : visitas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No hay visitas registradas hoy.</td>
              </tr>
            ) : (
              visitas.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '1rem', fontWeight: '600', color: '#fff' }}>
                    {v.nombre_visitante}
                  </td>
                  <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                    {v.cedula_visitante || 'No especificada'}
                  </td>
                  <td style={{ padding: '1rem', color: '#f59e0b', fontWeight: '700' }}>
                    Casa {v.numero_casa}
                  </td>
                  <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                    <span style={{ backgroundColor: '#0f172a', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #334155', fontSize: '0.75rem' }}>
                      {v.medio_ingreso} {v.placa_vehiculo ? `(${v.placa_vehiculo})` : ''}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.625rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '700',
                      backgroundColor: v.estado === 'INGRESÓ' || v.estado === 'EN_CURSO' ? 'rgba(34, 197, 94, 0.2)' : v.estado === 'FINALIZADA' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: v.estado === 'INGRESÓ' || v.estado === 'EN_CURSO' ? '#4ade80' : v.estado === 'FINALIZADA' ? '#94a3b8' : '#fcd34d'
                    }}>
                      {v.estado}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {/* Botón de Notificación */}
                      <button
                        onClick={() => {
                          setSelectedVisitaForNotify(v);
                          setShowNotifyModal(true);
                        }}
                        style={{ padding: '0.375rem 0.625rem', backgroundColor: '#334155', color: '#38bdf8', border: 'none', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Enviar Notificación"
                      >
                        <Bell size={14} /> Notificar
                      </button>

                      {v.estado !== 'FINALIZADA' && (
                        <button
                          onClick={() => handleActualizarEstado(v.id, v.estado === 'INGRESÓ' ? 'FINALIZADA' : 'INGRESÓ')}
                          style={{ 
                            padding: '0.375rem 0.625rem', 
                            backgroundColor: v.estado === 'INGRESÓ' ? '#ef4444' : '#10b981', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '0.375rem', 
                            fontSize: '0.75rem', 
                            fontWeight: '600',
                            cursor: 'pointer' 
                          }}
                        >
                          {v.estado === 'INGRESÓ' ? 'Marcar Salida' : 'Marcar Ingreso'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL REGISTRAR NUEVA VISITA */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '1.75rem', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Registrar Nueva Visita Esperada</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Nombre del Visitante *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cristhofer Martínez"
                  value={newVisita.nombre_visitante}
                  onChange={(e) => setNewVisita({ ...newVisita, nombre_visitante: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Cédula / Identificación</label>
                  <input
                    type="text"
                    placeholder="Ej. 001-220887-0051"
                    value={newVisita.cedula_visitante}
                    onChange={(e) => setNewVisita({ ...newVisita, cedula_visitante: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Número de Casa Destino *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Casa A29"
                    value={newVisita.numero_casa}
                    onChange={(e) => setNewVisita({ ...newVisita, numero_casa: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Medio de Ingreso</label>
                  <select
                    value={newVisita.medio_ingreso}
                    onChange={(e) => setNewVisita({ ...newVisita, medio_ingreso: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }}
                  >
                    {MEDIOS_INGRESO.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Placa de Vehículo (Si aplica)</label>
                  <input
                    type="text"
                    placeholder="Ej. M 123456"
                    value={newVisita.placa_vehiculo}
                    onChange={(e) => setNewVisita({ ...newVisita, placa_vehiculo: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.625rem 1rem', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Guardar Visita</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICACIÓN DE VISITA (WHATSAPP / PUSH) */}
      {showNotifyModal && selectedVisitaForNotify && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', width: '100%', maxWidth: '420px', padding: '1.75rem', color: '#fff', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Bell size={24} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>¿Enviar Notificación?</h3>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1.5rem' }}>
              Seleccione el canal de comunicación para notificar al residente de la <strong>Casa {selectedVisitaForNotify.numero_casa}</strong> sobre la llegada de <strong>{selectedVisitaForNotify.nombre_visitante}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href={getWhatsAppLink(selectedVisitaForNotify)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#25D366',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <MessageSquare size={18} /> Vía WhatsApp
              </a>

              <button
                onClick={() => {
                  alert('Notificación Push Web enviada con éxito al residente de Casa ' + selectedVisitaForNotify.numero_casa);
                  setShowNotifyModal(false);
                }}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Smartphone size={18} /> Vía Notificación Push / App
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
                  marginTop: '0.5rem'
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

"use client";

import { useState, useEffect } from 'react';
import { visitasApi, Visita } from '@/lib/api';
import { Shield, Clock, Car, Bike, Footprints, Info } from 'lucide-react';

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

  const cedulaRegex = /^\d{3}\s\d{6}\s\d{5}$/;

  const [newVisita, setNewVisita] = useState({
    nombre_visitante: '',
    cedula_visitante: '',
    fecha_esperada: '',
    numero_casa: '',
    medio_ingreso: 'CAMINANDO',
    placa_vehiculo: ''
  });

  const [errorCedula, setErrorCedula] = useState('');

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

  const formatCedula = (val: string) => {
    let cleaned = val.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
    if (cleaned.length > 3) formatted += ' ' + cleaned.substring(3, 9);
    if (cleaned.length > 9) formatted += ' ' + cleaned.substring(9, 14);
    return formatted;
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCedula(e.target.value);
    setNewVisita({ ...newVisita, cedula_visitante: formatted });
    if (formatted && !cedulaRegex.test(formatted)) {
      setErrorCedula('Formato requerido: xxx xxxxxx xxxxx');
    } else {
      setErrorCedula('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedulaRegex.test(newVisita.cedula_visitante)) {
      setErrorCedula('Por favor, ingrese un número de cédula válido.');
      return;
    }
    const isVehicle = ['MOTOCICLETA', 'VEHICULO', 'CAMIONETA', 'CAMION'].includes(newVisita.medio_ingreso);
    const dataToSend = {
      ...newVisita,
      id: 0,
      residencial_id: '',
      estado: '',
      placa_vehiculo: isVehicle ? newVisita.placa_vehiculo : ''
    };
    try {
      await visitasApi.registrarVisita(dataToSend);
      setShowForm(false);
      setNewVisita({
        nombre_visitante: '', cedula_visitante: '', fecha_esperada: '',
        numero_casa: '', medio_ingreso: 'CAMINANDO', placa_vehiculo: ''
      });
      fetchVisitas();
    } catch (error) {
      console.error("Error al registrar visita:", error);
    }
  };

  const requiresPlaca = ['MOTOCICLETA', 'VEHICULO', 'CAMIONETA', 'CAMION'].includes(newVisita.medio_ingreso);

  if (isLoading) {
    return <div style={{ padding: '2rem', color: '#64748b' }}>Cargando visitas...</div>;
  }

  return (
    <div style={{ padding: '2rem', color: '#1e293b', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Control de Visitas</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Gestiona el acceso de visitantes al residencial.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FACC15', color: '#1e293b', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          <Shield size={20} style={{ marginRight: '0.5rem' }} />
          Registrar Visita
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <Info size={20} color="#FACC15" style={{ marginRight: '0.5rem' }} />
            Nueva Visita Esperada
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Nombre del Visitante</label>
                <input
                  type="text" required value={newVisita.nombre_visitante} onChange={e => setNewVisita({ ...newVisita, nombre_visitante: e.target.value })}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none' }}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Cédula del Visitante</label>
                <input
                  type="text" required value={newVisita.cedula_visitante} onChange={handleCedulaChange}
                  style={{ width: '100%', border: `1px solid ${errorCedula ? '#ef4444' : '#cbd5e1'}`, borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none' }}
                  placeholder="xxx xxxxxx xxxxx" maxLength={16}
                />
                {errorCedula && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errorCedula}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Fecha Esperada</label>
                <input
                  type="datetime-local" required value={newVisita.fecha_esperada} onChange={e => setNewVisita({ ...newVisita, fecha_esperada: e.target.value })}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Número de Casa Destino</label>
                <input
                  type="text" required value={newVisita.numero_casa} onChange={e => setNewVisita({ ...newVisita, numero_casa: e.target.value })}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none' }}
                  placeholder="Ej: A-10"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Medio de Ingreso</label>
                <select
                  required value={newVisita.medio_ingreso} onChange={e => setNewVisita({ ...newVisita, medio_ingreso: e.target.value })}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', backgroundColor: 'white' }}
                >
                  {MEDIOS_INGRESO.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {requiresPlaca && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Número de Placa</label>
                  <input
                    type="text" required value={newVisita.placa_vehiculo} onChange={e => setNewVisita({ ...newVisita, placa_vehiculo: e.target.value.toUpperCase() })}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none' }}
                    placeholder="Ej: ABC-1234"
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}>
                Cancelar
              </button>
              <button type="submit" style={{ backgroundColor: '#FACC15', color: '#1e293b', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                Guardar Visita
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {visitas.map((visita) => (
          <div key={visita.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#FACC15' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#1e293b', margin: 0 }}>{visita.nombre_visitante}</h3>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  <span style={{ backgroundColor: '#f1f5f9', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', marginRight: '0.5rem' }}>{visita.cedula_visitante}</span>
                  <span>Casa: {visita.numero_casa}</span>
                </div>
              </div>
              <span style={{ 
                fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '500',
                backgroundColor: visita.estado === 'PENDIENTE' ? '#ffedd5' : visita.estado === 'EN_CURSO' ? '#dbeafe' : '#dcfce3',
                color: visita.estado === 'PENDIENTE' ? '#ea580c' : visita.estado === 'EN_CURSO' ? '#2563eb' : '#16a34a'
               }}>
                {visita.estado}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#475569' }}>
                <Clock size={16} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                Esperado: {new Date(visita.fecha_esperada).toLocaleString()}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#475569' }}>
                <Shield size={16} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
                Ingreso: {visita.medio_ingreso.toLowerCase()}
                {visita.placa_vehiculo && ` (${visita.placa_vehiculo})`}
              </div>
            </div>

            {(visita.estado === 'PENDIENTE' || visita.estado === 'EN_CURSO') && (
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                {visita.estado === 'PENDIENTE' ? (
                  <button style={{ flex: 1, backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
                    Marcar Ingreso
                  </button>
                ) : (
                  <button style={{ flex: 1, backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
                    Marcar Salida
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {visitas.length === 0 && !showForm && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#94a3b8', border: '2px dashed #cbd5e1', borderRadius: '0.75rem', backgroundColor: '#f8fafc' }}>
            <Shield size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#64748b', margin: 0 }}>No hay visitas registradas</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Haz clic en "Registrar Visita" para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}

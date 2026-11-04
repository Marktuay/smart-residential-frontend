'use client';

import React, { useState, useEffect } from 'react';
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
  Building,
  RefreshCw,
  Home,
  ShieldCheck,
  ShieldAlert,
  Send,
  LogIn
} from 'lucide-react';
import { 
  visitasApi, 
  residencialApi, 
  Visita, 
  Casa, 
  ResidencialInfo 
} from '@/lib/api';

const MEDIOS_INGRESO = [
  { value: 'VEHICULO', label: 'Vehículo Particular', icon: Car },
  { value: 'PEATONAL', label: 'Peatonal / Caminando', icon: Footprints },
  { value: 'MOTOCICLETA', label: 'Motocicleta', icon: Bike },
  { value: 'DELIVERY', label: 'Delivery / Encomienda', icon: Car },
  { value: 'PROVEEDOR', label: 'Proveedor / Mantenimiento', icon: Car },
  { value: 'TAXI', label: 'Taxi / Transporte', icon: Car }
];

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // SISADMIN Multi-tenant
  const [userRole, setUserRole] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');

  // Modales
  const [showForm, setShowForm] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedVisitaForNotify, setSelectedVisitaForNotify] = useState<Visita | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');

  // Formulario Nueva Visita
  const [newVisita, setNewVisita] = useState({
    nombre_visitante: '',
    cedula_visitante: '',
    telefono_visitante: '',
    fecha_esperada: new Date().toISOString().substring(0, 10),
    numero_casa: '',
    casa_id: '',
    medio_ingreso: 'VEHICULO',
    placa_vehiculo: '',
    observaciones: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    const resId = localStorage.getItem('residencial_id') || '';
    setUserRole(role);
    setSelectedResidencialId(resId);

    if (role === 'SISADMIN') {
      residencialApi.getResidenciales().then(list => setResidenciales(list || [])).catch(() => {});
    }

    fetchData(resId);
  }, []);

  const fetchData = async (resId?: string) => {
    const activeResId = resId !== undefined ? resId : (localStorage.getItem('residencial_id') || '');
    if (!activeResId) {
      setVisitas([]);
      setCasas([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [visitasData, casasData] = await Promise.all([
        visitasApi.getVisitas().catch(() => []),
        residencialApi.getCasas().catch(() => [])
      ]);
      setVisitas(visitasData || []);
      setCasas(casasData || []);
    } catch (error) {
      console.error("Error fetching visitas:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(selectedResidencialId);
  };

  const handleResidencialChange = (newResId: string) => {
    setSelectedResidencialId(newResId);
    localStorage.setItem('residencial_id', newResId);
    fetchData(newResId);
  };

  const handleActualizarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await visitasApi.actualizarEstado(id, nuevoEstado);
      setSuccessMsg(`Visita #${id} actualizada a: ${nuevoEstado}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData(selectedResidencialId);
    } catch (error) {
      console.error("Error al actualizar estado de la visita:", error);
      alert('Error actualizando el estado de la visita.');
    }
  };

  const handleSelectCasa = (casaIdStr: string) => {
    const c = casas.find(item => item.id?.toString() === casaIdStr);
    if (c) {
      setNewVisita(prev => ({
        ...prev,
        casa_id: casaIdStr,
        numero_casa: c.numero_casa
      }));
    } else {
      setNewVisita(prev => ({ ...prev, casa_id: '', numero_casa: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisita.nombre_visitante.trim() || !newVisita.numero_casa.trim()) {
      alert('Por favor ingrese el nombre del visitante y seleccione la casa de destino.');
      return;
    }

    const isVehicle = ['VEHICULO', 'MOTOCICLETA', 'DELIVERY', 'PROVEEDOR', 'TAXI'].includes(newVisita.medio_ingreso);
    const dataToSend = {
      id: 0,
      residencial_id: '',
      nombre_visitante: newVisita.nombre_visitante.trim(),
      cedula_visitante: newVisita.cedula_visitante.trim() || 'VERIFICADO_EN_GARITA',
      numero_casa: newVisita.numero_casa.trim(),
      medio_ingreso: newVisita.medio_ingreso,
      placa_vehiculo: isVehicle ? newVisita.placa_vehiculo.trim().toUpperCase() : '',
      fecha_esperada: newVisita.fecha_esperada || new Date().toISOString().substring(0, 10),
      estado: 'EN_CURSO' // Check-in inmediato al registrar desde control de accesos
    };

    try {
      const creada = await visitasApi.registrarVisita(dataToSend);
      setShowForm(false);
      setSuccessMsg(`Visitante "${dataToSend.nombre_visitante}" registrado exitosamente.`);
      setTimeout(() => setSuccessMsg(''), 4000);

      setSelectedVisitaForNotify(creada || dataToSend);
      setShowNotifyModal(true);

      setNewVisita({
        nombre_visitante: '', 
        cedula_visitante: '', 
        telefono_visitante: '',
        fecha_esperada: new Date().toISOString().substring(0, 10),
        numero_casa: '', 
        casa_id: '',
        medio_ingreso: 'VEHICULO', 
        placa_vehiculo: '',
        observaciones: ''
      });
      fetchData(selectedResidencialId);
    } catch (error) {
      console.error("Error registrando visita:", error);
      alert('Ocurrió un error al registrar la visita.');
    }
  };

  const getWhatsAppLink = (v: Visita, phone?: string) => {
    const text = encodeURIComponent(`Estimado residente de Casa ${v.numero_casa}, New Century Security le notifica que su visitante el Sr(a). ${v.nombre_visitante} (Identificación: ${v.cedula_visitante || 'Verificada'}) ha ingresado por la garita principal.`);
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    return cleanPhone ? `https://wa.me/${cleanPhone.length === 8 ? '505' + cleanPhone : cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  // Filtrado de visitas
  const filteredVisitas = visitas.filter(v => {
    const matchesSearch = 
      (v.nombre_visitante && v.nombre_visitante.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.numero_casa && v.numero_casa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.cedula_visitante && v.cedula_visitante.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.placa_vehiculo && v.placa_vehiculo.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterEstado === 'TODOS') return true;
    if (filterEstado === 'EN_CURSO') return v.estado === 'EN_CURSO' || v.estado === 'INGRESÓ';
    if (filterEstado === 'PENDIENTE') return v.estado === 'PENDIENTE' || v.estado === 'PROGRAMADA';
    if (filterEstado === 'FINALIZADA') return v.estado === 'FINALIZADA';
    return v.estado === filterEstado;
  });

  // Métricas
  const enPredioCount = visitas.filter(v => v.estado === 'EN_CURSO' || v.estado === 'INGRESÓ').length;
  const programadasCount = visitas.filter(v => v.estado === 'PENDIENTE' || v.estado === 'PROGRAMADA').length;
  const finalizadasCount = visitas.filter(v => v.estado === 'FINALIZADA').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
            <Car size={24} color="#FACC15" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Control de Accesos & Garita
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Registro de visitas, validación de contrato de seguridad residencial y notificaciones a propietarios.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
              fontWeight: '700',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Sincronizando...' : 'Actualizar'}
          </button>

          <button 
            onClick={() => setShowForm(true)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: '#FACC15', 
              color: '#0f172a', 
              border: 'none', 
              padding: '0.65rem 1.35rem', 
              borderRadius: '0.5rem', 
              fontWeight: '800', 
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(250, 204, 21, 0.25)'
            }}
          >
            <Plus size={18} />
            Registrar Visita
          </button>
        </div>
      </div>

      {/* Selector Multi-Tenant SISADMIN */}
      {userRole === 'SISADMIN' && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Building size={18} color="#FACC15" />
          <label style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>Residencial Activo:</label>
          <select
            value={selectedResidencialId}
            onChange={(e) => handleResidencialChange(e.target.value)}
            style={{ padding: '0.45rem 1rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '600' }}
          >
            {residenciales.map(r => (
              <option key={r.id} value={r.id}>{r.nombre} ({r.id})</option>
            ))}
          </select>
        </div>
      )}

      {/* Mensajes de feedback */}
      {successMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '0.625rem', border: '1px solid #22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogIn size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Dentro del Residencial</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#16a34a' }}>{enPredioCount}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(250, 204, 21, 0.15)', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Visitas Programadas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>{programadasCount}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Salidas Concluidas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>{finalizadasCount}</div>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '1rem', 
        flexWrap: 'wrap',
        backgroundColor: 'var(--bg-card)',
        padding: '1rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Input de Búsqueda */}
        <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Buscar por visitante, cédula, casa o placa de vehículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.5rem',
              backgroundColor: 'var(--bg-body)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Filtros por Estado */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Estado:</span>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', padding: '0.2rem', border: '1px solid var(--border-color)' }}>
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'EN_CURSO', label: 'Dentro (En Curso)' },
              { id: 'PENDIENTE', label: 'Esperadas' },
              { id: 'FINALIZADA', label: 'Finalizadas' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterEstado(st.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: filterEstado === st.id ? '#1e293b' : 'transparent',
                  color: filterEstado === st.id ? '#FACC15' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Visitas */}
      <div style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: '1rem', 
        border: '1px solid var(--border-color)', 
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden' 
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Visitante</th>
                <th style={{ padding: '1rem 1.25rem' }}>Identificación / Cédula</th>
                <th style={{ padding: '1rem 1.25rem' }}>Casa Destino</th>
                <th style={{ padding: '1rem 1.25rem' }}>Medio / Placa</th>
                <th style={{ padding: '1rem 1.25rem' }}>Estado</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Acciones Garita</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Cargando bitácora de accesos...
                  </td>
                </tr>
              ) : filteredVisitas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Car size={40} color="#ca8a04" style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
                    <h4 style={{ fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>No hay visitas registradas</h4>
                    <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      Registre un visitante mediante el botón superior o desde la terminal móvil de garita.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVisitas.map((v) => {
                  const isEntered = v.estado === 'INGRESÓ' || v.estado === 'EN_CURSO';
                  const isFinished = v.estado === 'FINALIZADA';
                  const casaVinculada = casas.find(c => c.numero_casa === v.numero_casa);

                  return (
                    <tr 
                      key={v.id} 
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s ease' }}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8125rem' }}>
                            {v.nombre_visitante.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{v.nombre_visitante}</div>
                            {v.fecha_esperada && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{v.fecha_esperada}</div>}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {v.cedula_visitante || 'Verificado en Garita'}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)', color: '#ca8a04', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #ca8a04', fontWeight: '800', fontSize: '0.8125rem' }}>
                            Casa {v.numero_casa}
                          </span>
                          {casaVinculada && (
                            <span 
                              title={casaVinculada.tiene_contrato_seguridad ? 'Contrato de Seguridad Activo' : 'Sin Contrato de Seguridad'}
                              style={{ color: casaVinculada.tiene_contrato_seguridad ? '#16a34a' : '#ef4444' }}
                            >
                              {casaVinculada.tiene_contrato_seguridad ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ backgroundColor: 'var(--bg-body)', padding: '0.3rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {v.medio_ingreso}
                          </span>
                          {v.placa_vehiculo && (
                            <span style={{ backgroundColor: '#1e293b', color: '#FACC15', padding: '0.3rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '800' }}>
                              {v.placa_vehiculo}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.65rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem', 
                          fontWeight: '800',
                          backgroundColor: isEntered ? '#dcfce7' : isFinished ? '#f1f5f9' : '#fef08a',
                          color: isEntered ? '#15803d' : isFinished ? '#64748b' : '#a16207'
                        }}>
                          {v.estado}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Notificar WhatsApp */}
                          <button
                            onClick={() => {
                              setSelectedVisitaForNotify(v);
                              setShowNotifyModal(true);
                            }}
                            title="Notificar al Residente"
                            style={{ 
                              padding: '0.35rem 0.65rem', 
                              backgroundColor: 'var(--bg-body)', 
                              color: '#2563eb', 
                              border: '1px solid #2563eb', 
                              borderRadius: '0.375rem', 
                              fontSize: '0.75rem', 
                              fontWeight: '700',
                              cursor: 'pointer', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.35rem' 
                            }}
                          >
                            <Bell size={13} /> Notificar
                          </button>

                          {/* 1-Toque Garita Check-in / Check-out */}
                          {!isEntered && !isFinished && (
                            <button
                              onClick={() => handleActualizarEstado(v.id, 'EN_CURSO')}
                              style={{ 
                                padding: '0.35rem 0.75rem', 
                                backgroundColor: '#22c55e', 
                                color: '#ffffff', 
                                border: 'none', 
                                borderRadius: '0.375rem', 
                                fontSize: '0.75rem', 
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <LogIn size={13} /> Entrada
                            </button>
                          )}

                          {isEntered && (
                            <button
                              onClick={() => handleActualizarEstado(v.id, 'FINALIZADA')}
                              style={{ 
                                padding: '0.35rem 0.75rem', 
                                backgroundColor: '#0f172a', 
                                color: '#FACC15', 
                                border: 'none', 
                                borderRadius: '0.375rem', 
                                fontSize: '0.75rem', 
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <LogOut size={13} /> Salida
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

      {/* MODAL REGISTRAR NUEVA VISITA CON INPUTS DINÁMICOS */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '540px', padding: '2rem', color: 'var(--text-primary)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car style={{ color: '#FACC15' }} size={24} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Registrar Visita en Garita</h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Nombre Completo del Visitante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cristhofer Martínez"
                  value={newVisita.nombre_visitante}
                  onChange={(e) => setNewVisita({ ...newVisita, nombre_visitante: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    Cédula / Identificación
                  </label>
                  <input
                    type="text"
                    placeholder="001-XXXXXX-XXXX"
                    value={newVisita.cedula_visitante}
                    onChange={(e) => setNewVisita({ ...newVisita, cedula_visitante: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    Casa de Destino *
                  </label>
                  <select
                    required
                    value={newVisita.casa_id}
                    onChange={(e) => handleSelectCasa(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '600' }}
                  >
                    <option value="">-- Seleccionar Casa --</option>
                    {casas.map(c => (
                      <option key={c.id} value={c.id}>
                        Casa {c.numero_casa} ({c.bloque}) - {c.tiene_contrato_seguridad ? '✓ Con Contrato' : 'Sin Contrato'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    Medio de Ingreso
                  </label>
                  <select
                    value={newVisita.medio_ingreso}
                    onChange={(e) => setNewVisita({ ...newVisita, medio_ingreso: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    {MEDIOS_INGRESO.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    Placa de Vehículo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. M-123456"
                    value={newVisita.placa_vehiculo}
                    onChange={(e) => setNewVisita({ ...newVisita, placa_vehiculo: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.625rem 1.5rem', backgroundColor: '#FACC15', color: '#0f172a', border: 'none', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(250, 204, 21, 0.25)' }}
                >
                  Autorizar Ingreso Garita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICACIÓN DE VISITA (WHATSAPP) */}
      {showNotifyModal && selectedVisitaForNotify && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '440px', padding: '2rem', color: 'var(--text-primary)', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Bell size={28} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>¿Notificar al Propietario?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Enviar aviso oficial al residente de <strong>Casa {selectedVisitaForNotify.numero_casa}</strong> sobre la llegada de <strong>{selectedVisitaForNotify.nombre_visitante}</strong>.
            </p>

            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Teléfono / WhatsApp del Residente (Opcional):
              </label>
              <input
                type="tel"
                placeholder="Ej. 88889999"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Cerrar
              </button>

              <a
                href={getWhatsAppLink(selectedVisitaForNotify, phoneInput)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowNotifyModal(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                  fontWeight: '800',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
                }}
              >
                <Send size={15} /> Enviar WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

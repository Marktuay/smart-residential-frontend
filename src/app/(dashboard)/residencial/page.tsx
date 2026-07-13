'use client';

import React, { useState, useEffect } from 'react';
import { Home, Users, Plus, Edit, Trash2, X, Building } from 'lucide-react';
import { residencialApi, Casa, Residente, ResidencialInfo } from '@/lib/api';

export default function ResidencialPage() {
  const [activeTab, setActiveTab] = useState<'instalaciones' | 'casas' | 'residentes'>('casas');
  const [userRole, setUserRole] = useState<string | null>(null);

  // States para Instalaciones (Residenciales)
  const [instalaciones, setInstalaciones] = useState<ResidencialInfo[]>([]);
  const [loadingInstalaciones, setLoadingInstalaciones] = useState(true);
  const [showInstalacionForm, setShowInstalacionForm] = useState(false);
  const [nuevaInstalacion, setNuevaInstalacion] = useState<Partial<ResidencialInfo>>({
    id: '', nombre: '', direccion: '', latitud_centro: 12.1364, longitud_centro: -86.2514, zoom_defecto: 13
  });
  
  // States para Casas
  const [casas, setCasas] = useState<Casa[]>([]);
  const [loadingCasas, setLoadingCasas] = useState(true);
  const [showCasaForm, setShowCasaForm] = useState(false);
  const [nuevaCasa, setNuevaCasa] = useState<Casa>({
    numero_casa: '',
    bloque: '',
    estado: 'OCUPADA',
  });

  // States para Residentes
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [loadingResidentes, setLoadingResidentes] = useState(true);
  const [showResidenteForm, setShowResidenteForm] = useState(false);
  const [nuevoResidente, setNuevoResidente] = useState<Residente>({
    nombre: '',
    telefono: '',
    email: '',
    es_propietario: false,
  });

  // Cargar datos
  const fetchCasas = async () => {
    setLoadingCasas(true);
    try {
      const data = await residencialApi.getCasas();
      setCasas(data || []);
    } catch (error) {
      console.error('Error al obtener casas:', error);
    } finally {
      setLoadingCasas(false);
    }
  };

  const fetchResidentes = async () => {
    setLoadingResidentes(true);
    try {
      const data = await residencialApi.getResidentes();
      setResidentes(data || []);
    } catch (error) {
      console.error('Error al obtener residentes:', error);
    } finally {
      setLoadingResidentes(false);
    }
  };

  const fetchInstalaciones = async () => {
    setLoadingInstalaciones(true);
    try {
      const data = await residencialApi.getResidenciales();
      setInstalaciones(data || []);
    } catch (error) {
      console.error('Error al obtener instalaciones:', error);
    } finally {
      setLoadingInstalaciones(false);
    }
  };

  useEffect(() => {
    let role = localStorage.getItem('user_role');
    
    // Fallback: Si no está en localStorage (ej. sesión antigua), intentar extraerlo del JWT
    if (!role) {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          // Add padding if necessary
          const pad = base64.length % 4;
          const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
          const payload = JSON.parse(atob(paddedBase64));
          if (payload && payload.rol) {
            role = payload.rol as string;
            localStorage.setItem('user_role', role);
          }
        } catch (e) {
          console.error('Error al decodificar JWT en cliente:', e);
        }
      }
    }

    setUserRole(role);
    if (role === 'SISADMIN') {
      setActiveTab('instalaciones');
      fetchInstalaciones();
    }

    fetchCasas();
    fetchResidentes();
  }, []);

  // Handlers para crear
  const handleCrearCasa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await residencialApi.createCasa(nuevaCasa);
      setShowCasaForm(false);
      setNuevaCasa({ numero_casa: '', bloque: '', estado: 'OCUPADA' });
      fetchCasas();
    } catch (error) {
      console.error('Error creando casa:', error);
      alert('Hubo un error al registrar la casa.');
    }
  };

  const handleCrearResidente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await residencialApi.createResidente(nuevoResidente);
      setShowResidenteForm(false);
      setNuevoResidente({ nombre: '', telefono: '', email: '', es_propietario: false, casa_id: undefined });
      fetchResidentes();
    } catch (error) {
      console.error('Error creando residente:', error);
      alert('Hubo un error al registrar el residente.');
    }
  };

  const handleCrearInstalacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await residencialApi.createResidencial(nuevaInstalacion as ResidencialInfo);
      setShowInstalacionForm(false);
      setNuevaInstalacion({ id: '', nombre: '', direccion: '', latitud_centro: 12.1364, longitud_centro: -86.2514, zoom_defecto: 13 });
      fetchInstalaciones();
    } catch (error) {
      console.error('Error creando instalación:', error);
      alert('Hubo un error al registrar la instalación.');
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Gestión Residencial
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Administra el padrón de casas y residentes activos.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-body)', padding: '0.5rem', borderRadius: '0.75rem', width: 'fit-content', marginBottom: '1.5rem' }}>
        {userRole === 'SISADMIN' && (
          <button
            onClick={() => setActiveTab('instalaciones')}
            style={{
              padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: activeTab === 'instalaciones' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'instalaciones' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: activeTab === 'instalaciones' ? '1px solid var(--border-color)' : 'none',
              borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeTab === 'instalaciones' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Building size={16} />
            Instalaciones
          </button>
        )}
        <button
          onClick={() => setActiveTab('casas')}
          style={{
            padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: activeTab === 'casas' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'casas' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: activeTab === 'casas' ? '1px solid var(--border-color)' : 'none',
            borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: activeTab === 'casas' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Home size={16} />
          Casas
        </button>
        <button
          onClick={() => setActiveTab('residentes')}
          style={{
            padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: activeTab === 'residentes' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'residentes' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: activeTab === 'residentes' ? '1px solid var(--border-color)' : 'none',
            borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: activeTab === 'residentes' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Users size={16} />
          Residentes
        </button>
      </div>

      {/* Contenido Instalaciones (Solo SISADMIN) */}
      {activeTab === 'instalaciones' && userRole === 'SISADMIN' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Directorio de Instalaciones</h2>
            <button 
              onClick={() => setShowInstalacionForm(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', backgroundColor: '#1e293b', 
                color: 'white', border: 'none', borderRadius: '0.5rem', 
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              <Plus size={16} style={{ color: '#FACC15' }} />
              <span>Registrar Instalación</span>
            </button>
          </div>
          
          {loadingInstalaciones ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando instalaciones...</div>
          ) : instalaciones.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay instalaciones registradas aún.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Identificador</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nombre</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Dirección</th>
                </tr>
              </thead>
              <tbody>
                {instalaciones.map((inst) => (
                  <tr key={inst.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>{inst.id}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{inst.nombre}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{inst.direccion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Contenido Casas */}
      {activeTab === 'casas' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Directorio de Casas</h2>
            <button 
              onClick={() => setShowCasaForm(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', backgroundColor: '#1e293b', 
                color: 'white', border: 'none', borderRadius: '0.5rem', 
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              <Plus size={16} style={{ color: '#FACC15' }} />
              <span>Registrar Casa</span>
            </button>
          </div>
          
          {loadingCasas ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando casas...</div>
          ) : casas.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay casas registradas aún.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Número de Casa</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Bloque / Zona</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {casas.map((casa) => (
                  <tr key={casa.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>{casa.numero_casa}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{casa.bloque || '-'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600',
                        backgroundColor: casa.estado === 'OCUPADA' ? 'rgba(34, 197, 94, 0.1)' : 
                                         casa.estado === 'EN_CONSTRUCCION' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: casa.estado === 'OCUPADA' ? 'var(--success)' : 
                               casa.estado === 'EN_CONSTRUCCION' ? '#ca8a04' : 'var(--text-secondary)'
                      }}>
                        {casa.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Contenido Residentes */}
      {activeTab === 'residentes' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Padrón de Residentes</h2>
            <button 
              onClick={() => setShowResidenteForm(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', backgroundColor: '#1e293b', 
                color: 'white', border: 'none', borderRadius: '0.5rem', 
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              <Plus size={16} style={{ color: '#FACC15' }} />
              <span>Registrar Residente</span>
            </button>
          </div>
          
          {loadingResidentes ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando residentes...</div>
          ) : residentes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay residentes registrados aún.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nombre Completo</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Contacto</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Casa</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Es Propietario</th>
                </tr>
              </thead>
              <tbody>
                {residentes.map((residente) => (
                  <tr key={residente.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>{residente.nombre}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ color: 'var(--text-primary)' }}>{residente.telefono || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{residente.email || '-'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {residente.numero_casa ? (
                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.25rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          Casa {residente.numero_casa}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>No asignada</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {residente.es_propietario ? (
                        <span style={{ color: 'var(--success)', fontWeight: '500' }}>Sí</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Casa */}
      {showCasaForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', borderRadius: '1rem', width: '100%', maxWidth: '400px',
            boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Registrar Casa</h2>
              <button onClick={() => setShowCasaForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCrearCasa} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Número de Casa</label>
                <input
                  type="text" required
                  value={nuevaCasa.numero_casa}
                  onChange={(e) => setNuevaCasa({...nuevaCasa, numero_casa: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Ej. 104"
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Bloque / Zona</label>
                <input
                  type="text"
                  value={nuevaCasa.bloque}
                  onChange={(e) => setNuevaCasa({...nuevaCasa, bloque: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Ej. Bloque A"
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Estado</label>
                <select
                  value={nuevaCasa.estado}
                  onChange={(e) => setNuevaCasa({...nuevaCasa, estado: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="OCUPADA">Ocupada</option>
                  <option value="DESOCUPADA">Desocupada</option>
                  <option value="EN_CONSTRUCCION">En Construcción</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCasaForm(false)} style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '500', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Residente */}
      {showResidenteForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', borderRadius: '1rem', width: '100%', maxWidth: '450px',
            boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Registrar Residente</h2>
              <button onClick={() => setShowResidenteForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCrearResidente} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre Completo</label>
                <input
                  type="text" required
                  value={nuevoResidente.nombre}
                  onChange={(e) => setNuevoResidente({...nuevoResidente, nombre: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Teléfono</label>
                  <input
                    type="text"
                    value={nuevoResidente.telefono}
                    onChange={(e) => setNuevoResidente({...nuevoResidente, telefono: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                  <input
                    type="email"
                    value={nuevoResidente.email}
                    onChange={(e) => setNuevoResidente({...nuevoResidente, email: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Vincular a Casa</label>
                <select
                  value={nuevoResidente.casa_id || ''}
                  onChange={(e) => setNuevoResidente({...nuevoResidente, casa_id: e.target.value ? parseInt(e.target.value) : undefined})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="">Selecciona una casa (opcional)</option>
                  {casas.map(c => (
                    <option key={c.id} value={c.id}>Casa {c.numero_casa} - {c.bloque}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="es_propietario"
                  checked={nuevoResidente.es_propietario}
                  onChange={(e) => setNuevoResidente({...nuevoResidente, es_propietario: e.target.checked})}
                  style={{ width: '1rem', height: '1rem' }}
                />
                <label htmlFor="es_propietario" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Es propietario de la casa
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowResidenteForm(false)} style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '500', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Instalación */}
      {showInstalacionForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', borderRadius: '1rem', width: '100%', maxWidth: '500px',
            boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Registrar Instalación</h2>
              <button onClick={() => setShowInstalacionForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCrearInstalacion} style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Identificador (ID Único)</label>
                <input
                  type="text" required
                  value={nuevaInstalacion.id}
                  onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Ej. los-robles"
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre Comercial</label>
                <input
                  type="text" required
                  value={nuevaInstalacion.nombre}
                  onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, nombre: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Ej. Residencial Los Robles"
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Dirección Física</label>
                <input
                  type="text"
                  value={nuevaInstalacion.direccion}
                  onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, direccion: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Latitud Centro</label>
                  <input
                    type="number" step="any"
                    value={nuevaInstalacion.latitud_centro}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, latitud_centro: parseFloat(e.target.value)})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Longitud Centro</label>
                  <input
                    type="number" step="any"
                    value={nuevaInstalacion.longitud_centro}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, longitud_centro: parseFloat(e.target.value)})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Zoom</label>
                  <input
                    type="number"
                    value={nuevaInstalacion.zoom_defecto}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, zoom_defecto: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowInstalacionForm(false)} style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '500', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

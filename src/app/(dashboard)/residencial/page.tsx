'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Building, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Paperclip, 
  Download, 
  UploadCloud,
  CheckCircle,
  MapPin,
  Eye
} from 'lucide-react';
import { residencialApi, Casa, Residente, ResidencialInfo } from '@/lib/api';

export default function ResidencialPage() {
  const [activeTab, setActiveTab] = useState<'instalaciones' | 'casas' | 'residentes'>('casas');
  const [userRole, setUserRole] = useState<string | null>(null);

  // States para Instalaciones (Residenciales)
  const [instalaciones, setInstalaciones] = useState<ResidencialInfo[]>([]);
  const [loadingInstalaciones, setLoadingInstalaciones] = useState(true);
  const [showInstalacionForm, setShowInstalacionForm] = useState(false);
  const [nuevaInstalacion, setNuevaInstalacion] = useState<ResidencialInfo>({
    id: '', nombre: '', direccion: '', latitud_centro: 12.1364, longitud_centro: -86.2514, zoom_defecto: 13
  });
  
  // States para Casas
  const [casas, setCasas] = useState<Casa[]>([]);
  const [loadingCasas, setLoadingCasas] = useState(true);
  const [showCasaForm, setShowCasaForm] = useState(false);
  const [selectedCasaExpediente, setSelectedCasaExpediente] = useState<Casa | null>(null);
  const [expedienteTab, setExpedienteTab] = useState<'info' | 'visitas' | 'rondas' | 'documentos'>('info');

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
    if (!role) {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
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
    fetchCasas();
    fetchResidentes();
    if (role === 'SISADMIN') {
      fetchInstalaciones();
    }
  }, []);

  const handleCreateCasa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await residencialApi.createCasa(nuevaCasa);
      setShowCasaForm(false);
      setNuevaCasa({ numero_casa: '', bloque: '', estado: 'OCUPADA' });
      fetchCasas();
    } catch (error) {
      console.error('Error al crear casa:', error);
      alert('Error al registrar la casa');
    }
  };

  const handleCreateResidente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await residencialApi.createResidente(nuevoResidente);
      setShowResidenteForm(false);
      setNuevoResidente({ nombre: '', telefono: '', email: '', es_propietario: false });
      fetchResidentes();
    } catch (error) {
      console.error('Error al crear residente:', error);
      alert('Error al registrar el residente');
    }
  };

  const handleCreateInstalacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await residencialApi.createResidencial(nuevaInstalacion);
      setShowInstalacionForm(false);
      setNuevaInstalacion({ id: '', nombre: '', direccion: '', latitud_centro: 12.1364, longitud_centro: -86.2514, zoom_defecto: 13 });
      fetchInstalaciones();
    } catch (error) {
      console.error('Error al crear instalación:', error);
      alert('Error al registrar residencial');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Gestión Residencial & Expediente por Casa
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem', fontSize: '0.875rem' }}>
            Control de casas, residentes, expediente de vivienda y notificaciones.
          </p>
        </div>

        {/* Pestañas Principales */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
          {userRole === 'SISADMIN' && (
            <button
              onClick={() => setActiveTab('instalaciones')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: activeTab === 'instalaciones' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'instalaciones' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '700',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              Instalaciones
            </button>
          )}
          <button
            onClick={() => setActiveTab('casas')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: activeTab === 'casas' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'casas' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            Casas / Viviendas
          </button>
          <button
            onClick={() => setActiveTab('residentes')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: activeTab === 'residentes' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'residentes' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            Residentes
          </button>
        </div>
      </div>

      {/* PESTAÑA: CASAS / VIVIENDAS */}
      {activeTab === 'casas' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCasaForm(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#f59e0b',
                color: '#0f172a',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} /> Registrar Nueva Casa
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {loadingCasas ? (
              <p style={{ color: 'var(--text-secondary)' }}>Cargando viviendas...</p>
            ) : casas.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
                <Home size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>No hay casas registradas</h3>
              </div>
            ) : (
              casas.map((casa) => (
                <div
                  key={casa.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Casa {casa.numero_casa}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669', borderRadius: '1rem', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        {casa.estado}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                      <div><strong>Sector / Bloque:</strong> {casa.bloque || 'Sector Principal'}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCasaExpediente(casa);
                      setExpedienteTab('info');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      backgroundColor: 'var(--bg-body)',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)',
                      borderRadius: '0.5rem',
                      fontWeight: '700',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem'
                    }}
                  >
                    <Eye size={16} /> Abrir Expediente de Casa
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* PESTAÑA: RESIDENTES */}
      {activeTab === 'residentes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowResidenteForm(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} /> Registrar Nuevo Residente
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {loadingResidentes ? (
              <p style={{ color: 'var(--text-secondary)' }}>Cargando residentes...</p>
            ) : residentes.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
                <Users size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>No hay residentes registrados</h3>
              </div>
            ) : (
              residentes.map((res) => (
                <div
                  key={res.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                      {res.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{res.nombre}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{res.es_propietario ? 'Propietario' : 'Inquilino'}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div><strong>Teléfono:</strong> {res.telefono || 'No registrado'}</div>
                    <div><strong>Email:</strong> {res.email || 'No registrado'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* MODAL EXPEDIENTE COMPLETO DE PROPIEDAD / CASA */}
      {selectedCasaExpediente && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '750px', padding: '2rem', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-card)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Home color="var(--primary)" size={28} />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    Expediente Digital: Casa {selectedCasaExpediente.numero_casa}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>Historial consolidado de accesos, rondas y archivos</p>
                </div>
              </div>
              <button onClick={() => setSelectedCasaExpediente(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Pestañas del Expediente */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              {[
                { key: 'info', label: 'Datos & Vehículos' },
                { key: 'visitas', label: 'Historial de Visitas' },
                { key: 'rondas', label: 'Marcaciones QR & Rondas' },
                { key: 'documentos', label: 'Archivos Adjuntos' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setExpedienteTab(tab.key as any)}
                  style={{
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderBottom: expedienteTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: expedienteTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* PESTAÑA INFO */}
            {expedienteTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>NÚMERO DE CASA:</strong> <div style={{ fontSize: '1rem', fontWeight: '700' }}>Casa {selectedCasaExpediente.numero_casa}</div></div>
                  <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>BLOQUE / SECTOR:</strong> <div style={{ fontSize: '1rem', fontWeight: '700' }}>{selectedCasaExpediente.bloque || 'Sector Principal'}</div></div>
                  <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ESTADO DE OCUPACIÓN:</strong> <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#10b981' }}>{selectedCasaExpediente.estado}</div></div>
                  <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>VEHÍCULOS AUTORIZADOS:</strong> <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>2 Vehículos (M 294812, M 884721)</div></div>
                </div>
              </div>
            )}

            {/* PESTAÑA VISITAS */}
            {expedienteTab === 'visitas' && (
              <div style={{ backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Visualización de las últimas visitas autorizadas para esta casa en bitácora.
              </div>
            )}

            {/* PESTAÑA RONDAS */}
            {expedienteTab === 'rondas' && (
              <div style={{ backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Registro de marcaciones QR de rondas nocturnas realizadas por supervisores en esta casa.
              </div>
            )}

            {/* PESTAÑA DOCUMENTOS */}
            {expedienteTab === 'documentos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ border: '2px dashed var(--border-color)', padding: '1.5rem', textAlign: 'center', borderRadius: '0.5rem', backgroundColor: 'var(--bg-body)' }}>
                  <UploadCloud size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Adjuntar Contratos o Identificaciones</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Soporta PDF, JPG, PNG</div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL CREAR CASA */}
      {showCasaForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '420px', padding: '1.75rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Registrar Casa / Vivienda</h3>
              <button onClick={() => setShowCasaForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateCasa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Número de Casa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. A29 / 104"
                  value={nuevaCasa.numero_casa}
                  onChange={(e) => setNuevaCasa({ ...nuevaCasa, numero_casa: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Bloque / Sector</label>
                <input
                  type="text"
                  placeholder="Ej. Sector A / Etapa 2"
                  value={nuevaCasa.bloque}
                  onChange={(e) => setNuevaCasa({ ...nuevaCasa, bloque: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCasaForm(false)} style={{ padding: '0.625rem 1rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Guardar Casa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR RESIDENTE */}
      {showResidenteForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '420px', padding: '1.75rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Registrar Residente</h3>
              <button onClick={() => setShowResidenteForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateResidente} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Morales"
                  value={nuevoResidente.nombre}
                  onChange={(e) => setNuevoResidente({ ...nuevoResidente, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej. +505 8899-0011"
                  value={nuevoResidente.telefono}
                  onChange={(e) => setNuevoResidente({ ...nuevoResidente, telefono: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowResidenteForm(false)} style={{ padding: '0.625rem 1rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Guardar Residente</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

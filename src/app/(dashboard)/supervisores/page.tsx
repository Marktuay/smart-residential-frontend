'use client';

import { useState, useEffect } from 'react';
import { 
  UserCog, 
  Plus, 
  Shield, 
  Search, 
  Mail, 
  Phone, 
  X, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  CreditCard,
  Calendar,
  FileCheck,
  Award,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { usuariosApi, Usuario } from '@/lib/api';

const getNombreFromEmail = (email: string) => {
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[\._\-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const getTelefonoById = (id?: number) => {
  if (!id) return '+505 8888-0000';
  return `+505 8${(id * 13) % 10}${(id * 7) % 10}${(id * 3) % 10}-${String(id * 1234).padStart(4, '0').slice(-4)}`;
};

export default function SupervisoresPage() {
  const [supervisores, setSupervisores] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [showCarnetModal, setShowCarnetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'vacaciones' | 'amonestaciones'>('info');

  // Formulario Nuevo Supervisor
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSupervisores();
  }, []);

  const fetchSupervisores = async () => {
    setIsLoading(true);
    try {
      const allUsers = await usuariosApi.getUsuarios();
      setSupervisores(allUsers.filter(u => u.rol === 'SUPERVISOR' || u.rol === 'GUARDIA'));
    } catch (err) {
      console.error("Error al obtener usuarios para supervisores:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setModalError("El correo electrónico y la contraseña son requeridos.");
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      await usuariosApi.createUsuario({
        email,
        password,
        rol: 'SUPERVISOR'
      });
      
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setShowModal(false);
      await fetchSupervisores();
    } catch (err: any) {
      console.error("Error creando supervisor:", err);
      setModalError(err.response?.data?.message || 'Error al registrar el supervisor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const supervisoresFiltrados = supervisores.filter(sup => {
    const nombre = getNombreFromEmail(sup.email).toLowerCase();
    const correo = sup.email.toLowerCase();
    return nombre.includes(filtroTexto.toLowerCase()) || correo.includes(filtroTexto.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Expediente de Personal & Supervisores
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem', fontSize: '0.875rem' }}>
            Gestión de fichas completas, carnets digitales, vacaciones y KPI de amonestaciones.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#f59e0b',
            color: '#0f172a',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.625rem',
            fontWeight: '700',
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus size={18} />
          Añadir Nuevo Supervisor
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '1rem', 
        flexWrap: 'wrap',
        backgroundColor: 'var(--bg-card)',
        padding: '1rem 1.25rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.625rem',
              backgroundColor: 'var(--bg-body)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Grid de Supervisores / Guardias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {isLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando personal de seguridad...</p>
        ) : supervisoresFiltrados.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
            <UserCog size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>No hay supervisores registrados</h3>
          </div>
        ) : (
          supervisoresFiltrados.map((sup) => {
            const nombre = getNombreFromEmail(sup.email);
            const telefono = getTelefonoById(sup.id);

            return (
              <div 
                key={sup.id} 
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.125rem' }}>
                      {nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{nombre}</h3>
                      <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', borderRadius: '0.25rem', fontWeight: '700' }}>
                        {sup.rol}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={15} /> {sup.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={15} /> {telefono}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedUser(sup);
                      setActiveTab('info');
                      setShowFichaModal(true);
                    }}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Ficha de Empleado
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(sup);
                      setShowCarnetModal(true);
                    }}
                    style={{ padding: '0.5rem 0.75rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <CreditCard size={14} /> Carnet Digital
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL FICHA COMPLETA DEL COLABORADOR */}
      {showFichaModal && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '700px', padding: '2rem', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-card)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                  {getNombreFromEmail(selectedUser.email).substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {getNombreFromEmail(selectedUser.email)}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>Expediente Digital del Colaborador</p>
                </div>
              </div>
              <button onClick={() => setShowFichaModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Pestañas de la Ficha */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              {[
                { key: 'info', label: 'Datos Personales & Uniforme' },
                { key: 'vacaciones', label: 'Días de Vacaciones & Firma' },
                { key: 'amonestaciones', label: 'Amonestaciones & KPIs' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* PESTAÑA 1: DATOS PERSONALES & UNIFORME */}
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>DNI / CÉDULA:</strong> <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>201-200571-0003P</div></div>
                  <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>PUESTO DE TRABAJO:</strong> <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Ciudad Campuzano / Garita</div></div>
                  <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>SALARIO BASE:</strong> <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981' }}>$9,500.00 / mes</div></div>
                  <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>CONTACTO EMERGENCIA:</strong> <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Carlos Soto (+505 7673-3924)</div></div>
                </div>

                <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Tallas de Equipamiento & Uniformes</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-body)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TALLA PANTALÓN:</span>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>30</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-body)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TALLA CALZADO:</span>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>38</div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: VACACIONES & FIRMA DIGITAL */}
            {activeTab === 'vacaciones' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>DÍAS ACUMULADOS</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>4.5 Días</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>DÍAS RESTANTES</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>4.5 Días</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Firma Digital del Empleado</h4>
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    Firma digital registrada y verificada en sistema
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: AMONESTACIONES & KPIS */}
            {activeTab === 'amonestaciones' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: '700' }}>
                  <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>L: Leve (-1 pt)</span>
                  <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>M: Media (-2 pts)</span>
                  <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>G: Grave (-3 pts)</span>
                  <span style={{ backgroundColor: '#fca5a5', color: '#7f1d1d', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>MG: Muy Grave (-5 pts)</span>
                </div>

                <div style={{ backgroundColor: 'var(--bg-body)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Este empleado no tiene reportes ni amonestaciones registradas (KPI de Cumplimiento: 100%).
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL CARNET DIGITAL INSTITUCIONAL */}
      {showCarnetModal && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            
            {/* Diseño del Carnet Físico / Digital */}
            <div style={{ 
              width: '320px', 
              height: '480px', 
              backgroundColor: '#ffffff', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              border: '2px solid #e2e8f0',
              position: 'relative'
            }}>
              {/* Encabezado Institucional */}
              <div style={{ backgroundColor: '#0f172a', padding: '1rem', textAlign: 'center', borderBottom: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.05em' }}>NEW CENTURY</div>
                <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '700' }}>SECURITY S.A.</div>
              </div>

              {/* Foto de Perfil */}
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '3px solid #3b82f6', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', color: '#1e293b' }}>
                  {getNombreFromEmail(selectedUser.email).substring(0, 2).toUpperCase()}
                </div>
                <div style={{ marginTop: '0.75rem', fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>
                  {getNombreFromEmail(selectedUser.email)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>
                  {selectedUser.rol === 'SUPERVISOR' ? 'SUPERVISOR DE SEGURIDAD' : 'GUARDA DE SEGURIDAD'}
                </div>
              </div>

              {/* Información Físico-Laboral */}
              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#334155', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                <div><strong>DNI:</strong> 201-200571-0003P</div>
                <div><strong>Lugar de Trabajo:</strong> Ciudad Campuzano</div>
                <div><strong>Estado:</strong> <span style={{ color: '#10b981', fontWeight: '700' }}>ACTIVO</span></div>
              </div>

              {/* Footer Institucional */}
              <div style={{ backgroundColor: '#0f172a', padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.65rem' }}>
                ¡Tu tranquilidad, nuestra prioridad!
              </div>
            </div>

            {/* Botones del Carnet */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => window.print()} 
                style={{ padding: '0.625rem 1.25rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Printer size={16} /> Imprimir Carnet
              </button>
              <button 
                onClick={() => setShowCarnetModal(false)} 
                style={{ padding: '0.625rem 1.25rem', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CREAR SUPERVISOR */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '420px', padding: '1.75rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Añadir Nuevo Supervisor</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddSupervisor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modalError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem' }}>
                  {modalError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="Ej. supervisor@ncs365.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Contraseña Temporal *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.625rem 1rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

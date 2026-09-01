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
  AlertCircle,
  Edit,
  Save,
  ShieldAlert
} from 'lucide-react';
import { usuariosApi, Usuario } from '@/lib/api';

const getNombreFromEmail = (email: string) => {
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[\._\-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

interface Amonestacion {
  id: number;
  gravedad: 'LEVE' | 'MEDIA' | 'GRAVE' | 'MUY_GRAVE';
  puntos: number;
  motivo: string;
  fecha: string;
}

export default function SupervisoresPage() {
  const [supervisores, setSupervisores] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [showCarnetModal, setShowCarnetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'vacaciones' | 'amonestaciones'>('info');

  // Estado extendido editable del perfil
  const [userProfileData, setUserProfileData] = useState({
    dni: '201-200571-0003P',
    puesto: 'Ciudad Campuzano / Garita Principal',
    salario: '$9,500.00 / mes',
    contactoEmergencia: 'Carlos Soto (+505 7673-3924)',
    tallaPantalon: '30',
    tallaCalzado: '38',
    telefono: '+505 8888-0000',
    diasAcumulados: 4.5,
    diasRestantes: 4.5
  });

  // Estado de amonestaciones registradas
  const [amonestaciones, setAmonestaciones] = useState<Amonestacion[]>([]);
  const [nuevaAmonestacion, setNuevaAmonestacion] = useState({
    gravedad: 'LEVE' as 'LEVE' | 'MEDIA' | 'GRAVE' | 'MUY_GRAVE',
    motivo: ''
  });

  // Formulario Nuevo Colaborador
  const [newColaborador, setNewColaborador] = useState({
    email: '',
    password: '',
    rol: 'SUPERVISOR',
    dni: '',
    telefono: '',
    puesto: 'Garita Principal / Terrazas',
    salario: '$9,500.00 / mes',
    contactoEmergencia: '',
    tallaPantalon: '32',
    tallaCalzado: '40'
  });

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
    if (!newColaborador.email.trim() || !newColaborador.password.trim()) {
      setModalError("El correo electrónico y la contraseña son requeridos.");
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      await usuariosApi.createUsuario({
        email: newColaborador.email,
        password: newColaborador.password,
        rol: newColaborador.rol
      });
      
      setNewColaborador({
        email: '',
        password: '',
        rol: 'SUPERVISOR',
        dni: '',
        telefono: '',
        puesto: 'Garita Principal / Terrazas',
        salario: '$9,500.00 / mes',
        contactoEmergencia: '',
        tallaPantalon: '32',
        tallaCalzado: '40'
      });
      setShowModal(false);
      await fetchSupervisores();
    } catch (err: any) {
      console.error("Error creando supervisor:", err);
      setModalError(err.response?.data?.message || 'Error al registrar el supervisor. Verifique si el correo ya existe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAgregarAmonestacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaAmonestacion.motivo.trim()) return;

    let puntos = 1;
    if (nuevaAmonestacion.gravedad === 'MEDIA') puntos = 2;
    if (nuevaAmonestacion.gravedad === 'GRAVE') puntos = 3;
    if (nuevaAmonestacion.gravedad === 'MUY_GRAVE') puntos = 5;

    const creada: Amonestacion = {
      id: Date.now(),
      gravedad: nuevaAmonestacion.gravedad,
      puntos,
      motivo: nuevaAmonestacion.motivo,
      fecha: new Date().toLocaleDateString()
    };

    setAmonestaciones([creada, ...amonestaciones]);
    setNuevaAmonestacion({ gravedad: 'LEVE', motivo: '' });
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
            Registro, edición de fichas completas, carnets digitales, vacaciones y amonestaciones.
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
          Registrar Nuevo Personal
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>No hay colaboradores registrados</h3>
          </div>
        ) : (
          supervisoresFiltrados.map((sup) => {
            const nombre = getNombreFromEmail(sup.email);

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
                      <Phone size={15} /> {userProfileData.telefono}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedUser(sup);
                      setActiveTab('info');
                      setIsEditing(false);
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

      {/* MODAL FICHA COMPLETA Y EDITABLE DEL COLABORADOR */}
      {showFichaModal && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '720px', padding: '2rem', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-card)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                  {getNombreFromEmail(selectedUser.email).substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {getNombreFromEmail(selectedUser.email)}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>Expediente Digital del Colaborador</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: isEditing ? '#10b981' : 'var(--bg-body)',
                    color: isEditing ? '#ffffff' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >
                  {isEditing ? <Save size={14} /> : <Edit size={14} />}
                  {isEditing ? 'Guardar Cambios' : 'Editar Ficha'}
                </button>

                <button onClick={() => setShowFichaModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-body)', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '0.25rem' }}>DNI / CÉDULA</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userProfileData.dni}
                        onChange={(e) => setUserProfileData({ ...userProfileData, dni: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{userProfileData.dni}</div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '0.25rem' }}>PUESTO DE TRABAJO / ASIGNACIÓN</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userProfileData.puesto}
                        onChange={(e) => setUserProfileData({ ...userProfileData, puesto: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{userProfileData.puesto}</div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '0.25rem' }}>SALARIO BASE MENSUAL</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userProfileData.salario}
                        onChange={(e) => setUserProfileData({ ...userProfileData, salario: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981' }}>{userProfileData.salario}</div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '0.25rem' }}>CONTACTO DE EMERGENCIA</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userProfileData.contactoEmergencia}
                        onChange={(e) => setUserProfileData({ ...userProfileData, contactoEmergencia: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{userProfileData.contactoEmergencia}</div>
                    )}
                  </div>
                </div>

                <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Tallas de Equipamiento & Uniformes</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-body)', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>TALLA PANTALÓN:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userProfileData.tallaPantalon}
                        onChange={(e) => setUserProfileData({ ...userProfileData, tallaPantalon: e.target.value })}
                        style={{ width: '100%', padding: '0.375rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                      />
                    ) : (
                      <div style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: '0.25rem' }}>{userProfileData.tallaPantalon}</div>
                    )}
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-body)', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>TALLA CALZADO:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userProfileData.tallaCalzado}
                        onChange={(e) => setUserProfileData({ ...userProfileData, tallaCalzado: e.target.value })}
                        style={{ width: '100%', padding: '0.375rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                      />
                    ) : (
                      <div style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: '0.25rem' }}>{userProfileData.tallaCalzado}</div>
                    )}
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
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={userProfileData.diasAcumulados}
                        onChange={(e) => setUserProfileData({ ...userProfileData, diasAcumulados: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100px', margin: '0.5rem auto 0', padding: '0.375rem', textAlign: 'center', fontWeight: '800', fontSize: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: '0.375rem', color: 'var(--primary)' }}
                      />
                    ) : (
                      <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>{userProfileData.diasAcumulados} Días</div>
                    )}
                  </div>

                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>DÍAS RESTANTES</div>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={userProfileData.diasRestantes}
                        onChange={(e) => setUserProfileData({ ...userProfileData, diasRestantes: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100px', margin: '0.5rem auto 0', padding: '0.375rem', textAlign: 'center', fontWeight: '800', fontSize: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid #10b981', borderRadius: '0.375rem', color: '#10b981' }}
                      />
                    ) : (
                      <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>{userProfileData.diasRestantes} Días</div>
                    )}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Firma Digital del Empleado</h4>
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    Firma digital registrada y verificada en el contrato laboral.
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: AMONESTACIONES & KPIS */}
            {activeTab === 'amonestaciones' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: '700' }}>
                  <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>L: Leve (-1 pt)</span>
                  <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>M: Media (-2 pts)</span>
                  <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>G: Grave (-3 pts)</span>
                  <span style={{ backgroundColor: '#fca5a5', color: '#7f1d1d', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>MG: Muy Grave (-5 pts)</span>
                </div>

                {/* Formulario para registrar amonestación */}
                <form onSubmit={handleAgregarAmonestacion} style={{ backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <ShieldAlert size={16} color="#ef4444" /> Registrar Nueva Amonestación
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                    <select
                      value={nuevaAmonestacion.gravedad}
                      onChange={(e) => setNuevaAmonestacion({ ...nuevaAmonestacion, gravedad: e.target.value as any })}
                      style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
                    >
                      <option value="LEVE">Leve (-1 pt)</option>
                      <option value="MEDIA">Media (-2 pts)</option>
                      <option value="GRAVE">Grave (-3 pts)</option>
                      <option value="MUY_GRAVE">Muy Grave (-5 pts)</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Motivo de la sanción o llamada de atención..."
                      value={nuevaAmonestacion.motivo}
                      onChange={(e) => setNuevaAmonestacion({ ...nuevaAmonestacion, motivo: e.target.value })}
                      style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ alignSelf: 'flex-end', padding: '0.375rem 1rem', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '0.375rem', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Guardar Sanción
                  </button>
                </form>

                {/* Lista de Amonestaciones */}
                {amonestaciones.length === 0 ? (
                  <div style={{ backgroundColor: 'var(--bg-body)', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Este empleado no tiene reportes ni amonestaciones registradas (KPI de Cumplimiento: 100%).
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {amonestaciones.map((a) => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-body)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{a.motivo}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.fecha}</div>
                        </div>
                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.25rem', fontWeight: '700', fontSize: '0.75rem' }}>
                          -{a.puntos} Pts ({a.gravedad})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL CARNET DIGITAL INSTITUCIONAL */}
      {showCarnetModal && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            
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
              <div style={{ backgroundColor: '#0f172a', padding: '1rem', textAlign: 'center', borderBottom: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.05em' }}>NEW CENTURY</div>
                <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '700' }}>SECURITY S.A.</div>
              </div>

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

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#334155', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                <div><strong>DNI:</strong> {userProfileData.dni}</div>
                <div><strong>Lugar de Trabajo:</strong> {userProfileData.puesto}</div>
                <div><strong>Estado:</strong> <span style={{ color: '#10b981', fontWeight: '700' }}>ACTIVO</span></div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.65rem' }}>
                ¡Tu tranquilidad, nuestra prioridad!
              </div>
            </div>

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

      {/* MODAL REGISTRAR NUEVO PERSONAL / SUPERVISOR */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '580px', padding: '1.75rem', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Registrar Nuevo Personal / Supervisor</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddSupervisor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modalError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem' }}>
                  {modalError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. guardia@ncsecurity.net"
                    value={newColaborador.email}
                    onChange={(e) => setNewColaborador({ ...newColaborador, email: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Contraseña Temporal *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newColaborador.password}
                    onChange={(e) => setNewColaborador({ ...newColaborador, password: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Rol Operativo</label>
                  <select
                    value={newColaborador.rol}
                    onChange={(e) => setNewColaborador({ ...newColaborador, rol: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  >
                    <option value="SUPERVISOR">Supervisor de Seguridad</option>
                    <option value="GUARDIA">Guarda de Garita / Acceso</option>
                    <option value="GUARDIA_PATRULLERO">Guarda Patrullero (Rondas QR)</option>
                    <option value="GUARDIA_MOTORIZADO">Guarda Motorizado / Reacción</option>
                    <option value="OPERADOR_C2">Operador C2 / Centro de Mando</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Cédula / DNI</label>
                  <input
                    type="text"
                    placeholder="Ej. 201-200571-0003P"
                    value={newColaborador.dni}
                    onChange={(e) => setNewColaborador({ ...newColaborador, dni: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Puesto de Trabajo</label>
                  <input
                    type="text"
                    placeholder="Ej. Garita Principal / Terrazas"
                    value={newColaborador.puesto}
                    onChange={(e) => setNewColaborador({ ...newColaborador, puesto: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Salario Base Mensual</label>
                  <input
                    type="text"
                    placeholder="Ej. $9,500.00 / mes"
                    value={newColaborador.salario}
                    onChange={(e) => setNewColaborador({ ...newColaborador, salario: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Talla de Pantalón</label>
                  <input
                    type="text"
                    placeholder="Ej. 30"
                    value={newColaborador.tallaPantalon}
                    onChange={(e) => setNewColaborador({ ...newColaborador, tallaPantalon: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Talla de Calzado</label>
                  <input
                    type="text"
                    placeholder="Ej. 40"
                    value={newColaborador.tallaCalzado}
                    onChange={(e) => setNewColaborador({ ...newColaborador, tallaCalzado: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.625rem 1rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Guardar Colaborador</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

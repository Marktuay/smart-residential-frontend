"use client";

import { useState, useEffect } from 'react';
import { UserCog, Plus, Shield, Search, Mail, Phone, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { usuariosApi, Usuario } from '@/lib/api';

// Helper para formatear nombre desde el email
const getNombreFromEmail = (email: string) => {
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[\._\-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

// Helper para generar zona mockeada determinista según el ID
const getZonaById = (id?: number) => {
  const zonas = ['Sector Norte', 'Sector Sur', 'Sector Este', 'Sector Oeste', 'Sector Central'];
  if (!id) return 'Sector General';
  return zonas[id % zonas.length];
};

// Helper para generar teléfono mockeado determinista según el ID
const getTelefonoById = (id?: number) => {
  if (!id) return '+505 8888-0000';
  return `+505 8${(id * 13) % 10}${(id * 7) % 10}${(id * 3) % 10}-${String(id * 1234).padStart(4, '0').slice(-4)}`;
};

export default function SupervisoresPage() {
  const [supervisores, setSupervisores] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modal para añadir supervisor
  const [showModal, setShowModal] = useState(false);
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
      // Filtrar solo usuarios con rol de SUPERVISOR
      setSupervisores(allUsers.filter(u => u.rol === 'SUPERVISOR'));
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
      
      // Limpiar formulario y cerrar modal
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setShowModal(false);
      
      // Recargar datos
      await fetchSupervisores();
    } catch (err: any) {
      console.error("Error creando supervisor:", err);
      setModalError(err.response?.data?.message || 'Error al registrar el supervisor. Verifique si el correo ya existe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado de supervisores en memoria
  const supervisoresFiltrados = supervisores.filter(sup => {
    const nombre = getNombreFromEmail(sup.email).toLowerCase();
    const correo = sup.email.toLowerCase();
    const textoMatches = nombre.includes(filtroTexto.toLowerCase()) || correo.includes(filtroTexto.toLowerCase());
    
    // Como todos los de la base de datos están activos al retornar, el estado coincide con 'activos' o 'todos'
    if (filtroEstado === 'inactivos') {
      return false; // No hay inactivos en base de datos real en esta simplificación
    }
    return textoMatches;
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando supervisores operativos...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: '#1e293b', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Gestión de Supervisores</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Administra el personal de supervisión operativa del residencial.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FACC15', color: '#1e293b', padding: '0.65rem 1.25rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          <Plus size={20} style={{ marginRight: '0.5rem' }} />
          Añadir Supervisor
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>
        <select 
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: 'white', color: '#475569', fontSize: '0.95rem', cursor: 'pointer' }}
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </div>

      {/* Listado de Supervisores */}
      {supervisoresFiltrados.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <UserCog size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p>No se encontraron supervisores registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {supervisoresFiltrados.map((sup) => {
            const nombre = getNombreFromEmail(sup.email);
            const zona = getZonaById(sup.id);
            const telefono = getTelefonoById(sup.id);
            
            return (
              <div key={sup.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#10b981' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <UserCog size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#1e293b', margin: 0 }}>{nombre}</h3>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: '600', marginTop: '0.25rem', display: 'inline-block',
                        backgroundColor: '#dcfce3',
                        color: '#16a34a'
                      }}>
                        ACTIVO
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#475569' }}>
                    <Mail size={16} color="#94a3b8" style={{ marginRight: '0.75rem' }} />
                    {sup.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#475569' }}>
                    <Phone size={16} color="#94a3b8" style={{ marginRight: '0.75rem' }} />
                    {telefono}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#475569' }}>
                    <Shield size={16} color="#94a3b8" style={{ marginRight: '0.75rem' }} />
                    Zona: {zona}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
                  Fecha Registro: {sup.creado_en ? new Date(sup.creado_en).toLocaleDateString() : 'Desconocida'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Supervisor */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            width: '100%', maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e293b' }}>Añadir Nuevo Supervisor</h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSupervisor} style={{ padding: '1.5rem' }}>
              {modalError && (
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{modalError}</span>
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#475569' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Ej. supervisor@ncs365.com"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#475569' }}>Contraseña Temporal</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', paddingRight: '2.5rem' }}
                    placeholder="Contraseña de acceso inicial"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: 'transparent', color: '#475569', fontWeight: '500', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

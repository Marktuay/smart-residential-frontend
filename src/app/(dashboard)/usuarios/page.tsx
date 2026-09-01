'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Users, 
  ShieldCheck,
  Shield,
  Home,
  X
} from 'lucide-react';
import { usuariosApi, Usuario } from '@/lib/api';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rol: 'GUARDIA'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await usuariosApi.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información de los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    
    try {
      await usuariosApi.createUsuario({
        email: formData.email,
        password: formData.password,
        rol: formData.rol
      });
      setIsModalOpen(false);
      setFormData({
        email: '',
        password: '',
        rol: 'GUARDIA'
      });
      fetchData(); // Refresh data
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Error al crear el usuario. Verifique si el email ya existe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
      case 'SISADMIN':
        return <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />;
      case 'SUPERVISOR':
        return <ShieldCheck size={16} style={{ color: 'var(--warning)' }} />;
      case 'GUARDIA':
        return <Shield size={16} style={{ color: 'var(--success)' }} />;
      default:
        return <Home size={16} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Cargando módulo de usuarios...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Administración de Usuarios
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Gestiona los accesos al sistema para administradores, supervisores, guardias y residentes.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.75rem 1.25rem', backgroundColor: 'var(--primary)', 
            color: 'white', border: 'none', borderRadius: '0.5rem', 
            fontWeight: '500', cursor: 'pointer', transition: 'opacity 0.2s' 
          }}
        >
          <Plus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Content */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {usuarios.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>No hay usuarios registrados en este residencial.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Correo Electrónico</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Rol</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Fecha de Creación</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{u.email}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getRoleIcon(u.rol)}
                      <span style={{ 
                        fontWeight: '600', fontSize: '0.875rem',
                        color: u.rol === 'ADMIN' ? 'var(--primary)' : 
                               u.rol === 'SUPERVISOR' ? 'var(--warning)' :
                               u.rol === 'GUARDIA' ? 'var(--success)' : 'var(--text-secondary)' 
                      }}>
                        {u.rol}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                    {u.creado_en ? new Date(u.creado_en).toLocaleDateString() : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nuevo Usuario */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '1rem',
            width: '100%', maxWidth: '450px',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden', border: '1px solid var(--border-color)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Registrar Nuevo Usuario</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              {modalError && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {modalError}
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Ej. guardia@residencial.com"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Contraseña Temporal</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Crea una contraseña segura"
                  minLength={6}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Rol del Usuario</label>
                <select 
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="GUARDIA">Guardia de Garita / Acceso</option>
                  <option value="GUARDIA_PATRULLERO">Guardia Patrullero (Rondas QR)</option>
                  <option value="GUARDIA_MOTORIZADO">Guardia Motorizado / Reacción</option>
                  <option value="OPERADOR_C2">Operador C2 / Centro de Mando</option>
                  <option value="SUPERVISOR">Supervisor de Turno</option>
                  <option value="ADMIN">Administrador (Residencial)</option>
                  <option value="RESIDENTE">Residente (Acceso a App)</option>
                </select>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formData.rol === 'GUARDIA' && 'Los guardias pueden registrar visitas y realizar rondas.'}
                  {formData.rol === 'SUPERVISOR' && 'Los supervisores pueden gestionar rondas y turnos de los guardias.'}
                  {formData.rol === 'ADMIN' && 'Los administradores tienen control total sobre este residencial.'}
                  {formData.rol === 'RESIDENTE' && 'Los residentes solo pueden pre-registrar visitas a su propia casa.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '500', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '500', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

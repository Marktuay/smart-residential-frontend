'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Users, 
  ShieldCheck,
  Shield,
  Home,
  X,
  Pencil,
  Trash2
} from 'lucide-react';
import { usuariosApi, Usuario } from '@/lib/api';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  
  // State para confirmación de eliminación
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormData({
      email: '',
      password: '',
      rol: 'GUARDIA'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: Usuario) => {
    setEditingUserId(u.id || null);
    setFormData({
      email: u.email,
      password: '', // Dejar en blanco si no se desea cambiar
      rol: u.rol
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    
    try {
      if (editingUserId) {
        // EDICIÓN
        await usuariosApi.updateUsuario(editingUserId, {
          email: formData.email,
          rol: formData.rol,
          ...(formData.password ? { password: formData.password } : {})
        });
      } else {
        // CREACIÓN
        await usuariosApi.createUsuario({
          email: formData.email,
          password: formData.password,
          rol: formData.rol
        });
      }

      setIsModalOpen(false);
      fetchData(); // Recargar datos
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Error al procesar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser || !deletingUser.id) return;
    setIsDeleting(true);
    try {
      await usuariosApi.deleteUsuario(deletingUser.id);
      setDeletingUser(null);
      fetchData();
    } catch (err: any) {
      alert('Error al eliminar usuario: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
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
      case 'GUARDIA_PATRULLERO':
      case 'GUARDIA_MOTORIZADO':
      case 'OPERADOR_C2':
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
          onClick={handleOpenCreateModal}
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

      {/* Content Table */}
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
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Usuario / Correo</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Rol</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Fecha de Creación</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'right' }}>Acciones</th>
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
                        color: (u.rol === 'ADMIN' || u.rol === 'SISADMIN') ? 'var(--primary)' : 
                               u.rol === 'SUPERVISOR' ? 'var(--warning)' :
                               u.rol.includes('GUARDIA') || u.rol === 'OPERADOR_C2' ? 'var(--success)' : 'var(--text-secondary)' 
                      }}>
                        {u.rol}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                    {u.creado_en ? new Date(u.creado_en).toLocaleDateString() : '--'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        style={{
                          padding: '0.4rem 0.6rem',
                          backgroundColor: 'var(--bg-body)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem'
                        }}
                        title="Editar Usuario"
                      >
                        <Pencil size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setDeletingUser(u)}
                        style={{
                          padding: '0.4rem 0.6rem',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          border: '1px solid #FCA5A5',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem'
                        }}
                        title="Eliminar Usuario"
                      >
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear / Editar Usuario */}
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
                {editingUserId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h2>
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre de Usuario / Correo *</label>
                <input 
                  type="text" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Ej. guarda01, jperez o admin@ncsecurity.net"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  {editingUserId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
                </label>
                <input 
                  type="password" 
                  required={!editingUserId}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder={editingUserId ? 'Dejar en blanco para mantener la actual' : 'Crea una contraseña segura'}
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
                  {isSubmitting ? 'Guardando...' : (editingUserId ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deletingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '1rem',
            width: '100%', maxWidth: '420px',
            boxShadow: 'var(--shadow-card)',
            padding: '1.5rem', border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: 0 }}>
              ¿Eliminar Usuario?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas eliminar la cuenta de <strong>{deletingUser.email}</strong>? Esta acción revocará todos sus accesos de inmediato.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setDeletingUser(null)}
                style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '500', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#DC2626', color: 'white', fontWeight: '500', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

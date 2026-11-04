'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  Pencil, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Phone, 
  Mail, 
  X, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { usuariosApi, Usuario } from '@/lib/api';

const ROLES_DISPONIBLES = [
  { value: 'GUARDIA', label: 'Guardia de Seguridad', badgeColor: '#10B981', badgeBg: '#ECFDF5' },
  { value: 'GUARDIA_PATRULLERO', label: 'Guardia Patrullero', badgeColor: '#059669', badgeBg: '#D1FAE5' },
  { value: 'GUARDIA_MOTORIZADO', label: 'Guardia Motorizado', badgeColor: '#047857', badgeBg: '#A7F3D0' },
  { value: 'OPERADOR_C2', label: 'Operador C2 / Monitoreo', badgeColor: '#0284C7', badgeBg: '#E0F2FE' },
  { value: 'SUPERVISOR', label: 'Supervisor de Operaciones', badgeColor: '#D97706', badgeBg: '#FEF3C7' },
  { value: 'ADMIN', label: 'Administrador Residencial', badgeColor: '#2563EB', badgeBg: '#EFF6FF' },
  { value: 'SISADMIN', label: 'Super-Administrador (SISADMIN)', badgeColor: '#7C3AED', badgeBg: '#F5F3FF' },
  { value: 'RESIDENTE', label: 'Residente / Usuario App', badgeColor: '#6B7280', badgeBg: '#F3F4F6' }
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [filtroActivo, setFiltroActivo] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Modal Carga Masiva CSV
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ message: string; success: boolean } | null>(null);

  // SoftDelete Confirmación
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulario Individual
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    cedula: '',
    telefono: '',
    password: '',
    rol: 'GUARDIA',
    activo: true
  });

  useEffect(() => {
    fetchData();
  }, [page, limit, filtroRol, filtroActivo]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const activoParam = filtroActivo === 'ACTIVOS' ? true : filtroActivo === 'INACTIVOS' ? false : undefined;
      const resp = await usuariosApi.getUsuariosPaginados({
        search: busqueda.trim(),
        rol: filtroRol === 'TODOS' ? undefined : filtroRol,
        activo: activoParam,
        page,
        limit
      });

      if (resp && Array.isArray(resp.items)) {
        setUsuarios(resp.items);
        setTotal(resp.total);
        setTotalPages(resp.total_pages || 1);
      } else if (Array.isArray(resp)) {
        // Fallback por si la respuesta fuera arreglo plano
        setUsuarios(resp);
        setTotal(resp.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al conectar con el servidor para consultar el personal.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormData({
      nombre_completo: '',
      email: '',
      cedula: '',
      telefono: '',
      password: '',
      rol: filtroRol !== 'TODOS' ? filtroRol : 'GUARDIA',
      activo: true
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: Usuario) => {
    setEditingUserId(u.id || null);
    setFormData({
      nombre_completo: u.nombre_completo || '',
      email: u.email || '',
      cedula: u.cedula || '',
      telefono: u.telefono || '',
      password: '', // Vacío para mantener actual
      rol: u.rol || 'GUARDIA',
      activo: u.activo !== false
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
        await usuariosApi.updateUsuario(editingUserId, {
          nombre_completo: formData.nombre_completo,
          email: formData.email,
          cedula: formData.cedula,
          telefono: formData.telefono,
          rol: formData.rol,
          activo: formData.activo,
          ...(formData.password ? { password: formData.password } : {})
        });
      } else {
        if (!formData.password) {
          throw new Error('La contraseña es obligatoria para nuevos registros.');
        }
        await usuariosApi.createUsuario({
          nombre_completo: formData.nombre_completo,
          email: formData.email,
          cedula: formData.cedula,
          telefono: formData.telefono,
          password: formData.password,
          rol: formData.rol,
          activo: formData.activo
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.response?.data || err.message || 'Error al guardar colaborador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEstado = async (u: Usuario) => {
    if (!u.id) return;
    const nuevoEstado = !u.activo;
    try {
      await usuariosApi.cambiarEstado(u.id, nuevoEstado);
      setUsuarios(prev => prev.map(item => item.id === u.id ? { ...item, activo: nuevoEstado } : item));
    } catch (err: any) {
      alert('Error cambiando estado: ' + (err.response?.data?.message || err.message));
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
      alert('Error al ejecutar SoftDelete: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  // Procesamiento local de CSV para previsualización
  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setBulkResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        setBulkResult({ message: 'El archivo está vacío o solo contiene encabezados.', success: false });
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/["']/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        if (rowObj.email || rowObj.usuario) {
          rows.push({
            nombre_completo: rowObj.nombre_completo || rowObj.nombre || '',
            email: rowObj.email || rowObj.usuario || '',
            cedula: rowObj.cedula || rowObj.dni || '',
            telefono: rowObj.telefono || '',
            rol: (rowObj.rol || 'GUARDIA').toUpperCase(),
            password: rowObj.password || 'NCS2026!'
          });
        }
      }
      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkUpload = async () => {
    if (!csvFile && parsedRows.length === 0) return;
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      let res;
      if (csvFile) {
        res = await usuariosApi.cargarCSV(csvFile);
      } else {
        res = await usuariosApi.cargarLoteJSON(parsedRows);
      }
      setBulkResult({ 
        message: `¡Carga masiva exitosa! Se procesaron y sincronizaron ${res.procesados} colaboradores.`, 
        success: true 
      });
      fetchData();
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setCsvFile(null);
        setParsedRows([]);
        setBulkResult(null);
      }, 2500);
    } catch (err: any) {
      setBulkResult({ 
        message: err.response?.data || err.message || 'Error durante la carga masiva.', 
        success: false 
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "nombre_completo,email,cedula,telefono,rol,password\n" +
      "Juan Carlos Perez,jperez,201-150890-0001A,+505 8888-1111,GUARDIA,Seguridad2026!\n" +
      "Carlos Alberto Gomez,cgomez,001-200185-0002B,+505 8777-2222,SUPERVISOR,Super2026!\n" +
      "Mario Ruiz Hernandez,mruiz,201-100492-0003C,+505 8666-3333,GUARDIA_PATRULLERO,NCS2026!\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_colaboradores_ncs365.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadge = (rol: string) => {
    const r = ROLES_DISPONIBLES.find(x => x.value === rol);
    const color = r ? r.badgeColor : '#64748b';
    const bg = r ? r.badgeBg : '#f1f5f9';
    const label = r ? r.label : rol;
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.25rem 0.65rem', borderRadius: '1rem', 
        fontSize: '0.75rem', fontWeight: '600', backgroundColor: bg, color 
      }}>
        <Shield size={12} color={color} />
        {label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '100%', width: '100%', minWidth: 0, boxSizing: 'border-box', color: '#1e293b' }}>
      
      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} color="#FACC15" />
            Gestión de Personal y Usuarios
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Directorio corporativo oficial de guardias, supervisores y accesos del residencial.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.65rem 1.15rem', backgroundColor: '#ffffff', 
              color: '#334155', border: '1px solid #cbd5e1', borderRadius: '0.5rem', 
              fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Upload size={18} color="#0284c7" />
            <span>Carga Masiva (.CSV)</span>
          </button>

          <button 
            onClick={handleOpenCreateModal}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.65rem 1.25rem', backgroundColor: '#FACC15', 
              color: '#1e293b', border: 'none', borderRadius: '0.5rem', 
              fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            <Plus size={20} />
            <span>Nuevo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Barra de Búsqueda y Pestañas de Filtro por Rol */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        
        {/* Fila de Filtros */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          
          {/* Buscador predictivo */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, usuario de login o cédula..." 
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.4rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>

          {/* Filtro Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Estado:</span>
            <select 
              value={filtroActivo} 
              onChange={e => { setFiltroActivo(e.target.value as any); setPage(1); }}
              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVOS">Solo Activos ✅</option>
              <option value="INACTIVOS">Suspendidos / Inactivos ⏸️</option>
            </select>
          </div>

          {/* Selector de Paginación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Filas:</span>
            <select 
              value={limit} 
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Pestañas de Roles */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          {[
            { id: 'TODOS', label: 'Todos los Colaboradores' },
            { id: 'GUARDIA', label: 'Guardias de Seguridad' },
            { id: 'SUPERVISOR', label: 'Supervisores' },
            { id: 'OPERADOR_C2', label: 'Operadores C2' },
            { id: 'ADMIN', label: 'Administradores' },
            { id: 'RESIDENTE', label: 'Residentes' }
          ].map(tab => {
            const active = filtroRol === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setFiltroRol(tab.id); setPage(1); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.825rem',
                  fontWeight: active ? '700' : '500',
                  border: 'none',
                  backgroundColor: active ? '#1e293b' : '#f1f5f9',
                  color: active ? '#FACC15' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Tabla de Personal */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ width: '2rem', height: '2rem', border: '3px solid #f3f3f3', borderTop: '3px solid #FACC15', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontWeight: '500' }}>Cargando directorio de personal...</p>
            <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155', margin: '0 0 0.5rem 0' }}>No se encontraron colaboradores</p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Intenta con otro filtro de búsqueda o da de alta un nuevo personal.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569' }}>Colaborador</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569' }}>Cédula / DNI</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569' }}>Contacto</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569' }}>Rol Asignado</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const isActivo = u.activo !== false;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: isActivo ? 1 : 0.65, backgroundColor: isActivo ? 'transparent' : '#fcfcfc' }}>
                      
                      {/* Nombre y Login */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '50%', 
                            backgroundColor: isActivo ? '#1e293b' : '#94a3b8', 
                            color: isActivo ? '#FACC15' : '#ffffff', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '0.85rem' 
                          }}>
                            {(u.nombre_completo || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e293b' }}>
                              {u.nombre_completo || 'Sin nombre registrado'}
                            </div>
                            <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                              Login: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td style={{ padding: '1rem 1.25rem', color: '#334155', fontWeight: '500' }}>
                        {u.cedula || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No declarada</span>}
                      </td>

                      {/* Teléfono */}
                      <td style={{ padding: '1rem 1.25rem', color: '#475569' }}>
                        {u.telefono ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={14} color="#64748b" />
                            {u.telefono}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>--</span>
                        )}
                      </td>

                      {/* Rol */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {getRoleBadge(u.rol)}
                      </td>

                      {/* Estado Activo / Toggle */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleEstado(u)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '1rem',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: isActivo ? '#dcfce7' : '#fee2e2',
                            color: isActivo ? '#15803d' : '#991b1b',
                            transition: 'all 0.2s'
                          }}
                          title={isActivo ? 'Click para suspender' : 'Click para activar'}
                        >
                          {isActivo ? <UserCheck size={12} /> : <UserX size={12} />}
                          {isActivo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            style={{
                              padding: '0.4rem 0.65rem',
                              backgroundColor: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            <Pencil size={13} />
                            <span>Editar</span>
                          </button>
                          
                          <button
                            onClick={() => setDeletingUser(u)}
                            style={{
                              padding: '0.4rem 0.65rem',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                            title="Eliminar lógicamente (SoftDelete)"
                          >
                            <Trash2 size={13} />
                            <span>Baja</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer con Paginación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Mostrando <b>{usuarios.length}</b> de un total de <b>{total}</b> registros registrados.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #cbd5e1', backgroundColor: '#fff',
                color: page <= 1 ? '#94a3b8' : '#334155',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem', fontWeight: '500'
              }}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: '600', padding: '0 0.5rem', color: '#1e293b' }}>
              Pág. {page} de {totalPages || 1}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #cbd5e1', backgroundColor: '#fff',
                color: page >= totalPages ? '#94a3b8' : '#334155',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem', fontWeight: '500'
              }}
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Modal Crear / Editar Colaborador */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '1rem',
            width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                {editingUserId ? 'Editar Información de Colaborador' : 'Registrar Nuevo Colaborador'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modalError && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                  {modalError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Nombre Completo del Colaborador *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Juan Carlos Pérez Soto"
                  value={formData.nombre_completo}
                  onChange={e => setFormData({ ...formData, nombre_completo: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Usuario / Email de Acceso *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: jperez o juan@seguridad.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Cédula de Identidad / DNI
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: 201-150890-0001A"
                    value={formData.cedula}
                    onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Teléfono Celular
                  </label>
                  <input 
                    type="text" 
                    placeholder="+505 8888-0000"
                    value={formData.telefono}
                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Rol Operativo *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={e => setFormData({ ...formData, rol: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}
                  >
                    {ROLES_DISPONIBLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  {editingUserId ? 'Nueva Contraseña (dejar en blanco para conservar actual)' : 'Contraseña de Acceso *'}
                </label>
                <input 
                  type="password" 
                  required={!editingUserId}
                  placeholder={editingUserId ? '••••••••' : 'Mínimo 6 caracteres'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input 
                  type="checkbox" 
                  id="activoCheck"
                  checked={formData.activo}
                  onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="activoCheck" style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                  Colaborador activo en plantilla operativa
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'transparent', color: '#475569', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'Guardando...' : editingUserId ? 'Actualizar Datos' : 'Registrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Carga Masiva (.CSV) */}
      {isBulkModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '1rem',
            width: '100%', maxWidth: '650px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSpreadsheet size={22} color="#0284c7" />
                Carga Masiva de Personal (.CSV)
              </h2>
              <button 
                onClick={() => { setIsBulkModalOpen(false); setCsvFile(null); setParsedRows([]); setBulkResult(null); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#0369a1' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Instrucciones de Importación:</div>
                El archivo debe incluir las columnas: <code>nombre_completo, email, cedula, telefono, rol, password</code>.
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={handleDownloadTemplate}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <Download size={14} />
                    Descargar Plantilla CSV de Ejemplo
                  </button>
                </div>
              </div>

              {/* Selector de Archivo */}
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '1rem' }}>
                <Upload size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#334155' }}>
                  {csvFile ? csvFile.name : 'Selecciona o arrastra el archivo .CSV de tu personal'}
                </p>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleCsvSelect}
                  style={{ display: 'none' }}
                  id="csvFileInput"
                />
                <label 
                  htmlFor="csvFileInput"
                  style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#1e293b', color: '#fff', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Examinar Archivo
                </label>
              </div>

              {/* Previsualización */}
              {parsedRows.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.5rem' }}>
                    Previsualización: {parsedRows.length} registros listos para importar
                  </div>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nombre</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Usuario</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Cédula</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Rol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.4rem 0.5rem' }}>{r.nombre_completo}</td>
                            <td style={{ padding: '0.4rem 0.5rem', fontFamily: 'monospace' }}>{r.email}</td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>{r.cedula}</td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>{r.rol}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 10 && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', textAlign: 'right' }}>
                      ... y {parsedRows.length - 10} registros más.
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje de Resultado */}
              {bulkResult && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.85rem', 
                  fontWeight: '500',
                  marginBottom: '1rem',
                  backgroundColor: bulkResult.success ? '#dcfce7' : '#fee2e2',
                  color: bulkResult.success ? '#15803d' : '#b91c1c',
                  border: `1px solid ${bulkResult.success ? '#bbf7d0' : '#fecaca'}`
                }}>
                  {bulkResult.message}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsBulkModalOpen(false); setCsvFile(null); setParsedRows([]); setBulkResult(null); }}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'transparent', color: '#475569', cursor: 'pointer' }}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={parsedRows.length === 0 || bulkSubmitting}
                  onClick={handleExecuteBulkUpload}
                  style={{ 
                    padding: '0.65rem 1.5rem', borderRadius: '0.5rem', border: 'none', 
                    backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 'bold', 
                    cursor: (parsedRows.length === 0 || bulkSubmitting) ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {bulkSubmitting ? 'Procesando e Importando...' : `Importar ${parsedRows.length} Colaboradores`}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal Confirmación SoftDelete */}
      {deletingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '1rem',
            width: '100%', maxWidth: '440px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', border: '1px solid #e2e8f0', padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#b91c1c' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Dar de Baja a Colaborador</h3>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
              ¿Estás seguro de dar de baja a <b>{deletingUser.nombre_completo || deletingUser.email}</b> ({deletingUser.rol})?
            </p>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.8rem', color: '#991b1b', marginBottom: '1.25rem' }}>
              🛡️ <b>SoftDelete Activo:</b> La cuenta se deshabilitará inmediatamente, pero no se borrará su historial de turnos, marcaciones ni bitácoras de auditoría en la base de datos.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingUser(null)}
                style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 'bold', cursor: isDeleting ? 'not-allowed' : 'pointer' }}
              >
                {isDeleting ? 'Procesando...' : 'Confirmar Baja'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

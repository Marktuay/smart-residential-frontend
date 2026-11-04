'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Building, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  KeyRound,
  FileText,
  UploadCloud,
  Check
} from 'lucide-react';
import { 
  residencialApi, 
  Casa, 
  Residente, 
  ResidencialInfo, 
  CasasPaginadas, 
  ResidentesPaginados 
} from '@/lib/api';

export default function ResidencialPage() {
  const [activeTab, setActiveTab] = useState<'casas' | 'residentes' | 'instalaciones'>('casas');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Mensajes de Alerta
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Catálogo completo de casas para selectores
  const [todasLasCasas, setTodasLasCasas] = useState<Casa[]>([]);

  // ==========================================
  // ESTADOS: CASAS (CON PAGINACIÓN EN SERVIDOR)
  // ==========================================
  const [casas, setCasas] = useState<Casa[]>([]);
  const [loadingCasas, setLoadingCasas] = useState(true);
  const [busquedaCasa, setBusquedaCasa] = useState('');
  const [filtroBloque, setFiltroBloque] = useState('TODOS');
  const [filtroEstadoCasa, setFiltroEstadoCasa] = useState('TODOS');
  const [pageCasa, setPageCasa] = useState(1);
  const [limitCasa, setLimitCasa] = useState(12);
  const [totalCasas, setTotalCasas] = useState(0);
  const [totalPagesCasa, setTotalPagesCasa] = useState(1);

  // Modales de Casas
  const [showCasaModal, setShowCasaModal] = useState(false);
  const [editingCasaId, setEditingCasaId] = useState<number | null>(null);
  const [casaFormData, setCasaFormData] = useState({
    numero_casa: '',
    bloque: '',
    estado: 'OCUPADA',
    tiene_contrato_seguridad: false,
  });
  const [casaModalError, setCasaModalError] = useState('');
  const [submittingCasa, setSubmittingCasa] = useState(false);

  // Expediente de Casa
  const [selectedCasaExpediente, setSelectedCasaExpediente] = useState<Casa | null>(null);
  const [expedienteTab, setExpedienteTab] = useState<'info' | 'residentes' | 'visitas' | 'documentos'>('info');

  // ==========================================
  // ESTADOS: RESIDENTES (PAGINACIÓN & RELACIÓN N:M)
  // ==========================================
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [loadingResidentes, setLoadingResidentes] = useState(true);
  const [busquedaResidente, setBusquedaResidente] = useState('');
  const [filtroPropietario, setFiltroPropietario] = useState<'TODOS' | 'PROPIETARIO' | 'INQUILINO'>('TODOS');
  const [pageResidente, setPageResidente] = useState(1);
  const [limitResidente, setLimitResidente] = useState(12);
  const [totalResidentes, setTotalResidentes] = useState(0);
  const [totalPagesResidente, setTotalPagesResidente] = useState(1);

  // Modales de Residentes
  const [showResidenteModal, setShowResidenteModal] = useState(false);
  const [editingResidenteId, setEditingResidenteId] = useState<number | null>(null);
  const [residenteFormData, setResidenteFormData] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    telefono_emergencia: '',
    email: '',
    es_propietario: true,
    casas_asignadas_ids: [] as number[],
  });
  const [residenteModalError, setResidenteModalError] = useState('');
  const [submittingResidente, setSubmittingResidente] = useState(false);

  // ==========================================
  // MODAL SOFTDELETE (CONFIRMACIÓN)
  // ==========================================
  const [deleteTarget, setDeleteTarget] = useState<{ tipo: 'casa' | 'residente'; id: number; nombre: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ==========================================
  // ESTADOS: INSTALACIONES (SOLO SISADMIN)
  // ==========================================
  const [instalaciones, setInstalaciones] = useState<ResidencialInfo[]>([]);
  const [loadingInstalaciones, setLoadingInstalaciones] = useState(false);
  const [showInstalacionForm, setShowInstalacionForm] = useState(false);
  const [nuevaInstalacion, setNuevaInstalacion] = useState<ResidencialInfo>({
    id: '', nombre: '', direccion: '', latitud_centro: 12.1364, longitud_centro: -86.2514, zoom_defecto: 13
  });

  // Inicialización de Rol y Carga
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
    cargarCatalogoCasas();
  }, []);

  // Cargar catálogo de casas completas (para asignación)
  const cargarCatalogoCasas = async () => {
    try {
      const data = await residencialApi.getCasas();
      setTodasLasCasas(data || []);
    } catch (e) {
      console.error('Error al cargar catálogo de casas:', e);
    }
  };

  // Cargar Casas con Paginación y Filtros
  const fetchCasasPaginadas = async () => {
    setLoadingCasas(true);
    setErrorMsg('');
    try {
      const res: CasasPaginadas = await residencialApi.getCasasPaginadas({
        page: pageCasa,
        limit: limitCasa,
        search: busquedaCasa.trim(),
        bloque: filtroBloque,
        estado: filtroEstadoCasa
      });
      setCasas(res.items || []);
      setTotalCasas(res.total || 0);
      setTotalPagesCasa(res.total_pages || 1);
    } catch (err: any) {
      console.error('Error al obtener casas:', err);
      setErrorMsg('No se pudieron cargar las casas. Verifica la conexión con el servidor.');
    } finally {
      setLoadingCasas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'casas') {
      fetchCasasPaginadas();
    }
  }, [pageCasa, limitCasa, filtroBloque, filtroEstadoCasa, activeTab]);

  // Debounce para búsqueda de casas
  useEffect(() => {
    if (activeTab !== 'casas') return;
    const timer = setTimeout(() => {
      setPageCasa(1);
      fetchCasasPaginadas();
    }, 350);
    return () => clearTimeout(timer);
  }, [busquedaCasa]);

  // Cargar Residentes con Paginación y Filtros
  const fetchResidentesPaginados = async () => {
    setLoadingResidentes(true);
    setErrorMsg('');
    try {
      const esPropParam = filtroPropietario === 'PROPIETARIO' ? true : filtroPropietario === 'INQUILINO' ? false : undefined;
      const res: ResidentesPaginados = await residencialApi.getResidentesPaginados({
        page: pageResidente,
        limit: limitResidente,
        search: busquedaResidente.trim(),
        es_propietario: esPropParam
      });
      setResidentes(res.items || []);
      setTotalResidentes(res.total || 0);
      setTotalPagesResidente(res.total_pages || 1);
    } catch (err: any) {
      console.error('Error al obtener residentes:', err);
      setErrorMsg('No se pudieron cargar los residentes.');
    } finally {
      setLoadingResidentes(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'residentes') {
      fetchResidentesPaginados();
    }
  }, [pageResidente, limitResidente, filtroPropietario, activeTab]);

  // Debounce para búsqueda de residentes
  useEffect(() => {
    if (activeTab !== 'residentes') return;
    const timer = setTimeout(() => {
      setPageResidente(1);
      fetchResidentesPaginados();
    }, 350);
    return () => clearTimeout(timer);
  }, [busquedaResidente]);

  // Cargar Instalaciones (SISADMIN)
  const fetchInstalaciones = async () => {
    setLoadingInstalaciones(true);
    try {
      const data = await residencialApi.getResidenciales();
      setInstalaciones(data || []);
    } catch (e) {
      console.error('Error al obtener instalaciones:', e);
    } finally {
      setLoadingInstalaciones(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'instalaciones' && userRole === 'SISADMIN') {
      fetchInstalaciones();
    }
  }, [activeTab, userRole]);

  // ==========================================
  // HANDLERS: CASAS
  // ==========================================
  const handleOpenCreateCasa = () => {
    setEditingCasaId(null);
    setCasaFormData({
      numero_casa: '',
      bloque: '',
      estado: 'OCUPADA',
      tiene_contrato_seguridad: true,
    });
    setCasaModalError('');
    setShowCasaModal(true);
  };

  const handleOpenEditCasa = (casa: Casa) => {
    setEditingCasaId(casa.id || null);
    setCasaFormData({
      numero_casa: casa.numero_casa,
      bloque: casa.bloque || '',
      estado: casa.estado || 'OCUPADA',
      tiene_contrato_seguridad: !!casa.tiene_contrato_seguridad,
    });
    setCasaModalError('');
    setShowCasaModal(true);
  };

  const handleSaveCasa = async (e: React.FormEvent) => {
    e.preventDefault();
    setCasaModalError('');
    setSubmittingCasa(true);

    try {
      if (editingCasaId) {
        await residencialApi.updateCasa(editingCasaId, casaFormData);
        setSuccessMsg(`Casa ${casaFormData.numero_casa} actualizada exitosamente.`);
      } else {
        await residencialApi.createCasa(casaFormData);
        setSuccessMsg(`Casa ${casaFormData.numero_casa} registrada exitosamente.`);
      }

      setShowCasaModal(false);
      fetchCasasPaginadas();
      cargarCatalogoCasas();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Error al guardar la vivienda.';
      if (err.response?.status === 409 || msg.includes('DUPLICATE_CASA')) {
        setCasaModalError(msg.replace('DUPLICATE_CASA: ', ''));
      } else {
        setCasaModalError(msg);
      }
    } finally {
      setSubmittingCasa(false);
    }
  };

  // ==========================================
  // HANDLERS: RESIDENTES
  // ==========================================
  const handleOpenCreateResidente = () => {
    setEditingResidenteId(null);
    setResidenteFormData({
      nombre: '',
      cedula: '',
      telefono: '',
      telefono_emergencia: '',
      email: '',
      es_propietario: true,
      casas_asignadas_ids: [],
    });
    setResidenteModalError('');
    setShowResidenteModal(true);
  };

  const handleOpenEditResidente = (residente: Residente) => {
    setEditingResidenteId(residente.id || null);
    setResidenteFormData({
      nombre: residente.nombre,
      cedula: residente.cedula || '',
      telefono: residente.telefono || '',
      telefono_emergencia: residente.telefono_emergencia || '',
      email: residente.email || '',
      es_propietario: residente.es_propietario,
      casas_asignadas_ids: residente.casas_asignadas_ids || (residente.casa_id ? [residente.casa_id] : []),
    });
    setResidenteModalError('');
    setShowResidenteModal(true);
  };

  const handleToggleCasaAsignada = (casaId: number) => {
    const ids = residenteFormData.casas_asignadas_ids;
    if (ids.includes(casaId)) {
      setResidenteFormData({
        ...residenteFormData,
        casas_asignadas_ids: ids.filter(id => id !== casaId)
      });
    } else {
      setResidenteFormData({
        ...residenteFormData,
        casas_asignadas_ids: [...ids, casaId]
      });
    }
  };

  const handleSaveResidente = async (e: React.FormEvent) => {
    e.preventDefault();
    setResidenteModalError('');
    setSubmittingResidente(true);

    try {
      if (editingResidenteId) {
        await residencialApi.updateResidente(editingResidenteId, residenteFormData);
        setSuccessMsg(`Residente ${residenteFormData.nombre} actualizado exitosamente.`);
      } else {
        await residencialApi.createResidente(residenteFormData);
        setSuccessMsg(`Residente ${residenteFormData.nombre} registrado con ${residenteFormData.casas_asignadas_ids.length} casa(s) asignada(s).`);
      }

      setShowResidenteModal(false);
      fetchResidentesPaginados();
      fetchCasasPaginadas(); // para refrescar nombres de habitantes en casas
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Error al guardar el residente.';
      if (err.response?.status === 409 || msg.includes('DUPLICATE_RESIDENTE')) {
        setResidenteModalError(msg.replace('DUPLICATE_RESIDENTE: ', ''));
      } else {
        setResidenteModalError(msg);
      }
    } finally {
      setSubmittingResidente(false);
    }
  };

  // ==========================================
  // CONFIRMAR SOFTDELETE
  // ==========================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.tipo === 'casa') {
        await residencialApi.deleteCasa(deleteTarget.id);
        setSuccessMsg(`Casa ${deleteTarget.nombre} archivada correctamente.`);
        fetchCasasPaginadas();
        cargarCatalogoCasas();
      } else {
        await residencialApi.deleteResidente(deleteTarget.id);
        setSuccessMsg(`Residente ${deleteTarget.nombre} archivado correctamente.`);
        fetchResidentesPaginados();
        fetchCasasPaginadas();
      }
      setDeleteTarget(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data || err.message || 'Error al eliminar el registro.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // HANDLER: INSTALACIÓN (SISADMIN)
  // ==========================================
  const handleCreateInstalacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await residencialApi.createResidencial(nuevaInstalacion);
      setShowInstalacionForm(false);
      setNuevaInstalacion({ id: '', nombre: '', direccion: '', latitud_centro: 12.1364, longitud_centro: -86.2514, zoom_defecto: 13 });
      fetchInstalaciones();
      setSuccessMsg(`Instalación ${nuevaInstalacion.nombre} creada exitosamente.`);
    } catch (err: any) {
      setErrorMsg(err.response?.data || err.message || 'Error al registrar residencial.');
    }
  };

  // Obtener lista única de bloques para el filtro
  const listaBloques = Array.from(new Set(todasLasCasas.map(c => c.bloque).filter(Boolean)));

  return (
    <div style={{ maxWidth: '100%', width: '100%', minWidth: 0, boxSizing: 'border-box', color: '#1e293b' }}>
      
      {/* Encabezado Principal y Pestañas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Home size={28} color="#FACC15" />
            Gestión Residencial & Expediente de Casas
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Aislamiento estricto, prevención de duplicados, contratos de seguridad y relación 1:N de residentes a viviendas.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#ffffff', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <button
            onClick={() => setActiveTab('casas')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: activeTab === 'casas' ? '#1e293b' : 'transparent',
              color: activeTab === 'casas' ? '#FACC15' : '#64748b',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Home size={16} />
            <span>Casas / Viviendas ({totalCasas})</span>
          </button>

          <button
            onClick={() => setActiveTab('residentes')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: activeTab === 'residentes' ? '#1e293b' : 'transparent',
              color: activeTab === 'residentes' ? '#FACC15' : '#64748b',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Users size={16} />
            <span>Directorio Residentes ({totalResidentes})</span>
          </button>

          {userRole === 'SISADMIN' && (
            <button
              onClick={() => setActiveTab('instalaciones')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: activeTab === 'instalaciones' ? '#1e293b' : 'transparent',
                color: activeTab === 'instalaciones' ? '#FACC15' : '#64748b',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Building size={16} />
              <span>Instalaciones</span>
            </button>
          )}
        </div>
      </div>

      {/* Banners de Notificaciones Globales */}
      {errorMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.25rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '0.5rem', marginBottom: '1.25rem', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 1: CASAS / VIVIENDAS */}
      {/* ======================================================== */}
      {activeTab === 'casas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Barra de Filtros, Búsqueda y Botón Nuevo */}
          <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            
            {/* Buscador y Filtros */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar por número de casa, sector o residente..."
                  value={busquedaCasa}
                  onChange={(e) => setBusquedaCasa(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Filtro Sector */}
              <select
                value={filtroBloque}
                onChange={(e) => { setFiltroBloque(e.target.value); setPageCasa(1); }}
                style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem', color: '#334155' }}
              >
                <option value="TODOS">Todos los Sectores</option>
                {listaBloques.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Filtro Estado */}
              <select
                value={filtroEstadoCasa}
                onChange={(e) => { setFiltroEstadoCasa(e.target.value); setPageCasa(1); }}
                style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem', color: '#334155' }}
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="OCUPADA">Ocupada</option>
                <option value="DESOCUPADA">Desocupada</option>
                <option value="EN_CONSTRUCCION">En Construcción</option>
              </select>
            </div>

            {/* Botón Nueva Casa */}
            <button
              onClick={handleOpenCreateCasa}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.65rem 1.25rem', backgroundColor: '#FACC15', color: '#1e293b',
                border: 'none', borderRadius: '0.5rem', fontWeight: 'bold',
                cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            >
              <Plus size={18} />
              <span>Registrar Casa</span>
            </button>
          </div>

          {/* Grilla de Viviendas */}
          {loadingCasas ? (
            <div style={{ backgroundColor: '#fff', padding: '4rem', textAlign: 'center', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '2rem', height: '2rem', border: '3px solid #f3f3f3', borderTop: '3px solid #FACC15', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0, color: '#64748b' }}>Cargando viviendas del residencial...</p>
              <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
            </div>
          ) : casas.length === 0 ? (
            <div style={{ backgroundColor: '#fff', padding: '4rem 2rem', textAlign: 'center', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <Home size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#334155', fontWeight: 'bold' }}>No se encontraron viviendas</h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Prueba con otro filtro o registra una nueva casa con validación anti-duplicados.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {casas.map((casa) => {
                const tieneContrato = !!casa.tiene_contrato_seguridad;
                return (
                  <div
                    key={casa.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div>
                      {/* Cabecera de la Tarjeta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                            Casa {casa.numero_casa}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Sector / Bloque: <span style={{ fontWeight: '600', color: '#334155' }}>{casa.bloque || 'General'}</span>
                          </div>
                        </div>

                        {/* Badge de Ocupación */}
                        <span style={{
                          padding: '0.2rem 0.55rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 'bold',
                          backgroundColor: casa.estado === 'OCUPADA' ? '#dcfce7' : '#f1f5f9',
                          color: casa.estado === 'OCUPADA' ? '#15803d' : '#64748b',
                          border: `1px solid ${casa.estado === 'OCUPADA' ? '#bbf7d0' : '#e2e8f0'}`
                        }}>
                          {casa.estado}
                        </span>
                      </div>

                      {/* Badge de Contrato de Seguridad */}
                      <div style={{ marginBottom: '1rem' }}>
                        {tieneContrato ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ecfdf5', color: '#047857', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #a7f3d0' }}>
                            <ShieldCheck size={14} color="#059669" />
                            <span>Contrato de Seguridad NCS Activo</span>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #fecaca' }}>
                            <ShieldAlert size={14} color="#dc2626" />
                            <span>Sin Contrato de Seguridad</span>
                          </div>
                        )}
                      </div>

                      {/* Residentes / Habitantes */}
                      <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          Habitante(s) Asociado(s):
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: casa.residentes_nombres ? '600' : 'normal' }}>
                          {casa.residentes_nombres || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin residentes registrados</span>}
                        </div>
                      </div>
                    </div>

                    {/* Botonera de Acciones */}
                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                      <button
                        onClick={() => {
                          setSelectedCasaExpediente(casa);
                          setExpedienteTab('info');
                        }}
                        style={{
                          flex: 1, padding: '0.45rem', backgroundColor: '#f1f5f9', color: '#334155',
                          border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontWeight: '600',
                          fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                        }}
                      >
                        <Eye size={15} color="#0284c7" />
                        <span>Expediente</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditCasa(casa)}
                        style={{
                          padding: '0.45rem 0.75rem', backgroundColor: '#fff', color: '#334155',
                          border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer'
                        }}
                        title="Modificar vivienda"
                      >
                        <Pencil size={15} color="#475569" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ tipo: 'casa', id: casa.id!, nombre: casa.numero_casa })}
                        style={{
                          padding: '0.45rem 0.75rem', backgroundColor: '#fff', color: '#ef4444',
                          border: '1px solid #fecaca', borderRadius: '0.375rem', cursor: 'pointer'
                        }}
                        title="Archivar / Eliminar"
                      >
                        <Trash2 size={15} color="#dc2626" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Barra de Paginación en Servidor */}
          {totalCasas > 0 && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ color: '#64748b' }}>
                Mostrando <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{casas.length}</span> de <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{totalCasas}</span> casas registradas
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Por pág:</span>
                  <select
                    value={limitCasa}
                    onChange={(e) => { setLimitCasa(Number(e.target.value)); setPageCasa(1); }}
                    style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPageCasa(p => Math.max(p - 1, 1))}
                    disabled={pageCasa <= 1}
                    style={{ padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: pageCasa <= 1 ? 'not-allowed' : 'pointer', opacity: pageCasa <= 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontWeight: '600', color: '#334155' }}>Página {pageCasa} de {totalPagesCasa}</span>
                  <button
                    onClick={() => setPageCasa(p => Math.min(p + 1, totalPagesCasa))}
                    disabled={pageCasa >= totalPagesCasa}
                    style={{ padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: pageCasa >= totalPagesCasa ? 'not-allowed' : 'pointer', opacity: pageCasa >= totalPagesCasa ? 0.4 : 1 }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: RESIDENTES (DIRECTORIO Y ASIGNACIÓN 1:N) */}
      {/* ======================================================== */}
      {activeTab === 'residentes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Barra de Filtros y Búsqueda */}
          <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula, teléfono o email..."
                  value={busquedaResidente}
                  onChange={(e) => setBusquedaResidente(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Filtro Propietario / Inquilino */}
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', padding: '0.2rem' }}>
                <button
                  onClick={() => { setFiltroPropietario('TODOS'); setPageResidente(1); }}
                  style={{
                    padding: '0.35rem 0.65rem', borderRadius: '0.25rem', border: 'none',
                    backgroundColor: filtroPropietario === 'TODOS' ? '#1e293b' : 'transparent',
                    color: filtroPropietario === 'TODOS' ? '#FACC15' : '#64748b',
                    fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
                  }}
                >
                  Todos
                </button>
                <button
                  onClick={() => { setFiltroPropietario('PROPIETARIO'); setPageResidente(1); }}
                  style={{
                    padding: '0.35rem 0.65rem', borderRadius: '0.25rem', border: 'none',
                    backgroundColor: filtroPropietario === 'PROPIETARIO' ? '#1e293b' : 'transparent',
                    color: filtroPropietario === 'PROPIETARIO' ? '#FACC15' : '#64748b',
                    fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
                  }}
                >
                  Propietarios
                </button>
                <button
                  onClick={() => { setFiltroPropietario('INQUILINO'); setPageResidente(1); }}
                  style={{
                    padding: '0.35rem 0.65rem', borderRadius: '0.25rem', border: 'none',
                    backgroundColor: filtroPropietario === 'INQUILINO' ? '#1e293b' : 'transparent',
                    color: filtroPropietario === 'INQUILINO' ? '#FACC15' : '#64748b',
                    fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer'
                  }}
                >
                  Inquilinos
                </button>
              </div>
            </div>

            {/* Botón Nuevo Residente */}
            <button
              onClick={handleOpenCreateResidente}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.65rem 1.25rem', backgroundColor: '#FACC15', color: '#1e293b',
                border: 'none', borderRadius: '0.5rem', fontWeight: 'bold',
                cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            >
              <Plus size={18} />
              <span>Nuevo Residente</span>
            </button>
          </div>

          {/* Grilla de Residentes */}
          {loadingResidentes ? (
            <div style={{ backgroundColor: '#fff', padding: '4rem', textAlign: 'center', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '2rem', height: '2rem', border: '3px solid #f3f3f3', borderTop: '3px solid #FACC15', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0, color: '#64748b' }}>Cargando directorio de residentes...</p>
              <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
            </div>
          ) : residentes.length === 0 ? (
            <div style={{ backgroundColor: '#fff', padding: '4rem 2rem', textAlign: 'center', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#334155', fontWeight: 'bold' }}>No se encontraron residentes</h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Registra al primer habitante o propietario del residencial con cédula única.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {residentes.map((res) => {
                const casasList = res.casas_detalle || [];
                return (
                  <div
                    key={res.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div>
                      {/* Cabecera: Iniciales + Nombre + Tipo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '50%',
                          backgroundColor: '#1e293b', color: '#FACC15',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: '1rem', flexShrink: 0
                        }}>
                          {res.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {res.nombre}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                            <span style={{
                              padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 'bold',
                              backgroundColor: res.es_propietario ? '#eff6ff' : '#f1f5f9',
                              color: res.es_propietario ? '#1d4ed8' : '#475569',
                              border: `1px solid ${res.es_propietario ? '#bfdbfe' : '#e2e8f0'}`
                            }}>
                              {res.es_propietario ? 'Propietario' : 'Inquilino'}
                            </span>
                            {res.cedula && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                ID: <span style={{ fontFamily: 'monospace' }}>{res.cedula}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Datos de Contacto */}
                      <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Phone size={14} color="#64748b" />
                          <span>{res.telefono || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin teléfono registrado</span>}</span>
                        </div>
                        {res.telefono_emergencia && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c' }}>
                            <Phone size={14} color="#dc2626" />
                            <span>Emergencia: {res.telefono_emergencia}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Mail size={14} color="#64748b" />
                          <span>{res.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin correo electrónico</span>}</span>
                        </div>
                      </div>

                      {/* Casas Asignadas (Relación 1:N) */}
                      <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                          Vivienda(s) Asignada(s) ({casasList.length || (res.numero_casa ? 1 : 0)}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {casasList.length > 0 ? (
                            casasList.map((c) => (
                              <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                <Home size={12} color="#0284c7" />
                                Casa {c.numero_casa}
                                {c.bloque ? ` (${c.bloque})` : ''}
                              </span>
                            ))
                          ) : res.numero_casa ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600' }}>
                              <Home size={12} color="#0284c7" />
                              Casa {res.numero_casa}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>Ninguna casa vinculada</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botonera Acciones */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <button
                        onClick={() => handleOpenEditResidente(res)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.45rem 0.85rem', backgroundColor: '#fff', color: '#334155',
                          border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8rem',
                          fontWeight: '600', cursor: 'pointer'
                        }}
                      >
                        <Pencil size={14} color="#475569" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ tipo: 'residente', id: res.id!, nombre: res.nombre })}
                        style={{
                          padding: '0.45rem 0.75rem', backgroundColor: '#fff', color: '#ef4444',
                          border: '1px solid #fecaca', borderRadius: '0.375rem', cursor: 'pointer'
                        }}
                        title="Archivar residente"
                      >
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Barra de Paginación en Servidor */}
          {totalResidentes > 0 && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ color: '#64748b' }}>
                Mostrando <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{residentes.length}</span> de <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{totalResidentes}</span> residentes
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Por pág:</span>
                  <select
                    value={limitResidente}
                    onChange={(e) => { setLimitResidente(Number(e.target.value)); setPageResidente(1); }}
                    style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPageResidente(p => Math.max(p - 1, 1))}
                    disabled={pageResidente <= 1}
                    style={{ padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: pageResidente <= 1 ? 'not-allowed' : 'pointer', opacity: pageResidente <= 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontWeight: '600', color: '#334155' }}>Página {pageResidente} de {totalPagesResidente}</span>
                  <button
                    onClick={() => setPageResidente(p => Math.min(p + 1, totalPagesResidente))}
                    disabled={pageResidente >= totalPagesResidente}
                    style={{ padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: pageResidente >= totalPagesResidente ? 'not-allowed' : 'pointer', opacity: pageResidente >= totalPagesResidente ? 0.4 : 1 }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: INSTALACIONES (SOLO SISADMIN) */}
      {/* ======================================================== */}
      {activeTab === 'instalaciones' && userRole === 'SISADMIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowInstalacionForm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.65rem 1.25rem', backgroundColor: '#FACC15', color: '#1e293b',
                border: 'none', borderRadius: '0.5rem', fontWeight: 'bold',
                cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              <Plus size={18} /> Registrar Nueva Instalación
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {instalaciones.map((inst) => (
              <div key={inst.id} style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Building size={20} color="#0284c7" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{inst.nombre}</h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>ID: <span style={{ fontFamily: 'monospace' }}>{inst.id}</span></div>
                <div style={{ fontSize: '0.825rem', color: '#475569' }}>{inst.direccion || 'Sin dirección registrada'}</div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                  Coordenadas: {inst.latitud_centro}, {inst.longitud_centro} (Zoom {inst.zoom_defecto})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CREAR / EDITAR CASA (CON VALIDACIÓN ANTI-DUPLICADOS) */}
      {/* ======================================================== */}
      {showCasaModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1rem', width: '100%', maxWidth: '460px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Home size={22} color="#FACC15" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                  {editingCasaId ? 'Modificar Vivienda' : 'Registrar Casa / Vivienda'}
                </h3>
              </div>
              <button onClick={() => setShowCasaModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {casaModalError && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #fecaca', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{casaModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCasa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Número de Casa / Lote *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. A-12, 104, Manzana 3 Lote 8"
                  value={casaFormData.numero_casa}
                  onChange={(e) => setCasaFormData({ ...casaFormData, numero_casa: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Bloque / Sector / Etapa</label>
                <input
                  type="text"
                  placeholder="Ej. Sector A, Etapa 2, Calle Roble"
                  value={casaFormData.bloque}
                  onChange={(e) => setCasaFormData({ ...casaFormData, bloque: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Estado de Ocupación</label>
                <select
                  value={casaFormData.estado}
                  onChange={(e) => setCasaFormData({ ...casaFormData, estado: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
                >
                  <option value="OCUPADA">Ocupada</option>
                  <option value="DESOCUPADA">Desocupada / Vacía</option>
                  <option value="EN_CONSTRUCCION">En Construcción</option>
                </select>
              </div>

              {/* Checkbox Contrato de Seguridad */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={casaFormData.tiene_contrato_seguridad}
                  onChange={(e) => setCasaFormData({ ...casaFormData, tiene_contrato_seguridad: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>Tiene Contrato de Seguridad Activo</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Habilita prioridad de patrullaje, rondas QR y control de accesos</div>
                </div>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCasaModal(false)} style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button type="submit" disabled={submittingCasa} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: 'pointer' }}>
                  {submittingCasa ? 'Guardando...' : editingCasaId ? 'Actualizar Casa' : 'Guardar Casa'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CREAR / EDITAR RESIDENTE (CON ASIGNACIÓN 1:N CASAS) */}
      {/* ======================================================== */}
      {showResidenteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1rem', width: '100%', maxWidth: '580px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={22} color="#0284c7" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                  {editingResidenteId ? 'Modificar Residente' : 'Registrar Nuevo Residente'}
                </h3>
              </div>
              <button onClick={() => setShowResidenteModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {residenteModalError && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #fecaca', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{residenteModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveResidente} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Morales Solís"
                  value={residenteFormData.nombre}
                  onChange={(e) => setResidenteFormData({ ...residenteFormData, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Cédula / DNI</label>
                  <input
                    type="text"
                    placeholder="001-010190-0001A"
                    value={residenteFormData.cedula}
                    onChange={(e) => setResidenteFormData({ ...residenteFormData, cedula: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Tipo de Residente</label>
                  <select
                    value={residenteFormData.es_propietario ? 'propietario' : 'inquilino'}
                    onChange={(e) => setResidenteFormData({ ...residenteFormData, es_propietario: e.target.value === 'propietario' })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff' }}
                  >
                    <option value="propietario">Propietario</option>
                    <option value="inquilino">Inquilino / Habitante</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Teléfono Móvil</label>
                  <input
                    type="text"
                    placeholder="+505 8899-0011"
                    value={residenteFormData.telefono}
                    onChange={(e) => setResidenteFormData({ ...residenteFormData, telefono: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Teléfono Emergencia</label>
                  <input
                    type="text"
                    placeholder="+505 8777-2233"
                    value={residenteFormData.telefono_emergencia}
                    onChange={(e) => setResidenteFormData({ ...residenteFormData, telefono_emergencia: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="roberto.morales@gmail.com"
                  value={residenteFormData.email}
                  onChange={(e) => setResidenteFormData({ ...residenteFormData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Selector de Asignación Múltiple de Casas (1 Residente -> N Casas) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>
                  Vivienda(s) Asignada(s) (Un residente puede tener varias casas)
                </label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem', backgroundColor: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.4rem' }}>
                  {todasLasCasas.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', padding: '0.5rem', gridColumn: '1 / -1' }}>
                      No hay casas registradas aún. Registra primero las viviendas.
                    </div>
                  ) : (
                    todasLasCasas.map((c) => {
                      const isSelected = residenteFormData.casas_asignadas_ids.includes(c.id!);
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleToggleCasaAsignada(c.id!)}
                          style={{
                            padding: '0.35rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600',
                            backgroundColor: isSelected ? '#1e293b' : '#fff',
                            color: isSelected ? '#FACC15' : '#334155',
                            border: `1px solid ${isSelected ? '#1e293b' : '#cbd5e1'}`,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            userSelect: 'none'
                          }}
                        >
                          <span>Casa {c.numero_casa}</span>
                          {isSelected && <Check size={14} color="#FACC15" />}
                        </div>
                      );
                    })
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Seleccionadas: {residenteFormData.casas_asignadas_ids.length} vivienda(s)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowResidenteModal(false)} style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button type="submit" disabled={submittingResidente} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: 'pointer' }}>
                  {submittingResidente ? 'Guardando...' : editingResidenteId ? 'Actualizar Residente' : 'Guardar Residente'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EXPEDIENTE DIGITAL DE VIVIENDA */}
      {/* ======================================================== */}
      {selectedCasaExpediente && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1rem', width: '100%', maxWidth: '750px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Home size={26} color="#0284c7" />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                    Expediente Digital: Casa {selectedCasaExpediente.numero_casa}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                    Sector / Bloque: {selectedCasaExpediente.bloque || 'General'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCasaExpediente(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Pestañas del Expediente */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              {[
                { key: 'info', label: 'Datos Generales' },
                { key: 'residentes', label: 'Habitantes' },
                { key: 'visitas', label: 'Accesos Recientes' },
                { key: 'documentos', label: 'Documentos' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setExpedienteTab(tab.key as any)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    border: 'none',
                    borderBottom: expedienteTab === tab.key ? '2px solid #FACC15' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: expedienteTab === tab.key ? '#1e293b' : '#64748b',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pestaña: Info General */}
            {expedienteTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>NÚMERO DE CASA:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>Casa {selectedCasaExpediente.numero_casa}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>SECTOR / BLOQUE:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{selectedCasaExpediente.bloque || 'General'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>ESTADO DE OCUPACIÓN:</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: selectedCasaExpediente.estado === 'OCUPADA' ? '#15803d' : '#64748b' }}>
                      {selectedCasaExpediente.estado}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>CONTRATO DE SEGURIDAD:</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: selectedCasaExpediente.tiene_contrato_seguridad ? '#059669' : '#dc2626' }}>
                      {selectedCasaExpediente.tiene_contrato_seguridad ? '✓ Activo' : '✗ Inactivo'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña: Residentes */}
            {expedienteTab === 'residentes' && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#334155', marginBottom: '0.5rem' }}>
                  Habitantes registrados para esta vivienda:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {selectedCasaExpediente.residentes_nombres ? (
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{selectedCasaExpediente.residentes_nombres}</div>
                  ) : (
                    'No hay residentes asignados a esta casa. Puedes asociar residentes desde la pestaña Directorio Residentes.'
                  )}
                </div>
              </div>
            )}

            {/* Pestaña: Visitas */}
            {expedienteTab === 'visitas' && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
                Bitácora de visitantes y vehículos ingresados para la Casa {selectedCasaExpediente.numero_casa}. Los registros se actualizan automáticamente desde el módulo de Control de Accesos / Garita.
              </div>
            )}

            {/* Pestaña: Documentos */}
            {expedienteTab === 'documentos' && (
              <div style={{ border: '2px dashed #cbd5e1', padding: '2rem', textAlign: 'center', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
                <UploadCloud size={32} color="#0284c7" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#334155' }}>Adjuntar Contratos o Escrituras</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Formatos permitidos: PDF, JPG, PNG</div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedCasaExpediente(null)}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CONFIRMACIÓN SOFTDELETE */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1rem', width: '100%', maxWidth: '420px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>
                  ¿Archivar {deleteTarget.tipo === 'casa' ? 'Vivienda' : 'Residente'}?
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {deleteTarget.tipo === 'casa' ? `Casa ${deleteTarget.nombre}` : deleteTarget.nombre}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
              Esta entidad será archivada mediante <strong>SoftDelete</strong>. No se perderá el historial de auditoría ni los registros de marcaciones asociadas.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isDeleting ? 'Archivando...' : 'Confirmar Eliminación'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CREAR INSTALACIÓN (SISADMIN) */}
      {/* ======================================================== */}
      {showInstalacionForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1rem', width: '100%', maxWidth: '440px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Registrar Instalación Residencial</h3>
              <button onClick={() => setShowInstalacionForm(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateInstalacion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Código Único del Residencial *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. colinas_ncs"
                  value={nuevaInstalacion.id}
                  onChange={(e) => setNuevaInstalacion({ ...nuevaInstalacion, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Residencial Las Colinas"
                  value={nuevaInstalacion.nombre}
                  onChange={(e) => setNuevaInstalacion({ ...nuevaInstalacion, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.35rem' }}>Dirección</label>
                <input
                  type="text"
                  placeholder="Dirección física o ciudad"
                  value={nuevaInstalacion.direccion}
                  onChange={(e) => setNuevaInstalacion({ ...nuevaInstalacion, direccion: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowInstalacionForm(false)} style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: 'pointer' }}>Crear Residencial</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

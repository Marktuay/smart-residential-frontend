'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  Plus, 
  UploadCloud, 
  MapPin, 
  UserCheck, 
  X, 
  FileText, 
  Camera, 
  Filter, 
  ShieldAlert,
  Search,
  ExternalLink,
  Building,
  RefreshCw,
  Home,
  Check,
  ShieldCheck,
  Eye,
  Trash2
} from 'lucide-react';
import { 
  incidentesApi, 
  residencialApi, 
  puntosQrApi,
  Incidente, 
  Casa, 
  PuntoQR, 
  ResidencialInfo 
} from '@/lib/api';

export default function IncidentesPage() {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // SISADMIN Multi-tenant
  const [userRole, setUserRole] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterGravedad, setFilterGravedad] = useState<string>('TODAS');

  // Modal Reportar Incidente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedBase64Image, setUploadedBase64Image] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'Seguridad (Intruso/Robo)',
    descripcion: '',
    nivel_gravedad: 'MEDIA',
    reportado_por: '',
    ubicacion_tipo: 'CASA', // CASA, PUNTO, GENERAL
    casa_id: '',
    punto_id: '',
    ubicacion_texto: ''
  });

  // Modal Ver Detalle / Evidencia Zoom
  const [selectedIncidente, setSelectedIncidente] = useState<Incidente | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    const resId = localStorage.getItem('residencial_id') || '';
    const userEmail = localStorage.getItem('user_email') || 'Guardia de Turno';
    setUserRole(role);
    setSelectedResidencialId(resId);
    setFormData(prev => ({ ...prev, reportado_por: userEmail }));

    if (role === 'SISADMIN') {
      residencialApi.getResidenciales().then(list => setResidenciales(list || [])).catch(() => {});
    }

    fetchData(resId);
  }, []);

  const fetchData = async (resId?: string) => {
    const activeResId = resId !== undefined ? resId : (localStorage.getItem('residencial_id') || '');
    if (!activeResId) {
      setIncidentes([]);
      setCasas([]);
      setPuntos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [dataInc, dataCasas, dataPuntos] = await Promise.all([
        incidentesApi.getIncidentes().catch(() => []),
        residencialApi.getCasas().catch(() => []),
        puntosQrApi.getPuntos().catch(() => [])
      ]);

      setIncidentes(dataInc || []);
      setCasas(dataCasas || []);
      setPuntos(dataPuntos || []);
    } catch (error) {
      console.error("Error fetching incidentes:", error);
      setErrorMsg("Error cargando los incidentes del residencial.");
    } finally {
      setLoading(false);
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

  // Convertir imagen subida a Data-URI Base64 persistente
  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen excede el límite recomendado de 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedBase64Image(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descripcion.trim()) {
      alert('Ingrese una descripción para el reporte.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Construir ubicación formateada
      let ubicacionFinal = '';
      if (formData.ubicacion_tipo === 'CASA' && formData.casa_id) {
        const c = casas.find(item => item.id === parseInt(formData.casa_id));
        ubicacionFinal = c ? `Casa ${c.numero_casa} (Bloque ${c.bloque})` : `Casa ID #${formData.casa_id}`;
      } else if (formData.ubicacion_tipo === 'PUNTO' && formData.punto_id) {
        const p = puntos.find(item => item.id === parseInt(formData.punto_id));
        ubicacionFinal = p ? `${p.nombre} (${p.codigo_qr})` : `Punto #${formData.punto_id}`;
      } else {
        ubicacionFinal = formData.ubicacion_texto || 'Área Común / No especificada';
      }

      await incidentesApi.createIncidente({
        tipo: formData.tipo,
        nivel_gravedad: formData.nivel_gravedad,
        descripcion: formData.descripcion.trim(),
        reportado_por: formData.reportado_por || 'Guardia de Turno',
        evidencia_url: uploadedBase64Image || undefined,
        ubicacion: ubicacionFinal
      });

      setSuccessMsg('Incidente registrado con éxito e integrado al Centro de Mando.');
      setTimeout(() => setSuccessMsg(''), 4500);
      setIsModalOpen(false);
      resetForm();
      fetchData(selectedResidencialId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al guardar el incidente. Verifique los campos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolver = async (id: number) => {
    setResolvingId(id);
    try {
      await incidentesApi.resolverIncidente(id);
      setSuccessMsg(`Incidente #${id} marcado como RESUELTO.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData(selectedResidencialId);
      if (selectedIncidente && selectedIncidente.id === id) {
        setSelectedIncidente(prev => prev ? { ...prev, estado: 'RESUELTO' } : null);
      }
    } catch (error) {
      console.error("Error resolviendo incidente", error);
      alert('Error al resolver el incidente.');
    } finally {
      setResolvingId(null);
    }
  };

  const resetForm = () => {
    const userEmail = localStorage.getItem('user_email') || 'Guardia de Turno';
    setFormData({
      tipo: 'Seguridad (Intruso/Robo)',
      descripcion: '',
      nivel_gravedad: 'MEDIA',
      reportado_por: userEmail,
      ubicacion_tipo: 'CASA',
      casa_id: '',
      punto_id: '',
      ubicacion_texto: ''
    });
    setUploadedBase64Image('');
  };

  // Filtrado
  const filteredIncidentes = incidentes.filter(i => {
    const matchesEstado = filterEstado === 'TODOS' || i.estado === filterEstado;
    const matchesGravedad = filterGravedad === 'TODAS' || i.nivel_gravedad === filterGravedad;
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      i.tipo.toLowerCase().includes(q) ||
      i.descripcion.toLowerCase().includes(q) ||
      (i.ubicacion && i.ubicacion.toLowerCase().includes(q)) ||
      (i.reportado_por && i.reportado_por.toLowerCase().includes(q));

    return matchesEstado && matchesGravedad && matchesSearch;
  });

  const abiertosCount = incidentes.filter(i => i.estado === 'ABIERTO').length;
  const criticosCount = incidentes.filter(i => (i.nivel_gravedad === 'ALTA' || i.nivel_gravedad === 'CRÍTICA') && i.estado === 'ABIERTO').length;
  const resueltosCount = incidentes.filter(i => i.estado === 'RESUELTO').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
            <ShieldAlert size={24} color="#ef4444" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Bitácora de Incidentes y Novedades
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Gestión de eventos, evidencias fotográficas, geoposición y resolución trazable en el residencial.
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
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '0.65rem 1.25rem', 
              borderRadius: '0.5rem', 
              fontWeight: '800', 
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
            }}
          >
            <Plus size={18} />
            Reportar Incidente
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

      {/* Notificaciones */}
      {successMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '0.625rem', border: '1px solid #22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '0.625rem', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Tarjetas de Resumen Rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Incidentes Abiertos</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>{abiertosCount}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Prioridad Alta / Crítica</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ea580c' }}>{criticosCount}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Casos Resueltos</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#16a34a' }}>{resueltosCount}</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por tipo, descripción, ubicación o quién reportó..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.5rem',
              backgroundColor: 'var(--bg-body)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtro Estado */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.2rem' }}>
            {['TODOS', 'ABIERTO', 'RESUELTO'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterEstado(st)}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: filterEstado === st ? '#1e293b' : 'transparent',
                  color: filterEstado === st ? '#FACC15' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Filtro Gravedad */}
          <select
            value={filterGravedad}
            onChange={(e) => setFilterGravedad(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: '700' }}
          >
            <option value="TODAS">Gravedad: Todas</option>
            <option value="CRÍTICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas de Incidentes */}
      <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Cargando bitácora de incidentes...
          </div>
        ) : filteredIncidentes.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '3.5rem 1.5rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
            <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>No hay incidentes reportados</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              {searchTerm ? 'No se encontraron resultados para los filtros seleccionados.' : 'No existen novedades pendientes de seguridad.'}
            </p>
          </div>
        ) : (
          filteredIncidentes.map((incidente) => {
            const isCritical = incidente.nivel_gravedad === 'ALTA' || incidente.nivel_gravedad === 'CRÍTICA';
            return (
              <div 
                key={incidente.id} 
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: '1rem', 
                  padding: '1.5rem', 
                  border: isCritical && incidente.estado === 'ABIERTO' ? '1.5px solid #ef4444' : '1px solid var(--border-color)', 
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800', 
                      backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.15)' : incidente.nivel_gravedad === 'MEDIA' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isCritical ? '#dc2626' : incidente.nivel_gravedad === 'MEDIA' ? '#d97706' : '#2563eb',
                      border: `1px solid ${isCritical ? '#ef4444' : 'transparent'}`
                    }}>
                      GRAVEDAD: {incidente.nivel_gravedad}
                    </span>
                    
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '800', 
                      color: incidente.estado === 'RESUELTO' ? '#16a34a' : '#d97706'
                    }}>
                      {incidente.estado === 'RESUELTO' ? <CheckCircle size={15} /> : <Clock size={15} />}
                      {incidente.estado}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
                    {incidente.tipo}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.875rem 0', lineHeight: 1.5 }}>
                    {incidente.descripcion}
                  </p>
                  
                  {/* Evidencia Fotográfica */}
                  {incidente.evidencia_url && (
                    <div style={{ marginBottom: '0.875rem' }}>
                      <div 
                        onClick={() => setSelectedIncidente(incidente)}
                        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid var(--border-color)', height: '140px' }}
                      >
                        <img 
                          src={incidente.evidencia_url} 
                          alt="Evidencia Incidente" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div style={{ position: 'absolute', bottom: 0, insetInline: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', color: '#FACC15', padding: '0.3rem', fontSize: '0.7rem', fontWeight: '700', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                          <Eye size={12} /> Clic para ampliar fotografía
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ficha de Ubicación y Auditoría */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-body)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    {incidente.ubicacion && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                        <MapPin size={13} color="#ca8a04" /> {incidente.ubicacion}
                      </div>
                    )}
                    <div><strong>Reportado por:</strong> {incidente.reportado_por || 'Guardia de Turno'}</div>
                    {incidente.fecha_creacion && (
                      <div><strong>Fecha:</strong> {new Date(incidente.fecha_creacion).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                {incidente.estado !== 'RESUELTO' && incidente.id && (
                  <button 
                    onClick={() => handleResolver(incidente.id!)}
                    disabled={resolvingId === incidente.id}
                    style={{ 
                      width: '100%', 
                      padding: '0.625rem', 
                      backgroundColor: '#16a34a', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '0.5rem', 
                      fontWeight: '800', 
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <Check size={16} />
                    {resolvingId === incidente.id ? 'Resolviendo...' : 'Marcar como Resuelto'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL REPORTAR INCIDENTE */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '620px', padding: '2rem', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldAlert style={{ color: '#ef4444' }} size={24} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Reportar Nuevo Incidente</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Tipo de Novedad *</label>
                  <select 
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                  >
                    <option value="Seguridad (Intruso/Robo)">Seguridad (Intruso/Robo)</option>
                    <option value="Vehículo Sospechoso o Mal Estacionado">Vehículo Sospechoso / Mal Estacionado</option>
                    <option value="Infraestructura / Portón Abierto">Infraestructura / Portón Abierto</option>
                    <option value="Ruidos Molestos / Disturbio">Ruidos Molestos / Disturbio</option>
                    <option value="Falla en Luminaria / Servicios">Falla en Luminaria / Servicios</option>
                    <option value="Emergencia Médica">Emergencia Médica</option>
                    <option value="Otra Novedad">Otra Novedad</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Nivel de Gravedad *</label>
                  <select 
                    value={formData.nivel_gravedad}
                    onChange={(e) => setFormData({ ...formData, nivel_gravedad: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRÍTICA">Crítica (Intervención Inmediata)</option>
                  </select>
                </div>
              </div>

              {/* Selector de Ubicación Sincronizado */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Vincular Ubicación / Casa / Punto QR *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.625rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ubicacion_tipo: 'CASA' })}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: formData.ubicacion_tipo === 'CASA' ? '2px solid #FACC15' : '1px solid var(--border-color)',
                      backgroundColor: formData.ubicacion_tipo === 'CASA' ? '#1e293b' : 'var(--bg-body)',
                      color: formData.ubicacion_tipo === 'CASA' ? '#FACC15' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Casa Residencial
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ubicacion_tipo: 'PUNTO' })}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: formData.ubicacion_tipo === 'PUNTO' ? '2px solid #FACC15' : '1px solid var(--border-color)',
                      backgroundColor: formData.ubicacion_tipo === 'PUNTO' ? '#1e293b' : 'var(--bg-body)',
                      color: formData.ubicacion_tipo === 'PUNTO' ? '#FACC15' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Punto QR / Garita
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ubicacion_tipo: 'GENERAL' })}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: formData.ubicacion_tipo === 'GENERAL' ? '2px solid #FACC15' : '1px solid var(--border-color)',
                      backgroundColor: formData.ubicacion_tipo === 'GENERAL' ? '#1e293b' : 'var(--bg-body)',
                      color: formData.ubicacion_tipo === 'GENERAL' ? '#FACC15' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Área General
                  </button>
                </div>

                {formData.ubicacion_tipo === 'CASA' && (
                  <select
                    value={formData.casa_id}
                    onChange={(e) => setFormData({ ...formData, casa_id: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                  >
                    <option value="">-- Seleccionar Casa --</option>
                    {casas.map(c => (
                      <option key={c.id} value={c.id}>
                        Casa {c.numero_casa} (Bloque {c.bloque}) - {c.tiene_contrato_seguridad ? '✓ Contrato Activo' : 'Sin Contrato'}
                      </option>
                    ))}
                  </select>
                )}

                {formData.ubicacion_tipo === 'PUNTO' && (
                  <select
                    value={formData.punto_id}
                    onChange={(e) => setFormData({ ...formData, punto_id: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                  >
                    <option value="">-- Seleccionar Punto QR --</option>
                    {puntos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.codigo_qr})
                      </option>
                    ))}
                  </select>
                )}

                {formData.ubicacion_tipo === 'GENERAL' && (
                  <input
                    type="text"
                    placeholder="Ej. Parque central, calle principal, poste perimetral #3..."
                    value={formData.ubicacion_texto}
                    onChange={(e) => setFormData({ ...formData, ubicacion_texto: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                  />
                )}
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Descripción de la Novedad *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Explique detalladamente lo ocurrido..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              {/* Subida de Evidencia Fotográfica en Base64 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Evidencia Fotográfica (Adjunto Real)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileChange(e.dataTransfer.files);
                  }}
                  onClick={() => document.getElementById('incidente-file-input')?.click()}
                  style={{
                    border: isDragging ? '2px dashed #FACC15' : '2px dashed var(--border-color)',
                    backgroundColor: isDragging ? 'rgba(250, 204, 21, 0.1)' : 'var(--bg-body)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <UploadCloud size={28} color="#ca8a04" style={{ margin: '0 auto 0.4rem' }} />
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Haga clic o arrastre una fotografía aquí
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    JPG, PNG hasta 4MB
                  </div>
                  <input
                    id="incidente-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </div>

                {uploadedBase64Image && (
                  <div style={{ marginTop: '0.75rem', position: 'relative', width: '120px', height: '100px' }}>
                    <img src={uploadedBase64Image} alt="Evidencia" style={{ width: '120px', height: '100px', objectFit: 'cover', borderRadius: '0.5rem', border: '2px solid #22c55e' }} />
                    <button
                      type="button"
                      onClick={() => setUploadedBase64Image('')}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ padding: '0.625rem 1.5rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar y Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AMPLIAR EVIDENCIA */}
      {selectedIncidente && selectedIncidente.evidencia_url && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', maxWidth: '700px', width: '100%', padding: '1.5rem', color: 'var(--text-primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Evidencia Fotográfica: {selectedIncidente.tipo}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedIncidente.ubicacion}</span>
              </div>
              <button onClick={() => setSelectedIncidente(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={22} /></button>
            </div>

            <div style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '480px', display: 'flex', justifyContent: 'center', backgroundColor: '#0f172a' }}>
              <img src={selectedIncidente.evidencia_url} alt="Evidencia Detallada" style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setSelectedIncidente(null)}
                style={{ padding: '0.5rem 1.25rem', backgroundColor: '#1e293b', color: '#FACC15', border: '1px solid #334155', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

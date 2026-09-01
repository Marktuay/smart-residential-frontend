'use client';

import { useState, useEffect } from 'react';
import { incidentesApi, Incidente } from '@/lib/api';
import { 
  AlertCircle, 
  CheckCircle, 
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
  ExternalLink
} from 'lucide-react';

export default function IncidentesPage() {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncidente, setSelectedIncidente] = useState<Incidente | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  
  // Archivos e Imágenes subidas (simulación de vista previa)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'Seguridad (Intruso/Robo)',
    descripcion: '',
    nivel_gravedad: 'MEDIA',
    reportado_por: 'Guardia de Turno',
    evidencia_url: '',
    casa_punto: ''
  });

  const fetchIncidentes = async () => {
    try {
      const data = await incidentesApi.getIncidentes();
      setIncidentes(data);
    } catch (error) {
      console.error("Error fetching incidentes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentes();
  }, []);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFilesArray: string[] = [];
    Array.from(files).forEach((file) => {
      const imageUrl = URL.createObjectURL(file);
      newFilesArray.push(imageUrl);
    });
    setUploadedImages((prev) => [...prev, ...newFilesArray]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const evidencia = uploadedImages.length > 0 ? uploadedImages[0] : formData.evidencia_url;
      await incidentesApi.createIncidente({
        ...formData,
        evidencia_url: evidencia
      });
      setIsModalOpen(false);
      resetForm();
      fetchIncidentes();
    } catch (error) {
      console.error("Error creating incidente", error);
    }
  };

  const handleResolver = async (id: number) => {
    try {
      await incidentesApi.resolverIncidente(id);
      fetchIncidentes();
    } catch (error) {
      console.error("Error resolviendo incidente", error);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'Seguridad (Intruso/Robo)',
      descripcion: '',
      nivel_gravedad: 'MEDIA',
      reportado_por: 'Guardia de Turno',
      evidencia_url: '',
      casa_punto: ''
    });
    setUploadedImages([]);
  };

  const filteredIncidentes = incidentes.filter(i => {
    if (filterEstado === 'TODOS') return true;
    return i.estado === filterEstado;
  });

  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#fff', margin: 0 }}>Bitácora de Incidentes</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.875rem' }}>Registro, geolocalización, evidencias y resolución de novedades en el residencial.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Filtro por Estado */}
          <div style={{ display: 'flex', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.25rem' }}>
            {['TODOS', 'ABIERTO', 'RESUELTO'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterEstado(st)}
                style={{
                  padding: '0.375rem 0.75rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: filterEstado === st ? '#3b82f6' : 'transparent',
                  color: '#fff',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.5rem', 
              fontWeight: '700', 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Plus size={20} />
            Reportar Incidente
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas de Incidentes */}
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Cargando incidentes...</p>
        ) : filteredIncidentes.length === 0 ? (
          <div style={{ backgroundColor: '#1e293b', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid #334155', gridColumn: '1 / -1' }}>
            <AlertCircle size={48} color="#64748b" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff' }}>No hay incidentes registrados</h3>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>No existen novedades registradas en el filtro seleccionado.</p>
          </div>
        ) : (
          filteredIncidentes.map((incidente) => {
            const isCritical = incidente.nivel_gravedad === 'ALTA' || incidente.nivel_gravedad === 'CRÍTICA';
            return (
              <div 
                key={incidente.id} 
                style={{ 
                  backgroundColor: '#1e293b', 
                  borderRadius: '1rem', 
                  padding: '1.5rem', 
                  border: isCritical ? '1px solid #ef4444' : '1px solid #334155', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '800', 
                      backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.2)' : incidente.nivel_gravedad === 'MEDIA' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: isCritical ? '#fca5a5' : incidente.nivel_gravedad === 'MEDIA' ? '#fcd34d' : '#93c5fd',
                      border: isCritical ? '1px solid #ef4444' : 'none'
                    }}>
                      GRAVEDAD: {incidente.nivel_gravedad}
                    </span>
                    
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      fontSize: '0.8125rem', 
                      fontWeight: '700', 
                      color: incidente.estado === 'RESUELTO' ? '#4ade80' : '#f59e0b'
                    }}>
                      {incidente.estado === 'RESUELTO' ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {incidente.estado}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: '#fff' }}>{incidente.tipo}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.5' }}>{incidente.descripcion}</p>
                  
                  {/* Evidencias si existen */}
                  {incidente.evidencia_url && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.375rem' }}>EVIDENCIA CAPTURADA:</div>
                      <img 
                        src={incidente.evidencia_url} 
                        alt="Evidencia Incidente" 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #334155' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: '#94a3b8', backgroundColor: '#0f172a', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <div><strong>Reportado por:</strong> {incidente.reportado_por || 'Guardia de Turno'}</div>
                    {incidente.fecha_creacion && <div><strong>Fecha:</strong> {new Date(incidente.fecha_creacion).toLocaleString()}</div>}
                  </div>
                </div>

                {/* Acciones */}
                {incidente.estado !== 'RESUELTO' && (
                  <button 
                    onClick={() => handleResolver(incidente.id!)}
                    style={{ 
                      width: '100%', 
                      padding: '0.625rem', 
                      backgroundColor: '#10b981', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '0.5rem', 
                      fontWeight: '700', 
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckCircle size={16} />
                    Marcar como Resuelto
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL REPORTAR INCIDENTE CON SUBIDA DE FOTOS */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', width: '100%', maxWidth: '600px', padding: '2rem', color: '#fff', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert style={{ color: '#ef4444' }} size={24} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Reportar Nuevo Incidente</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Tipo de Incidente *</label>
                  <select 
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }}
                  >
                    <option value="Seguridad (Intruso/Robo)">Seguridad (Intruso/Robo)</option>
                    <option value="Infraestructura / Fuga de Agua">Infraestructura / Fuga de Agua</option>
                    <option value="Ruidos Molestos / Disturbio">Ruidos Molestos / Disturbio</option>
                    <option value="Vehículo Mal Estacionado">Vehículo Mal Estacionado</option>
                    <option value="Emergencia Médica">Emergencia Médica</option>
                    <option value="Otro Novedad">Otro Novedad</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Nivel de Gravedad *</label>
                  <select 
                    value={formData.nivel_gravedad}
                    onChange={(e) => setFormData({ ...formData, nivel_gravedad: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }}
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRÍTICA">Crítica (Atención Inmediata)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Casa / Punto QR Vinculado (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ej. Casa A29 - Ciudad El Doral / Garita Principal"
                  value={formData.casa_punto}
                  onChange={(e) => setFormData({ ...formData, casa_punto: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Descripción Detallada *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describa lo sucedido con el mayor detalle posible (personas involucradas, hora, acciones tomadas)..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff', resize: 'vertical' }}
                />
              </div>

              {/* ZONA DE ARRASTRE Y SUBIDA DE FOTOS/EVIDENCIAS (DRAG & DROP) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '0.375rem' }}>Evidencias y Capturas (Imágenes)</label>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  style={{
                    border: isDragging ? '2px dashed #3b82f6' : '2px dashed #334155',
                    backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : '#0f172a',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <UploadCloud size={32} color="#3b82f6" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff' }}>
                    Haz clic para subir o arrastra y suelta imágenes aquí
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Soporta imágenes JPG, PNG o capturas de pantalla
                  </div>
                  <input
                    id="file-upload-input"
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </div>

                {/* Previsualización de Imágenes Subidas */}
                {uploadedImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {uploadedImages.map((imgSrc, idx) => (
                      <div key={idx} style={{ position: 'relative', minWidth: '80px', height: '80px' }}>
                        <img src={imgSrc} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #3b82f6' }} />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.75rem 1.25rem', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Guardar e Incidente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

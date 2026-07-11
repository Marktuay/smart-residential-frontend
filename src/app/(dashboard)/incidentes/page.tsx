"use client";

import { useState, useEffect } from 'react';
import { incidentesApi, Incidente } from '@/lib/api';
import { AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';

export default function IncidentesPage() {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'Seguridad',
    descripcion: '',
    nivel_gravedad: 'BAJA',
    evidencia_url: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await incidentesApi.createIncidente(formData);
      setIsModalOpen(false);
      setFormData({ tipo: 'Seguridad', descripcion: '', nivel_gravedad: 'BAJA', evidencia_url: '' });
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

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Incidentes</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Bitácora de novedades y problemas de seguridad.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}
        >
          <Plus size={20} />
          Reportar Incidente
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {loading ? (
          <p>Cargando incidentes...</p>
        ) : incidentes.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
            <AlertCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>No hay incidentes reportados</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>El residencial no tiene novedades pendientes o históricas.</p>
          </div>
        ) : (
          incidentes.map((incidente) => (
            <div key={incidente.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600', 
                  backgroundColor: incidente.nivel_gravedad === 'ALTA' ? 'rgba(239, 68, 68, 0.1)' : incidente.nivel_gravedad === 'MEDIA' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  color: incidente.nivel_gravedad === 'ALTA' ? '#ef4444' : incidente.nivel_gravedad === 'MEDIA' ? '#f59e0b' : '#3b82f6'
                }}>
                  {incidente.nivel_gravedad}
                </span>
                
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: '500', 
                  color: incidente.estado === 'RESUELTO' ? '#10b981' : '#f59e0b'
                }}>
                  {incidente.estado === 'RESUELTO' ? <CheckCircle size={16} /> : <Clock size={16} />}
                  {incidente.estado}
                </span>
              </div>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{incidente.tipo}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>{incidente.descripcion}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Reportado por: {incidente.reportado_por}</span>
                <span>{new Date(incidente.fecha_creacion!).toLocaleDateString()}</span>
              </div>
              
              {incidente.estado === 'ABIERTO' && (
                <button 
                  onClick={() => handleResolver(incidente.id!)}
                  style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', backgroundColor: 'transparent', border: '1px solid #10b981', color: '#10b981', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#10b981'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#10b981'; }}
                >
                  Marcar como Resuelto
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Reportar Incidente</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Tipo de Incidente</label>
                <select 
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="Seguridad">Seguridad (Intruso, Robo)</option>
                  <option value="Mantenimiento">Mantenimiento (Daño, Fuga)</option>
                  <option value="Convivencia">Convivencia (Ruido, Mascota)</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nivel de Gravedad</label>
                <select 
                  value={formData.nivel_gravedad}
                  onChange={(e) => setFormData({...formData, nivel_gravedad: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Descripción Detallada</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                  placeholder="Describe qué ocurrió..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
                  Guardar Incidente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

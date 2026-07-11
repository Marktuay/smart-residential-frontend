'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  MapPin, 
  QrCode,
  X,
  Download
} from 'lucide-react';
import { puntosQrApi, PuntoQR } from '@/lib/api';

export default function PuntosQRPage() {
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    latitud: '',
    longitud: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await puntosQrApi.getPuntos();
      setPuntos(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información de los puntos QR.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await puntosQrApi.createPunto({
        nombre: formData.nombre,
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined
      });
      setIsModalOpen(false);
      setFormData({
        nombre: '',
        latitud: '',
        longitud: ''
      });
      fetchData(); // Refresh data
    } catch (err) {
      console.error(err);
      alert('Error al crear el punto QR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Cargando puntos de control...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Puntos de Control QR
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Gestiona los puntos físicos que los guardias deben escanear durante sus rondas.
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
          <span>Nuevo Punto QR</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Grid de Puntos QR */}
      {puntos.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <QrCode size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>No hay puntos QR registrados. Agrega uno para empezar a diseñar rondas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {puntos.map((punto) => (
            <div key={punto.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: '600', color: 'var(--text-primary)' }}>{punto.nombre}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{punto.id}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                {/* Generador de QR visual basado en URL dummy de Google Chart API para prototipo rápido */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${punto.codigo_qr}`}
                  alt="QR Code"
                  style={{ width: '120px', height: '120px', backgroundColor: 'white', padding: '0.5rem', borderRadius: '0.25rem' }}
                />
                <code style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', wordBreak: 'break-all', textAlign: 'center' }}>
                  {punto.codigo_qr}
                </code>
              </div>

              <button 
                onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${punto.codigo_qr}`, '_blank')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', width: '100%', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                <Download size={16} /> Descargar para imprimir
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Punto */}
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Registrar Punto de Control</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre del Punto</label>
                <input 
                  type="text" 
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Ej. Puerta Principal, Bodega B, Parque"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Latitud (Opcional)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={formData.latitud}
                    onChange={(e) => setFormData({...formData, latitud: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="0.000000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Longitud (Opcional)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={formData.longitud}
                    onChange={(e) => setFormData({...formData, longitud: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="0.000000"
                  />
                </div>
              </div>
              <p style={{ marginTop: '-0.75rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                * El código QR seguro será autogenerado por el servidor.
              </p>

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
                  {isSubmitting ? 'Creando...' : 'Crear Punto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

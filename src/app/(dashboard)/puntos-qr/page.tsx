'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  MapPin, 
  QrCode,
  X,
  Download,
  ShieldCheck,
  ShieldAlert,
  Home,
  User,
  Building,
  Navigation,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { puntosQrApi, residencialApi, PuntoQR, Casa, ResidencialInfo } from '@/lib/api';

export default function PuntosQRPage() {
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para multi-tenant selector (SISADMIN)
  const [userRole, setUserRole] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    latitud: '12.1364',
    longitud: '-86.2514',
    casa_id: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    const resId = localStorage.getItem('residencial_id') || '';
    setUserRole(role);
    setSelectedResidencialId(resId);

    const init = async () => {
      if (role === 'SISADMIN') {
        try {
          const list = await residencialApi.getResidenciales();
          setResidenciales(list || []);
        } catch (err) {
          console.error('Error al cargar residenciales:', err);
        }
      }
      fetchData(resId);
    };

    init();
  }, []);

  const fetchData = async (resId?: string) => {
    const activeResId = resId !== undefined ? resId : (localStorage.getItem('residencial_id') || '');
    
    if (!activeResId) {
      setPuntos([]);
      setCasas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [dataPuntos, dataCasas] = await Promise.all([
        puntosQrApi.getPuntos(),
        residencialApi.getCasas()
      ]);
      setPuntos(dataPuntos || []);
      setCasas(dataCasas || []);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información de los puntos QR o de las casas.');
    } finally {
      setLoading(false);
    }
  };

  const handleResidencialChange = (resId: string) => {
    setSelectedResidencialId(resId);
    localStorage.setItem('residencial_id', resId);
    fetchData(resId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await puntosQrApi.createPunto({
        nombre: formData.nombre,
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
        casa_id: formData.casa_id ? parseInt(formData.casa_id) : null
      });

      setIsModalOpen(false);
      setFormData({
        nombre: '',
        latitud: '12.1364',
        longitud: '-86.2514',
        casa_id: ''
      });
      fetchData(selectedResidencialId);
    } catch (err) {
      console.error(err);
      alert('Error al crear el Punto QR. Intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simular captura interactiva de GPS del usuario
  const handleCaptureCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData({
            ...formData,
            latitud: pos.coords.latitude.toFixed(6),
            longitud: pos.coords.longitude.toFixed(6)
          });
        },
        () => {
          alert('No se pudo obtener la ubicación GPS actual del dispositivo.');
        }
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Puntos de Control QR
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem', fontSize: '0.875rem' }}>
            Gestión de códigos QR georreferenciados para patrullaje y rondas de seguridad.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
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
          Registrar Punto QR
        </button>
      </div>

      {/* Selector Multi-Tenant SISADMIN */}
      {userRole === 'SISADMIN' && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Building size={20} color="var(--primary)" />
          <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Residencial Activo:</label>
          <select
            value={selectedResidencialId}
            onChange={(e) => handleResidencialChange(e.target.value)}
            style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
          >
            {residenciales.map(r => (
              <option key={r.id} value={r.id}>{r.nombre} ({r.id})</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem', border: '1px solid #ef4444' }}>
          {error}
        </div>
      )}

      {/* Lista de Puntos QR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando Puntos QR...</p>
        ) : puntos.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
            <QrCode size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>No hay puntos QR registrados</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Registra garitas o puntos de patrullaje independientes.</p>
          </div>
        ) : (
          puntos.map(p => (
            <div
              key={p.id}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={22} />
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-secondary)', borderRadius: '0.25rem', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>
                    {p.codigo_qr || 'QR-GENERADO'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{p.nombre}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {p.numero_casa && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#d97706', fontWeight: '700' }}>
                      <Home size={14} /> Casa Asignada: {p.numero_casa}
                    </div>
                  )}
                  {p.latitud && p.longitud && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <MapPin size={14} /> {p.latitud}, {p.longitud}
                    </div>
                  )}
                </div>
              </div>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(p.codigo_qr || p.nombre)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'var(--bg-body)',
                  color: 'var(--primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem'
                }}
              >
                <Download size={14} /> Descargar Código QR
              </a>
            </div>
          ))
        )}
      </div>

      {/* MODAL REGISTRAR PUNTO QR CON MAP-PICKER */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '550px', padding: '2rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode color="var(--primary)" size={24} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Registrar Punto de Control QR</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.375rem' }}>Nombre del Punto de Control *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Garita Principal / Área Social / Casa A29"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.375rem' }}>Vincular a Casa (Opcional)</label>
                <select
                  value={formData.casa_id}
                  onChange={(e) => setFormData({ ...formData, casa_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Sin Vincular (Punto QR Independiente) --</option>
                  {casas.map(c => (
                    <option key={c.id} value={c.id}>Casa {c.numero_casa} ({c.bloque})</option>
                  ))}
                </select>
              </div>

              {/* MAP PICKER SIMULADO / COORDENADAS GPS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: '600' }}>Coordenadas GPS (Geolocalización)</label>
                  <button
                    type="button"
                    onClick={handleCaptureCurrentLocation}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Navigation size={12} /> Usar mi GPS Actual
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Latitud (Ej. 12.1364)"
                    value={formData.latitud}
                    onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Longitud (Ej. -86.2514)"
                    value={formData.longitud}
                    onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Crear Punto QR</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

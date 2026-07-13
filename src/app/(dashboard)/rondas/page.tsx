'use client';

import { useState, useEffect } from 'react';
import { rondasApi, puntosQrApi, residencialApi, PuntoQR, AsignacionRonda, Casa, ResidencialInfo } from '@/lib/api';
import { Play, CheckCircle, Navigation, MapPin, Plus, QrCode, Home, Shield, X, Building } from 'lucide-react';

export default function RondasPage() {
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [rondas, setRondas] = useState<AsignacionRonda[]>([]);
  const [casas, setCasas] = useState<Casa[]>([]);

  // Estados para multi-tenant selector (SISADMIN)
  const [userRole, setUserRole] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');

  // Modal para nuevo punto QR
  const [showPuntoForm, setShowPuntoForm] = useState(false);
  const [newPunto, setNewPunto] = useState({ nombre: '' });
  const [newPuntoCasaId, setNewPuntoCasaId] = useState<number | ''>('');
  const [selectedPunto, setSelectedPunto] = useState<PuntoQR | null>(null);

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
      setRondas([]);
      setCasas([]);
      return;
    }

    try {
      const [puntosData, rondasData, casasData] = await Promise.all([
        puntosQrApi.getPuntos(),
        rondasApi.getAsignaciones(),
        residencialApi.getCasas()
      ]);
      setPuntos(puntosData || []);
      setRondas(rondasData || []);
      setCasas(casasData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleResidencialChange = (resId: string) => {
    setSelectedResidencialId(resId);
    localStorage.setItem('residencial_id', resId);
    fetchData(resId);
  };

  const handleCreatePunto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPunto.nombre.trim()) return;
    try {
      await puntosQrApi.createPunto({ 
        nombre: newPunto.nombre,
        casa_id: newPuntoCasaId === '' ? null : Number(newPuntoCasaId)
      });
      setNewPunto({ nombre: '' });
      setNewPuntoCasaId('');
      setShowPuntoForm(false);
      fetchData();
    } catch (error) {
      console.error("Error al crear punto QR:", error);
    }
  };

  const openQrModal = (punto: PuntoQR) => {
    setSelectedPunto(punto);
  };

  return (
    <div style={{ padding: '2rem', color: '#1e293b', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Gestión de Rondas y QR</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Monitorea las rondas de seguridad y gestiona los puntos de control QR.</p>
        </div>

        {/* Selector de Residencial para SISADMIN */}
        {userRole === 'SISADMIN' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Residencial:</span>
            <select
              value={selectedResidencialId}
              onChange={(e) => handleResidencialChange(e.target.value)}
              style={{
                padding: '0.5rem 2rem 0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                color: '#1e293b',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Seleccionar --</option>
              {residenciales.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedResidencialId ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#64748b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <Building size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#FACC15' }} />
          <p>Por favor seleccione un residencial activo en la parte superior para visualizar y gestionar sus rondas y puntos de control.</p>
        </div>
      ) : (
        <>
          {showPuntoForm && (
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <MapPin size={20} color="#FACC15" style={{ marginRight: '0.5rem' }} />
                Nuevo Punto de Control
              </h2>
              <form onSubmit={handleCreatePunto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Nombre del Punto (Ej: Entrada Principal, Casa 5...)</label>
                    <input
                      type="text" required value={newPunto.nombre} onChange={e => setNewPunto({ nombre: e.target.value })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none' }}
                      placeholder="Nombre de la ubicación"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Asociar a Casa (Opcional)</label>
                    <select
                      value={newPuntoCasaId}
                      onChange={e => setNewPuntoCasaId(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', backgroundColor: 'white' }}
                    >
                      <option value="">-- Punto General (Sin Casa) --</option>
                      {casas.map(c => (
                        <option key={c.id} value={c.id}>
                          Casa {c.numero_casa} (Bloque {c.bloque})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowPuntoForm(false)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{ backgroundColor: '#FACC15', color: '#1e293b', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                    Guardar Punto
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal QR code */}
          {selectedPunto && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '350px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Punto: {selectedPunto.nombre}</h3>
                
                {selectedPunto.casa_id && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '0.875rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', color: '#334155', fontWeight: '600' }}>
                      <Home size={16} style={{ marginRight: '0.5rem', color: '#64748b' }} />
                      Casa {selectedPunto.numero_casa || 'Desconocida'}
                    </p>
                    <p style={{ margin: 0, color: '#475569' }}>Propietario: {selectedPunto.residente_nombre || 'No registrado'}</p>
                  </div>
                )}

                <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', marginBottom: '1.5rem' }}>
                  {selectedPunto.codigo_qr ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedPunto.codigo_qr)}`} 
                      alt="QR Code" 
                      style={{ width: '200px', height: '200px', display: 'block', margin: '0 auto' }}
                    />
                  ) : (
                    <p>No hay código QR disponible</p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem', wordBreak: 'break-all' }}>
                    ID: {selectedPunto.codigo_qr}
                  </p>
                </div>
                <button onClick={() => setSelectedPunto(null)} style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '0.5rem 2rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cerrar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {/* Panel Puntos de Control */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center' }}>
                  <MapPin size={20} color="#FACC15" style={{ marginRight: '0.5rem' }} />
                  Puntos de Control QR
                </h2>
                <button
                  onClick={() => setShowPuntoForm(true)}
                  style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', color: '#334155', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                >
                  <Plus size={16} style={{ marginRight: '0.25rem' }} /> Añadir
                </button>
              </div>

              {puntos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                  <QrCode size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No hay puntos de control configurados.</p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {puntos.map((punto, index) => {
                    const isHousePoint = !!punto.casa_id;
                    return (
                      <li key={punto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: isHousePoint ? '#fef08a' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isHousePoint ? '#a16207' : '#475569', fontWeight: 'bold', fontSize: '0.875rem', marginRight: '0.75rem' }}>
                            {isHousePoint ? <Home size={14} /> : (index + 1)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {punto.nombre}
                            </span>
                            {isHousePoint && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.125rem' }}>
                                <span>Casa {punto.numero_casa} | {punto.residente_nombre || 'Sin residente'}</span>
                                <span style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.125rem',
                                  padding: '1px 4px',
                                  borderRadius: '4px',
                                  backgroundColor: punto.tiene_contrato_seguridad ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  border: `1px solid ${punto.tiene_contrato_seguridad ? '#22c55e' : '#ef4444'}`,
                                  color: punto.tiene_contrato_seguridad ? '#22c55e' : '#ef4444',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold'
                                }}>
                                  <Shield size={10} />
                                  {punto.tiene_contrato_seguridad ? 'Activo' : 'Inactivo'}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => openQrModal(punto)} style={{ display: 'flex', alignItems: 'center', color: '#2563eb', backgroundColor: '#eff6ff', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          <QrCode size={14} style={{ marginRight: '0.25rem' }} /> Ver
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Historial de Asignaciones */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <Navigation size={20} color="#FACC15" style={{ marginRight: '0.5rem' }} />
                Asignaciones de Rondas
              </h2>
              {rondas.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No hay asignaciones recientes.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {rondas.map((ronda) => (
                    <div key={ronda.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {ronda.estado === 'FINALIZADA' ? (
                          <CheckCircle size={20} color="#10b981" style={{ marginRight: '1rem' }} />
                        ) : (
                          <Play size={20} color="#3b82f6" style={{ marginRight: '1rem' }} />
                        )}
                        <div>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                            Programa ID: {ronda.programa_id}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                            Guardia ID: {ronda.usuario_id} | Fecha: {ronda.fecha}
                          </p>
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '500',
                        backgroundColor: ronda.estado === 'EN_CURSO' ? '#dbeafe' : ronda.estado === 'FINALIZADA' ? '#dcfce3' : '#f1f5f9',
                        color: ronda.estado === 'EN_CURSO' ? '#2563eb' : ronda.estado === 'FINALIZADA' ? '#16a34a' : '#64748b'
                      }}>
                        {ronda.estado || 'PENDIENTE'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  Search, 
  Wrench, 
  ArrowLeft, 
  QrCode, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Printer,
  Shield,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import { flotaApi, VehiculoFlota } from '@/lib/api';
import QRCode from 'qrcode';

export default function VehiculosFlotaPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoFlota[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulario
  const [codigoUnidad, setCodigoUnidad] = useState('');
  const [tipoUnidad, setTipoUnidad] = useState('CAMION');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [horometroKm, setHorometroKm] = useState<number>(0);

  // Modal QR Imprimible
  const [vehiculoQR, setVehiculoQR] = useState<VehiculoFlota | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await flotaApi.getVehiculos();
      setVehiculos(data || []);
    } catch (e: any) {
      console.error("Error al cargar flota:", e);
      setErrorMsg("No se pudo conectar con el catálogo de flota.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoUnidad.trim()) {
      setErrorMsg("El código de unidad es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await flotaApi.createVehiculo({
        codigo_unidad: codigoUnidad.trim().toUpperCase(),
        tipo_unidad: tipoUnidad,
        marca_modelo: marcaModelo.trim(),
        placa: placa.trim().toUpperCase(),
        horometro_km_actual: Number(horometroKm) || 0,
        estado: 'OPERATIVO'
      });
      setShowModal(false);
      setCodigoUnidad('');
      setMarcaModelo('');
      setPlaca('');
      setHorometroKm(0);
      setSuccessMsg(`✅ Unidad ${codigoUnidad.trim().toUpperCase()} registrada con éxito.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchVehiculos();
    } catch (e: any) {
      console.error("Error al registrar vehículo:", e);
      if (e.response?.status === 409 || e.response?.data?.error?.includes('ya existe')) {
        setErrorMsg("⚠️ Ya existe una unidad registrada con ese código o placa.");
      } else {
        setErrorMsg(e.response?.data?.message || "No se pudo registrar la unidad en base de datos.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenQRModal = async (v: VehiculoFlota) => {
    setVehiculoQR(v);
    try {
      const payload = JSON.stringify({
        tipo: 'FLOTA_360',
        id: v.id,
        codigo: v.codigo_unidad,
        placa: v.placa,
        tipo_unidad: v.tipo_unidad
      });
      const url = await QRCode.toDataURL(payload, {
        width: 350,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Error al generar QR:", err);
    }
  };

  const vehiculosFiltrados = vehiculos.filter(v => {
    const matchesEstado = filtroEstado === 'TODOS' || v.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const matchesBusqueda = (v.codigo_unidad || '').toLowerCase().includes(q) ||
      (v.tipo_unidad || '').toLowerCase().includes(q) ||
      (v.marca_modelo || '').toLowerCase().includes(q) ||
      (v.placa || '').toLowerCase().includes(q);
    return matchesEstado && matchesBusqueda;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando catálogo de vehículos y maquinaria pesada...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      
      {/* Alertas */}
      {successMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/flota">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={24} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Wrench size={28} color="#FACC15" />
              Catálogo de Flota Pesada y Maquinaria
            </h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              Inventario oficial de camiones, cabezales, retroexcavadoras y maquinaria amarilla.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchVehiculos}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '0.65rem 1rem', borderRadius: '0.5rem', fontWeight: '600', border: '1px solid #cbd5e1', cursor: 'pointer' }}
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
          <button
            onClick={() => { setShowModal(true); setErrorMsg(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FACC15', color: '#1e293b', padding: '0.65rem 1.25rem', borderRadius: '0.5rem', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
            <Plus size={20} />
            Registrar Unidad
          </button>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '450px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por código, tipo, marca o placa..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Estado:</span>
          {['TODOS', 'OPERATIVO', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'].map(est => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: filtroEstado === est ? '#1e293b' : 'white',
                color: filtroEstado === est ? 'white' : '#475569'
              }}
            >
              {est === 'TODOS' ? 'Todos' : est.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de Vehículos */}
      {vehiculosFiltrados.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <Truck size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#334155' }}>No se encontraron unidades en el catálogo.</p>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Haga clic en &quot;Registrar Unidad&quot; para agregar camiones o maquinaria a la flota.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {vehiculosFiltrados.map((v) => (
            <div key={v.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: v.estado === 'OPERATIVO' ? '#10b981' : '#f59e0b' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#1e293b', margin: 0 }}>{v.codigo_unidad}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{v.tipo_unidad}</span>
                </div>
                <span style={{ padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: v.estado === 'OPERATIVO' ? '#dcfce7' : '#fef3c7', color: v.estado === 'OPERATIVO' ? '#15803d' : '#d97706' }}>
                  {v.estado}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
                <div><strong>Marca / Modelo:</strong> {v.marca_modelo || 'N/A'}</div>
                <div><strong>Placa:</strong> {v.placa || 'N/A (Maquinaria Pesada)'}</div>
                <div><strong>Horómetro / KM:</strong> {v.horometro_km_actual || 0} hrs/km</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleOpenQRModal(v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  <QrCode size={16} color="#3b82f6" />
                  <span>Ficha QR</span>
                </button>

                <Link href={`/flota/inspeccion?solicitud_id=`}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                    <ClipboardCheck size={16} />
                    <span>Checklist 360</span>
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Registrar Vehículo */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '480px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} color="#FACC15" />
                Registrar Unidad de Flota
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            {errorMsg && (
              <div style={{ margin: '1rem 1.5rem 0', padding: '0.75rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCrearVehiculo} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Código Único de Unidad *</label>
                <input required type="text" value={codigoUnidad} onChange={e => setCodigoUnidad(e.target.value)} placeholder="Ej: CAM-001 o CAT-320" style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Tipo de Unidad *</label>
                <select required value={tipoUnidad} onChange={e => setTipoUnidad(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="CAMION">Camión Volquete / Carga</option>
                  <option value="RETROEXCAVADORA">Retroexcavadora / Maquinaria Amarilla</option>
                  <option value="CABEZAL">Cabezal / Trailer</option>
                  <option value="MONTACARGAS">Montacargas</option>
                  <option value="GRUA">Grúa Industrial</option>
                  <option value="OTRO">Otro Vehículo Pesado</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Marca y Modelo</label>
                <input type="text" value={marcaModelo} onChange={e => setMarcaModelo(e.target.value)} placeholder="Ej: Caterpillar 320D" style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Número de Placa</label>
                  <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} placeholder="Ej: M 12345" style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>Horómetro / KM</label>
                  <input type="number" step="any" value={horometroKm} onChange={e => setHorometroKm(parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Guardando...' : 'Guardar Unidad'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha QR Imprimible */}
      {vehiculoQR && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Header no imprimible */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }} className="no-print">
              <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Ficha QR de Unidad Pesada</span>
              <button onClick={() => setVehiculoQR(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            {/* Placard imprimible */}
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#0f172a', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Shield size={24} color="#FACC15" />
                <span style={{ fontWeight: '900', letterSpacing: '2px', color: '#FACC15', fontSize: '1.25rem' }}>NCS365 FLOTA</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Control Operativo y Checklist 360</p>
              
              <div style={{ margin: '1.5rem auto', padding: '1rem', backgroundColor: 'white', borderRadius: '0.75rem', width: 'fit-content' }}>
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt={`QR ${vehiculoQR.codigo_unidad}`} style={{ width: '220px', height: '220px', display: 'block' }} />
                )}
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px' }}>
                {vehiculoQR.codigo_unidad}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#FACC15', textTransform: 'uppercase', fontWeight: '600', marginTop: '0.25rem' }}>
                {vehiculoQR.tipo_unidad} {vehiculoQR.placa ? `• PLACA: ${vehiculoQR.placa}` : ''}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Escanee este código con la tablet de taller o garita para registrar la inspección 360.
              </div>
            </div>

            {/* Acciones */}
            <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }} className="no-print">
              <button
                onClick={() => setVehiculoQR(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <Printer size={18} />
                Imprimir Ficha
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Estilos para impresión */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          div[style*="fixed"] {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            padding: 0 !important;
          }
          div[style*="fixed"] * {
            visibility: visible;
          }
        }
      `}} />

    </div>
  );
}

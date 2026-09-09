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
  AlertTriangle
} from 'lucide-react';
import { flotaApi, VehiculoFlota } from '@/lib/api';

export default function VehiculosFlotaPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoFlota[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [codigoUnidad, setCodigoUnidad] = useState('');
  const [tipoUnidad, setTipoUnidad] = useState('CAMION');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [horometroKm, setHorometroKm] = useState<number>(0);

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const data = await flotaApi.getVehiculos();
      setVehiculos(data || []);
    } catch (e) {
      console.error("Error al cargar flota:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoUnidad || !tipoUnidad) return;

    setIsSubmitting(true);
    try {
      await flotaApi.createVehiculo({
        codigo_unidad: codigoUnidad.toUpperCase(),
        tipo_unidad: tipoUnidad,
        marca_modelo: marcaModelo,
        placa: placa.toUpperCase(),
        horometro_km_actual: horometroKm,
        estado: 'OPERATIVO'
      });
      setShowModal(false);
      setCodigoUnidad('');
      setMarcaModelo('');
      setPlaca('');
      setHorometroKm(0);
      fetchVehiculos();
    } catch (e) {
      console.error("Error al registrar vehículo:", e);
      alert("No se pudo registrar la unidad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehiculosFiltrados = vehiculos.filter(v => {
    const q = busqueda.toLowerCase();
    return (v.codigo_unidad || '').toLowerCase().includes(q) ||
      (v.tipo_unidad || '').toLowerCase().includes(q) ||
      (v.marca_modelo || '').toLowerCase().includes(q) ||
      (v.placa || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #f3f3f3', borderTop: '4px solid #FACC15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '500' }}>Cargando catálogo de vehículos y maquinaria...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/flota">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
              <ArrowLeft size={24} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Wrench size={30} color="#FACC15" />
              Catálogo de Flota Pesada y Maquinaria
            </h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Inventario de camiones, cabezales, retroexcavadoras y maquinaria amarilla.</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FACC15', color: '#1e293b', padding: '0.65rem 1.25rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
        >
          <Plus size={20} />
          Registrar Unidad
        </button>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '2rem', position: 'relative', maxWidth: '500px' }}>
        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          placeholder="Buscar por código, tipo, marca o placa..." 
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Tarjetas de Vehículos */}
      {vehiculosFiltrados.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <Truck size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No hay unidades registradas en el catálogo.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {vehiculosFiltrados.map((v) => (
            <div key={v.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: v.estado === 'OPERATIVO' ? '#10b981' : '#f59e0b' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b', margin: 0 }}>{v.codigo_unidad}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>{v.tipo_unidad}</span>
                </div>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: v.estado === 'OPERATIVO' ? '#dcfce3' : '#fef3c7', color: v.estado === 'OPERATIVO' ? '#15803d' : '#d97706' }}>
                  {v.estado}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
                <div><strong>Marca / Modelo:</strong> {v.marca_modelo || 'N/A'}</div>
                <div><strong>Placa:</strong> {v.placa || 'N/A (Maquinaria)'}</div>
                <div><strong>Horómetro / KM:</strong> {v.horometro_km_actual || 0} hrs/km</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <QrCode size={16} color="#3b82f6" />
                  <span>{v.qr_code}</span>
                </div>
                <span>Registrado: {new Date(v.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Registrar Vehículo */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '450px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Registrar Nueva Unidad</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCrearVehiculo} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Código Único de Unidad</label>
                <input required type="text" value={codigoUnidad} onChange={e => setCodigoUnidad(e.target.value)} placeholder="Ej: CAM-001 o CAT-320" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Tipo de Unidad</label>
                <select required value={tipoUnidad} onChange={e => setTipoUnidad(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="CAMION">Camión Volquete / Carga</option>
                  <option value="RETROEXCAVADORA">Retroexcavadora / Maquinaria Amarilla</option>
                  <option value="CABEZAL">Cabezal / Trailer</option>
                  <option value="MONTACARGAS">Montacargas</option>
                  <option value="GRUA">Grúa Industrial</option>
                  <option value="OTRO">Otro Vehículo Pesado</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Marca y Modelo</label>
                <input type="text" value={marcaModelo} onChange={e => setMarcaModelo(e.target.value)} placeholder="Ej: Caterpillar 320D" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Número de Placa</label>
                  <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} placeholder="Ej: M 12345" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Horómetro / KM Inicial</label>
                  <input type="number" step="any" value={horometroKm} onChange={e => setHorometroKm(parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#FACC15', color: '#1e293b', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Guardando...' : 'Guardar Unidad'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

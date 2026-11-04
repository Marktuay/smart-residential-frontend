'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Plus, 
  MapPin, 
  QrCode, 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  Home, 
  Search, 
  Building, 
  Navigation, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Trash2,
  Edit,
  ExternalLink,
  Filter
} from 'lucide-react';
import { puntosQrApi, residencialApi, PuntoQR, Casa, ResidencialInfo } from '@/lib/api';

export default function PuntosQRPage() {
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [residencialInfo, setResidencialInfo] = useState<ResidencialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados para multi-tenant selector (SISADMIN)
  const [userRole, setUserRole] = useState<string | null>(null);
  const [residenciales, setResidenciales] = useState<ResidencialInfo[]>([]);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'CASAS' | 'PERIMETRO'>('TODOS');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPunto, setEditingPunto] = useState<PuntoQR | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    latitud: '12.1364',
    longitud: '-86.2514',
    casa_id: '',
    tipo: 'GENERAL' // 'GENERAL' | 'CASA'
  });

  // Modal Ficha Imprimible
  const [printablePunto, setPrintablePunto] = useState<PuntoQR | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Modal Confirmar Eliminación
  const [puntoToDelete, setPuntoToDelete] = useState<PuntoQR | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      const [dataPuntos, dataCasas, infoRes] = await Promise.all([
        puntosQrApi.getPuntos(),
        residencialApi.getCasas(),
        residencialApi.getInfo().catch(() => null)
      ]);
      setPuntos(dataPuntos || []);
      setCasas(dataCasas || []);
      if (infoRes) setResidencialInfo(infoRes);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo cargar la información de los puntos QR o del residencial.');
    } finally {
      setLoading(false);
    }
  };

  const handleResidencialChange = (resId: string) => {
    setSelectedResidencialId(resId);
    localStorage.setItem('residencial_id', resId);
    fetchData(resId);
  };

  const handleOpenCreateModal = () => {
    setEditingPunto(null);
    setFormData({
      nombre: '',
      latitud: residencialInfo ? residencialInfo.latitud_centro.toString() : '12.1364',
      longitud: residencialInfo ? residencialInfo.longitud_centro.toString() : '-86.2514',
      casa_id: '',
      tipo: 'GENERAL'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PuntoQR) => {
    setEditingPunto(p);
    setFormData({
      nombre: p.nombre,
      latitud: p.latitud !== undefined ? p.latitud.toString() : '12.1364',
      longitud: p.longitud !== undefined ? p.longitud.toString() : '-86.2514',
      casa_id: p.casa_id ? p.casa_id.toString() : '',
      tipo: p.casa_id ? 'CASA' : 'GENERAL'
    });
    setIsModalOpen(true);
  };

  const handleCaptureCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitud: pos.coords.latitude.toFixed(6),
            longitud: pos.coords.longitude.toFixed(6)
          }));
        },
        () => {
          alert('No se pudo obtener la ubicación GPS precisa. Verifique los permisos del navegador.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('La geolocalización no está soportada por su navegador.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload: Partial<PuntoQR> = {
        nombre: formData.nombre.trim(),
        latitud: formData.latitud ? parseFloat(formData.latitud) : 0,
        longitud: formData.longitud ? parseFloat(formData.longitud) : 0,
        casa_id: formData.tipo === 'CASA' && formData.casa_id ? parseInt(formData.casa_id) : null
      };

      if (editingPunto && editingPunto.id) {
        await puntosQrApi.updatePunto(editingPunto.id, payload);
        setSuccessMsg(`Punto "${formData.nombre}" actualizado correctamente.`);
      } else {
        await puntosQrApi.createPunto(payload);
        setSuccessMsg(`Punto "${formData.nombre}" registrado con código QR único.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData(selectedResidencialId);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 409) {
        setError(err.response.data?.error || 'Ya existe un punto de control con este nombre o asociado a esta casa.');
      } else {
        setError('Error al procesar la solicitud del Punto QR. Verifique los campos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPrintModal = async (punto: PuntoQR) => {
    setPrintablePunto(punto);
    try {
      const qrText = punto.codigo_qr || `NCS-QR-${punto.id || 'TEMP'}`;
      const url = await QRCode.toDataURL(qrText, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error('Error generando QR Data URL:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeletePunto = async () => {
    if (!puntoToDelete || !puntoToDelete.id) return;
    setDeleting(true);
    try {
      await puntosQrApi.deletePunto(puntoToDelete.id);
      setSuccessMsg(`Punto QR "${puntoToDelete.nombre}" eliminado.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setPuntoToDelete(null);
      fetchData(selectedResidencialId);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el punto QR.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtrado de puntos
  const filteredPuntos = puntos.filter(p => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo_qr && p.codigo_qr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.numero_casa && p.numero_casa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.residente_nombre && p.residente_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filtroTipo === 'CASAS') return !!p.casa_id;
    if (filtroTipo === 'PERIMETRO') return !p.casa_id;
    return true;
  });

  // Métricas
  const totalCasasPuntos = puntos.filter(p => !!p.casa_id).length;
  const totalPerimetrales = puntos.filter(p => !p.casa_id).length;
  const totalConContrato = puntos.filter(p => p.tiene_contrato_seguridad).length;
  const totalLecturas = puntos.reduce((acc, p) => acc + (p.total_marcaciones || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Estilos para impresión limpia de fichas QR */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ficha-imprimible-area, #ficha-imprimible-area * {
            visibility: visible;
          }
          #ficha-imprimible-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white !important;
            padding: 2cm;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Encabezado */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
              <QrCode size={24} color="#FACC15" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Catálogo de Puntos y Fichas QR
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                Fichas imprimibles, georreferenciación y tokens oficiales de patrullaje para garitas, perímetros y residencias.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#FACC15',
              color: '#0f172a',
              border: 'none',
              padding: '0.75rem 1.35rem',
              borderRadius: '0.625rem',
              fontWeight: '800',
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(250, 204, 21, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={18} />
            Nuevo Punto QR
          </button>
        </div>
      </div>

      {/* Selector Multi-Tenant SISADMIN */}
      {userRole === 'SISADMIN' && (
        <div className="no-print" style={{ backgroundColor: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Building size={20} color="#FACC15" />
          <label style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>Residencial Activo:</label>
          <select
            value={selectedResidencialId}
            onChange={(e) => handleResidencialChange(e.target.value)}
            style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '600' }}
          >
            {residenciales.map(r => (
              <option key={r.id} value={r.id}>{r.nombre} ({r.id})</option>
            ))}
          </select>
        </div>
      )}

      {/* Alertas */}
      {successMsg && (
        <div className="no-print" style={{ padding: '0.875rem 1.25rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '0.625rem', border: '1px solid #22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div className="no-print" style={{ padding: '0.875rem 1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '0.625rem', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(250, 204, 21, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={24} color="#ca8a04" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Puntos QR</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{puntos.length}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Casas con Contrato</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a' }}>{totalConContrato}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={24} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Puntos Perimetrales</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalPerimetrales}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#9333ea" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Lecturas Registradas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalLecturas}</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="no-print" style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
          <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, código QR, casa o residente..."
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

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Tipo:</span>
          {(['TODOS', 'CASAS', 'PERIMETRO'] as const).map(tipo => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '0.375rem',
                border: filtroTipo === tipo ? '1px solid #FACC15' : '1px solid var(--border-color)',
                backgroundColor: filtroTipo === tipo ? '#1e293b' : 'var(--bg-body)',
                color: filtroTipo === tipo ? '#FACC15' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {tipo === 'TODOS' ? 'Todos' : tipo === 'CASAS' ? 'Casas' : 'Perímetro / Garita'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Puntos QR */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>Cargando catálogo oficial de puntos QR...</p>
          </div>
        ) : filteredPuntos.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', backgroundColor: 'var(--bg-card)', padding: '3.5rem 1.5rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <QrCode size={52} color="#FACC15" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>No se encontraron puntos QR</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              {searchTerm ? 'No hay resultados que coincidan con la búsqueda.' : 'Comience registrando garitas, postes perimetrales o casas residenciales.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              style={{ marginTop: '1.25rem', padding: '0.625rem 1.25rem', backgroundColor: '#FACC15', color: '#0f172a', fontWeight: '700', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
            >
              Registrar Primer Punto
            </button>
          </div>
        ) : (
          filteredPuntos.map(p => {
            const isHouse = !!p.casa_id;
            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: isHouse && p.tiene_contrato_seguridad ? '1.5px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '0.625rem',
                        backgroundColor: isHouse ? 'rgba(250, 204, 21, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: isHouse ? '#ca8a04' : '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isHouse ? <Home size={22} /> : <MapPin size={22} />}
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: isHouse ? '#d97706' : '#2563eb' }}>
                          {isHouse ? 'PUNTO RESIDENCIAL' : 'PUNTO PERIMETRAL'}
                        </span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                          {p.nombre}
                        </h3>
                      </div>
                    </div>

                    {/* Badge Contrato Seguridad */}
                    {isHouse && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        backgroundColor: p.tiene_contrato_seguridad ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                        color: p.tiene_contrato_seguridad ? '#16a34a' : '#dc2626',
                        border: `1px solid ${p.tiene_contrato_seguridad ? '#22c55e' : '#ef4444'}`
                      }}>
                        {p.tiene_contrato_seguridad ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                        {p.tiene_contrato_seguridad ? 'Contrato Activo' : 'Sin Contrato'}
                      </span>
                    )}
                  </div>

                  {/* Detalles Informativos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-body)', padding: '0.875rem', borderRadius: '0.625rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600' }}>Token QR:</span>
                      <code style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', backgroundColor: '#1e293b', color: '#FACC15', borderRadius: '4px', fontWeight: '700' }}>
                        {p.codigo_qr || `NCS-QR-${p.id}`}
                      </code>
                    </div>

                    {isHouse && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600' }}>Casa Asignada:</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Casa {p.numero_casa} {p.bloque ? `(${p.bloque})` : ''}</span>
                        </div>
                        {p.residente_nombre && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600' }}>Propietario/Habitante:</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.residente_nombre}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600' }}>Coordenadas:</span>
                      <span>{p.latitud?.toFixed(5) || '0.0000'}, {p.longitud?.toFixed(5) || '0.0000'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.375rem', marginTop: '0.25rem' }}>
                      <span style={{ fontWeight: '600' }}>Marcaciones Totales:</span>
                      <span style={{ fontWeight: '800', color: '#FACC15', backgroundColor: '#1e293b', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>
                        {p.total_marcaciones || 0} lecturas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones del Punto QR */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleOpenPrintModal(p)}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '0.625rem 0.75rem',
                      backgroundColor: '#1e293b',
                      color: '#FACC15',
                      border: '1px solid #334155',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Printer size={15} /> Ficha Imprimible
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(p)}
                    title="Editar Punto"
                    style={{
                      padding: '0.625rem 0.75rem',
                      backgroundColor: 'var(--bg-body)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Edit size={15} />
                  </button>

                  <button
                    onClick={() => setPuntoToDelete(p)}
                    title="Eliminar Punto"
                    style={{
                      padding: '0.625rem 0.75rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL CREAR / EDITAR PUNTO QR */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '560px', padding: '2rem', color: 'var(--text-primary)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode color="#FACC15" size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    {editingPunto ? 'Editar Punto de Control' : 'Registrar Nuevo Punto QR'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Generación de token físico y geoposición para guardias
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Selector de Tipo de Punto */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Tipo de Punto de Control *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'GENERAL', casa_id: '' })}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: formData.tipo === 'GENERAL' ? '2px solid #FACC15' : '1px solid var(--border-color)',
                      backgroundColor: formData.tipo === 'GENERAL' ? '#1e293b' : 'var(--bg-body)',
                      color: formData.tipo === 'GENERAL' ? '#FACC15' : 'var(--text-secondary)',
                      fontWeight: '700',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <MapPin size={16} /> Garita / Perimetral
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'CASA' })}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: formData.tipo === 'CASA' ? '2px solid #FACC15' : '1px solid var(--border-color)',
                      backgroundColor: formData.tipo === 'CASA' ? '#1e293b' : 'var(--bg-body)',
                      color: formData.tipo === 'CASA' ? '#FACC15' : 'var(--text-secondary)',
                      fontWeight: '700',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Home size={16} /> Casa Residencial
                  </button>
                </div>
              </div>

              {/* Si es Casa Residencial, seleccionarla */}
              {formData.tipo === 'CASA' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '0.375rem' }}>
                    Seleccionar Casa Residencial *
                  </label>
                  <select
                    required
                    value={formData.casa_id}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const casaFound = casas.find(c => c.id === parseInt(selectedId));
                      setFormData({ 
                        ...formData, 
                        casa_id: selectedId,
                        nombre: casaFound ? `Casa ${casaFound.numero_casa} - ${casaFound.bloque || 'Sector Residencial'}` : formData.nombre
                      });
                    }}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                  >
                    <option value="">-- Seleccione una Casa --</option>
                    {casas.map(c => (
                      <option key={c.id} value={c.id}>
                        Casa {c.numero_casa} ({c.bloque || 'Sin bloque'}) - {c.tiene_contrato_seguridad ? '✓ Contrato Activo' : '✗ Sin Contrato'} {c.residentes_nombres ? `[${c.residentes_nombres}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nombre descriptivo del punto */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '0.375rem' }}>
                  Nombre Descriptivo del Punto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Garita Norte, Poste Perimetral #4, Casa B25"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}
                />
              </div>

              {/* Geolocalización */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                    Coordenadas GPS (Latitud / Longitud)
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureCurrentLocation}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ca8a04',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Navigation size={13} /> Capturar GPS Actual
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Latitud</span>
                    <input
                      type="text"
                      required
                      placeholder="12.136400"
                      value={formData.latitud}
                      onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                      style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Longitud</span>
                    <input
                      type="text"
                      required
                      placeholder="-86.251400"
                      value={formData.longitud}
                      onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                      style={{ width: '100%', padding: '0.625rem', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '0.75rem 1.75rem', backgroundColor: '#FACC15', color: '#0f172a', border: 'none', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(250, 204, 21, 0.25)' }}
                >
                  {isSubmitting ? 'Guardando...' : editingPunto ? 'Actualizar Punto' : 'Crear y Generar Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FICHA IMPRIMIBLE OFICIAL DE CONTROL QR (PARA PARED/POSTE) */}
      {printablePunto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', width: '100%', maxWidth: '520px', padding: '2rem', color: '#0f172a', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', position: 'relative' }}>
            
            {/* Botones de acción modal (no imprimibles) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748b' }}>Vista Previa de Ficha Imprimible</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handlePrint}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#1e293b',
                    color: '#FACC15',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: '800',
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={16} /> Imprimir Ficha
                </button>
                <button
                  onClick={() => setPrintablePunto(null)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ÁREA IMPRIMIBLE (PLACA DE PARED/POSTE) */}
            <div id="ficha-imprimible-area" style={{ border: '3px solid #0f172a', borderRadius: '16px', padding: '1.75rem', backgroundColor: '#ffffff', textAlign: 'center' }}>
              {/* Cabecera Corporativa NCS365 */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ backgroundColor: '#0f172a', padding: '0.35rem 0.5rem', borderRadius: '6px', color: '#FACC15', fontWeight: '900', fontSize: '1rem', letterSpacing: '0.05em' }}>
                    NCS365
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '0.875rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    New Century Security S.A.
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                  {residencialInfo?.nombre || 'SISTEMA INTELIGENTE DE PATRULLAJE'}
                </div>
              </div>

              {/* Nombre del Punto */}
              <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                {printablePunto.nombre}
              </h2>

              {/* Badge si tiene casa/contrato */}
              {printablePunto.casa_id && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', backgroundColor: printablePunto.tiene_contrato_seguridad ? '#dcfce7' : '#fee2e2', color: printablePunto.tiene_contrato_seguridad ? '#15803d' : '#b91c1c', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '1rem', border: `1px solid ${printablePunto.tiene_contrato_seguridad ? '#86efac' : '#fca5a5'}` }}>
                  {printablePunto.tiene_contrato_seguridad ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {printablePunto.tiene_contrato_seguridad ? 'CONTRATO DE SEGURIDAD PRIVADA ACTIVO' : 'SIN CONTRATO DE SEGURIDAD'}
                </div>
              )}

              {/* Código QR Generado */}
              <div style={{ margin: '0.5rem auto 1rem', display: 'flex', justifyContent: 'center' }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Token QR Oficial" style={{ width: '220px', height: '220px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                ) : (
                  <div style={{ width: '220px', height: '220px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Generando Código QR...
                  </div>
                )}
              </div>

              {/* Token de Seguridad */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Token Oficial Georreferenciado</div>
                <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', letterSpacing: '0.05em' }}>
                  {printablePunto.codigo_qr || `NCS-QR-${printablePunto.id}`}
                </div>
              </div>

              {/* Instrucción al Guardia */}
              <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: '600', lineHeight: 1.4, borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                ⚠️ <strong>PUNTO DE CONTROL OBLIGATORIO:</strong> El oficial en ronda debe escanear este código QR usando la aplicación móvil NCS365 para certificar su presencia y geolocalización satelital.
              </div>
            </div>

            {/* Botón de Descarga PNG (no imprimible) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`QR-${printablePunto.nombre.replace(/\s+/g, '_')}.png`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#2563eb',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  <Download size={15} /> Descargar Archivo de Imagen PNG
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {puntoToDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem', width: '100%', maxWidth: '420px', padding: '1.75rem', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Eliminar Punto QR</h3>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              ¿Está seguro de que desea eliminar el punto de control <strong>&quot;{puntoToDelete.nombre}&quot;</strong>? Esta acción no se puede deshacer y deshabilitará el token QR asociado.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setPuntoToDelete(null)}
                style={{ padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePunto}
                style={{ padding: '0.625rem 1.5rem', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

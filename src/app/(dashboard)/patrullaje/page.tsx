'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Play, 
  Square, 
  Bell, 
  Navigation, 
  CheckCircle, 
  AlertTriangle, 
  List, 
  QrCode, 
  Camera, 
  Send, 
  Clock, 
  UserCheck, 
  Car, 
  LogIn, 
  LogOut, 
  Plus, 
  Home, 
  Search, 
  Siren, 
  Check, 
  X, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { 
  trackingApi, 
  pushApi, 
  rondasApi, 
  puntosQrApi, 
  incidentesApi, 
  visitasApi, 
  residencialApi,
  PuntoQR, 
  AsignacionRonda, 
  MarcacionRonda, 
  Visita, 
  Casa 
} from '@/lib/api';

// Helper para convertir la clave pública VAPID (Base64 URL Safe) a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PatrullajePage() {
  const [rol, setRol] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [email, setEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'GPS' | 'RONDAS' | 'INCIDENTES' | 'GARITA'>('GPS');

  // GPS & Tracking
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [trackingLogs, setTrackingLogs] = useState<string[]>([]);
  const [pushStatus, setPushStatus] = useState<'disabled' | 'granted' | 'denied' | 'subscribed'>('disabled');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successBanner, setSuccessBanner] = useState<string>('');

  const watchIdRef = useRef<number | null>(null);
  const lastSentTimeRef = useRef<number>(0);

  // Rondas y Escaneo QR
  const [asignaciones, setAsignaciones] = useState<AsignacionRonda[]>([]);
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [selectedAsignacionId, setSelectedAsignacionId] = useState<string>('');
  const [qrCodeInput, setQrCodeInput] = useState<string>('');
  const [observacionRonda, setObservacionRonda] = useState<string>('');
  const [isSubmittingScan, setIsSubmittingScan] = useState<boolean>(false);
  const [misMarcaciones, setMisMarcaciones] = useState<MarcacionRonda[]>([]);

  // Incidentes
  const [incidenteTipo, setIncidenteTipo] = useState<string>('VEHICULO_SOSPECHOSO');
  const [incidenteGravedad, setIncidenteGravedad] = useState<string>('MEDIA');
  const [incidenteDescripcion, setIncidenteDescripcion] = useState<string>('');
  const [isSubmittingIncidente, setIsSubmittingIncidente] = useState<boolean>(false);

  // Garita y Visitas
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [busquedaVisita, setBusquedaVisita] = useState<string>('');
  const [modalNuevaVisita, setModalNuevaVisita] = useState<boolean>(false);
  const [nuevaVisitaForm, setNuevaVisitaForm] = useState({
    nombre_visitante: '',
    cedula_visitante: '',
    numero_casa: '',
    medio_ingreso: 'VEHICULO',
    placa_vehiculo: '',
    fecha_esperada: new Date().toISOString().split('T')[0]
  });

  // Cargar info del usuario
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('user_role');
      setRol(userRole);
      
      const emailVal = localStorage.getItem('user_email') || 'Guardia';
      setEmail(emailVal);

      // Decodificar el token JWT para extraer el usuario_id si es posible
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const payload = JSON.parse(window.atob(token.split('.')[1]));
          if (payload && (payload.usuario_id || payload.sub)) {
            setUsuarioId(Number(payload.usuario_id || payload.sub));
          }
        } catch (e) {
          console.error("Error decodificando token:", e);
        }
      }

      loadInitialOperationalData();
    }

    // Registrar Service Worker para Push
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          reg.pushManager.getSubscription().then(sub => {
            if (sub) {
              setPushStatus('subscribed');
            } else if (Notification.permission === 'granted') {
              setPushStatus('granted');
            } else if (Notification.permission === 'denied') {
              setPushStatus('denied');
            }
          });
        })
        .catch(err => {
          console.error('Error registrando Service Worker:', err);
        });
    }
  }, []);

  const loadInitialOperationalData = async () => {
    try {
      const [asigs, pts, marcs, vis, cs] = await Promise.all([
        rondasApi.getAsignaciones().catch(() => []),
        puntosQrApi.getPuntos().catch(() => []),
        rondasApi.getMarcaciones(15).catch(() => []),
        visitasApi.getVisitas().catch(() => []),
        residencialApi.getCasas().catch(() => [])
      ]);

      setAsignaciones(asigs || []);
      if (asigs && asigs.length > 0) {
        setSelectedAsignacionId(asigs[0].id?.toString() || '');
      }
      setPuntos(pts || []);
      setMisMarcaciones(marcs || []);
      setVisitas(vis || []);
      setCasas(cs || []);
    } catch (e) {
      console.error('Error cargando datos operativos móviles:', e);
    }
  };

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setTrackingLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  };

  const showNotification = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(''), 4500);
  };

  // Activar Notificaciones Push
  const suscribirNotificaciones = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Las notificaciones push no están soportadas en este navegador.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        setPushStatus('denied');
        alert('Permiso de notificaciones denegado. Actívalas manualmente en la configuración del navegador.');
        return;
      }

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const pubKey = await pushApi.getVAPIDPublicKey();
        const convertedKey = urlBase64ToUint8Array(pubKey);

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        const subJSON = sub.toJSON();
        const p256dh = subJSON.keys?.p256dh || '';
        const auth = subJSON.keys?.auth || '';
        const endpoint = subJSON.endpoint || '';

        await pushApi.subscribe({
          endpoint,
          p256dh,
          auth
        });

        setPushStatus('subscribed');
        addLog('Notificaciones push activadas correctamente.');
        showNotification('Alertas push activadas en este dispositivo.');
      }
    } catch (err: any) {
      console.error('Error suscribiendo a push:', err);
      alert('Error activando notificaciones: ' + err.message);
    }
  };

  // Iniciar envío de ubicación GPS
  const iniciarRecorrido = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocalización no soportada en este dispositivo.');
      return;
    }

    setIsTracking(true);
    addLog('Iniciando monitoreo de patrullaje GPS...');

    const successCallback = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      setCurrentCoords({ lat: latitude, lng: longitude, accuracy });

      const now = Date.now();
      // Enviar al backend con throttle de 10 segundos
      if (now - lastSentTimeRef.current >= 10000) {
        lastSentTimeRef.current = now;
        try {
          if (usuarioId) {
            await trackingApi.updateLocation({
              usuario_id: usuarioId,
              latitud: latitude,
              longitud: longitude
            });
            addLog(`Ubicación enviada: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (err) {
          console.error("Error transmitiendo ubicación:", err);
          addLog('Error al enviar la ubicación al servidor');
        }
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error("Error leyendo GPS:", error);
      let desc = 'Error desconocido';
      if (error.code === 1) desc = 'Permiso de GPS denegado';
      else if (error.code === 2) desc = 'Posición no disponible';
      else if (error.code === 3) desc = 'Tiempo de espera agotado';
      
      setErrorMsg(`GPS Error: ${desc}`);
      addLog(`GPS Error: ${desc}`);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const detenerRecorrido = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    addLog('Recorrido finalizado.');
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // REGISTRAR ESCANEO DE RONDA QR
  const handleRegistrarEscaneo = async (codigoQrParam?: string) => {
    const code = codigoQrParam || qrCodeInput.trim();
    if (!code) {
      alert('Seleccione o ingrese un código QR de punto de control.');
      return;
    }

    setIsSubmittingScan(true);
    try {
      await rondasApi.registrarMarcacion({
        codigo_qr: code,
        asignacion_ronda_id: selectedAsignacionId ? parseInt(selectedAsignacionId) : null,
        latitud: currentCoords?.lat,
        longitud: currentCoords?.lng,
        observacion: observacionRonda || 'Marcación desde Terminal Móvil'
      });

      showNotification(`✓ Punto ${code} certificado con éxito en ronda.`);
      addLog(`Escaneo QR exitoso: ${code}`);
      setQrCodeInput('');
      setObservacionRonda('');
      // Refrescar marcaciones y asignaciones
      loadInitialOperationalData();
    } catch (e: any) {
      console.error(e);
      alert('Error al certificar el punto QR. Verifique el código ingresado.');
    } finally {
      setIsSubmittingScan(false);
    }
  };

  // REPORTAR INCIDENTE RÁPIDO
  const handleReportarIncidente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidenteDescripcion.trim()) {
      alert('Por favor ingrese una breve descripción de la novedad.');
      return;
    }

    setIsSubmittingIncidente(true);
    try {
      await incidentesApi.createIncidente({
        tipo: incidenteTipo,
        nivel_gravedad: incidenteGravedad,
        descripcion: incidenteDescripcion.trim(),
        reportado_por: email,
        evidencia_url: currentCoords ? `GPS: ${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}` : undefined
      });

      showNotification(`🚨 Incidente [${incidenteGravedad}] reportado a la central.`);
      addLog(`Incidente reportado: ${incidenteTipo} (${incidenteGravedad})`);
      setIncidenteDescripcion('');
      // Si el incidente es ALTO o CRITICO, vibrar dispositivo
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.error(e);
      alert('Error enviando el reporte de incidente.');
    } finally {
      setIsSubmittingIncidente(false);
    }
  };

  // CONTROL DE ACCESOS / VISITAS EN GARITA
  const handleCambiarEstadoVisita = async (visitaId: number, nuevoEstado: string) => {
    try {
      await visitasApi.actualizarEstado(visitaId, nuevoEstado);
      showNotification(`Visita actualizada a: ${nuevoEstado}`);
      addLog(`Control Garita: Visita #${visitaId} -> ${nuevoEstado}`);
      loadInitialOperationalData();
    } catch (e) {
      console.error(e);
      alert('Error actualizando el estado de la visita.');
    }
  };

  const handleCrearVisitaExpress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaVisitaForm.nombre_visitante.trim() || !nuevaVisitaForm.numero_casa.trim()) {
      alert('Ingrese el nombre del visitante y la casa de destino.');
      return;
    }

    try {
      await visitasApi.registrarVisita({
        id: 0,
        residencial_id: '',
        nombre_visitante: nuevaVisitaForm.nombre_visitante.trim(),
        cedula_visitante: nuevaVisitaForm.cedula_visitante.trim() || 'N/A',
        numero_casa: nuevaVisitaForm.numero_casa.trim(),
        medio_ingreso: nuevaVisitaForm.medio_ingreso,
        placa_vehiculo: nuevaVisitaForm.placa_vehiculo.trim(),
        fecha_esperada: nuevaVisitaForm.fecha_esperada,
        estado: 'EN_CURSO' // Si entra por garita express, ingresa directo
      });

      showNotification('✓ Visitante registrado y acceso autorizado.');
      setModalNuevaVisita(false);
      setNuevaVisitaForm({
        nombre_visitante: '',
        cedula_visitante: '',
        numero_casa: '',
        medio_ingreso: 'VEHICULO',
        placa_vehiculo: '',
        fecha_esperada: new Date().toISOString().split('T')[0]
      });
      loadInitialOperationalData();
    } catch (e) {
      console.error(e);
      alert('Error registrando visitante express.');
    }
  };

  // Filtrar visitas en garita
  const visitasFiltradas = visitas.filter(v => {
    const q = busquedaVisita.toLowerCase();
    return (
      v.nombre_visitante.toLowerCase().includes(q) ||
      v.numero_casa.toLowerCase().includes(q) ||
      (v.placa_vehiculo && v.placa_vehiculo.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '1rem', color: '#1e293b', maxWidth: '580px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Encabezado Corporativo Móvil */}
      <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', padding: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', border: '1px solid #1e293b', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
            <Shield color="#FACC15" size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#FACC15', fontWeight: '800', letterSpacing: '0.05em' }}>
              NCS365 • TERMINAL DE SEGURIDAD
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
              {rol === 'GUARDIA' ? 'Terminal de Guardia' : 'Consola Operativa Garita'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>{email}</p>
          </div>
        </div>

        <button
          onClick={loadInitialOperationalData}
          title="Sincronizar Datos"
          style={{ background: 'none', border: 'none', color: '#FACC15', cursor: 'pointer', padding: '0.5rem' }}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Banner de Supervisor si no es guardia */}
      {rol && rol !== 'GUARDIA' && (
        <div style={{ padding: '0.625rem 1rem', backgroundColor: 'rgba(250, 204, 21, 0.15)', color: '#ca8a04', border: '1px solid #FACC15', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={16} /> Modo Supervisor ({rol}): Probando funciones de ronda, incidentes y garita.
        </div>
      )}

      {/* Banner de Notificación */}
      {successBanner && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#22c55e', color: '#ffffff', borderRadius: '0.625rem', marginBottom: '1rem', fontSize: '0.8125rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)' }}>
          <CheckCircle size={18} /> {successBanner}
        </div>
      )}

      {/* Alertas GPS de error */}
      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '0.625rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: '600' }}>
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      {/* Barra de Navegación Móvil (Tabs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', backgroundColor: '#1e293b', padding: '0.35rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('GPS')}
          style={{
            padding: '0.625rem 0.25rem',
            backgroundColor: activeTab === 'GPS' ? '#FACC15' : 'transparent',
            color: activeTab === 'GPS' ? '#0f172a' : '#94a3b8',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '800',
            fontSize: '0.7rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem'
          }}
        >
          <Navigation size={16} /> GPS
        </button>

        <button
          onClick={() => setActiveTab('RONDAS')}
          style={{
            padding: '0.625rem 0.25rem',
            backgroundColor: activeTab === 'RONDAS' ? '#FACC15' : 'transparent',
            color: activeTab === 'RONDAS' ? '#0f172a' : '#94a3b8',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '800',
            fontSize: '0.7rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem'
          }}
        >
          <QrCode size={16} /> Rondas
        </button>

        <button
          onClick={() => setActiveTab('INCIDENTES')}
          style={{
            padding: '0.625rem 0.25rem',
            backgroundColor: activeTab === 'INCIDENTES' ? '#FACC15' : 'transparent',
            color: activeTab === 'INCIDENTES' ? '#0f172a' : '#94a3b8',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '800',
            fontSize: '0.7rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem'
          }}
        >
          <Siren size={16} /> Novedad
        </button>

        <button
          onClick={() => setActiveTab('GARITA')}
          style={{
            padding: '0.625rem 0.25rem',
            backgroundColor: activeTab === 'GARITA' ? '#FACC15' : 'transparent',
            color: activeTab === 'GARITA' ? '#0f172a' : '#94a3b8',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '800',
            fontSize: '0.7rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem'
          }}
        >
          <Car size={16} /> Garita
        </button>
      </div>

      {/* ===================== TAB 1: GPS & PATRULLAJE ===================== */}
      {activeTab === 'GPS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Tarjeta de Control GPS */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={18} color={isTracking ? '#22c55e' : '#64748b'} />
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>
                  Transmisión Satelital
                </span>
              </div>
              <span style={{
                fontSize: '0.7rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: '800',
                backgroundColor: isTracking ? 'rgba(34, 197, 94, 0.15)' : '#f1f5f9',
                color: isTracking ? '#16a34a' : '#64748b'
              }}>
                {isTracking ? '● EN VIVO' : 'PAUSADO'}
              </span>
            </div>

            {currentCoords && isTracking && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#475569' }}>
                  <span>Lat / Lng:</span>
                  <strong style={{ color: '#0f172a' }}>{currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Precisión:</span>
                  <strong style={{ color: '#16a34a' }}>±{currentCoords.accuracy.toFixed(1)}m</strong>
                </div>
              </div>
            )}

            {!isTracking ? (
              <button
                onClick={iniciarRecorrido}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  backgroundColor: '#FACC15',
                  color: '#0f172a',
                  border: 'none',
                  padding: '1.15rem',
                  borderRadius: '0.75rem',
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(250, 204, 21, 0.35)'
                }}
              >
                <Play size={20} fill="#0f172a" /> Iniciar Patrullaje GPS
              </button>
            ) : (
              <button
                onClick={detenerRecorrido}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '1.15rem',
                  borderRadius: '0.75rem',
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                }}
              >
                <Square size={20} fill="white" /> Detener Patrullaje
              </button>
            )}
          </div>

          {/* Notificaciones Push VAPID */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bell size={16} color="#FACC15" /> Alertas Push de Central
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                {pushStatus === 'subscribed' ? 'Alertas activas para pantalla bloqueada' : 'Permite recibir consignas urgentes'}
              </p>
            </div>

            {pushStatus === 'subscribed' ? (
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                ✓ Activo
              </span>
            ) : (
              <button
                onClick={suscribirNotificaciones}
                style={{ padding: '0.45rem 0.85rem', backgroundColor: '#0f172a', color: '#FACC15', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
              >
                Activar
              </button>
            )}
          </div>

          {/* Bitácora de Actividad */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <List size={16} color="#64748b" /> Bitácora Local del Dispositivo
            </h3>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.625rem', height: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {trackingLogs.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin eventos recientes...</span>
              ) : (
                trackingLogs.map((logStr, i) => (
                  <span key={i} style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#475569' }}>
                    {logStr}
                  </span>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ===================== TAB 2: RONDAS Y ESCÁNER QR ===================== */}
      {activeTab === 'RONDAS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Tarjeta de Escaneo */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <QrCode size={20} color="#ca8a04" />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Certificar Punto de Ronda</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Escanear ficha física o seleccionar del catálogo</p>
              </div>
            </div>

            {/* Asignación Activa */}
            {asignaciones.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                  Ronda Asignada
                </label>
                <select
                  value={selectedAsignacionId}
                  onChange={(e) => setSelectedAsignacionId(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem', fontWeight: '600' }}
                >
                  {asignaciones.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.programa_nombre || `Ronda #${a.id}`} ({a.estado || 'PENDIENTE'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector Rápido de Punto de Control QR */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                Punto QR a Certificar *
              </label>
              <select
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', fontWeight: '700', backgroundColor: '#f8fafc' }}
              >
                <option value="">-- Toque para Seleccionar Punto --</option>
                {puntos.map(p => (
                  <option key={p.id} value={p.codigo_qr}>
                    {p.nombre} ({p.codigo_qr}) {p.numero_casa ? `• Casa ${p.numero_casa}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón de Entrada Manual o Simulación */}
            <div>
              <input
                type="text"
                placeholder="O escribir token manual (ej: NCS-QR-1)..."
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                Observación de Seguridad (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Todo en orden, sin novedades"
                value={observacionRonda}
                onChange={(e) => setObservacionRonda(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}
              />
            </div>

            <button
              onClick={() => handleRegistrarEscaneo()}
              disabled={isSubmittingScan}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#0f172a',
                color: '#FACC15',
                border: 'none',
                padding: '1.15rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)'
              }}
            >
              <CheckCircle size={20} />
              {isSubmittingScan ? 'Certificando Punto...' : 'Certificar Escaneo QR'}
            </button>
          </div>

          {/* Historial de Marcaciones Recientes */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '800', margin: '0 0 0.75rem 0' }}>
              Últimas Marcaciones Certificadas
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
              {misMarcaciones.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aún no hay puntos escaneados en este turno.</span>
              ) : (
                misMarcaciones.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{m.punto_nombre || `Punto #${m.punto_qr_id}`}</strong>
                      <span style={{ color: '#64748b' }}>{m.guardia_nombre || email}</span>
                    </div>
                    <span style={{ fontWeight: '700', color: '#16a34a' }}>
                      {m.fecha_hora ? new Date(m.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ===================== TAB 3: REPORTAR INCIDENCIA ===================== */}
      {activeTab === 'INCIDENTES' && (
        <form onSubmit={handleReportarIncidente} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Siren size={22} color="#ef4444" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#ef4444' }}>
                Reporte de Novedad / Incidente
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                Notifica de inmediato a la central de monitoreo
              </p>
            </div>
          </div>

          {/* Nivel de Gravedad */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem' }}>
              Nivel de Gravedad *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {[
                { id: 'BAJA', label: 'Baja', color: '#16a34a', bg: '#dcfce7' },
                { id: 'MEDIA', label: 'Media', color: '#ca8a04', bg: '#fef08a' },
                { id: 'ALTA', label: 'Alta', color: '#ea580c', bg: '#ffedd5' },
                { id: 'CRITICA', label: 'Crítica', color: '#dc2626', bg: '#fee2e2' }
              ].map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setIncidenteGravedad(g.id)}
                  style={{
                    padding: '0.625rem 0.25rem',
                    borderRadius: '0.5rem',
                    border: incidenteGravedad === g.id ? `2px solid ${g.color}` : '1px solid #e2e8f0',
                    backgroundColor: incidenteGravedad === g.id ? g.bg : '#ffffff',
                    color: g.color,
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Novedad */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
              Tipo de Novedad *
            </label>
            <select
              value={incidenteTipo}
              onChange={(e) => setIncidenteTipo(e.target.value)}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem', fontWeight: '700' }}
            >
              <option value="VEHICULO_SOSPECHOSO">Vehículo Sospechoso</option>
              <option value="ROBO_INTRUSION">Robo / Intrusión al Perímetro</option>
              <option value="ACCIDENTE">Accidente / Caída</option>
              <option value="ALTERACION_ORDEN">Alteración al Orden / Ruido</option>
              <option value="FALLA_LUMINARIA_PORTON">Falla Mecánica o Portón Abierto</option>
              <option value="OTRO">Otra Novedad</option>
            </select>
          </div>

          {/* Presets Rápidos */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem' }}>
              Opciones Rápidas de Descripción:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {[
                'Vehículo sin placa estacionado frente a garita',
                'Portón secundario encontrado sin candado',
                'Luminaria perimetral apagada',
                'Alarma perimetral activada por movimiento',
                'Discusión entre residentes o visitantes'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setIncidenteDescripcion(preset)}
                  style={{
                    padding: '0.35rem 0.6rem',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
              Detalles de lo Ocurrido *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describa brevemente la novedad..."
              value={incidenteDescripcion}
              onChange={(e) => setIncidenteDescripcion(e.target.value)}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingIncidente}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '1.15rem',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Send size={18} /> {isSubmittingIncidente ? 'Enviando Alerta...' : 'Enviar Reporte de Incidente'}
          </button>
        </form>
      )}

      {/* ===================== TAB 4: GARITA & VISITAS ===================== */}
      {activeTab === 'GARITA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Barra Superior Garita */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={20} color="#ca8a04" />
                <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>Control de Garita y Visitas</h3>
              </div>
              <button
                onClick={() => setModalNuevaVisita(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.85rem',
                  backgroundColor: '#0f172a',
                  color: '#FACC15',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Visita Express
              </button>
            </div>

            {/* Búsqueda rápida */}
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar visitante por nombre, casa o placa..."
                value={busquedaVisita}
                onChange={(e) => setBusquedaVisita(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Listado de Visitas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visitasFiltradas.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
                <Car size={36} color="#ca8a04" style={{ margin: '0 auto 0.5rem', opacity: 0.7 }} />
                <p style={{ margin: 0, fontWeight: '700' }}>No hay visitas registradas hoy.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Utilice &quot;Visita Express&quot; para dar paso rápido a un vehículo o persona.</p>
              </div>
            ) : (
              visitasFiltradas.map((v) => {
                const enCurso = v.estado === 'EN_CURSO';
                const finalizada = v.estado === 'FINALIZADA';

                return (
                  <div
                    key={v.id}
                    style={{
                      backgroundColor: 'white',
                      border: enCurso ? '2px solid #22c55e' : '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                          {v.nombre_visitante}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span style={{ color: '#ca8a04', fontWeight: '800' }}>Casa {v.numero_casa}</span>
                          {v.placa_vehiculo && (
                            <span style={{ backgroundColor: '#1e293b', color: '#FACC15', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '700' }}>
                              Placa: {v.placa_vehiculo}
                            </span>
                          )}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: enCurso ? '#dcfce7' : finalizada ? '#f1f5f9' : '#fef08a',
                        color: enCurso ? '#15803d' : finalizada ? '#64748b' : '#a16207'
                      }}>
                        {v.estado}
                      </span>
                    </div>

                    {/* Botones de acción 1-Toque Garita */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                      {!enCurso && !finalizada && (
                        <button
                          onClick={() => handleCambiarEstadoVisita(v.id, 'EN_CURSO')}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            backgroundColor: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontWeight: '800',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <LogIn size={15} /> Dar Entrada
                        </button>
                      )}

                      {enCurso && (
                        <button
                          onClick={() => handleCambiarEstadoVisita(v.id, 'FINALIZADA')}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            backgroundColor: '#0f172a',
                            color: '#FACC15',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontWeight: '800',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <LogOut size={15} /> Marcar Salida
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* MODAL VISITA EXPRESS GARITA */}
      {modalNuevaVisita && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '440px', padding: '1.5rem', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Registro Rápido en Garita</h3>
              <button onClick={() => setModalNuevaVisita(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCrearVisitaExpress} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.2rem' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Mendoza"
                  value={nuevaVisitaForm.nombre_visitante}
                  onChange={(e) => setNuevaVisitaForm({ ...nuevaVisitaForm, nombre_visitante: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.2rem' }}>Cédula / DNI</label>
                  <input
                    type="text"
                    placeholder="001-XXXXXX-XXXX"
                    value={nuevaVisitaForm.cedula_visitante}
                    onChange={(e) => setNuevaVisitaForm({ ...nuevaVisitaForm, cedula_visitante: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.2rem' }}>Casa Destino *</label>
                  <select
                    required
                    value={nuevaVisitaForm.numero_casa}
                    onChange={(e) => setNuevaVisitaForm({ ...nuevaVisitaForm, numero_casa: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                  >
                    <option value="">-- Seleccionar --</option>
                    {casas.map(c => (
                      <option key={c.id} value={c.numero_casa}>
                        Casa {c.numero_casa} ({c.bloque})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.2rem' }}>Medio de Ingreso</label>
                  <select
                    value={nuevaVisitaForm.medio_ingreso}
                    onChange={(e) => setNuevaVisitaForm({ ...nuevaVisitaForm, medio_ingreso: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                  >
                    <option value="VEHICULO">Vehículo</option>
                    <option value="PEATONAL">Peatonal</option>
                    <option value="MOTO">Motocicleta</option>
                    <option value="DELIVERY">Delivery / Encomienda</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.2rem' }}>Placa Vehículo</label>
                  <input
                    type="text"
                    placeholder="M-123456"
                    value={nuevaVisitaForm.placa_vehiculo}
                    onChange={(e) => setNuevaVisitaForm({ ...nuevaVisitaForm, placa_vehiculo: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalNuevaVisita(false)}
                  style={{ padding: '0.625rem 1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.8125rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.625rem 1.25rem', backgroundColor: '#FACC15', color: '#0f172a', border: 'none', borderRadius: '0.5rem', fontWeight: '800', fontSize: '0.8125rem', cursor: 'pointer' }}
                >
                  Autorizar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

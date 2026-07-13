'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Play, Square, Bell, BellOff, Navigation, CheckCircle, AlertTriangle, List } from 'lucide-react';
import { trackingApi, pushApi } from '@/lib/api';

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

  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [trackingLogs, setTrackingLogs] = useState<string[]>([]);
  const [pushStatus, setPushStatus] = useState<'disabled' | 'granted' | 'denied' | 'subscribed'>('disabled');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const watchIdRef = useRef<number | null>(null);
  const lastSentTimeRef = useRef<number>(0);

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
          if (payload && payload.usuario_id) {
            setUsuarioId(Number(payload.usuario_id));
          }
        } catch (e) {
          console.error("Error decodificando token:", e);
        }
      }
    }

    // Registrar Service Worker de inmediato para el Push
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker registrado correctamente.', reg);
          // Verificar si ya está suscrito
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

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setTrackingLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
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
        
        // Obtener clave VAPID del backend
        const pubKey = await pushApi.getVAPIDPublicKey();
        const convertedKey = urlBase64ToUint8Array(pubKey);

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        // Convertir llaves para enviar al backend
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
          } else {
            console.warn("No se pudo obtener el usuario_id del token");
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

  // Limpiar watch al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Verificar rol de guardia
  if (rol !== 'GUARDIA') {
    return (
      <div style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center', color: '#1e293b' }}>
        <AlertTriangle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b' }}>
          Esta pantalla de **Patrullaje Móvil** está destinada exclusivamente para los guardias de seguridad en servicio para que transmitan su ubicación al mapa del centro de control.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', color: '#1e293b', maxWidth: '480px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Encabezado Corporativo */}
      <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', padding: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', border: '1px solid #1e293b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '50%' }}>
          <Shield color="#FACC15" size={28} />
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#FACC15', fontWeight: 'bold', letterSpacing: '0.05em' }}>New Century Security</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Terminal de Guardia</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{email}</p>
        </div>
      </div>

      {/* Alertas y Mensajes de Error */}
      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <strong style={{ display: 'block', fontWeight: '600' }}>Fallo en el GPS</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Panel Principal de Control */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Estado GPS actual */}
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Navigation size={18} color={isTracking ? '#22c55e' : '#64748b'} />
            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
              Estado del GPS:
            </span>
          </div>
          <span style={{ 
            fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 'bold',
            backgroundColor: isTracking ? 'rgba(34, 197, 94, 0.1)' : '#f1f5f9',
            color: isTracking ? '#22c55e' : '#64748b'
          }}>
            {isTracking ? 'TRANSMITIENDO EN VIVO' : 'PAUSADO'}
          </span>
        </div>

        {/* Coordenadas vigentes */}
        {currentCoords && isTracking && (
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#475569' }}>
              <span>Latitud:</span>
              <strong style={{ color: '#0f172a' }}>{currentCoords.lat.toFixed(6)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#475569' }}>
              <span>Longitud:</span>
              <strong style={{ color: '#0f172a' }}>{currentCoords.lng.toFixed(6)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Precisión del GPS:</span>
              <strong style={{ color: '#22c55e' }}>±{currentCoords.accuracy.toFixed(1)}m</strong>
            </div>
          </div>
        )}

        {/* Botón Principal Recorrido */}
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
              padding: '1.25rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(250, 204, 21, 0.3)',
              transition: 'background-color 0.2s'
            }}
          >
            <Play size={20} fill="#0f172a" />
            Iniciar Patrullaje
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
              padding: '1.25rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
              transition: 'background-color 0.2s'
            }}
          >
            <Square size={20} fill="white" />
            Detener Patrullaje
          </button>
        )}
      </div>

      {/* Configuración de Alertas Push */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={18} color="#FACC15" />
          Alertas de Administración
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
          Recibe alertas urgentes y consignas del centro de control en tiempo real, incluso si tu pantalla está bloqueada.
        </p>

        {pushStatus === 'subscribed' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle size={16} />
            Alertas en tiempo real activadas
          </div>
        ) : (
          <button
            onClick={suscribirNotificaciones}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#0f172a',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <Bell size={16} />
            Habilitar Alertas
          </button>
        )}
      </div>

      {/* Bitácora / Logs de la Actividad */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <List size={18} color="#64748b" />
          Registro de Actividad
        </h3>
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem', height: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {trackingLogs.length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Esperando inicio de recorrido...</span>
          ) : (
            trackingLogs.map((logStr, i) => (
              <span key={i} style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.125rem' }}>
                {logStr}
              </span>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

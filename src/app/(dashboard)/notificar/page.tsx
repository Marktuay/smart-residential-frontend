'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle, AlertTriangle, Users, ShieldAlert } from 'lucide-react';
import { usuariosApi, pushApi, Usuario } from '@/lib/api';

export default function NotificarPage() {
  const [rol, setRol] = useState<string | null>(null);
  const [guardias, setGuardias] = useState<Usuario[]>([]);
  
  // Formulario
  const [selectedGuardiaId, setSelectedGuardiaId] = useState<string>('');
  const [titulo, setTitulo] = useState<string>('Alerta de Seguridad');
  const [cuerpo, setCuerpo] = useState<string>('');
  
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string>('');
  const [mensajeError, setMensajeError] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('user_role');
      setRol(userRole);

      if (userRole === 'ADMIN' || userRole === 'SISADMIN') {
        fetchGuardias();
      }
    }
  }, []);

  const fetchGuardias = async () => {
    try {
      const allUsers = await usuariosApi.getUsuarios();
      setGuardias(allUsers.filter(u => u.rol === 'GUARDIA'));
    } catch (err) {
      console.error("Error cargando guardias:", err);
    }
  };

  const enviarAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !cuerpo.trim()) {
      setMensajeError("El título y el cuerpo del mensaje son requeridos.");
      return;
    }

    setCargando(true);
    setMensajeExito('');
    setMensajeError('');

    try {
      const guardiaId = selectedGuardiaId === '' ? undefined : Number(selectedGuardiaId);
      const res = await pushApi.sendNotification({
        guardia_id: guardiaId,
        titulo,
        cuerpo
      });

      setMensajeExito(`Notificación push enviada con éxito. Enviadas: ${res.enviadas}, Fallidas: ${res.fallidas}.`);
      setCuerpo('');
    } catch (err: any) {
      console.error("Error enviando push:", err);
      setMensajeError("Error al despachar la notificación push: " + (err.response?.data || err.message));
    } finally {
      setCargando(false);
    }
  };

  if (rol !== 'ADMIN' && rol !== 'SISADMIN') {
    return (
      <div style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center', color: '#1e293b' }}>
        <AlertTriangle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b' }}>
          Esta pantalla de **Despacho de Alertas** está restringida exclusivamente para personal administrativo y directores del residencial.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: '#1e293b', maxWidth: '700px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert color="#FACC15" size={32} />
          Despacho de Alertas Push
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Envía notificaciones de alerta instantáneas a los navegadores y dispositivos de tus guardias de seguridad en turno.
        </p>
      </div>

      {/* Alertas de Estado */}
      {mensajeExito && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* Formulario */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <form onSubmit={enviarAlerta} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Selector de Destinatario */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
              <Users size={16} />
              Enviar a:
            </label>
            <select
              value={selectedGuardiaId}
              onChange={e => setSelectedGuardiaId(e.target.value)}
              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.75rem 1rem', outline: 'none', backgroundColor: 'white', fontSize: '0.95rem' }}
            >
              <option value="">-- Todos los Guardias del Residencial --</option>
              {guardias.map(g => (
                <option key={g.id} value={g.id}>
                  {g.email} (ID: {g.id})
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Por defecto se enviará a todos los guardias activos que tengan habilitadas las alertas en su dispositivo.
            </p>
          </div>

          {/* Título de Alerta */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
              Título del Mensaje
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: ALERTA: Incidente en Sector B"
              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.75rem 1rem', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Cuerpo / Contenido de la Alerta */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
              Cuerpo de la Notificación (Máx. 120 caracteres)
            </label>
            <textarea
              required
              rows={4}
              maxLength={120}
              value={cuerpo}
              onChange={e => setCuerpo(e.target.value)}
              placeholder="Escribe la instrucción o alerta para el guardia..."
              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.75rem 1rem', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={cargando}
            style={{
              backgroundColor: '#FACC15',
              color: '#0f172a',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              cursor: cargando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(250, 204, 21, 0.2)',
              opacity: cargando ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            <Send size={18} />
            {cargando ? "Despachando..." : "Despachar Alerta Push"}
          </button>

        </form>
      </div>

    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Bell, 
  Clock, 
  Building, 
  RefreshCw, 
  Settings, 
  Play, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Truck, 
  Navigation, 
  Siren, 
  Filter, 
  Search, 
  ExternalLink,
  Sliders,
  Check,
  X,
  MessageSquare,
  Send,
  Sparkles,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { hermesApi, HermesStatus, HermesAlerta, HermesConfig } from '@/lib/api';

export default function HermesSentinelPage() {
  const [status, setStatus] = useState<HermesStatus | null>(null);
  const [alertas, setAlertas] = useState<HermesAlerta[]>([]);
  const [config, setConfig] = useState<HermesConfig | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filtros
  const [filterSeveridad, setFilterSeveridad] = useState<string>('TODAS');
  const [filterEstado, setFilterEstado] = useState<string>('PENDIENTE');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [configForm, setConfigForm] = useState<Partial<HermesConfig>>({});
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  const [selectedAlerta, setSelectedAlerta] = useState<HermesAlerta | null>(null);
  const [resolveComment, setResolveComment] = useState<string>('');
  const [resolvingAlerta, setResolvingAlerta] = useState<boolean>(false);

  // Chat con Hermes IA
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'hermes'; text: string; fuente?: string; time: string }>>([
    {
      sender: 'hermes',
      text: '¡Saludos! Soy **Hermes Sentinel**, tu agente controlador autónomo. Superviso en tiempo real telemetría GPS, rondas perimetrales, emergencias SOS y flota pesada. ¿Qué novedad o reporte deseas verificar?',
      fuente: 'HERMES_ANALYTICS',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMsg, setInputMsg] = useState<string>('');
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);

  const handleEnviarMensaje = async (textoAEnviar?: string) => {
    const texto = (textoAEnviar || inputMsg).trim();
    if (!texto || sendingMsg) return;

    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nuevoMensajeUsuario = { sender: 'user' as const, text: texto, time: horaActual };
    const historialParaEnviar = chatMessages.slice(-10).map(m => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.text
    }));
    setChatMessages(prev => [...prev, nuevoMensajeUsuario]);
    setInputMsg('');
    setSendingMsg(true);

    try {
      const resp = await hermesApi.enviarMensaje(texto, historialParaEnviar, '/hermes');
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'hermes' as const,
          text: resp.respuesta,
          fuente: resp.fuente,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'hermes' as const,
          text: '⚠️ Disculpa, ocurrió una interrupción al consultar la base de datos o Gemini. Por favor intenta de nuevo.',
          fuente: 'HERMES_ANALYTICS',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setSendingMsg(false);
    }
  };

  // Carga inicial y periódica
  const cargarDatos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg('');

    try {
      const [statusRes, alertasRes, configRes] = await Promise.all([
        hermesApi.getStatus(),
        hermesApi.getAlertas(filterEstado, filterSeveridad),
        hermesApi.getConfig()
      ]);

      setStatus(statusRes);
      setAlertas(alertasRes);
      setConfig(configRes);
      setConfigForm(configRes);
    } catch (err: any) {
      console.error('Error cargando datos de Hermes:', err);
      setErrorMsg('No se pudo conectar con el motor Hermes Sentinel. Verifique el backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterEstado, filterSeveridad]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 30000); // Polling ligero cada 30 segundos
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Forzar escaneo manual
  const handleEvaluarAhora = async () => {
    setEvaluating(true);
    setErrorMsg('');
    try {
      const res = await hermesApi.evaluarAhora();
      setSuccessMsg('Ciclo de supervisión ejecutado exitosamente por Hermes.');
      setStatus(res.status);
      const nuevasAlertas = await hermesApi.getAlertas(filterEstado, filterSeveridad);
      setAlertas(nuevasAlertas);
    } catch (err: any) {
      setErrorMsg('Error al disparar el ciclo de evaluación: ' + (err.response?.data || err.message));
    } finally {
      setEvaluating(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Guardar configuración
  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const updated = await hermesApi.updateConfig(configForm);
      setConfig(updated);
      setIsConfigModalOpen(false);
      setSuccessMsg('Configuración de Hermes Sentinel actualizada con éxito.');
    } catch (err: any) {
      setErrorMsg('Error guardando configuración: ' + (err.response?.data || err.message));
    } finally {
      setSavingConfig(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Resolver alerta
  const handleResolverAlerta = async (nuevoEstado: 'ATENDIDO' | 'DESCARTADO') => {
    if (!selectedAlerta) return;
    setResolvingAlerta(true);
    try {
      const userName = typeof window !== 'undefined' ? localStorage.getItem('user_name') || 'Supervisor' : 'Supervisor';
      await hermesApi.resolverAlerta(selectedAlerta.id, nuevoEstado, resolveComment, userName);
      setSuccessMsg(`Alerta #${selectedAlerta.id} marcada como ${nuevoEstado}.`);
      setSelectedAlerta(null);
      setResolveComment('');
      cargarDatos(true);
    } catch (err: any) {
      setErrorMsg('Error al resolver la alerta: ' + (err.response?.data || err.message));
    } finally {
      setResolvingAlerta(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Formato de uptime
  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'Recién iniciado';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  // Ícono según tipo de evento
  const getEventIcon = (tipo: string) => {
    switch (tipo) {
      case 'INACTIVIDAD_GPS':
        return <Navigation size={20} color="#f97316" />;
      case 'BOTON_PANICO_SOS':
      case 'INCIDENTE_CRITICO':
        return <Siren size={20} color="#ef4444" />;
      case 'RONDA_VENCIDA':
        return <MapPin size={20} color="#eab308" />;
      case 'FLOTA_ANOMALIA':
        return <Truck size={20} color="#3b82f6" />;
      default:
        return <AlertTriangle size={20} color="#FACC15" />;
    }
  };

  // Color de severidad
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICA':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#f87171' };
      case 'ALTA':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fb923c' };
      case 'MEDIA':
        return { bg: '#fef9c3', text: '#854d0e', border: '#facc15' };
      default:
        return { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' };
    }
  };

  // Alertas filtradas por búsqueda
  const alertasFiltradas = alertas.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return a.titulo.toLowerCase().includes(term) ||
           a.descripcion.toLowerCase().includes(term) ||
           a.tipo_evento.toLowerCase().includes(term);
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* 1. HERO CABECERA */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        backgroundColor: '#0f172a',
        padding: '1.5rem 1.75rem',
        borderRadius: '1rem',
        border: '1px solid #1e293b',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '1rem',
            backgroundColor: 'rgba(250, 204, 21, 0.1)',
            border: '1px solid rgba(250, 204, 21, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(250, 204, 21, 0.15)'
          }}>
            <Bot size={32} color="#FACC15" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
                Hermes Sentinel
              </h1>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 'bold',
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '0.15rem 0.5rem',
                borderRadius: '0.35rem',
                letterSpacing: '0.5px'
              }}>
                CONTROLADOR IA EN PRODUCCIÓN
              </span>
            </div>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
              Supervisión autónoma 24/7 de telemetría GPS, rondas de seguridad, alertas SOS y ciclo de flota pesada 360.
            </p>
          </div>
        </div>

        {/* Acciones Rápidas de Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleEvaluarAhora()}
            disabled={evaluating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#FACC15',
              color: '#0f172a',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: evaluating ? 'not-allowed' : 'pointer',
              opacity: evaluating ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(250, 204, 21, 0.3)'
            }}
          >
            <Play size={16} fill="#0f172a" />
            {evaluating ? 'Evaluando...' : 'Ejecutar Ciclo Ahora'}
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              padding: '0.6rem 0.9rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Sliders size={16} color="#FACC15" />
            Parámetros
          </button>

          <button
            onClick={() => cargarDatos(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              padding: '0.6rem',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
            title="Refrescar datos"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* MENSAJES DE ESTADO */}
      {errorMsg && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          borderRadius: '0.5rem',
          color: '#991b1b',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{errorMsg}</span>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setErrorMsg('')} />
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: '#f0fdf4',
          borderLeft: '4px solid #10b981',
          borderRadius: '0.5rem',
          color: '#166534',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{successMsg}</span>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setSuccessMsg('')} />
        </div>
      )}

      {/* 2. TARJETAS DE MÉTRICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Card 1: Estado del Motor */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
              Motor Centinela
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: status?.activo ? '#10b981' : '#ef4444', display: 'inline-block' }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold', color: '#0f172a' }}>
                {status?.activo ? 'OPERANDO 24/7' : 'DETENIDO'}
              </h3>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Uptime: {formatUptime(status?.uptime_segundos)}
            </p>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
            <ShieldCheck size={24} color="#10b981" />
          </div>
        </div>

        {/* Card 2: Alertas Críticas */}
        <div style={{
          backgroundColor: (status?.total_alertas_criticas || 0) > 0 ? '#fff5f5' : '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: (status?.total_alertas_criticas || 0) > 0 ? '1px solid #f87171' : '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: (status?.total_alertas_criticas || 0) > 0 ? '#b91c1c' : '#64748b', textTransform: 'uppercase' }}>
              Emergencias Críticas
            </span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: (status?.total_alertas_criticas || 0) > 0 ? '#dc2626' : '#0f172a' }}>
              {status?.total_alertas_criticas || 0}
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              {(status?.total_alertas_criticas || 0) > 0 ? 'Atención inmediata requerida' : 'Sin emergencias críticas'}
            </p>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: (status?.total_alertas_criticas || 0) > 0 ? '#fee2e2' : '#f1f5f9', borderRadius: '0.5rem' }}>
            <Siren size={24} color={(status?.total_alertas_criticas || 0) > 0 ? '#dc2626' : '#94a3b8'} />
          </div>
        </div>

        {/* Card 3: Alertas Pendientes */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
              Alertas Pendientes
            </span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>
              {status?.total_alertas_pendientes || 0}
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              En seguimiento operativo
            </p>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
            <Bell size={24} color="#d97706" />
          </div>
        </div>

        {/* Card 4: Residenciales Monitoreados */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
              Instalaciones Activas
            </span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
              {status?.residenciales_monitoreados || 0}
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Supervisión multi-tenant
            </p>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
            <Building size={24} color="#475569" />
          </div>
        </div>
      </div>

      {/* 2.5 ASISTENTE CONVERSACIONAL HERMES IA */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <div 
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '0.4rem', backgroundColor: 'rgba(250, 204, 21, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#FACC15" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Asistente Inteligente Hermes Sentinel</span>
                <span style={{ fontSize: '0.65rem', backgroundColor: '#10b981', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>
                  CONVERSACIONAL
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Pregunta sobre guardias en turno, emergencias SOS, rondas o solicita un resumen ejecutivo en tiempo real.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.75rem' }}>{isChatOpen ? 'Ocultar Chat' : 'Abrir Chat'}</span>
            {isChatOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {isChatOpen && (
          <div style={{ padding: '1.25rem' }}>
            {/* Chips de Preguntas Frecuentes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem' }}>
              {[
                '📊 Resumen operativo integral',
                '🛡️ ¿Quiénes están patrullando ahora?',
                '🚶 ¿Cómo van las rondas perimetrales?',
                '🚛 Reporte de flota pesada y maquinaria 360',
                '🚪 ¿Cuántas visitas han ingresado a garita?',
                '🚨 ¿Hay alguna novedad o emergencia hoy?',
                '🏡 Censo de viviendas y cobertura de seguridad',
                '📖 Guía de uso del sistema'
              ].map((sugerencia, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEnviarMensaje(sugerencia)}
                  disabled={sendingMsg}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '1.5rem',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    color: '#334155',
                    cursor: sendingMsg ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sugerencia}
                </button>
              ))}
            </div>

            {/* Ventana de Mensajes */}
            <div style={{
              maxHeight: '340px',
              minHeight: '180px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              borderRadius: '0.6rem',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              marginBottom: '1rem'
            }}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    gap: '0.5rem'
                  }}
                >
                  {msg.sender === 'hermes' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={15} color="#FACC15" />
                    </div>
                  )}

                  <div style={{
                    maxWidth: '82%',
                    backgroundColor: msg.sender === 'user' ? '#0f172a' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.text}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.68rem', opacity: 0.65 }}>
                      <span>{msg.time}</span>
                      {msg.fuente && (
                        <span style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                          {msg.fuente === 'GEMINI_AI' ? '✨ Gemini AI' : '⚙️ Sentinel Engine'}
                        </span>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FACC15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={15} color="#0f172a" />
                    </div>
                  )}
                </div>
              ))}

              {sendingMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  <RefreshCw size={14} className="animate-spin" />
                  Hermes está consultando la base de datos y analizando la situación...
                </div>
              )}
            </div>

            {/* Input y Botón de Enviar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEnviarMensaje();
              }}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <input
                type="text"
                placeholder="Escribe tu consulta operativa (ej: ¿quién cubrió la ronda de garita anoche?)..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sendingMsg}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.9rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="submit"
                disabled={sendingMsg || !inputMsg.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#0f172a',
                  color: '#FACC15',
                  border: 'none',
                  padding: '0.65rem 1.1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: sendingMsg || !inputMsg.trim() ? 'not-allowed' : 'pointer',
                  opacity: sendingMsg || !inputMsg.trim() ? 0.6 : 1
                }}
              >
                <Send size={15} />
                Consultar
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. FILTROS Y BÚSQUEDA */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        border: '1px solid #e2e8f0',
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Búsqueda */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 200px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por colaborador, título o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Filtro Severidad */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Severidad:</span>
            <select
              value={filterSeveridad}
              onChange={(e) => setFilterSeveridad(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
            >
              <option value="TODAS">Todas</option>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          {/* Filtro Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Estado:</span>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
            >
              <option value="PENDIENTE">Pendientes</option>
              <option value="ATENDIDO">Atendidas</option>
              <option value="DESCARTADO">Descartadas</option>
              <option value="TODOS">Todos</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Mostrando <strong>{alertasFiltradas.length}</strong> alerta(s)
        </span>
      </div>

      {/* 4. BANDEJA DE ALERTAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <p>Conectando con el agente centinela...</p>
          </div>
        ) : alertasFiltradas.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            border: '1px dashed #cbd5e1'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <CheckCircle2 size={36} color="#10b981" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.15rem' }}>
              Todos los perímetros bajo control
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Hermes Sentinel no ha detectado anomalías pendientes con los filtros seleccionados. Guardias, rondas QR y maquinaria operan con normalidad.
            </p>
          </div>
        ) : (
          alertasFiltradas.map((alerta) => {
            const sevBadge = getSeverityBadge(alerta.severidad);
            let metadataObj: any = {};
            try {
              metadataObj = JSON.parse(alerta.metadata_json || '{}');
            } catch (e) {
              metadataObj = {};
            }

            return (
              <div
                key={alerta.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: `1px solid ${sevBadge.border}`,
                  padding: '1.25rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                {/* Lado Izquierdo: Ícono y Datos */}
                <div style={{ display: 'flex', gap: '1rem', flex: '1 1 500px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '0.6rem',
                    backgroundColor: sevBadge.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getEventIcon(alerta.tipo_evento)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: sevBadge.bg,
                        color: sevBadge.text,
                        border: `1px solid ${sevBadge.border}`
                      }}>
                        {alerta.severidad}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>
                        {alerta.tipo_evento.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Residencial: <strong>{alerta.residencial_id}</strong>
                      </span>
                    </div>

                    <h4 style={{ margin: '0.35rem 0 0.25rem 0', fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>
                      {alerta.titulo}
                    </h4>

                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.4 }}>
                      {alerta.descripcion}
                    </p>

                    {/* Metadatos adicionales */}
                    {Object.keys(metadataObj).length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '0.4rem',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        border: '1px solid #f1f5f9'
                      }}>
                        {metadataObj.minutos_inactivo !== undefined && (
                          <span>Inactividad: <strong>{metadataObj.minutos_inactivo} mins</strong> (Límite: {metadataObj.limite_mins}m)</span>
                        )}
                        {metadataObj.puntos_completados !== undefined && (
                          <span>Avance: <strong>{metadataObj.puntos_completados}/{metadataObj.puntos_total} puntos</strong></span>
                        )}
                        {metadataObj.placa && (
                          <span>Placa: <strong>{metadataObj.placa}</strong> (Estado: {metadataObj.estado})</span>
                        )}
                        {metadataObj.reportado_por && (
                          <span>Reportó: <strong>{metadataObj.reportado_por}</strong></span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} />
                        {new Date(alerta.fecha_creacion).toLocaleString()}
                      </span>
                      {alerta.atendido_por && (
                        <span>Atendido por: <strong>{alerta.atendido_por}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Acciones de Gestión */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {alerta.estado === 'PENDIENTE' ? (
                    <>
                      <button
                        onClick={() => setSelectedAlerta(alerta)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.5rem 0.85rem',
                          borderRadius: '0.45rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={14} color="#10b981" />
                        Atender
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`¿Descartar alerta #${alerta.id}?`)) {
                            const userName = typeof window !== 'undefined' ? localStorage.getItem('user_name') || 'Supervisor' : 'Supervisor';
                            await hermesApi.resolverAlerta(alerta.id, 'DESCARTADO', 'Descartado manualmente', userName);
                            cargarDatos(true);
                          }
                        }}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.45rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Descartar
                      </button>
                    </>
                  ) : (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '0.3rem',
                      backgroundColor: alerta.estado === 'ATENDIDO' ? '#ecfdf5' : '#f1f5f9',
                      color: alerta.estado === 'ATENDIDO' ? '#047857' : '#64748b'
                    }}>
                      {alerta.estado}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL: CONFIGURACIÓN DE PARÁMETROS CENTINELA */}
      {isConfigModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            maxWidth: '540px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bot size={22} color="#FACC15" />
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  Parámetros de Supervisión Hermes
                </h3>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarConfig} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {/* Intervalo de Ciclo */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                    Frecuencia de Escaneo del Motor (Segundos):
                  </label>
                  <select
                    value={configForm.intervalo_evaluacion_seg || 60}
                    onChange={(e) => setConfigForm({ ...configForm, intervalo_evaluacion_seg: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value={30}>Cada 30 segundos (Alta exigencia)</option>
                    <option value={60}>Cada 60 segundos (Recomendado producción)</option>
                    <option value={120}>Cada 2 minutos (Ahorro de recursos)</option>
                  </select>
                </div>

                {/* Tolerancia de Inactividad GPS */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                    Tolerancia Máxima de Inactividad GPS (Minutos):
                  </label>
                  <select
                    value={configForm.max_inactividad_gps_mins || 5}
                    onChange={(e) => setConfigForm({ ...configForm, max_inactividad_gps_mins: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value={3}>3 minutos (Estricto)</option>
                    <option value={5}>5 minutos (Estándar)</option>
                    <option value={10}>10 minutos (Tolerante)</option>
                  </select>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Hermes disparará una alerta si un guardia en turno activo no transmite ubicación en este lapso.
                  </span>
                </div>

                {/* Toggles de Módulos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={configForm.alerta_sos_activa ?? true}
                      onChange={(e) => setConfigForm({ ...configForm, alerta_sos_activa: e.target.checked })}
                    />
                    Escalar Botón de Pánico SOS e Incidentes Críticos
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={configForm.alerta_rondas_retraso ?? true}
                      onChange={(e) => setConfigForm({ ...configForm, alerta_rondas_retraso: e.target.checked })}
                    />
                    Detectar Rondas Perimetrales Incompletas / Fuera de Horario
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={configForm.alerta_flota_desvios ?? true}
                      onChange={(e) => setConfigForm({ ...configForm, alerta_flota_desvios: e.target.checked })}
                    />
                    Supervisar Retenciones Anómalas en Flota Pesada y Taller 360
                  </label>
                </div>

                {/* Webhook Notificación */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                    Webhook de Despacho (Opcional - Telegram, Slack, Teams):
                  </label>
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={configForm.webhook_notificacion || ''}
                    onChange={(e) => setConfigForm({ ...configForm, webhook_notificacion: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Gemini API Key */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                    Google Gemini API Key (Opcional - Razonamiento LLM):
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={configForm.gemini_api_key || ''}
                    onChange={(e) => setConfigForm({ ...configForm, gemini_api_key: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Permite a Hermes usar el modelo Gemini 2.5 Flash para responder consultas complejas. Si no se indica, usa el motor analítico de reglas internas.
                  </span>
                </div>

              </div>

              {/* Botones */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#FACC15',
                    fontWeight: 'bold',
                    cursor: savingConfig ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingConfig ? 'Guardando...' : 'Guardar Parámetros'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ATENDER / RESOLVER ALERTA */}
      {selectedAlerta && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={20} color="#10b981" />
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 'bold' }}>
                  Atender Alerta #{selectedAlerta.id}
                </h3>
              </div>
              <button onClick={() => setSelectedAlerta(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>{selectedAlerta.titulo}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{selectedAlerta.descripcion}</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                  Observaciones o Acción Tomada por el Supervisor:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Se contactó al guardia vía radio portátil; confirmó batería baja y ya restableció reporte..."
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAlerta(null)}
                  style={{ padding: '0.55rem 0.9rem', borderRadius: '0.45rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={resolvingAlerta}
                  onClick={() => handleResolverAlerta('ATENDIDO')}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '0.45rem',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: resolvingAlerta ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resolvingAlerta ? 'Guardando...' : 'Confirmar Resolución'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

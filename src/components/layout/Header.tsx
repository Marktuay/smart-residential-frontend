'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Search, 
  Menu, 
  LogOut, 
  Settings, 
  Shield, 
  ExternalLink, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Home, 
  Users, 
  Truck, 
  MapPin,
  Calendar,
  Radio,
  Bot
} from 'lucide-react';
import { incidentesApi, Incidente } from '@/lib/api';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const RUTAS_SISTEMA = [
  { titulo: 'Centro de Mando Principal', ruta: '/', modulo: 'Dashboard', icono: Shield },
  { titulo: 'Mapa Satelital en Tiempo Real', ruta: '/map', modulo: 'Monitoreo', icono: MapPin },
  { titulo: 'Centro Operativo y Feed en Vivo', ruta: '/operativo', modulo: 'Operaciones', icono: Radio },
  { titulo: 'Gestión Residencial (Casas y Residentes)', ruta: '/residencial', modulo: 'Residencial', icono: Home },
  { titulo: 'Directorio de Personal y Usuarios', ruta: '/usuarios', modulo: 'Personal', icono: Users },
  { titulo: 'Programación y Rol de Turnos', ruta: '/programacion', modulo: 'Operaciones', icono: Calendar },
  { titulo: 'Control de Rondas y Rutas', ruta: '/rondas', modulo: 'Seguridad', icono: Shield },
  { titulo: 'Catálogo de Puntos QR Imprimibles', ruta: '/puntos-qr', modulo: 'Seguridad', icono: MapPin },
  { titulo: 'Control de Accesos y Visitas Garita', ruta: '/visitas', modulo: 'Garita', icono: Users },
  { titulo: 'Gestión de Incidencias y Novedades', ruta: '/incidentes', modulo: 'Novedades', icono: AlertTriangle },
  { titulo: 'Terminal Móvil de Patrullaje', ruta: '/patrullaje', modulo: 'Seguridad Móvil', icono: Radio },
  { titulo: 'Control de Flota y Maquinaria Pesada', ruta: '/flota', modulo: 'Flota 360', icono: Truck },
  { titulo: 'Terminal Checklist 360 (Inspección)', ruta: '/flota/inspeccion', modulo: 'Flota 360', icono: Truck },
  { titulo: 'Catálogo de Unidades Pesadas', ruta: '/flota/vehiculos', modulo: 'Flota 360', icono: Truck },
  { titulo: 'Hermes Sentinel IA (Control y Auditoría)', ruta: '/hermes', modulo: 'Control Inteligente', icono: Bot },
  { titulo: 'Configuración del Residencial', ruta: '/configuracion', modulo: 'Ajustes', icono: Settings },
  { titulo: 'Bitácora Inmutable de Auditoría', ruta: '/auditoria', modulo: 'Seguridad', icono: Shield },
  { titulo: 'Emisión de Alertas Push', ruta: '/notificar', modulo: 'Comunicaciones', icono: Bell }
];

export default function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();

  // Estados de Usuario
  const [userName, setUserName] = useState<string>('Usuario');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [initials, setInitials] = useState<string>('US');

  // Estados de Modales / Dropdowns
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Estados de Notificaciones
  const [incidentesAbiertos, setIncidentesAbiertos] = useState<Incidente[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Referencias para Click Outside
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('user_email') || '';
      const role = localStorage.getItem('user_role') || 'ADMIN';
      const name = localStorage.getItem('user_name') || email.split('@')[0] || 'Administrador';

      setUserEmail(email);
      setUserRole(role);
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));

      // Generar iniciales
      const parts = name.split(/[._ ]/);
      if (parts.length >= 2) {
        setInitials((parts[0][0] + parts[1][0]).toUpperCase());
      } else if (name.length > 0) {
        setInitials(name.substring(0, 2).toUpperCase());
      }

      // Cargar notificaciones / incidencias abiertas
      cargarNotificaciones();
    }
  }, []);

  // Cierra dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atajo de teclado (Cmd+K o Ctrl+K) para abrir buscador rápido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const data = await incidentesApi.getIncidentes();
      const abiertas = (data || []).filter(inc => inc.estado === 'ABIERTO' || inc.estado === 'EN_PROCESO');
      setIncidentesAbiertos(abiertas.slice(0, 5));
      setUnreadCount(abiertas.length);
    } catch (e) {
      console.warn("No se pudieron cargar incidencias en el header:", e);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('residencial_id');
      router.push('/login');
    }
  };

  const resultadosBusqueda = RUTAS_SISTEMA.filter(item => 
    searchQuery.trim() === '' ||
    item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.modulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ruta.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="header" style={{ position: 'relative', zIndex: 40, borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div className="header-left">
          <button 
            className="header-icon-btn" 
            onClick={onToggleSidebar}
            aria-label="Abrir menú de navegación"
            style={{ marginRight: '1rem', cursor: 'pointer' }}
          >
            <Menu size={24} />
          </button>
        </div>
        
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* PILL INDICADOR: HERMES SENTINEL IA */}
          <Link href="/hermes" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(250, 204, 21, 0.4)',
              padding: '0.35rem 0.65rem',
              borderRadius: '2rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s ease'
            }} title="Hermes Sentinel: Agente Controlador y Administrador IA">
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
                boxShadow: '0 0 6px #10b981'
              }} />
              <Bot size={15} color="#FACC15" />
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.3px' }}>
                Hermes IA
              </span>
            </div>
          </Link>

          {/* BOTÓN 1: BÚSQUEDA RÁPIDA (LUPA) */}
          <button 
            className="header-icon-btn"
            onClick={() => { setShowSearchModal(true); setSearchQuery(''); }}
            title="Búsqueda Rápida (Ctrl + K)"
            aria-label="Buscar en la plataforma"
            style={{ position: 'relative', padding: '0.45rem', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            <Search size={20} color="#475569" />
          </button>

          {/* BOTÓN 2: CAMPANA DE NOTIFICACIONES */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button 
              className="header-icon-btn"
              onClick={() => {
                setShowNotifications(prev => !prev);
                setShowUserMenu(false);
              }}
              title="Notificaciones e Incidencias Activas"
              aria-label="Ver notificaciones"
              style={{
                position: 'relative',
                padding: '0.45rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                backgroundColor: showNotifications ? '#f1f5f9' : 'transparent'
              }}
            >
              <Bell size={20} color={unreadCount > 0 ? '#1e293b' : '#64748b'} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  height: '18px',
                  minWidth: '18px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #ffffff'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Popover de Notificaciones */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '340px',
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={16} color="#FACC15" />
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' }}>Novedades e Incidencias</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' }}>
                    {unreadCount} activas
                  </span>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {incidentesAbiertos.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '500' }}>Sin alertas críticas pendientes</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Todo el perímetro se encuentra bajo control.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {incidentesAbiertos.map((inc) => (
                        <Link 
                          key={inc.id}
                          href="/incidentes" 
                          onClick={() => setShowNotifications(false)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid #f1f5f9',
                            textDecoration: 'none',
                            display: 'block',
                            backgroundColor: '#ffffff',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e293b' }}>
                              {inc.tipo || 'Incidente General'}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '0.25rem',
                              fontWeight: 'bold',
                              backgroundColor: inc.nivel_gravedad === 'CRITICA' ? '#fee2e2' : inc.nivel_gravedad === 'ALTA' ? '#ffedd5' : '#e0f2fe',
                              color: inc.nivel_gravedad === 'CRITICA' ? '#b91c1c' : inc.nivel_gravedad === 'ALTA' ? '#c2410c' : '#0369a1'
                            }}>
                              {inc.nivel_gravedad || 'MEDIA'}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {inc.descripcion || 'Sin descripción'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                            <Clock size={12} />
                            <span>{inc.fecha_creacion ? new Date(inc.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}</span>
                            {inc.ubicacion && <span>• {inc.ubicacion}</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: '0.65rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', backgroundColor: '#f8fafc' }}>
                  <Link 
                    href="/incidentes" 
                    onClick={() => setShowNotifications(false)}
                    style={{ flex: 1, textAlign: 'center', padding: '0.4rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#1e293b', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.375rem', textDecoration: 'none' }}
                  >
                    Ver Incidentes
                  </Link>
                  <Link 
                    href="/operativo" 
                    onClick={() => setShowNotifications(false)}
                    style={{ flex: 1, textAlign: 'center', padding: '0.4rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#1e293b', backgroundColor: '#FACC15', borderRadius: '0.375rem', textDecoration: 'none' }}
                  >
                    Centro Operativo
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* BOTÓN 3: PERFIL DE USUARIO DINÁMICO */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <div 
              className="user-profile"
              onClick={() => {
                setShowUserMenu(prev => !prev);
                setShowNotifications(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.35rem 0.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                backgroundColor: showUserMenu ? '#f1f5f9' : 'transparent',
                transition: 'background-color 0.15s'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                color: '#FACC15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                border: '2px solid #FACC15'
              }}>
                {initials}
              </div>
              <div className="user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="user-name" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', lineHeight: 1.2 }}>
                  {userName}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
                  {userRole}
                </span>
              </div>
            </div>

            {/* Menú Desplegable de Usuario */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '220px',
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                zIndex: 100,
                padding: '0.5rem 0',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' }}>{userName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail || 'usuario@ncsecurity.net'}</div>
                  <span style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.65rem', fontWeight: 'bold', padding: '0.1rem 0.5rem', borderRadius: '1rem', backgroundColor: '#0f172a', color: '#FACC15' }}>
                    {userRole}
                  </span>
                </div>

                <div style={{ padding: '0.25rem 0' }}>
                  <Link 
                    href="/configuracion" 
                    onClick={() => setShowUserMenu(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', fontSize: '0.8rem', color: '#334155', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Settings size={16} color="#64748b" />
                    <span>Configuración</span>
                  </Link>
                  <Link 
                    href="/auditoria" 
                    onClick={() => setShowUserMenu(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', fontSize: '0.8rem', color: '#334155', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Shield size={16} color="#64748b" />
                    <span>Bitácora de Auditoría</span>
                  </Link>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.25rem 0 0 0' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 1rem',
                      fontSize: '0.8rem',
                      color: '#ef4444',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: '600'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* MODAL DE BÚSQUEDA RÁPIDA (COMMAND PALETTE) */}
      {showSearchModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '4rem 1rem 1rem 1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '560px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Input Buscador */}
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Search size={20} color="#FACC15" />
              <input 
                type="text"
                autoFocus
                placeholder="Escriba el módulo, pantalla o acción a buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#1e293b',
                  backgroundColor: 'transparent'
                }}
              />
              <button 
                onClick={() => setShowSearchModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista de Resultados */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.5rem' }}>
              {resultadosBusqueda.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <Search size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No se encontraron coincidencias para &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                resultadosBusqueda.map((item, idx) => {
                  const Icon = item.icono;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowSearchModal(false);
                        router.push(item.ruta);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.1s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.4rem', borderRadius: '0.375rem', backgroundColor: '#f1f5f9', color: '#1e293b' }}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>{item.titulo}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.modulo} • {item.ruta}</div>
                        </div>
                      </div>
                      <ExternalLink size={14} color="#94a3b8" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Atajo */}
            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>Presione <kbd style={{ padding: '0.1rem 0.35rem', backgroundColor: '#e2e8f0', borderRadius: '0.25rem', fontWeight: 'bold' }}>ESC</kbd> para salir</span>
              <span>Atajo: <kbd style={{ padding: '0.1rem 0.35rem', backgroundColor: '#e2e8f0', borderRadius: '0.25rem', fontWeight: 'bold' }}>Ctrl + K</kbd></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

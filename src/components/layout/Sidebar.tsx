'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  Map, 
  ClipboardList, 
  Siren, 
  Building, 
  Wallet,
  CalendarClock,
  UserCog,
  Settings,
  LifeBuoy,
  LogOut,
  FileText,
  QrCode,
  Bell,
  Navigation,
  Truck
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('user_role'));
    }
  }, []);

  const isActive = (path: string) => {
    return pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('residencial_id');
      window.location.href = '/login';
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ backgroundColor: 'white', padding: '0.4rem 1rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '90%' }}>
            <img src="/logo.jpg" alt="Security Logo" style={{ width: '100%', maxHeight: '45px', objectFit: 'contain' }} />
          </div>
        </div>
      </div>
      
      <div className="sidebar-nav">
        <div className="sidebar-section-title">General</div>
        <Link href="/">
          <div className={`sidebar-item ${isActive('/')}`}>
            <Shield size={18} color="#FACC15" className="sidebar-item-icon" />
            Centro de Mando
          </div>
        </Link>
        {/* Sub-items for Centro de Mando as seen in design */}
        <div style={{ paddingLeft: '3rem', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/"><span style={{ fontSize: '0.85rem', color: isActive('/') ? 'var(--primary)' : 'var(--text-sidebar)' }}>Resumen General</span></Link>
          <Link href="/map"><span style={{ fontSize: '0.85rem', color: isActive('/map') ? 'var(--primary)' : 'var(--text-sidebar)' }}>Mapa Operativo</span></Link>
        </div>

        <div className="sidebar-section-title">Operaciones</div>
        <Link href="/operativo">
          <div className={`sidebar-item ${isActive('/operativo')}`}>
            <ClipboardList size={18} color="#FACC15" className="sidebar-item-icon" />
            Gestion Operativo
          </div>
        </Link>
        <Link href="/incidentes">
          <div className={`sidebar-item ${isActive('/incidentes')}`}>
            <Siren size={18} color="#FACC15" className="sidebar-item-icon" />
            Gestion de Incidencias
          </div>
        </Link>
        <Link href="/rondas">
          <div className={`sidebar-item ${isActive('/rondas')}`}>
            <Map size={18} color="#FACC15" className="sidebar-item-icon" />
            Control de Rondas
          </div>
        </Link>
        <Link href="/puntos-qr">
          <div className={`sidebar-item ${isActive('/puntos-qr')}`}>
            <QrCode size={18} color="#FACC15" className="sidebar-item-icon" />
            Puntos de Control QR
          </div>
        </Link>
        <Link href="/visitas">
          <div className={`sidebar-item ${isActive('/visitas')}`}>
            <ClipboardList size={18} color="#FACC15" className="sidebar-item-icon" />
            Control de Accesos
          </div>
        </Link>
        {/* Módulo Especial Destacado: Control de Flota 360 */}
        <div style={{ 
          margin: '0.75rem 0.5rem', 
          padding: '0.5rem', 
          borderRadius: '0.75rem', 
          backgroundColor: 'rgba(250, 204, 21, 0.05)', 
          border: '1px solid rgba(250, 204, 21, 0.35)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <Link href="/flota">
            <div className={`sidebar-item ${isActive('/flota')}`} style={{ margin: 0, fontWeight: 'bold' }}>
              <Truck size={20} color="#FACC15" className="sidebar-item-icon" />
              <span>Control de Flota 360</span>
              <span style={{ 
                marginLeft: 'auto', 
                fontSize: '0.6rem', 
                fontWeight: 'bold', 
                backgroundColor: '#FACC15', 
                color: '#1e293b', 
                padding: '0.15rem 0.4rem', 
                borderRadius: '0.25rem',
                letterSpacing: '0.5px'
              }}>
                MÓDULO 360
              </span>
            </div>
          </Link>
          <div style={{ paddingLeft: '2.4rem', paddingTop: '0.5rem', paddingBottom: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <Link href="/flota" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isActive('/flota') ? '#FACC15' : '#94a3b8' }} />
              <span style={{ fontSize: '0.825rem', fontWeight: isActive('/flota') ? '600' : '400', color: isActive('/flota') ? '#FACC15' : '#cbd5e1' }}>Solicitudes y FSM</span>
            </Link>
            <Link href="/flota/inspeccion" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isActive('/flota/inspeccion') ? '#60a5fa' : '#94a3b8' }} />
              <span style={{ fontSize: '0.825rem', fontWeight: isActive('/flota/inspeccion') ? '600' : '400', color: isActive('/flota/inspeccion') ? '#60a5fa' : '#93c5fd' }}>Checklist 360 (PWA)</span>
            </Link>
            <Link href="/flota/vehiculos" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isActive('/flota/vehiculos') ? '#FACC15' : '#94a3b8' }} />
              <span style={{ fontSize: '0.825rem', fontWeight: isActive('/flota/vehiculos') ? '600' : '400', color: isActive('/flota/vehiculos') ? '#FACC15' : '#cbd5e1' }}>Catálogo de Flota</span>
            </Link>
          </div>
        </div>
        <Link href="/supervisores">
          <div className={`sidebar-item ${isActive('/supervisores')}`}>
            <UserCog size={18} color="#FACC15" className="sidebar-item-icon" />
            Supervisores
          </div>
        </Link>
        <Link href="/residencial">
          <div className={`sidebar-item ${isActive('/residencial')}`}>
            <Building size={18} color="#FACC15" className="sidebar-item-icon" />
            Gestion Residencial
          </div>
        </Link>
        <Link href="/cobros">
          <div className={`sidebar-item ${isActive('/cobros')}`}>
            <Wallet size={18} color="#FACC15" className="sidebar-item-icon" />
            Gestion de Cobros
          </div>
        </Link>
        {userRole === 'GUARDIA' && (
          <Link href="/patrullaje">
            <div className={`sidebar-item ${isActive('/patrullaje')}`}>
              <Navigation size={18} color="#FACC15" className="sidebar-item-icon" />
              Patrullaje Móvil
            </div>
          </Link>
        )}
        {(userRole === 'ADMIN' || userRole === 'SISADMIN') && (
          <Link href="/notificar">
            <div className={`sidebar-item ${isActive('/notificar')}`}>
              <Bell size={18} color="#FACC15" className="sidebar-item-icon" />
              Despachar Alertas
            </div>
          </Link>
        )}

        <div className="sidebar-section-title">Gestión de Turnos</div>
        <Link href="/programacion">
          <div className={`sidebar-item ${isActive('/programacion')}`}>
            <CalendarClock size={18} color="#FACC15" className="sidebar-item-icon" />
            Programación
          </div>
        </Link>

        <div className="sidebar-section-title">Administración</div>
        <Link href="/usuarios">
          <div className={`sidebar-item ${isActive('/usuarios')}`}>
            <UserCog size={18} color="#FACC15" className="sidebar-item-icon" />
            Usuarios
          </div>
        </Link>
        <Link href="/configuracion">
          <div className={`sidebar-item ${isActive('/configuracion')}`}>
            <Settings size={18} color="#FACC15" className="sidebar-item-icon" />
            Configuración
          </div>
        </Link>
        {userRole === 'SISADMIN' && (
          <Link href="/auditoria">
            <div className={`sidebar-item ${isActive('/auditoria')}`}>
              <FileText size={18} color="#FACC15" className="sidebar-item-icon" />
              Auditoría
            </div>
          </Link>
        )}

        <div className="sidebar-section-title" style={{ marginTop: 'auto' }}>Soporte</div>
        <Link href="/ayuda">
          <div className={`sidebar-item ${isActive('/ayuda')}`}>
            <LifeBuoy size={18} color="#FACC15" className="sidebar-item-icon" />
            Temas de Ayuda
          </div>
        </Link>
        <div className="sidebar-item" style={{ cursor: 'pointer', color: '#ef4444', marginTop: '0.5rem' }} onClick={handleLogout}>
          <LogOut size={18} color="#ef4444" className="sidebar-item-icon" />
          Cerrar Sesión
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>NCS365 V2.1</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Operación Eficiente.</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

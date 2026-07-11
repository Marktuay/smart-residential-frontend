"use client";

import { useState, useEffect } from 'react';
import { UserCog, Plus, Shield, Search, Mail, Phone, MoreVertical } from 'lucide-react';

interface Supervisor {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  zona_asignada: string;
  ultimo_acceso: string;
}

export default function SupervisoresPage() {
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Datos mockeados temporalmente hasta que se conecte el endpoint de usuarios
  useEffect(() => {
    setTimeout(() => {
      setSupervisores([
        {
          id: '1',
          nombre: 'Carlos Mendoza',
          email: 'cmendoza@ncs365.com',
          telefono: '+1 555-0123',
          estado: 'ACTIVO',
          zona_asignada: 'Sector Norte',
          ultimo_acceso: 'Hace 2 horas'
        },
        {
          id: '2',
          nombre: 'Ana Rojas',
          email: 'arojas@ncs365.com',
          telefono: '+1 555-0124',
          estado: 'ACTIVO',
          zona_asignada: 'Sector Sur',
          ultimo_acceso: 'Hace 5 horas'
        },
        {
          id: '3',
          nombre: 'Roberto Gómez',
          email: 'rgomez@ncs365.com',
          telefono: '+1 555-0125',
          estado: 'INACTIVO',
          zona_asignada: 'Sector Este',
          ultimo_acceso: 'Hace 2 días'
        }
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return <div style={{ padding: '2rem', color: '#64748b' }}>Cargando supervisores...</div>;
  }

  return (
    <div style={{ padding: '2rem', color: '#1e293b', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Gestión de Supervisores</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Administra el personal de supervisión operativa.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FACC15', color: '#1e293b', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          <Plus size={20} style={{ marginRight: '0.5rem' }} />
          Añadir Supervisor
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}
          />
        </div>
        <select style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: 'white', color: '#475569' }}>
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {supervisores.map((sup) => (
          <div key={sup.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: sup.estado === 'ACTIVO' ? '#10b981' : '#94a3b8' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <UserCog size={24} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#1e293b', margin: 0 }}>{sup.nombre}</h3>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: '600', marginTop: '0.25rem', display: 'inline-block',
                    backgroundColor: sup.estado === 'ACTIVO' ? '#dcfce3' : '#f1f5f9',
                    color: sup.estado === 'ACTIVO' ? '#16a34a' : '#64748b'
                  }}>
                    {sup.estado}
                  </span>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <MoreVertical size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#475569' }}>
                <Mail size={16} color="#94a3b8" style={{ marginRight: '0.75rem' }} />
                {sup.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#475569' }}>
                <Phone size={16} color="#94a3b8" style={{ marginRight: '0.75rem' }} />
                {sup.telefono}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#475569' }}>
                <Shield size={16} color="#94a3b8" style={{ marginRight: '0.75rem' }} />
                Zona: {sup.zona_asignada}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
              Último acceso: {sup.ultimo_acceso}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

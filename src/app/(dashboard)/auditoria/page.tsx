'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Search, Clock, User, Shield, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Interfaces
interface AuditLog {
  id: string;
  residencial_id: string;
  accion: string;
  actor: string;
  ip: string;
  detalles: string;
  created_at: string;
}

export default function AuditoriaPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Validar acceso solo para SISADMIN
    const role = localStorage.getItem('user_role');
    if (role !== 'SISADMIN') {
      router.push('/');
      return;
    }

    fetchLogs();
  }, [router]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      const residencialId = localStorage.getItem('residencial_id');

      const response = await axios.get('http://localhost:8080/api/v1/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Residencial-ID': residencialId || 'GLOBAL'
        }
      });

      setLogs(response.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError('No se pudo cargar el historial de auditoría. Verifique su conexión o permisos.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.detalles.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREA') || action.includes('REGISTRO')) return '#10b981'; // Green
    if (action.includes('ELIMINA') || action.includes('ERROR')) return '#ef4444'; // Red
    return '#3b82f6'; // Blue
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={28} color="var(--primary)" />
            Historial de Auditoría
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Registro inmutable de actividades del sistema</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header / Buscador */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar por acción, usuario o detalles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <FileText size={16} />
            {filteredLogs.length} registros encontrados
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Fecha y Hora</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Acción</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Usuario / Actor</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Dirección IP</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando historial de auditoría...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        <Clock size={14} color="var(--text-muted)" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        backgroundColor: `${getActionColor(log.accion)}20`, 
                        color: getActionColor(log.accion) 
                      }}>
                        {log.accion}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        <User size={14} color="var(--text-muted)" />
                        {log.actor}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {log.ip}
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'top', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                      {log.detalles}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Clock, 
  MapPin, 
  UserCheck, 
  Phone, 
  Mail, 
  BookOpen, 
  MessageSquare,
  Building
} from 'lucide-react';

interface FAQItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: 'general' | 'rondas' | 'turnos' | 'visitas' | 'incidentes';
}

export default function AyudaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Formulario de Soporte
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);

  const faqs: FAQItem[] = [
    {
      id: 'g1',
      pregunta: '¿Qué es NCS365 y cómo funciona el modelo Multi-Tenant?',
      respuesta: 'NCS365 es el sistema de gestión operativa para New Century Security S.A. Cada residencial o local opera como un "tenant" (inquilino) aislado de forma segura. Al iniciar sesión, toda la información de rondas, visitas, incidentes y programación se filtra automáticamente para mostrar exclusivamente los datos correspondientes al residencial activo, garantizando la confidencialidad y el orden.',
      categoria: 'general'
    },
    {
      id: 'r1',
      pregunta: '¿Cómo asocio un Punto de Control QR a una casa en particular?',
      respuesta: 'Al registrar o editar un Punto QR (desde la vista "Puntos de Control QR" o "Control de Rondas"), encontrarás un campo opcional de selección llamado "Asociar a Casa". Al seleccionarla, el sistema vinculará las coordenadas y el código QR de patrullaje a esa vivienda en específico. En el listado verás detalles sobre el residente propietario y un distintivo de escudo (verde si tiene contrato de seguridad activo, rojo si está inactivo).',
      categoria: 'rondas'
    },
    {
      id: 'r2',
      pregunta: '¿Qué pasa si un guardia no puede escanear un código QR físico?',
      respuesta: 'Si hay problemas físicos con la placa de control (daño, humedad o suciedad), el guardia puede reportarlo inmediatamente como un Incidente de nivel bajo. Para fines de auditoría, las incidencias se asocian al historial de geolocalización, lo que permite al supervisor verificar si el guardia estuvo físicamente en el punto de control a la hora indicada.',
      categoria: 'rondas'
    },
    {
      id: 't1',
      pregunta: '¿Quiénes pueden crear o modificar la programación de turnos?',
      respuesta: 'La creación, edición y cancelación de turnos de guardias de seguridad es responsabilidad exclusiva de los roles ADMIN (administradores de la instalación) y SISADMIN (superadministradores del sistema global). Los residentes y guardias tienen una vista de lectura del calendario para estar informados sobre sus asignaciones y horarios vigentes.',
      categoria: 'turnos'
    },
    {
      id: 't2',
      pregunta: '¿Cómo cancelo un turno previamente programado?',
      respuesta: 'Para cancelar un turno, haz clic sobre el bloque del turno deseado en la cuadrícula del calendario mensual (en la pestaña "Programación"), selecciona la opción "Cancelar Turno" y confirma la acción en la ventana emergente. Esta acción realiza un soft-delete en la base de datos (cambiando su estado a CANCELADO) y registra el evento automáticamente en la bitácora de auditoría.',
      categoria: 'turnos'
    },
    {
      id: 'v1',
      pregunta: '¿Cómo funciona el registro de visitas y el Control de Accesos?',
      respuesta: 'El Control de Accesos permite pre-registrar las visitas esperadas al residencial. Un residente o administrador registra el nombre, cédula del visitante y fecha esperada de llegada. Cuando el visitante llega a la garita, el guardia en línea cambia el estado de la visita a "EN_CURSO" e ingresa la fecha/hora y la placa del vehículo (si corresponde), agilizando el flujo de entrada de forma segura.',
      categoria: 'visitas'
    },
    {
      id: 'i1',
      pregunta: '¿Cuáles son los niveles de gravedad de los incidentes?',
      respuesta: 'Los incidentes se reportan con tres niveles de gravedad: BAJO (ej. fallas de luminarias o problemas con portones), MEDIO (ej. discusiones o desacatos menores de normas) y ALTO/CRÍTICO (ej. intrusión física, robos o emergencias médicas). Los incidentes críticos se reflejan en tiempo real en las estadísticas generales del Centro de Mando para atención inmediata.',
      categoria: 'incidentes'
    }
  ];

  const handleToggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !mensaje.trim()) return;
    setEnviado(true);
    setNombre('');
    setMensaje('');
    setTimeout(() => setEnviado(false), 5000);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.pregunta.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.respuesta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || faq.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      padding: '2rem',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Header Sección */}
      <div style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '1.5rem'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <HelpCircle size={32} color="#FACC15" />
          Temas de Ayuda e Instructivos
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          Preguntas frecuentes, guías de operación y soporte para el uso del sistema NCS365.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 350px',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Sección Principal FAQs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Barra de Búsqueda y Categorías */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '1.25rem',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar temas de ayuda..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filtro por categoría */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'general', label: 'General' },
                { id: 'rondas', label: 'Rondas' },
                { id: 'turnos', label: 'Turnos y Horarios' },
                { id: 'visitas', label: 'Control de Accesos' },
                { id: 'incidentes', label: 'Incidentes' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selectedCategory === cat.id ? '#FACC15' : 'rgba(255, 255, 255, 0.08)',
                    color: selectedCategory === cat.id ? '#0f172a' : '#fff'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listado Accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredFaqs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: 'rgba(30, 41, 59, 0.3)',
                borderRadius: '12px',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <HelpCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No encontramos preguntas que coincidan con tu búsqueda.</p>
              </div>
            ) : (
              filteredFaqs.map(faq => {
                const isOpen = expandedId === faq.id;
                return (
                  <div 
                    key={faq.id}
                    style={{
                      background: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div 
                      onClick={() => handleToggleAccordion(faq.id)}
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#FACC15'
                        }}></span>
                        {faq.pregunta}
                      </span>
                      <span style={{ color: '#94a3b8' }}>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>

                    {isOpen && (
                      <div style={{
                        padding: '0 1.25rem 1.25rem 2rem',
                        color: '#cbd5e1',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                        paddingTop: '1rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.2)'
                      }}>
                        {faq.respuesta}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Barra Lateral - Soporte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card Resumen de Contacto */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FACC15' }}>
              <Shield size={20} />
              Soporte NCS365
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 1.25rem 0' }}>
              ¿Tienes una incidencia técnica o requieres cambios de configuración avanzada en el sistema? Comunícate con nuestra central:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={iconWrapperStyle}><Phone size={14} color="#FACC15" /></div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Línea Directa</div>
                  <div style={{ fontWeight: '600' }}>+505 2278-9000</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={iconWrapperStyle}><Mail size={14} color="#FACC15" /></div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Correo Soporte</div>
                  <div style={{ fontWeight: '600' }}>soporte@newcenturyni.com</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={iconWrapperStyle}><Clock size={14} color="#FACC15" /></div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Horario de Atención</div>
                  <div style={{ fontWeight: '600' }}>24/7 (Emergencias)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Mensaje */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} color="#FACC15" />
              Enviar Consulta Directa
            </h4>

            {enviado ? (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                Mensaje enviado correctamente. El equipo de TI se pondrá en contacto pronto.
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <input 
                    type="text" 
                    placeholder="Tu Nombre / Puesto" 
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    style={sideInputStyle}
                  />
                </div>
                <div>
                  <textarea 
                    rows={4} 
                    placeholder="Escribe tu consulta o reporte aquí..." 
                    required
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    style={{ ...sideInputStyle, resize: 'vertical' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#FACC15',
                    color: '#0f172a',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Enviar Mensaje
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Estilos Auxiliares
const iconWrapperStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const sideInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box'
};

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, X, Send, Sparkles, Trash2, ExternalLink, MapPin } from 'lucide-react';
import { hermesApi, HermesChatHistoryItem } from '@/lib/api';

interface FloatingMessage {
  sender: 'user' | 'hermes';
  text: string;
  fuente?: 'GEMINI_AI' | 'HERMES_ANALYTICS';
  time: string;
}

const STORAGE_KEY = 'hermes_floating_chat_v1';

const getInitialMessage = (): FloatingMessage => ({
  sender: 'hermes',
  text: '¡Hola! Soy **Hermes Sentinel**. Puedes preguntarme sobre el estado en vivo del residencial o cómo usar cualquier función de la pantalla actual.',
  fuente: 'GEMINI_AI',
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
});

export default function HermesFloatingWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<FloatingMessage[]>([getInitialMessage()]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar historial de sesión para mantener continuidad al cambiar de página
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {
        // Ignorar errores de parseo en sessionStorage
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
      } catch {
        // Ignorar límite de almacenamiento
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Ocultar el widget flotante si ya estamos en la consola principal /hermes
  if (pathname === '/hermes') {
    return null;
  }

  const handleSend = async (customText?: string) => {
    const text = (customText ?? inputMsg).trim();
    if (!text || sending) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const historial: HermesChatHistoryItem[] = messages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }));

    setMessages(prev => [...prev, { sender: 'user', text, time: nowTime }]);
    if (!customText) setInputMsg('');
    setSending(true);

    try {
      const resp = await hermesApi.enviarMensaje(text, historial, pathname || '/');
      setMessages(prev => [
        ...prev,
        {
          sender: 'hermes',
          text: resp.respuesta,
          fuente: resp.fuente,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'hermes',
          text: `⚠️ No pude conectar con el centro de mando (${err?.response?.data || err?.message || 'Error de red'}).`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    const initial = [getInitialMessage()];
    setMessages(initial);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.25rem', right: '1.25rem', zIndex: 1050, fontFamily: 'inherit' }}>
      {/* Ventana de Chat Flotante */}
      {isOpen && (
        <div
          style={{
            width: 'min(390px, calc(100vw - 2rem))',
            height: 'min(540px, calc(100vh - 6rem))',
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.32)',
            border: '1.5px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}
        >
          {/* Cabecera Corporativa NCS365 */}
          <div
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #FACC15'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '0.6rem',
                  backgroundColor: 'rgba(250, 204, 21, 0.15)',
                  border: '1px solid #FACC15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bot size={20} color="#FACC15" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Hermes Sentinel
                  <span style={{ fontSize: '0.62rem', backgroundColor: '#10b981', color: '#fff', padding: '0.08rem 0.35rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                    IA
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={11} color="#FACC15" />
                  <span>Pantalla: {pathname || '/'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/hermes');
                }}
                title="Abrir consola completa de Hermes"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.3rem', borderRadius: '0.35rem' }}
              >
                <ExternalLink size={16} />
              </button>
              <button
                type="button"
                onClick={handleClear}
                title="Limpiar conversación"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.3rem', borderRadius: '0.35rem' }}
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Cerrar"
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.3rem', borderRadius: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lista de Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.85rem',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '86%',
                    backgroundColor: isUser ? '#0f172a' : '#ffffff',
                    color: isUser ? '#f8fafc' : '#1e293b',
                    padding: '0.65rem 0.85rem',
                    borderRadius: isUser ? '0.85rem 0.85rem 0.2rem 0.85rem' : '0.85rem 0.85rem 0.85rem 0.2rem',
                    border: isUser ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    fontSize: '0.83rem',
                    lineHeight: '1.42',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <div>{m.text}</div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.35rem',
                      fontSize: '0.66rem',
                      color: isUser ? '#94a3b8' : '#64748b'
                    }}
                  >
                    <span>{m.time}</span>
                    {!isUser && m.fuente && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                        <Sparkles size={10} color={m.fuente === 'GEMINI_AI' ? '#2563eb' : '#64748b'} />
                        {m.fuente === 'GEMINI_AI' ? 'Gemini AI' : 'Sentinel Engine'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div style={{ alignSelf: 'flex-start', fontSize: '0.78rem', color: '#64748b', padding: '0.4rem 0.6rem', fontStyle: 'italic' }}>
                Hermes está analizando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chips Rápidos Contextuales */}
          <div
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto'
            }}
          >
            {[
              '📖 ¿Cómo uso esta pantalla?',
              '🛡️ Estado del residencial',
              '📍 Guardias activos'
            ].map((chip, cIdx) => (
              <button
                key={cIdx}
                type="button"
                disabled={sending}
                onClick={() => handleSend(chip)}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.72rem',
                  padding: '0.28rem 0.6rem',
                  borderRadius: '1rem',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  cursor: sending ? 'not-allowed' : 'pointer'
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input de Texto */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '0.65rem 0.75rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '0.45rem',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              placeholder="Pregúntale a Hermes..."
              disabled={sending}
              style={{
                flex: 1,
                padding: '0.55rem 0.75rem',
                borderRadius: '0.55rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
                color: '#0f172a',
                backgroundColor: '#f8fafc'
              }}
            />
            <button
              type="submit"
              disabled={sending || !inputMsg.trim()}
              style={{
                backgroundColor: '#0f172a',
                color: '#FACC15',
                border: 'none',
                borderRadius: '0.55rem',
                padding: '0.55rem 0.75rem',
                cursor: sending || !inputMsg.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !inputMsg.trim() ? 0.55 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante Principal */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Abrir asistente Hermes Sentinel"
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          backgroundColor: '#0f172a',
          color: '#FACC15',
          border: '2px solid #FACC15',
          borderRadius: '9999px',
          padding: isOpen ? '0.75rem' : '0.7rem 1.15rem',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.35)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.86rem',
          transition: 'transform 0.15s ease'
        }}
      >
        {isOpen ? <X size={20} color="#FACC15" /> : (
          <>
            <Bot size={20} color="#FACC15" />
            <span>Hermes IA</span>
          </>
        )}
      </button>
    </div>
  );
}

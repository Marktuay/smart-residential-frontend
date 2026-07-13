"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { trackingApi, Ubicacion, puntosQrApi, PuntoQR } from '@/lib/api';

// Crear iconos personalizados usando L.divIcon para evitar problemas de SSR con imágenes
const guardIcon = new L.DivIcon({
  className: 'guard-marker',
  html: `<div style="background-color: #FACC15; border: 3px solid #1e293b; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 0 10px rgba(250, 204, 21, 0.8);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

const houseIcon = new L.DivIcon({
  className: 'house-marker',
  html: `<div style="background-color: #3b82f6; border: 2px solid #ffffff; border-radius: 50%; width: 14px; height: 14px; box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -7]
});

export default function LiveMap() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ubics, pts] = await Promise.all([
        trackingApi.getUbicaciones(),
        puntosQrApi.getPuntos()
      ]);
      setUbicaciones(ubics || []);
      // Filtrar puntos que tengan coordenadas válidas
      setPuntos((pts || []).filter(p => p.latitud && p.longitud));
    } catch (error) {
      console.error("Error obteniendo datos del mapa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Actualizar cada 10 segundos
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Centro por defecto: Si hay guardias, usar el primero, si no, usar un punto QR, si no, unas coordenadas genéricas (ej. lat/lng ficticias o neutras)
  const defaultCenter: [number, number] = 
    ubicaciones.length > 0 ? [ubicaciones[0].latitud, ubicaciones[0].longitud] :
    puntos.length > 0 ? [puntos[0].latitud!, puntos[0].longitud!] :
    [10.0, -84.0]; // Por defecto en Costa Rica (ejemplo)

  if (loading && ubicaciones.length === 0 && puntos.length === 0) {
    return <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', color: 'white', borderRadius: '1rem' }}>Cargando mapa operativo...</div>;
  }

  return (
    <div style={{ height: '600px', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={16} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* Usamos el tema oscuro de CartoDB (Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Renderizar Guardias */}
        {ubicaciones.map((u, i) => (
          <Marker 
            key={`guard-${u.usuario_id}-${i}`} 
            position={[u.latitud, u.longitud]} 
            icon={guardIcon}
          >
            <Popup>
              <div style={{ fontFamily: 'inherit', color: '#1e293b' }}>
                <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>Guardia ID: {u.usuario_id}</strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Última vez visto: {new Date(u.ultima_actualizacion || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Renderizar Puntos QR (Casas) */}
        {puntos.map((p, i) => (
          <Marker 
            key={`qr-${p.id}-${i}`} 
            position={[p.latitud!, p.longitud!]} 
            icon={houseIcon}
          >
            <Popup>
              <div style={{ fontFamily: 'inherit', color: '#1e293b' }}>
                <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>{p.nombre}</strong>
                {p.casa_id && (
                  <>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      🏠 Casa: {p.numero_casa}
                    </span>
                    {p.residente_nombre && (
                      <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>
                        👤 Residente: {p.residente_nombre}
                      </span>
                    )}
                    <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.5rem', backgroundColor: '#FACC15', color: '#1e293b', fontSize: '0.75rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>
                      Punto QR Seguro
                    </span>
                  </>
                )}
                {!p.casa_id && (
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Punto de Ronda General</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Leyenda superpuesta */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, backgroundColor: 'rgba(30, 41, 59, 0.9)', padding: '1rem', borderRadius: '0.5rem', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#94a3b8' }}>Leyenda</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FACC15', border: '2px solid #1e293b' }}></div>
          <span style={{ fontSize: '0.85rem' }}>Guardias en Ronda</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', border: '1px solid white' }}></div>
          <span style={{ fontSize: '0.85rem' }}>Puntos QR / Casas</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Ubicacion, HistorialUbicacion } from '@/lib/api';
import L from 'leaflet';

const getNombreFromEmail = (email?: string, id?: number) => {
  if (!email) return `Guardia #${id || ''}`;
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[\._\-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const createCustomGuardIcon = (nombre: string) => {
  return L.divIcon({
    className: 'custom-guard-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer; position: relative;">
        <div style="background-color: #0F172A; color: #FACC15; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 12px; border: 1.5px solid #FACC15; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.4); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
          <span>👮‍♂️</span> <span>${nombre}</span>
        </div>
        <div style="width: 26px; height: 26px; background-color: #2563EB; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background-color: #10B981; border-radius: 50%;"></div>
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #2563EB; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createWaypointIcon = (label: string, time: string, color: string) => {
  return L.divIcon({
    className: 'custom-waypoint-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); z-index: 1000;">
        <div style="background-color: #0F172A; color: #FFFFFF; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 8px; border: 1.5px solid ${color}; white-space: nowrap; box-shadow: 0 3px 8px rgba(0,0,0,0.4); margin-bottom: 2px;">
          ${label} (${time})
        </div>
        <div style="width: 18px; height: 18px; background-color: ${color}; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

function MapController({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

interface MapProps {
  guardiasActivos: Ubicacion[];
  historial: HistorialUbicacion[];
  mostrarHistorial: boolean;
  residencialInfo?: {latitud: number, longitud: number, zoom: number} | null;
}

export default function MapContainerComponent({ guardiasActivos, historial, mostrarHistorial, residencialInfo }: MapProps) {
  const centroPorDefecto: [number, number] = residencialInfo ? [residencialInfo.latitud, residencialInfo.longitud] : [12.1364, -86.2514]; 
  const zoomInicial = residencialInfo ? residencialInfo.zoom : 13;

  const center = guardiasActivos.length > 0 
    ? [guardiasActivos[0].latitud, guardiasActivos[0].longitud] as [number, number]
    : centroPorDefecto;

  const polylinePositions = historial.map(h => [h.latitud, h.longitud] as [number, number]);

  const horaInicioStr = historial.length > 0 && historial[0].registrado_en
    ? new Date(historial[0].registrado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const horaFinStr = historial.length > 0 && historial[historial.length - 1].registrado_en
    ? new Date(historial[historial.length - 1].registrado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <MapContainer center={center} zoom={zoomInicial} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {mostrarHistorial && polylinePositions.length > 0 && (
        <MapController bounds={polylinePositions} />
      )}

      {!mostrarHistorial && guardiasActivos.map((guardia) => {
        const nombreGuardia = getNombreFromEmail(guardia.email, guardia.usuario_id);
        const icon = createCustomGuardIcon(nombreGuardia);

        return (
          <Marker 
            key={guardia.usuario_id} 
            position={[guardia.latitud, guardia.longitud]}
            icon={icon}
          >
            <Popup>
              <div style={{ color: '#0f172a', padding: '4px' }}>
                <strong style={{ fontSize: '14px', color: '#2563EB' }}>👮‍♂️ {nombreGuardia}</strong><br />
                <span style={{ fontSize: '12px', color: '#64748b' }}>{guardia.email}</span><br />
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  <strong>ID:</strong> #{guardia.usuario_id} <br />
                  <strong>Lat:</strong> {guardia.latitud.toFixed(5)}, <strong>Lng:</strong> {guardia.longitud.toFixed(5)} <br />
                  <strong>Última señal:</strong> {guardia.ultima_actualizacion ? new Date(guardia.ultima_actualizacion).toLocaleTimeString() : 'Hace instantes'}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {mostrarHistorial && polylinePositions.length > 0 && (
        <>
          {/* Línea de patrullaje trazada en el mapa */}
          <Polyline positions={polylinePositions} color="#2563EB" weight={6} opacity={0.8} />
          <Polyline positions={polylinePositions} color="#FACC15" weight={3} dashArray="8, 8" />

          {/* Marcadores individuales por punto con hora exacta al hacer clic */}
          {historial.map((pt, idx) => (
            <CircleMarker
              key={idx}
              center={[pt.latitud, pt.longitud]}
              radius={4}
              pathOptions={{ fillColor: '#3B82F6', color: '#FFFFFF', weight: 1.5, fillOpacity: 0.9 }}
            >
              <Popup>
                <div style={{ color: '#0f172a', fontSize: '12px', padding: '2px' }}>
                  <strong>📍 Punto #{idx + 1} de la ruta</strong><br />
                  <strong>Hora:</strong> {new Date(pt.registrado_en).toLocaleTimeString()}<br />
                  <strong>Fecha:</strong> {new Date(pt.registrado_en).toLocaleDateString()}<br />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Lat: {pt.latitud.toFixed(5)}, Lng: {pt.longitud.toFixed(5)}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Punto Inicio */}
          <Marker 
            position={polylinePositions[0]}
            icon={createWaypointIcon('🚀 Inicio', horaInicioStr, '#10B981')}
          >
            <Popup>
              <div style={{ color: '#0f172a' }}>
                <strong style={{ color: '#10B981' }}>🚀 Punto Inicial de Patrullaje</strong><br />
                <strong>Hora Inicio:</strong> {new Date(historial[0].registrado_en).toLocaleString()}
              </div>
            </Popup>
          </Marker>

          {/* Punto Fin */}
          <Marker 
            position={polylinePositions[polylinePositions.length - 1]}
            icon={createWaypointIcon('🏁 Fin', horaFinStr, '#EF4444')}
          >
            <Popup>
              <div style={{ color: '#0f172a' }}>
                <strong style={{ color: '#EF4444' }}>🏁 Último Punto Registrado</strong><br />
                <strong>Hora Fin:</strong> {new Date(historial[historial.length - 1].registrado_en).toLocaleString()}
              </div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}

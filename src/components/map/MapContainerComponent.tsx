'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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

interface MapProps {
  guardiasActivos: Ubicacion[];
  historial: HistorialUbicacion[];
  mostrarHistorial: boolean;
  residencialInfo?: {latitud: number, longitud: number, zoom: number} | null;
}

export default function MapContainerComponent({ guardiasActivos, historial, mostrarHistorial, residencialInfo }: MapProps) {
  // Centro por defecto: Si viene del backend usar ese, sino Managua, Nicaragua
  const centroPorDefecto: [number, number] = residencialInfo ? [residencialInfo.latitud, residencialInfo.longitud] : [12.1364, -86.2514]; 
  const zoomInicial = residencialInfo ? residencialInfo.zoom : 13;

  const center = guardiasActivos.length > 0 
    ? [guardiasActivos[0].latitud, guardiasActivos[0].longitud] as [number, number]
    : centroPorDefecto;

  const polylinePositions = historial.map(h => [h.latitud, h.longitud] as [number, number]);

  return (
    <MapContainer center={center} zoom={zoomInicial} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
          <Polyline positions={polylinePositions} color="#FACC15" weight={5} />
          <Marker position={polylinePositions[0]}>
            <Popup><div style={{ color: '#000' }}>Inicio de ruta</div></Popup>
          </Marker>
          <Marker position={polylinePositions[polylinePositions.length - 1]}>
            <Popup><div style={{ color: '#000' }}>Fin de ruta</div></Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}

'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Ubicacion, HistorialUbicacion } from '@/lib/api';
import L from 'leaflet';

// Arreglar iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

      {!mostrarHistorial && guardiasActivos.map((guardia) => (
        <Marker key={guardia.usuario_id} position={[guardia.latitud, guardia.longitud]}>
          <Popup>
            <div style={{ color: '#000' }}>
              <strong>Guardia ID:</strong> {guardia.usuario_id} <br />
              <strong>Actualizado:</strong> {guardia.ultima_actualizacion}
            </div>
          </Popup>
        </Marker>
      ))}

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

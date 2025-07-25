'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngBounds, LatLngTuple } from 'leaflet';
import { Aircraft } from '@/types';

// Custom aircraft icon
const aircraftIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#0969da" stroke="#ffffff" stroke-width="1"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

interface FlightMapProps {
  aircraft: Aircraft[];
  selectedAircraft?: Aircraft | null;
  onAircraftSelect?: (aircraft: Aircraft) => void;
}

export default function FlightMap({ 
  aircraft, 
  selectedAircraft, 
  onAircraftSelect 
}: FlightMapProps) {
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  
  // Default center (over North America/Atlantic)
  const defaultCenter: LatLngTuple = [40.7589, -73.9851];
  const defaultZoom = 6;

  // Filter valid aircraft positions
  const validAircraft = aircraft.filter(
    a => a.latitude !== null && a.longitude !== null && !a.on_ground
  );

  useEffect(() => {
    if (validAircraft.length > 0) {
      const lats = validAircraft.map(a => a.latitude!);
      const lngs = validAircraft.map(a => a.longitude!);
      
      const bounds = new LatLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );
      
      setMapBounds(bounds);
    }
  }, [validAircraft]);

  const formatAltitude = (altitude: number | null) => {
    if (altitude === null) return 'Unknown';
    return Math.round(altitude * 3.28084).toLocaleString() + ' ft';
  };

  const formatSpeed = (velocity: number | null) => {
    if (velocity === null) return 'Unknown';
    return Math.round(velocity * 1.94384) + ' knots';
  };

  return (
    <div className="h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        zoomControl={true}
        bounds={mapBounds || undefined}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validAircraft.map((plane) => (
          <Marker
            key={plane.icao24}
            position={[plane.latitude!, plane.longitude!]}
            icon={aircraftIcon}
            eventHandlers={{
              click: () => onAircraftSelect?.(plane)
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="font-semibold text-sm mb-2">
                  {plane.callsign?.trim() || 'Unknown Flight'}
                </div>
                <div className="space-y-1 text-xs">
                  <div><span className="font-medium">ICAO:</span> {plane.icao24.toUpperCase()}</div>
                  <div><span className="font-medium">Country:</span> {plane.origin_country}</div>
                  <div><span className="font-medium">Altitude:</span> {formatAltitude(plane.baro_altitude)}</div>
                  <div><span className="font-medium">Speed:</span> {formatSpeed(plane.velocity)}</div>
                  <div><span className="font-medium">Heading:</span> {plane.true_track ? Math.round(plane.true_track) + '°' : 'Unknown'}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
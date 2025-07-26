'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { Aircraft } from '@/types';
import AnimatedMarker from './AnimatedMarker';

// Create rotated aircraft icon based on heading
const createAircraftIcon = (heading?: number | null) => {
  const rotation = heading ? heading - 90 : 0; // Adjust for icon orientation
  
  return new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${rotation} 12 12)">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#0969da" stroke="#ffffff" stroke-width="1"/>
        </g>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

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
  // Default center (over North America/Atlantic) 
  const defaultCenter: LatLngTuple = [40.7589, -73.9851];
  const defaultZoom = 4;

  // Filter valid aircraft positions (memoized to prevent infinite re-renders)
  const validAircraft = useMemo(() => 
    aircraft.filter(a => a.latitude !== null && a.longitude !== null && !a.on_ground),
    [aircraft]
  );

  return (
    <div className="h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validAircraft.map((plane) => (
          <AnimatedMarker
            key={plane.icao24}
            aircraft={plane}
            icon={createAircraftIcon(plane.true_track)}
            onAircraftSelect={onAircraftSelect}
          />
        ))}
      </MapContainer>
    </div>
  );
}
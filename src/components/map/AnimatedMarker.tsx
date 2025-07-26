'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import { Aircraft } from '@/types';

interface AnimatedMarkerProps {
  aircraft: Aircraft;
  icon: Icon;
  onAircraftSelect?: (aircraft: Aircraft) => void;
}

export default function AnimatedMarker({ 
  aircraft, 
  icon, 
  onAircraftSelect 
}: AnimatedMarkerProps) {
  const markerRef = useRef<any>(null);
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  
  const targetPosition = new LatLng(aircraft.latitude!, aircraft.longitude!);

  useEffect(() => {
    if (!currentPosition) {
      // Initial position - no animation
      setCurrentPosition(targetPosition);
      return;
    }

    // Only animate if position actually changed significantly (avoid micro-movements)
    const distance = currentPosition.distanceTo(targetPosition);
    if (distance < 100) { // Less than 100 meters - don't animate
      return;
    }

    // Animate from current position to target position
    const startPosition = currentPosition;
    const startTime = Date.now();
    const duration = Math.min(3000, Math.max(1000, distance * 10)); // Dynamic duration based on distance

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const lat = startPosition.lat + (targetPosition.lat - startPosition.lat) * easeProgress;
      const lng = startPosition.lng + (targetPosition.lng - startPosition.lng) * easeProgress;
      
      const newPosition = new LatLng(lat, lng);
      setCurrentPosition(newPosition);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [targetPosition.lat, targetPosition.lng, currentPosition]);

  const formatAltitude = (altitude: number | null) => {
    if (altitude === null) return 'Unknown';
    return Math.round(altitude * 3.28084).toLocaleString() + ' ft';
  };

  const formatSpeed = (velocity: number | null) => {
    if (velocity === null) return 'Unknown';
    return Math.round(velocity * 1.94384) + ' knots';
  };

  if (!currentPosition) return null;

  return (
    <Marker
      ref={markerRef}
      position={currentPosition}
      icon={icon}
      eventHandlers={{
        click: () => onAircraftSelect?.(aircraft)
      }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="font-semibold text-sm mb-2">
            {aircraft.callsign?.trim() || 'Unknown Flight'}
          </div>
          <div className="space-y-1 text-xs">
            <div><span className="font-medium">ICAO:</span> {aircraft.icao24.toUpperCase()}</div>
            <div><span className="font-medium">Country:</span> {aircraft.origin_country}</div>
            <div><span className="font-medium">Altitude:</span> {formatAltitude(aircraft.baro_altitude)}</div>
            <div><span className="font-medium">Speed:</span> {formatSpeed(aircraft.velocity)}</div>
            <div><span className="font-medium">Heading:</span> {aircraft.true_track ? Math.round(aircraft.true_track) + '°' : 'Unknown'}</div>
            <div className="text-xs text-gray-500 mt-2">
              Last contact: {new Date(aircraft.last_contact * 1000).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
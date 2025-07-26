'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import { Aircraft } from '@/types';

interface OptimizedAircraftMarkerProps {
  aircraft: Aircraft;
  icon: Icon;
  isSelected: boolean;
  onAircraftSelect?: (aircraft: Aircraft) => void;
}

const OptimizedAircraftMarker = memo(function OptimizedAircraftMarker({ 
  aircraft, 
  icon, 
  isSelected,
  onAircraftSelect 
}: OptimizedAircraftMarkerProps) {
  const markerRef = useRef<any>(null);
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const targetPosition = new LatLng(aircraft.latitude!, aircraft.longitude!);

  useEffect(() => {
    if (!currentPosition) {
      setCurrentPosition(targetPosition);
      return;
    }

    // Only animate significant position changes
    const distance = currentPosition.distanceTo(targetPosition);
    if (distance < 100) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startPosition = currentPosition;
    const startTime = Date.now();
    const duration = Math.min(2000, Math.max(500, distance * 5));

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const lat = startPosition.lat + (targetPosition.lat - startPosition.lat) * easeProgress;
      const lng = startPosition.lng + (targetPosition.lng - startPosition.lng) * easeProgress;
      
      setCurrentPosition(new LatLng(lat, lng));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetPosition.lat, targetPosition.lng, currentPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const formatAltitude = (altitude: number | null) => {
    if (altitude === null) return 'Unknown';
    return Math.round(altitude * 3.28084).toLocaleString() + ' ft';
  };

  const formatSpeed = (velocity: number | null) => {
    if (velocity === null) return 'Unknown';
    return Math.round(velocity * 1.94384) + ' knots';
  };

  const formatLastContact = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = Math.floor(now - timestamp);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  if (!currentPosition || !icon) return null;

  return (
    <Marker
      ref={markerRef}
      position={currentPosition}
      icon={icon}
      eventHandlers={{
        click: () => onAircraftSelect?.(aircraft)
      }}
      zIndexOffset={isSelected ? 1000 : 0}
    >
      <Popup>
        <div className="p-3 min-w-[220px]">
          <div className="font-semibold text-base mb-3 flex items-center justify-between">
            <span>{aircraft.callsign?.trim() || 'Unknown Flight'}</span>
            {isSelected && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                Selected
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-600">ICAO:</span>
              <div className="font-mono">{aircraft.icao24.toUpperCase()}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Country:</span>
              <div>{aircraft.origin_country}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Altitude:</span>
              <div>{formatAltitude(aircraft.baro_altitude)}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Speed:</span>
              <div>{formatSpeed(aircraft.velocity)}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Heading:</span>
              <div>{aircraft.true_track ? Math.round(aircraft.true_track) + '°' : 'Unknown'}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Vertical Rate:</span>
              <div>
                {aircraft.vertical_rate 
                  ? `${aircraft.vertical_rate > 0 ? '+' : ''}${Math.round(aircraft.vertical_rate * 196.85)} ft/min`
                  : 'Level'
                }
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div>Position: {aircraft.latitude?.toFixed(4)}, {aircraft.longitude?.toFixed(4)}</div>
              <div>Last contact: {formatLastContact(aircraft.last_contact)}</div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.aircraft.icao24 === nextProps.aircraft.icao24 &&
    prevProps.aircraft.latitude === nextProps.aircraft.latitude &&
    prevProps.aircraft.longitude === nextProps.aircraft.longitude &&
    prevProps.aircraft.true_track === nextProps.aircraft.true_track &&
    prevProps.aircraft.baro_altitude === nextProps.aircraft.baro_altitude &&
    prevProps.aircraft.velocity === nextProps.aircraft.velocity &&
    prevProps.aircraft.last_contact === nextProps.aircraft.last_contact &&
    prevProps.isSelected === nextProps.isSelected
  );
});

export default OptimizedAircraftMarker;
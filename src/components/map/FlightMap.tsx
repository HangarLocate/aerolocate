'use client';

import { useMemo, useCallback, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { LatLngTuple, LatLngBounds } from 'leaflet';
import { Aircraft } from '@/types';
import { aircraftIconCache } from '@/lib/iconCache';
import OptimizedAircraftMarker from './OptimizedAircraftMarker';
import AircraftCluster from './AircraftCluster';

// Component to track map viewport changes

interface ViewportManagerProps {
  onBoundsChange: (bounds: LatLngBounds) => void;
  onZoomChange: (zoom: number) => void;
}

function ViewportManager({ onBoundsChange, onZoomChange }: ViewportManagerProps) {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      onZoomChange(map.getZoom());
      onBoundsChange(map.getBounds());
    },
  });

  return null;
}

interface FlightMapProps {
  aircraft: Aircraft[];
  selectedAircraft?: Aircraft | null;
  onAircraftSelect?: (aircraft: Aircraft) => void;
  onBoundsChange?: (bounds: LatLngBounds) => void;
  onZoomChange?: (zoom: number) => void;
}

export default function FlightMap({ 
  aircraft, 
  selectedAircraft, 
  onAircraftSelect,
  onBoundsChange,
  onZoomChange
}: FlightMapProps) {
  const [currentZoom, setCurrentZoom] = useState(4);
  const defaultCenter: LatLngTuple = [40.7589, -73.9851];
  const defaultZoom = 4;

  // Memoized aircraft filtering and icon assignment
  const validAircraft = useMemo(() => {
    return aircraft.filter(a => a.latitude !== null && a.longitude !== null && !a.on_ground);
  }, [aircraft]);

  const optimizedAircraft = useMemo(() => {
    return validAircraft.map(plane => ({
      ...plane,
      icon: aircraftIconCache.getIcon(
        plane.true_track, 
        selectedAircraft?.icao24 === plane.icao24
      ),
    }));
  }, [validAircraft, selectedAircraft?.icao24]);

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    onBoundsChange?.(bounds);
  }, [onBoundsChange]);

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    onZoomChange?.(zoom);
  }, [onZoomChange]);

  // Determine if clustering should be enabled based on zoom and aircraft count
  const shouldCluster = currentZoom < 8 && validAircraft.length > 50;

  // Get aircraft to render (filter out clustered ones)
  const aircraftToRender = useMemo(() => {
    if (!shouldCluster) return optimizedAircraft;
    // For now, show all aircraft when clustering is active
    // In a full implementation, we'd filter out clustered aircraft
    return optimizedAircraft;
  }, [shouldCluster, optimizedAircraft]);

  const handleClusterClick = useCallback((clusterAircraft: Aircraft[]) => {
    // For now, just select the first aircraft in the cluster
    if (clusterAircraft.length > 0) {
      onAircraftSelect?.(clusterAircraft[0]);
    }
  }, [onAircraftSelect]);

  return (
    <div className="h-full w-full">
      <style jsx global>{`
        .aircraft-cluster-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        zoomControl={true}
        preferCanvas={true} // Use Canvas for better performance
        maxZoom={15}
        minZoom={2}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={15}
          tileSize={256}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />
        
        <ViewportManager 
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
        />

        {/* Custom clustering system */}
        <AircraftCluster
          aircraft={validAircraft}
          zoom={currentZoom}
          onClusterClick={handleClusterClick}
        />

        {/* Individual aircraft markers */}
        {aircraftToRender.map((plane) => (
          <OptimizedAircraftMarker
            key={plane.icao24}
            aircraft={plane}
            icon={plane.icon}
            isSelected={selectedAircraft?.icao24 === plane.icao24}
            onAircraftSelect={onAircraftSelect}
          />
        ))}
      </MapContainer>
    </div>
  );
}
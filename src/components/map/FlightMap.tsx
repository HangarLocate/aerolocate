'use client';

import { useMemo, useCallback, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { LatLngTuple, LatLngBounds } from 'leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Aircraft } from '@/types';
import { aircraftIconCache } from '@/lib/iconCache';
import OptimizedAircraftMarker from './OptimizedAircraftMarker';

// Custom cluster icon
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 'small';
  if (count >= 100) size = 'large';
  else if (count >= 50) size = 'medium';

  return L.divIcon({
    html: `<div class="cluster cluster-${size}"><span>${count}</span></div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(40, 40, true),
  });
};

interface ViewportManagerProps {
  onBoundsChange: (bounds: LatLngBounds) => void;
  onZoomChange: (zoom: number) => void;
}

// Component to track map viewport changes
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
  const optimizedAircraft = useMemo(() => {
    return aircraft
      .filter(a => a.latitude !== null && a.longitude !== null && !a.on_ground)
      .map(plane => ({
        ...plane,
        icon: aircraftIconCache.getIcon(
          plane.true_track, 
          selectedAircraft?.icao24 === plane.icao24
        ),
      }));
  }, [aircraft, selectedAircraft?.icao24]);

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    onBoundsChange?.(bounds);
  }, [onBoundsChange]);

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    onZoomChange?.(zoom);
  }, [onZoomChange]);

  // Determine if clustering should be enabled based on zoom and aircraft count
  const shouldCluster = currentZoom < 8 && optimizedAircraft.length > 50;

  return (
    <div className="h-full w-full">
      <style jsx global>{`
        .cluster {
          background: rgba(9, 105, 218, 0.9);
          border: 2px solid white;
          border-radius: 50%;
          text-align: center;
          color: white;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .cluster-small {
          width: 30px;
          height: 30px;
          font-size: 12px;
        }
        .cluster-medium {
          width: 35px;
          height: 35px;
          font-size: 13px;
          background: rgba(9, 105, 218, 0.95);
        }
        .cluster-large {
          width: 40px;
          height: 40px;
          font-size: 14px;
          background: rgba(9, 105, 218, 1);
        }
        .custom-marker-cluster {
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

        {shouldCluster ? (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {optimizedAircraft.map((plane) => (
              <OptimizedAircraftMarker
                key={plane.icao24}
                aircraft={plane}
                icon={plane.icon}
                isSelected={selectedAircraft?.icao24 === plane.icao24}
                onAircraftSelect={onAircraftSelect}
              />
            ))}
          </MarkerClusterGroup>
        ) : (
          // Direct rendering for high zoom levels
          optimizedAircraft.map((plane) => (
            <OptimizedAircraftMarker
              key={plane.icao24}
              aircraft={plane}
              icon={plane.icon}
              isSelected={selectedAircraft?.icao24 === plane.icao24}
              onAircraftSelect={onAircraftSelect}
            />
          ))
        )}
      </MapContainer>
    </div>
  );
}
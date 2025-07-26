'use client';

import React, { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { LatLng, DivIcon } from 'leaflet';
import L from 'leaflet';
import { Aircraft } from '@/types';

interface ClusterPoint {
  position: LatLng;
  aircraft: Aircraft[];
  size: 'small' | 'medium' | 'large';
}

interface AircraftClusterProps {
  aircraft: Aircraft[];
  zoom: number;
  onClusterClick?: (aircraft: Aircraft[]) => void;
}

// Simple clustering algorithm based on distance
function clusterAircraft(aircraft: Aircraft[], zoom: number): ClusterPoint[] {
  if (zoom >= 8) return []; // No clustering at high zoom

  const clusters: ClusterPoint[] = [];
  const processed = new Set<string>();
  const clusterRadius = Math.max(50, 200 - (zoom * 20)); // Dynamic radius based on zoom

  aircraft.forEach(plane => {
    if (processed.has(plane.icao24)) return;

    const position = new LatLng(plane.latitude!, plane.longitude!);
    const clusterAircraft = [plane];
    processed.add(plane.icao24);

    // Find nearby aircraft to cluster
    aircraft.forEach(other => {
      if (processed.has(other.icao24)) return;

      const otherPosition = new LatLng(other.latitude!, other.longitude!);
      const distance = position.distanceTo(otherPosition);

      if (distance <= clusterRadius) {
        clusterAircraft.push(other);
        processed.add(other.icao24);
      }
    });

    // Only create cluster if there are multiple aircraft
    if (clusterAircraft.length > 1) {
      // Calculate center point
      const avgLat = clusterAircraft.reduce((sum, a) => sum + a.latitude!, 0) / clusterAircraft.length;
      const avgLng = clusterAircraft.reduce((sum, a) => sum + a.longitude!, 0) / clusterAircraft.length;

      let size: 'small' | 'medium' | 'large' = 'small';
      if (clusterAircraft.length >= 100) size = 'large';
      else if (clusterAircraft.length >= 50) size = 'medium';

      clusters.push({
        position: new LatLng(avgLat, avgLng),
        aircraft: clusterAircraft,
        size
      });
    }
  });

  return clusters;
}

function createClusterIcon(count: number, size: 'small' | 'medium' | 'large'): DivIcon {
  const sizeConfig = {
    small: { width: 30, height: 30, fontSize: 12 },
    medium: { width: 35, height: 35, fontSize: 13 },
    large: { width: 40, height: 40, fontSize: 14 }
  };

  const config = sizeConfig[size];

  return new DivIcon({
    html: `
      <div style="
        width: ${config.width}px;
        height: ${config.height}px;
        background: rgba(9, 105, 218, 0.9);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${config.fontSize}px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        ${count}
      </div>
    `,
    className: 'aircraft-cluster-marker',
    iconSize: [config.width, config.height],
    iconAnchor: [config.width / 2, config.height / 2],
  });
}

export default function AircraftCluster({ 
  aircraft, 
  zoom, 
  onClusterClick 
}: AircraftClusterProps) {
  const clusters = useMemo(() => {
    if (zoom >= 8 || aircraft.length <= 50) return [];
    return clusterAircraft(aircraft, zoom);
  }, [aircraft, zoom]);

  return (
    <>
      {clusters.map((cluster, index) => (
        <Marker
          key={`cluster-${index}`}
          position={cluster.position}
          icon={createClusterIcon(cluster.aircraft.length, cluster.size)}
          eventHandlers={{
            click: () => onClusterClick?.(cluster.aircraft)
          }}
        />
      ))}
    </>
  );
}
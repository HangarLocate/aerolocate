'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { LatLngBounds } from 'leaflet';
import Header from '@/components/ui/Header';
import { useViewportAircraft } from '@/hooks/useViewportAircraft';
import { Aircraft } from '@/types';
import { visualCompassTest } from '@/utils/headingTest';

const FlightMap = dynamic(() => import('@/components/map/FlightMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
        <p className="text-sm text-foreground/60">Loading optimized map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(4);
  
  const { 
    aircraft, 
    loading, 
    error, 
    lastUpdated, 
    refresh, 
    stats 
  } = useViewportAircraft({
    mapBounds,
    zoom,
    refreshInterval: 10000, // 10 seconds for live updates
    autoRefresh: true,
  });

  const handleAircraftSelect = useCallback((aircraft: Aircraft) => {
    setSelectedAircraft(aircraft);
  }, []);

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setMapBounds(bounds);
  }, []);

  const handleZoomChange = useCallback((zoomLevel: number) => {
    setZoom(zoomLevel);
  }, []);

  // Expose heading test function to browser console for debugging
  if (typeof window !== 'undefined') {
    (window as any).testHeadings = visualCompassTest;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header 
        onRefresh={refresh}
        isLoading={loading}
        lastUpdated={lastUpdated}
      />
      
      <main className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-sm">
            <div className="flex items-center">
              <div className="font-medium">Error loading flight data</div>
            </div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        <FlightMap
          aircraft={aircraft}
          selectedAircraft={selectedAircraft}
          onAircraftSelect={handleAircraftSelect}
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
        />

        {/* Enhanced Status indicator */}
        <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-sm border border-border-muted rounded-md px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              loading ? 'bg-yellow-400 animate-pulse' : 
              error ? 'bg-red-400' : 'bg-green-400'
            }`}></div>
            <span className="text-foreground/70">
              {loading ? 'Fetching live data...' : 
               error ? 'API error - using fallback data' : 
               `${stats.totalAircraft}/${stats.maxForZoom} aircraft • Zoom ${zoom} • Live updates`}
            </span>
          </div>
        </div>

        {/* Performance indicator */}
        <div className="absolute bottom-4 right-4 z-10 bg-card/90 backdrop-blur-sm border border-border-muted rounded-md px-3 py-2 shadow-sm">
          <div className="text-xs text-foreground/60">
            <div>Optimized rendering • Icon cache active</div>
            <div>Clustering: {zoom < 8 && aircraft.length > 50 ? 'ON' : 'OFF'}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

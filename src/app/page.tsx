'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Header from '@/components/ui/Header';
import { useFlightData } from '@/hooks/useFlightData';
import { Aircraft } from '@/types';

const FlightMap = dynamic(() => import('@/components/map/FlightMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
        <p className="text-sm text-foreground/60">Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const { aircraft, loading, error, lastUpdated, refresh } = useFlightData({
    refreshInterval: 30000,
    autoRefresh: true,
  });

  const handleAircraftSelect = (aircraft: Aircraft) => {
    setSelectedAircraft(aircraft);
  };

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
        />

        {/* Status indicator */}
        <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-sm border border-border-muted rounded-md px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              loading ? 'bg-yellow-400 animate-pulse' : 
              error ? 'bg-red-400' : 'bg-green-400'
            }`}></div>
            <span className="text-foreground/70">
              {loading ? 'Updating...' : 
               error ? 'Connection error' : 
               `${aircraft.filter(a => !a.on_ground && a.latitude !== null).length} aircraft tracked`}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

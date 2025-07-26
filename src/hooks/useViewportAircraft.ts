'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LatLngBounds } from 'leaflet';
import { Aircraft, MapBounds } from '@/types';
import { OpenSkyAPI } from '@/lib/opensky';

interface UseViewportAircraftProps {
  mapBounds?: LatLngBounds | null;
  zoom?: number;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface AircraftState {
  aircraft: Map<string, Aircraft>;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

export function useViewportAircraft({
  mapBounds,
  zoom = 4,
  refreshInterval = 10000, // 10 seconds for live feel
  autoRefresh = true,
}: UseViewportAircraftProps = {}) {
  const [state, setState] = useState<AircraftState>({
    aircraft: new Map(),
    lastUpdated: null,
    loading: false,
    error: null,
  });

  const openSky = OpenSkyAPI.getInstance();

  // Calculate buffer around viewport to smooth panning
  const getBufferedBounds = useCallback((bounds: LatLngBounds, zoomLevel: number): MapBounds | null => {
    if (!bounds) return null;

    // Larger buffer at lower zoom levels
    const bufferFactor = Math.max(0.1, 0.5 - (zoomLevel * 0.05));
    
    const latDiff = bounds.getNorth() - bounds.getSouth();
    const lngDiff = bounds.getEast() - bounds.getWest();
    
    return {
      north: bounds.getNorth() + (latDiff * bufferFactor),
      south: bounds.getSouth() - (latDiff * bufferFactor),
      east: bounds.getEast() + (lngDiff * bufferFactor),
      west: bounds.getWest() - (lngDiff * bufferFactor),
    };
  }, []);

  // Determine max aircraft count based on zoom level
  const getMaxAircraftForZoom = useCallback((zoomLevel: number): number => {
    if (zoomLevel <= 4) return 200;   // Continental view
    if (zoomLevel <= 6) return 500;   // Regional view
    if (zoomLevel <= 8) return 1000;  // City view
    if (zoomLevel <= 10) return 2000; // Detailed view
    return 5000; // Maximum detail
  }, []);

  // Filter and prioritize aircraft based on zoom and viewport
  const prioritizeAircraft = useCallback((aircraftList: Aircraft[], zoomLevel: number): Aircraft[] => {
    const maxCount = getMaxAircraftForZoom(zoomLevel);
    
    if (aircraftList.length <= maxCount) return aircraftList;

    // Priority scoring: commercial flights, higher altitude, faster speed
    const scored = aircraftList.map(aircraft => {
      let score = 0;
      
      // Commercial flights (have callsigns starting with airline codes)
      if (aircraft.callsign && /^[A-Z]{2,3}\d/.test(aircraft.callsign.trim())) {
        score += 100;
      }
      
      // Higher altitude gets priority (more interesting)
      if (aircraft.baro_altitude) {
        score += Math.min(aircraft.baro_altitude / 1000, 50);
      }
      
      // Faster aircraft (jets vs props)
      if (aircraft.velocity) {
        score += Math.min(aircraft.velocity / 10, 30);
      }
      
      // Recent position updates
      const timeSinceUpdate = Date.now() / 1000 - aircraft.last_contact;
      score += Math.max(0, 20 - timeSinceUpdate);
      
      return { aircraft, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount)
      .map(item => item.aircraft);
  }, [getMaxAircraftForZoom]);

  const fetchAircraft = useCallback(async () => {
    const bufferedBounds = mapBounds ? getBufferedBounds(mapBounds, zoom) : null;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let newAircraft: Aircraft[];
      
      if (bufferedBounds) {
        newAircraft = await openSky.getStatesInBounds(bufferedBounds);
      } else {
        // Global view - get all aircraft but limit count
        newAircraft = await openSky.getAllStates();
      }

      // Filter valid aircraft
      const validAircraft = newAircraft.filter(
        a => a.latitude !== null && 
             a.longitude !== null && 
             !a.on_ground &&
             a.last_contact > (Date.now() / 1000 - 300) // Within last 5 minutes
      );

      // Prioritize and limit based on zoom
      const prioritizedAircraft = prioritizeAircraft(validAircraft, zoom);

      // Convert to Map for efficient lookups and updates
      const aircraftMap = new Map(
        prioritizedAircraft.map(aircraft => [aircraft.icao24, aircraft])
      );

      setState(prev => ({
        ...prev,
        aircraft: aircraftMap,
        lastUpdated: new Date(),
        loading: false,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch aircraft data';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));

      // Fallback to mock data only if we have no aircraft
      if (state.aircraft.size === 0) {
        try {
          const { getMockAircraft } = await import('@/lib/mockData');
          const mockData = getMockAircraft();
          const mockMap = new Map(mockData.map(a => [a.icao24, a]));
          
          setState(prev => ({
            ...prev,
            aircraft: mockMap,
            lastUpdated: new Date(),
            error: 'Using fallback data - ' + errorMessage,
          }));
        } catch (mockError) {
          console.error('Failed to load mock data:', mockError);
        }
      }
    }
  }, [mapBounds, zoom, getBufferedBounds, prioritizeAircraft, openSky, state.aircraft.size]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchAircraft();
  }, [fetchAircraft]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAircraft, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAircraft, refreshInterval, autoRefresh]);

  // Convert Map back to Array for component consumption
  const aircraftArray = useMemo(() => 
    Array.from(state.aircraft.values()),
    [state.aircraft]
  );

  const searchAircraft = useCallback(async (icao24: string): Promise<Aircraft | null> => {
    // First check our current data
    const existing = state.aircraft.get(icao24.toLowerCase());
    if (existing) return existing;

    // If not found, fetch from API
    try {
      setState(prev => ({ ...prev, loading: true }));
      const aircraft = await openSky.getAircraftByIcao(icao24);
      
      if (aircraft) {
        // Add to our current set
        setState(prev => ({
          ...prev,
          aircraft: new Map(prev.aircraft).set(aircraft.icao24, aircraft),
        }));
      }
      
      return aircraft;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Search failed',
      }));
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.aircraft, openSky]);

  return {
    aircraft: aircraftArray,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    searchAircraft,
    refresh: fetchAircraft,
    stats: {
      totalAircraft: state.aircraft.size,
      maxForZoom: getMaxAircraftForZoom(zoom),
    },
  };
}
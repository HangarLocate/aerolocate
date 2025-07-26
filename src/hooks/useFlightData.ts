'use client';

import { useState, useEffect, useCallback } from 'react';
import { Aircraft, MapBounds } from '@/types';
import { OpenSkyAPI } from '@/lib/opensky';

interface UseFlightDataProps {
  bounds?: MapBounds;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function useFlightData({
  bounds,
  refreshInterval = 30000,
  autoRefresh = true,
}: UseFlightDataProps = {}) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const openSky = OpenSkyAPI.getInstance();

  const fetchFlightData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Temporarily use mock data for testing
      const { getMockAircraft } = await import('@/lib/mockData');
      const data = getMockAircraft();
      
      // Uncomment this for real API data:
      // let data: Aircraft[];
      // if (bounds) {
      //   data = await openSky.getStatesInBounds(bounds);
      // } else {
      //   data = await openSky.getAllStates();
      // }

      setAircraft(data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flight data';
      setError(errorMessage);
      console.error('Flight data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [bounds]); // removed openSky from dependencies as it's a singleton

  // Initial fetch
  useEffect(() => {
    fetchFlightData();
  }, [fetchFlightData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchFlightData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchFlightData, refreshInterval, autoRefresh]);

  const searchAircraft = useCallback(async (icao24: string): Promise<Aircraft | null> => {
    try {
      setLoading(true);
      const aircraft = await openSky.getAircraftByIcao(icao24);
      return aircraft;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [openSky]);

  const manualRefresh = useCallback(() => {
    fetchFlightData();
  }, [fetchFlightData]);

  return {
    aircraft,
    loading,
    error,
    lastUpdated,
    searchAircraft,
    refresh: manualRefresh,
  };
}
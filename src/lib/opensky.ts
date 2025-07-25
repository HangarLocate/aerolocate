import { Aircraft, MapBounds } from '@/types';

const OPENSKY_BASE_URL = 'https://opensky-network.org/api';

export class OpenSkyAPI {
  private static instance: OpenSkyAPI;
  private lastRequestTime: number = 0;
  private readonly RATE_LIMIT_MS = 10000; // 10 seconds between requests

  static getInstance(): OpenSkyAPI {
    if (!OpenSkyAPI.instance) {
      OpenSkyAPI.instance = new OpenSkyAPI();
    }
    return OpenSkyAPI.instance;
  }

  private async makeRequest(endpoint: string, params?: URLSearchParams): Promise<any> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const url = `${OPENSKY_BASE_URL}${endpoint}${params ? `?${params.toString()}` : ''}`;
    
    try {
      const response = await fetch(url);
      this.lastRequestTime = Date.now();

      if (!response.ok) {
        throw new Error(`OpenSky API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OpenSky API request failed:', error);
      throw error;
    }
  }

  async getAllStates(): Promise<Aircraft[]> {
    try {
      const data = await this.makeRequest('/states/all');
      
      if (!data || !data.states) {
        return [];
      }

      return data.states.map((state: any[]): Aircraft => ({
        icao24: state[0] || '',
        callsign: state[1],
        origin_country: state[2] || '',
        time_position: state[3],
        last_contact: state[4] || 0,
        longitude: state[5],
        latitude: state[6],
        baro_altitude: state[7],
        on_ground: state[8] || false,
        velocity: state[9],
        true_track: state[10],
        vertical_rate: state[11],
        sensors: state[12],
        geo_altitude: state[13],
        squawk: state[14],
        spi: state[15] || false,
        position_source: state[16] || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch aircraft states:', error);
      return [];
    }
  }

  async getStatesInBounds(bounds: MapBounds): Promise<Aircraft[]> {
    const params = new URLSearchParams({
      lamin: bounds.south.toString(),
      lomin: bounds.west.toString(),
      lamax: bounds.north.toString(),
      lomax: bounds.east.toString(),
    });

    try {
      const data = await this.makeRequest('/states/all', params);
      
      if (!data || !data.states) {
        return [];
      }

      return data.states.map((state: any[]): Aircraft => ({
        icao24: state[0] || '',
        callsign: state[1],
        origin_country: state[2] || '',
        time_position: state[3],
        last_contact: state[4] || 0,
        longitude: state[5],
        latitude: state[6],
        baro_altitude: state[7],
        on_ground: state[8] || false,
        velocity: state[9],
        true_track: state[10],
        vertical_rate: state[11],
        sensors: state[12],
        geo_altitude: state[13],
        squawk: state[14],
        spi: state[15] || false,
        position_source: state[16] || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch aircraft states in bounds:', error);
      return [];
    }
  }

  async getAircraftByIcao(icao24: string): Promise<Aircraft | null> {
    const params = new URLSearchParams({
      icao24: icao24.toLowerCase(),
    });

    try {
      const data = await this.makeRequest('/states/all', params);
      
      if (!data || !data.states || data.states.length === 0) {
        return null;
      }

      const state = data.states[0];
      return {
        icao24: state[0] || '',
        callsign: state[1],
        origin_country: state[2] || '',
        time_position: state[3],
        last_contact: state[4] || 0,
        longitude: state[5],
        latitude: state[6],
        baro_altitude: state[7],
        on_ground: state[8] || false,
        velocity: state[9],
        true_track: state[10],
        vertical_rate: state[11],
        sensors: state[12],
        geo_altitude: state[13],
        squawk: state[14],
        spi: state[15] || false,
        position_source: state[16] || 0,
      };
    } catch (error) {
      console.error('Failed to fetch aircraft by ICAO:', error);
      return null;
    }
  }
}
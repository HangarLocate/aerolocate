import { Icon } from 'leaflet';

interface CachedIcon {
  icon: Icon;
  lastUsed: number;
}

class AircraftIconCache {
  private static instance: AircraftIconCache;
  private cache = new Map<string, CachedIcon>();
  private readonly MAX_CACHE_SIZE = 72; // 36 directions * 2 (with/without selected state)
  private readonly HEADING_STEP = 10; // Cache every 10 degrees
  
  static getInstance(): AircraftIconCache {
    if (!AircraftIconCache.instance) {
      AircraftIconCache.instance = new AircraftIconCache();
    }
    return AircraftIconCache.instance;
  }

  private generateSVG(rotation: number, isSelected: boolean = false): string {
    const fillColor = isSelected ? '#ef4444' : '#0969da'; // Red for selected, blue for normal
    const strokeWidth = isSelected ? '2' : '1';
    
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${rotation} 12 12)">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
                fill="${fillColor}" 
                stroke="#ffffff" 
                stroke-width="${strokeWidth}"/>
        </g>
      </svg>
    `;
  }

  private createIcon(rotation: number, isSelected: boolean = false): Icon {
    const svg = this.generateSVG(rotation, isSelected);
    const iconSize = isSelected ? [28, 28] : [24, 24];
    const iconAnchor = isSelected ? [14, 14] : [12, 12];
    
    return new Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
      iconSize,
      iconAnchor,
      popupAnchor: [0, isSelected ? -14 : -12],
    });
  }

  private normalizeHeading(heading: number | null | undefined): number {
    if (heading === null || heading === undefined) return 0;
    
    // Normalize to 0-360 and round to nearest step
    const normalized = ((heading % 360) + 360) % 360;
    return Math.round(normalized / this.HEADING_STEP) * this.HEADING_STEP;
  }

  private evictLRU(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      if (cached.lastUsed < oldestTime) {
        oldestTime = cached.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getIcon(heading: number | null | undefined, isSelected: boolean = false): Icon {
    const normalizedHeading = this.normalizeHeading(heading);
    const cacheKey = `${normalizedHeading}-${isSelected}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.icon;
    }

    // Create new icon
    const rotation = normalizedHeading - 90; // Adjust for icon orientation
    const icon = this.createIcon(rotation, isSelected);

    // Add to cache
    this.evictLRU();
    this.cache.set(cacheKey, {
      icon,
      lastUsed: Date.now(),
    });

    return icon;
  }

  // Pre-warm cache with common headings
  preWarmCache(): void {
    const commonHeadings = [0, 45, 90, 135, 180, 225, 270, 315]; // 8 cardinal directions
    
    commonHeadings.forEach(heading => {
      this.getIcon(heading, false);
      this.getIcon(heading, true);
    });
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries: Array.from(this.cache.keys()),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const aircraftIconCache = AircraftIconCache.getInstance();

// Pre-warm the cache on module load
aircraftIconCache.preWarmCache();
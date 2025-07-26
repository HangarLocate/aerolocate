'use client';

import { Plane, Search, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh?: () => void;
  isLoading?: boolean;
  lastUpdated?: Date | null;
}

export default function Header({ onRefresh, isLoading, lastUpdated }: HeaderProps) {
  const formatLastUpdated = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <header className="bg-card border-b border-border-muted shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-accent rounded-md">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">AeroLocate</h1>
              <p className="text-xs text-foreground/60">Real-time Flight Tracking</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Search flights, airports, or aircraft..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-foreground/60">
                {isLoading ? 'Updating...' : 'Last updated'}
              </div>
              <div className="text-xs font-medium text-foreground">
                {isLoading ? 'Fetching live data' : formatLastUpdated(lastUpdated)}
              </div>
            </div>
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center justify-center w-8 h-8 bg-muted hover:bg-border-muted rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-foreground/70 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
# ✈️ AeroLocate

**Real-time Flight Tracking with GitHub-Style UI**

AeroLocate is a modern, real-time flight tracking web application built with Next.js, Leaflet, and the OpenSky Network API. Featuring a clean, minimal GitHub-inspired design with white backgrounds, soft shadows, and responsive layouts.

## 🚀 Features

### ✅ Phase 1 Complete
- 🗺️ **Interactive Leaflet Map** - Global flight tracking with smooth pan/zoom
- ✈️ **Live Aircraft Markers** - Real-time aircraft positions with custom icons
- 📊 **Flight Popups** - Detailed aircraft info on click (altitude, speed, heading)
- 🔄 **Auto-refresh** - Real-time updates every 30 seconds
- 🎨 **GitHub-Style UI** - Clean, minimal design with Tailwind CSS
- 📱 **Responsive Layout** - Mobile-first design that works everywhere
- ⚡ **Performance Optimized** - Lazy loading, efficient API calls

### 🚧 Coming Soon (Phase 2-5)
- 🔍 Search flights by tail number, airline, route, airport
- 📋 Flight detail drawer with comprehensive information
- 🏙️ Airport directory with interactive map
- 🎛️ Advanced filters (airline, aircraft type, altitude, speed)
- 🔐 User authentication and saved flights
- 🕓 Flight history and playback
- ☁️ Weather overlay integration
- 🌙 Dark mode toggle

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom GitHub design tokens
- **Map**: Leaflet.js with react-leaflet
- **Data**: OpenSky Network API (live ADS-B data)
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## 🏃 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HangarLocate/aerolocate.git
   cd aerolocate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                  # Next.js app router
│   ├── globals.css      # Global styles + Tailwind config
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   ├── map/
│   │   └── FlightMap.tsx    # Main map component
│   ├── search/              # Search components (coming soon)
│   ├── flight/              # Flight detail components (coming soon)
│   └── ui/
│       └── Header.tsx       # Top navigation
├── hooks/
│   └── useFlightData.ts     # Flight data fetching hook
├── lib/
│   ├── opensky.ts          # OpenSky API client
│   └── mockData.ts         # Test data
├── types/
│   └── index.ts            # TypeScript interfaces
└── utils/                  # Utility functions (coming soon)
```

## 🌐 API Integration

### OpenSky Network API
- **Endpoint**: `https://opensky-network.org/api/states/all`
- **Rate Limit**: 400 requests/day (free tier)
- **Data**: Live ADS-B aircraft positions, altitude, speed, heading
- **Coverage**: Global aircraft tracking

### OurAirports.com (Planned)
- **Endpoint**: `https://ourairports.com/data/`
- **Data**: Airport information, runways, frequencies
- **Format**: CSV/JSON exports

## 🎨 Design System

AeroLocate uses a custom GitHub-inspired design system built with Tailwind CSS:

### Color Palette
- **Background**: `#ffffff` (light) / `#0d1117` (dark)
- **Foreground**: `#1f2328` (light) / `#f0f6fc` (dark)
- **Accent**: `#0969da` (GitHub blue)
- **Border**: `#d0d7de` (light) / `#30363d` (dark)
- **Muted**: `#f6f8fa` (light) / `#161b22` (dark)

### Typography
- **Sans**: `-apple-system, BlinkMacSystemFont, "Segoe UI", ...`
- **Mono**: `ui-monospace, SFMono-Regular, "SF Mono", ...`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main
3. Environment variables are handled via Vercel dashboard

### Manual Deployment
```bash
npm run build
npm start
```

## 📊 Performance

- **Lighthouse Score**: 95+ (target)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Bundle Size**: <500KB (gzipped)

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables
```bash
# Create .env.local for local development
NEXT_PUBLIC_APP_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenSky Network](https://opensky-network.org/) for free ADS-B data
- [OurAirports](https://ourairports.com/) for comprehensive airport data
- [Leaflet](https://leafletjs.com/) for excellent mapping library
- [GitHub](https://github.com/) for design inspiration

---

**Built with ❤️ using Next.js and real-time flight data**

[🔗 Live Demo](https://aerolocate.vercel.app) | [📊 GitHub](https://github.com/HangarLocate/aerolocate) | [🐛 Issues](https://github.com/HangarLocate/aerolocate/issues)

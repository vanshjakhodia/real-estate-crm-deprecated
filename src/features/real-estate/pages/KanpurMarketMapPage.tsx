import React, { useState, useEffect, useRef } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  KANPUR_LOCALITIES,
  KANPUR_INFRASTRUCTURE,
  KANPUR_METRO_STATIONS,
  KanpurLocality,
  calculateKanpurStampDuty
} from '../lib/kanpurMarketData';
import {
  MapPin,
  TrendingUp,
  Percent,
  Compass,
  Building,
  ExternalLink,
  ShieldCheck,
  Calculator,
  Train,
  Plane,
  ChevronRight,
  Info,
  CheckCircle2,
  Sparkles,
  Layers,
  Maximize2,
  RotateCcw
} from 'lucide-react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface KanpurMarketMapPageProps {
  onBack?: () => void;
}

export const KanpurMarketMapPage: React.FC<KanpurMarketMapPageProps> = () => {
  const { properties } = useCrm();

  const [selectedLocality, setSelectedLocality] = useState<KanpurLocality>(() => {
    const firstLocality = KANPUR_LOCALITIES[0];
    if (!firstLocality) throw new Error("Kanpur locality data is not available.");
    return firstLocality;
  });
  const [filterTag, setFilterTag] = useState<string>('all');
  const [mapTileStyle, setMapTileStyle] = useState<'dark' | 'streets' | 'satellite'>('dark');

  // Calculator State
  const [calcArea, setCalcArea] = useState<number>(1450);
  const [calcGender, setCalcGender] = useState<'male' | 'female' | 'joint'>('male');
  const [mapLoadError, setMapLoadError] = useState(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const tileLayerRef = useRef<Leaflet.TileLayer | null>(null);
  const markersRef = useRef<Record<string, Leaflet.Marker>>({});
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  // Filtered localities
  const filteredLocalities = KANPUR_LOCALITIES.filter((loc) => {
    if (filterTag === 'all') return true;
    if (filterTag === 'luxury') return loc.tags.some((t) => t.toLowerCase().includes('luxury'));
    if (filterTag === 'yield') return loc.tags.some((t) => t.toLowerCase().includes('yield'));
    if (filterTag === 'growth') return loc.tags.some((t) => t.toLowerCase().includes('growth') || t.toLowerCase().includes('airport'));
    return true;
  });

  const getLocalityPortfolioCount = (locName: string) => {
    return properties.filter((p) =>
      p.location.toLowerCase().includes(locName.toLowerCase()) ||
      locName.toLowerCase().includes(p.location.toLowerCase())
    ).length;
  };

  const getLocalityProperties = (locName: string) => {
    return properties.filter((p) =>
      p.location.toLowerCase().includes(locName.toLowerCase()) ||
      locName.toLowerCase().includes(p.location.toLowerCase())
    );
  };

  // Stamp duty calculation for current selection
  const estimatedMarketValuation = Math.round(selectedLocality.avgPricePerSqFt * calcArea);
  const stampDutyResults = calculateKanpurStampDuty(estimatedMarketValuation, calcGender);

  const formatLakhCr = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} Lakhs`;
  };

  // Tile layer URLs
  const getTileConfig = (style: 'dark' | 'streets' | 'satellite') => {
    if (style === 'streets') {
      return {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors'
      };
    }
    if (style === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP and the GIS User Community'
      };
    }
    // Dark luxury: Esri World Dark Gray Canvas (100% Free, No API key, No watermark)
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, OpenStreetMap contributors'
    };
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let active = true;
    void import('leaflet').then((L) => {
      if (!active || !mapContainerRef.current || mapInstanceRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        center: [26.472, 80.325],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      const tileConfig = getTileConfig('dark');
      const tileLayer = L.tileLayer(tileConfig.url, {
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Add Kanpur Metro Orange Line Polyline
      const metroCoords: [number, number][] = KANPUR_METRO_STATIONS.map((s) => [s.lat, s.lng]);
      const metroLine = L.polyline(metroCoords, {
        color: 'var(--metro)',
        weight: 4,
        opacity: 0.85,
        dashArray: '4, 4'
      }).addTo(map);

      metroLine.bindTooltip('Kanpur Metro Orange Line (Corridor 1: IIT Kanpur to Central)', {
        sticky: true,
        className: 'font-mono text-xs'
      });

      // Add Metro Station Dot Markers
      KANPUR_METRO_STATIONS.forEach((station) => {
        const dotIcon = L.divIcon({
          className: 'custom-metro-dot',
          html: `<div style="background-color: var(--metro); width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--foreground); box-shadow: 0 0 6px color-mix(in oklch, var(--metro) 80%, transparent);"></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4]
        });

        L.marker([station.lat, station.lng], { icon: dotIcon })
          .addTo(map)
          .bindTooltip(`Station: ${station.name}`, { direction: 'top', className: 'text-[10px] font-sans' });
      });

      // Add Ganges River approximate course line
      const gangaRiverCoords: [number, number][] = [
        [26.525, 80.270],
        [26.515, 80.300],
        [26.505, 80.340], // Ganga Barrage
        [26.485, 80.360], // Civil Lines VIP ghats
        [26.465, 80.385],
        [26.440, 80.410]
      ];
      L.polyline(gangaRiverCoords, {
        color: 'var(--river)',
        weight: 6,
        opacity: 0.45
      }).addTo(map).bindTooltip('River Ganges (Ganga Barrage Corridor)', { sticky: true });

      // Add Locality Markers
      KANPUR_LOCALITIES.forEach((loc) => {
        const portfolioCount = getLocalityPortfolioCount(loc.name);
        const isSelected = loc.id === selectedLocality.id;

        const customIcon = L.divIcon({
          className: `custom-locality-marker loc-marker-${loc.id}`,
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background-color: ${isSelected ? 'var(--primary)' : 'var(--surface)'};
              color: ${isSelected ? 'var(--ink)' : 'var(--foreground)'};
              border: 1.5px solid ${portfolioCount > 0 ? 'var(--forest)' : 'var(--primary)'};
              border-radius: 6px;
              padding: 3px 8px;
              font-family: serif;
              font-weight: 700;
              font-size: 11px;
              white-space: nowrap;
              box-shadow: 0 4px 14px color-mix(in oklch, var(--ink) 60%, transparent);
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${portfolioCount > 0 ? 'var(--forest)' : 'var(--primary)'};"></span>
              <span>${loc.name}</span>
              <span style="font-family: monospace; font-size: 9px; opacity: 0.85; margin-left: 2px;">₹${(loc.avgPricePerSqFt / 1000).toFixed(1)}k</span>
            </div>
          `,
          iconSize: [120, 26],
          iconAnchor: [60, 13]
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedLocality(loc);
        });

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: var(--foreground); padding: 4px 2px; min-width: 175px;">
            <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; font-weight: 700; color: var(--foreground); line-height: 1.2;">${loc.name}</div>
            <div style="font-size: 11px; color: var(--muted-foreground); margin-top: 2px;">${loc.zone}</div>
            <div style="margin-top: 6px; font-weight: 700; color: var(--primary); font-size: 14px;">
              ₹${loc.avgPricePerSqFt.toLocaleString('en-IN')} / sq.ft
            </div>
            <div style="font-size: 10px; color: var(--muted-foreground); margin-top: 2px;">Circle Rate: ${loc.circleRateSqM}</div>
            <div style="font-size: 11px; color: var(--forest); font-weight: 600; margin-top: 4px;">3-Yr Growth: ${loc.threeYearGrowth}</div>
            ${portfolioCount > 0 ? `<div style="font-size: 11px; color: var(--primary); font-weight: 600; margin-top: 6px; border-top: 1px solid var(--metal); padding-top: 4px;">★ ${portfolioCount} Active Estate(s)</div>` : ''}
          </div>
        `);

        markersRef.current[loc.id] = marker;
      });

      // Invalidate size once rendered in DOM
      window.setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }).catch(() => {
      if (active) setMapLoadError(true);
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersRef.current = {};
      }
      leafletRef.current = null;
    };
  }, []);

  // Handle Tile Style Change
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    const currentLayer = tileLayerRef.current;
    if (!L || !map || !currentLayer) return;

    const tileConfig = getTileConfig(mapTileStyle);
    map.removeLayer(currentLayer);

    const newTileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapTileStyle]);

  // Handle selected locality camera fly-to and marker highlight
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocality) return;

    mapInstanceRef.current.flyTo([selectedLocality.lat, selectedLocality.lng], 14, {
      duration: 1.0,
      easeLinearity: 0.25
    });

    const marker = markersRef.current[selectedLocality.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedLocality]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([26.472, 80.325], 12, { duration: 0.8 });
    }
  };

  return (
    <div className="space-y-8">
      {mapLoadError ? <p className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground" role="alert">The market map could not be loaded.</p> : null}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-primary bg-secondary px-2.5 py-1 rounded border border-border">
              Geographic GIS Engine • Kanpur Nagar
            </span>
            <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-forest/15 animate-pulse"></span>
              Live IGRS UP Valuation Data
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            Kanpur Real Estate Market Intelligence Map
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Live interactive satellite and street GIS mapping of Kanpur's prime residential and commercial micro-markets,
            metro transit corridors and official circle rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://igrsup.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-sidebar px-3.5 py-2 text-xs text-secondary-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <span>Official UP Circle Rate Portal</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Map Controls & Corridor Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Locality Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-muted-foreground font-mono text-[11px] mr-1 uppercase">Filter Corridor:</span>
          <button
            onClick={() => setFilterTag('all')}
            className={`rounded-lg px-3 py-1.5 transition-all font-medium ${
              filterTag === 'all'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'border border-border bg-sidebar text-muted-foreground hover:text-foreground'
            }`}
          >
            All Enclaves ({KANPUR_LOCALITIES.length})
          </button>
          <button
            onClick={() => setFilterTag('luxury')}
            className={`rounded-lg px-3 py-1.5 transition-all font-medium ${
              filterTag === 'luxury'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'border border-border bg-sidebar text-muted-foreground hover:text-foreground'
            }`}
          >
            Luxury & Riverfront
          </button>
          <button
            onClick={() => setFilterTag('yield')}
            className={`rounded-lg px-3 py-1.5 transition-all font-medium ${
              filterTag === 'yield'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'border border-border bg-sidebar text-muted-foreground hover:text-foreground'
            }`}
          >
            High-Yield Rental Hubs
          </button>
          <button
            onClick={() => setFilterTag('growth')}
            className={`rounded-lg px-3 py-1.5 transition-all font-medium ${
              filterTag === 'growth'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'border border-border bg-sidebar text-muted-foreground hover:text-foreground'
            }`}
          >
            Metro & Airport Corridors
          </button>
        </div>

        {/* Map Tile Layer Selector */}
        <div className="flex items-center gap-1.5 bg-sidebar border border-border p-1 rounded-lg shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground px-2 flex items-center gap-1">
            <Layers className="h-3 w-3 text-primary" />
            Layer:
          </span>
          <button
            onClick={() => setMapTileStyle('dark')}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
              mapTileStyle === 'dark'
                ? 'bg-primary text-primary-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dark Luxury
          </button>
          <button
            onClick={() => setMapTileStyle('satellite')}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
              mapTileStyle === 'satellite'
                ? 'bg-primary text-primary-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Satellite Aerial
          </button>
          <button
            onClick={() => setMapTileStyle('streets')}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
              mapTileStyle === 'streets'
                ? 'bg-primary text-primary-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Civic Street Grid
          </button>
        </div>
      </div>

      {/* Main Spatial Map & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real Leaflet Map Container (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-border bg-sidebar p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              <h3 className="font-serif font-bold text-sm text-foreground">
                Interactive Geographic GIS Map
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-card"></span>
                Ganges River
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-card"></span>
                Metro Orange Line
              </span>
              <button
                onClick={handleResetView}
                className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-secondary text-primary hover:text-foreground transition-colors"
                title="Reset Map to Full Kanpur Overview"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset View</span>
              </button>
            </div>
          </div>

          {/* Leaflet DOM Node */}
          <div className="relative mt-3 w-full h-[460px] rounded-lg border border-border overflow-hidden z-10">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Quick Locality Selector Pills below Map */}
          <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredLocalities.map((loc) => {
              const isSelected = selectedLocality.id === loc.id;
              const count = getLocalityPortfolioCount(loc.name);
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocality(loc)}
                  className={`text-left rounded-lg p-2 border transition-all text-xs ${
                    isSelected
                      ? 'border-primary bg-secondary text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  <div className="font-serif font-bold truncate flex items-center justify-between">
                    <span>{loc.name}</span>
                    {count > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-forest/15"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    ₹{loc.avgPricePerSqFt.toLocaleString('en-IN')}/sqft
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Locality Dossier (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-border bg-sidebar p-6 shadow-xl space-y-5">
          {/* Header of Dossier */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary bg-secondary px-2.5 py-0.5 rounded border border-border">
                {selectedLocality.zone}
              </span>
              <span className="font-mono text-xs badge-forest px-2 py-0.5 rounded">
                {selectedLocality.yoyAppreciation} YoY Growth
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mt-2">
              {selectedLocality.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{selectedLocality.dominantType}</p>
          </div>

          {/* Key Rates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                Market Rate Band
              </div>
              <div className="font-serif font-bold text-base text-foreground mt-1">
                ₹{selectedLocality.priceRangeMin.toLocaleString('en-IN')} – ₹{selectedLocality.priceRangeMax.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                Avg: ₹{selectedLocality.avgPricePerSqFt.toLocaleString('en-IN')} / sq.ft
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-forest" />
                Official Circle Rate
              </div>
              <div className="font-serif font-bold text-sm text-foreground mt-1 truncate">
                {selectedLocality.circleRateSqM}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                Approx: {selectedLocality.circleRateSqFtApprox}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                3-Year Appreciation
              </div>
              <div className="font-serif font-bold text-base text-forest mt-1">
                {selectedLocality.threeYearGrowth}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                Verified Kanpur Index
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                Gross Rental Yield
              </div>
              <div className="font-serif font-bold text-base text-primary mt-1">
                {selectedLocality.rentalYield}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                Annualized rental return
              </div>
            </div>
          </div>

          {/* Locality Overview */}
          <div className="text-xs text-secondary-foreground leading-relaxed border-t border-border pt-4">
            {selectedLocality.overview}
          </div>

          {/* Key Infrastructure & Highlights */}
          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="font-serif font-bold text-xs text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Micro-Market Catalysts & Connectivity
            </h4>
            <div className="space-y-1.5">
              {selectedLocality.keyHighlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-forest shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Real Estate Portfolio Overlay */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif font-bold text-xs text-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-primary" />
                Your Registered Portfolio in {selectedLocality.name}
              </h4>
              <span className="font-mono text-[10px] text-muted-foreground">
                {getLocalityPortfolioCount(selectedLocality.name)} listed
              </span>
            </div>

            {getLocalityPortfolioCount(selectedLocality.name) > 0 ? (
              <div className="space-y-2">
                {getLocalityProperties(selectedLocality.name).map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 text-xs"
                  >
                    <div>
                      <div className="font-medium text-foreground">{prop.project_name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {prop.bhk || 'Residential'} • {prop.carpet_area ? `${prop.carpet_area} sq.ft` : ''} • RERA: {prop.rera_number || 'Under Filing'}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-primary">
                      ₹{(prop.price_min / 100000).toFixed(0)}L – ₹{(prop.price_max / 100000).toFixed(0)}L
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-background p-3 text-center text-xs text-muted-foreground">
                0 active projects currently listed in {selectedLocality.name}. Add an estate in Estate Portfolio to track your inventory against market rates.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Valuation & Government Stamp Duty Estimator */}
      <div className="rounded-xl border border-border bg-sidebar p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary border border-border">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-foreground">
                Kanpur Property Valuation & UP Stamp Duty Calculator
              </h3>
              <p className="text-xs text-muted-foreground">
                Official Uttar Pradesh Stamp & Registration Department valuation rules for Kanpur Nagar
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-primary">
            Locality: <span className="font-bold text-foreground">{selectedLocality.name}</span> (₹{selectedLocality.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Controls */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-secondary-foreground flex items-center justify-between">
                <span>Super Built-up / Carpet Area (sq.ft)</span>
                <span className="font-mono text-primary font-bold">{calcArea} sq.ft</span>
              </label>
              <input
                type="range"
                min="400"
                max="6000"
                step="50"
                value={calcArea}
                onChange={(e) => setCalcArea(Number(e.target.value))}
                className="mt-2 w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
                <span>400 sq.ft (1 BHK)</span>
                <span>1,500 sq.ft (3 BHK)</span>
                <span>6,000 sq.ft (Villa)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-secondary-foreground">Buyer Registration Category (UP Rules)</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => setCalcGender('male')}
                  className={`rounded-lg p-2.5 text-xs text-center border transition-all ${
                    calcGender === 'male'
                      ? 'border-primary bg-secondary text-foreground font-semibold'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  <div>Male Buyer</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">7% Stamp + 1% Reg</div>
                </button>
                <button
                  onClick={() => setCalcGender('female')}
                  className={`rounded-lg p-2.5 text-xs text-center border transition-all ${
                    calcGender === 'female'
                      ? 'border-primary bg-secondary text-foreground font-semibold'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  <div>Female Buyer</div>
                  <div className="text-[10px] font-mono text-forest mt-0.5">6% Stamp + 1% Reg</div>
                </button>
                <button
                  onClick={() => setCalcGender('joint')}
                  className={`rounded-lg p-2.5 text-xs text-center border transition-all ${
                    calcGender === 'joint'
                      ? 'border-primary bg-secondary text-foreground font-semibold'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  <div>Joint Ownership</div>
                  <div className="text-[10px] font-mono text-primary mt-0.5">6.5% Stamp + 1% Reg</div>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground bg-background p-3 rounded-lg border border-border flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Under UP Stamp Act, women buyers receive a 1% concession on stamp duty (6% vs 7%) for property values up to ₹10 Lakhs. Registration charges are fixed at 1% across Kanpur SRO jurisdictions.
              </span>
            </div>
          </div>

          {/* Results Summary */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background p-5 rounded-lg border border-border">
            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                Estimated Market Valuation
              </div>
              <div className="font-serif text-2xl font-bold text-foreground mt-1">
                {formatLakhCr(estimatedMarketValuation)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Based on {calcArea} sq.ft @ ₹{selectedLocality.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                Total All-Inclusive Investment
              </div>
              <div className="font-serif text-2xl font-bold text-primary mt-1">
                {formatLakhCr(stampDutyResults.effectiveTotal)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Property Price + Total UP Government Fees
              </div>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-border space-y-2 text-xs">
              <div className="flex items-center justify-between text-secondary-foreground">
                <span>UP Stamp Duty ({stampDutyResults.stampDutyRate}%):</span>
                <span className="font-mono font-semibold text-foreground">
                  ₹{stampDutyResults.stampDutyAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-secondary-foreground">
                <span>Registration Fee ({stampDutyResults.registrationRate}%):</span>
                <span className="font-mono font-semibold text-foreground">
                  ₹{stampDutyResults.registrationAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-forest font-semibold pt-1 border-t border-border">
                <span>Total Statutory Government Outlay:</span>
                <span className="font-mono">
                  ₹{stampDutyResults.totalGovtFees.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Kanpur Infrastructure & Growth Trackers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Train className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-bold text-lg text-foreground">
              Verified Infrastructure & Expansion Timeline
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Active Multi-Modal Projects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {KANPUR_INFRASTRUCTURE.map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-sidebar p-5 shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary bg-secondary px-2 py-0.5 rounded border border-border">
                    {proj.category}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                      proj.status === 'Operational'
                        ? 'badge-forest'
                        : 'badge-gold'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-sm text-foreground mt-3">
                  {proj.name}
                </h4>

                <div className="text-[11px] font-mono text-primary mt-1">
                  {proj.investment}
                </div>

                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
                  {proj.details}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border text-[10px] font-mono text-muted-foreground">
                Impact Zone: <span className="text-secondary-foreground">{proj.impactArea}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

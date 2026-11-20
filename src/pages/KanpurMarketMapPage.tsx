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
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface KanpurMarketMapPageProps {
  onBack?: () => void;
}

export const KanpurMarketMapPage: React.FC<KanpurMarketMapPageProps> = () => {
  const { properties } = useCrm();

  const [selectedLocality, setSelectedLocality] = useState<KanpurLocality>(KANPUR_LOCALITIES[0]);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [mapTileStyle, setMapTileStyle] = useState<'dark' | 'streets' | 'satellite'>('dark');

  // Calculator State
  const [calcArea, setCalcArea] = useState<number>(1450);
  const [calcGender, setCalcGender] = useState<'male' | 'female' | 'joint'>('male');

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

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
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
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
        color: '#EA580C',
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
          html: `<div style="background-color: #EA580C; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #FFFFFF; box-shadow: 0 0 6px rgba(234,88,12,0.8);"></div>`,
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
        color: '#38BDF8',
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
              background-color: ${isSelected ? '#C2A675' : '#1A1814'};
              color: ${isSelected ? '#11100E' : '#F4EFE6'};
              border: 1.5px solid ${portfolioCount > 0 ? '#9DBFA5' : '#C2A675'};
              border-radius: 6px;
              padding: 3px 8px;
              font-family: serif;
              font-weight: 700;
              font-size: 11px;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(0,0,0,0.6);
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${portfolioCount > 0 ? '#9DBFA5' : '#C2A675'};"></span>
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
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: #F4EFE6; padding: 4px 2px; min-width: 175px;">
            <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; font-weight: 700; color: #F4EFE6; line-height: 1.2;">${loc.name}</div>
            <div style="font-size: 11px; color: #A8A194; margin-top: 2px;">${loc.zone}</div>
            <div style="margin-top: 6px; font-weight: 700; color: #C2A675; font-size: 14px;">
              ₹${loc.avgPricePerSqFt.toLocaleString('en-IN')} / sq.ft
            </div>
            <div style="font-size: 10px; color: #8C8477; margin-top: 2px;">Circle Rate: ${loc.circleRateSqM}</div>
            <div style="font-size: 11px; color: #4ADE80; font-weight: 600; margin-top: 4px;">3-Yr Growth: ${loc.threeYearGrowth}</div>
            ${portfolioCount > 0 ? `<div style="font-size: 11px; color: #C2A675; font-weight: 600; margin-top: 6px; border-top: 1px solid #332B1E; padding-top: 4px;">★ ${portfolioCount} Active Estate(s)</div>` : ''}
          </div>
        `);

        markersRef.current[loc.id] = marker;
      });

      // Invalidate size once rendered in DOM
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // Handle Tile Style Change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const tileConfig = getTileConfig(mapTileStyle);
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const newTileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C2720] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#C2A675] bg-[#221F1A] px-2.5 py-1 rounded border border-[#383126]">
              Geographic GIS Engine • Kanpur Nagar
            </span>
            <span className="font-mono text-[10px] text-[#8C8477] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9DBFA5] animate-pulse"></span>
              Live IGRS UP Valuation Data
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#F4EFE6] mt-2">
            Kanpur Real Estate Market Intelligence Map
          </h1>
          <p className="text-xs text-[#A8A194] mt-1 max-w-3xl">
            Live interactive satellite and street GIS mapping of Kanpur's prime residential and commercial micro-markets,
            metro transit corridors, and official circle rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://igrsup.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[#383126] bg-[#161411] px-3.5 py-2 text-xs text-[#C8C2B5] hover:text-[#C2A675] hover:border-[#C2A675] transition-colors"
          >
            <span>Official UP Circle Rate Portal</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#8C8477]" />
          </a>
        </div>
      </div>

      {/* Map Controls & Corridor Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Locality Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[#8C8477] font-mono text-[11px] mr-1 uppercase">Filter Corridor:</span>
          <button
            onClick={() => setFilterTag('all')}
            className={`rounded-lg px-3 py-1.5 transition-all font-medium ${
              filterTag === 'all'
                ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                : 'border border-[#332D24] bg-[#161411] text-[#A8A194] hover:text-[#EAE5D9]'
            }`}
          >
            All Enclaves ({KANPUR_LOCALITIES.length})
          </button>
          <button
            onClick={() => setFilterTag('luxury')}
            className={`rounded-lg px-3 py-1.5 transition-all font-medium ${
              filterTag === 'luxury'
                ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                : 'border border-[#332D24] bg-[#161411] text-[#A8A194] hover:text-[#EAE5D9]'
            }`}
          >
            Luxury & Riverfront
          </button>
          <button
            onClick={() => setFilterTag('yield')}
            className={`rounded-lg px-3 py-1.5 transition-all font-medium ${
              filterTag === 'yield'
                ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                : 'border border-[#332D24] bg-[#161411] text-[#A8A194] hover:text-[#EAE5D9]'
            }`}
          >
            High-Yield Rental Hubs
          </button>
          <button
            onClick={() => setFilterTag('growth')}
            className={`rounded-lg px-3 py-1.5 transition-all font-medium ${
              filterTag === 'growth'
                ? 'bg-[#C2A675] text-[#11100E] font-semibold'
                : 'border border-[#332D24] bg-[#161411] text-[#A8A194] hover:text-[#EAE5D9]'
            }`}
          >
            Metro & Airport Corridors
          </button>
        </div>

        {/* Map Tile Layer Selector */}
        <div className="flex items-center gap-1.5 bg-[#161411] border border-[#332D24] p-1 rounded-lg shrink-0">
          <span className="text-[10px] font-mono text-[#8C8477] px-2 flex items-center gap-1">
            <Layers className="h-3 w-3 text-[#C2A675]" />
            Layer:
          </span>
          <button
            onClick={() => setMapTileStyle('dark')}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
              mapTileStyle === 'dark'
                ? 'bg-[#C2A675] text-[#11100E] font-bold'
                : 'text-[#A8A194] hover:text-[#F4EFE6]'
            }`}
          >
            Dark Luxury
          </button>
          <button
            onClick={() => setMapTileStyle('satellite')}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
              mapTileStyle === 'satellite'
                ? 'bg-[#C2A675] text-[#11100E] font-bold'
                : 'text-[#A8A194] hover:text-[#F4EFE6]'
            }`}
          >
            Satellite Aerial
          </button>
          <button
            onClick={() => setMapTileStyle('streets')}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
              mapTileStyle === 'streets'
                ? 'bg-[#C2A675] text-[#11100E] font-bold'
                : 'text-[#A8A194] hover:text-[#F4EFE6]'
            }`}
          >
            Civic Street Grid
          </button>
        </div>
      </div>

      {/* Main Spatial Map & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real Leaflet Map Container (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-[#332D24] bg-[#161411] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#2C2720]">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#C2A675]" />
              <h3 className="font-serif font-bold text-sm text-[#F4EFE6]">
                Interactive Geographic GIS Map
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#8C8477]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#38BDF8]"></span>
                Ganges River
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#EA580C]"></span>
                Metro Orange Line
              </span>
              <button
                onClick={handleResetView}
                className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#3E362A] bg-[#221F1A] text-[#C2A675] hover:text-[#F4EFE6] transition-colors"
                title="Reset Map to Full Kanpur Overview"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset View</span>
              </button>
            </div>
          </div>

          {/* Leaflet DOM Node */}
          <div className="relative mt-3 w-full h-[460px] rounded-lg border border-[#2C2720] overflow-hidden z-10">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Quick Locality Selector Pills below Map */}
          <div className="mt-4 pt-3 border-t border-[#26221B] grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredLocalities.map((loc) => {
              const isSelected = selectedLocality.id === loc.id;
              const count = getLocalityPortfolioCount(loc.name);
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocality(loc)}
                  className={`text-left rounded-lg p-2 border transition-all text-xs ${
                    isSelected
                      ? 'border-[#C2A675] bg-[#221F1A] text-[#F4EFE6]'
                      : 'border-[#2C2720] bg-[#11100E] text-[#A8A194] hover:border-[#3E362A] hover:text-[#EAE5D9]'
                  }`}
                >
                  <div className="font-serif font-bold truncate flex items-center justify-between">
                    <span>{loc.name}</span>
                    {count > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9DBFA5]"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8C8477] font-mono mt-0.5">
                    ₹{loc.avgPricePerSqFt.toLocaleString('en-IN')}/sqft
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Locality Dossier (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-[#332D24] bg-[#161411] p-6 shadow-xl space-y-5">
          {/* Header of Dossier */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C2A675] bg-[#221F1A] px-2.5 py-0.5 rounded border border-[#383126]">
                {selectedLocality.zone}
              </span>
              <span className="font-mono text-xs badge-forest px-2 py-0.5 rounded">
                {selectedLocality.yoyAppreciation} YoY Growth
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#F4EFE6] mt-2">
              {selectedLocality.name}
            </h2>
            <p className="text-xs text-[#8C8477] mt-1">{selectedLocality.dominantType}</p>
          </div>

          {/* Key Rates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#2C2720] bg-[#11100E] p-3">
              <div className="text-[10px] font-mono text-[#8C8477] uppercase flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-[#C2A675]" />
                Market Rate Band
              </div>
              <div className="font-serif font-bold text-base text-[#F4EFE6] mt-1">
                ₹{selectedLocality.priceRangeMin.toLocaleString('en-IN')} – ₹{selectedLocality.priceRangeMax.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-mono text-[#A8A194]">
                Avg: ₹{selectedLocality.avgPricePerSqFt.toLocaleString('en-IN')} / sq.ft
              </div>
            </div>

            <div className="rounded-lg border border-[#2C2720] bg-[#11100E] p-3">
              <div className="text-[10px] font-mono text-[#8C8477] uppercase flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-[#9DBFA5]" />
                Official Circle Rate
              </div>
              <div className="font-serif font-bold text-sm text-[#F4EFE6] mt-1 truncate">
                {selectedLocality.circleRateSqM}
              </div>
              <div className="text-[10px] font-mono text-[#A8A194]">
                Approx: {selectedLocality.circleRateSqFtApprox}
              </div>
            </div>

            <div className="rounded-lg border border-[#2C2720] bg-[#11100E] p-3">
              <div className="text-[10px] font-mono text-[#8C8477] uppercase">
                3-Year Appreciation
              </div>
              <div className="font-serif font-bold text-base text-[#9DBFA5] mt-1">
                {selectedLocality.threeYearGrowth}
              </div>
              <div className="text-[10px] font-mono text-[#736B5F]">
                Verified Kanpur Index
              </div>
            </div>

            <div className="rounded-lg border border-[#2C2720] bg-[#11100E] p-3">
              <div className="text-[10px] font-mono text-[#8C8477] uppercase">
                Gross Rental Yield
              </div>
              <div className="font-serif font-bold text-base text-[#C2A675] mt-1">
                {selectedLocality.rentalYield}
              </div>
              <div className="text-[10px] font-mono text-[#736B5F]">
                Annualized rental return
              </div>
            </div>
          </div>

          {/* Locality Overview */}
          <div className="text-xs text-[#C8C2B5] leading-relaxed border-t border-[#26221B] pt-4">
            {selectedLocality.overview}
          </div>

          {/* Key Infrastructure & Highlights */}
          <div className="space-y-2 border-t border-[#26221B] pt-4">
            <h4 className="font-serif font-bold text-xs text-[#EAE5D9] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C2A675]" />
              Micro-Market Catalysts & Connectivity
            </h4>
            <div className="space-y-1.5">
              {selectedLocality.keyHighlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-[#A8A194]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#9DBFA5] shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Real Estate Portfolio Overlay */}
          <div className="border-t border-[#26221B] pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif font-bold text-xs text-[#EAE5D9] flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-[#C2A675]" />
                Your Registered Portfolio in {selectedLocality.name}
              </h4>
              <span className="font-mono text-[10px] text-[#8C8477]">
                {getLocalityPortfolioCount(selectedLocality.name)} listed
              </span>
            </div>

            {getLocalityPortfolioCount(selectedLocality.name) > 0 ? (
              <div className="space-y-2">
                {getLocalityProperties(selectedLocality.name).map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between rounded-lg border border-[#383126] bg-[#11100E] p-2.5 text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#F4EFE6]">{prop.project_name}</div>
                      <div className="text-[10px] text-[#8C8477] font-mono">
                        {prop.bhk || 'Residential'} • {prop.carpet_area ? `${prop.carpet_area} sq.ft` : ''} • RERA: {prop.rera_number || 'Under Filing'}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-[#C2A675]">
                      ₹{(prop.price_min / 100000).toFixed(0)}L – ₹{(prop.price_max / 100000).toFixed(0)}L
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#2C2720] bg-[#11100E] p-3 text-center text-xs text-[#736B5F]">
                0 active projects currently listed in {selectedLocality.name}. Add an estate in Estate Portfolio to track your inventory against market rates.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Valuation & Government Stamp Duty Estimator */}
      <div className="rounded-xl border border-[#332D24] bg-[#161411] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C2720] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221F1A] text-[#C2A675] border border-[#383126]">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#F4EFE6]">
                Kanpur Property Valuation & UP Stamp Duty Calculator
              </h3>
              <p className="text-xs text-[#8C8477]">
                Official Uttar Pradesh Stamp & Registration Department valuation rules for Kanpur Nagar
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-[#C2A675]">
            Locality: <span className="font-bold text-[#F4EFE6]">{selectedLocality.name}</span> (₹{selectedLocality.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Controls */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-[#C8C2B5] flex items-center justify-between">
                <span>Super Built-up / Carpet Area (sq.ft)</span>
                <span className="font-mono text-[#C2A675] font-bold">{calcArea} sq.ft</span>
              </label>
              <input
                type="range"
                min="400"
                max="6000"
                step="50"
                value={calcArea}
                onChange={(e) => setCalcArea(Number(e.target.value))}
                className="mt-2 w-full accent-[#C2A675] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#736B5F] mt-1">
                <span>400 sq.ft (1 BHK)</span>
                <span>1,500 sq.ft (3 BHK)</span>
                <span>6,000 sq.ft (Villa)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#C8C2B5]">Buyer Registration Category (UP Rules)</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => setCalcGender('male')}
                  className={`rounded-lg p-2.5 text-xs text-center border transition-all ${
                    calcGender === 'male'
                      ? 'border-[#C2A675] bg-[#221F1A] text-[#F4EFE6] font-semibold'
                      : 'border-[#2C2720] bg-[#11100E] text-[#A8A194]'
                  }`}
                >
                  <div>Male Buyer</div>
                  <div className="text-[10px] font-mono text-[#8C8477] mt-0.5">7% Stamp + 1% Reg</div>
                </button>
                <button
                  onClick={() => setCalcGender('female')}
                  className={`rounded-lg p-2.5 text-xs text-center border transition-all ${
                    calcGender === 'female'
                      ? 'border-[#C2A675] bg-[#221F1A] text-[#F4EFE6] font-semibold'
                      : 'border-[#2C2720] bg-[#11100E] text-[#A8A194]'
                  }`}
                >
                  <div>Female Buyer</div>
                  <div className="text-[10px] font-mono text-[#9DBFA5] mt-0.5">6% Stamp + 1% Reg</div>
                </button>
                <button
                  onClick={() => setCalcGender('joint')}
                  className={`rounded-lg p-2.5 text-xs text-center border transition-all ${
                    calcGender === 'joint'
                      ? 'border-[#C2A675] bg-[#221F1A] text-[#F4EFE6] font-semibold'
                      : 'border-[#2C2720] bg-[#11100E] text-[#A8A194]'
                  }`}
                >
                  <div>Joint Ownership</div>
                  <div className="text-[10px] font-mono text-[#C2A675] mt-0.5">6.5% Stamp + 1% Reg</div>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-[#736B5F] bg-[#11100E] p-3 rounded-lg border border-[#26221B] flex items-start gap-2">
              <Info className="h-4 w-4 text-[#C2A675] shrink-0 mt-0.5" />
              <span>
                Under UP Stamp Act, women buyers receive a 1% concession on stamp duty (6% vs 7%) for property values up to ₹10 Lakhs. Registration charges are fixed at 1% across Kanpur SRO jurisdictions.
              </span>
            </div>
          </div>

          {/* Results Summary */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#11100E] p-5 rounded-lg border border-[#2C2720]">
            <div>
              <div className="text-[10px] font-mono text-[#8C8477] uppercase">
                Estimated Market Valuation
              </div>
              <div className="font-serif text-2xl font-bold text-[#F4EFE6] mt-1">
                {formatLakhCr(estimatedMarketValuation)}
              </div>
              <div className="text-[11px] text-[#A8A194] mt-0.5">
                Based on {calcArea} sq.ft @ ₹{selectedLocality.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-[#8C8477] uppercase">
                Total All-Inclusive Investment
              </div>
              <div className="font-serif text-2xl font-bold text-[#C2A675] mt-1">
                {formatLakhCr(stampDutyResults.effectiveTotal)}
              </div>
              <div className="text-[11px] text-[#A8A194] mt-0.5">
                Property Price + Total UP Government Fees
              </div>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-[#26221B] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#C8C2B5]">
                <span>UP Stamp Duty ({stampDutyResults.stampDutyRate}%):</span>
                <span className="font-mono font-semibold text-[#F4EFE6]">
                  ₹{stampDutyResults.stampDutyAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#C8C2B5]">
                <span>Registration Fee ({stampDutyResults.registrationRate}%):</span>
                <span className="font-mono font-semibold text-[#F4EFE6]">
                  ₹{stampDutyResults.registrationAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#9DBFA5] font-semibold pt-1 border-t border-[#26221B]">
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
            <Train className="h-4 w-4 text-[#C2A675]" />
            <h3 className="font-serif font-bold text-lg text-[#F4EFE6]">
              Verified Infrastructure & Expansion Timeline
            </h3>
          </div>
          <span className="text-xs font-mono text-[#8C8477]">
            Active Multi-Modal Projects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {KANPUR_INFRASTRUCTURE.map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col justify-between rounded-xl border border-[#332D24] bg-[#161411] p-5 shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#C2A675] bg-[#221F1A] px-2 py-0.5 rounded border border-[#383126]">
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

                <h4 className="font-serif font-bold text-sm text-[#F4EFE6] mt-3">
                  {proj.name}
                </h4>

                <div className="text-[11px] font-mono text-[#C2A675] mt-1">
                  {proj.investment}
                </div>

                <p className="text-xs text-[#A8A194] mt-2.5 leading-relaxed">
                  {proj.details}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#26221B] text-[10px] font-mono text-[#8C8477]">
                Impact Zone: <span className="text-[#C8C2B5]">{proj.impactArea}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

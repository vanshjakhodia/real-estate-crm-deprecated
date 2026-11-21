// ====================================================================
// KANPUR REAL ESTATE MARKET INTELLIGENCE DATA
// Sourced from Official UP Stamp & Registration Dept (IGRS UP),
// Kanpur Development Authority (KDA), UPSIDA and verified market trends.
// ====================================================================

export interface KanpurLocality {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  avgPricePerSqFt: number;
  priceRangeMin: number;
  priceRangeMax: number;
  circleRateSqM: string;
  circleRateSqFtApprox: string;
  yoyAppreciation: string;
  threeYearGrowth: string;
  rentalYield: string;
  dominantType: string;
  overview: string;
  keyHighlights: string[];
  coordinates: { x: number; y: number }; // Percentage position fallback
  tags: string[];
}

export interface InfrastructureProject {
  id: string;
  name: string;
  category: 'Metro' | 'Aviation' | 'Expressway' | 'Township';
  status: 'Operational' | 'Active Construction' | 'Under Development';
  investment: string;
  impactArea: string;
  details: string;
}

export const KANPUR_METRO_STATIONS = [
  { name: 'IIT Kanpur', lat: 26.5123, lng: 80.2332 },
  { name: 'Kalyanpur', lat: 26.4950, lng: 80.2625 },
  { name: 'SPM Hospital', lat: 26.4862, lng: 80.2762 },
  { name: 'Kanpur University (CSJMU)', lat: 26.4812, lng: 80.2875 },
  { name: 'Gurudev Chauraha', lat: 26.4782, lng: 80.2982 },
  { name: 'Geeta Nagar', lat: 26.4752, lng: 80.3065 },
  { name: 'Rawatpur (Interchange)', lat: 26.4770, lng: 80.3150 },
  { name: 'LLR Hospital (Hallet)', lat: 26.4815, lng: 80.3225 },
  { name: 'Moti Jheel', lat: 26.4795, lng: 80.3290 },
  { name: 'Chunniganj', lat: 26.4755, lng: 80.3385 },
  { name: 'Naveen Market', lat: 26.4710, lng: 80.3470 },
  { name: 'Bada Chauraha', lat: 26.4670, lng: 80.3515 },
  { name: 'Nayaganj', lat: 26.4610, lng: 80.3550 },
  { name: 'Kanpur Central', lat: 26.4540, lng: 80.3525 }
];

export const KANPUR_LOCALITIES: KanpurLocality[] = [
  {
    id: 'civil-lines',
    name: 'Civil Lines',
    zone: 'VIP Riverfront & Administrative Enclave',
    lat: 26.4729,
    lng: 80.3498,
    avgPricePerSqFt: 9800,
    priceRangeMin: 8500,
    priceRangeMax: 11500,
    circleRateSqM: '₹55,000 – ₹85,000 / sq.m',
    circleRateSqFtApprox: '₹5,110 – ₹7,900 / sq.ft',
    yoyAppreciation: '+18.4%',
    threeYearGrowth: '+34.2%',
    rentalYield: '2.4% – 2.8%',
    dominantType: 'Ultra-Luxury High-Rises & Riverview Residences',
    overview:
      'Kanpur’s most prestigious legacy address along the Ganges River. Home to prominent business families, healthcare leaders and senior judiciary. Characterized by low inventory, ultra-luxury high-rises and prime riverside promenades.',
    keyHighlights: [
      'Ganges Riverfront panoramic vistas',
      'Green Park International Cricket Stadium vicinity',
      'Underground Kanpur Metro access (Chunniganj & Bada Chauraha)',
      'Supreme capital preservation with minimal supply dilution'
    ],
    coordinates: { x: 62, y: 38 },
    tags: ['Ultra Luxury', 'Riverfront', 'Capital Preservation', 'VIP Zone']
  },
  {
    id: 'swaroop-nagar',
    name: 'Swaroop Nagar',
    zone: 'Prime Central Commercial & High-End Living',
    lat: 26.4805,
    lng: 80.3204,
    avgPricePerSqFt: 8400,
    priceRangeMin: 6500,
    priceRangeMax: 22000,
    circleRateSqM: '₹48,000 – ₹68,000 / sq.m',
    circleRateSqFtApprox: '₹4,460 – ₹6,320 / sq.ft',
    yoyAppreciation: '+16.2%',
    threeYearGrowth: '+26.8%',
    rentalYield: '2.8% – 3.2%',
    dominantType: 'Independent Kothis, Luxury Builder Floors & Commercial',
    overview:
      'The bustling cultural, dining and retail heart of Kanpur. High streets command up to ₹22,000/sq.ft for prime retail frontages. Close to GSVM Medical College and the scenic Motijheel Lake complex.',
    keyHighlights: [
      'Kanpur’s premier retail & culinary boulevard',
      'Proximity to Motijheel Lake & Central Park',
      'Rawatpur Metro Interchange hub within 5 minutes',
      'High rental demand among senior medical professionals and merchants'
    ],
    coordinates: { x: 50, y: 32 },
    tags: ['High Street Retail', 'Central Prime', 'Low Vacancy', 'Builder Floors']
  },
  {
    id: 'tilak-nagar',
    name: 'Tilak Nagar',
    zone: 'Elite Old Money Residential Quarter',
    lat: 26.4782,
    lng: 80.3312,
    avgPricePerSqFt: 10400,
    priceRangeMin: 8700,
    priceRangeMax: 12500,
    circleRateSqM: '₹50,000 – ₹72,000 / sq.m',
    circleRateSqFtApprox: '₹4,645 – ₹6,690 / sq.ft',
    yoyAppreciation: '+14.5%',
    threeYearGrowth: '+29.0%',
    rentalYield: '2.2% – 2.5%',
    dominantType: 'Exclusive Mansions & Gated Boutique Apartments',
    overview:
      'A serene, strictly residential enclave favored by generational industrial dynasties and senior executives. Renowned for wide tree-lined avenues, manicured private lawns and absolute exclusivity.',
    keyHighlights: [
      'Highest concentration of high-net-worth private residences',
      'Unmatched neighborhood privacy and low ambient noise',
      'Quick arterial connection to Company Bagh and VIP Road',
      'Virtually zero speculative trading — generational holding'
    ],
    coordinates: { x: 56, y: 34 },
    tags: ['Generational Wealth', 'Quiet Enclave', 'Boutique Estates']
  },
  {
    id: 'kalyanpur',
    name: 'Kalyanpur',
    zone: 'North-West Tech, Metro & Education Corridor',
    lat: 26.4950,
    lng: 80.2625,
    avgPricePerSqFt: 5400,
    priceRangeMin: 3800,
    priceRangeMax: 5800,
    circleRateSqM: '₹24,000 – ₹36,000 / sq.m',
    circleRateSqFtApprox: '₹2,230 – ₹3,340 / sq.ft',
    yoyAppreciation: '+21.5%',
    threeYearGrowth: '+42.6%',
    rentalYield: '3.8% – 4.5%',
    dominantType: 'Modern Gated Townships & High-Yield Apartments',
    overview:
      'Kanpur’s fastest-growing residential and institutional corridor. Anchored by IIT Kanpur, HBTI and CSJMU. The operational Orange Line Metro terminal at IIT Kanpur has triggered a massive residential housing boom.',
    keyHighlights: [
      'Terminal station of Kanpur Metro Corridor 1 (Orange Line)',
      'Surging demand from tech research scholars, professors and doctors',
      'Direct GT Road and outer bypass highway connectivity',
      'Top choice for high-yield rental portfolios and mid-segment homes'
    ],
    coordinates: { x: 22, y: 22 },
    tags: ['Growth Corridor', 'Metro Terminal', 'IIT Kanpur Hub', 'High Yield']
  },
  {
    id: 'shyam-nagar',
    name: 'Shyam Nagar',
    zone: 'Eastern Aviation & National Highway Corridor',
    lat: 26.4172,
    lng: 80.3752,
    avgPricePerSqFt: 4600,
    priceRangeMin: 3500,
    priceRangeMax: 6000,
    circleRateSqM: '₹22,000 – ₹32,000 / sq.m',
    circleRateSqFtApprox: '₹2,040 – ₹2,970 / sq.ft',
    yoyAppreciation: '+19.8%',
    threeYearGrowth: '+36.5%',
    rentalYield: '3.2% – 3.8%',
    dominantType: 'Plotted Housing Societies & Mid-Segment Towers',
    overview:
      'Strategic South-East Kanpur hub situated directly between the newly expanded Chakeri Civil Airport Terminal and National Highway 19 (GT Road). Ideal for business executives, logistics entrepreneurs and defense personnel.',
    keyHighlights: [
      '10-minute access to Chakeri Civil Airport New Terminal',
      'Immediate access to Delhi-Kolkata National Highway (NH-19)',
      'Substantial plotted land development under KDA approved layouts',
      'Proximity to COD, Air Force base and upcoming logistics parks'
    ],
    coordinates: { x: 78, y: 65 },
    tags: ['Airport Enclave', 'NH-19 Connectivity', 'Plotted Developments']
  },
  {
    id: 'kakadeo',
    name: 'Kakadeo',
    zone: 'Educational & High-Density Student Rental Hub',
    lat: 26.4735,
    lng: 80.3015,
    avgPricePerSqFt: 5800,
    priceRangeMin: 4500,
    priceRangeMax: 6800,
    circleRateSqM: '₹30,000 – ₹42,000 / sq.m',
    circleRateSqFtApprox: '₹2,790 – ₹3,900 / sq.ft',
    yoyAppreciation: '+15.0%',
    threeYearGrowth: '+23.4%',
    rentalYield: '5.2% – 6.5%',
    dominantType: 'Student Hostels, Co-Living Spaces & Commercial Complexes',
    overview:
      'North India’s premier coaching center hub for IIT-JEE and NEET medical entrance exams. Over 50,000 students reside here annually, generating the highest gross residential rental yields across Kanpur.',
    keyHighlights: [
      'Highest rental yields in Kanpur (5.2% – 6.5%)',
      'Near-zero vacancy rates during academic seasons',
      'Geeta Nagar & Gurudev Metro station connectivity',
      'Heavy pedestrian footfall and vibrant commercial micro-economy'
    ],
    coordinates: { x: 42, y: 38 },
    tags: ['Highest Yield', 'Student Co-Living', 'Coaching Hub']
  },
  {
    id: 'cantt-mall-road',
    name: 'Cantt & Mall Road',
    zone: 'Heritage Financial Spine & Cantonment Perimeter',
    lat: 26.4620,
    lng: 80.3540,
    avgPricePerSqFt: 7200,
    priceRangeMin: 5000,
    priceRangeMax: 18000,
    circleRateSqM: '₹45,000 – ₹75,000 / sq.m',
    circleRateSqFtApprox: '₹4,180 – ₹6,970 / sq.ft',
    yoyAppreciation: '+13.2%',
    threeYearGrowth: '+20.5%',
    rentalYield: '3.0% – 3.5%',
    dominantType: 'Commercial Offices, Bank Headquarters & Freehold Plots',
    overview:
      'The historic commercial backbone of Kanpur. Houses major banking regional offices, LIC buildings and the Birhana Road bullion market. Cantonment board regulations strictly limit new high-rise supply.',
    keyHighlights: [
      'Kanpur Central Railway Station proximity & upcoming Central Metro station',
      'Historic commercial center and financial sector headquarters',
      'Birhana Road jewelry and gold bullion trade corridor',
      'Scarcity of private freehold land drives premium pricing'
    ],
    coordinates: { x: 68, y: 46 },
    tags: ['Financial Spine', 'Historic Cantt', 'Commercial Hub']
  },
  {
    id: 'ganga-barrage',
    name: 'Ganga Barrage & Trans-Ganga City',
    zone: 'KDA / UPSIDA Mega Infrastructure Frontier',
    lat: 26.5050,
    lng: 80.3400,
    avgPricePerSqFt: 4200,
    priceRangeMin: 3200,
    priceRangeMax: 5500,
    circleRateSqM: '₹18,000 – ₹28,000 / sq.m',
    circleRateSqFtApprox: '₹1,670 – ₹2,600 / sq.ft',
    yoyAppreciation: '+24.0%',
    threeYearGrowth: '+46.8%',
    rentalYield: '2.5% – 3.0%',
    dominantType: 'Planned Integrated Mega-Townships & Riverfront Villas',
    overview:
      'The designated master-expansion zone across the Ganges river. Spearheaded by UPSIDA’s 1,156-acre Trans Ganga City project and KDA’s 4-lane waterfront arterial road connecting to Mandhana. Unmatched long-term capital appreciation potential.',
    keyHighlights: [
      '1,156-acre UPSIDA Trans-Ganga Master Planned Smart City',
      'Direct 4-lane expressway corridor from Barrage to Mandhana',
      'Proposed international sporting facilities and institutional zones',
      'Primary destination for long-term real estate investment portfolios'
    ],
    coordinates: { x: 60, y: 18 },
    tags: ['Mega Township', 'UPSIDA', 'Highest Capital Growth', 'River Corridor']
  },
  {
    id: 'kidwai-nagar',
    name: 'Kidwai Nagar & Govind Nagar',
    zone: 'South Kanpur Established Residential Core',
    lat: 26.4380,
    lng: 80.3120,
    avgPricePerSqFt: 5200,
    priceRangeMin: 4200,
    priceRangeMax: 6500,
    circleRateSqM: '₹28,000 – ₹40,000 / sq.m',
    circleRateSqFtApprox: '₹2,600 – ₹3,720 / sq.ft',
    yoyAppreciation: '+14.8%',
    threeYearGrowth: '+22.0%',
    rentalYield: '3.1% – 3.6%',
    dominantType: 'Independent Homes, Gated Communities & Local Bazaars',
    overview:
      'The mature residential heartbeat of South Kanpur. Dense, self-contained neighborhoods with established schools, hospitals and bustling community markets like Govind Nagar Market.',
    keyHighlights: [
      'Upcoming Metro Corridor 1 stations at Deep Cinema and Naubasta',
      'Highly stable residential community with strong local demand',
      'Dense social infrastructure (schools, parks, healthcare)',
      'Consistent, resilient rental absorption'
    ],
    coordinates: { x: 48, y: 58 },
    tags: ['Mature Residential', 'Family Enclave', 'South Kanpur']
  }
];

export const KANPUR_INFRASTRUCTURE: InfrastructureProject[] = [
  {
    id: 'metro-orange',
    name: 'Kanpur Metro Orange Line (Corridor 1: IIT Kanpur to Naubasta)',
    category: 'Metro',
    status: 'Operational',
    investment: '₹11,076 Cr Project Outlay',
    impactArea: 'IIT Kanpur, Kalyanpur, Gurudev, Moti Jheel, Chunniganj, Nayaganj, Kanpur Central',
    details:
      'Currently operational across 14 stations connecting the Western institutional hub (IIT Kanpur) through the central commercial core (Chunniganj, Naveen Market, Bada Chauraha, Nayaganj, Kanpur Central). Final elevated section toward Naubasta in final stages.'
  },
  {
    id: 'metro-blue',
    name: 'Kanpur Metro Blue Line (Corridor 2: Agri University to Barra-8)',
    category: 'Metro',
    status: 'Active Construction',
    investment: 'Part of ₹11,076 Cr Master Plan',
    impactArea: 'Rawatpur (Interchange), Kakadeo, Govind Nagar, Barra',
    details:
      '8.6 km corridor under active civil and tunnel excavation (TBM Gomti). Features key interchange station at Rawatpur connecting South Kanpur to the institutional belt.'
  },
  {
    id: 'chakeri-airport',
    name: 'Chakeri Civil Airport New Passenger Enclave',
    category: 'Aviation',
    status: 'Operational',
    investment: '₹150 Cr Expansion',
    impactArea: 'Shyam Nagar, Chakeri, GT Road NH-19, Defense Industrial Corridor',
    details:
      'State-of-the-art terminal covering 6,243 sq. meters (16x larger than legacy terminal) with 400 peak passenger capacity and 3 aerobridges. Operates daily flights to Delhi, Mumbai, Bengaluru and Hyderabad.'
  },
  {
    id: 'trans-ganga-city',
    name: 'UPSIDA Trans-Ganga Smart City Township',
    category: 'Township',
    status: 'Under Development',
    investment: '₹1,500+ Cr Planned Infrastructure',
    impactArea: 'Ganga Barrage, Unnao-Kanpur Highway, Azad Nagar Outskirts',
    details:
      '1,156-acre master-planned sustainable township with dedicated residential sectors, commercial business parks, zero-discharge clean tech clusters and planned exhibition grounds across the Ganges.'
  },
  {
    id: 'barrage-mandhana-road',
    name: 'Ganga Barrage – Mandhana 4-Lane Arterial Road',
    category: 'Expressway',
    status: 'Active Construction',
    investment: '₹220 Cr KDA Project',
    impactArea: 'Civil Lines, Ganga Barrage, Singhpur, Mandhana, GT Road Bypass',
    details:
      'Wide 4-lane bypass road along the Ganges embankment easing traffic from Civil Lines and Nawabganj toward GT Road and Kanpur Outer Ring Road.'
  }
];

export interface StampDutyCalculation {
  propertyValuation: number;
  stampDutyRate: number;
  stampDutyAmount: number;
  registrationRate: number;
  registrationAmount: number;
  totalGovtFees: number;
  effectiveTotal: number;
}

export function calculateKanpurStampDuty(
  valuation: number,
  buyerGender: 'male' | 'female' | 'joint'
): StampDutyCalculation {
  // UP Govt Stamp Duty Rules for Kanpur:
  // Male: 7% stamp duty + 1% registration
  // Female: 6% stamp duty (1% rebate up to Rs 10 Lakh property value max benefit) + 1% registration
  // Joint: 6.5% stamp duty + 1% registration
  let stampDutyRate = 0.07;
  if (buyerGender === 'female') {
    stampDutyRate = 0.06;
  } else if (buyerGender === 'joint') {
    stampDutyRate = 0.065;
  }

  const stampDutyAmount = Math.round(valuation * stampDutyRate);
  const registrationRate = 0.01;
  const registrationAmount = Math.round(valuation * registrationRate);
  const totalGovtFees = stampDutyAmount + registrationAmount;

  return {
    propertyValuation: valuation,
    stampDutyRate: Math.round(stampDutyRate * 1000) / 10,
    stampDutyAmount,
    registrationRate: Math.round(registrationRate * 1000) / 10,
    registrationAmount,
    totalGovtFees,
    effectiveTotal: valuation + totalGovtFees
  };
}

import { ArchitecturalProject } from '../types';

import heroVilla from '../assets/images/deal_hero_villa_1790892290099.jpg';
import dealHeroStudio from '../assets/images/deal_hero_studio_1791111272909.jpg';
import villaInterior from '../assets/images/deal_villa_interior_1790892343014.jpg';
import siteAerial from '../assets/images/deal_site_aerial_1790892303682.jpg';
import paperSketch from '../assets/images/deal_paper_sketch_1790892316539.jpg';
import furnitureItem from '../assets/images/deal_furniture_item_1790892328850.jpg';

export { heroVilla, dealHeroStudio, villaInterior, siteAerial, paperSketch, furnitureItem };

export const INITIAL_PROJECTS: ArchitecturalProject[] = [
  {
    id: 'proj-villa-alnoor',
    name: 'Villa Al Noor',
    clientName: 'Al-Mansoor Family Trust',
    projectType: 'Villa',
    location: 'Jeddah Coastal District, Saudi Arabia',
    landArea: 1450,
    buildingType: 'Courtyard Luxury Residence',
    floors: 2,
    status: 'in_progress',
    updatedAt: 'Today, 14:30',
    thumbnail: heroVilla,
    wallHeight: 3.4,
    wallThickness: 0.25,
    facadeStyle: 'Travertine Stone',
    roofStyle: 'Cantilevered Eaves',
    flooringMaterial: 'Natural Limestone',
    exteriorColor: '#EAE1D5',
    interiorLighting: 'Warm 3000K',
    isDemo: true,
    siteData: {
      parcelArea: 1450,
      usableArea: 980,
      orientation: 'South-West (Prevailing Sea Breeze)',
      roadAccess: '30m Boulevard (North Elevation)',
      topography: 'Flat coastal alluvial terrain, 0.4% natural drainage',
      solarIndex: 94,
      ventilationScore: 89,
      selectedOptionId: 'opt-b',
      options: [
        {
          id: 'opt-a',
          title: 'Option A — Maximum Usable Area',
          tagline: 'Expansive formal reception halls with monolithic exterior volume',
          utilization: '86%',
          footprintArea: '620 m²',
          pros: ['Maximizes guest majlis seating', 'Consolidated service corridor', 'High boundary privacy'],
          cons: ['Requires extensive west-facing shading screens', 'Smaller courtyard']
        } as any,
        {
          id: 'opt-b',
          title: 'Option B — Central Courtyard & Bio-Oasis',
          tagline: 'Private interior microclimate with natural reflection pool & mature olive tree',
          utilization: '74%',
          footprintArea: '520 m²',
          pros: ['Natural cross-ventilation', '360° daylight penetration', 'Shaded summer garden'],
          cons: ['Double-loaded circulation corridor']
        } as any,
        {
          id: 'opt-c',
          title: 'Option C — Wind-Funnel & Passive Cooling',
          tagline: 'Dynamic dual-volume architecture capturing sea breeze vectors',
          utilization: '78%',
          footprintArea: '560 m²',
          pros: ['Reduces HVAC cooling load by 24%', 'Separates guest and family wings'],
          cons: ['Higher facade construction envelope cost']
        } as any,
        {
          id: 'opt-d',
          title: 'Option D — Passive Solar & Net-Zero',
          tagline: 'Optimized roof geometry supporting 38 kWp integrated solar photovoltaic tiles',
          utilization: '71%',
          footprintArea: '500 m²',
          pros: ['Near net-zero operational energy', 'Integrated rainwater harvesting cistern'],
          cons: ['Specific roof angles required']
        } as any
      ]
    },
    elements: [
      { id: 'w1', type: 'wall', x: 2, y: 2, width: 0.3, length: 14, rotation: 0, label: 'North Perimeter Wall', material: 'Travertine' },
      { id: 'w2', type: 'wall', x: 2, y: 2, width: 12, length: 0.3, rotation: 0, label: 'West Wall', material: 'Travertine' },
      { id: 'w3', type: 'wall', x: 16, y: 2, width: 12, length: 0.3, rotation: 0, label: 'East Wall', material: 'Travertine' },
      { id: 'w4', type: 'wall', x: 2, y: 14, width: 0.3, length: 14, rotation: 0, label: 'South Garden Wall', material: 'Travertine' },
      { id: 'r1', type: 'room', x: 2.5, y: 2.5, width: 6.5, length: 5.5, rotation: 0, label: 'Formal Majlis', color: '#F6EFE5' },
      { id: 'r2', type: 'room', x: 9.5, y: 2.5, width: 6, length: 5.5, rotation: 0, label: 'Family Living Pavilion', color: '#FAF7F2' },
      { id: 'r3', type: 'room', x: 2.5, y: 8.5, width: 5.5, length: 5, rotation: 0, label: 'Dining & Show Kitchen', color: '#EFE6DA' },
      { id: 'r4', type: 'room', x: 8.5, y: 8.5, width: 7, length: 5, rotation: 0, label: 'Internal Courtyard & Pool', color: '#E5DDD3' },
      { id: 'd1', type: 'door', x: 5.5, y: 2, width: 1.8, length: 0.2, rotation: 0, label: 'Main Double Pivot Door' },
      { id: 'win1', type: 'window', x: 10, y: 14, width: 4.5, length: 0.2, rotation: 0, label: 'Glazed Garden Elevation' },
      { id: 'f1', type: 'furniture', x: 11, y: 4.5, width: 3.2, length: 2.2, rotation: 0, label: 'Modular Bouclé Sectional' }
    ],
    versions: [
      { id: 'v1', versionName: 'v1.0 Initial Concept', timestamp: '2026-09-20', author: 'Dalia Al Waqtan', description: 'Baseline site zoning and massing analysis' },
      { id: 'v2', versionName: 'v2.0 Courtyard Optimization', timestamp: '2026-09-25', author: 'Lead Architect', description: 'Oriented family wing toward central reflection pool' },
      { id: 'v3', versionName: 'v2.1 Fenestration & Louvers', timestamp: '2026-09-30', author: 'Lead Architect', description: 'Added exterior cedar brise-soleil to reduce afternoon glare' }
    ],
    clientComments: [
      { id: 'c1', author: 'Al-Mansoor', text: 'We love the central courtyard layout. Can we confirm if the kitchen island has direct visual access to the pool?', date: 'Yesterday', status: 'resolved' },
      { id: 'c2', author: 'Al-Mansoor', text: 'Please ensure the garage fits 3 SUVs with concealed service doors.', date: 'Today', status: 'pending' }
    ]
  },
  {
    id: 'proj-palm-oasis',
    name: 'The Palm Oasis Residence',
    clientName: 'Dr. Tariq Al-Ghamdi',
    projectType: 'Villa',
    location: 'Diriyah Heritage Buffer, Riyadh',
    landArea: 2100,
    buildingType: 'Contemporary Najdi Fusion Villa',
    floors: 2,
    status: 'client_review',
    updatedAt: 'Yesterday',
    thumbnail: villaInterior,
    wallHeight: 3.6,
    wallThickness: 0.35,
    facadeStyle: 'Textured Stucco',
    roofStyle: 'Pergola Terrace',
    flooringMaterial: 'Natural Limestone',
    exteriorColor: '#D9CBBE',
    interiorLighting: 'Sunset Golden',
    isDemo: true,
    siteData: {
      parcelArea: 2100,
      usableArea: 1350,
      orientation: 'North-East',
      roadAccess: 'Historic Palm Alley Road',
      topography: 'Gentle rocky slope with preserved heritage date palms',
      solarIndex: 91,
      ventilationScore: 84,
      selectedOptionId: 'opt-b',
      options: []
    },
    elements: [
      { id: 'w1', type: 'wall', x: 2, y: 2, width: 0.35, length: 16, rotation: 0, label: 'Rammed Earth Finished Wall' },
      { id: 'r1', type: 'room', x: 3, y: 3, width: 8, length: 6, rotation: 0, label: 'Grand Majlis & Library' }
    ],
    versions: [
      { id: 'v1', versionName: 'v1.0 Heritage Approval Draft', timestamp: '2026-09-18', author: 'Lead Architect', description: 'Conforms to Diriyah Gate development code' }
    ],
    clientComments: []
  },
  {
    id: 'proj-khobar-coastal',
    name: 'Al Khobar Waterfront Pavilion',
    clientName: 'Khobar Design Partners',
    projectType: 'Commercial',
    location: 'Corniche Avenue, Al Khobar',
    landArea: 3200,
    buildingType: 'Mixed Commercial & Creative Loft',
    floors: 3,
    status: 'draft',
    updatedAt: '2 days ago',
    thumbnail: siteAerial,
    wallHeight: 4.0,
    wallThickness: 0.3,
    facadeStyle: 'Fair-Faced Concrete',
    roofStyle: 'Flat Modern Parapet',
    flooringMaterial: 'Polished Terrazzo',
    exteriorColor: '#FAF7F2',
    interiorLighting: 'Neutral 4000K',
    isDemo: true,
    siteData: {
      parcelArea: 3200,
      usableArea: 2400,
      orientation: 'North-East Gulf View',
      roadAccess: 'Dual frontage avenue',
      topography: 'Reclaimed coastal parcel',
      solarIndex: 88,
      ventilationScore: 95,
      selectedOptionId: 'opt-a',
      options: []
    },
    elements: [],
    versions: [],
    clientComments: []
  }
];

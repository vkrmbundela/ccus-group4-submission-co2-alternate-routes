// ===== Single source of truth for all project constants =====

// Map Settings
export const MAP_CENTER = [17.5939, 78.1232];
export const MAP_ZOOM = 17;
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Vehicle Types — emission factors in grams CO2 per kilometer
// Source: TERI — "Per passenger emission in Delhi: Different Modes"
// Max counts bounded by parking infrastructure: 40 car slots, 80 bike slots
// Default counts from campus survey avg (10, 13, 16 Apr 2026): 27 cars, 39 two-wheelers
export const VEHICLE_TYPES = {
  petrolCar: {
    label: 'Petrol Car',
    emissionFactor: 143.7, // 2270 g/L ÷ 15.79 km/L (TERI)
    defaultCount: 16,
    max: 40,               // bounded by 40 car parking slots (shared with diesel)
    icon: 'car',
  },
  dieselCar: {
    label: 'Diesel Car',
    emissionFactor: 149.9, // 2640 g/L ÷ 17.61 km/L (TERI)
    defaultCount: 11,
    max: 40,               // bounded by 40 car parking slots (shared with petrol)
    icon: 'car',
  },
  scooter: {
    label: 'Scooter',
    emissionFactor: 47.3,  // 2270 g/L ÷ 48.00 km/L (TERI)
    defaultCount: 20,
    max: 80,               // bounded by 80 bike parking slots (shared with motorcycle)
    icon: 'bike',
  },
  motorcycle: {
    label: 'Motorcycle',
    emissionFactor: 39.2,  // 2270 g/L ÷ 57.85 km/L (TERI)
    defaultCount: 19,
    max: 80,               // bounded by 80 bike parking slots (shared with scooter)
    icon: 'bike',
  },
};

// Route definitions
export const ROUTES = {
  violet: {
    id: 'violet',
    name: 'Violet Route (Academic Spine + North Link)',
    description: 'South approach → academic spine → shared parking between A and B block corner',
    color: '#7B2D8E',
    colorLight: '#a855c7',
    parkingHub: 'B',
  },
  red: {
    id: 'red',
    name: 'Red Route (Workshop Loop Corridor)',
    description: 'Workshop-side loop corridor → shared parking between A and B block corner',
    color: '#D32F2F',
    colorLight: '#ef5350',
    parkingHub: 'B',
  },
};

// Chart colors
export const CHART_COLORS = {
  violet: 'rgba(123, 45, 142, 0.8)',
  violetBorder: 'rgba(123, 45, 142, 1)',
  red: 'rgba(211, 47, 47, 0.8)',
  redBorder: 'rgba(211, 47, 47, 1)',
  vehicleColors: [
    'rgba(37, 99, 235, 0.7)',   // petrolCar
    'rgba(16, 185, 129, 0.7)',  // dieselCar
    'rgba(245, 158, 11, 0.7)',  // scooter
    'rgba(239, 68, 68, 0.7)',   // motorcycle
  ],
};

// Parking Infrastructure Defaults (real campus data)
export const PARKING_DEFAULTS = {
  totalLots: {
    label: 'Total Parking Slots',
    default: 120,
    max: 120,
    icon: '🅿️',
  },
  carParking: {
    label: 'Car Parking Slots',
    default: 40,
    max: 40,
    icon: '🚗',
  },
  bikeParking: {
    label: 'Bike Parking Slots',
    default: 80,
    max: 80,
    icon: '🛵',
  },
};

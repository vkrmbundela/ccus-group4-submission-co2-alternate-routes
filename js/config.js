// ===== Single source of truth for all project constants =====

// Map Settings
export const MAP_CENTER = [17.5939, 78.1232];
export const MAP_ZOOM = 17;
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Vehicle Types — emission factors in grams CO2 per kilometer
// Sources: ICCT (Indian fleet averages), IEA (grid factors)
// Max counts bounded by parking infrastructure: 40 car slots, 80 bike slots
export const VEHICLE_TYPES = {
  petrolCar: {
    label: 'Petrol Car',
    emissionFactor: 200.0, // WRI India 2015 Uplift Average
    defaultCount: 25,
    max: 40,              // bounded by 40 car parking slots (shared with diesel)
    icon: 'car',
  },
  dieselCar: {
    label: 'Diesel Car',
    emissionFactor: 201.5, // WRI India 2015 Uplift Average
    defaultCount: 15,
    max: 40,              // bounded by 40 car parking slots (shared with petrol)
    icon: 'car',
  },
  twoWheeler: {
    label: 'Two-Wheeler',
    emissionFactor: 45.8, // WRI India 2015 Uplift Average
    defaultCount: 50,
    max: 80,              // bounded by 80 bike parking slots
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
    'rgba(245, 158, 11, 0.7)',  // twoWheeler
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

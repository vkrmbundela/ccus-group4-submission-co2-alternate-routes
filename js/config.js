// ===== Single source of truth for all project constants =====

// Map Settings
export const MAP_CENTER = [17.5939, 78.1232];
export const MAP_ZOOM = 17;
export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Vehicle Types — emission factors in grams CO2 per kilometer
// Sources: ICCT (Indian fleet averages), IEA (grid factors)
export const VEHICLE_TYPES = {
  petrolCar: {
    label: 'Petrol Car',
    emissionFactor: 120, // ICCT FY2022-23 Indian fleet avg
    defaultCount: 80,
    icon: 'car',
  },
  dieselCar: {
    label: 'Diesel Car',
    emissionFactor: 140, // ICCT diesel fleet avg
    defaultCount: 40,
    icon: 'car',
  },
  twoWheeler: {
    label: 'Two-Wheeler',
    emissionFactor: 41, // ICCT FY2018-19
    defaultCount: 200,
    icon: 'bike',
  },
};

// Route definitions
export const ROUTES = {
  violet: {
    id: 'violet',
    name: 'Violet Route (Academic Spine + North Link)',
    description: 'South approach → academic spine → rear Academic Block C parking (B1)',
    color: '#7B2D8E',
    colorLight: '#a855c7',
    parkingHub: 'B1',
  },
  red: {
    id: 'red',
    name: 'Red Route (Workshop Loop Corridor)',
    description: 'Workshop-side loop corridor → rear Academic Block C overflow parking (B2)',
    color: '#D32F2F',
    colorLight: '#ef5350',
    parkingHub: 'B2',
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

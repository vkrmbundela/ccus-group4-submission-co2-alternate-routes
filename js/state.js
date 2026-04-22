// ===== Reactive State Store (Pub/Sub) =====
// All UI updates flow through this store. No module directly calls
// another module's update function.

import { VEHICLE_TYPES, PARKING_DEFAULTS } from './config.js';

// Build default vehicle counts from config
const defaultVehicleCounts = {};
for (const [key, vehicle] of Object.entries(VEHICLE_TYPES)) {
  defaultVehicleCounts[key] = vehicle.defaultCount;
}

// Build default parking stats from config
const defaultParkingStats = {};
for (const [key, config] of Object.entries(PARKING_DEFAULTS)) {
  defaultParkingStats[key] = config.default;
}

// Internal state
let state = {
  vehicleCounts: { ...defaultVehicleCounts },
  parkingStats: { ...defaultParkingStats },
  buildings: [],               // live building list (loaded from JSON, then user-editable)
  buildingPopulations: {},     // { buildingId: population }
  buildingWeights: {},         // { buildingId: weight }
  activeRoute: 'both',         // 'violet' | 'red' | 'both'
  routeDistances: {            // populated from GeoJSON at runtime
    violet: 0,
    red: 0,
  },
  mapPickMode: false,          // true when user is picking a point on the map
  theme: localStorage.getItem('theme') || 'light',
};

// Subscriber registry: key -> Set of callbacks
const subscribers = new Map();

/**
 * Get a shallow copy of the current state (or a specific key).
 */
export function getState(key) {
  if (key !== undefined) {
    return state[key];
  }
  return { ...state };
}

/**
 * Merge partial updates into state and notify subscribers.
 * @param {Object} partial - key/value pairs to merge
 */
export function setState(partial) {
  const changedKeys = [];

  for (const [key, value] of Object.entries(partial)) {
    if (state[key] !== value) {
      state[key] = value;
      changedKeys.push(key);
    }
  }

  // Notify subscribers for each changed key
  for (const key of changedKeys) {
    if (subscribers.has(key)) {
      for (const callback of subscribers.get(key)) {
        callback(state[key], state);
      }
    }
  }

  // Also notify wildcard subscribers on any change
  if (changedKeys.length > 0 && subscribers.has('*')) {
    for (const callback of subscribers.get('*')) {
      callback(state);
    }
  }
}

/**
 * Subscribe to state changes for a specific key (or '*' for all).
 * @param {string} key - state key to watch
 * @param {Function} callback - called with (newValue, fullState)
 * @returns {Function} unsubscribe function
 */
export function subscribe(key, callback) {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key).add(callback);

  // Return unsubscribe function
  return () => {
    subscribers.get(key).delete(callback);
  };
}

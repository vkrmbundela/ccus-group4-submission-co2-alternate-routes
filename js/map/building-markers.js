// ===== Building Markers =====
// Plots academic buildings on the map with info popups.
// Supports dynamic add (via map pick) and remove.

import { getState, setState, subscribe } from '../state.js';
import { addBuilding } from '../ui/input-panel.js';

let buildingData = null;
let mapRef = null;
let markerMap = new Map(); // buildingId -> L.Marker
let pickBanner = null;
let parkingHubCoords = null; // { B1: [lat, lng], B2: [lat, lng] }

// Category-to-color mapping
const CATEGORY_COLORS = {
  academic: '#2563eb',
  research: '#7c3aed',
  support: '#059669',
  admin: '#d97706',
  recreation: '#ec4899',
  custom: '#f97316',
};

/**
 * Load buildings from JSON and plot markers on the map.
 * @param {L.Map} map - Leaflet map instance
 * @returns {Object} building data
 */
export async function initBuildingMarkers(map) {
  mapRef = map;

  try {
    const response = await fetch('./js/data/buildings.json');
    const contentType = response.headers.get('content-type');
    if (!response.ok || (contentType && contentType.indexOf('application/json') === -1)) {
      throw new Error('Buildings data not found or invalid format');
    }
    buildingData = await response.json();
  } catch (error) {
    console.warn('Falling back to empty buildings:', error);
    buildingData = { buildings: [] };
  }

  for (const building of buildingData.buildings) {
    addMarkerToMap(building);
  }

  // Listen for building removals from the input panel
  window.addEventListener('building-removed', (e) => {
    removeMarkerFromMap(e.detail.buildingId);
  });

  // Set up map click handler for pick mode
  map.on('click', onMapClick);

  // Toggle map cursor when pick mode changes
  subscribe('mapPickMode', (active) => {
    const container = map.getContainer();
    if (active) {
      container.classList.add('map-pick-mode');
      showPickBanner();
    } else {
      container.classList.remove('map-pick-mode');
      hidePickBanner();
    }
  });

  return buildingData;
}

/**
 * Store the parking hub coordinates (called from main.js after routes load).
 * Needed to compute distances for new buildings.
 */
export function setParkingHubCoords(hubs) {
  parkingHubCoords = {};
  for (const [id, hub] of Object.entries(hubs)) {
    parkingHubCoords[id] = hub.coordinates;
  }
}

/**
 * Add a circle marker for a building.
 */
function addMarkerToMap(building) {
  const color = CATEGORY_COLORS[building.category] || CATEGORY_COLORS.custom;

  const marker = L.circleMarker(building.coordinates, {
    radius: 7,
    fillColor: color,
    color: '#fff',
    weight: 1.5,
    fillOpacity: 0.85,
  });

  const depts = building.departments || [];
  const deptText = depts.length > 0 ? depts.join(', ') : 'General';

  marker.bindPopup(`
    <strong>${building.name}</strong><br>
    <em>${building.category || 'custom'}</em><br>
    Departments: ${deptText}<br>
    Default Population: ${building.defaultPopulation}<br>
    <small>B1 dist: ${building.distanceFromB1_m}m | B2 dist: ${building.distanceFromB2_m}m</small>
  `);

  marker.addTo(mapRef);
  markerMap.set(building.id, marker);
}

/**
 * Remove a marker from the map.
 */
function removeMarkerFromMap(buildingId) {
  const marker = markerMap.get(buildingId);
  if (marker) {
    mapRef.removeLayer(marker);
    markerMap.delete(buildingId);
  }
}

/**
 * Handle map click — only active during pick mode.
 */
function onMapClick(e) {
  if (!getState('mapPickMode')) return;

  const { lat, lng } = e.latlng;

  // Compute distances to B1 and B2 using turf
  let distB1 = 0;
  let distB2 = 0;

  if (parkingHubCoords) {
    if (parkingHubCoords.B1) {
      const from = turf.point([lng, lat]);
      const toB1 = turf.point([parkingHubCoords.B1[1], parkingHubCoords.B1[0]]);
      distB1 = Math.round(turf.distance(from, toB1, { units: 'meters' }));
    }
    if (parkingHubCoords.B2) {
      const from = turf.point([lng, lat]);
      const toB2 = turf.point([parkingHubCoords.B2[1], parkingHubCoords.B2[0]]);
      distB2 = Math.round(turf.distance(from, toB2, { units: 'meters' }));
    }
  }

  // Generate a unique ID
  const id = `custom-${Date.now()}`;
  const existingCount = getState('buildings').filter(b => b.id.startsWith('custom-')).length;

  const newBuilding = {
    id,
    name: `Custom Building ${existingCount + 1}`,
    category: 'custom',
    coordinates: [lat, lng],
    weight: 0.8,
    defaultPopulation: 200,
    departments: [],
    distanceFromB1_m: distB1,
    distanceFromB2_m: distB2,
  };

  // Add marker to map
  addMarkerToMap(newBuilding);

  // Add to state via input-panel
  addBuilding(newBuilding);

  // Exit pick mode after placing
  setState({ mapPickMode: false });
}

/**
 * Show a banner on the map indicating pick mode is active.
 */
function showPickBanner() {
  if (pickBanner) return;
  pickBanner = document.createElement('div');
  pickBanner.className = 'map-pick-banner';
  pickBanner.innerHTML = `
    <span>Click on the map to place a new building</span>
    <button id="cancel-pick" class="btn-cancel-pick">Cancel</button>
  `;
  mapRef.getContainer().appendChild(pickBanner);

  document.getElementById('cancel-pick').addEventListener('click', () => {
    setState({ mapPickMode: false });
  });
}

/**
 * Remove the pick mode banner.
 */
function hidePickBanner() {
  if (pickBanner) {
    pickBanner.remove();
    pickBanner = null;
  }
}

/**
 * Get the loaded building data.
 */
export function getBuildingData() {
  return buildingData;
}

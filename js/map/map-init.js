// ===== Leaflet Map Initialization =====
// Creates the map instance and tile layer. Exports the map for other modules.

import { MAP_CENTER, MAP_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../config.js';

let map = null;

/**
 * Initialize the Leaflet map in the #map container.
 * @returns {L.Map} the map instance
 */
export function initMap() {
  map = L.map('map', {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map);

  // Scale control for distance reference
  L.control.scale({ imperial: false }).addTo(map);

  // Fix rendering when container size changes (e.g., responsive layout)
  window.addEventListener('resize', () => {
    setTimeout(() => map.invalidateSize(), 100);
  });

  return map;
}

/**
 * Get the current map instance.
 */
export function getMap() {
  return map;
}

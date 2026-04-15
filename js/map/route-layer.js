// ===== Route Layer =====
// Loads GeoJSON routes and renders them as Leaflet polylines.
// Computes route distances via Turf.js and updates state.

import { ROUTES } from '../config.js';
import { setState } from '../state.js';

let routeLayers = {};
let routeData = null;

/**
 * Load routes from GeoJSON, draw on map, compute distances.
 * @param {L.Map} map - Leaflet map instance
 */
export async function initRoutes(map) {
  const response = await fetch('./js/data/routes.json');
  routeData = await response.json();

  const distances = {};

  for (const feature of routeData.features) {
    const routeId = feature.properties.id;
    const routeConfig = ROUTES[routeId];
    if (!routeConfig) continue;

    // Compute distance using Turf.js
    const lengthKm = turf.length(feature, { units: 'kilometers' });
    distances[routeId] = Math.round(lengthKm * 100) / 100; // 2 decimal places

    // Draw the polyline
    const layer = L.geoJSON(feature, {
      style: {
        color: routeConfig.color,
        weight: 5,
        opacity: 0.8,
        dashArray: routeId === 'violet' ? null : '10, 8',
      },
    });

    // Popup with route info
    layer.bindPopup(`
      <strong>${routeConfig.name}</strong><br>
      ${routeConfig.description}<br>
      <span style="font-family: monospace;">Distance: ${lengthKm.toFixed(2)} km</span>
    `);

    layer.addTo(map);
    routeLayers[routeId] = layer;
  }

  // Add parking hub markers
  if (routeData.parkingHubs) {
    for (const [hubId, hub] of Object.entries(routeData.parkingHubs)) {
      const normalizedHubId = String(hubId).toUpperCase();
      let iconClass = 'parking-hub-b2';
      if (normalizedHubId === 'B1') iconClass = 'parking-hub-b1';
      if (normalizedHubId === 'B2') iconClass = 'parking-hub-b2';
      if (normalizedHubId.startsWith('R')) iconClass = 'parking-hub-r';
      if (normalizedHubId.startsWith('V')) iconClass = 'parking-hub-v';

      const marker = L.marker(hub.coordinates, {
        icon: L.divIcon({
          className: `parking-hub-marker ${iconClass}`,
          html: `<span>${hubId}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -16],
        }),
        title: hub.name,
      });

      marker.bindPopup(`
        <strong>${hub.name}</strong><br>
        ${hub.description}
      `);

      marker.addTo(map);
    }
  }

  // Update state with computed distances
  setState({ routeDistances: distances });

  return { distances, routeData };
}

/**
 * Get the loaded route data.
 */
export function getRouteData() {
  return routeData;
}

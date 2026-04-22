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
  const response = await fetch('./js/data/routes.json', { cache: 'no-store' });
  routeData = await response.json();

  const distances = {};

  let totalNetworkDistance = 0;

  // Reserve features so solid lines sit on top of dashed lines
  const sortedFeatures = [...routeData.features].reverse();
  for (const feature of sortedFeatures) {
    const routeId = feature.properties.id;
    const routeConfig = ROUTES[routeId];
    if (!routeConfig) continue;

    // Compute distance using Turf.js
    const lengthKm = turf.length(feature, { units: 'kilometers' });
    distances[routeId] = Math.round(lengthKm * 100) / 100; // 2 decimal places
    totalNetworkDistance += distances[routeId];

    const domDist = document.getElementById(`dist-${routeId}`);
    if (domDist) domDist.textContent = `(${distances[routeId].toFixed(2)} km)`;

    // Draw the polyline with marching ants
    const latlngs = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    const layer = L.polyline.antPath(latlngs, {
      color: routeConfig.color,
      weight: 5,
      opacity: 0.8,
      pulseColor: '#ffffff',
      delay: 800,
      dashArray: [15, 20],
      reverse: false,
      hardwareAccelerated: true
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

  const domTotal = document.getElementById('dist-total');
  if (domTotal) domTotal.textContent = totalNetworkDistance.toFixed(2);

  // Add parking hub markers
  if (routeData.parkingHubs) {
    for (const [hubId, hub] of Object.entries(routeData.parkingHubs)) {
      const normalizedHubId = String(hubId).toUpperCase();
      let iconClass = 'parking-hub-b2';
      if (normalizedHubId === 'A') iconClass = 'parking-hub-a';
      if (normalizedHubId === 'B') iconClass = 'parking-hub-b';
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

// ===== Application Entry Point =====
// Imports all modules, initializes them in order, and wires state subscriptions.
// This is the only file that knows about all other modules.

import { subscribe, getState, setState } from './state.js';
import { initMap } from './map/map-init.js';
import { initRoutes } from './map/route-layer.js';
import { initBuildingMarkers, setParkingHubCoords } from './map/building-markers.js';
import { initVehicleInputs, initBuildingTable, toggleMapPickMode } from './ui/input-panel.js';
import { initCharts, updateCharts } from './ui/chart-panel.js';
import { updateResults } from './ui/results-display.js';
import { initThemeToggle } from './ui/theme-toggle.js';
import { compareRouteEmissions } from './engine/emissions.js';
import { compareBurden } from './engine/pedestrian.js';

async function init() {
  // 1. Initialize the map
  const map = initMap();

  // 2. Load data layers onto the map (parallel)
  const [routeResult, buildingData] = await Promise.all([
    initRoutes(map),
    initBuildingMarkers(map),
  ]);

  // 3. Pass parking hub coords to building-markers for distance calc on new buildings
  if (routeResult.routeData?.parkingHubs) {
    setParkingHubCoords(routeResult.routeData.parkingHubs);
  }

  // 4. Initialize UI controls
  initVehicleInputs();
  initBuildingTable(buildingData.buildings);
  initCharts();
  initThemeToggle();

  // 5. Wire the "Add Building" button
  document.getElementById('btn-add-building').addEventListener('click', toggleMapPickMode);

  // 6. Wire the recalculation pipeline
  function recalculate() {
    const state = getState();
    const { vehicleCounts, buildings, buildingPopulations, buildingWeights, routeDistances } = state;

    // Phase 1: Emissions
    const emissionsResult = compareRouteEmissions(
      vehicleCounts,
      routeDistances.violet || 2.0,
      routeDistances.red || 1.0,
    );

    // Phase 2: Pedestrian Burden — uses live building list from state
    const burdenResult = compareBurden(
      buildings,
      buildingPopulations,
      buildingWeights,
    );

    // Update visualizations
    updateCharts(emissionsResult, burdenResult);
    updateResults(emissionsResult, burdenResult);
  }

  // Subscribe to all relevant state changes
  subscribe('vehicleCounts', recalculate);
  subscribe('buildingPopulations', recalculate);
  subscribe('buildingWeights', recalculate);
  subscribe('buildings', recalculate);
  subscribe('routeDistances', recalculate);

  // 7. Run initial calculation
  recalculate();
}

// Boot the application
init().catch(err => {
  console.error('Failed to initialize application:', err);
  document.getElementById('main-content').innerHTML = `
    <div style="padding: 2rem; text-align: center; color: #d32f2f;">
      <h2>Failed to load application</h2>
      <p>${err.message}</p>
      <p style="font-size: 0.875rem; color: #666;">
        Make sure you're serving this over HTTP (not file://).
        Try: <code>npx serve .</code> or <code>python -m http.server 8080</code>
      </p>
    </div>
  `;
});

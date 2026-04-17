// ===== Application Entry Point =====
// Imports all modules, initializes them in order, and wires state subscriptions.
// This is the only file that knows about all other modules.

import { subscribe, getState } from './state.js';
import { initMap } from './map/map-init.js';
import { initRoutes } from './map/route-layer.js';
import { initVehicleInputs } from './ui/input-panel.js';
import { initCharts, updateCharts } from './ui/chart-panel.js';
import { updateResults } from './ui/results-display.js';
import { initThemeToggle } from './ui/theme-toggle.js';
import { compareRouteEmissions } from './engine/emissions.js';

async function init() {
  // 1. Initialize the map
  const map = initMap();

  // 2. Load route data and draw route layers
  await initRoutes(map);

  // 3. Initialize UI controls
  initVehicleInputs();
  initCharts();
  initThemeToggle();

  // 4. Wire the recalculation pipeline
  function recalculate() {
    const state = getState();
    const { vehicleCounts, routeDistances } = state;

    // Emissions comparison to shared destination
    const emissionsResult = compareRouteEmissions(
      vehicleCounts,
      routeDistances.violet || 2.0,
      routeDistances.red || 1.0,
    );

    // Update visualizations
    updateCharts(emissionsResult);
    updateResults(emissionsResult);
  }

  // Subscribe to all relevant state changes
  subscribe('vehicleCounts', recalculate);
  subscribe('routeDistances', recalculate);

  // 5. Run initial calculation
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

// Modal UI Handlers
(function setupModal() {
  const infoBtn = document.getElementById('info-toggle');
  const modal = document.getElementById('info-modal');
  const closeBtn = document.getElementById('close-modal');

  if (infoBtn && modal && closeBtn) {
    infoBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
})();

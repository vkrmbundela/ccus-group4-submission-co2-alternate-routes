// ===== Results Display =====
// Renders summary cards showing key metrics and savings.

import { formatCO2 } from '../utils/format.js';

/**
 * Update the results summary cards.
 * @param {Object} emissionsResult - from compareRouteEmissions()
 */
export function updateResults(emissionsResult) {
  const container = document.getElementById('results-summary');

  const betterRoute = emissionsResult.savingsKg >= 0 ? 'Red Route' : 'Violet Route';
  const changeType = emissionsResult.savingsPercent >= 0 ? 'reduction' : 'increase';

  container.innerHTML = `
    <div class="results-grid">
      <div class="result-card result-card-violet">
        <div class="result-label">Violet Route CO2</div>
        <div class="result-value">${formatCO2(emissionsResult.violet.totalKg)}</div>
        <div class="result-detail">Distance: ${emissionsResult.violet.distanceKm.toFixed(2)} km</div>
      </div>

      <div class="result-card result-card-red">
        <div class="result-label">Red Route CO2</div>
        <div class="result-value">${formatCO2(emissionsResult.red.totalKg)}</div>
        <div class="result-detail">Distance: ${emissionsResult.red.distanceKm.toFixed(2)} km</div>
      </div>

      <div class="result-card result-card-savings">
        <div class="result-label">CO2 Difference (Red vs Violet)</div>
        <div class="result-value ${emissionsResult.savingsKg > 0 ? 'positive' : 'negative'}">
          ${emissionsResult.savingsKg > 0 ? '-' : '+'}${formatCO2(Math.abs(emissionsResult.savingsKg))}
        </div>
        <div class="result-detail">${Math.abs(emissionsResult.savingsPercent).toFixed(1)}% ${changeType}</div>
      </div>

      <div class="result-card result-card-savings">
        <div class="result-label">Lower-Emission Option</div>
        <div class="result-value ${emissionsResult.savingsKg >= 0 ? 'positive' : 'negative'}">${betterRoute}</div>
        <div class="result-detail">Shared destination: Parking between A and B block corner</div>
      </div>
    </div>
  `;
}

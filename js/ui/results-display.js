// ===== Results Display =====
// Renders summary cards showing key metrics and savings.

import { formatCO2, formatBurden, formatNumber } from '../utils/format.js';

/**
 * Update the results summary cards.
 * @param {Object} emissionsResult - from compareRouteEmissions()
 * @param {Object} burdenResult - from compareBurden()
 */
export function updateResults(emissionsResult, burdenResult) {
  const container = document.getElementById('results-summary');

  container.innerHTML = `
    <div class="results-grid">
      <div class="result-card result-card-violet">
        <div class="result-label">Violet Route CO2</div>
        <div class="result-value">${formatCO2(emissionsResult.violet.totalKg)}</div>
        <div class="result-detail">${emissionsResult.violet.breakdown.length} vehicle types</div>
      </div>

      <div class="result-card result-card-red">
        <div class="result-label">Red Route CO2</div>
        <div class="result-value">${formatCO2(emissionsResult.red.totalKg)}</div>
        <div class="result-detail">${emissionsResult.red.breakdown.length} vehicle types</div>
      </div>

      <div class="result-card result-card-savings">
        <div class="result-label">CO2 Savings (Red vs Violet)</div>
        <div class="result-value ${emissionsResult.savingsKg > 0 ? 'positive' : 'negative'}">
          ${emissionsResult.savingsKg > 0 ? '-' : '+'}${formatCO2(Math.abs(emissionsResult.savingsKg))}
        </div>
        <div class="result-detail">${Math.abs(emissionsResult.savingsPercent).toFixed(1)}% ${emissionsResult.savingsPercent > 0 ? 'reduction' : 'increase'}</div>
      </div>

      <div class="result-card result-card-violet">
        <div class="result-label">B1 Pedestrian Burden</div>
        <div class="result-value">${formatBurden(burdenResult.b1.totalBurden)}</div>
        <div class="result-detail">Avg walk: ${burdenResult.b1.avgDistance}m</div>
      </div>

      <div class="result-card result-card-red">
        <div class="result-label">B2 Pedestrian Burden</div>
        <div class="result-value">${formatBurden(burdenResult.b2.totalBurden)}</div>
        <div class="result-detail">Avg walk: ${burdenResult.b2.avgDistance}m</div>
      </div>

      <div class="result-card result-card-savings">
        <div class="result-label">Burden Savings (B2 vs B1)</div>
        <div class="result-value ${burdenResult.savingsBurden > 0 ? 'positive' : 'negative'}">
          ${burdenResult.savingsBurden > 0 ? '-' : '+'}${formatBurden(Math.abs(burdenResult.savingsBurden))}
        </div>
        <div class="result-detail">${Math.abs(burdenResult.savingsPercent).toFixed(1)}% ${burdenResult.savingsPercent > 0 ? 'reduction' : 'increase'}</div>
      </div>
    </div>
  `;
}

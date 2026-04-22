// ===== Analysis Panel =====
// Full-page overlay with deep-dive analytics:
//   - CO₂ equivalence cards
//   - Annual projection
//   - Survey data table
//   - Vehicle-type breakdown doughnut chart
//   - EV "What-If" toggle
//   - Per-vehicle emission metrics

import { VEHICLE_TYPES, CHART_COLORS } from '../config.js';
import { getState, setState, subscribe } from '../state.js';
import { compareRouteEmissions } from '../engine/emissions.js';
import { formatCO2 } from '../utils/format.js';

// Constants
const WORKING_DAYS_PER_YEAR = 250;
const CO2_PER_TREE_PER_DAY_KG = 0.06;       // ~22 kg/year ÷ 365
const CO2_PER_SMARTPHONE_CHARGE_KG = 0.008;  // ~8 g per full charge
const EV_EMISSION_FACTOR = 0;                // zero tailpipe
const EV_FRACTION = 0.25;                    // 25% scenario

// Survey data (real campus observations)
const SURVEY_DATA = [
  { date: '10 Apr 2026', day: 'Friday',   cars: 24, bikes: 38, total: 62 },
  { date: '13 Apr 2026', day: 'Monday',   cars: 28, bikes: 41, total: 69 },
  { date: '16 Apr 2026', day: 'Thursday', cars: 29, bikes: 39, total: 68 },
];

let doughnutChart = null;
let evMode = false;

/**
 * Initialize the analysis panel: button + overlay + event wiring.
 */
export function initAnalysisPanel() {
  createAnalysisButton();
  createAnalysisOverlay();
  wireEvents();
}

/**
 * Update the analysis panel with fresh emission data.
 */
export function updateAnalysisPanel() {
  const panel = document.getElementById('analysis-overlay');
  if (!panel || panel.style.display === 'none') return;
  renderAnalysis();
}

// ---- UI Construction ----

function createAnalysisButton() {
  const headerRight = document.querySelector('.header-right');
  if (!headerRight) return;

  const btn = document.createElement('button');
  btn.id = 'analysis-toggle';
  btn.className = 'analysis-toggle-btn';
  btn.textContent = '📊 Analysis';
  btn.title = 'Open Analysis Dashboard';
  btn.setAttribute('aria-label', 'Open Analysis Dashboard');
  // Insert before the info button
  const infoBtn = document.getElementById('info-toggle');
  if (infoBtn) {
    headerRight.insertBefore(btn, infoBtn);
  } else {
    headerRight.prepend(btn);
  }
}

function createAnalysisOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'analysis-overlay';
  overlay.className = 'analysis-overlay';
  overlay.style.display = 'none';
  overlay.innerHTML = `
    <div class="analysis-panel">
      <div class="analysis-header">
        <h2>📊 Detailed Analysis</h2>
        <button id="close-analysis" class="analysis-close-btn" aria-label="Close Analysis">&times;</button>
      </div>
      <div class="analysis-body" id="analysis-body">
        <!-- Dynamically rendered -->
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function wireEvents() {
  const btn = document.getElementById('analysis-toggle');
  const overlay = document.getElementById('analysis-overlay');
  const closeBtn = document.getElementById('close-analysis');

  if (btn && overlay) {
    btn.addEventListener('click', () => {
      overlay.style.display = 'flex';
      renderAnalysis();
    });
  }

  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  }

  // Subscribe to changes so analysis auto-updates when panel is open
  subscribe('*', () => updateAnalysisPanel());
}

// ---- Rendering ----

function renderAnalysis() {
  const body = document.getElementById('analysis-body');
  if (!body) return;

  const state = getState();
  let { vehicleCounts, routeDistances } = state;

  // Apply EV scenario if toggled
  let evCounts = { ...vehicleCounts };
  if (evMode) {
    evCounts.petrolCar = Math.round(vehicleCounts.petrolCar * (1 - EV_FRACTION));
    evCounts.dieselCar = Math.round(vehicleCounts.dieselCar * (1 - EV_FRACTION));
  }

  const result = compareRouteEmissions(
    evCounts,
    routeDistances.violet || 2.0,
    routeDistances.red || 1.0,
  );

  const originalResult = evMode
    ? compareRouteEmissions(vehicleCounts, routeDistances.violet || 2.0, routeDistances.red || 1.0)
    : null;

  const dailySavingsKg = Math.abs(result.savingsKg);
  const annualSavingsKg = dailySavingsKg * WORKING_DAYS_PER_YEAR;
  const treesEquiv = Math.round(dailySavingsKg / CO2_PER_TREE_PER_DAY_KG);
  const chargesEquiv = Math.round(dailySavingsKg / CO2_PER_SMARTPHONE_CHARGE_KG);
  const betterRoute = result.savingsKg >= 0 ? 'Red Route' : 'Violet Route';

  // Total vehicles
  const totalVehicles = Object.values(evCounts).reduce((a, b) => a + b, 0);
  const perVehicleViolet = totalVehicles > 0 ? (result.violet.totalKg / totalVehicles * 1000).toFixed(1) : '0';
  const perVehicleRed = totalVehicles > 0 ? (result.red.totalKg / totalVehicles * 1000).toFixed(1) : '0';

  body.innerHTML = `
    <!-- EV What-If Toggle -->
    <div class="analysis-section ev-toggle-section">
      <label class="ev-toggle-label">
        <span class="ev-toggle-text">⚡ What if 25% of cars were EVs?</span>
        <div class="ev-switch">
          <input type="checkbox" id="ev-toggle" ${evMode ? 'checked' : ''}>
          <span class="ev-slider"></span>
        </div>
      </label>
      ${evMode && originalResult ? `
        <div class="ev-impact-note">
          <span class="ev-badge">EV Scenario Active</span>
          Petrol cars: ${vehicleCounts.petrolCar} → ${evCounts.petrolCar} &nbsp;|&nbsp;
          Diesel cars: ${vehicleCounts.dieselCar} → ${evCounts.dieselCar} &nbsp;|&nbsp;
          Daily CO₂ saved by EVs: <strong>${formatCO2(originalResult.violet.totalKg - result.violet.totalKg)}</strong> (Violet)
        </div>
      ` : ''}
    </div>

    <!-- CO₂ Equivalence Cards -->
    <div class="analysis-section">
      <h3 class="analysis-section-title">🌍 CO₂ Equivalence — Daily Savings (${betterRoute})</h3>
      <div class="equiv-grid">
        <div class="equiv-card equiv-card-green">
          <div class="equiv-icon">🌳</div>
          <div class="equiv-value">${treesEquiv.toLocaleString()}</div>
          <div class="equiv-label">Trees needed to absorb<br>this CO₂ in one day</div>
        </div>
        <div class="equiv-card equiv-card-blue">
          <div class="equiv-icon">📱</div>
          <div class="equiv-value">${chargesEquiv.toLocaleString()}</div>
          <div class="equiv-label">Smartphone charges<br>equivalent CO₂</div>
        </div>
        <div class="equiv-card equiv-card-amber">
          <div class="equiv-icon">⚖️</div>
          <div class="equiv-value">${formatCO2(dailySavingsKg)}</div>
          <div class="equiv-label">kg CO₂ saved<br>per day</div>
        </div>
      </div>
    </div>

    <!-- Annual Projection -->
    <div class="analysis-section">
      <h3 class="analysis-section-title">📅 Annual Projection (${WORKING_DAYS_PER_YEAR} working days)</h3>
      <div class="annual-grid">
        <div class="annual-card">
          <div class="annual-label">Annual CO₂ — Violet Route</div>
          <div class="annual-value violet-text">${(result.violet.totalKg * WORKING_DAYS_PER_YEAR).toFixed(1)} kg</div>
          <div class="annual-detail">${((result.violet.totalKg * WORKING_DAYS_PER_YEAR) / 1000).toFixed(2)} tonnes/year</div>
        </div>
        <div class="annual-card">
          <div class="annual-label">Annual CO₂ — Red Route</div>
          <div class="annual-value red-text">${(result.red.totalKg * WORKING_DAYS_PER_YEAR).toFixed(1)} kg</div>
          <div class="annual-detail">${((result.red.totalKg * WORKING_DAYS_PER_YEAR) / 1000).toFixed(2)} tonnes/year</div>
        </div>
        <div class="annual-card annual-card-highlight">
          <div class="annual-label">Annual Savings via ${betterRoute}</div>
          <div class="annual-value green-text">${annualSavingsKg.toFixed(1)} kg</div>
          <div class="annual-detail">${(annualSavingsKg / 1000).toFixed(2)} tonnes/year · ${Math.round(annualSavingsKg / CO2_PER_TREE_PER_DAY_KG / 365)} trees worth</div>
        </div>
      </div>
    </div>

    <!-- Per-Vehicle Metrics -->
    <div class="analysis-section">
      <h3 class="analysis-section-title">🚗 Per-Vehicle Emission per Trip</h3>
      <div class="per-vehicle-grid">
        <div class="per-vehicle-card">
          <div class="per-vehicle-route violet-text">Violet Route</div>
          <div class="per-vehicle-value">${perVehicleViolet} g</div>
          <div class="per-vehicle-detail">CO₂ per vehicle · ${result.violet.distanceKm.toFixed(2)} km</div>
        </div>
        <div class="per-vehicle-card">
          <div class="per-vehicle-route red-text">Red Route</div>
          <div class="per-vehicle-value">${perVehicleRed} g</div>
          <div class="per-vehicle-detail">CO₂ per vehicle · ${result.red.distanceKm.toFixed(2)} km</div>
        </div>
      </div>
    </div>

    <!-- Vehicle Breakdown Chart + Survey Data side by side -->
    <div class="analysis-section analysis-two-col">
      <div class="analysis-col">
        <h3 class="analysis-section-title">🍩 Vehicle-Type CO₂ Contribution (Violet)</h3>
        <div class="doughnut-container">
          <canvas id="doughnut-chart"></canvas>
        </div>
      </div>
      <div class="analysis-col">
        <h3 class="analysis-section-title">📋 Campus Survey Data</h3>
        <table class="survey-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Cars</th>
              <th>Bikes</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${SURVEY_DATA.map(row => `
              <tr>
                <td>${row.date}</td>
                <td>${row.day}</td>
                <td>${row.cars}</td>
                <td>${row.bikes}</td>
                <td><strong>${row.total}</strong></td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Average</strong></td>
              <td><strong>${Math.round(SURVEY_DATA.reduce((s, r) => s + r.cars, 0) / SURVEY_DATA.length)}</strong></td>
              <td><strong>${Math.round(SURVEY_DATA.reduce((s, r) => s + r.bikes, 0) / SURVEY_DATA.length)}</strong></td>
              <td><strong>${Math.round(SURVEY_DATA.reduce((s, r) => s + r.total, 0) / SURVEY_DATA.length)}</strong></td>
            </tr>
          </tfoot>
        </table>
        <p class="survey-note">Survey conducted at BTBM parking lot, IIT Hyderabad campus.</p>
      </div>
    </div>
  `;

  // Wire EV toggle
  const evToggle = document.getElementById('ev-toggle');
  if (evToggle) {
    evToggle.addEventListener('change', () => {
      evMode = evToggle.checked;
      renderAnalysis();
    });
  }

  // Render doughnut chart
  renderDoughnutChart(result);
}

function renderDoughnutChart(result) {
  const canvas = document.getElementById('doughnut-chart');
  if (!canvas) return;

  if (doughnutChart) doughnutChart.destroy();

  const labels = result.violet.breakdown.map(b => b.label);
  const data = result.violet.breakdown.map(b => b.co2Kg);
  const colors = CHART_COLORS.vehicleColors;

  doughnutChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            font: { size: 12, family: "'Inter', sans-serif" },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
              return `${ctx.label}: ${ctx.parsed.toFixed(2)} kg (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// ===== Chart Panel =====
// Creates and updates Chart.js instances.
// Charts update via state subscription — they are never destroyed/recreated.

import { CHART_COLORS, VEHICLE_TYPES } from '../config.js';

let emissionsChart = null;
let burdenChart = null;
let breakdownChart = null;

/**
 * Initialize all Chart.js chart instances.
 */
export function initCharts() {
  emissionsChart = createEmissionsChart();
  burdenChart = createBurdenChart();
  breakdownChart = createBreakdownChart();
}

/**
 * Update charts with new calculation results.
 * @param {Object} emissionsResult - from compareRouteEmissions()
 * @param {Object} burdenResult - from compareBurden()
 */
export function updateCharts(emissionsResult, burdenResult) {
  if (emissionsResult && emissionsChart) {
    updateEmissionsChart(emissionsResult);
  }
  if (burdenResult && burdenChart) {
    updateBurdenChart(burdenResult);
  }
  if (emissionsResult && breakdownChart) {
    updateBreakdownChart(emissionsResult);
  }
}

// ---- Emissions Bar Chart ----

function createEmissionsChart() {
  const ctx = document.getElementById('emissions-chart');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Violet Route (B1)', 'Red Route (B2)'],
      datasets: [{
        label: 'CO2 Emissions (kg/day)',
        data: [0, 0],
        backgroundColor: [CHART_COLORS.violet, CHART_COLORS.red],
        borderColor: [CHART_COLORS.violetBorder, CHART_COLORS.redBorder],
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toFixed(2)} kg CO2`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'kg CO2 / day' },
        },
      },
    },
  });
}

function updateEmissionsChart(result) {
  emissionsChart.data.datasets[0].data = [
    result.violet.totalKg,
    result.red.totalKg,
  ];
  emissionsChart.update('none'); // skip animation for responsiveness
}

// ---- Burden Bar Chart ----

function createBurdenChart() {
  const ctx = document.getElementById('burden-chart');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['From B1 (Violet Parking)', 'From B2 (Red Parking)'],
      datasets: [{
        label: 'Pedestrian Burden (person-meters)',
        data: [0, 0],
        backgroundColor: [CHART_COLORS.violet, CHART_COLORS.red],
        borderColor: [CHART_COLORS.violetBorder, CHART_COLORS.redBorder],
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y;
              if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M person-meters`;
              if (val >= 1000) return `${(val / 1000).toFixed(1)}K person-meters`;
              return `${val} person-meters`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Person-Meters / day' },
        },
      },
    },
  });
}

function updateBurdenChart(result) {
  burdenChart.data.datasets[0].data = [
    result.b1.totalBurden,
    result.b2.totalBurden,
  ];
  burdenChart.update('none');
}

// ---- Breakdown Doughnut Chart ----

function createBreakdownChart() {
  const ctx = document.getElementById('breakdown-chart');
  const labels = Object.values(VEHICLE_TYPES).map(v => v.label);

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: labels.map(() => 0),
        backgroundColor: CHART_COLORS.vehicleColors,
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, font: { size: 11 } },
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

function updateBreakdownChart(result) {
  // Use violet route breakdown for the doughnut (shows absolute composition)
  const data = result.violet.breakdown.map(b => b.co2Kg);
  breakdownChart.data.datasets[0].data = data;
  breakdownChart.update('none');
}

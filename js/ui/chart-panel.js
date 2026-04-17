// ===== Chart Panel =====
// Creates and updates Chart.js instances.
// Charts update via state subscription — they are never destroyed/recreated.

import { CHART_COLORS } from '../config.js';

let emissionsChart = null;

/**
 * Initialize all Chart.js chart instances.
 */
export function initCharts() {
  emissionsChart = createEmissionsChart();
}

/**
 * Update charts with new calculation results.
 * @param {Object} emissionsResult - from compareRouteEmissions()
 */
export function updateCharts(emissionsResult) {
  if (emissionsResult && emissionsChart) {
    updateEmissionsChart(emissionsResult);
  }
}

// ---- Emissions Bar Chart ----

function createEmissionsChart() {
  const ctx = document.getElementById('emissions-chart');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Violet Route', 'Red Route'],
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

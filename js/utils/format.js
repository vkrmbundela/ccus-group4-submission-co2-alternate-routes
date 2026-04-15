// ===== Number Formatting Utilities =====

/**
 * Format a number with commas as thousands separator.
 * @param {number} num
 * @param {number} decimals - decimal places (default 0)
 * @returns {string}
 */
export function formatNumber(num, decimals = 0) {
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format CO2 value with unit.
 * @param {number} kg - CO2 in kilograms
 * @returns {string} e.g., "12.5 kg" or "1.2 tonnes"
 */
export function formatCO2(kg) {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} tonnes`;
  }
  return `${kg.toFixed(2)} kg`;
}

/**
 * Format distance with unit.
 * @param {number} meters
 * @returns {string} e.g., "350 m" or "1.2 km"
 */
export function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format pedestrian burden value.
 * @param {number} burden - in person-meters
 * @returns {string}
 */
export function formatBurden(burden) {
  if (burden >= 1000000) {
    return `${(burden / 1000000).toFixed(2)}M person-m`;
  }
  if (burden >= 1000) {
    return `${(burden / 1000).toFixed(1)}K person-m`;
  }
  return `${formatNumber(burden)} person-m`;
}

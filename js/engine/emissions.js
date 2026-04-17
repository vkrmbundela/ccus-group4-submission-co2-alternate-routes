// ===== Phase 1: Vehicular CO2 Emissions Calculator =====
// Pure functions — no DOM, no side effects.
//
// Formula: CO2_kg = vehicleCount * distanceKm * emissionFactor_g_km / 1000

import { VEHICLE_TYPES } from '../config.js';

/**
 * Calculate CO2 emissions for a single route.
 *
 * @param {Object} vehicleCounts - { petrolCar: 80, dieselCar: 40, ... }
 * @param {number} distanceKm - route distance in kilometers
 * @returns {{ totalKg: number, breakdown: Array<{ type: string, label: string, count: number, co2Kg: number }> }}
 */
export function calculateRouteEmissions(vehicleCounts, distanceKm) {
  const breakdown = [];
  let totalKg = 0;

  for (const [type, config] of Object.entries(VEHICLE_TYPES)) {
    const count = vehicleCounts[type] || 0;
    const co2Grams = count * distanceKm * config.emissionFactor;
    const co2Kg = co2Grams / 1000;

    breakdown.push({
      type,
      label: config.label,
      count,
      co2Kg: Math.round(co2Kg * 100) / 100,
    });

    totalKg += co2Kg;
  }

  return {
    distanceKm,
    totalKg: Math.round(totalKg * 100) / 100,
    breakdown,
  };
}

/**
 * Compare emissions between two routes.
 *
 * @param {Object} vehicleCounts
 * @param {number} violetDistanceKm
 * @param {number} redDistanceKm
 * @returns {{ violet: Object, red: Object, savingsKg: number, savingsPercent: number }}
 */
export function compareRouteEmissions(vehicleCounts, violetDistanceKm, redDistanceKm) {
  const violet = calculateRouteEmissions(vehicleCounts, violetDistanceKm);
  const red = calculateRouteEmissions(vehicleCounts, redDistanceKm);

  const savingsKg = Math.round((violet.totalKg - red.totalKg) * 100) / 100;
  const savingsPercent = violet.totalKg > 0
    ? Math.round((savingsKg / violet.totalKg) * 10000) / 100
    : 0;

  return {
    violet,
    red,
    savingsKg,
    savingsPercent,
  };
}

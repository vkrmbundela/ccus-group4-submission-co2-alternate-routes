// ===== Vehicle Distribution Strategy Engine =====
// Pure functions — no DOM, no side effects.
//
// Purpose:
// Suggest how vehicles should be distributed between:
// - Violet route vs Red route
// - Intermediate parking vs end-hub parking (B1/B2)
//
// Inputs considered:
// - Weighted building demand (population * weight)
// - Walking distances from B1/B2 to buildings
// - Route lengths (shorter route is preferred)
// - End-hub overlap (if B1 and B2 are very close, push more to intermediate lots)

import { VEHICLE_TYPES } from '../config.js';

const TYPE_INTERMEDIATE_BIAS = {
  petrolCar: 0.0,
  dieselCar: -0.05,
  twoWheeler: 0.12,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineMeters(aLat, aLon, bLat, bLon) {
  const earthRadius = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function getDemand(building, populations, weights) {
  const population = populations[building.id] ?? building.defaultPopulation;
  const weight = weights[building.id] ?? building.weight;
  return Math.max(0, population) * Math.max(0, weight);
}

function weightedAverageDistance(buildings, populations, weights, key) {
  let weightedDistance = 0;
  let totalDemand = 0;

  for (const building of buildings) {
    const demand = getDemand(building, populations, weights);
    const distance = Number(building[key]) || 0;
    weightedDistance += demand * distance;
    totalDemand += demand;
  }

  return totalDemand > 0 ? weightedDistance / totalDemand : 0;
}

function computeRouteShare(buildings, populations, weights, routeDistances) {
  let violetScore = 0;
  let redScore = 0;

  for (const building of buildings) {
    const demand = getDemand(building, populations, weights);
    const dB1 = Math.max(1, Number(building.distanceFromB1_m) || 1);
    const dB2 = Math.max(1, Number(building.distanceFromB2_m) || 1);

    // Buildings closer to a hub push demand toward that route.
    violetScore += demand / (dB1 + 35);
    redScore += demand / (dB2 + 35);
  }

  const violetLen = Math.max(0.1, Number(routeDistances.violet) || 0.1);
  const redLen = Math.max(0.1, Number(routeDistances.red) || 0.1);

  // Prefer shorter routes when demand competitiveness is similar.
  violetScore /= violetLen;
  redScore /= redLen;

  const total = violetScore + redScore;
  if (total <= 0) {
    return 0.5;
  }

  return clamp(violetScore / total, 0.2, 0.8);
}

function computeAssignedAverageDistances(buildings, populations, weights) {
  let violetDemand = 0;
  let redDemand = 0;
  let violetWeightedDistance = 0;
  let redWeightedDistance = 0;

  for (const building of buildings) {
    const demand = getDemand(building, populations, weights);
    const dB1 = Number(building.distanceFromB1_m) || 0;
    const dB2 = Number(building.distanceFromB2_m) || 0;

    if (dB1 <= dB2) {
      violetDemand += demand;
      violetWeightedDistance += demand * dB1;
    } else {
      redDemand += demand;
      redWeightedDistance += demand * dB2;
    }
  }

  const fallbackB1 = weightedAverageDistance(buildings, populations, weights, 'distanceFromB1_m');
  const fallbackB2 = weightedAverageDistance(buildings, populations, weights, 'distanceFromB2_m');

  return {
    violet: violetDemand > 0 ? violetWeightedDistance / violetDemand : fallbackB1,
    red: redDemand > 0 ? redWeightedDistance / redDemand : fallbackB2,
  };
}

function computeOverlapBoost(parkingHubs) {
  if (!parkingHubs || !parkingHubs.B1 || !parkingHubs.B2) {
    return { separationMeters: 0, overlapBoost: 0 };
  }

  const [b1Lat, b1Lon] = parkingHubs.B1.coordinates;
  const [b2Lat, b2Lon] = parkingHubs.B2.coordinates;
  const separationMeters = haversineMeters(b1Lat, b1Lon, b2Lat, b2Lon);

  // If terminal hubs are close, promote intermediate parking to reduce local congestion.
  let overlapBoost = 0;
  if (separationMeters <= 120) overlapBoost = 0.12;
  else if (separationMeters <= 220) overlapBoost = 0.06;

  return { separationMeters, overlapBoost };
}

function computeIntermediateShare(avgDistance, overlapBoost) {
  const baseShare = 0.28;
  const distanceBoost = clamp((avgDistance - 120) / 500, 0, 0.32);
  return clamp(baseShare + distanceBoost + overlapBoost, 0.25, 0.7);
}

function allocateByShares(total, shares) {
  const keys = Object.keys(shares);
  const sum = keys.reduce((acc, key) => acc + shares[key], 0);

  if (total <= 0 || sum <= 0) {
    const empty = {};
    for (const key of keys) empty[key] = 0;
    return empty;
  }

  const normalized = {};
  for (const key of keys) {
    normalized[key] = shares[key] / sum;
  }

  const raw = {};
  const floorAlloc = {};
  let used = 0;

  for (const key of keys) {
    raw[key] = total * normalized[key];
    floorAlloc[key] = Math.floor(raw[key]);
    used += floorAlloc[key];
  }

  let remainder = total - used;
  const order = [...keys].sort((a, b) => (raw[b] - floorAlloc[b]) - (raw[a] - floorAlloc[a]));

  let idx = 0;
  while (remainder > 0) {
    const key = order[idx % order.length];
    floorAlloc[key] += 1;
    remainder -= 1;
    idx += 1;
  }

  return floorAlloc;
}

function sumVehicleCounts(vehicleCounts) {
  return Object.values(vehicleCounts).reduce((acc, value) => acc + (Number(value) || 0), 0);
}

/**
 * Recommend a distribution strategy for route and parking allocation.
 *
 * @param {Object} args
 * @param {Object} args.vehicleCounts
 * @param {Object} args.routeDistances
 * @param {Array} args.buildings
 * @param {Object} args.populations
 * @param {Object} args.weights
 * @param {Object} args.parkingHubs
 * @returns {Object}
 */
export function calculateVehicleDistributionStrategy({
  vehicleCounts,
  routeDistances,
  buildings,
  populations,
  weights,
  parkingHubs,
}) {
  const totalVehicles = sumVehicleCounts(vehicleCounts);
  if (totalVehicles <= 0) {
    return {
      totalVehicles: 0,
      routeSplit: { violetCount: 0, redCount: 0, violetPct: 0, redPct: 0 },
      routeDetails: {
        violet: { intermediateCount: 0, terminalCount: 0, intermediatePct: 0, terminalPct: 0 },
        red: { intermediateCount: 0, terminalCount: 0, intermediatePct: 0, terminalPct: 0 },
      },
      hubSeparationMeters: 0,
      overlapBoost: 0,
      byType: [],
    };
  }

  const violetRouteShare = computeRouteShare(buildings, populations, weights, routeDistances);
  const assignedAvg = computeAssignedAverageDistances(buildings, populations, weights);
  const { separationMeters, overlapBoost } = computeOverlapBoost(parkingHubs);

  const violetBaseIntermediate = computeIntermediateShare(assignedAvg.violet, overlapBoost);
  const redBaseIntermediate = computeIntermediateShare(assignedAvg.red, overlapBoost);

  const byType = [];
  let violetIntermediateCount = 0;
  let violetTerminalCount = 0;
  let redIntermediateCount = 0;
  let redTerminalCount = 0;

  for (const [type, config] of Object.entries(VEHICLE_TYPES)) {
    const totalTypeCount = Math.max(0, Number(vehicleCounts[type]) || 0);
    const routeAlloc = allocateByShares(totalTypeCount, {
      violet: violetRouteShare,
      red: 1 - violetRouteShare,
    });

    const bias = TYPE_INTERMEDIATE_BIAS[type] || 0;
    const violetIntermediateShare = clamp(violetBaseIntermediate + bias, 0.2, 0.85);
    const redIntermediateShare = clamp(redBaseIntermediate + bias, 0.2, 0.85);

    const violetSplit = allocateByShares(routeAlloc.violet, {
      intermediate: violetIntermediateShare,
      terminal: 1 - violetIntermediateShare,
    });

    const redSplit = allocateByShares(routeAlloc.red, {
      intermediate: redIntermediateShare,
      terminal: 1 - redIntermediateShare,
    });

    violetIntermediateCount += violetSplit.intermediate;
    violetTerminalCount += violetSplit.terminal;
    redIntermediateCount += redSplit.intermediate;
    redTerminalCount += redSplit.terminal;

    byType.push({
      type,
      label: config.label,
      total: totalTypeCount,
      violetIntermediate: violetSplit.intermediate,
      violetTerminal: violetSplit.terminal,
      redIntermediate: redSplit.intermediate,
      redTerminal: redSplit.terminal,
    });
  }

  const violetTotal = violetIntermediateCount + violetTerminalCount;
  const redTotal = redIntermediateCount + redTerminalCount;

  return {
    totalVehicles,
    routeSplit: {
      violetCount: violetTotal,
      redCount: redTotal,
      violetPct: (violetTotal / totalVehicles) * 100,
      redPct: (redTotal / totalVehicles) * 100,
    },
    routeDetails: {
      violet: {
        intermediateCount: violetIntermediateCount,
        terminalCount: violetTerminalCount,
        intermediatePct: violetTotal > 0 ? (violetIntermediateCount / violetTotal) * 100 : 0,
        terminalPct: violetTotal > 0 ? (violetTerminalCount / violetTotal) * 100 : 0,
      },
      red: {
        intermediateCount: redIntermediateCount,
        terminalCount: redTerminalCount,
        intermediatePct: redTotal > 0 ? (redIntermediateCount / redTotal) * 100 : 0,
        terminalPct: redTotal > 0 ? (redTerminalCount / redTotal) * 100 : 0,
      },
    },
    hubSeparationMeters: separationMeters,
    overlapBoost,
    byType,
  };
}

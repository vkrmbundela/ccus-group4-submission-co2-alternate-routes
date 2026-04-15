// ===== Phase 2: Pedestrian Burden Calculator =====
// Pure functions — no DOM, no side effects.
//
// Formula: burden = sum(population * distance_meters * weight) for each building
// Units: person-meters (a measure of total walking effort)

/**
 * Calculate weighted pedestrian burden from a parking hub to all buildings.
 *
 * @param {Array} buildings - array of building objects from buildings.json
 * @param {Object} populations - { buildingId: overriddenPopulation } (user inputs)
 * @param {Object} weights - { buildingId: overriddenWeight } (user inputs)
 * @param {'B1'|'B2'} parkingHub - which parking hub to calculate from
 * @returns {{ totalBurden: number, avgDistance: number, breakdown: Array }}
 */
export function calculateBurden(buildings, populations, weights, parkingHub) {
  const distanceKey = parkingHub === 'B1' ? 'distanceFromB1_m' : 'distanceFromB2_m';
  const breakdown = [];
  let totalBurden = 0;
  let totalPopulation = 0;
  let weightedDistanceSum = 0;

  for (const building of buildings) {
    const population = populations[building.id] ?? building.defaultPopulation;
    const weight = weights[building.id] ?? building.weight;
    const distance = building[distanceKey];

    const burden = population * distance * weight;

    breakdown.push({
      id: building.id,
      name: building.name,
      population,
      weight,
      distance,
      burden: Math.round(burden),
    });

    totalBurden += burden;
    totalPopulation += population;
    weightedDistanceSum += distance * population;
  }

  const avgDistance = totalPopulation > 0
    ? Math.round(weightedDistanceSum / totalPopulation)
    : 0;

  return {
    totalBurden: Math.round(totalBurden),
    avgDistance,
    totalPopulation,
    breakdown,
  };
}

/**
 * Compare pedestrian burden between B1 and B2 parking hubs.
 *
 * @param {Array} buildings
 * @param {Object} populations
 * @param {Object} weights
 * @returns {{ b1: Object, b2: Object, savingsBurden: number, savingsPercent: number }}
 */
export function compareBurden(buildings, populations, weights) {
  const b1 = calculateBurden(buildings, populations, weights, 'B1');
  const b2 = calculateBurden(buildings, populations, weights, 'B2');

  const savingsBurden = b1.totalBurden - b2.totalBurden;
  const savingsPercent = b1.totalBurden > 0
    ? Math.round((savingsBurden / b1.totalBurden) * 10000) / 100
    : 0;

  return {
    b1,
    b2,
    savingsBurden,
    savingsPercent,
  };
}

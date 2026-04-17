// ===== Input Panel =====
// Dynamically generates vehicle count inputs and building population table.
// Buildings are fully customizable: add (via map pick), remove, edit population & weight.
// All changes flow through state.setState().

import { VEHICLE_TYPES } from '../config.js';
import { getState, setState, subscribe } from '../state.js';
import { debounce } from '../utils/debounce.js';

/**
 * Initialize the vehicle input controls.
 */
export function initVehicleInputs() {
  const container = document.getElementById('vehicle-inputs');

  for (const [type, config] of Object.entries(VEHICLE_TYPES)) {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'input-control-group';

    const row = document.createElement('div');
    row.className = 'input-row';

    const label = document.createElement('label');
    label.htmlFor = `vehicle-${type}`;
    let icon = '';
    if (config.icon === 'car' && type === 'petrolCar') icon = '🚗 ';
    else if (config.icon === 'car' && type === 'dieselCar') icon = '🚙 ';
    else if (config.icon === 'bike') icon = '🛵 ';
    
    label.textContent = icon + config.label;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-with-unit';

    const input = document.createElement('input');
    input.type = 'number';
    input.id = `vehicle-${type}`;
    input.name = type;
    input.min = '0';
    input.max = config.max ? config.max.toString() : '5000';
    input.value = config.defaultCount;
    input.setAttribute('aria-label', `Daily count of ${config.label}`);

    const unit = document.createElement('span');
    unit.className = 'input-unit';
    unit.textContent = '/day';

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(unit);

    row.appendChild(label);
    row.appendChild(inputWrapper);
    controlGroup.appendChild(row);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'input-slider';
    slider.min = '0';
    slider.max = config.max ? config.max.toString() : '1000';
    slider.step = '1';
    slider.value = config.defaultCount;
    slider.setAttribute('aria-label', `Adjust daily count of ${config.label}`);
    controlGroup.appendChild(slider);

    container.appendChild(controlGroup);

    const updateState = (val) => {
      const counts = { ...getState('vehicleCounts') };
      counts[type] = Math.max(0, parseInt(val) || 0);
      setState({ vehicleCounts: counts });
    };

    input.addEventListener('input', () => {
      slider.value = input.value;
      updateState(input.value);
    });

    slider.addEventListener('input', () => {
      input.value = slider.value;
      updateState(slider.value);
    });
  }
}

/**
 * Initialize the building population table with the loaded building data.
 * Sets up initial state and subscribes to building list changes for re-rendering.
 * @param {Array} buildings - from buildings.json
 */
export function initBuildingTable(buildings) {
  // Seed state with the initial building list
  const populations = {};
  const weights = {};
  for (const b of buildings) {
    populations[b.id] = b.defaultPopulation;
    weights[b.id] = b.weight;
  }
  setState({
    buildings: [...buildings],
    buildingPopulations: populations,
    buildingWeights: weights,
  });

  // Render the table
  renderBuildingTable();

  // Re-render whenever the building list changes (add/remove)
  subscribe('buildings', () => renderBuildingTable());
}

/**
 * Render (or re-render) the building table rows from current state.
 */
function renderBuildingTable() {
  const tbody = document.getElementById('building-table-body');
  tbody.innerHTML = '';

  const buildings = getState('buildings');
  const populations = { ...getState('buildingPopulations') };
  const weights = { ...getState('buildingWeights') };

  for (const building of buildings) {
    const tr = document.createElement('tr');
    tr.dataset.buildingId = building.id;

    // --- Building name ---
    const nameCell = document.createElement('td');
    nameCell.className = 'building-name-cell';
    nameCell.textContent = building.name;
    const depts = building.departments || [];
    nameCell.title = depts.length > 0
      ? `Departments: ${depts.join(', ')}`
      : building.category || 'Custom';

    // --- Population input ---
    const popCell = document.createElement('td');
    const popInput = document.createElement('input');
    popInput.type = 'number';
    popInput.className = 'table-input';
    popInput.min = '0';
    popInput.max = '10000';
    popInput.value = populations[building.id] ?? building.defaultPopulation;
    popInput.setAttribute('aria-label', `Population for ${building.name}`);

    popInput.addEventListener('input', debounce(() => {
      const pops = { ...getState('buildingPopulations') };
      pops[building.id] = Math.max(0, parseInt(popInput.value) || 0);
      setState({ buildingPopulations: pops });
    }, 150));
    popCell.appendChild(popInput);

    // --- Weight input (now editable) ---
    const weightCell = document.createElement('td');
    const weightInput = document.createElement('input');
    weightInput.type = 'number';
    weightInput.className = 'table-input table-input-weight';
    weightInput.min = '0';
    weightInput.max = '2';
    weightInput.step = '0.1';
    weightInput.value = (weights[building.id] ?? building.weight).toFixed(1);
    weightInput.setAttribute('aria-label', `Weight for ${building.name}`);

    weightInput.addEventListener('input', debounce(() => {
      const w = { ...getState('buildingWeights') };
      w[building.id] = Math.max(0, Math.min(2, parseFloat(weightInput.value) || 0));
      setState({ buildingWeights: w });
    }, 150));
    weightCell.appendChild(weightInput);

    // --- Remove button ---
    const actionCell = document.createElement('td');
    actionCell.className = 'action-cell';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-building';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = `Remove ${building.name}`;
    removeBtn.setAttribute('aria-label', `Remove ${building.name}`);

    removeBtn.addEventListener('click', () => {
      removeBuilding(building.id);
    });
    actionCell.appendChild(removeBtn);

    tr.appendChild(nameCell);
    tr.appendChild(popCell);
    tr.appendChild(weightCell);
    tr.appendChild(actionCell);
    tbody.appendChild(tr);
  }
}

/**
 * Remove a building from the live list and clean up its state entries.
 * @param {string} buildingId
 */
function removeBuilding(buildingId) {
  const buildings = getState('buildings').filter(b => b.id !== buildingId);
  const pops = { ...getState('buildingPopulations') };
  const weights = { ...getState('buildingWeights') };
  delete pops[buildingId];
  delete weights[buildingId];

  // Notify building-markers to remove the map marker
  window.dispatchEvent(new CustomEvent('building-removed', { detail: { buildingId } }));

  setState({ buildings, buildingPopulations: pops, buildingWeights: weights });
}

/**
 * Add a new building (called from building-markers.js after map pick).
 * @param {Object} newBuilding - { id, name, coordinates, distanceFromB1_m, distanceFromB2_m, ... }
 */
export function addBuilding(newBuilding) {
  const buildings = [...getState('buildings'), newBuilding];
  const pops = { ...getState('buildingPopulations') };
  const weights = { ...getState('buildingWeights') };
  pops[newBuilding.id] = newBuilding.defaultPopulation;
  weights[newBuilding.id] = newBuilding.weight;

  setState({ buildings, buildingPopulations: pops, buildingWeights: weights });
}

/**
 * Toggle map pick mode on/off.
 */
export function toggleMapPickMode() {
  setState({ mapPickMode: !getState('mapPickMode') });
}

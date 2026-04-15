# IIT Hyderabad Traffic Segregation Simulation

## Project Description
Interactive web dashboard comparing two traffic routing scenarios (Violet vs Red routes) on the IIT Hyderabad campus. Quantifies vehicular CO2 emissions (Phase 1), weighted pedestrian walking burden (Phase 2), and a route parking distribution recommendation (Phase 3).

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Map:** Leaflet.js 1.9.4 (via CDN, global `L`)
- **Charts:** Chart.js 4.5.1 (via CDN, global `Chart`)
- **Geospatial:** Turf.js 7.3.4 (via CDN, global `turf`)
- **No bundler.** Libraries load as UMD `<script>` tags. App code uses `type="module"`.

## How to Run
```bash
# Option 1
npx serve .

# Option 2
python -m http.server 8080
```
ES modules require HTTP — `file://` will not work.

## Architecture Rules

### Unidirectional Data Flow
```
User Input -> state.setState() -> subscribers recalculate -> UI updates
```
No module directly calls another module's render/update. Everything flows through `js/state.js`.

### Pure Calculation Engine
`js/engine/` modules are **pure functions** — no DOM access, no globals, no side effects. They receive data and return results. This makes them independently testable.

### Config-Driven UI
All constants live in `js/config.js`. Adding a vehicle type or building means editing config/JSON only — zero UI code changes. The UI renders dynamically from config.

### CSS Custom Properties for Theming
All colors and spacing defined in `css/variables.css`. Dark mode overrides in `css/dark-mode.css` via `[data-theme="dark"]` selector on `<html>`.

## Methodology and Approach

### Routing Methodology
- Two terminal hubs are the decision anchors for comparative analysis:
  - `B1`: rear parking behind Academic Block C (Violet terminal)
  - `B2`: rear overflow parking behind Academic Block C (Red terminal)
- Intermediate operational hubs are modeled on-route for each corridor:
  - Red: `R1`, `R2`
  - Violet: `V1`, `V2`
- All hubs are stored in `js/data/routes.json` under `parkingHubs` and rendered through `js/map/route-layer.js`.
- Route geometries should avoid unrealistic local turnarounds near endpoints. Keep final segments directionally consistent with campus circulation.

### Calculation Approach (Current)
- **Phase 1: Emissions (`js/engine/emissions.js`)**
  - Uses route distance (`turf.length`) and vehicle counts by type.
  - Compares Violet vs Red total CO2.
- **Phase 2: Pedestrian Burden (`js/engine/pedestrian.js`)**
  - Uses building metadata fields `distanceFromB1_m` and `distanceFromB2_m`.
  - Compares B1 vs B2 burden in person-meters.
- **Phase 3: Distribution Strategy (`js/engine/distribution.js`)**
  - Recommends vehicle split by route and by parking category (intermediate vs terminal).
  - Inputs include weighted demand (`population * weight`), route lengths, and B1-B2 hub overlap.
  - Output is currently aggregate by route category (for example, Red intermediate total), not per-node allocation (`R1` vs `R2`, `V1` vs `V2`).

### Data Update Workflow
- If `B1`/`B2` coordinates are changed, recompute building distance fields in `js/data/buildings.json`.
- Keep hub coordinates snapped to route polylines where possible to prevent map mismatches.
- After geometry changes, verify:
  - JSON validity
  - route terminal continuity
  - expected marker order along each route

## File Structure
```
├── index.html              # Entry point
├── css/
│   ├── variables.css       # Design tokens
│   ├── layout.css          # CSS Grid, responsive
│   ├── components.css      # Inputs, cards, buttons
│   ├── map.css             # Map container, popups
│   ├── charts.css          # Chart containers
│   ├── dark-mode.css       # Dark theme overrides
│   └── accessibility.css   # Focus, skip link
├── js/
│   ├── main.js             # Entry — wires modules
│   ├── config.js           # Constants, emission factors
│   ├── state.js            # Reactive pub/sub store
│   ├── data/
│   │   ├── routes.json     # GeoJSON route polylines
│   │   └── buildings.json  # Building locations + metadata
│   ├── engine/
│   │   ├── emissions.js    # CO2 calculation
│   │   ├── pedestrian.js   # Pedestrian burden
│   │   └── distribution.js # Route/intermediate parking strategy
│   ├── map/
│   │   ├── map-init.js     # Leaflet setup
│   │   ├── route-layer.js  # Route rendering
│   │   └── building-markers.js
│   ├── ui/
│   │   ├── input-panel.js  # Vehicle + building inputs
│   │   ├── chart-panel.js  # Chart.js charts
│   │   ├── results-display.js
│   │   └── theme-toggle.js
│   └── utils/
│       ├── format.js       # Number formatting
│       └── debounce.js     # Input debouncing
```

## Key Formulas
- **CO2 (kg):** `vehicleCount * distanceKm * emissionFactor_g_km / 1000`
- **Pedestrian Burden (person-meters):** `sum(population * distance_meters * weight)` per building
- **Demand Weight:** `population * weight`

## Emission Factors (g CO2/km) — Sources: ICCT, IEA
| Vehicle Type    | Factor | Source |
|----------------|--------|--------|
| Petrol Car     | 120    | ICCT FY2022-23 Indian fleet avg |
| Diesel Car     | 140    | ICCT diesel fleet avg |
| Two-Wheeler    | 41     | ICCT FY2018-19 |

## Conventions
- Vanilla JS only — no frameworks, no jQuery
- Semantic HTML with ARIA labels
- CSS Grid for layout, Flexbox for components
- camelCase for JS variables/functions, kebab-case for CSS classes and file names
- All map coordinates in [lat, lng] for Leaflet, [lng, lat] in GeoJSON

## Recent Routing Notes
- Both route terminals (`B1`, `B2`) are aligned behind Academic Block C.
- Red intermediate hubs (`R1`, `R2`) and Violet intermediate hubs (`V1`, `V2`) are defined and rendered.
- Marker styling is route-aligned:
  - Red terminals/intermediates use red visual class
  - Violet terminals/intermediates use violet visual class
- Red route endpoint geometry was cleaned to remove an artificial turnaround segment near the rear-hub termination.

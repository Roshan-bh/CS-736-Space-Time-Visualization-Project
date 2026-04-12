# System design

## Architecture

- **Framework**: React (Vite) for UI structure and state.
- **Visualization**: D3.js for geographic paths, scales, axes, map zoom, and layout of the heatmap.
- **Topology**: `topojson-client` converts TopoJSON to GeoJSON features; `d3-geo` provides projection and path generation.

There is **no server** and **no database**. Data is bundled or loaded via URL imports (`?url` for CSV) and static JSON imports for TopoJSON.

## Data flow

1. **Load** — `useVirusData` loads the CSV with `d3.csv` and reads the TopoJSON object (imported as JSON). The hook exposes `geo`, `provinceList`, `weekKeysSorted`, aggregated maps, and derived structures for each view.
2. **Normalize** — `normalizeRows` maps each lab/region string to a canonical province name via `provinceMapping.js`. Rows that cannot be mapped are dropped (see comments in that file to add mappings).
3. **Aggregate** — `aggregateByProvinceWeek` sums tests and positives per province and week for the virus selected in the UI.
4. **Filter by week range** — Week indices are applied to the sorted list of week keys; all three views use the same derived `weeksInRange`.
5. **Derive view data** — Choropleth values are computed per province over the range; the trend series is either national or for the selected province; the heatmap builds a lookup matrix for province × week.

## State management

React `useState` at the top level of `App.jsx` holds:

- `selectedVirus` — which virus columns are read from the CSV.
- `selectedMetric` — positives, tests, or positivity rate (computed as positives / tests × 100).
- `userWeekRange` — `null` means “use the full sorted week list”; otherwise inclusive start/end **indices** into that list. The hook derives clamped `weekRangeIndices` for all views.
- `selectedProvince` — `null` for national trend, or a province name string matching the map.

Tooltip positions for map and heatmap are separate local state objects. The **Reset** control clears the province and sets `userWeekRange` back to `null` (full span).

## Module layout

- `src/utils/constants.js` — CSV column names and virus definitions (edit to match your file).
- `src/utils/provinceMapping.js` — lab → province mapping.
- `src/utils/dataProcessing.js` — aggregation and metric helpers.
- `src/hooks/useVirusData.js` — loading and derived data.
- `src/components/*` — each major visualization as its own component.

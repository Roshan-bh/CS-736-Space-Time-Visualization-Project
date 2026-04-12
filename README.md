# Interactive Space-Time Visualization of Respiratory Virus Activity Across Canada

University-style **Information Visualization** project: a **React + Vite** dashboard with **D3.js** for all charts and maps. It is **frontend-only** (no database, no MongoDB): data comes from local files under `src/data/`.

## What you get

- **Choropleth map** (main view): provinces colored by the selected virus and metric over the selected week range; click to select a province.
- **Time-series chart**: national trend by default; switches to the selected province. Week range is set from the **Filters** sidebar (not on the chart).
- **Heatmap**: provinces × weeks with the same color scale; click a row label to select a province; sort rows geographically or by mean value.

Global controls: virus, metric (positives, tests, positivity rate), week range sliders, reset, selected-region indicator.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`).

## Data files

| File | Purpose |
|------|---------|
| `src/data/RVD_CurrentWeekTable.csv` | Weekly surveillance table (see header in repo; **add your rows** — no fake case counts are committed) |
| `src/data/ProvincesTerritories.topo.json` | Canada provinces/territories boundaries for the map |

Column names must match `src/utils/constants.js` (`CSV_COLUMNS`), or edit that file to match your CSV. Map lab or region strings to provinces in `src/utils/provinceMapping.js`.

## Documentation

- [**CS 837/736 — project alignment & report guide**](docs/CS837-736-project-alignment-and-report-guide.md) (maps course PDF requirements to this app)
- [Project overview](docs/project-overview.md)
- [User tasks and goals](docs/user-tasks-goals.md)
- [System design](docs/system-design.md)
- [Visualization rationale](docs/visualization-rationale.md)
- [Setup and run](docs/setup-and-run.md)

## Stack

- React 19, Vite 8
- D3.js v7
- topojson-client (TopoJSON → GeoJSON), d3-geo projections

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Optional: regenerate TopoJSON

If you have a Canada provinces **GeoJSON** file, you can run `node scripts/geojson-to-topojson.mjs` after placing it as `scripts/canada.geojson` (see [setup-and-run.md](docs/setup-and-run.md)).

## License

Educational project; boundary data bundled for the map was converted from publicly available GeoJSON (see `scripts/`). Replace with your official source if required for publication.

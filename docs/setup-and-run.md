# Setup and run

## Prerequisites

- **Node.js** (LTS recommended) and **npm**.

## Installation

From the project root:

```bash
npm install
```

## Data files

Place your surveillance table and boundary file here:

| File | Location |
|------|----------|
| Weekly CSV | `src/data/RVD_CurrentWeekTable.csv` |
| TopoJSON | `src/data/ProvincesTerritories.topo.json` |

### CSV

The app expects a header row. Column names must match `src/utils/constants.js` (`CSV_COLUMNS`), or you should edit that file to match your headers. Required columns:

- `week`, `date`, `ReportingLaboratory`
- For each virus: `*_Tests` and `*_Positives` columns as configured in `constants.js`

If your CSV uses different lab labels, update **`src/utils/provinceMapping.js`** so each reporting unit maps to a province name that matches the TopoJSON feature `properties.name`.

### TopoJSON

The topology must include an object (e.g. `provinces`) with polygon geometries and a **`name`** property per feature for the province or territory label. The code uses `feature(topology, topology.objects.provinces)`.

If you replace the bundled file, keep the same object name or update `src/hooks/useVirusData.js` to match your object key.

## Run the development server

```bash
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Optional: regenerate TopoJSON from GeoJSON

If you have a Canada provinces GeoJSON file, you can convert it using the provided script (requires `topojson-server`, already a dev dependency):

1. Copy your file to `scripts/canada.geojson`.
2. Run:

```bash
node scripts/geojson-to-topojson.mjs
```

This overwrites `src/data/ProvincesTerritories.topo.json`. Remove `scripts/canada.geojson` afterward if you do not want to commit a large file.

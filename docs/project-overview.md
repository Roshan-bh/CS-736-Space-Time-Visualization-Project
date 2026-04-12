# Project overview

## Description

**Interactive Space-Time Visualization of Respiratory Virus Activity Across Canada** is a single-page React dashboard for exploring weekly respiratory virus surveillance data alongside Canadian provincial and territorial boundaries. The application is **frontend-only**: it loads a local CSV and a local TopoJSON file at build/runtime and does not use any database or backend service.

## Dataset summary

The intended input is **RVD_CurrentWeekTable.csv** (or an equivalently structured file you place at `src/data/RVD_CurrentWeekTable.csv`). Rows are expected to represent reporting units (for example laboratories or regions) over time, with:

- **Time**: `week` (epidemiological week label or number) and/or `date` (reference or week-ending date).
- **Location**: `ReportingLaboratory` (or similar), which is mapped to a province or territory name that matches the map layer.
- **Metrics**: per-virus **test counts** and **positive counts** (for example columns such as `COVID19_Tests`, `COVID19_Positives`, and analogous columns for influenza and RSV).

The repository ships with a **header-only** CSV template so that no fabricated surveillance numbers are committed. You replace or extend this file with your real extract.

The map layer is loaded from **ProvincesTerritories.topo.json** in `src/data/`. The project includes a valid Canada provinces and territories topology so the app runs out of the box; you may replace it with your own official boundary file as long as each feature has a `name` property that aligns with `src/utils/provinceMapping.js` and `src/utils/constants.js`.

## Space–time visualization

“Space–time” here means the analysis combines **where** (province or territory on the map and heatmap rows), **when** (weeks on the time axis and heatmap columns), and **what** (selected virus and metric). The three linked views answer questions about **regional hotspots**, **how a signal evolves over time**, and **how provinces compare across weeks**—using **shared filters** and **aligned colour encodings** (map totals vs matrix cells use separate scales so both remain interpretable).

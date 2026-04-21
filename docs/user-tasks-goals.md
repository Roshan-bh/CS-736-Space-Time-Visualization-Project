# User tasks and goals

## Hypothetical user

**Public health surveillance analyst in Canada**, working with weekly laboratory or regional reporting data. They need to scan the country for elevated activity, drill into a jurisdiction, and compare provinces over the same calendar of weeks—without leaving the dashboard.

## Goals

1. **Monitor regional virus activity over time** — see which provinces show higher values for the selected virus and metric in the current week range.
2. **Investigate time trends for a selected region** — after a province is selected, see how the metric evolves week by week (national view when none is selected).
3. **Compare spatiotemporal patterns across regions** — scan the province × week matrix to spot persistence versus short spikes.

## Tasks

1. **Identify where activity is highest during a selected time period** — use the **choropleth map** (main view) with virus, metric, and week range controls. Darker colors indicate higher values on the shared scale.
2. **Track how a selected virus changes over time in a selected province** — click a province on the map or on a heatmap row label; the **line chart** switches from national aggregate to that province’s series. Use the **week range control** in the Filters sidebar to focus the period.
3. **Compare patterns across provinces and weeks** — use the **heatmap** to compare all provinces across the weeks in range; optionally sort rows by mean value within the range to bring the most active provinces to the top.

## How the visualizations support these tasks

| Task | Map | Trend chart | Heatmap |
|------|-----|-------------|---------|
| Where is it highest? | Primary view encodes region | Context for whether the period is rising or falling | Full matrix of province × week |
| Province trend | Click sets selection | Direct time series for selection | Row encodes the same province |
| Cross-region comparison | One week range at a glance | National vs province comparison | Sortable rows and week columns |

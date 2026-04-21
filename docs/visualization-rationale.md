# Visualization rationale

## Why three linked views?

### 1. Choropleth map (main view)

A **map** is the natural representation for “where” questions across Canada. Coloring provinces by the selected metric (positives, tests, or positivity rate) over the chosen week range supports **task 1**: locating regions with the strongest signal in the current analytic window. Clicking a province ties the **space** selection to the other views.

### 2. Time-series line chart

A **line chart** encodes **time** on a familiar horizontal axis and makes trends and turning points easy to see. Defaulting to a **national aggregate** gives a broad overview; **selecting a province** switches the series to that jurisdiction without changing the metric or virus, supporting **task 2**. The **week range** is adjusted from the sidebar so the temporal view stays aligned with the map and heatmap.

### 3. Heatmap (province × week matrix)

A **heatmap** shows **space and time together** in a compact grid: each row is a province, each column is a week, and color matches the map’s legend. It supports **task 3** by making comparisons across both dimensions obvious—especially with **row sort by mean** to highlight provinces that are consistently high across the selected weeks.

## How they complement each other

- The **map** gives an intuitive geographic picture but **collapses time** into a single range summary.
- The **line chart** focuses on **one place** (or the nation) and **all weeks** in the range, but does not show all provinces at once.
- The **heatmap** trades geographic shape for a **dense matrix** that is ideal for comparing many provinces across many weeks.

Together, they implement **linked views**: shared filters (virus, metric, week range), with **separate colour scales** for regional totals (map) vs province×week cells (heatmap) so counts remain readable in the matrix. The **province** selection is the main link between map, chart, and heatmap rows.

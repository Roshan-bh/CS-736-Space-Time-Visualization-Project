/**
 * FluWatch-style copy for chart (ⓘ) modals: Data guide + Data notes per panel.
 */

export const CHART_INFO = {
  map: {
    title: "Regional activity (choropleth map)",
    guide: [
      "Each province or territory is coloured by the selected metric over your week range (or one week at a time while playback is running). Darker colours mean higher values on the shared yellow–orange–red scale.",
      "Click a province to focus the temporal trend chart on that region versus national. Hover for the value. Use the population-based option when you want to compare regions of different sizes.",
    ],
    notes: [
      "Map values are range totals over the selected weeks for count metrics; positivity uses comparable units with the heatmap when both are shown.",
      "Double-click the map to reset pan/zoom. Use Reset selection to clear the chosen province and restore the full week span (same as the sidebar).",
    ],
  },
  heatmap: {
    title: "Province × week matrix",
    guide: [
      "Rows are the provinces; columns are surveillance weeks inside your range. Colour uses the same ramp as the choropleth; for count metrics the legend’s numeric scale can differ from the map because cells are single-week values while the map aggregates over the range.",
      "Click a row label to select a province for the main trend chart. Hover a cell for that province, week, and value.",
    ],
    notes: [
      "Axis labels show every 4th week; grid lines help align weeks across rows.",
      "When positivity is selected, the heatmap shares the same percentage scale maximum as the map where applicable.",
    ],
  },
  trend: {
    title: "Temporal trend",
    guide: [
      "Weekly series for the selected province compared to the national aggregate, or national alone when no province is selected. Switch between line and bar views.",
      "Open Compare viruses to overlay multiple pathogens on one chart (counts may use stacked or grouped bars depending on metric). With a province selected, Comparison with national may show small-multiple charts below.",
    ],
    notes: [
      "The 5% dashed line (when shown) is a seasonal epidemic reference for positivity.",
      "Filters at left set the virus, metric, and week window for this chart (and for the map/heatmap when visible).",
    ],
  },
  crossCompare: {
    title: "Province & virus comparisons",
    guide: [
      "Choose multiple provinces and viruses to see one chart per virus, with every selected province drawn on each chart. Line and bar views use the same metric and week range as Filters.",
      "Use + Map selection after choosing a province on the Dashboard map, or + Filter virus to align with the virus in Filters.",
    ],
    notes: [
      "Selections are capped to keep the page responsive; reduce checkboxes if you see a “selection too large” message.",
      "This view is independent of which single province drives the main temporal trend on the Dashboard.",
    ],
  },
  compareNational: {
    title: "Comparison with national",
    guide: [
      "When a province is selected, each small chart shows national (grey dashed) vs that province (blue) for one pathogen over the same week range as the main trend.",
      "If you open Compare viruses and check several pathogens, you get one panel per checked virus; otherwise panels use the virus selected in Filters.",
      "Use the same hover behaviour as the main trend chart to read week and values.",
    ],
    notes: [
      "Requires a province selected on the map or heatmap. Line/bar mode matches the temporal trend chart above.",
    ],
  },
};

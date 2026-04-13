/**
 * Guided tour steps for react-joyride.
 * Dashboard steps use [data-tour] in App.jsx and Controls.jsx.
 * From step index {@link TOUR_FIRST_COMPARE_STEP_INDEX} onward, targets live on `/compare`.
 * App.jsx adds async `step.before()` hooks that `navigate()` and wait for the target in the DOM
 * (Joyride only emits STEP_AFTER the target exists, so route changes must happen in `before`).
 */
export const TOUR_FIRST_COMPARE_STEP_INDEX = 12;

export const APP_TOUR_STEPS = [
  {
    target: '[data-tour="app-header"]',
    title: "Welcome",
    content:
      "This walkthrough covers the Dashboard (map, trend, optional matrix) and the Province & virus comparison page\u2014plus filters, multi-virus overlays, and comparison charts. Use Next to follow in order (the tour switches pages when needed).",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-sidebar-nav"]',
    title: "Pages",
    content:
      "Dashboard links the choropleth, temporal trend, and optional province \u00d7 week matrix. Province & virus comparison opens a dedicated page: one chart per selected virus, comparing multiple provinces with the same metric and week range from Filters.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filters-intro"]',
    title: "Filters bar",
    content:
      "All controls here apply together to the map, trend chart, and matrix (when visible) \u2014 same virus, metric, and time window across all views. On the comparison page, only metric and week apply; provinces and viruses are chosen in the main panel.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-virus"]',
    title: "Virus",
    content:
      "Choose which respiratory virus to explore. Changing this updates surveillance-driven views to that pathogen's data.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-metric"]',
    title: "Metric",
    content:
      "Pick what to measure\u2014positivity, positive tests, or test volume. The map and heatmap share the same yellow\u2013orange\u2013red colour ramp; for count metrics, legend numeric ranges can differ between map (range totals) and matrix (weekly cells).",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-week"]',
    title: "Week range",
    content:
      "Drag the two handles to set the inclusive week window. The map aggregates over this range (or animates week-by-week); the trend chart and heatmap columns use weeks inside it.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-reset"]',
    title: "Reset selection",
    content:
      "Clears the selected province and restores the week range to the full span in the data\u2014without changing virus or metric.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-region"]',
    title: "Selected region",
    content:
      "Shows which province is focused for the main trend chart (or national when none is selected). Choose a region from the map or from heatmap row labels when the matrix is visible.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-matrix-toggle"]',
    title: "Province \u00d7 week matrix",
    content:
      "Turn this on to show the heatmap beside the choropleth on wide screens (stacked on small screens), or off to give the map the full width. The matrix uses the same colour ramp as the map; click row labels to select a province; hover cells for values.",
    placement: "bottom",
  },
  {
    target: '[data-tour="panel-map"]',
    title: "Regional map",
    content:
      "Colours show the selected metric over your week range. Click a province to focus the trend chart; hover for tooltips. Use Play weeks to animate one week at a time. Zoom and pan, or double-click to reset the view. Reset selection on the map clears the province like the sidebar control.",
    placement: "left",
  },
  {
    target: '[data-tour="panel-trend"]',
    title: "Temporal trend",
    content:
      "Weekly series for the selected province versus national, or national alone. Switch Line or Bars. With Compare viruses enabled and a province selected, Comparison with national small multiples can appear below. Hover for week and values.",
    placement: "left",
  },
  {
    target: '[data-tour="tour-trend-compare-viruses"]',
    title: "Compare viruses (Dashboard)",
    content:
      "Open this to overlay multiple pathogens on the same trend chart (national, or province-specific when a region is selected). Check viruses individually or use Select all. The map and heatmap still follow the virus chosen in Filters above.",
    placement: "left",
  },
  {
    target: '[data-tour="panel-cross-compare"]',
    title: "Province & virus comparison page",
    content:
      "You're on the comparison page (or it opens when you reach this step). Metric and week range in the sidebar still apply. Pick any number of provinces and up to the max number of virus panels; each virus gets its own chart comparing all selected provinces. Use + Map selection after selecting a region on the Dashboard map.",
    placement: "left",
  },
  {
    target: '[data-tour="tour-compare-quick"]',
    title: "Quick actions",
    content:
      "+ Map selection adds the province currently selected on the Dashboard map (visit the map first if disabled). + Filter virus ensures the virus from the main Filters dropdown is included. Clear buttons reset province or virus lists.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-compare-grids"]',
    title: "Provinces and viruses",
    content:
      "Check provinces and viruses to build your comparison. Limits apply when the selection is too large\u2014reduce checkboxes if you see a warning. Choose Line or Bars for all panels once both lists are non-empty and weeks exist in range.",
    placement: "left",
  },
];

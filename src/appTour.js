/**
 * Guided tour steps for react-joyride.
 * Dashboard steps use [data-tour] in App.jsx and Controls.jsx.
 * From step index {@link TOUR_FIRST_COMPARE_STEP_INDEX} onward, targets live on `/compare`.
 */
export const TOUR_FIRST_COMPARE_STEP_INDEX = 12;

export const APP_TOUR_STEPS = [
  {
    target: '[data-tour="app-header"]',
    title: "Welcome",
    content:
      "This walkthrough covers the Dashboard (map, trend, optional matrix) and the Province & virus comparison page\u2014plus filters, multi-virus overlays, and comparison charts. Use Next to follow in order.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-sidebar-nav"]',
    title: "Pages",
    content:
      "Dashboard links the choropleth map, temporal trend, and optional Province \u00d7 Week matrix. Province & virus comparison opens a dedicated page for comparing multiple provinces side by side.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filters-intro"]',
    title: "Filters bar",
    content:
      "All controls here apply across the map, trend chart, and matrix \u2014 same virus, metric, and province selection throughout the dashboard.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-virus"]',
    title: "Virus",
    content:
      "Choose which respiratory virus to explore. Changing this updates the map and trend chart to that pathogen\u2019s surveillance data.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-metric"]',
    title: "Metric",
    content:
      "Pick what to measure \u2014 positivity rate, positive test count, or total test volume. The map and heatmap share the same colour ramp.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-province"]',
    title: "Province filter",
    content:
      "Select a province from the dropdown to focus the trend chart and map highlight on that region. Defaults to \u2018All provinces\u2019 (national view). You can also click directly on the map to select a province.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-filter-reset"]',
    title: "Reset",
    content:
      "Clears the selected province and restores the week range to the full data span \u2014 without changing virus or metric.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-matrix-toggle"]',
    title: "Province \u00d7 week matrix",
    content:
      "Turn this on to show the heatmap beside the choropleth on wide screens, or off to give the map the full width. Click row labels in the matrix to select a province.",
    placement: "bottom",
  },
  {
    target: '[data-tour="panel-map"]',
    title: "Regional map",
    content:
      "Colours show the selected metric over your week range. Click a province to focus the trend chart; hover for tooltips. Use Play weeks to animate one week at a time. The right sidebar shows the colour legend and province detail stats.",
    placement: "left",
  },
  {
    target: '[data-tour="tour-filter-week"]',
    title: "Week range",
    content:
      "Drag the two handles to set the inclusive week window. The map aggregates over this range (or animates week-by-week when playing); the trend chart and heatmap use weeks inside it.",
    placement: "top",
  },
  {
    target: '[data-tour="panel-trend"]',
    title: "Temporal trend",
    content:
      "Weekly series for the selected province versus national, or national alone when no province is chosen. Switch Line or Bars. Hover for week values.",
    placement: "left",
  },
  {
    target: '[data-tour="tour-trend-compare-viruses"]',
    title: "Compare viruses (Dashboard)",
    content:
      "Open this to overlay multiple pathogens on the same trend chart. Check viruses individually or use Select all. The map and heatmap still follow the virus chosen in Filters above.",
    placement: "left",
  },
  {
    target: '[data-tour="panel-cross-compare"]',
    title: "Province & virus comparison page",
    content:
      "You\u2019re on the comparison page. Select provinces and viruses using the checkboxes, then use the week range bar below the selection to set your time window. Each virus gets its own chart comparing all selected provinces.",
    placement: "left",
  },
  {
    target: '[data-tour="tour-compare-quick"]',
    title: "Quick actions",
    content:
      "+ Map selection adds the province currently focused on the Dashboard map. + Filter virus ensures the virus from Filters is included. Clear buttons reset province or virus lists.",
    placement: "bottom",
  },
  {
    target: '[data-tour="tour-compare-grids"]',
    title: "Provinces and viruses",
    content:
      "Check provinces and viruses to build your comparison. Limits apply when the selection is too large \u2014 reduce checkboxes if you see a warning. The week range bar below lets you set the time window.",
    placement: "left",
  },
];

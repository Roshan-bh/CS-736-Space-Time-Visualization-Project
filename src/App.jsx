import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Joyride, EVENTS, STATUS } from "react-joyride";

import "./App.css";

import Controls from "./components/Controls.jsx";
import CanadaMap from "./components/CanadaMap.jsx";
import TrendChart from "./components/TrendChart.jsx";
import CompareNationalGrid from "./components/CompareNationalGrid.jsx";
import CrossProvinceVirusSection from "./components/CrossProvinceVirusSection.jsx";
import Heatmap from "./components/Heatmap.jsx";
import Legend from "./components/Legend.jsx";
import ChartInfoButton from "./components/ChartInfoButton.jsx";
import Tooltip from "./components/Tooltip.jsx";
import {
  METRIC_OPTIONS,
  VIRUS_OPTIONS,
  CANADA_TERRITORY_NAMES,
  TERRITORY_SPARSE_TEST_THRESHOLD,
} from "./utils/constants.js";
import { useVirusData } from "./hooks/useVirusData.js";
import { APP_TOUR_STEPS, TOUR_FIRST_COMPARE_STEP_INDEX } from "./appTour.js";
import { choroplethScaleYlOrRd } from "./utils/colorScales.js";
import {
  crossCompareByVirusPanels,
  sumMetricByProvinceOverWeeks,
} from "./utils/dataProcessing.js";

/**
 * After `navigate()`, wait until the tour target is in the DOM.
 * Joyride resolves targets only after `step.before()` completes; `STEP_BEFORE` events fire too late for route changes.
 */
function waitForTourTarget(selector, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      resolve(undefined);
      return;
    }
    const t0 = Date.now();
    const id = window.setInterval(() => {
      if (document.querySelector(selector)) {
        window.clearInterval(id);
        resolve(undefined);
      } else if (Date.now() - t0 > timeoutMs) {
        window.clearInterval(id);
        reject(new Error(`Tour target not found in time: ${selector}`));
      }
    }, 40);
  });
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const [selectedVirus, setSelectedVirus] = useState("covid19");
  const [selectedMetric, setSelectedMetric] = useState("positivity");
  const [userWeekRange, setUserWeekRange] = useState(/** @type {[number, number] | null} */ (null));
  const [selectedProvince, setSelectedProvince] = useState(/** @type {string | null} */ (null));

  const [mapTip, setMapTip] = useState(
    /** @type {null | { x: number, y: number, province: string }} */ (null)
  );
  const [cellTip, setCellTip] = useState(
    /** @type {null | { x: number, y: number, province: string, week: string, value: number }} */ (null)
  );
  const [trendTip, setTrendTip] = useState(
    /** @type {null | { x: number, y: number, weekKey: string, entries: { label: string, value: number }[] }} */ (
      null
    )
  );
  const [runTour, setRunTour] = useState(false);
  /** When starting the tour from /compare, navigate to / first, then set runTour. */
  const [tourPendingNavigateHome, setTourPendingNavigateHome] = useState(false);

  /** Choropleth week animation: steps one week at a time through the selected range. */
  const [mapPlayback, setMapPlayback] = useState({ active: false, index: 0 });

  /** Temporal trend: line chart vs grouped bar chart. */
  const [trendChartMode, setTrendChartMode] = useState(
    /** @type {'line' | 'bar'} */ ("line")
  );

  /** Multi-virus bar chart: grouped columns vs stacked (counts only; misleading for %). */
  const [barLayout, setBarLayout] = useState(
    /** @type {'grouped' | 'stacked'} */ ("stacked")
  );

  /** Multi-virus lines on the temporal trend (checkboxes). */
  const [comparePanelOpen, setComparePanelOpen] = useState(false);
  const [compareCheckedIds, setCompareCheckedIds] = useState(
    /** @type {import('./utils/constants.js').VirusId[]} */ ([])
  );
  /** When on, heatmap sits beside the map; when off, map uses full width. */
  const [showProvinceWeekMatrix, setShowProvinceWeekMatrix] = useState(false);
  /** Wide layout only: share of row width for the map panel (heatmap gets the rest); 18–82. */
  const [mapHeatmapSplitPct, setMapHeatmapSplitPct] = useState(50);

  /** Multi-province × multi-virus line chart (independent of map selection). */
  const [crossCompareExpanded, setCrossCompareExpanded] = useState(false);
  const [crossProvinceIds, setCrossProvinceIds] = useState(/** @type {string[]} */ ([]));
  const [crossVirusIds, setCrossVirusIds] = useState(
    /** @type {import('./utils/constants.js').VirusId[]} */ (["covid19"])
  );
  const [crossCompareChartMode, setCrossCompareChartMode] = useState(
    /** @type {'line' | 'bar'} */ ("line")
  );

  const selectAllCheckboxRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const mapRowRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const compareVirusIdsForHook = comparePanelOpen ? compareCheckedIds : [];

  const data = useVirusData(
    selectedVirus,
    selectedMetric,
    userWeekRange,
    selectedProvince,
    compareVirusIdsForHook
  );

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (!el) return;
    el.indeterminate =
      compareCheckedIds.length > 0 &&
      compareCheckedIds.length < VIRUS_OPTIONS.length;
  }, [compareCheckedIds]);

  const toggleComparePanel = useCallback(() => {
    setComparePanelOpen((open) => {
      if (!open) {
        setCompareCheckedIds((prev) =>
          prev.includes(selectedVirus) ? prev : [...prev, selectedVirus]
        );
      } else {
        setCompareCheckedIds([]);
      }
      return !open;
    });
  }, [selectedVirus]);

  const { weekKeysSorted, weekRangeIndices } = data;

  const weeksInRange = data.weeksInRange;

  const canPlayback = weeksInRange.length >= 2;
  const playbackRunning = mapPlayback.active && canPlayback;
  const playbackIndex = Math.min(
    mapPlayback.index,
    Math.max(0, weeksInRange.length - 1)
  );

  useEffect(() => {
    if (!playbackRunning) return;
    const id = setInterval(() => {
      setMapPlayback((p) => ({
        ...p,
        index: (p.index + 1) % weeksInRange.length,
      }));
    }, 1100);
    return () => clearInterval(id);
  }, [playbackRunning, weeksInRange.length]);

  const choroplethForMap = useMemo(() => {
    if (weeksInRange.length === 0) return new Map();
    if (playbackRunning) {
      const wk = weeksInRange[playbackIndex];
      return sumMetricByProvinceOverWeeks(
        data.agg,
        data.provinceList,
        [wk],
        selectedMetric
      );
    }
    return data.choroplethByProvince;
  }, [
    playbackRunning,
    playbackIndex,
    weeksInRange,
    data.agg,
    data.provinceList,
    data.choroplethByProvince,
    selectedMetric,
  ]);

  /** Same week window as the map (range or single week when playing) — all three metrics for tooltips. */
  const choroplethMapsByMetric = useMemo(() => {
    if (weeksInRange.length === 0) {
      return {
        positives: new Map(),
        tests: new Map(),
        positivity: new Map(),
      };
    }
    const weekSlice = playbackRunning
      ? [weeksInRange[playbackIndex]]
      : weeksInRange;
    return {
      positives: sumMetricByProvinceOverWeeks(
        data.agg,
        data.provinceList,
        weekSlice,
        "positives"
      ),
      tests: sumMetricByProvinceOverWeeks(
        data.agg,
        data.provinceList,
        weekSlice,
        "tests"
      ),
      positivity: sumMetricByProvinceOverWeeks(
        data.agg,
        data.provinceList,
        weekSlice,
        "positivity"
      ),
    };
  }, [
    playbackRunning,
    playbackIndex,
    weeksInRange,
    data.agg,
    data.provinceList,
  ]);

  const mapVals = useMemo(
    () => [...choroplethForMap.values()],
    [choroplethForMap]
  );
  const heatVals = useMemo(() => {
    const vals = [];
    for (const row of data.heatmap.lookup.values()) {
      for (const v of row.values()) vals.push(v);
    }
    return vals;
  }, [data.heatmap.lookup]);

  const mapMax = d3.max(mapVals) ?? 0;
  const heatMax = d3.max(heatVals) ?? 0;

  const mapColorScale = useMemo(() => {
    const max =
      selectedMetric === "positivity"
        ? Math.max(mapMax, heatMax, 1e-9)
        : Math.max(mapMax, 1e-9);
    return choroplethScaleYlOrRd(0, max);
  }, [selectedMetric, mapMax, heatMax]);

  const heatmapColorScale = useMemo(() => {
    const max =
      selectedMetric === "positivity"
        ? Math.max(mapMax, heatMax, 1e-9)
        : Math.max(heatMax, 1e-9);
    return choroplethScaleYlOrRd(0, max);
  }, [selectedMetric, mapMax, heatMax]);

  const sparseTerritoryProvinces = useMemo(() => {
    const sparse = new Set();
    const wkSet = new Set(weeksInRange);
    const sums = new Map(CANADA_TERRITORY_NAMES.map((n) => [n, 0]));
    for (const [, row] of data.agg) {
      if (!wkSet.has(row.weekKey)) continue;
      if (sums.has(row.province)) {
        sums.set(row.province, (sums.get(row.province) ?? 0) + row.tests);
      }
    }
    for (const p of CANADA_TERRITORY_NAMES) {
      if ((sums.get(p) ?? 0) < TERRITORY_SPARSE_TEST_THRESHOLD) sparse.add(p);
    }
    return sparse;
  }, [data.agg, weeksInRange]);

  const metricLabel =
    METRIC_OPTIONS.find((m) => m.id === selectedMetric)?.label ?? selectedMetric;

  const legendFormat = useCallback(
    (v) => {
      if (selectedMetric === "positivity") return `${d3.format(".1f")(v)}%`;
      return d3.format(",.0f")(v);
    },
    [selectedMetric]
  );

  const formatMetricValueById = useCallback(
    /** @param {import('./utils/constants.js').MetricId} metricId */
    (metricId, v) => {
      const n = v == null || Number.isNaN(v) ? 0 : v;
      if (metricId === "positivity") return `${d3.format(".1f")(n)}%`;
      return d3.format(",.0f")(n);
    },
    []
  );

  const playbackWeekLabel =
    weeksInRange.length > 0 ? weeksInRange[playbackIndex] : "—";

  const mapLegendFootnote = [
    sparseTerritoryProvinces.size > 0
      ? "Hatched regions: northern territories with low reported test volume — interpret cautiously."
      : null,
    selectedMetric === "positivity"
      ? "Same scale maximum as the heatmap (percent)."
      : "Map shows totals over the selected weeks; heatmap cells are single-week values.",
  ]
    .filter(Boolean)
    .join(" ");

  const heatLegendFootnote =
    selectedMetric === "positivity"
      ? "Same colour ramp and scale maximum as the map (%)."
      : "Same yellow–orange–red ramp as the map; weekly cell max differs from map range totals.";

  const mapPanelMetricNote = playbackRunning
    ? "Map shows one week at a time while playing (same units as when paused over the full range)."
    : "Map values total the metric over all selected weeks (one colour per province).";

  const heatmapPanelMetricNote =
    selectedMetric === "positivity"
      ? "Each cell is one province in one week; colours match the choropleth legend (same ramp and % scale)."
      : "Each cell is one province in one week; same colour ramp as the map, with a weekly max (map uses range totals).";

  const countMetrics = selectedMetric === "positives" || selectedMetric === "tests";
  const compareBarCount = comparePanelOpen ? compareCheckedIds.length : 0;
  const showBarLayoutToggle =
    trendChartMode === "bar" && comparePanelOpen && compareBarCount >= 2 && countMetrics;

  const trendLines = useMemo(() => {
    const palette = [...d3.schemeTableau10, ...d3.schemeSet2, ...d3.schemeCategory10];
    if (comparePanelOpen) {
      if (!compareCheckedIds.length) return [];
      return data.compareMultiSeries.map((row, i) => ({
        key: row.virusId,
        label: row.label,
        series: row.series,
        color: palette[i % palette.length],
        strokeWidth: 2,
      }));
    }
    const nat = data.nationalTrendSeries;
    if (!nat?.length) return [];
    if (selectedProvince && data.provinceTrendSeries?.length) {
      return [
        {
          key: "nat",
          label: "National",
          series: nat,
          color: "#94a3b8",
          dash: "4 3",
          strokeWidth: 1.35,
        },
        {
          key: "prov",
          label: selectedProvince,
          series: data.provinceTrendSeries,
          color: "#0c4a6e",
          strokeWidth: 2.25,
        },
      ];
    }
    return [
      {
        key: "nat",
        label: "National",
        series: nat,
        color: "#0c4a6e",
        strokeWidth: 2,
      },
    ];
  }, [
    comparePanelOpen,
    compareCheckedIds,
    data.compareMultiSeries,
    data.nationalTrendSeries,
    data.provinceTrendSeries,
    selectedProvince,
  ]);

  const MAX_CROSS_PROVINCES = 20;
  const MAX_CROSS_VIRUS_PANELS = 12;

  const crossComparePanels = useMemo(() => {
    if (
      !data.records?.length ||
      weeksInRange.length === 0 ||
      crossProvinceIds.length === 0 ||
      crossVirusIds.length === 0
    ) {
      return [];
    }
    if (
      crossProvinceIds.length > MAX_CROSS_PROVINCES ||
      crossVirusIds.length > MAX_CROSS_VIRUS_PANELS
    ) {
      return [];
    }
    return crossCompareByVirusPanels(
      data.records,
      crossProvinceIds,
      crossVirusIds,
      weeksInRange,
      selectedMetric
    );
  }, [
    data.records,
    crossProvinceIds,
    crossVirusIds,
    weeksInRange,
    selectedMetric,
  ]);

  const crossCompareSelectionTooLarge =
    crossProvinceIds.length > MAX_CROSS_PROVINCES ||
    crossVirusIds.length > MAX_CROSS_VIRUS_PANELS;

  const toggleCrossProvince = useCallback((p) => {
    setCrossProvinceIds((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }, []);

  const toggleCrossVirus = useCallback((vid) => {
    setCrossVirusIds((prev) =>
      prev.includes(vid) ? prev.filter((x) => x !== vid) : [...prev, vid]
    );
  }, []);

  const onUseMapProvinceForCross = useCallback(() => {
    if (!selectedProvince) return;
    setCrossProvinceIds((prev) =>
      prev.includes(selectedProvince) ? prev : [...prev, selectedProvince]
    );
  }, [selectedProvince]);

  const onUseFilterVirusForCross = useCallback(() => {
    setCrossVirusIds((prev) =>
      prev.includes(selectedVirus) ? prev : [...prev, selectedVirus]
    );
  }, [selectedVirus]);

  const onMapHover = useCallback((payload) => {
    setMapTip(payload);
  }, []);

  const onCellHover = useCallback((payload) => {
    setCellTip(payload);
  }, []);

  const onTrendHover = useCallback((payload) => {
    setTrendTip(payload);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedProvince(null);
    setUserWeekRange(null);
  }, []);

  const handleMapHeatmapSplitPointerDown = useCallback(
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      const row = mapRowRef.current;
      if (!row) return;
      const startX = e.clientX;
      const startSplit = mapHeatmapSplitPct;
      const rowW = row.getBoundingClientRect().width;
      const splitterEl = row.querySelector(".map-heatmap-splitter");
      const splitW = splitterEl?.getBoundingClientRect().width ?? 0;
      const wAvail = Math.max(1, rowW - splitW);
      if (wAvail < 1) return;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const deltaPct = (dx / wAvail) * 100;
        let next = startSplit + deltaPct;
        next = Math.max(18, Math.min(82, next));
        setMapHeatmapSplitPct(next);
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", cleanup);
        window.removeEventListener("pointercancel", cleanup);
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", cleanup);
      window.addEventListener("pointercancel", cleanup);
    },
    [mapHeatmapSplitPct]
  );

  useEffect(() => {
    if (!tourPendingNavigateHome || location.pathname !== "/") return undefined;
    const id = window.setTimeout(() => {
      setTourPendingNavigateHome(false);
      setRunTour(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [tourPendingNavigateHome, location.pathname]);

  const startGuidedTour = useCallback(() => {
    if (location.pathname !== "/") {
      setTourPendingNavigateHome(true);
      navigate("/");
    } else {
      setRunTour(true);
    }
  }, [location.pathname, navigate]);

  const tourSteps = useMemo(() => {
    const dashboardBeforeCompare = TOUR_FIRST_COMPARE_STEP_INDEX - 1;
    return APP_TOUR_STEPS.map((step, i) => {
      if (i === TOUR_FIRST_COMPARE_STEP_INDEX) {
        return {
          ...step,
          before: () =>
            new Promise((resolve, reject) => {
              if (locationRef.current.pathname === "/compare") {
                resolve(undefined);
                return;
              }
              navigate("/compare");
              waitForTourTarget('[data-tour="panel-cross-compare"]')
                .then(resolve)
                .catch(reject);
            }),
        };
      }
      if (i === dashboardBeforeCompare) {
        return {
          ...step,
          before: () =>
            new Promise((resolve, reject) => {
              if (locationRef.current.pathname === "/") {
                resolve(undefined);
                return;
              }
              navigate("/");
              waitForTourTarget('[data-tour="tour-trend-compare-viruses"]')
                .then(resolve)
                .catch(reject);
            }),
        };
      }
      return step;
    });
  }, [navigate]);

  const handleJoyrideEvent = useCallback((eventData) => {
    if (eventData.type === EVENTS.TOUR_END) {
      setRunTour(false);
      return;
    }
    if (
      eventData.type === EVENTS.TOUR_STATUS &&
      (eventData.status === STATUS.FINISHED || eventData.status === STATUS.SKIPPED)
    ) {
      setRunTour(false);
    }
  }, []);

  const loadError = data.loadState.status === "error" && data.loadState.error;

  return (
    <div className="app">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        scrollToFirstStep
        onEvent={handleJoyrideEvent}
        options={{
          showProgress: true,
          primaryColor: "#0c4a6e",
          zIndex: 10000,
          buttons: ["back", "skip", "close", "primary"],
          skipBeacon: true,
          targetWaitTimeout: 2500,
        }}
      />

      <header className="app-header" data-tour="app-header">
        <div className="app-header-top">
          <h1>Interactive Space-Time Visualization of Respiratory Virus Activity Across Canada</h1>
          <button
            type="button"
            className="btn-tour"
            onClick={startGuidedTour}
            aria-label="Start guided tour of the dashboard and comparison page"
          >
            Take a tour
          </button>
        </div>
        <p className="subtitle">
          {location.pathname === "/compare"
            ? "Compare multiple provinces and viruses using the same metric and week range as in Filters. Add the map-selected province with + Map selection after choosing a region on the Dashboard map."
            : "Linked views for surveillance analysts: regional patterns (map), temporal trends (line chart), and province–week comparison (heatmap). Open Province & virus comparison above for multi-region charts."}
        </p>
      </header>

      {loadError && (
        <div className="banner error" role="alert">
          Could not load CSV: {loadError}. Ensure <code>RVD_CurrentWeekTable.csv</code> is in{" "}
          <code>src/data/</code>.
        </div>
      )}

      {data.loadState.status === "ready" &&
        (!data.loadState.rawRows || data.loadState.rawRows.length === 0) && (
        <div className="banner warn" role="status">
          CSV is empty (header only). Add surveillance rows to <code>src/data/RVD_CurrentWeekTable.csv</code>{" "}
          and save — Vite will hot-reload.
        </div>
      )}

      <div className="app-body">
        <aside className="filters-sidebar" aria-label="Data filters">
          <nav className="sidebar-nav" aria-label="Pages" data-tour="tour-sidebar-nav">
            <Link
              to="/"
              className={`sidebar-nav-link${location.pathname === "/" ? " sidebar-nav-link--active" : ""}`}
            >
              Dashboard
            </Link>
            <Link
              to="/compare"
              className={`sidebar-nav-link${location.pathname === "/compare" ? " sidebar-nav-link--active" : ""}`}
            >
              Province & virus comparison
            </Link>
          </nav>
          <Controls
            selectedVirus={selectedVirus}
            onVirus={setSelectedVirus}
            selectedMetric={selectedMetric}
            onMetric={setSelectedMetric}
            weekKeysSorted={weekKeysSorted}
            weekRangeIndices={weekRangeIndices}
            onWeekRangeIndices={setUserWeekRange}
            selectedProvince={selectedProvince}
            onReset={handleReset}
            showProvinceWeekMatrix={showProvinceWeekMatrix}
            onShowProvinceWeekMatrix={setShowProvinceWeekMatrix}
            comparePage={location.pathname === "/compare"}
          />
        </aside>

        <main
          className={
            location.pathname === "/compare"
              ? "dashboard dashboard--compare-page"
              : "dashboard"
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <>
          <div
            ref={mapRowRef}
            className={
              showProvinceWeekMatrix
                ? "dashboard-map-row dashboard-map-row--split"
                : "dashboard-map-row dashboard-map-row--map-only"
            }
          >
          <section
            className="panel panel-map"
            data-tour="panel-map"
            style={
              showProvinceWeekMatrix
                ? { flex: `${mapHeatmapSplitPct} 1 0`, minWidth: 0 }
                : undefined
            }
          >
            <div className="panel-heading-row">
              <h2>Regional Activity (Choropleth Map)</h2>
              <ChartInfoButton chartId="map" />
            </div>
            <p className="panel-metric-note">{mapPanelMetricNote}</p>
            <p className="panel-desc">
              {playbackRunning
                ? `Animation: one week at a time (${playbackWeekLabel}). Pause to explore a static map again.`
                : "Values aggregate the selected metric over the week range (or use Play to step through weeks). Click a province to compare its trend to the national line. Scroll or pinch to zoom, drag to pan; double-click the map to reset the view."}
            </p>
            <div className="map-toolbar">
              <button
                type="button"
                className="btn-playback"
                onClick={() =>
                  setMapPlayback((p) =>
                    p.active
                      ? { active: false, index: p.index }
                      : { active: true, index: 0 }
                  )
                }
                disabled={weeksInRange.length < 2}
                aria-pressed={playbackRunning}
              >
                {playbackRunning ? "⏸ Pause" : "▶ Play weeks"}
              </button>
              <span className="map-playback-label" aria-live="polite">
                {playbackRunning
                  ? ``
                  : weeksInRange.length > 0
                    ? `Range: ${weeksInRange[0]}–${weeksInRange[weeksInRange.length - 1]}`
                    : "No weeks"}
              </span>
            </div>
            <div className="map-legend-row">
              <Legend
                key={`map-legend-${selectedMetric}-${playbackRunning ? "play" : "range"}`}
                title={`${metricLabel} (map — ${playbackRunning ? "single week" : "range total"})`}
                colorScale={mapColorScale}
                format={legendFormat}
                footnote={mapLegendFootnote}
                height={sparseTerritoryProvinces.size ? 102 : 96}
              />
            </div>
            {playbackRunning && (
              <p className="map-week-title" role="status" aria-live="polite">
                Showing <strong>week {playbackWeekLabel}</strong>
                <span className="map-week-title-meta">
                  {" "}
                  ({playbackIndex + 1} of {weeksInRange.length} in range)
                </span>
              </p>
            )}
            {data.geo && (
              <div className="map-stage">
                <button
                  type="button"
                  className="btn-map-reset"
                  onClick={handleReset}
                  aria-label="Reset selection — clear province and restore full week range (same as sidebar)"
                >
                  Reset selection
                </button>
                <CanadaMap
                  geo={data.geo}
                  choroplethByProvince={choroplethForMap}
                  colorScale={mapColorScale}
                  selectedProvince={selectedProvince}
                  onSelectProvince={setSelectedProvince}
                  onProvinceHover={onMapHover}
                  sparseProvinces={sparseTerritoryProvinces}
                />
              </div>
            )}
          </section>

          {showProvinceWeekMatrix && (
            <div
              className="map-heatmap-splitter"
              role="separator"
              aria-orientation="vertical"
              aria-label="Drag to resize map and heatmap panels"
              onPointerDown={handleMapHeatmapSplitPointerDown}
            />
          )}

          {showProvinceWeekMatrix && (
          <section
            className="panel panel-heatmap"
            data-tour="panel-heatmap"
            style={{ flex: `${100 - mapHeatmapSplitPct} 1 0`, minWidth: 0 }}
          >
            <div className="panel-heading-row">
              <h2>Province × Week Matrix</h2>
              <ChartInfoButton chartId="heatmap" />
            </div>
            <p className="panel-metric-note">{heatmapPanelMetricNote}</p>
            <p className="panel-desc">
              Rows are provinces; columns are weeks in range. Axis labels every 4th week; vertical lines mark
              weeks (major every 4th). Click a row label to select a province.
            </p>
            <div className="heatmap-legend-row">
              <Legend
                key={`heat-legend-${selectedMetric}`}
                title={`${metricLabel} (province × week)`}
                colorScale={heatmapColorScale}
                format={legendFormat}
                footnote={heatLegendFootnote}
                height={96}
              />
            </div>
            <Heatmap
              heatmap={data.heatmap}
              colorScale={heatmapColorScale}
              selectedProvince={selectedProvince}
              onSelectProvince={setSelectedProvince}
              onCellHover={onCellHover}
            />
          </section>
          )}
          </div>

          <section className="panel" data-tour="panel-trend">
            <div className="panel-heading-row">
              <h2>Temporal Trend</h2>
              <ChartInfoButton chartId="trend" />
            </div>
            <p className="panel-desc">
              {comparePanelOpen
                ? `Comparison mode: each checked virus is a separate line (national aggregate, or province-specific if a region is selected). Map${showProvinceWeekMatrix ? " and heatmap" : ""} still follow the virus chosen in Filters.`
                : selectedProvince
                  ? `${selectedProvince} (blue) compared to the national aggregate (grey dashed).`
                  : `National aggregate (all mapped provinces). Select a province on the map${showProvinceWeekMatrix ? " or heatmap" : ""} for comparison.`}{" "}
              {selectedMetric === "positivity" &&
                "Orange dashed line: 5% seasonal epidemic threshold (Canadian surveillance reference). "}
              {trendChartMode === "bar"
                ? "Hover bars to see week and values. "
                : "Hover the chart to see week and values."}
            </p>
            <div
              className="trend-view-toolbar"
              role="group"
              aria-label="Temporal trend chart type"
            >
              <span className="trend-view-label">View:</span>
              <label className="trend-view-option">
                <input
                  type="radio"
                  name="trendChartMode"
                  value="line"
                  checked={trendChartMode === "line"}
                  onChange={() => setTrendChartMode("line")}
                />
                Line
              </label>
              <label className="trend-view-option">
                <input
                  type="radio"
                  name="trendChartMode"
                  value="bar"
                  checked={trendChartMode === "bar"}
                  onChange={() => setTrendChartMode("bar")}
                />
                Bars
              </label>
            </div>
            {showBarLayoutToggle && (
              <div
                className="bar-layout-toolbar"
                role="group"
                aria-label="Multi-virus bar chart layout"
              >
                <span className="bar-layout-label">Multi-virus bars:</span>
                <label className="bar-layout-option">
                  <input
                    type="radio"
                    name="barLayout"
                    value="stacked"
                    checked={barLayout === "stacked"}
                    onChange={() => setBarLayout("stacked")}
                  />
                  Stacked
                </label>
                <label className="bar-layout-option">
                  <input
                    type="radio"
                    name="barLayout"
                    value="grouped"
                    checked={barLayout === "grouped"}
                    onChange={() => setBarLayout("grouped")}
                  />
                  Grouped
                </label>
              </div>
            )}
            {trendChartMode === "bar" &&
              comparePanelOpen &&
              compareBarCount >= 2 &&
              selectedMetric === "positivity" && (
                <p className="bar-layout-hint" role="note">
                  Positivity is a rate: bars stay grouped. Use count metrics for stacked composition by virus.
                </p>
              )}
            <div className="compare-viruses-toolbar" data-tour="tour-trend-compare-viruses">
              <button
                type="button"
                className="btn-compare-toggle"
                onClick={toggleComparePanel}
                aria-expanded={comparePanelOpen}
              >
                {comparePanelOpen ? "Hide virus comparison" : "Compare viruses"}
              </button>
              {comparePanelOpen && (
                <div className="compare-viruses-panel">
                  <label className="compare-select-all">
                    <input
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                      checked={
                        compareCheckedIds.length === VIRUS_OPTIONS.length &&
                        VIRUS_OPTIONS.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCompareCheckedIds(VIRUS_OPTIONS.map((v) => v.id));
                        } else {
                          setCompareCheckedIds([]);
                        }
                      }}
                    />
                    Select all
                  </label>
                  <div className="compare-virus-checkboxes" role="group" aria-label="Viruses to compare">
                    {VIRUS_OPTIONS.map((v) => (
                      <label key={v.id} className="compare-virus-label">
                        <input
                          type="checkbox"
                          checked={compareCheckedIds.includes(v.id)}
                          onChange={() => {
                            setCompareCheckedIds((prev) =>
                              prev.includes(v.id)
                                ? prev.filter((id) => id !== v.id)
                                : [...prev, v.id]
                            );
                          }}
                        />
                        {v.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <TrendChart
              chartMode={trendChartMode}
              barLayout={countMetrics ? barLayout : "grouped"}
              lines={trendLines}
              metricLabel={metricLabel}
              metricId={selectedMetric}
              onTrendHover={onTrendHover}
              emptyHint={
                comparePanelOpen && compareCheckedIds.length === 0
                  ? "Select one or more viruses above (or use Select all)."
                  : "No data in this range — add CSV rows or widen the week range."
              }
            />
            {comparePanelOpen &&
              compareCheckedIds.length > 0 &&
              selectedProvince &&
              data.compareProvincialVsNational?.length > 0 && (
                <CompareNationalGrid
                  panels={data.compareProvincialVsNational}
                  chartMode={trendChartMode}
                  metricLabel={metricLabel}
                  metricId={selectedMetric}
                  selectedProvince={selectedProvince}
                  onTrendHover={onTrendHover}
                />
              )}
          </section>
                </>
              }
            />
            <Route
              path="/compare"
              element={
                <CrossProvinceVirusSection
                  expanded={crossCompareExpanded}
                  onToggleExpanded={setCrossCompareExpanded}
                  showCollapseToggle={false}
                  provinceList={data.provinceList}
                  selectedProvinces={crossProvinceIds}
                  onToggleProvince={toggleCrossProvince}
                  onClearProvinces={() => setCrossProvinceIds([])}
                  selectedViruses={crossVirusIds}
                  onToggleVirus={toggleCrossVirus}
                  onClearViruses={() => setCrossVirusIds([])}
                  onUseMapProvince={onUseMapProvinceForCross}
                  onUseFilterVirus={onUseFilterVirusForCross}
                  hasMapProvince={!!selectedProvince}
                  filterVirusId={selectedVirus}
                  panels={crossComparePanels}
                  selectionTooLarge={crossCompareSelectionTooLarge}
                  maxProvinces={MAX_CROSS_PROVINCES}
                  maxVirusPanels={MAX_CROSS_VIRUS_PANELS}
                  chartMode={crossCompareChartMode}
                  onChartMode={setCrossCompareChartMode}
                  metricLabel={metricLabel}
                  metricId={selectedMetric}
                  onTrendHover={onTrendHover}
                  weeksInRangeLength={weeksInRange.length}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <Tooltip
        visible={!!mapTip}
        x={mapTip?.x ?? 0}
        y={mapTip?.y ?? 0}
      >
        {mapTip && (
          <>
            <div className="tt-title">
              {mapTip.province}{" "}
              <span className="tt-title-virus">
                (
                {VIRUS_OPTIONS.find((v) => v.id === selectedVirus)?.label ??
                  selectedVirus}
                )
              </span>
            </div>
            <div className="tt-line tt-line--primary">
              {metricLabel}:{" "}
              {formatMetricValueById(
                selectedMetric,
                choroplethMapsByMetric[selectedMetric]?.get(mapTip.province)
              )}
            </div>
            {METRIC_OPTIONS.some((m) => m.id !== selectedMetric) && (
              <>
                <hr className="tt-divider" aria-hidden />
                {METRIC_OPTIONS.filter((m) => m.id !== selectedMetric).map(
                  (m) => (
                    <div key={m.id} className="tt-line tt-line--secondary">
                      {m.label}:{" "}
                      {formatMetricValueById(
                        m.id,
                        choroplethMapsByMetric[m.id]?.get(mapTip.province)
                      )}
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </Tooltip>

      <Tooltip
        visible={!!cellTip}
        x={cellTip?.x ?? 0}
        y={cellTip?.y ?? 0}
      >
        {cellTip && (
          <>
            <div className="tt-title">
              {cellTip.province} — {cellTip.week}
            </div>
            <div className="tt-line">
              {metricLabel}: {legendFormat(cellTip.value)}
            </div>
          </>
        )}
      </Tooltip>

      <Tooltip
        visible={!!trendTip}
        x={trendTip?.x ?? 0}
        y={trendTip?.y ?? 0}
      >
        {trendTip && (
          <>
            <div className="tt-title">Week {trendTip.weekKey}</div>
            {trendTip.entries?.map((e) => (
              <div key={e.label} className="tt-line">
                {e.label}: {legendFormat(e.value)}
              </div>
            ))}
          </>
        )}
      </Tooltip>

      <footer className="app-footer">
        <p>
          Data used for this visualization are from the Canadian respiratory virus surveillance
          program. Source:{" "}
          <a
            href="https://health-infobase.canada.ca/respiratory-virus-surveillance/explore.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore the data — Canadian respiratory virus surveillance report (Health Infobase)
          </a>
          .
        </p>
      </footer>
    </div>
  );
}

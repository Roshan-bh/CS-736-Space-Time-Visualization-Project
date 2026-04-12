/**
 * One chart per selected virus; each chart compares all selected provinces.
 * Shared line vs bar mode (grouped bars for multiple provinces).
 */

import TrendChart from "./TrendChart.jsx";
import ChartInfoButton from "./ChartInfoButton.jsx";
import { VIRUS_OPTIONS } from "../utils/constants.js";

export default function CrossProvinceVirusSection({
  expanded,
  onToggleExpanded,
  /** When false, charts/selection are always shown and the collapse toggle is hidden (dedicated /compare page). */
  showCollapseToggle = true,
  provinceList,
  selectedProvinces,
  onToggleProvince,
  onClearProvinces,
  selectedViruses,
  onToggleVirus,
  onClearViruses,
  onUseMapProvince,
  onUseFilterVirus,
  hasMapProvince,
  filterVirusId,
  panels,
  selectionTooLarge,
  maxProvinces,
  maxVirusPanels,
  chartMode,
  onChartMode,
  metricLabel,
  metricId,
  onTrendHover,
  weeksInRangeLength,
}) {
  const hasSelection =
    selectedProvinces.length > 0 && selectedViruses.length > 0 && !selectionTooLarge;

  const panelOpen = showCollapseToggle ? expanded : true;

  return (
    <section className="panel cross-compare-panel" data-tour="panel-cross-compare">
      <div className="panel-heading-row">
        <h2>Province & Virus Comparisons</h2>
        <ChartInfoButton chartId="crossCompare" />
      </div>
      <p className="panel-desc">
        One chart per virus; each chart compares the selected provinces on the same metric and week range
        as Filters. Switch between line and bar views below.
      </p>
      {showCollapseToggle && (
        <button
          type="button"
          className="btn-cross-compare-toggle"
          onClick={() => onToggleExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? "Hide selection & charts" : "Choose provinces & viruses"}
        </button>
      )}

      {panelOpen && (
        <>
          <div className="cross-compare-quick" data-tour="tour-compare-quick">
            <button
              type="button"
              className="btn-cross-compare-quick"
              onClick={onUseMapProvince}
              disabled={!hasMapProvince}
              title={
                hasMapProvince
                  ? "Add the map-selected province to the list"
                  : "Select a province on the map first"
              }
            >
              + Map selection
            </button>
            <button
              type="button"
              className="btn-cross-compare-quick"
              onClick={onUseFilterVirus}
              title="Ensure the virus from Filters is checked below"
            >
              + Filter virus ({VIRUS_OPTIONS.find((v) => v.id === filterVirusId)?.label ?? "—"})
            </button>
            <button type="button" className="btn-cross-compare-quick" onClick={onClearProvinces}>
              Clear provinces
            </button>
            <button type="button" className="btn-cross-compare-quick" onClick={onClearViruses}>
              Clear viruses
            </button>
          </div>

          <div
            className="cross-compare-grids"
            role="group"
            aria-label="Provinces and viruses"
            data-tour="tour-compare-grids"
          >
            <div className="cross-compare-column">
              <span className="cross-compare-column-title">Provinces / territories (max {maxProvinces})</span>
              <div className="cross-compare-checkboxes">
                {provinceList.map((p) => (
                  <label key={p} className="cross-compare-label">
                    <input
                      type="checkbox"
                      checked={selectedProvinces.includes(p)}
                      onChange={() => onToggleProvince(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="cross-compare-column">
              <span className="cross-compare-column-title">Viruses — one panel each (max {maxVirusPanels})</span>
              <div className="cross-compare-checkboxes">
                {VIRUS_OPTIONS.map((v) => (
                  <label key={v.id} className="cross-compare-label">
                    <input
                      type="checkbox"
                      checked={selectedViruses.includes(v.id)}
                      onChange={() => onToggleVirus(v.id)}
                    />
                    {v.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {selectionTooLarge && (
            <p className="cross-compare-warn" role="alert">
              Selection too large: at most {maxProvinces} provinces and {maxVirusPanels} virus panels. Reduce
              your checkboxes to load charts.
            </p>
          )}

          {hasSelection && weeksInRangeLength > 0 && (
            <div
              className="cross-compare-view-toolbar"
              role="group"
              aria-label="Province comparison chart type"
            >
              <span className="cross-compare-view-label">View:</span>
              <label className="cross-compare-view-option">
                <input
                  type="radio"
                  name="crossCompareChartMode"
                  value="line"
                  checked={chartMode === "line"}
                  onChange={() => onChartMode("line")}
                />
                Line
              </label>
              <label className="cross-compare-view-option">
                <input
                  type="radio"
                  name="crossCompareChartMode"
                  value="bar"
                  checked={chartMode === "bar"}
                  onChange={() => onChartMode("bar")}
                />
                Bars
              </label>
            </div>
          )}

          {!selectionTooLarge &&
            selectedProvinces.length > 0 &&
            selectedViruses.length > 0 &&
            weeksInRangeLength === 0 && (
            <p className="cross-compare-hint" role="status">
              No weeks in range — widen the week filter.
            </p>
          )}

          {!selectionTooLarge && selectedProvinces.length > 0 && selectedViruses.length === 0 && (
            <p className="cross-compare-hint" role="status">
              Select at least one virus to show comparison panels.
            </p>
          )}

          {!selectionTooLarge && selectedProvinces.length === 0 && selectedViruses.length > 0 && (
            <p className="cross-compare-hint" role="status">
              Select at least one province to compare.
            </p>
          )}

          {hasSelection && panels.length > 0 && (
            <div className="cross-compare-virus-grid" role="list">
              {panels.map((panel) => (
                <div
                  key={panel.virusId}
                  className="cross-compare-virus-card"
                  role="listitem"
                >
                  <div className="cross-compare-virus-heading-row">
                    <h3 className="cross-compare-virus-title">{panel.virusLabel}</h3>
                    <ChartInfoButton chartId="crossCompare" titleSuffix={panel.virusLabel} />
                  </div>
                  <p className="cross-compare-virus-sub">
                    Provinces: {selectedProvinces.length} · {metricLabel}
                  </p>
                  <TrendChart
                    chartMode={chartMode}
                    barLayout="grouped"
                    lines={panel.lines}
                    metricLabel={metricLabel}
                    metricId={metricId}
                    onTrendHover={onTrendHover}
                    emptyHint="No data in this week range for this virus."
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

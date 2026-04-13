/**
 * Global filters: virus, metric, week range, reset, province indicator.
 * Intended for the sticky side panel.
 */

import { METRIC_OPTIONS, VIRUS_OPTIONS } from "../utils/constants.js";
import WeekRangeSlider from "./WeekRangeSlider.jsx";

export default function Controls({
  selectedVirus,
  onVirus,
  selectedMetric,
  onMetric,
  weekKeysSorted,
  weekRangeIndices,
  onWeekRangeIndices,
  selectedProvince,
  onReset,
  showProvinceWeekMatrix,
  onShowProvinceWeekMatrix,
  /** When true, only controls that affect the /compare charts are shown (metric + week). */
  comparePage = false,
}) {
  const n = weekKeysSorted.length;
  const maxIdx = Math.max(0, n - 1);

  const startLabel =
    n > 0 ? weekKeysSorted[weekRangeIndices[0]] ?? "" : "—";
  const endLabel = n > 0 ? weekKeysSorted[weekRangeIndices[1]] ?? "" : "—";

  return (
    <div className="controls-panel">
      <div data-tour="tour-filters-intro">
        <h2 className="filters-heading">Filters</h2>
        <p className="filters-intro">
          {comparePage
            ? "Metric and week range apply to the comparison charts. Provinces and viruses are chosen in the main panel."
            : "Virus, metric, and week window apply to the map, trend, and matrix (when the matrix is shown)."}
        </p>
      </div>

      {!comparePage && (
        <label className="control control-block" data-tour="tour-filter-virus">
          <span>Virus</span>
          <select
            value={selectedVirus}
            onChange={(e) => onVirus(e.target.value)}
          >
            {VIRUS_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="control control-block" data-tour="tour-filter-metric">
        <span>Metric</span>
        <select
          value={selectedMetric}
          onChange={(e) => onMetric(e.target.value)}
        >
          {METRIC_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <div className="control control-block week-range-block" data-tour="tour-filter-week">
        <span>
          Week range
          {n > 0 && (
            <span className="week-hint">
              <span className="week-range-labels">
                {" "}{startLabel}–{endLabel}
              </span>
            </span>
          )}
        </span>
        <WeekRangeSlider
          min={0}
          max={maxIdx}
          value={[
            Math.min(weekRangeIndices[0], maxIdx),
            Math.min(weekRangeIndices[1], maxIdx),
          ]}
          onChange={onWeekRangeIndices}
          disabled={n === 0 || maxIdx === 0}
        />
      </div>

      {!comparePage && (
        <button
          type="button"
          className="btn-reset btn-reset-block"
          onClick={onReset}
          data-tour="tour-filter-reset"
        >
          Reset selection
        </button>
      )}

      {!comparePage && (
        <div className="selection-bar" data-tour="tour-filter-region">
          <strong>Selected region</strong>
          <div className="selection-bar-body">
            {selectedProvince ? (
              <span className="badge-province">{selectedProvince}</span>
            ) : (
              <span className="muted">National (click a province on the map)</span>
            )}
          </div>
        </div>
      )}

      {!comparePage && (
        <div
          className="control control-block matrix-toggle-block"
          data-tour="tour-matrix-toggle"
        >
          <label className="matrix-toggle-label">
            <input
              type="checkbox"
              className="matrix-toggle-input"
              checked={showProvinceWeekMatrix}
              onChange={(e) => onShowProvinceWeekMatrix(e.target.checked)}
            />
            <span>Show Province × Week Matrix</span>
          </label>
          <p className="matrix-toggle-hint">
            When on, the matrix appears beside the map. When off, the map uses the full width.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Global filters: virus, metric, province selector, reset, matrix toggle.
 * On comparePage only the metric dropdown is shown (week range lives in the compare section).
 */

import { METRIC_OPTIONS, VIRUS_OPTIONS } from "../utils/constants.js";

export default function Controls({
  selectedVirus,
  onVirus,
  selectedMetric,
  onMetric,
  selectedProvince,
  onProvince,
  provinceList = [],
  onReset,
  showProvinceWeekMatrix,
  onShowProvinceWeekMatrix,
  comparePage = false,
}) {
  return (
    <div className="controls-panel" data-tour="tour-filters-intro">

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

      {!comparePage && provinceList.length > 0 && (
        <label className="control control-block" data-tour="tour-filter-province">
          <span>Province</span>
          <select
            value={selectedProvince ?? ""}
            onChange={(e) => onProvince(e.target.value || null)}
          >
            <option value="">All provinces</option>
            {provinceList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      )}

      {!comparePage && (
        <button
          type="button"
          className="btn-reset btn-reset-block"
          onClick={onReset}
          data-tour="tour-filter-reset"
        >
          Reset
        </button>
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
            <span>Province × Week Matrix</span>
          </label>
        </div>
      )}
    </div>
  );
}

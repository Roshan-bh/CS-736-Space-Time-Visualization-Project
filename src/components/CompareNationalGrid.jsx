/**
 * Small multiples: for each compared virus, national vs selected province.
 * Only rendered when a region is selected (parent gate).
 * Uses the same line/bar mode as the main temporal trend chart.
 */

import { useMemo } from "react";
import * as d3 from "d3";
import TrendChart from "./TrendChart.jsx";
import ChartInfoButton from "./ChartInfoButton.jsx";

/**
 * @param {object} props
 * @param {Array<{ virusId: string, label: string, national: object[], provinceSeries: object[] | null }>} props.panels
 * @param {'line' | 'bar'} props.chartMode
 * @param {string} props.metricLabel
 * @param {string} props.metricId
 * @param {string} props.selectedProvince
 * @param {function} [props.onTrendHover]
 */
export default function CompareNationalGrid({
  panels,
  chartMode,
  metricLabel,
  metricId,
  selectedProvince,
  onTrendHover,
}) {
  if (!panels?.length) return null;

  return (
    <div className="compare-national-section">
      <div className="compare-national-heading-row">
        <h3 className="compare-national-heading">Comparison with national</h3>
        <ChartInfoButton chartId="compareNational" />
      </div>
      <p className="compare-national-desc">
        National (grey dashed) vs {selectedProvince} (blue) for each pathogen — same view (line or bars) as
        above.
      </p>
      <div className="compare-national-grid" role="list">
        {panels.map((panel) => (
          <CompareNationalCard
            key={panel.virusId}
            panel={panel}
            chartMode={chartMode}
            metricLabel={metricLabel}
            metricId={metricId}
            selectedProvince={selectedProvince}
            onTrendHover={onTrendHover}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Memoized so `lines` keeps the same reference when the parent re-renders on trend
 * tooltip updates — otherwise TrendChart’s effect wipes the SVG and the hover line flickers.
 */
function CompareNationalCard({
  panel,
  chartMode,
  metricLabel,
  metricId,
  selectedProvince,
  onTrendHover,
}) {
  const lines = useMemo(
    () => linesForPanel(panel, selectedProvince),
    [panel, selectedProvince]
  );

  return (
    <div className="compare-national-card" role="listitem">
      <div className="compare-national-card-heading-row">
        <h4 className="compare-national-card-title">{panel.label}</h4>
        <ChartInfoButton chartId="compareNational" titleSuffix={panel.label} />
      </div>
      <TrendChart
        compact
        compactSize="xlarge"
        chartMode={chartMode}
        lines={lines}
        metricLabel={metricLabel}
        metricId={metricId}
        onTrendHover={onTrendHover}
        emptyHint="No data in this week range."
      />
    </div>
  );
}

/**
 * @param {{ national: { weekKey: string, value: number }[], provinceSeries: { weekKey: string, value: number }[] | null, label: string }} panel
 * @param {string | null} selectedProvince
 */
function linesForPanel(panel, selectedProvince) {
  const nat = panel.national ?? [];
  const palette = d3.schemeTableau10;
  if (selectedProvince && panel.provinceSeries?.length) {
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
        series: panel.provinceSeries,
        color: "#0c4a6e",
        strokeWidth: 2,
      },
    ];
  }
  return [
    {
      key: "nat",
      label: "National",
      series: nat,
      color: palette[0] ?? "#0c4a6e",
      strokeWidth: 2,
    },
  ];
}

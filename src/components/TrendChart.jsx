/**
 * Time-series from a unified `lines` array (national / province / multi-virus compare).
 * Line chart or grouped bar chart per week; optional 5% epidemic threshold (positivity).
 */

import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

/** Extra room below x-axis ticks for rotated week labels + axis title. */
const MARGIN = { top: 18, right: 24, bottom: 58, left: 52 };
const WIDTH = 720;
const HEIGHT = 340;

const COMPACT_MARGIN = { top: 10, right: 10, bottom: 48, left: 40 };
const COMPACT_WIDTH = 400;
const COMPACT_HEIGHT = 210;

/** Slightly larger compact charts (e.g. Comparison with national grid). */
const COMPACT_MARGIN_LARGE = { top: 12, right: 14, bottom: 48, left: 46 };
const COMPACT_WIDTH_LARGE = 520;
const COMPACT_HEIGHT_LARGE = 258;

/** Compare-national small multiples: more readable axes. */
const COMPACT_MARGIN_XL = { top: 16, right: 18, bottom: 52, left: 56 };
const COMPACT_WIDTH_XL = 700;
const COMPACT_HEIGHT_XL = 320;

/** Inner plotting width when no extra space is needed (matches legacy layout). */
const BASE_PLOT_W = WIDTH - MARGIN.left - MARGIN.right;

/**
 * Wider plot when many weeks and/or series so bars/lines stay readable; parent scrolls horizontally.
 * @param {number} weekCount
 * @param {number} seriesCount
 * @param {'line' | 'bar'} chartMode
 * @param {number} basePlotW
 */
/**
 * @param {'grouped' | 'stacked'} barLayout
 */
function computePlotWidth(weekCount, seriesCount, chartMode, basePlotW, barLayout = "grouped") {
  if (weekCount <= 0) return basePlotW;
  const sc = Math.max(1, seriesCount);
  /** One line series (no compare): keep chart fitted to the panel. */
  if (sc === 1 && chartMode === "line") {
    return basePlotW;
  }
  if (chartMode === "bar") {
    if (barLayout === "stacked" && sc > 1) {
      const minPerWeek = Math.max(44, 28);
      return Math.max(basePlotW, weekCount * minPerWeek);
    }
    const minPerWeek = Math.max(56, 18 + sc * 16);
    return Math.max(basePlotW, weekCount * minPerWeek);
  }
  const minPerWeek = sc <= 2 ? 16 : sc <= 4 ? 22 : sc <= 6 ? 28 : 32;
  return Math.max(basePlotW, weekCount * minPerWeek);
}

const EPIDEMIC_THRESHOLD_PCT = 5;

const X_AXIS_LABEL = "Surveillance week";

/** Axis styling — richer contrast (aligned with site theme). */
const AXIS_TICK_FILL = "#1e293b";
const AXIS_LINE_STROKE = "#64748b";
const AXIS_X_TITLE_FILL = "#1e3a5f";
const AXIS_Y_METRIC_FILL = "#0f172a";
const AXIS_TICK_WEIGHT = "500";

/** Line keys may include `::` (e.g. province::virus); that is invalid in CSS class selectors. */
function cssSafeClassSuffix(key) {
  return String(key).replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * @typedef {{ weekKey: string, value: number }} TrendPoint
 * @typedef {{
 *   key: string,
 *   label: string,
 *   series: TrendPoint[],
 *   color: string,
 *   strokeWidth?: number,
 *   dash?: string,
 * }} TrendLineSpec
 */

/**
 * @param {object} props
 * @param {'line' | 'bar'} [props.chartMode]
 * @param {'grouped' | 'stacked'} [props.barLayout] — bar mode only; stacked for count metrics (multi-virus).
 */
export default function TrendChart({
  chartMode = "line",
  barLayout = "grouped",
  /** Smaller chart for small-multiple panels (e.g. vs national). */
  compact = false,
  /** When `compact`, SVG size: `default` | `large` | `xlarge` (compare-national). */
  compactSize = "default",
  /** @type {TrendLineSpec[]} */
  lines = [],
  metricLabel,
  metricId,
  onTrendHover,
  /** Week key string to draw a static playback cursor (null = none). */
  playbackWeek = null,
  emptyHint = "No data in this range.",
}) {
  const svgRef = useRef(null);

  const { chartH, margin, basePlotW, innerH } = useMemo(() => {
    if (!compact) {
      const bp = WIDTH - MARGIN.left - MARGIN.right;
      const ih = HEIGHT - MARGIN.top - MARGIN.bottom;
      return { chartH: HEIGHT, margin: MARGIN, basePlotW: bp, innerH: ih };
    }
    const xl = compactSize === "xlarge";
    const large = compactSize === "large";
    const w = xl ? COMPACT_WIDTH_XL : large ? COMPACT_WIDTH_LARGE : COMPACT_WIDTH;
    const h = xl ? COMPACT_HEIGHT_XL : large ? COMPACT_HEIGHT_LARGE : COMPACT_HEIGHT;
    const m = xl ? COMPACT_MARGIN_XL : large ? COMPACT_MARGIN_LARGE : COMPACT_MARGIN;
    const bp = w - m.left - m.right;
    const ih = h - m.top - m.bottom;
    return { chartH: h, margin: m, basePlotW: bp, innerH: ih };
  }, [compact, compactSize]);

  const layout = useMemo(() => {
    const weekCount = lines[0]?.series?.length ?? 0;
    const seriesCount = lines.length || 1;
    const effectiveBarLayout =
      chartMode === "bar" && seriesCount > 1 ? barLayout : "grouped";
    const plotW = computePlotWidth(
      weekCount,
      seriesCount,
      chartMode,
      basePlotW,
      effectiveBarLayout
    );
    const totalSvgW = plotW + margin.left + margin.right;
    return {
      plotW,
      totalSvgW,
      scrollHint: !compact && plotW > basePlotW + 2,
    };
  }, [lines, chartMode, basePlotW, margin.left, margin.right, compact, barLayout]);

  useEffect(() => {
    const plotW = layout.plotW;
    const totalSvgW = layout.totalSvgW;
    const compactXl = compact && compactSize === "xlarge";
    const compactLarge = compact && compactSize === "large";
    const axisTick = compact ? (compactXl ? 12 : compactLarge ? 10 : 9) : 11;
    const axisYLabel = compact ? (compactXl ? 13 : compactLarge ? 12 : 11) : 13;
    const yAxisLabelDy = compact ? (compactXl ? -36 : compactLarge ? -30 : -28) : -40;
    /** Distance below plot bottom to start of x-axis title (below rotated week ticks). */
    const xAxisLabelOffset = compact ? 30 : 34;
    const xAxisLabelSize = compact ? axisTick : 11;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${totalSvgW} ${chartH}`)
      .attr("width", totalSvgW)
      .attr("height", chartH);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!lines.length) {
      g.append("text")
        .attr("x", plotW / 2)
        .attr("y", innerH / 2)
        .attr("text-anchor", "middle")
        .attr("fill", AXIS_TICK_FILL)
        .attr("font-size", 13)
        .attr("font-weight", "500")
        .text(emptyHint);
      return;
    }

    const firstSeries = lines[0].series ?? [];
    if (firstSeries.length === 0) {
      g.append("text")
        .attr("x", plotW / 2)
        .attr("y", innerH / 2)
        .attr("text-anchor", "middle")
        .attr("fill", AXIS_TICK_FILL)
        .attr("font-size", 13)
        .attr("font-weight", "500")
        .text(emptyHint);
      return;
    }

    const weekKeys = firstSeries.map((d) => d.weekKey);

    function valueForWeek(weekKey, series) {
      return series?.find((r) => r.weekKey === weekKey)?.value ?? 0;
    }

    if (chartMode === "bar") {
      const thrFont = compactXl ? 10 : compactLarge ? 9 : compact ? 8 : 10;

      const useStacked = lines.length > 1 && barLayout === "stacked";
      let maxYBar = 1;
      let stackLayers = [];
      if (useStacked) {
        const seriesKeys = lines.map((ln) => ln.key);
        const rows = weekKeys.map((wk) => {
          const row = { weekKey: wk };
          for (const ln of lines) {
            row[ln.key] = Math.max(0, valueForWeek(wk, ln.series));
          }
          return row;
        });
        stackLayers = d3.stack().keys(seriesKeys)(rows);
        maxYBar = d3.max(stackLayers, (layer) => d3.max(layer, (d) => d[1])) ?? 1;
      } else {
        const vals = [];
        for (const ln of lines) {
          for (const p of ln.series ?? []) vals.push(p.value);
        }
        maxYBar = d3.max(vals) ?? 1;
      }
      if (metricId === "positivity") {
        maxYBar = Math.max(maxYBar, EPIDEMIC_THRESHOLD_PCT * 1.15);
      }
      maxYBar *= 1.05;
      if (!Number.isFinite(maxYBar) || maxYBar <= 0) maxYBar = 1;

      const yScale = d3
        .scaleLinear()
        .domain([0, maxYBar])
        .range([innerH, 0])
        .nice();

      const plotBottom = innerH;
      const x0 = d3
        .scaleBand()
        .domain(weekKeys)
        .range([0, plotW])
        .padding(0.18);

      if (metricId === "positivity") {
        const yThr = yScale(EPIDEMIC_THRESHOLD_PCT);
        g.append("line")
          .attr("class", "epidemic-threshold")
          .attr("x1", 0)
          .attr("x2", plotW)
          .attr("y1", yThr)
          .attr("y2", yThr)
          .attr("stroke", "#b45309")
          .attr("stroke-dasharray", "5 4")
          .attr("stroke-width", 1.25)
          .attr("opacity", 0.9)
          .attr("pointer-events", "none");
        g.append("text")
          .attr("x", plotW)
          .attr("y", yThr - 4)
          .attr("text-anchor", "end")
          .attr("font-size", thrFont)
          .attr("fill", "#92400e")
          .attr("pointer-events", "none")
          .text(`${EPIDEMIC_THRESHOLD_PCT}% epidemic threshold`);
      }

      const barsG = g.append("g").attr("class", "trend-bars").attr("pointer-events", "none");

      if (useStacked) {
        const keyToColor = new Map(lines.map((ln) => [ln.key, ln.color]));
        const cells = [];
        for (const layer of stackLayers) {
          const key = layer.key;
          const color = keyToColor.get(key) ?? "#64748b";
          for (const d of layer) {
            const wk = d.data.weekKey;
            const y0p = yScale(d[0]);
            const y1p = yScale(d[1]);
            cells.push({
              weekKey: wk,
              lineKey: key,
              x: x0(wk) ?? 0,
              y: Math.min(y0p, y1p),
              w: x0.bandwidth(),
              h: Math.max(0, Math.abs(y1p - y0p)),
              color,
            });
          }
        }
        barsG
          .selectAll("rect")
          .data(cells)
          .join("rect")
          .attr("class", "trend-bar-cell")
          .attr("data-week", (d) => d.weekKey)
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y)
          .attr("width", (d) => d.w)
          .attr("height", (d) => d.h)
          .attr("fill", (d) => d.color)
          .attr("opacity", 0.92)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("rx", 1)
          .attr("ry", 1);
      } else {
        const seriesKeys = lines.map((ln) => ln.key);
        const x1 = d3
          .scaleBand()
          .domain(seriesKeys)
          .range([0, x0.bandwidth()])
          .padding(0.12);

        const cells = [];
        for (const wk of weekKeys) {
          for (const ln of lines) {
            const v = valueForWeek(wk, ln.series);
            const x = (x0(wk) ?? 0) + (x1(ln.key) ?? 0);
            const barH = innerH - yScale(v);
            const y = yScale(v);
            cells.push({
              weekKey: wk,
              lineKey: ln.key,
              value: v,
              x,
              y,
              w: x1.bandwidth(),
              h: barH,
              color: ln.color,
            });
          }
        }

        barsG
          .selectAll("rect")
          .data(cells)
          .join("rect")
          .attr("class", "trend-bar-cell")
          .attr("data-week", (d) => d.weekKey)
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y)
          .attr("width", (d) => d.w)
          .attr("height", (d) => Math.max(0, d.h))
          .attr("fill", (d) => d.color)
          .attr("opacity", 0.92)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("rx", 1)
          .attr("ry", 1);
      }

      const focus = g
        .append("g")
        .attr("class", "trend-bar-focus")
        .attr("pointer-events", "none")
        .style("display", "none");
      focus
        .append("line")
        .attr("class", "trend-focus-line")
        .attr("y1", 0)
        .attr("y2", plotBottom)
        .attr("stroke", "#64748b")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-dasharray", "4 3");

      const overlay = g
        .append("rect")
        .attr("class", "trend-hover-overlay")
        .attr("width", plotW)
        .attr("height", plotBottom)
        .attr("fill", "transparent")
        .style("cursor", "crosshair");

      function weekFromMx(mx) {
        for (const wk of weekKeys) {
          const xStart = x0(wk) ?? 0;
          const xEnd = xStart + x0.bandwidth();
          if (mx >= xStart && mx <= xEnd) return wk;
        }
        return weekKeys.length
          ? weekKeys[
              Math.min(
                weekKeys.length - 1,
                Math.max(0, Math.floor((mx / plotW) * weekKeys.length))
              )
            ]
          : null;
      }

      if (typeof onTrendHover === "function") {
        overlay
          .on("mouseenter", () => {
            focus.style("display", null);
          })
          .on("mousemove", (event) => {
            const [mx] = d3.pointer(event);
            const wk = weekFromMx(mx);
            if (!wk) return;
            const cx = (x0(wk) ?? 0) + x0.bandwidth() / 2;
            focus.select(".trend-focus-line").attr("x1", cx).attr("x2", cx);

            barsG
              .selectAll(".trend-bar-cell")
              .attr("opacity", (d) => (d.weekKey === wk ? 1 : 0.28));

            onTrendHover({
              x: event.clientX + 12,
              y: event.clientY + 12,
              weekKey: wk,
              entries: lines.map((ln) => ({
                label: ln.label,
                value: valueForWeek(wk, ln.series),
              })),
            });
          })
          .on("mouseleave", () => {
            focus.style("display", "none");
            barsG.selectAll(".trend-bar-cell").attr("opacity", 0.92);
            onTrendHover(null);
          });
      }

      const xAxis = d3.axisBottom(x0).tickSizeOuter(0);
      g.append("g")
        .attr("class", "trend-x-axis")
        .attr("pointer-events", "none")
        .attr("transform", `translate(0,${innerH})`)
        .call(xAxis)
        .call((ga) =>
          ga.selectAll(".domain, .tick line").attr("stroke", AXIS_LINE_STROKE)
        )
        .selectAll("text")
        .attr("transform", "rotate(-35)")
        .style("text-anchor", "end")
        .attr("font-size", axisTick)
        .attr("font-weight", AXIS_TICK_WEIGHT)
        .attr("fill", AXIS_TICK_FILL);

      g.append("text")
        .attr("class", "trend-x-axis-label")
        .attr("pointer-events", "none")
        .attr("x", plotW / 2)
        .attr("y", innerH + xAxisLabelOffset)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "hanging")
        .attr("font-size", xAxisLabelSize)
        .attr("font-weight", "700")
        .attr("fill", AXIS_X_TITLE_FILL)
        .text(X_AXIS_LABEL);

      g.append("g")
        .attr("class", "trend-y-axis")
        .attr("pointer-events", "none")
        .call(d3.axisLeft(yScale).ticks(compact ? 4 : 5))
        .call((ga) =>
          ga.selectAll(".domain, .tick line").attr("stroke", AXIS_LINE_STROKE)
        )
        .call((ga) =>
          ga
            .selectAll("text")
            .attr("fill", AXIS_TICK_FILL)
            .attr("font-size", axisTick)
            .attr("font-weight", AXIS_TICK_WEIGHT)
        );

      g.append("text")
        .attr("class", "trend-y-metric-label")
        .attr("pointer-events", "none")
        .attr("x", -innerH / 2)
        .attr("y", yAxisLabelDy)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-size", axisYLabel)
        .attr("font-weight", "700")
        .attr("fill", AXIS_Y_METRIC_FILL)
        .text(metricLabel);

      if (playbackWeek && x0(playbackWeek) !== undefined) {
        const cx = (x0(playbackWeek) ?? 0) + x0.bandwidth() / 2;
        g.append("line")
          .attr("class", "trend-playback-cursor")
          .attr("x1", cx).attr("x2", cx)
          .attr("y1", 0).attr("y2", plotBottom)
          .attr("stroke", "#3b82f6")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "4 3")
          .attr("opacity", 0.7)
          .attr("pointer-events", "none");
      }

      focus.raise();
      overlay.raise();

      return;
    }

    const allVals = [];
    for (const ln of lines) {
      for (const p of ln.series ?? []) allVals.push(p.value);
    }
    let maxY = d3.max(allVals) ?? 1;
    if (metricId === "positivity") {
      maxY = Math.max(maxY, EPIDEMIC_THRESHOLD_PCT * 1.15);
    }
    maxY *= 1.05;
    if (!Number.isFinite(maxY) || maxY <= 0) maxY = 1;

    const yScale = d3
      .scaleLinear()
      .domain([0, maxY])
      .range([innerH, 0])
      .nice();

    const plotBottom = innerH;

    /* ——— line chart ——— */
    const xScale = d3
      .scalePoint()
      .domain(weekKeys)
      .range([0, plotW])
      .padding(0.5);

    if (metricId === "positivity") {
      const yThr = yScale(EPIDEMIC_THRESHOLD_PCT);
      const thrFontLine = compactXl ? 10 : compactLarge ? 9 : compact ? 8 : 10;
      g.append("line")
        .attr("class", "epidemic-threshold")
        .attr("x1", 0)
        .attr("x2", plotW)
        .attr("y1", yThr)
        .attr("y2", yThr)
        .attr("stroke", "#b45309")
        .attr("stroke-dasharray", "5 4")
        .attr("stroke-width", 1.25)
        .attr("opacity", 0.9)
        .attr("pointer-events", "none");
      g.append("text")
        .attr("x", plotW)
        .attr("y", yThr - 4)
        .attr("text-anchor", "end")
        .attr("font-size", thrFontLine)
        .attr("fill", "#92400e")
        .attr("pointer-events", "none")
        .text(`${EPIDEMIC_THRESHOLD_PCT}% epidemic threshold`);
    }

    const lineGen = d3
      .line()
      .x((d) => xScale(d.weekKey))
      .y((d) => yScale(d.value));

    for (const ln of lines) {
      const p = g
        .append("path")
        .datum(ln.series)
        .attr("fill", "none")
        .attr("stroke", ln.color)
        .attr("stroke-width", ln.strokeWidth ?? 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("pointer-events", "none")
        .attr("d", lineGen);
      if (ln.dash) p.attr("stroke-dasharray", ln.dash);
    }

    const showDots = lines.length <= 3;
    if (showDots) {
      for (const ln of lines) {
        const cls = cssSafeClassSuffix(ln.key);
        g.selectAll(`.dot-${cls}`)
          .data(ln.series)
          .join("circle")
          .attr("class", `dot-${cls}`)
          .attr("r", lines.length > 1 ? 2.5 : 3)
          .attr("cx", (d) => xScale(d.weekKey))
          .attr("cy", (d) => yScale(d.value))
          .attr("fill", ln.color)
          .attr("opacity", 0.9)
          .attr("pointer-events", "none");
      }
    }

    const focus = g
      .append("g")
      .attr("class", "trend-focus")
      .attr("pointer-events", "none")
      .style("display", "none");

    focus
      .append("line")
      .attr("class", "trend-focus-line")
      .attr("y1", 0)
      .attr("y2", plotBottom)
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.45)
      .attr("stroke-dasharray", "4 3");

    lines.forEach((ln) => {
      const fcls = cssSafeClassSuffix(ln.key);
      focus
        .append("circle")
        .attr("class", `focus-dot focus-${fcls}`)
        .attr("r", 4)
        .attr("fill", "#fff")
        .attr("stroke", ln.color)
        .attr("stroke-width", 2);
    });

    function nearestPoint(mx) {
      if (firstSeries.length === 0) return null;
      let best = firstSeries[0];
      let bestDx = Math.abs(xScale(best.weekKey) - mx);
      for (let j = 1; j < firstSeries.length; j++) {
        const d = firstSeries[j];
        const dx = Math.abs(xScale(d.weekKey) - mx);
        if (dx < bestDx) {
          bestDx = dx;
          best = d;
        }
      }
      return best;
    }

    const overlay = g
      .append("rect")
      .attr("class", "trend-hover-overlay")
      .attr("width", plotW)
      .attr("height", plotBottom)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    if (typeof onTrendHover === "function") {
      overlay
        .on("mouseenter", () => {
          focus.style("display", null);
        })
        .on("mousemove", (event) => {
          const [mx] = d3.pointer(event);
          const d = nearestPoint(mx);
          if (!d) return;
          const cx = xScale(d.weekKey);
          focus.select(".trend-focus-line").attr("x1", cx).attr("x2", cx);

          lines.forEach((ln) => {
            const vy = valueForWeek(d.weekKey, ln.series);
            const fcls = cssSafeClassSuffix(ln.key);
            focus
              .select(`.focus-${fcls}`)
              .attr("cx", cx)
              .attr("cy", yScale(vy));
          });

          if (showDots) {
            for (const ln of lines) {
              const dcls = cssSafeClassSuffix(ln.key);
              g.selectAll(`.dot-${dcls}`).attr("opacity", (p) =>
                p.weekKey === d.weekKey ? 1 : 0.25
              );
            }
          }

          onTrendHover({
            x: event.clientX + 12,
            y: event.clientY + 12,
            weekKey: d.weekKey,
            entries: lines.map((ln) => ({
              label: ln.label,
              value: valueForWeek(d.weekKey, ln.series),
            })),
          });
        })
        .on("mouseleave", () => {
          focus.style("display", "none");
          if (showDots) {
            for (const ln of lines) {
              const dcls = cssSafeClassSuffix(ln.key);
              g.selectAll(`.dot-${dcls}`).attr("opacity", 0.9);
            }
          }
          onTrendHover(null);
        });
    }

    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    g.append("g")
      .attr("class", "trend-x-axis")
      .attr("pointer-events", "none")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis)
      .call((ga) =>
        ga.selectAll(".domain, .tick line").attr("stroke", AXIS_LINE_STROKE)
      )
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end")
      .attr("font-size", axisTick)
      .attr("font-weight", AXIS_TICK_WEIGHT)
      .attr("fill", AXIS_TICK_FILL);

    g.append("text")
      .attr("class", "trend-x-axis-label")
      .attr("pointer-events", "none")
      .attr("x", plotW / 2)
      .attr("y", innerH + xAxisLabelOffset)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .attr("font-size", xAxisLabelSize)
      .attr("font-weight", "700")
      .attr("fill", AXIS_X_TITLE_FILL)
      .text(X_AXIS_LABEL);

    g.append("g")
      .attr("class", "trend-y-axis")
      .attr("pointer-events", "none")
      .call(d3.axisLeft(yScale).ticks(compact ? 4 : 5))
      .call((ga) =>
        ga.selectAll(".domain, .tick line").attr("stroke", AXIS_LINE_STROKE)
      )
      .call((ga) =>
        ga
          .selectAll("text")
          .attr("fill", AXIS_TICK_FILL)
          .attr("font-size", axisTick)
          .attr("font-weight", AXIS_TICK_WEIGHT)
      );

    g.append("text")
      .attr("class", "trend-y-metric-label")
      .attr("pointer-events", "none")
      .attr("x", -innerH / 2)
      .attr("y", yAxisLabelDy)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", axisYLabel)
      .attr("font-weight", "700")
      .attr("fill", AXIS_Y_METRIC_FILL)
      .text(metricLabel);

    if (playbackWeek && xScale(playbackWeek) !== undefined) {
      const cx = xScale(playbackWeek);
      g.append("line")
        .attr("class", "trend-playback-cursor")
        .attr("x1", cx).attr("x2", cx)
        .attr("y1", 0).attr("y2", plotBottom)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4 3")
        .attr("opacity", 0.7)
        .attr("pointer-events", "none");
    }

    focus.raise();
    overlay.raise();
  }, [
    chartMode,
    barLayout,
    lines,
    metricLabel,
    metricId,
    layout,
    innerH,
    onTrendHover,
    emptyHint,
    compact,
    compactSize,
    chartH,
    margin,
    playbackWeek,
  ]);

  const isBar = chartMode === "bar";

  const compactClass =
    compact &&
    ` trend-wrap--compact${
      compactSize === "xlarge"
        ? " trend-wrap--compact-xl"
        : compactSize === "large"
          ? " trend-wrap--compact-lg"
          : ""
    }`;

  return (
    <div className={`trend-wrap${compact ? compactClass : ""}`}>
      {layout.scrollHint && lines.length > 0 && (
        <p className="trend-scroll-hint" role="note">
          Scroll sideways to see all weeks — chart widens when comparing many viruses.
        </p>
      )}
      <div
        className={`trend-chart-scroll${layout.scrollHint ? " trend-chart-scroll--wide" : " trend-chart-scroll--fitted"}`}
      >
        <svg
          ref={svgRef}
          className="trend-chart"
          role="img"
          aria-label={
            isBar
              ? "Time trend bar chart by surveillance week"
              : "Time trend line chart by surveillance week"
          }
        />
      </div>
      {lines.length > 0 && (
        <div
          className={`trend-legend-strip${compact ? " trend-legend-strip--compact" : ""}`}
          role="list"
          aria-label="Series legend"
        >
          {lines.map((ln) => (
            <span key={ln.key} className="trend-legend-item" role="listitem">
              {isBar ? (
                <svg className="trend-legend-swatch trend-legend-swatch-bar" width="32" height="12" aria-hidden>
                  <rect
                    x="4"
                    y="2"
                    width="24"
                    height="8"
                    fill={ln.color}
                    rx="1"
                    stroke="#fff"
                    strokeWidth="0.5"
                  />
                </svg>
              ) : (
                <svg className="trend-legend-swatch" width="32" height="12" aria-hidden>
                  <line
                    x1="2"
                    y1="6"
                    x2="30"
                    y2="6"
                    stroke={ln.color}
                    strokeWidth={ln.strokeWidth ?? 2}
                    strokeDasharray={ln.dash || undefined}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span className="trend-legend-label">{ln.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

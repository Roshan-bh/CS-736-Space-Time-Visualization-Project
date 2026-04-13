/**
 * Province × week heatmap with row click to select province; optional sort by row mean.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

const HEATMAP_MARGIN = { top: 8, right: 12, bottom: 72, left: 118 };
const BASE_CHART_W = 720;
const MIN_BAND_PX = 11;

/** Axis / row labels — aligned with TrendChart. */
const AXIS_TICK_FILL = "#1e293b";
const AXIS_TITLE_FILL = "#1e3a5f";
const AXIS_ROW_DEFAULT = "#0f172a";
const AXIS_ROW_SELECTED = "#1e3a5f";

/** Word-wrap region names for the label column (~maxChars per line). */
function wrapProvinceName(s, maxChars = 18) {
  const t = s.trim();
  if (t.length <= maxChars) return [t];
  const words = t.split(/\s+/);
  const out = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars) {
      cur = next;
    } else {
      if (cur) out.push(cur);
      if (w.length > maxChars) {
        out.push(`${w.slice(0, maxChars - 1)}…`);
        cur = "";
      } else {
        cur = w;
      }
    }
  }
  if (cur) out.push(cur);
  return out.slice(0, 3);
}

export default function Heatmap({
  heatmap,
  colorScale,
  selectedProvince,
  onSelectProvince,
  onCellHover,
  playbackWeek = null,
}) {
  const svgRef = useRef(null);
  const [sortBy, setSortBy] = useState("geo");

  const { provinces, weeks, lookup } = heatmap;

  const rowOrder = useMemo(() => {
    if (sortBy === "geo") return [...provinces];
    const means = provinces.map((p) => {
      const row = lookup.get(p);
      if (!row) return 0;
      let s = 0;
      let c = 0;
      for (const w of weeks) {
        const v = row.get(w) ?? 0;
        s += v;
        c++;
      }
      return c ? s / c : 0;
    });
    return [...provinces].sort((a, b) => {
      const ia = provinces.indexOf(a);
      const ib = provinces.indexOf(b);
      return means[ib] - means[ia];
    });
  }, [provinces, weeks, lookup, sortBy]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (weeks.length === 0 || provinces.length === 0) {
      svg
        .attr("viewBox", "0 0 720 80")
        .attr("width", "100%")
        .attr("height", 80)
        .append("text")
        .attr("x", 360)
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .attr("fill", AXIS_ROW_DEFAULT)
        .attr("font-size", 13)
        .text("No weeks in range — widen the week range or add data.");
      return;
    }

    const wrappedRows = rowOrder.map((p) => wrapProvinceName(p));
    const maxLineChars = Math.max(1, ...wrappedRows.flat().map((l) => l.length));
    const maxLineCount = Math.max(1, ...wrappedRows.map((w) => w.length));
    const marginLeft = Math.max(
      HEATMAP_MARGIN.left,
      Math.min(240, Math.ceil(maxLineChars * 5.85) + 42)
    );
    const cellH = maxLineCount > 1 ? 26 : 18;

    const innerW = Math.max(
      BASE_CHART_W - marginLeft - HEATMAP_MARGIN.right,
      weeks.length * MIN_BAND_PX
    );
    const width = marginLeft + innerW + HEATMAP_MARGIN.right;
    const height =
      HEATMAP_MARGIN.top + rowOrder.length * cellH + HEATMAP_MARGIN.bottom + 8;

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${marginLeft},${HEATMAP_MARGIN.top})`);

    const xScale = d3
      .scaleBand()
      .domain(weeks)
      .range([0, innerW])
      .paddingInner(0.05);

    const yScale = d3
      .scaleBand()
      .domain(rowOrder)
      .range([0, rowOrder.length * cellH])
      .paddingInner(0.08);

    const cells = [];
    for (const p of rowOrder) {
      const row = lookup.get(p);
      for (const w of weeks) {
        const v = row?.get(w) ?? 0;
        cells.push({ p, w, v });
      }
    }

    const gridTop = 0;
    const gridBottom = rowOrder.length * cellH;
    const gridG = g.append("g").attr("class", "heatmap-week-grid");
    weeks.forEach((w, wi) => {
      const x0 = xScale(w) ?? 0;
      gridG
        .append("line")
        .attr("class", "heatmap-grid-week")
        .attr("x1", x0)
        .attr("x2", x0)
        .attr("y1", gridTop)
        .attr("y2", gridBottom)
        .attr("stroke", wi % 4 === 0 ? "#c5ced9" : "#e8ecf1")
        .attr("stroke-width", wi % 4 === 0 ? 1 : 0.5)
        .attr("pointer-events", "none");
    });

    const hasSelection =
      Boolean(selectedProvince) && rowOrder.includes(selectedProvince);

    if (hasSelection) {
      const ya = yScale(selectedProvince) ?? 0;
      const band = yScale.bandwidth();
      const focusG = g.append("g").attr("class", "heatmap-row-focus");
      focusG
        .append("rect")
        .attr("class", "heatmap-row-focus-label-wash")
        .attr("x", -marginLeft + 5)
        .attr("y", ya)
        .attr("width", marginLeft - 14)
        .attr("height", band)
        .attr("rx", 3)
        .attr("fill", "rgba(30, 58, 95, 0.09)")
        .attr("pointer-events", "none");
      focusG
        .append("rect")
        .attr("class", "heatmap-row-focus-accent")
        .attr("x", -marginLeft)
        .attr("y", ya)
        .attr("width", 4)
        .attr("height", band)
        .attr("rx", 2)
        .attr("fill", AXIS_ROW_SELECTED)
        .attr("pointer-events", "none");
    }

    const cellsLayer = g.append("g").attr("class", "heatmap-cells");
    cellsLayer
      .selectAll("rect")
      .data(cells)
      .join("rect")
      .attr("class", "heatmap-cell")
      .attr("x", (d) => xScale(d.w))
      .attr("y", (d) => yScale(d.p))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.v))
      .attr("stroke", (d) =>
        hasSelection && d.p === selectedProvince ? "#d4e2f2" : "#fff"
      )
      .attr("stroke-width", (d) =>
        hasSelection && d.p === selectedProvince ? 1.15 : 0.6
      )
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        onCellHover?.({
          x: event.clientX + 12,
          y: event.clientY + 12,
          province: d.p,
          week: d.w,
          value: d.v,
        });
      })
      .on("mousemove", (event, d) => {
        onCellHover?.({
          x: event.clientX + 12,
          y: event.clientY + 12,
          province: d.p,
          week: d.w,
          value: d.v,
        });
      })
      .on("mouseleave", () => onCellHover?.(null));

    if (playbackWeek && xScale(playbackWeek) !== undefined) {
      g.append("rect")
        .attr("class", "heatmap-playback-col")
        .attr("x", xScale(playbackWeek))
        .attr("y", 0)
        .attr("width", xScale.bandwidth())
        .attr("height", gridBottom)
        .attr("fill", "rgba(59, 130, 246, 0.15)")
        .attr("stroke", "rgba(59, 130, 246, 0.5)")
        .attr("stroke-width", 1)
        .attr("pointer-events", "none");
    }

    g.selectAll(".row-label")
      .data(rowOrder)
      .join("text")
      .attr("class", (d) =>
        hasSelection && d === selectedProvince
          ? "row-label row-label-selected"
          : "row-label"
      )
      .attr("aria-selected", (d) =>
        hasSelection && d === selectedProvince ? "true" : "false"
      )
      .attr("x", -6)
      .attr("text-anchor", "end")
      .attr("font-size", 11)
      .style("cursor", "pointer")
      .attr("y", (d) => {
        const lines = wrapProvinceName(d);
        const mid = (yScale(d) ?? 0) + yScale.bandwidth() / 2;
        return mid - (lines.length - 1) * 6.25;
      })
      .each(function (d) {
        const lines = wrapProvinceName(d);
        const sel = d3.select(this);
        sel.selectAll("tspan").remove();
        lines.forEach((line, i) => {
          sel
            .append("tspan")
            .attr("x", -6)
            .attr("dy", i === 0 ? "0.35em" : "1.08em")
            .text(line);
        });
      })
      .attr("fill", (d) =>
        hasSelection && d === selectedProvince ? AXIS_ROW_SELECTED : AXIS_ROW_DEFAULT
      )
      .attr("font-weight", (d) =>
        hasSelection && d === selectedProvince ? 600 : 400
      )
      .on("click", (_, d) => onSelectProvince(d));

    const labelEvery = 4;
    const majorWeeks = weeks.filter((_, wi) => wi % labelEvery === 0);
    const labelFont = weeks.length > 55 ? 10 : weeks.length > 35 ? 11 : 11.5;

    const weekTicksY = rowOrder.length * cellH + 8;
    g.append("g")
      .attr("class", "heatmap-week-ticks")
      .attr("transform", `translate(0,${weekTicksY})`)
      .selectAll("text")
      .data(majorWeeks)
      .join("text")
      .attr("x", (d) => (xScale(d) ?? 0) + xScale.bandwidth() / 2)
      .attr("y", 0)
      .attr("text-anchor", "end")
      .attr("transform", (d) => {
        const x = (xScale(d) ?? 0) + xScale.bandwidth() / 2;
        return `rotate(-42 ${x} 0)`;
      })
      .attr("font-size", labelFont)
      .attr("font-weight", 500)
      .attr("fill", AXIS_TICK_FILL)
      .text((d) => d);

    g.append("text")
      .attr("class", "heatmap-x-axis-label")
      .attr("x", innerW / 2)
      .attr("y", weekTicksY + 46)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .attr("fill", AXIS_TITLE_FILL)
      .text("Weeks");
  }, [
    rowOrder,
    weeks,
    provinces.length,
    lookup,
    colorScale,
    selectedProvince,
    onSelectProvince,
    onCellHover,
    playbackWeek,
  ]);

  return (
    <div className="heatmap-controls">
      <div className="heatmap-toolbar">
        <span className="muted">Row order:</span>
        <label>
          <input
            type="radio"
            name="sort"
            checked={sortBy === "geo"}
            onChange={() => setSortBy("geo")}
          />{" "}
          Geographic
        </label>
        <label>
          <input
            type="radio"
            name="sort"
            checked={sortBy === "mean"}
            onChange={() => setSortBy("mean")}
          />{" "}
          By mean (highlighted range)
        </label>
      </div>
      <div className="heatmap-scroll">
        <svg ref={svgRef} className="heatmap-svg" role="img" aria-label="Province by week heatmap" />
      </div>
    </div>
  );
}

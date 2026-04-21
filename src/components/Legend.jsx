/**
 * Horizontal color legend for choropleth / heatmap (D3 scale).
 */

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const LEGEND_TITLE_FILL = "#0f172a";
const LEGEND_TICK_FILL = "#1e293b";
const LEGEND_AXIS_STROKE = "#64748b";

export default function Legend({
  title,
  colorScale,
  width = 280,
  /** Title + gradient + axis ticks need more vertical space than the old 44px viewBox. */
  height = 78,
  format = (d) => String(d),
  /** Optional note below the axis (e.g. scale semantics). */
  footnote,
  /** When true, renders a diagonal-hatch swatch below the gradient bar. */
  showHatchSwatch = false,
  /** Label for the hatch swatch entry. */
  hatchSwatchLabel = "Sparse data",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !colorScale) return;

    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const margin = {
      top: 14,
      right: 12,
      bottom: 22,
      left: 12,
    };
    const innerW = width - margin.left - margin.right;
    const swatchRowH = showHatchSwatch ? 22 : 0;
    const svgHeight = height + swatchRowH;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${svgHeight}`)
      .attr("width", "100%")
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const defs = svg.append("defs");
    const id = `lg-${Math.random().toString(36).slice(2)}`;
    const linear = defs
      .append("linearGradient")
      .attr("id", id)
      .attr("x1", "0%")
      .attr("x2", "100%");

    const domain = colorScale.domain();
    const [d0, d1] = d3.extent(domain);
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = d0 + (d1 - d0) * t;
      linear
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(x));
    }

    const titleBlock = 14;
    const barH = 12;

    g.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dominant-baseline", "hanging")
      .attr("fill", LEGEND_TITLE_FILL)
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .text(title);

    g.append("rect")
      .attr("y", titleBlock)
      .attr("width", innerW)
      .attr("height", barH)
      .attr("fill", `url(#${id})`)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 0.65);

    const axis = d3
      .axisBottom(d3.scaleLinear().domain([d0, d1]).range([0, innerW]))
      .ticks(4)
      .tickFormat((d) => format(d));

    g.append("g")
      .attr("transform", `translate(0,${titleBlock + barH})`)
      .call(axis)
      .call((ga) => ga.select(".domain").remove())
      .call((ga) =>
        ga.selectAll(".tick line").attr("stroke", LEGEND_AXIS_STROKE)
      )
      .call((ga) =>
        ga
          .selectAll("text")
          .attr("fill", LEGEND_TICK_FILL)
          .attr("font-weight", "500")
          .attr("font-size", 11)
      );

    /* Diagonal-hatch swatch — documents the texture pre-attentive channel used
       on sparse/territory provinces. Mirrors the exact pattern from CanadaMap. */
    if (showHatchSwatch) {
      const hatchSwatchId = `lg-hatch-${id}`;
      defs
        .append("pattern")
        .attr("id", hatchSwatchId)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 8)
        .attr("height", 8)
        .append("path")
        .attr("d", "M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2")
        .attr("stroke", "rgba(30,30,30,0.28)")
        .attr("stroke-width", 1.15);

      // Axis area ends at titleBlock + barH + ~18px ticks
      const swatchY = titleBlock + barH + 20;
      const swatchW = 14;
      const swatchH = 12;

      const swatchG = g.append("g")
        .attr("transform", `translate(0,${swatchY})`)
        .attr("class", "legend-hatch-entry");

      // White background so hatch reads clearly on any page background
      swatchG.append("rect")
        .attr("width", swatchW)
        .attr("height", swatchH)
        .attr("fill", "#fff")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 0.65);

      // Hatch overlay
      swatchG.append("rect")
        .attr("width", swatchW)
        .attr("height", swatchH)
        .attr("fill", `url(#${hatchSwatchId})`)
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 0.65);

      swatchG.append("text")
        .attr("x", swatchW + 6)
        .attr("y", swatchH / 2)
        .attr("dominant-baseline", "central")
        .attr("fill", LEGEND_TICK_FILL)
        .attr("font-size", 11)
        .attr("font-weight", "500")
        .text(hatchSwatchLabel);
    }

  }, [colorScale, width, height, title, format, footnote, showHatchSwatch, hatchSwatchLabel]);

  if (!colorScale) return null;

  return (
    <>
      <svg ref={ref} className="legend-svg" aria-hidden />
      {footnote && (
        <p className="legend-footnote">{footnote}</p>
      )}
    </>
  );
}

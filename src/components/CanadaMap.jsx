/**
 * Choropleth map of Canada (D3 geo + TopoJSON features).
 */

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { boundsLookProjected } from "../utils/topoHelpers.js";
import { PROVINCE_NAME_TO_ABBREV } from "../utils/constants.js";

export default function CanadaMap({
  geo,
  choroplethByProvince,
  colorScale,
  selectedProvince,
  onSelectProvince,
  onProvinceHover,
  /** Provinces with sparse lab data (e.g. territories) — diagonal hatch overlay. */
  sparseProvinces,
}) {
  const wrapperRef = useRef(null);
  const svgRef = useRef(null);
  const [width, setWidth] = useState(720);

  /**
   * Minimum SVG render width (px). Below this the small Atlantic provinces
   * (NS, PE) shrink so much that even external leader labels overflow the
   * SVG viewport and get clipped. The map-wrap scrolls horizontally instead
   * of letting the SVG shrink past this point.
   */
  const MIN_MAP_WIDTH = 500;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(Math.max(w, MIN_MAP_WIDTH));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!geo || !colorScale) return;

    const height = Math.max(320, width * 0.72);
    const svg = d3.select(svgRef.current);
    svg.on(".zoom", null);
    svg.on("dblclick.reset", null);
    svg.selectAll("*").remove();

    const projected = boundsLookProjected(geo);

    /** StatsCan TopoJSON is already in projected metres — geoAlbers expects lon/lat degrees. */
    const projection = projected
      ? d3.geoIdentity().reflectY(true)
      : d3
          .geoAlbers()
          .rotate([96, 0])
          .center([-2, 62])
          .parallels([50, 70])
          .scale(width * 0.9)
          .translate([width / 2, height / 2]);

    if (projected) {
      projection.fitSize([width, height], geo);
    }

    const path = d3.geoPath(projection);

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)   /* pixel width — keeps SVG at ≥ MIN_MAP_WIDTH so labels never clip */
      .attr("height", height);

    const gZoom = svg.append("g").attr("class", "map-zoom-layer");

    const g = gZoom.append("g").attr("class", "map-root");

    const uid = Math.random().toString(36).slice(2);
    const hatchId = `hatch-${uid}`;
    const shadowId = `shadow-${uid}`;
    const defsRoot = svg.append("defs");

    defsRoot
      .append("pattern")
      .attr("id", hatchId)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 8)
      .attr("height", 8)
      .append("path")
      .attr("d", "M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2")
      .attr("stroke", "rgba(30,30,30,0.28)")
      .attr("stroke-width", 1.15);

    /* Drop-shadow filter for the selected-province raise effect.
       Elevation is communicated through depth (shadow), keeping the fill
       colour channel entirely reserved for the data metric. */
    const shadowFilter = defsRoot
      .append("filter")
      .attr("id", shadowId)
      .attr("x", "-40%")
      .attr("y", "-40%")
      .attr("width", "180%")
      .attr("height", "180%");
    shadowFilter
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 2)
      .attr("stdDeviation", 4)
      .attr("flood-color", "#0f172a")
      .attr("flood-opacity", 0.38);

    const strokeBase = projected ? 0.95 : 0.85;

    const provG = g.append("g").attr("class", "provinces");

    provG
      .selectAll("path")
      .data(geo.features)
      .join("path")
      .attr("class", "province")
      .attr("d", path)
      .attr("fill", (d) => {
        const name = d.properties?.name;
        const v = choroplethByProvince.get(name);
        const val = v == null || Number.isNaN(v) ? 0 : v;
        return colorScale(val);
      })
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.45)
      .attr("stroke-width", strokeBase)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        const name = d.properties?.name;
        onProvinceHover?.({
          x: event.clientX + 12,
          y: event.clientY + 12,
          province: name,
        });
      })
      .on("mousemove", (event, d) => {
        const name = d.properties?.name;
        onProvinceHover?.({
          x: event.clientX + 12,
          y: event.clientY + 12,
          province: name,
        });
      })
      .on("mouseleave", () => {
        onProvinceHover?.(null);
      })
      .on("click", (_, d) => {
        const name = d.properties?.name;
        if (name) onSelectProvince(name);
      });

    provG
      .selectAll(".province-sparse")
      .data(geo.features.filter((f) => sparseProvinces?.has(f.properties?.name)))
      .join("path")
      .attr("class", "province-sparse")
      .attr("d", path)
      .attr("fill", `url(#${hatchId})`)
      .attr("pointer-events", "none");

    const labelFont = Math.max(8, Math.min(13, width / 55));
    /** Minimum font we'll render inside a province before switching to external label. */
    const MIN_LABEL_FONT = 7;
    /** Gap (px) between province edge and the external label anchor. */
    const LEADER_PAD = 7;

    /**
     * NS and PE are always given external leader labels on a national-scale map.
     * Their shapes are too small/irregular for reliable internal centroid labelling:
     * NS is a thin peninsula whose geometric centroid lands in water at most zoom
     * levels; PE is a tiny crescent island. Every Canadian atlas treats them this way.
     */
    const ALWAYS_EXTERNAL = new Set(["Nova Scotia", "Prince Edward Island"]);

    const labelRows = geo.features.map((feature) => {
      const c = path.centroid(feature);
      const bounds = path.bounds(feature);
      const bboxW = Math.abs(bounds[1][0] - bounds[0][0]);
      const bboxH = Math.abs(bounds[1][1] - bounds[0][1]);
      const name = feature.properties?.name;
      const abbrev = name ? PROVINCE_NAME_TO_ABBREV[name] ?? "" : "";
      const validCentroid = Number.isFinite(c[0]) && Number.isFinite(c[1]);

      if (!abbrev || !validCentroid) {
        return { key: name ?? String(feature), abbrev: "", ok: false, external: false, font: labelFont, cx: -9999, cy: -9999, bboxW: 0, bboxH: 0, anchor: "middle" };
      }

      const estTextW = abbrev.length * labelFont * 0.75;
      const forceExternal = ALWAYS_EXTERNAL.has(name);

      // Internal label — only for provinces that are large enough AND not force-external.
      if (!forceExternal && bboxW > estTextW * 0.8 && bboxH > labelFont * 0.6) {
        return { key: name, cx: c[0], cy: c[1], abbrev, bboxW, bboxH, font: labelFont, ok: true, external: false, anchor: "middle" };
      }

      // Reduced internal font (min 7 px) — still not for force-external provinces.
      if (!forceExternal) {
        const reducedFont = Math.min(
          bboxW / (abbrev.length * 0.75 * 0.85),
          bboxH / 0.65
        );
        if (reducedFont >= MIN_LABEL_FONT) {
          return { key: name, cx: c[0], cy: c[1], abbrev, bboxW, bboxH, font: reducedFont, ok: true, external: false, anchor: "middle" };
        }
      }

      // External label — used for force-external provinces (NS, PE) at every width,
      // and for any province too small to fit an internal label.
      // Direction priority: right → left → above, whichever keeps the text inside the SVG.
      const estLabelW = abbrev.length * labelFont * 0.75 + 6;
      let extX, extY, anchor;

      if (bounds[1][0] + LEADER_PAD + estLabelW <= width) {
        // Right of the province bounding box
        extX = bounds[1][0] + LEADER_PAD;
        extY = c[1];
        anchor = "start";
      } else if (bounds[0][0] - LEADER_PAD - estLabelW >= 0) {
        // Left of the province bounding box
        extX = bounds[0][0] - LEADER_PAD;
        extY = c[1];
        anchor = "end";
      } else {
        // Above the province (last resort — clamp x so text stays in viewport)
        extX = Math.max(estLabelW / 2, Math.min(c[0], width - estLabelW / 2));
        extY = bounds[0][1] - LEADER_PAD;
        anchor = "middle";
      }

      return {
        key: name,
        cx: extX,
        cy: extY,
        leaderCx: c[0],
        leaderCy: c[1],
        abbrev,
        bboxW,
        bboxH,
        font: labelFont,
        ok: true,
        external: true,
        anchor,
      };
    });

    /* Leader lines + anchor dots for externally-placed labels (NS, PE, etc.). */
    const leadersG = g.append("g")
      .attr("class", "province-leaders")
      .attr("pointer-events", "none");

    leadersG.selectAll("line")
      .data(labelRows.filter((r) => r.external && r.ok), (r) => r.key)
      .join("line")
      .attr("class", "province-leader-line")
      .attr("x1", (r) => r.leaderCx)
      .attr("y1", (r) => r.leaderCy)
      .attr("x2", (r) => r.cx - (r.anchor === "start" ? 3 : r.anchor === "end" ? -3 : 0))
      .attr("y2", (r) => r.anchor === "middle" ? r.cy + 3 : r.cy)
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.75)
      .attr("stroke-opacity", 0.7);

    leadersG.selectAll("circle")
      .data(labelRows.filter((r) => r.external && r.ok), (r) => r.key)
      .join("circle")
      .attr("class", "province-leader-dot")
      .attr("cx", (r) => r.leaderCx)
      .attr("cy", (r) => r.leaderCy)
      .attr("r", 2)
      .attr("fill", "#374151")
      .attr("fill-opacity", 0.55);

    g.append("g")
      .attr("class", "province-labels")
      .attr("pointer-events", "none")
      .selectAll("text")
      .data(labelRows, (r) => r.key)
      .join("text")
      .attr("class", "province-label")
      .attr("font-size", (r) => r.font)
      .attr("transform", (r) =>
        r.ok ? `translate(${r.cx},${r.cy})` : "translate(-9999,-9999)"
      )
      .attr("opacity", (r) => (r.ok ? 1 : 0))
      .attr("text-anchor", (r) => r.anchor ?? "middle")
      .attr("dominant-baseline", "central")
      .text((r) => r.abbrev);

    /* Selection uses elevation (shadow + bold stroke) — NOT opacity dimming.
       Dimming lightens fill colour, which conflicts with the colour-encodes-value
       principle (lighter = lower value on the YlOrRd ramp). */
    provG.selectAll(".province")
      .attr("opacity", (d) => {
        const name = d.properties?.name;
        return name && sparseProvinces?.has(name) ? 0.92 : 1;
      })
      .attr("stroke", (d) =>
        d.properties?.name === selectedProvince ? "#0f172a" : "#64748b"
      )
      .attr("stroke-width", (d) =>
        d.properties?.name === selectedProvince ? 2.5 : strokeBase
      )
      .attr("stroke-opacity", (d) =>
        d.properties?.name === selectedProvince ? 1 : 0.45
      )
      .attr("filter", (d) =>
        d.properties?.name === selectedProvince ? `url(#${shadowId})` : null
      );

    /* Raise selected province to top of z-order so its shadow
       renders above neighbouring province fills. */
    if (selectedProvince) {
      provG.selectAll(".province")
        .filter((d) => d.properties?.name === selectedProvince)
        .raise();
    }

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 14])
      .filter((event) => {
        if (event.type === "dblclick") return false;
        return (!event.ctrlKey || event.type === "wheel") && !event.button;
      })
      .on("zoom", (event) => {
        gZoom.attr("transform", event.transform);
        const k = event.transform.k;
        g.selectAll(".province-label")
          .attr("font-size", (d) => d.font / k)
          .attr("opacity", (d) => {
            if (!d.ok) return 0;
            // External labels (e.g. NS, PE) are always shown — they exist
            // precisely because the province is too small for an internal label.
            if (d.external) return 1;
            const curFont = d.font / k;
            const estW = d.abbrev.length * curFont * 0.75;
            return (d.bboxW * k > estW * 0.8 && d.bboxH * k > curFont * 0.6) ? 1 : 0;
          });
        // Scale leader lines inversely so their visual weight stays constant.
        g.selectAll(".province-leader-line")
          .attr("stroke-width", 0.75 / k);
        g.selectAll(".province-leader-dot")
          .attr("r", 2 / k);
      });

    svg.call(zoom);

    svg.on("dblclick.reset", (event) => {
      event.preventDefault();
      svg.transition().duration(220).call(zoom.transform, d3.zoomIdentity);
    });

    return () => {
      svg.on(".zoom", null);
      svg.on("dblclick.reset", null);
    };
  }, [
    geo,
    choroplethByProvince,
    colorScale,
    width,
    selectedProvince,
    onProvinceHover,
    onSelectProvince,
    sparseProvinces,
  ]);

  return (
    <div ref={wrapperRef} className="map-wrap">
      <svg ref={svgRef} className="canada-map" role="img" aria-label="Canada choropleth map" />
    </div>
  );
}

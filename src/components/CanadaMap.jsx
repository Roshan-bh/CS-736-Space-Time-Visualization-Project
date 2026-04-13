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

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(w);
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
      .attr("width", "100%")
      .attr("height", height);

    const gZoom = svg.append("g").attr("class", "map-zoom-layer");

    const g = gZoom.append("g").attr("class", "map-root");

    const hatchId = `hatch-${Math.random().toString(36).slice(2)}`;
    const defsRoot = svg.append("defs");
    defsRoot
      .append("pattern")
      .attr("id", hatchId)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 8)
      .attr("height", 8)
      .append("path")
      .attr(
        "d",
        "M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2"
      )
      .attr("stroke", "rgba(30,30,30,0.28)")
      .attr("stroke-width", 1.15);

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

    const labelFont = Math.max(9, Math.min(13, width / 52));
    const labelRows = geo.features.map((feature) => {
      const c = path.centroid(feature);
      const name = feature.properties?.name;
      return {
        key: name ?? String(feature),
        cx: c[0],
        cy: c[1],
        abbrev: name ? PROVINCE_NAME_TO_ABBREV[name] ?? "" : "",
        ok: Number.isFinite(c[0]) && Number.isFinite(c[1]),
      };
    });
    g.append("g")
      .attr("class", "province-labels")
      .attr("pointer-events", "none")
      .selectAll("text")
      .data(labelRows, (r) => r.key)
      .join("text")
      .attr("class", "province-label")
      .attr("font-size", labelFont)
      .attr("transform", (r) =>
        r.ok ? `translate(${r.cx},${r.cy})` : "translate(0,0)"
      )
      .attr("opacity", (r) => (r.ok ? 1 : 0))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .text((r) => r.abbrev);

    provG.selectAll(".province")
      .attr("opacity", (d) => {
        const name = d.properties?.name;
        let base = !selectedProvince ? 1 : name === selectedProvince ? 1 : 0.45;
        if (name && sparseProvinces?.has(name)) base *= 0.92;
        return base;
      })
      .attr("stroke-width", (d) =>
        d.properties?.name === selectedProvince ? 1.65 : strokeBase
      )
      .attr("stroke-opacity", (d) =>
        d.properties?.name === selectedProvince ? 0.95 : 0.55
      );

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
        g.selectAll(".province-label").attr("font-size", labelFont / k);
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

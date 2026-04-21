/**
 * D3 color scales for linked views — choropleth and heatmap both use YlOrRd so colours match;
 * numeric domains may still differ for count metrics (map = range total, heatmap = weekly cells).
 */

import * as d3 from "d3";

/**
 * ColorBrewer-style yellow → orange → red (choropleth and heatmap).
 * @param {number} min
 * @param {number} max
 */
export function choroplethScaleYlOrRd(min, max) {
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 1;
  if (max <= min) max = min + 1e-9;
  return d3.scaleSequential(d3.interpolateYlOrRd).domain([min, max]);
}

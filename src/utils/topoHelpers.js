/**
 * Resolve TopoJSON layer and normalize province labels for the app.
 * Official Canada files often use objects.ProvincesTerritories and PRENAME (English).
 */

import { feature } from "topojson-client";

/**
 * Pick the first usable geometry object from a Topology.
 * @param {import('topojson-specification').Topology} topology
 */
export function getTopoObject(topology) {
  if (!topology?.objects) return null;
  const { objects } = topology;
  if (objects.provinces) return objects.provinces;
  if (objects.ProvincesTerritories) return objects.ProvincesTerritories;
  const key = Object.keys(objects)[0];
  return key ? objects[key] : null;
}

/**
 * English name from StatsCan-style properties (or generic GeoJSON name).
 * @param {Record<string, unknown>} props
 */
export function provinceNameFromTopoProperties(props) {
  if (!props) return "";
  if (typeof props.PRENAME === "string" && props.PRENAME.trim())
    return props.PRENAME.trim();
  if (typeof props.name === "string" && props.name.trim())
    return props.name.trim();
  if (typeof props.NAME === "string" && props.NAME.trim())
    return props.NAME.trim();
  if (typeof props.PRNAME === "string") {
    const part = props.PRNAME.split("/")[0];
    return part ? part.trim() : "";
  }
  return "";
}

/**
 * Align with TopoJSON / constants used elsewhere (e.g. Yukon vs Yukon Territory).
 * @param {string} raw
 */
export function canonicalProvinceLabel(raw) {
  if (!raw) return "";
  if (raw === "Yukon") return "Yukon Territory";
  return raw;
}

/**
 * @param {import('topojson-specification').Topology} topology
 * @returns {import('geojson').FeatureCollection}
 */
export function topoToFeatureCollection(topology) {
  const obj = getTopoObject(topology);
  if (!obj?.type) {
    return { type: "FeatureCollection", features: [] };
  }
  const fc = feature(topology, obj);
  for (const f of fc.features) {
    if (!f.properties) f.properties = {};
    const raw = provinceNameFromTopoProperties(f.properties);
    f.properties.name = canonicalProvinceLabel(raw);
  }
  return fc;
}

/**
 * StatsCan (and similar) boundaries are often in projected metres; WGS84 uses small degree values.
 * @param {import('geojson').FeatureCollection} fc
 */
export function boundsLookProjected(fc) {
  const f = fc.features[0];
  if (!f?.geometry) return false;
  const pt = firstCoordinatePair(f.geometry);
  if (!pt) return false;
  return Math.abs(pt[0]) > 1000 || Math.abs(pt[1]) > 1000;
}

/** @param {import('geojson').Geometry} geometry */
function firstCoordinatePair(geometry) {
  let c = geometry.coordinates;
  while (Array.isArray(c[0])) c = c[0];
  if (
    Array.isArray(c) &&
    typeof c[0] === "number" &&
    typeof c[1] === "number"
  ) {
    return /** @type {[number, number]} */ (c);
  }
  return null;
}

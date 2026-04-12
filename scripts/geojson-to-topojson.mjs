/**
 * One-time helper: converts GeoJSON to TopoJSON for bundling.
 * Source: public domain-style Canada provinces (click_that_hood).
 * Replace src/data/ProvincesTerritories.topo.json with your official file if required.
 */
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as topojson from "topojson-server";

const __dirname = dirname(fileURLToPath(import.meta.url));
const geo = JSON.parse(fs.readFileSync(join(__dirname, "canada.geojson"), "utf8"));
const topology = topojson.topology({ provinces: geo });
fs.writeFileSync(
  join(__dirname, "../src/data/ProvincesTerritories.topo.json"),
  JSON.stringify(topology)
);
console.log("Wrote ProvincesTerritories.topo.json");

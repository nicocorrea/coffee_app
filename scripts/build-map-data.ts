// Builds lib/journey/map-data.json from world-atlas (dev dependency only).
// Run with: npm run map  (Node 24 strips the types natively)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoBounds, geoCentroid, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { COUNTRIES } from "../lib/journey/countries.ts";

const require = createRequire(import.meta.url);
const load = (name: string) => JSON.parse(readFileSync(require.resolve(`world-atlas/${name}`), "utf8"));

// d3 and topojson ship no bundled types here; a loose alias keeps this dev script simple.
type Geo = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const EXTENT: [[number, number], [number, number]] = [[40, 30], [320, 250]];

function build(geo: Geo) {
  const projection = geoMercator().fitExtent(EXTENT, geo);
  const d = geoPath(projection).digits(1)(geo);
  if (!d) throw new Error("empty path");
  const [tx, ty] = projection.translate();
  const [[lonMin, latMin], [lonMax, latMax]] = geoBounds(geo);
  return { d, k: projection.scale(), tx, ty, bbox: [lonMin, latMin, lonMax, latMax], centroid: geoCentroid(geo) };
}

function run(file: string) {
  const topo = load(file);
  const fc: Geo = feature(topo, topo.objects.countries);
  const out: Record<string, ReturnType<typeof build>> = {};
  for (const c of COUNTRIES) {
    const f = fc.features.find((x: Geo) => String(x.id) === c.mapId);
    if (!f) throw new Error(`no feature for ${c.key} (${c.mapId})`);
    out[c.key] = build(f);
  }
  // Coffee belt for blends: 110m land fitted to lon -110..160, lat -30..35.
  const land: Geo = load("land-110m.json");
  const landGeo = feature(land, land.objects.land);
  const belt: Geo = { type: "MultiPoint", coordinates: [[-110, -30], [160, -30], [160, 35], [-110, 35]] };
  const projection = geoMercator().fitExtent(EXTENT, belt);
  // Clip to the cover's viewBox so Antarctica and far-off land are not bundled.
  const path = geoPath(projection.clipExtent([[0, 0], [360, 300]])).digits(1);
  const [tx, ty] = projection.translate();
  out.WORLD = { d: path(landGeo as Geo)!, k: projection.scale(), tx, ty, bbox: [-110, -30, 160, 35], centroid: [25, 2.5] };
  return out;
}

let data = run("countries-50m.json");
let json = JSON.stringify(data);
console.log(`50m: ${json.length} bytes`);
if (json.length > 150_000) {
  data = run("countries-110m.json");
  json = JSON.stringify(data);
  console.log(`110m: ${json.length} bytes`);
}
writeFileSync(new URL("../lib/journey/map-data.json", import.meta.url), json + "\n");

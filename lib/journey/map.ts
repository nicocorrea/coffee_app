import data from "./map-data.json";

export type CountryShape = {
  d: string;
  k: number;
  tx: number;
  ty: number;
  bbox: [lonMin: number, latMin: number, lonMax: number, latMax: number];
  centroid: [lon: number, lat: number];
};

const SHAPES = data as unknown as Record<string, CountryShape>;
const MARGIN = 0.5;

export function shapeFor(key: string): CountryShape | null {
  return SHAPES[key] ?? null;
}

// Raw Mercator in the shape's own frame.
export function project(s: CountryShape, lon: number, lat: number): [number, number] {
  const lam = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  return [s.tx + s.k * lam, s.ty - s.k * Math.log(Math.tan(Math.PI / 4 + phi / 2))];
}

export function pinFor(
  s: CountryShape,
  coords: { lat: number; lon: number } | null,
): { x: number; y: number; approximate: boolean } {
  if (coords) {
    const [w, south, e, n] = s.bbox;
    if (coords.lon >= w - MARGIN && coords.lon <= e + MARGIN && coords.lat >= south - MARGIN && coords.lat <= n + MARGIN) {
      const [x, y] = project(s, coords.lon, coords.lat);
      return { x, y, approximate: false };
    }
  }
  const [x, y] = project(s, ...s.centroid);
  return { x, y, approximate: true };
}

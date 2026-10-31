import type { Drying, PickMethod, ProcessKind, Range, Setting } from "./types";

// Typical ("how it's usually done") practice per producing country.
// Only type imports here: a Node script imports this file directly.
export type CountryInfo = {
  key: string; // ISO 3166-1 alpha-3
  mapId: string; // ISO 3166-1 numeric, as in world-atlas
  name: string;
  aliases: string[];
  picking: PickMethod;
  setting: Setting;
  drying: Drying;
  altitude: Range; // metres
  port: string; // usual export port
  seaWeeksToEurope: Range; // sea time from the export port to a European port
};

export const COUNTRIES: CountryInfo[] = [
  { key: "ETH", mapId: "231", name: "Ethiopia", aliases: ["Yirgacheffe", "Sidamo", "Sidama", "Guji", "Harrar", "Limu", "Jimma", "Gedeb"], picking: "hand", setting: "forest", drying: "raised-beds", altitude: { min: 1500, max: 2200 }, port: "Djibouti", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "KEN", mapId: "404", name: "Kenya", aliases: ["Nyeri", "Kirinyaga", "Kiambu", "Murang'a", "Embu"], picking: "hand", setting: "shade", drying: "raised-beds", altitude: { min: 1400, max: 2100 }, port: "Mombasa", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "RWA", mapId: "646", name: "Rwanda", aliases: ["Kivu", "Nyamasheke", "Huye"], picking: "hand", setting: "shade", drying: "raised-beds", altitude: { min: 1500, max: 2000 }, port: "Dar es Salaam", seaWeeksToEurope: { min: 4, max: 6 } },
  { key: "BDI", mapId: "108", name: "Burundi", aliases: ["Kayanza", "Ngozi"], picking: "hand", setting: "shade", drying: "raised-beds", altitude: { min: 1400, max: 2000 }, port: "Dar es Salaam", seaWeeksToEurope: { min: 4, max: 6 } },
  { key: "UGA", mapId: "800", name: "Uganda", aliases: ["Bugisu", "Mount Elgon", "Rwenzori"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1200, max: 2300 }, port: "Mombasa", seaWeeksToEurope: { min: 4, max: 6 } },
  { key: "TZA", mapId: "834", name: "Tanzania", aliases: ["Kilimanjaro", "Mbeya", "Mbozi", "Ruvuma"], picking: "hand", setting: "shade", drying: "raised-beds", altitude: { min: 1200, max: 2000 }, port: "Dar es Salaam", seaWeeksToEurope: { min: 4, max: 6 } },
  { key: "YEM", mapId: "887", name: "Yemen", aliases: ["Mocha", "Mokha", "Haraz"], picking: "hand", setting: "sun", drying: "patio", altitude: { min: 1500, max: 2500 }, port: "Hodeidah", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "COL", mapId: "170", name: "Colombia", aliases: ["Huila", "Nariño", "Narino", "Cauca", "Tolima", "Antioquia", "Quindío", "Quindio"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1200, max: 2000 }, port: "Buenaventura", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "BRA", mapId: "076", name: "Brazil", aliases: ["Brasil", "Cerrado", "Minas Gerais", "Sul de Minas", "Mogiana", "Bahia", "Espírito Santo"], picking: "machine", setting: "sun", drying: "patio", altitude: { min: 600, max: 1300 }, port: "Santos", seaWeeksToEurope: { min: 2, max: 4 } },
  { key: "PER", mapId: "604", name: "Peru", aliases: ["Cajamarca", "Chanchamayo", "Cusco"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1200, max: 2000 }, port: "Callao", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "BOL", mapId: "068", name: "Bolivia", aliases: ["Caranavi", "Yungas"], picking: "hand", setting: "shade", drying: "raised-beds", altitude: { min: 1200, max: 1900 }, port: "Arica", seaWeeksToEurope: { min: 4, max: 6 } },
  { key: "ECU", mapId: "218", name: "Ecuador", aliases: ["Loja", "Zamora"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1000, max: 2000 }, port: "Guayaquil", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "GTM", mapId: "320", name: "Guatemala", aliases: ["Antigua", "Huehuetenango", "Atitlán", "Atitlan", "Cobán", "Coban", "Acatenango"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1300, max: 2000 }, port: "Puerto Barrios", seaWeeksToEurope: { min: 2, max: 4 } },
  { key: "HND", mapId: "340", name: "Honduras", aliases: ["Marcala", "Copán", "Copan", "Santa Bárbara", "Santa Barbara"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1000, max: 1800 }, port: "Puerto Cortés", seaWeeksToEurope: { min: 2, max: 4 } },
  { key: "SLV", mapId: "222", name: "El Salvador", aliases: ["Apaneca", "Santa Ana", "Chalatenango"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 900, max: 1800 }, port: "Acajutla", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "NIC", mapId: "558", name: "Nicaragua", aliases: ["Jinotega", "Matagalpa", "Nueva Segovia"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1000, max: 1600 }, port: "Corinto", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "CRI", mapId: "188", name: "Costa Rica", aliases: ["Tarrazú", "Tarrazu", "Tres Ríos", "Tres Rios", "West Valley", "Naranjo"], picking: "hand", setting: "sun", drying: "patio", altitude: { min: 1200, max: 1900 }, port: "Puerto Limón", seaWeeksToEurope: { min: 2, max: 4 } },
  { key: "PAN", mapId: "591", name: "Panama", aliases: ["Boquete", "Volcán", "Volcan", "Geisha Panama"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1200, max: 1900 }, port: "Colón", seaWeeksToEurope: { min: 2, max: 4 } },
  { key: "MEX", mapId: "484", name: "Mexico", aliases: ["Chiapas", "Oaxaca", "Veracruz"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 900, max: 1700 }, port: "Veracruz", seaWeeksToEurope: { min: 2, max: 4 } },
  { key: "JAM", mapId: "388", name: "Jamaica", aliases: ["Blue Mountain"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 900, max: 1700 }, port: "Kingston", seaWeeksToEurope: { min: 2, max: 4 } },
  { key: "IDN", mapId: "360", name: "Indonesia", aliases: ["Sumatra", "Java", "Sulawesi", "Bali", "Flores", "Gayo", "Toraja", "Mandheling", "Lintong", "Aceh"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 900, max: 1600 }, port: "Belawan", seaWeeksToEurope: { min: 5, max: 7 } },
  { key: "PNG", mapId: "598", name: "Papua New Guinea", aliases: ["Papua", "Highlands Papua New Guinea", "Wahgi"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1200, max: 1800 }, port: "Lae", seaWeeksToEurope: { min: 5, max: 7 } },
  { key: "IND", mapId: "356", name: "India", aliases: ["Karnataka", "Chikmagalur", "Coorg", "Malabar", "Monsooned Malabar", "Araku"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 800, max: 1500 }, port: "Mangalore", seaWeeksToEurope: { min: 3, max: 5 } },
  { key: "VNM", mapId: "704", name: "Vietnam", aliases: ["Dak Lak", "Da Lat", "Lam Dong", "Buon Ma Thuot"], picking: "hand", setting: "sun", drying: "patio", altitude: { min: 500, max: 1500 }, port: "Ho Chi Minh City", seaWeeksToEurope: { min: 5, max: 7 } },
  { key: "CHN", mapId: "156", name: "China", aliases: ["Yunnan", "Pu'er", "Puer", "Baoshan"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1000, max: 1800 }, port: "Shanghai", seaWeeksToEurope: { min: 5, max: 7 } },
  { key: "MMR", mapId: "104", name: "Myanmar", aliases: ["Burma", "Shan", "Pyin Oo Lwin", "Ywangan"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 1000, max: 1500 }, port: "Yangon", seaWeeksToEurope: { min: 5, max: 7 } },
  { key: "THA", mapId: "764", name: "Thailand", aliases: ["Chiang Mai", "Chiang Rai", "Doi Chaang"], picking: "hand", setting: "shade", drying: "patio", altitude: { min: 800, max: 1400 }, port: "Laem Chabang", seaWeeksToEurope: { min: 5, max: 7 } },
];

export const GENERIC: {
  picking: PickMethod;
  setting: Setting;
  drying: Drying;
  altitude: Range;
  seaWeeksToEurope: Range;
} = {
  picking: "hand",
  setting: "shade",
  drying: "patio",
  altitude: { min: 1000, max: 1800 },
  seaWeeksToEurope: { min: 3, max: 6 },
};

export const DRYING_DAYS: Record<ProcessKind, Range> = {
  natural: { min: 18, max: 30 },
  honey: { min: 10, max: 20 },
  washed: { min: 8, max: 15 },
  anaerobic: { min: 15, max: 30 },
  "wet-hulled": { min: 3, max: 7 },
  other: { min: 10, max: 25 },
};

export const EUROPE_PORTS = "Hamburg, Antwerp or Trieste";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest names first, so "Papua New Guinea" wins over a shorter alias.
const MATCHERS = COUNTRIES.flatMap((c) =>
  [c.name, ...c.aliases].map((term) => ({
    country: c,
    len: norm(term).length,
    re: new RegExp(`(^| )${escapeRe(norm(term))}( |$)`),
  })),
).sort((a, b) => b.len - a.len);

export function countryFor(text: string | null): CountryInfo | null {
  if (!text) return null;
  const t = norm(text);
  if (!t) return null;
  return MATCHERS.find((m) => m.re.test(t))?.country ?? null;
}

export function countriesIn(origin: string, region: string | null): CountryInfo[] {
  const isBlend = /^\s*blend\s*$/i.test(origin);
  const source = isBlend ? (region ?? "") : origin;
  const out: CountryInfo[] = [];
  for (const part of source.split(/,|&|\/|\+|\band\b/i)) {
    const c = countryFor(part);
    if (c && !out.includes(c)) out.push(c);
  }
  if (out.length === 0 && !isBlend) {
    const c = countryFor(region);
    if (c) out.push(c);
  }
  return out;
}

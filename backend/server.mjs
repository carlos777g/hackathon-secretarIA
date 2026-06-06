#!/usr/bin/env node
/*
  ImpactoCDMX Backend

  Backend Node.js sin dependencias externas para el Reto 3:
  Derrama economica en eventos.

  Fuentes del PDF:
  - Festividades y eventos: https://cartelera.cdmx.gob.mx/
  - Ocupacion hotelera: DataTur / datos.gob.mx
  - Afluencia turistica: Turismo CDMX y GTFS CDMX
  - Establecimientos y datos economicos: DENUE / INEGI

  El backend intenta usar datos reales cuando la fuente es consultable. Si una
  fuente requiere token, descarga manual o cambia su HTML, conserva la demo con
  datos sinteticos plausibles marcados como fallback.
*/

import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { URL } from "node:url";

await loadDotenvLocal();

const PORT = Number(process.env.PORT || 8787);
const CACHE_DIR = resolve("impactocdmx", "backend", ".cache");
const DATA_DIR = resolve("impactocdmx", "data");
const CACHE_TTL_MS = Number(process.env.IMPACTOCDMX_CACHE_TTL_MS || 1000 * 60 * 60 * 6);

async function loadDotenvLocal() {
  const candidates = [resolve(".env.local"), resolve("impactocdmx", "backend", ".env.local")];

  for (const path of candidates) {
    if (!existsSync(path)) continue;

    const text = await readFile(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  }
}

const SOURCES = {
  cartelera: {
    id: "cartelera",
    name: "Cartelera CDMX",
    url: "https://cartelera.cdmx.gob.mx/busqueda",
    use: "Festividades y eventos",
  },
  datatur: {
    id: "datatur",
    name: "DataTur / datos.gob.mx",
    url: "https://www.datos.gob.mx/dataset/ocupacion_hotelera_70_destinos_principales_monitoreados_datatur",
    use: "Ocupacion hotelera",
  },
  turismoCdmx: {
    id: "turismo_cdmx",
    name: "Secretaria de Turismo CDMX",
    url: "https://www.turismo.cdmx.gob.mx/actividad-turistica/estadisticas-de-la-actividad-turistica",
    use: "Afluencia turistica",
  },
  gtfs: {
    id: "gtfs_cdmx",
    name: "GTFS CDMX",
    url: "https://datos.cdmx.gob.mx/tr/dataset/gtfs",
    use: "Accesibilidad en transporte publico",
  },
  denue: {
    id: "denue",
    name: "DENUE INEGI",
    url: "https://www.inegi.org.mx/servicios/api_denue.html",
    use: "Establecimientos economicos cercanos",
  },
  inegi: {
    id: "inegi_economico",
    name: "INEGI datos economicos",
    url: "https://www.inegi.org.mx/programas/enafin/2024/",
    use: "Contexto economico y parametros de modelado",
  },
};

const DEMO_EVENTS = [
  {
    id: "formula-1-cdmx",
    name: "Formula 1 Gran Premio de la Ciudad de Mexico",
    category: "deportivo",
    venue: "Autodromo Hermanos Rodriguez",
    borough: "Iztacalco",
    lat: 19.4042,
    lng: -99.0907,
    date: "2026-10-25",
    attendees: 395000,
    attendeesSourceUrl: "https://www.turismo.cdmx.gob.mx/comunicacion/nota/formula-1-es-un-importante-evento-turistico-economico-y-sociocultural-marti-batres-en-inauguracion-del-pabellon-de-la-ciudad-de-mexico",
    averageSpendMxn: 25285,
    averageSpendSourceUrl: "https://www.sedeco.cdmx.gob.mx/comunicacion/nota/estima-sedeco-derrama-economica-de-mas-de-19-mil-millones-de-pesos-por-el-gran-premio-de-mexico-de-la-formula-1",
    averageSpendMethod: "Componentes de consumo directo SEDECO F1 2024 / asistencia reportada por Turismo CDMX 2023.",
    averageSpendComment: "Se suman boletos, souvenirs, turismo/alojamiento, taxis/apps y alimentos/bebidas: $9,987,724,000 MXN. Se divide entre 395,000 asistentes reportados por Turismo CDMX.",
    annualGrowth: 0.08,
    radiusM: 1800,
    source: "official_report_derived",
  },
  {
    id: "vive-latino",
    name: "Vive Latino",
    category: "festival",
    venue: "Foro Sol",
    borough: "Iztacalco",
    lat: 19.4049,
    lng: -99.0954,
    date: "2026-03-15",
    attendees: 160000,
    averageSpendMxn: 10656,
    averageSpendSourceUrl: "https://jefaturadegobierno.cdmx.gob.mx/comunicacion/nota/recibira-ciudad-de-mexico-mil-705-mdp-de-derrama-economica-durante-el-segundo-fin-de-semana-largo-del-ano",
    averageSpendMethod: "Derrama reportada para segundo fin de semana largo con Vive Latino 2023 / turistas esperados.",
    averageSpendComment: "$1,705,000,000 MXN / 160,000 turistas = $10,656 MXN por turista. Es una aproximacion del periodo, no solo del festival.",
    annualGrowth: 0.06,
    radiusM: 1500,
    source: "official_report_derived",
  },
  {
    id: "corona-capital",
    name: "Corona Capital",
    category: "festival",
    venue: "Autodromo Hermanos Rodriguez",
    borough: "Iztacalco",
    lat: 19.4042,
    lng: -99.0907,
    date: "2026-11-15",
    attendees: 250000,
    averageSpendMxn: 10939,
    averageSpendSourceUrl: "https://www.turismo.cdmx.gob.mx/storage/app/media/Estadisticas/2025/inf/1%20Infografia_abril_2025.pdf",
    averageSpendMethod: "Gasto medio turistico total CDMX 2025 usado como proxy para festival con visitantes.",
    averageSpendComment: "Turismo CDMX reporta gasto medio total 2025 de $10,939 MXN. Se usa como benchmark al no tener reporte publico especifico del evento.",
    annualGrowth: 0.07,
    radiusM: 1600,
    source: "official_benchmark",
  },
  {
    id: "dia-de-muertos",
    name: "Desfile de Dia de Muertos",
    category: "cultural",
    venue: "Centro Historico - Paseo de la Reforma",
    borough: "Cuauhtemoc",
    lat: 19.4326,
    lng: -99.1332,
    date: "2026-11-01",
    attendees: 1200000,
    averageSpendMxn: 250,
    averageSpendSourceUrl: "https://www.sedeco.cdmx.gob.mx/storage/app/media/Fichas%20economicas/estimacion-derrama-economica-dia-de-muertos-2021-para-el-secretario.pdf",
    averageSpendMethod: "Consumo promedio por persona reportado por SEDECO para Dia de Muertos 2021.",
    averageSpendComment: "SEDECO reporta consumo promedio por persona de $250 MXN. Se usa para el desfile como evento cultural de consumo local.",
    annualGrowth: 0.05,
    radiusM: 2200,
    source: "official_report",
  },
  {
    id: "maraton-cdmx",
    name: "Maraton de la Ciudad de Mexico",
    category: "deportivo",
    venue: "Ruta Olimpica - Zocalo",
    borough: "Cuauhtemoc",
    lat: 19.4326,
    lng: -99.1332,
    date: "2026-08-30",
    attendees: 300000,
    averageSpendMxn: 5359,
    averageSpendSourceUrl: "https://www.turismo.cdmx.gob.mx/storage/app/media/Estadisticas/2025/inf/1%20Infografia_abril_2025.pdf",
    averageSpendMethod: "Gasto medio turista nacional CDMX 2025 usado como proxy para evento deportivo con visitantes nacionales.",
    averageSpendComment: "Turismo CDMX reporta gasto medio de turista nacional 2025 de $5,359 MXN. Se usa como benchmark para participantes/visitantes nacionales.",
    annualGrowth: 0.04,
    radiusM: 2000,
    source: "official_benchmark",
  },
];

const DEMO_HOTEL = {
  occupancyRate: 0.68,
  touristArrivalFactor: 1.12,
  source: "synthetic_fallback",
  note: "Parametro demo usado si DataTur no entrega una tabla consultable automaticamente.",
};

const DEMO_TOURISM = {
  touristFlowIndex: 1.08,
  source: "synthetic_fallback",
  note: "Indice demo usado si Turismo CDMX no expone datos estructurados.",
};

const DEMO_TRANSIT = {
  stopsNearVenue: 18,
  source: "synthetic_fallback",
  note: "Indicador demo usado si GTFS solo esta disponible como descarga ZIP.",
};

const SECTOR_KEYWORDS = {
  restaurantes: ["restaurante", "cafeteria", "cafe", "bar", "alimentos", "antojitos", "taqueria", "comida"],
  hoteles: ["hotel", "motel", "hospedaje", "alojamiento"],
  comercio: ["tienda", "comercio", "abarrotes", "ropa", "farmacia", "departamental", "venta"],
  transporte: ["transporte", "taxi", "estacionamiento", "autobus", "metro", "turistico"],
};

const DEMO_BUSINESSES_BY_EVENT = {
  "formula-1-cdmx": { restaurantes: 46, hoteles: 14, comercio: 38, transporte: 12 },
  "vive-latino": { restaurantes: 32, hoteles: 9, comercio: 26, transporte: 10 },
  "corona-capital": { restaurantes: 40, hoteles: 12, comercio: 35, transporte: 11 },
  "dia-de-muertos": { restaurantes: 125, hoteles: 48, comercio: 150, transporte: 34 },
  "maraton-cdmx": { restaurantes: 80, hoteles: 28, comercio: 75, transporte: 26 },
};

const HISTORICAL_IMPACT = [
  { year: 2022, economicImpactMxn: 3450000000, source: "synthetic_seed" },
  { year: 2023, economicImpactMxn: 3890000000, source: "synthetic_seed" },
  { year: 2024, economicImpactMxn: 4520000000, source: "synthetic_seed" },
  { year: 2025, economicImpactMxn: 5030000000, source: "synthetic_seed" },
  { year: 2026, economicImpactMxn: 5390000000, source: "synthetic_seed" },
];

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function json(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function notFound(response) {
  json(response, 404, { error: "Ruta no encontrada" });
}

function badRequest(response, message) {
  json(response, 400, { error: message });
}

async function cachedJson(key, producer, ttlMs = CACHE_TTL_MS) {
  await mkdir(CACHE_DIR, { recursive: true });
  const path = join(CACHE_DIR, `${slugify(key)}.json`);

  if (existsSync(path)) {
    try {
      const cached = JSON.parse(await readFile(path, "utf8"));
      const cachedFailure = cached.value?.ok === false && cached.value?.diagnostics;
      if (!cachedFailure && Date.now() - cached.savedAt < ttlMs) return cached.value;
    } catch {
      // Ignore corrupted cache and refresh.
    }
  }

  const value = await producer();
  await writeFile(path, JSON.stringify({ savedAt: Date.now(), value }, null, 2), "utf8");
  return value;
}

async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "ImpactoCDMX/0.1 hackathon prototype",
        accept: "text/html,application/json,text/plain,*/*",
      },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs = 15000) {
  const text = await fetchText(url, timeoutMs);
  return JSON.parse(text);
}

function readNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function classifySector(record) {
  const text = Object.values(record)
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) return sector;
  }

  return "comercio";
}

async function loadLocalEvents() {
  const path = join(DATA_DIR, "eventos.json");
  if (!existsSync(path)) return [];
  const rows = JSON.parse(await readFile(path, "utf8"));
  return rows.map(normalizeEvent).filter(Boolean);
}

function normalizeEvent(raw) {
  const name = raw.name || raw.nombre || raw.title || raw.titulo;
  if (!name) return null;

  return {
    id: raw.id || slugify(name),
    name,
    category: raw.category || raw.categoria || "evento",
    venue: raw.venue || raw.sede || "CDMX",
    borough: raw.borough || raw.alcaldia || "CDMX",
    lat: readNumber(raw.lat, 19.4326),
    lng: readNumber(raw.lng || raw.lon || raw.longitud, -99.1332),
    date: raw.date || raw.fecha || null,
    attendees: readNumber(raw.attendees || raw.asistentes, 50000),
    averageSpendMxn: readNumber(raw.averageSpendMxn || raw.gasto_promedio || raw.gastoPromedio, 1200),
    averageSpendSourceUrl: raw.averageSpendSourceUrl || raw.fuente_gasto_url || null,
    averageSpendMethod: raw.averageSpendMethod || raw.metodo_gasto || null,
    averageSpendComment: raw.averageSpendComment || raw.comentario_gasto || null,
    attendeesSourceUrl: raw.attendeesSourceUrl || raw.fuente_asistentes_url || null,
    annualGrowth: readNumber(raw.annualGrowth || raw.crecimiento_anual, 0.05),
    radiusM: readNumber(raw.radiusM || raw.radio_m, 1200),
    source: raw.source || "local_file",
  };
}

async function fetchCarteleraEvents() {
  return cachedJson("cartelera-events", async () => {
    try {
      const html = await fetchText(SOURCES.cartelera.url);
      const events = extractEventsFromHtml(html);

      return {
        ok: events.length > 0,
        source: SOURCES.cartelera,
        events,
        diagnostics: events.length
          ? `Se detectaron ${events.length} eventos desde HTML publico.`
          : "No se detectaron eventos estructurados en el HTML publico.",
      };
    } catch (error) {
      return {
        ok: false,
        source: SOURCES.cartelera,
        events: [],
        diagnostics: `No fue posible consultar Cartelera CDMX: ${error.message}`,
      };
    }
  });
}

function extractEventsFromHtml(html) {
  const events = [];

  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(stripTags(match[1]).trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items.flatMap((entry) => entry?.["@graph"] || entry)) {
        if (!item || !["Event", "Festival"].includes(item["@type"])) continue;
        events.push(
          normalizeEvent({
            name: item.name,
            category: "cartelera",
            venue: item.location?.name,
            date: item.startDate,
            source: "cartelera_cdmx",
          }),
        );
      }
    } catch {
      // Continue with other script blocks.
    }
  }

  const titleMatches = [...html.matchAll(/<a[^>]+href=["'][^"']*(?:evento|eventos|detalle)[^"']*["'][^>]*>([\s\S]{8,160}?)<\/a>/gi)]
    .map((match) => stripTags(match[1]).replace(/\s+/g, " ").trim())
    .filter((title) => title.length > 8 && !/eventos cerca|busca un evento/i.test(title));

  for (const title of titleMatches.slice(0, 20)) {
    events.push(
      normalizeEvent({
        name: title,
        category: "cartelera",
        source: "cartelera_cdmx_html",
        attendees: 15000,
        averageSpendMxn: 750,
      }),
    );
  }

  const unique = new Map();
  for (const event of events.filter(Boolean)) unique.set(event.id, event);
  return [...unique.values()].slice(0, 20);
}

function stripTags(value) {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

async function fetchDataTurHotelContext() {
  return cachedJson("datatur-hotel-context", async () => {
    try {
      const packageInfo = await fetchJson(
        "https://datos.gob.mx/api/3/action/package_show?id=ocupacion_hotelera_70_destinos_principales_monitoreados_datatur",
      );
      const resources = packageInfo.result?.resources || [];
      const downloadable = resources.find((resource) => /csv|xlsx|xls/i.test(`${resource.format} ${resource.url}`));

      return {
        ok: true,
        ...DEMO_HOTEL,
        source: "datatur_metadata",
        dataset: SOURCES.datatur.url,
        resource: downloadable
          ? {
              name: downloadable.name,
              format: downloadable.format,
              url: downloadable.url,
              lastModified: downloadable.last_modified || downloadable.revision_timestamp,
            }
          : null,
        note: downloadable
          ? "Se encontro recurso de DataTur. Para produccion se recomienda descargarlo y mapear Ciudad de Mexico semanalmente."
          : "Se consulto metadata de DataTur, pero no se encontro recurso tabular directo.",
      };
    } catch (error) {
      return { ok: false, ...DEMO_HOTEL, diagnostics: error.message };
    }
  });
}

async function fetchTourismContext() {
  return cachedJson("turismo-cdmx-context", async () => {
    try {
      const html = await fetchText(SOURCES.turismoCdmx.url);
      const snippets = [...html.matchAll(/(?:turistas|visitantes|ocupaci[oó]n|derrama)[^<]{0,120}/gi)]
        .map((match) => stripTags(match[0]))
        .slice(0, 8);

      return {
        ok: snippets.length > 0,
        ...DEMO_TOURISM,
        source: snippets.length ? "turismo_cdmx_page" : "synthetic_fallback",
        snippets,
        note: snippets.length
          ? "La pagina fue consultada; los snippets sirven como evidencia cualitativa para la demo."
          : DEMO_TOURISM.note,
      };
    } catch (error) {
      return { ok: false, ...DEMO_TOURISM, diagnostics: error.message };
    }
  });
}

async function fetchGtfsContext() {
  return cachedJson("gtfs-cdmx-context", async () => {
    try {
      const packageInfo = await fetchJson("https://datos.cdmx.gob.mx/api/3/action/package_show?id=gtfs");
      const resources = packageInfo.result?.resources || [];
      const gtfs = resources.find((resource) => /zip|gtfs/i.test(`${resource.format} ${resource.name} ${resource.url}`));

      return {
        ok: Boolean(gtfs),
        ...DEMO_TRANSIT,
        source: gtfs ? "gtfs_metadata" : "synthetic_fallback",
        resource: gtfs
          ? {
              name: gtfs.name,
              format: gtfs.format,
              url: gtfs.url,
              lastModified: gtfs.last_modified || gtfs.revision_timestamp,
            }
          : null,
        note: gtfs
          ? "Se encontro el ZIP GTFS. El prototipo usa metadata; produccion debe descargar stops.txt y calcular paradas por radio."
          : DEMO_TRANSIT.note,
      };
    } catch (error) {
      return { ok: false, ...DEMO_TRANSIT, diagnostics: error.message };
    }
  });
}

async function fetchDenueBusinesses(event) {
  const token = process.env.INEGI_TOKEN;
  if (!token) {
    return {
      ok: false,
      source: "synthetic_fallback",
      businesses: [],
      sectors: DEMO_BUSINESSES_BY_EVENT[event.id] || { restaurantes: 12, hoteles: 4, comercio: 16, transporte: 5 },
      diagnostics: "INEGI_TOKEN no esta configurado; se usan conteos demo por sector.",
    };
  }

  const key = `denue-${event.id}-${event.lat}-${event.lng}-${event.radiusM}`;
  return cachedJson(key, async () => {
    const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar/todos/${event.lat},${event.lng}/${event.radiusM}/${token}`;
    try {
      const rows = await fetchJson(url, 20000);
      const businesses = rows.map((row) => ({
        name: row.Nombre || row.Razon_social || "Unidad economica",
        activity: row.Clase_actividad || row.Nombre_clase_actividad || row.tipo || null,
        sector: classifySector(row),
        lat: readNumber(row.Latitud, null),
        lng: readNumber(row.Longitud, null),
      }));

      return {
        ok: true,
        source: "denue_api",
        count: businesses.length,
        sectors: countBy(businesses, "sector"),
        businesses: businesses.slice(0, 100),
      };
    } catch (error) {
      return {
        ok: false,
        source: "synthetic_fallback",
        businesses: [],
        sectors: DEMO_BUSINESSES_BY_EVENT[event.id] || { restaurantes: 12, hoteles: 4, comercio: 16, transporte: 5 },
        diagnostics: `DENUE no respondio correctamente: ${error.message}`,
      };
    }
  });
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "otros";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

async function getEvents() {
  const local = await loadLocalEvents();
  const cartelera = await fetchCarteleraEvents();

  const merged = new Map();
  for (const event of DEMO_EVENTS) merged.set(event.id, event);
  for (const event of local) merged.set(event.id, event);
  for (const event of cartelera.events) {
    if (!merged.has(event.id)) merged.set(event.id, { ...event, attendees: 15000, averageSpendMxn: 750 });
  }

  return {
    events: [...merged.values()],
    sourceStatus: {
      cartelera: {
        ok: cartelera.ok,
        diagnostics: cartelera.diagnostics,
        count: cartelera.events.length,
      },
      localFile: {
        ok: local.length > 0,
        count: local.length,
        path: join(DATA_DIR, "eventos.json"),
      },
    },
  };
}

async function calculateImpact(event) {
  const [hotel, tourism, transit, denue] = await Promise.all([
    fetchDataTurHotelContext(),
    fetchTourismContext(),
    fetchGtfsContext(),
    fetchDenueBusinesses(event),
  ]);

  const directImpactMxn = Math.round(event.attendees * event.averageSpendMxn);
  const hotelLift = Math.max(0, (hotel.occupancyRate || 0.68) - 0.55) * 0.18;
  const tourismLift = Math.max(0, (tourism.touristFlowIndex || 1) - 1) * 0.1;
  const transitLift = Math.min((transit.stopsNearVenue || 0) / 1000, 0.03);
  const adjustedImpactMxn = Math.round(directImpactMxn * (1 + hotelLift + tourismLift + transitLift));
  const directJobs = Math.round(adjustedImpactMxn / 100000);
  const indirectJobs = Math.round(directJobs * 0.35);
  const sectors = denue.sectors || {};
  const benefitedBusinesses = sum(Object.values(sectors));

  return {
    event,
    metrics: {
      attendees: event.attendees,
      averageSpendMxn: event.averageSpendMxn,
      directImpactMxn,
      adjustedImpactMxn,
      directJobs,
      indirectJobs,
      totalJobs: directJobs + indirectJobs,
      benefitedBusinesses,
      sectors,
      projection2027Mxn: Math.round(adjustedImpactMxn * (1 + event.annualGrowth)),
    },
    assumptions: {
      formula: "derrame_base = asistentes * gasto_promedio",
      employmentModel: "empleos_directos = derrama_ajustada / 100000; indirectos = directos * 0.35",
      modifiers: {
        hotelLift,
        tourismLift,
        transitLift,
      },
    },
    dataQuality: {
      hotel,
      tourism,
      transit,
      denue: {
        ok: denue.ok,
        source: denue.source,
        count: denue.count || benefitedBusinesses,
        diagnostics: denue.diagnostics,
      },
    },
  };
}

function buildInsights(impacts) {
  const sorted = [...impacts].sort((a, b) => b.metrics.adjustedImpactMxn - a.metrics.adjustedImpactMxn);
  const top = sorted[0];
  const sectorTotals = {};

  for (const impact of impacts) {
    for (const [sector, count] of Object.entries(impact.metrics.sectors)) {
      sectorTotals[sector] = (sectorTotals[sector] || 0) + count;
    }
  }

  const topSector = Object.entries(sectorTotals).sort((a, b) => b[1] - a[1])[0];
  const totalImpact = sum(impacts.map((impact) => impact.metrics.adjustedImpactMxn));
  const totalProjected = sum(impacts.map((impact) => impact.metrics.projection2027Mxn));

  return [
    top
      ? `${top.event.name} muestra la mayor derrama ajustada estimada: ${formatMxn(top.metrics.adjustedImpactMxn)}.`
      : "Carga eventos para generar insights.",
    topSector
      ? `El sector con mayor exposicion al beneficio es ${topSector[0]}, con ${topSector[1]} unidades economicas vinculadas.`
      : "Configura DENUE o negocios locales para identificar sectores beneficiados.",
    `La cartera actual suma ${formatMxn(totalImpact)} y proyecta ${formatMxn(totalProjected)} para 2027 con las tasas configuradas.`,
  ];
}

function formatMxn(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

async function dashboardPayload() {
  const { events, sourceStatus } = await getEvents();
  const impacts = await Promise.all(events.map(calculateImpact));
  const totals = {
    economicImpactMxn: sum(impacts.map((impact) => impact.metrics.adjustedImpactMxn)),
    attendees: sum(impacts.map((impact) => impact.metrics.attendees)),
    jobs: sum(impacts.map((impact) => impact.metrics.totalJobs)),
    benefitedBusinesses: sum(impacts.map((impact) => impact.metrics.benefitedBusinesses)),
    projection2027Mxn: sum(impacts.map((impact) => impact.metrics.projection2027Mxn)),
  };

  return {
    generatedAt: new Date().toISOString(),
    sources: SOURCES,
    sourceStatus,
    totals,
    impacts,
    historical: HISTORICAL_IMPACT,
    insights: buildInsights(impacts),
  };
}

async function router(request, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname === "/" || url.pathname === "/health") {
      return json(response, 200, {
        ok: true,
        name: "ImpactoCDMX Backend",
        endpoints: ["/sources", "/events", "/impact/:eventId", "/dashboard", "/denue/near?lat=&lng=&radiusM="],
      });
    }

    if (url.pathname === "/sources") return json(response, 200, SOURCES);

    if (url.pathname === "/events") {
      const result = await getEvents();
      return json(response, 200, result);
    }

    if (url.pathname.startsWith("/impact/")) {
      const eventId = decodeURIComponent(url.pathname.replace("/impact/", ""));
      const { events } = await getEvents();
      const event = events.find((candidate) => candidate.id === eventId);
      if (!event) return notFound(response);
      return json(response, 200, await calculateImpact(event));
    }

    if (url.pathname === "/dashboard") return json(response, 200, await dashboardPayload());

    if (url.pathname === "/denue/near") {
      const lat = readNumber(url.searchParams.get("lat"), null);
      const lng = readNumber(url.searchParams.get("lng"), null);
      if (lat === null || lng === null) return badRequest(response, "lat y lng son requeridos");

      const event = {
        id: `manual-${lat}-${lng}`,
        lat,
        lng,
        radiusM: readNumber(url.searchParams.get("radiusM"), 1000),
      };

      return json(response, 200, await fetchDenueBusinesses(event));
    }

    return notFound(response);
  } catch (error) {
    return json(response, 500, { error: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined });
  }
}

createServer(router).listen(PORT, () => {
  console.log(`ImpactoCDMX backend listo en http://localhost:${PORT}`);
  console.log(`DENUE: ${process.env.INEGI_TOKEN ? "activo" : "sin token; usando fallback"}`);
});

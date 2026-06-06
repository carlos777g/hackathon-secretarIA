import { LayoutDashboard, CalendarDays, Zap, MapPin } from "lucide-react";

export const BASE_URL = "http://localhost:8787";

export const SECTOR_COLORS = ["#22d3ee", "#34d399", "#f59e0b", "#f87171", "#a78bfa", "#fb923c"];

export const EVENT_COORDINATES = {
  "formula-1-cdmx": {
    lat: 19.4042,
    lng: -99.0907,
    label: "Autódromo Hermanos Rodríguez",
    impactRadiusM: 2000,
  },
  "vive-latino": {
    lat: 19.3997,
    lng: -99.0893,
    label: "Foro Sol",
    impactRadiusM: 1500,
  },
  "corona-capital": {
    lat: 19.4042,
    lng: -99.0907,
    label: "Autódromo Hermanos Rodríguez",
    impactRadiusM: 1500,
  },
  "dia-de-muertos": {
    lat: 19.4326,
    lng: -99.1332,
    label: "Zócalo, Centro Histórico",
    impactRadiusM: 1000,
  },
  "maraton-cdmx": {
    lat: 19.4284,
    lng: -99.1276,
    label: "Zócalo (salida/llegada)",
    impactRadiusM: 3000,
  },
};

export const MENU_GROUPS = [
  {
    label: "General",
    items: [
      {
        id: "dashboard",
        label: "Resumen general de impacto",
        description: "Totales, histórico y proyecciones de todos los eventos",
        icon: LayoutDashboard,
        endpoint: "/dashboard",
        type: "dashboard",
      },
      {
        id: "events",
        label: "Catálogo de eventos",
        description: "Lista completa de eventos registrados",
        icon: CalendarDays,
        endpoint: "/events",
        type: "events",
      },
    ],
  },
  {
    label: "Impacto por evento",
    items: [
      {
        id: "formula-1-cdmx",
        label: "Fórmula 1 Gran Premio CDMX",
        description: "Derrama, empleos y negocios del GP de México",
        icon: Zap,
        endpoint: "/impact/formula-1-cdmx",
        type: "impact",
      },
      {
        id: "vive-latino",
        label: "Vive Latino",
        description: "Impacto económico del festival de música",
        icon: Zap,
        endpoint: "/impact/vive-latino",
        type: "impact",
      },
      {
        id: "corona-capital",
        label: "Corona Capital",
        description: "Derrama estimada del festival de rock",
        icon: Zap,
        endpoint: "/impact/corona-capital",
        type: "impact",
      },
      {
        id: "dia-de-muertos",
        label: "Día de Muertos en el Zócalo",
        description: "Impacto de la celebración cultural masiva",
        icon: Zap,
        endpoint: "/impact/dia-de-muertos",
        type: "impact",
      },
      {
        id: "maraton-cdmx",
        label: "Maratón Ciudad de México",
        description: "Derrama generada por el evento deportivo",
        icon: Zap,
        endpoint: "/impact/maraton-cdmx",
        type: "impact",
      },
    ],
  },
  {
    label: "Datos geográficos",
    items: [
      {
        id: "denue-zocalo",
        label: "Negocios cercanos al Zócalo",
        description: "Establecimientos en radio de 1 km vía DENUE",
        icon: MapPin,
        endpoint: "/denue/near?lat=19.4326&lng=-99.1332&radiusM=1000",
        type: "denue",
      },
    ],
  },
];
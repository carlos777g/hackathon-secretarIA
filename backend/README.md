# ImpactoCDMX Backend

Backend Node.js para el Reto 3: calculo de derrama economica en eventos.

## Ejecutar

```powershell
node impactocdmx/backend/server.mjs
```

Con DENUE real:

```powershell
$env:INEGI_TOKEN="tu_token_inegi"
node impactocdmx/backend/server.mjs
```

El servicio queda en:

```text
http://localhost:8787
```

## Endpoints

```text
GET /health
GET /sources
GET /events
GET /impact/:eventId
GET /dashboard
GET /denue/near?lat=19.4326&lng=-99.1332&radiusM=1000
```

## Ejemplos de uso y salidas

Las salidas siguientes estan abreviadas para documentacion. Los valores pueden cambiar si DENUE responde con datos reales o si se editan los eventos en `impactocdmx/data/eventos.json`.

### 1. Estado del backend

Request:

```powershell
Invoke-RestMethod -Uri "http://localhost:8787/health"
```

Salida esperada:

```json
{
  "ok": true,
  "name": "ImpactoCDMX Backend",
  "endpoints": [
    "/sources",
    "/events",
    "/impact/:eventId",
    "/dashboard",
    "/denue/near?lat=&lng=&radiusM="
  ]
}
```

### 2. Catalogo de eventos

Request:

```powershell
Invoke-RestMethod -Uri "http://localhost:8787/events"
```

Salida esperada:

```json
{
  "events": [
    {
      "id": "formula-1-cdmx",
      "name": "Formula 1 Gran Premio de la Ciudad de Mexico",
      "category": "deportivo",
      "venue": "Autodromo Hermanos Rodriguez",
      "borough": "Iztacalco",
      "attendees": 395000,
      "averageSpendMxn": 25285,
      "averageSpendMethod": "Componentes de consumo directo SEDECO F1 2024 / asistencia reportada por Turismo CDMX 2023.",
      "averageSpendComment": "Se suman boletos, souvenirs, turismo/alojamiento, taxis/apps y alimentos/bebidas: $9,987,724,000 MXN. Se divide entre 395,000 asistentes reportados por Turismo CDMX.",
      "source": "official_report_derived"
    }
  ],
  "sourceStatus": {
    "cartelera": {
      "ok": false,
      "count": 0,
      "diagnostics": "No se detectaron eventos estructurados en el HTML publico."
    },
    "localFile": {
      "ok": true,
      "count": 5,
      "path": "impactocdmx/data/eventos.json"
    }
  }
}
```

### 3. Analisis de un evento

Request:

```powershell
Invoke-RestMethod -Uri "http://localhost:8787/impact/formula-1-cdmx"
```

Salida esperada:

```json
{
  "event": {
    "id": "formula-1-cdmx",
    "name": "Formula 1 Gran Premio de la Ciudad de Mexico",
    "attendees": 395000,
    "averageSpendMxn": 25285,
    "averageSpendSourceUrl": "https://www.sedeco.cdmx.gob.mx/comunicacion/nota/estima-sedeco-derrama-economica-de-mas-de-19-mil-millones-de-pesos-por-el-gran-premio-de-mexico-de-la-formula-1",
    "averageSpendMethod": "Componentes de consumo directo SEDECO F1 2024 / asistencia reportada por Turismo CDMX 2023."
  },
  "metrics": {
    "attendees": 395000,
    "averageSpendMxn": 25285,
    "directImpactMxn": 9987575000,
    "adjustedImpactMxn": 10480961205,
    "directJobs": 104810,
    "indirectJobs": 36684,
    "totalJobs": 141494,
    "benefitedBusinesses": 7138,
    "sectors": {
      "comercio": 5140,
      "restaurantes": 1897,
      "transporte": 90,
      "hoteles": 11
    },
    "projection2027Mxn": 11319438010
  },
  "assumptions": {
    "formula": "derrame_base = asistentes * gasto_promedio",
    "employmentModel": "empleos_directos = derrama_ajustada / 100000; indirectos = directos * 0.35"
  },
  "dataQuality": {
    "denue": {
      "ok": true,
      "source": "denue_api",
      "count": 7138
    }
  }
}
```

Nota: si no hay `INEGI_TOKEN` o falla la API de INEGI, `dataQuality.denue.source` cambia a `synthetic_fallback` y los sectores salen de los conteos demo.

### 4. Dashboard completo

Request:

```powershell
Invoke-RestMethod -Uri "http://localhost:8787/dashboard"
```

Salida esperada:

```json
{
  "generatedAt": "2026-06-06T18:00:00.000Z",
  "totals": {
    "economicImpactMxn": 18136317884,
    "attendees": 2305000,
    "jobs": 244841,
    "benefitedBusinesses": 928,
    "projection2027Mxn": 19376681767
  },
  "impacts": [
    {
      "event": {
        "id": "formula-1-cdmx",
        "name": "Formula 1 Gran Premio de la Ciudad de Mexico"
      },
      "metrics": {
        "directImpactMxn": 9987575000,
        "adjustedImpactMxn": 10480961205,
        "totalJobs": 141494
      }
    }
  ],
  "historical": [
    {
      "year": 2026,
      "economicImpactMxn": 5390000000,
      "source": "synthetic_seed"
    }
  ],
  "insights": [
    "Formula 1 Gran Premio de la Ciudad de Mexico muestra la mayor derrama ajustada estimada: $10,480,961,205.",
    "El sector con mayor exposicion al beneficio es comercio, con 324 unidades economicas vinculadas.",
    "La cartera actual suma $18,136,317,884 y proyecta $19,376,681,767 para 2027 con las tasas configuradas."
  ]
}
```

### 5. Consulta directa a DENUE

Request:

```powershell
Invoke-RestMethod -Uri "http://localhost:8787/denue/near?lat=19.4326&lng=-99.1332&radiusM=500"
```

Salida esperada con token activo:

```json
{
  "ok": true,
  "source": "denue_api",
  "count": 5703,
  "sectors": {
    "comercio": 3830,
    "restaurantes": 1348,
    "hoteles": 248,
    "transporte": 277
  },
  "businesses": [
    {
      "name": "Unidad economica",
      "activity": "Actividad reportada por DENUE",
      "sector": "comercio"
    }
  ]
}
```

## Fuentes reales integradas

El backend intenta consultar las fuentes mencionadas en el PDF del hackaton:

| Tema | Fuente | Uso en el backend |
| --- | --- | --- |
| Festividades y eventos | https://cartelera.cdmx.gob.mx/ | Intenta extraer eventos publicos; si no hay HTML estructurado usa `impactocdmx/data/eventos.json`. |
| Ocupacion hotelera | DataTur / datos.gob.mx | Consulta metadata del dataset de ocupacion hotelera y deja listo el recurso tabular para una ingesta productiva. |
| Afluencia turistica | Turismo CDMX | Consulta la pagina oficial y extrae evidencia textual cuando esta disponible. |
| Transporte | GTFS CDMX | Consulta metadata del paquete GTFS; en produccion se debe descargar el ZIP y calcular paradas por radio. |
| Establecimientos | DENUE INEGI | Si existe `INEGI_TOKEN`, consulta negocios cercanos por coordenadas y clasifica sectores. |
| Datos economicos | INEGI | Se documenta como fuente para calibrar supuestos economicos y gasto promedio. |

## Modelo economico

```text
derrame_base = asistentes * gasto_promedio
derrame_ajustada = derrame_base * (1 + hotelLift + tourismLift + transitLift)
empleos_directos = derrame_ajustada / 100000
empleos_indirectos = empleos_directos * 0.35
proyeccion_2027 = derrame_ajustada * (1 + crecimiento_anual)
```

Cada respuesta incluye `dataQuality` para distinguir datos reales, metadata real y fallback sintetico.

## Origen del gasto promedio

Cada evento puede incluir estos campos:

```json
{
  "averageSpendMxn": 10656,
  "averageSpendSourceUrl": "https://...",
  "averageSpendMethod": "Como se calculo el valor",
  "averageSpendComment": "Comentario corto para justificar la fuente"
}
```

Ejemplos incluidos:

| Evento | Gasto usado | Origen |
| --- | ---: | --- |
| Formula 1 | $25,285 | Componentes de consumo directo publicados por SEDECO / asistencia reportada por Turismo CDMX. |
| Vive Latino | $10,656 | Derrama del fin de semana largo con Vive Latino 2023 / turistas esperados. |
| Corona Capital | $10,939 | Gasto medio turistico total CDMX 2025 como benchmark. |
| Dia de Muertos | $250 | Consumo promedio por persona reportado por SEDECO 2021. |
| Maraton CDMX | $5,359 | Gasto medio turista nacional CDMX 2025 como benchmark. |

## Conectar desde Streamlit

```python
import requests

payload = requests.get("http://localhost:8787/dashboard", timeout=30).json()
eventos = payload["impacts"]
totales = payload["totals"]
insights = payload["insights"]
```

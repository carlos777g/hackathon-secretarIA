"""
SECTORIA — Asistente conversacional ImpactoCDMX
Usa la API de Anthropic (Claude) para conversación natural y precisa.

# /// script
# requires-python = ">=3.10"
# dependencies = ["requests", "anthropic"]
# ///
"""
import os, sys, re, json
from pathlib import Path
import anthropic

MODEL = "claude-haiku-4-5-20251001"   # rápido y barato, perfecto para hackathon

# ── Datos ─────────────────────────────────────────────────────

DEMO_EVENTS = [
    {"id":"formula-1-cdmx","name":"Fórmula 1 Gran Premio CDMX","category":"deportivo",
     "venue":"Autódromo Hermanos Rodríguez","borough":"Iztacalco","date":"2025-10-25",
     "attendees":395000,"averageSpendMxn":25285,"annualGrowth":0.08},
    {"id":"vive-latino","name":"Vive Latino","category":"festival",
     "venue":"Foro Sol","borough":"Iztacalco","date":"2025-03-15",
     "attendees":160000,"averageSpendMxn":10656,"annualGrowth":0.06},
    {"id":"corona-capital","name":"Corona Capital","category":"festival",
     "venue":"Autódromo Hermanos Rodríguez","borough":"Iztacalco","date":"2025-11-15",
     "attendees":250000,"averageSpendMxn":10939,"annualGrowth":0.07},
    {"id":"dia-de-muertos","name":"Desfile de Día de Muertos","category":"cultural",
     "venue":"Centro Histórico - Paseo de la Reforma","borough":"Cuauhtémoc","date":"2025-11-01",
     "attendees":1200000,"averageSpendMxn":250,"annualGrowth":0.05},
    {"id":"maraton-cdmx","name":"Maratón CDMX","category":"deportivo",
     "venue":"Ruta Olímpica - Zócalo","borough":"Cuauhtémoc","date":"2025-08-30",
     "attendees":300000,"averageSpendMxn":5359,"annualGrowth":0.04},
]

DEMO_BUSINESSES = {
    "formula-1-cdmx": {"restaurantes":46,"hoteles":14,"comercio":38,"transporte":12},
    "vive-latino":    {"restaurantes":32,"hoteles":9, "comercio":26,"transporte":10},
    "corona-capital": {"restaurantes":40,"hoteles":12,"comercio":35,"transporte":11},
    "dia-de-muertos": {"restaurantes":125,"hoteles":48,"comercio":150,"transporte":34},
    "maraton-cdmx":   {"restaurantes":80,"hoteles":28,"comercio":75,"transporte":26},
}

HISTORICAL = [
    {"year":2022,"economicImpactMxn":3_450_000_000},
    {"year":2023,"economicImpactMxn":3_890_000_000},
    {"year":2024,"economicImpactMxn":4_520_000_000},
    {"year":2025,"economicImpactMxn":5_030_000_000},
    {"year":2026,"economicImpactMxn":5_390_000_000},
]

# ── Carga eventos.json si existe ──────────────────────────────

def cargar_eventos():
    eventos = {e["id"]: e for e in DEMO_EVENTS}
    for ruta in [
        Path(__file__).parent / "impactocdmx" / "data" / "eventos.json",
        Path("impactocdmx/data/eventos.json"),
    ]:
        if ruta.exists():
            try:
                for e in json.loads(ruta.read_text("utf-8")):
                    eid = e.get("id") or re.sub(r'[^a-z0-9]+-','-',e.get("name","").lower())
                    if eid: eventos[eid] = e
                print(f"✅ eventos.json cargado")
            except Exception as ex:
                print(f"⚠  eventos.json: {ex}")
            break
    return list(eventos.values())

# ── Cálculos ──────────────────────────────────────────────────

def calcular_impacto(ev):
    a = ev.get("attendees", 0)
    g = ev.get("averageSpendMxn", 0)
    c = ev.get("annualGrowth", 0.05)
    derrama   = round(a * g * 1.05)
    emp_d     = round(derrama / 100_000)
    emp_i     = round(emp_d * 0.35)
    negs      = DEMO_BUSINESSES.get(ev.get("id",""), {})
    meses_map = ["","enero","febrero","marzo","abril","mayo","junio",
                 "julio","agosto","septiembre","octubre","noviembre","diciembre"]
    try:    mes = meses_map[int(ev.get("date","").split("-")[1])]
    except: mes = "por definir"
    return {
        "nombre":              ev["name"],
        "categoria":           ev.get("category",""),
        "sede":                ev.get("venue",""),
        "alcaldia":            ev.get("borough",""),
        "mes":                 mes,
        "fecha":               ev.get("date",""),
        "asistentes":          f"{a:,}",
        "gasto_promedio":      f"${g:,.0f} MXN",
        "derrama_economica":   f"${derrama:,.0f} MXN",
        "derrama_num":         derrama,
        "empleos_directos":    emp_d,
        "empleos_indirectos":  emp_i,
        "empleos_total":       emp_d + emp_i,
        "negocios_beneficiados": sum(negs.values()),
        "sectores":            negs,
        "proyeccion_2027":     f"${round(derrama*(1+c)):,.0f} MXN",
        "crecimiento_anual":   f"{c*100:.0f}%",
    }

def construir_contexto(eventos):
    datos = [calcular_impacto(ev) for ev in eventos]
    # Ordenar por derrama de mayor a menor
    datos.sort(key=lambda x: x["derrama_num"], reverse=True)
    hist = "\n".join(f"  {h['year']}: ${h['economicImpactMxn']:,.0f} MXN" for h in HISTORICAL)
    total_derrama = sum(d["derrama_num"] for d in datos)
    total_asist   = sum(ev.get("attendees",0) for ev in eventos)
    total_empleos = sum(d["empleos_total"] for d in datos)

    return f"""EVENTOS CDMX 2025 (ordenados por derrama económica):
{json.dumps(datos, ensure_ascii=False, indent=2)}

TOTALES:
  Derrama consolidada: ${total_derrama:,.0f} MXN
  Asistentes totales:  {total_asist:,}
  Empleos totales:     {total_empleos:,}

IMPACTO HISTÓRICO CONSOLIDADO (todos los eventos CDMX):
{hist}

NOTA: Los datos de sectores (restaurantes, hoteles, comercio, transporte) son conteos
de establecimientos beneficiados, NO ingresos individuales por negocio.
No hay datos de nombres de negocios específicos."""

SYSTEM_PROMPT = """Eres SECTORIA, asistente experto en análisis de derrama económica de eventos de la Ciudad de México para la SEDECO CDMX.

Tienes acceso a datos calculados de eventos principales. Tu trabajo es responder preguntas sobre estos eventos de forma natural, precisa y conversacional.

REGLAS:
- Usa ÚNICAMENTE los datos en DATOS DISPONIBLES. Nunca inventes cifras ni nombres.
- Si preguntan por algo que no está en los datos (ej: nombre de un restaurante específico, datos de 2024), responde honestamente que no tienes ese detalle.
- Responde en español, de forma amigable y concisa.
- Para rankings usa derrama_economica como métrica principal salvo que pidan otra.
- Recuerda el hilo de la conversación."""

# ── Chat con Claude ───────────────────────────────────────────

def chat(client, historial):
    print("🤖 ", end="", flush=True)
    respuesta = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=1024,
        system=historial[0]["content"],
        messages=historial[1:],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            respuesta += text
    print()
    return respuesta.strip()

# ── Main ─────────────────────────────────────────────────────

def main():
    print("=" * 56)
    print("   🏙️  SECTORIA")
    print("=" * 56)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n❌ Necesitas tu API key de Anthropic.")
        print("   Consíguela en: https://console.anthropic.com/")
        print("   Luego corre: ANTHROPIC_API_KEY=sk-... uv run python asistente_datos.py")
        sys.exit(1)

    client  = anthropic.Anthropic(api_key=api_key)
    eventos = cargar_eventos()
    print(f"✅ {len(eventos)} eventos cargados.")

    contexto  = construir_contexto(eventos)
    system    = SYSTEM_PROMPT + f"\n\nDATOS DISPONIBLES:\n{contexto}"
    historial = [{"role": "system", "content": system}]

    print("\n💬 Listo. Escribe 'salir' para terminar.\n")

    while True:
        try:
            user_input = input("👤 Tú: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\n🤖 ¡Hasta luego!")
            break

        if not user_input: continue
        if user_input.lower() in {"salir","exit","quit","bye"}:
            print("\n🤖 ¡Hasta luego! Mucho éxito en el hackathon.")
            break

        historial.append({"role": "user", "content": user_input})
        respuesta = chat(client, historial)
        historial.append({"role": "assistant", "content": respuesta})
        print()

        if len(historial) > 22:
            historial = [historial[0]] + historial[-20:]

if __name__ == "__main__":
    main()
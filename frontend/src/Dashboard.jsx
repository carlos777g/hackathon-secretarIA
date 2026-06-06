import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import {
  LayoutDashboard, CalendarDays, Zap, MapPin, Activity,
  Loader2, TrendingUp, Users, Building2, Briefcase, ChevronRight,
} from "lucide-react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8787";

const SECTOR_COLORS = ["#22d3ee", "#34d399", "#f59e0b", "#f87171", "#a78bfa", "#fb923c"];

// ─── MENU DEFINITION ──────────────────────────────────────────────────────────
// Each entry maps a friendly label to a backend endpoint.
// "type" tells the view layer how to interpret the response.

const MENU_GROUPS = [
  {
    label: "General",
    items: [
      {
        id: "dashboard",
        label: "Resumen general de impacto",
        description: "Totales, historico y proyecciones de todos los eventos",
        icon: LayoutDashboard,
        endpoint: "/dashboard",
        type: "dashboard",
      },
      {
        id: "events",
        label: "Catalogo de eventos",
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
        label: "Formula 1 Gran Premio CDMX",
        description: "Derrama, empleos y negocios del GP de Mexico",
        icon: Zap,
        endpoint: "/impact/formula-1-cdmx",
        type: "impact",
      },
      {
        id: "vive-latino",
        label: "Vive Latino",
        description: "Impacto economico del festival de musica",
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
        label: "Dia de Muertos en el Zocalo",
        description: "Impacto de la celebracion cultural masiva",
        icon: Zap,
        endpoint: "/impact/dia-de-muertos",
        type: "impact",
      },
      {
        id: "maraton-cdmx",
        label: "Maraton Ciudad de Mexico",
        description: "Derrama generada por el evento deportivo",
        icon: Zap,
        endpoint: "/impact/maraton-cdmx",
        type: "impact",
      },
    ],
  },
  {
    label: "Datos geograficos",
    items: [
      {
        id: "denue-zocalo",
        label: "Negocios cercanos al Zocalo",
        description: "Establecimientos en radio de 1 km via DENUE",
        icon: MapPin,
        endpoint: "/denue/near?lat=19.4326&lng=-99.1332&radiusM=1000",
        type: "denue",
      },
    ],
  },
];

// ─── FORMATTERS ───────────────────────────────────────────────────────────────

function formatMXN(value) {
  if (!value && value !== 0) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B MXN`;
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M MXN`;
  return `$${value.toLocaleString("es-MX")} MXN`;
}

function formatNumber(value) {
  if (!value && value !== 0) return "—";
  return value.toLocaleString("es-MX");
}

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────

function KPICard({ title, value, icon: Icon, accent = "cyan" }) {
  const styles = {
    cyan:    "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    amber:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
    violet:  "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2 rounded-lg border ${styles[accent]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-white text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-semibold text-white mb-1">{children}</h2>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
      <SectionTitle>{title}</SectionTitle>
      {subtitle && <p className="text-slate-500 text-xs mb-5">{subtitle}</p>}
      {children}
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-cyan-400 font-bold">{formatMXN(payload[0].value)}</p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm">
      <p className="text-white font-medium">{payload[0].name}</p>
      <p className="text-cyan-400">{formatNumber(payload[0].value)} establecimientos</p>
    </div>
  );
}

// ─── VIEW: DASHBOARD (/dashboard) ─────────────────────────────────────────────

function DashboardView({ data }) {
  const { totals, historical = [], impacts = [], insights = [] } = data;

  const barData = historical.map((h) => ({
    year: String(h.year),
    value: h.economicImpactMxn,
  }));

  // Build pie from top impacts
  const pieData = impacts.slice(0, 6).map((i) => ({
    name: i.event.name.split(" ").slice(0, 3).join(" "),
    value: i.metrics.adjustedImpactMxn,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Impacto Economico Total"  value={formatMXN(totals.economicImpactMxn)}    icon={TrendingUp} accent="cyan" />
        <KPICard title="Asistentes Totales"        value={formatNumber(totals.attendees)}          icon={Users}      accent="emerald" />
        <KPICard title="Empleos Generados"         value={formatNumber(totals.jobs)}              icon={Briefcase}  accent="amber" />
        <KPICard title="Negocios Beneficiados"     value={formatNumber(totals.benefitedBusinesses)} icon={Building2} accent="violet" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard title="Derrama Historica por Año" subtitle="Impacto economico acumulado en MXN">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barCategoryGap="35%">
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1e9).toFixed(1)}B`} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#22d3ee" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <ChartCard title="Derrama por Evento" subtitle="Proporcion del impacto ajustado">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-3">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                    <span className="text-slate-400 text-xs">{entry.name}</span>
                  </div>
                  <span className="text-slate-300 text-xs font-medium">{formatMXN(entry.value)}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
          <SectionTitle>Insights generados</SectionTitle>
          <ul className="space-y-2 mt-3">
            {insights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── VIEW: IMPACT (/impact/:id) ────────────────────────────────────────────────

function ImpactView({ data }) {
  const { event, metrics, assumptions } = data;

  const barData = [
    { label: "Impacto directo",   value: metrics.directImpactMxn },
    { label: "Impacto ajustado",  value: metrics.adjustedImpactMxn },
    { label: "Proyeccion 2027",   value: metrics.projection2027Mxn },
  ];

  const sectors = metrics.sectors ?? {};
  const pieData = Object.entries(sectors).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Event header */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{event.category ?? "Evento"} — {event.venue}</p>
        <h2 className="text-xl font-bold text-white">{event.name}</h2>
        <p className="text-slate-400 text-sm mt-1">{formatNumber(event.attendees)} asistentes · Gasto promedio {formatMXN(event.averageSpendMxn)} por persona</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Derrama Ajustada"      value={formatMXN(metrics.adjustedImpactMxn)} icon={TrendingUp} accent="cyan" />
        <KPICard title="Empleos Directos"      value={formatNumber(metrics.directJobs)}      icon={Briefcase}  accent="emerald" />
        <KPICard title="Empleos Indirectos"    value={formatNumber(metrics.indirectJobs)}    icon={Users}      accent="amber" />
        <KPICard title="Negocios Beneficiados" value={formatNumber(metrics.benefitedBusinesses)} icon={Building2} accent="violet" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard title="Impacto economico del evento" subtitle="Directo, ajustado y proyeccion 2027 en MXN">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barCategoryGap="40%">
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1e9).toFixed(1)}B`} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {pieData.length > 0 && (
          <div className="lg:col-span-2">
            <ChartCard title="Negocios por sector" subtitle="Unidades economicas DENUE en el area">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                      <span className="text-slate-400 text-xs capitalize">{entry.name}</span>
                    </div>
                    <span className="text-slate-300 text-xs font-medium">{formatNumber(entry.value)}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}
      </div>

      {/* Assumptions */}
      {assumptions && (
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-mono mb-2">Modelo economico aplicado</p>
          <p className="text-xs text-slate-400 font-mono">{assumptions.formula}</p>
          <p className="text-xs text-slate-400 font-mono">{assumptions.employmentModel}</p>
        </div>
      )}
    </div>
  );
}

// ─── VIEW: EVENTS (/events) ────────────────────────────────────────────────────

function EventsView({ data }) {
  const { events = [] } = data;
  return (
    <div className="space-y-3">
      <p className="text-slate-400 text-sm">{events.length} eventos registrados</p>
      {events.map((ev) => (
        <div key={ev.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">{ev.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{ev.venue} · {formatNumber(ev.attendees)} asistentes</p>
          </div>
          <div className="text-right">
            <p className="text-cyan-400 text-sm font-bold">{formatMXN(ev.averageSpendMxn)}</p>
            <p className="text-slate-500 text-xs">gasto promedio</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── VIEW: DENUE (/denue/near) ─────────────────────────────────────────────────

function DenueView({ data }) {
  const sectors = data.sectors ?? {};
  const pieData = Object.entries(sectors).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <KPICard title="Total establecimientos" value={formatNumber(data.count)} icon={Building2} accent="cyan" />
        <KPICard title="Fuente de datos"         value={data.source === "denue_api" ? "DENUE API (real)" : "Datos sinteticos"} icon={Activity} accent={data.source === "denue_api" ? "emerald" : "amber"} />
      </div>

      {pieData.length > 0 && (
        <ChartCard title="Establecimientos por sector" subtitle="Clasificacion DENUE en radio de 1 km">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 w-full max-w-xs">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                    <span className="text-slate-300 text-sm capitalize">{entry.name}</span>
                  </div>
                  <span className="text-slate-300 text-sm font-bold">{formatNumber(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// ─── VIEW ROUTER ──────────────────────────────────────────────────────────────

function ResultView({ type, data }) {
  if (!data) return null;
  if (type === "dashboard") return <DashboardView data={data} />;
  if (type === "impact")    return <ImpactView    data={data} />;
  if (type === "events")    return <EventsView    data={data} />;
  if (type === "denue")     return <DenueView     data={data} />;
  // Fallback: raw JSON for any unhandled type
  return (
    <pre className="text-xs text-slate-400 bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeItem, setActiveItem]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [result, setResult]           = useState(null);

  async function handleSelect(item) {
    if (loading) return;
    setActiveItem(item);
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}${item.endpoint}`);
      if (!res.ok) throw new Error(`El backend respondio con ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Top bar ── */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center gap-3 shrink-0">
        <div className="w-1.5 h-7 bg-cyan-400 rounded-full" />
        <div>
          <h1 className="text-sm font-bold tracking-tight leading-none">ImpactoCDMX</h1>
          <p className="text-slate-500 text-xs">Derrama economica en eventos — CDMX</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar menu ── */}
        <aside className="w-72 border-r border-slate-800 overflow-y-auto shrink-0 py-4">
          {MENU_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold px-4 mb-2">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors
                      ${isActive
                        ? "bg-cyan-500/10 border-r-2 border-cyan-400 text-white"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                  >
                    <Icon size={16} className={`mt-0.5 shrink-0 ${isActive ? "text-cyan-400" : ""}`} />
                    <div>
                      <p className="text-sm font-medium leading-tight">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{item.description}</p>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-cyan-400 ml-auto mt-0.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Empty state */}
          {!activeItem && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <LayoutDashboard size={40} className="text-slate-700 mb-4" />
              <p className="text-slate-400 font-medium">Selecciona una consulta del menu</p>
              <p className="text-slate-600 text-sm mt-1">Los resultados apareceran aqui</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="text-cyan-400 animate-spin" />
              <p className="text-slate-400 text-sm">Consultando {activeItem?.label}...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <p className="text-red-400 font-semibold text-sm mb-1">No se pudo completar la consulta</p>
              <p className="text-red-400/70 text-xs font-mono">{error}</p>
              <p className="text-slate-500 text-xs mt-2">
                Verifica que el backend este corriendo en {BASE_URL}
              </p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <ResultView type={activeItem?.type} data={result} />
          )}
        </main>
      </div>
    </div>
  );
}
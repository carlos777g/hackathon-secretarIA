import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { Send, Loader2, TrendingUp, Users, Building2, Briefcase } from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const API_URL = "http://localhost:3000/api/analyze"; // update when backend is ready

const SECTOR_COLORS = ["#22d3ee", "#34d399", "#f59e0b", "#f87171", "#a78bfa", "#fb923c"];

const SUGGESTED_PROMPTS = [
  "Estima la derrama economica del Vive Latino 2025",
  "Compara el impacto del GP de Mexico de los ultimos 3 anos",
  "Que sectores se benefician mas durante la Feria de Chapultepec?",
];

// ─── PLACEHOLDER DATA (remove once backend is connected) ──────────────────────

const PLACEHOLDER_BAR_DATA = [
  { year: "2021", derrama: 210 },
  { year: "2022", derrama: 285 },
  { year: "2023", derrama: 304 },
  { year: "2024", derrama: 271 },
  { year: "2025 (est.)", derrama: 314, estimated: true },
];

const PLACEHOLDER_PIE_DATA = [
  { name: "Hospedaje", value: 28 },
  { name: "Alimentos", value: 32 },
  { name: "Transporte", value: 15 },
  { name: "Comercio", value: 18 },
  { name: "Servicios", value: 7 },
];

const PLACEHOLDER_KPIS = {
  totalSpillover: "$314.2M MXN",
  directJobs: "4,820",
  indirectJobs: "2,892",
  benefitedBusinesses: "6,980",
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function KPICard({ title, value, icon: Icon, accent = "cyan" }) {
  const accentMap = {
    cyan:    "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    amber:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
    violet:  "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2 rounded-lg border ${accentMap[accent]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-white text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-cyan-400 font-bold">${payload[0].value}M MXN</p>
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm">
      <p className="text-white font-medium">{payload[0].name}</p>
      <p className="text-cyan-400">{payload[0].value}% del total</p>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // These will be populated from the backend response.
  // Shape is intentionally flexible until backend schema is defined.
  const [analysisResult, setAnalysisResult] = useState(null);

  // Derived chart data: falls back to placeholder when no result yet.
  // UPDATE these mappers once backend JSON schema is confirmed.
  const barData   = analysisResult?.historicalSpillover ?? PLACEHOLDER_BAR_DATA;
  const pieData   = analysisResult?.sectorBreakdown     ?? PLACEHOLDER_PIE_DATA;
  const kpis      = analysisResult?.kpis                ?? PLACEHOLDER_KPIS;
  const narrative = analysisResult?.narrative           ?? null;

  async function handleSubmit() {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!res.ok) throw new Error(`Backend responded with ${res.status}`);

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      {/* ── Header ── */}
      <header className="border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-cyan-400 rounded-full" />
          <div>
            <h1 className="text-base font-bold tracking-tight">Derrama Economica CDMX</h1>
            <p className="text-slate-500 text-xs">Analisis de impacto economico por evento</p>
          </div>
        </div>
        <span className="text-xs text-slate-600 font-mono">Impact Lab 2026</span>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* ── Prompt Panel ── */}
        <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
          <p className="text-slate-400 text-sm mb-3 font-medium">
            Consulta de analisis — <span className="text-slate-500">Ctrl+Enter para enviar</span>
          </p>

          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_PROMPTS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="text-xs text-slate-400 border border-slate-700 hover:border-cyan-500/50
                           hover:text-cyan-400 rounded-full px-3 py-1 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-3 items-end">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe el evento o haz una pregunta sobre derrama economica..."
              rows={3}
              className="flex-1 bg-slate-900/80 border border-slate-700 focus:border-cyan-500/60
                         rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600
                         resize-none outline-none transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700
                         disabled:text-slate-500 text-slate-950 font-semibold text-sm px-5 py-3
                         rounded-xl transition-colors"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />}
              {loading ? "Analizando..." : "Analizar"}
            </button>
          </div>

          {/* Error state */}
          {error && (
            <p className="mt-3 text-red-400 text-xs bg-red-400/10 border border-red-400/20
                          rounded-lg px-3 py-2">
              Error: {error}
            </p>
          )}

          {/* Narrative result */}
          {narrative && (
            <div className="mt-4 bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4">
              <p className="text-xs text-cyan-400 font-medium uppercase tracking-wider mb-2">
                Analisis generado
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">{narrative}</p>
            </div>
          )}
        </section>

        {/* ── KPI Row ── */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard title="Derrama Total Estimada" value={kpis.totalSpillover} icon={TrendingUp} accent="cyan" />
          <KPICard title="Empleos Directos"       value={kpis.directJobs}     icon={Briefcase}  accent="emerald" />
          <KPICard title="Empleos Indirectos"     value={kpis.indirectJobs}   icon={Users}       accent="amber" />
          <KPICard title="Negocios Beneficiados"  value={kpis.benefitedBusinesses} icon={Building2} accent="violet" />
        </section>

        {/* ── Charts Row ── */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* Bar chart — takes 3/5 of the row */}
          <div className="lg:col-span-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-1">
              Derrama Economica Historica
            </h2>
            <p className="text-slate-500 text-xs mb-6">Millones MXN — año estimado resaltado</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} barCategoryGap="35%">
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}M`}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="derrama" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.estimated ? "#22d3ee" : "#334155"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-700" />
                <span className="text-slate-500 text-xs">Historico</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-cyan-400" />
                <span className="text-slate-500 text-xs">Estimado actual</span>
              </div>
            </div>
          </div>

          {/* Pie chart — takes 2/5 of the row */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-1">
              Derrama por Sector
            </h2>
            <p className="text-slate-500 text-xs mb-4">Distribucion porcentual</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Manual legend — more readable than recharts default */}
            <div className="space-y-1.5 mt-2">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                    />
                    <span className="text-slate-400 text-xs">{entry.name}</span>
                  </div>
                  <span className="text-slate-300 text-xs font-medium">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Raw JSON debug panel — remove before final demo */}
        {analysisResult && (
          <section className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-mono mb-2">
              DEBUG — backend response (remove before demo)
            </p>
            <pre className="text-xs text-slate-400 overflow-auto max-h-48 font-mono">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </section>
        )}

      </main>
    </div>
  );
}
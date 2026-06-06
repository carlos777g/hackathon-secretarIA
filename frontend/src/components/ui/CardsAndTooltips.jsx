import { formatMXN, formatNumber } from "../../utils/formatters";

export function KPICard({ title, value, icon: Icon, accent = "cyan" }) {
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

export function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white mb-1">{title}</h2>
      {subtitle && <p className="text-slate-500 text-xs mb-5">{subtitle}</p>}
      {children}
    </div>
  );
}

export function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-cyan-400 font-bold">{formatMXN(payload[0].value)}</p>
    </div>
  );
}

export function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm">
      <p className="text-white font-medium">{payload[0].name}</p>
      <p className="text-cyan-400">{formatNumber(payload[0].value)}</p>
    </div>
  );
}
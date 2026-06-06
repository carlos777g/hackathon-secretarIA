export function formatMXN(value) {
  if (!value && value !== 0) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B MXN`;
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M MXN`;
  return `$${value.toLocaleString("es-MX")} MXN`;
}

export function formatNumber(value) {
  if (!value && value !== 0) return "—";
  return value.toLocaleString("es-MX");
}
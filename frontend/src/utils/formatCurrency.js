/**
 * Formatea precios enteros en pesos colombianos (COP).
 * Regla del proyecto: dinero siempre en enteros (COP), nunca float.
 */
export function formatCOP(amount) {
  const safeInt = Number.isFinite(amount) ? Math.trunc(amount) : 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(safeInt);
}

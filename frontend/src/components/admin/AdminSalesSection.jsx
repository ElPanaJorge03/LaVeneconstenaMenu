import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Money, TrendUp } from "@phosphor-icons/react";
import { adminFullApi } from "../../api/client";
import { formatCOP } from "../../utils/formatCurrency";
import { StatusBadge } from "../ui/StatusBadge";
import { StickerCard } from "../ui/StickerCard";

const RANGES = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "7 días" },
  { id: "mes", label: "30 días" },
  { id: "todo", label: "Todo" },
];

export function AdminSalesSection() {
  const [rango, setRango] = useState("hoy");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ventas", rango],
    queryFn: () => adminFullApi.getVentasResumen(rango),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-marron">
            Ventas e Historial
          </h2>
          <p className="text-xs sm:text-sm text-marron-muted">
            Resumen básico de pedidos, métodos de pago y platos más pedidos.
          </p>
        </div>

        <div className="inline-flex bg-blanco border border-borde rounded-full p-1 shadow-sticker-sm">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRango(r.id)}
              className={[
                "min-h-[38px] px-3.5 rounded-full text-xs sm:text-sm font-heading font-bold cursor-pointer transition-colors",
                rango === r.id
                  ? "bg-rojo-cta text-blanco"
                  : "text-marron hover:bg-crema-elevated",
              ].join(" ")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <StickerCard elevation="sm" className="p-6 text-center text-sm text-marron-muted">
          Cargando resumen de ventas...
        </StickerCard>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StickerCard elevation="sm" className="p-4">
              <span className="text-xs font-bold text-marron-muted">Ventas totales</span>
              <p className="font-heading text-2xl font-extrabold text-rojo-cta tabular-price">
                {formatCOP(data.ventas_totales)}
              </p>
            </StickerCard>
            <StickerCard elevation="sm" className="p-4">
              <span className="text-xs font-bold text-marron-muted">Cobrado confirmado</span>
              <p className="font-heading text-2xl font-extrabold text-verde-text tabular-price">
                {formatCOP(data.ventas_cobradas)}
              </p>
            </StickerCard>
            <StickerCard elevation="sm" className="p-4">
              <span className="text-xs font-bold text-marron-muted">Pedidos (activos)</span>
              <p className="font-heading text-2xl font-extrabold text-marron tabular-price">
                {data.total_pedidos}{" "}
                <span className="text-sm font-bold text-marron-muted">
                  ({data.pedidos_activos})
                </span>
              </p>
            </StickerCard>
            <StickerCard elevation="sm" className="p-4">
              <span className="text-xs font-bold text-marron-muted">Ticket promedio</span>
              <p className="font-heading text-2xl font-extrabold text-marron tabular-price">
                {formatCOP(data.ticket_promedio)}
              </p>
            </StickerCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <StickerCard elevation="sm" className="lg:col-span-5 p-5 space-y-3">
              <h3 className="font-heading text-base font-extrabold text-marron">
                Distribución por pago
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-verde-soft/60">
                  <span className="inline-flex items-center gap-2 font-bold text-verde-text">
                    <Money size={18} weight="duotone" aria-hidden="true" />
                    Efectivo
                  </span>
                  <span className="font-heading font-extrabold text-marron tabular-price">
                    {formatCOP(data.por_metodo?.efectivo || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-mostaza-soft/70">
                  <span className="inline-flex items-center gap-2 font-bold text-mostaza-text">
                    <CreditCard size={18} weight="duotone" aria-hidden="true" />
                    Bold online
                  </span>
                  <span className="font-heading font-extrabold text-marron tabular-price">
                    {formatCOP(data.por_metodo?.bold || 0)}
                  </span>
                </div>
              </div>
            </StickerCard>

            <StickerCard elevation="sm" className="lg:col-span-7 p-5 space-y-3">
              <h3 className="font-heading text-base font-extrabold text-marron inline-flex items-center gap-1.5">
                <TrendUp size={18} weight="duotone" className="text-rojo" aria-hidden="true" />
                <span>Platos más vendidos</span>
              </h3>
              {data.top_productos?.length ? (
                <ul className="divide-y divide-borde/60 text-sm">
                  {data.top_productos.map((row) => (
                    <li
                      key={row.nombre_producto}
                      className="py-2 flex items-center justify-between gap-2"
                    >
                      <span className="font-bold text-marron">
                        {row.nombre_producto}
                      </span>
                      <span className="text-xs font-extrabold text-marron-muted tabular-price">
                        {row.unidades} uds ·{" "}
                        <strong className="text-marron">
                          {formatCOP(row.ingresos)}
                        </strong>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-marron-muted">
                  Aún no hay pedidos registrados en este período.
                </p>
              )}
            </StickerCard>
          </div>

          {/* HISTORIAL RECIENTE */}
          <StickerCard elevation="md" className="overflow-hidden">
            <div className="px-5 py-3.5 bg-crema-elevated/70 border-b border-borde">
              <h3 className="font-heading text-base font-extrabold text-marron">
                Historial reciente ({data.historial?.length || 0})
              </h3>
            </div>
            {data.historial?.length ? (
              <div className="divide-y divide-borde/70">
                {data.historial.map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-extrabold text-marron">
                          {p.codigo}
                        </span>
                        <StatusBadge status={p.estado} size="sm" />
                        <span className="text-xs font-bold text-marron-muted">
                          {p.mesa_display || p.tipo} · {p.cliente_nombre}
                        </span>
                      </div>
                      <p className="text-xs text-marron-muted">
                        {p.items.map((i) => `${i.cantidad}× ${i.nombre_producto}`).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-marron-muted">
                        {p.pago?.metodo} ({p.pago?.estado})
                      </span>
                      <span className="font-heading font-extrabold text-base text-rojo-cta tabular-price">
                        {formatCOP(p.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-sm text-marron-muted text-center">
                Sin pedidos en este rango.
              </p>
            )}
          </StickerCard>
        </>
      )}
    </div>
  );
}

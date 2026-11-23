import { useState } from "react";
import { Fire, Plus, Sparkle, Tag } from "@phosphor-icons/react";
import { formatCOP } from "../../utils/formatCurrency";

export function PromosBanner({ promoCategories = [], onSelectProduct, qtyByProductAndSize = {} }) {
  const [activeTab, setActiveTab] = useState(
    promoCategories[0]?.slug || "promociones"
  );

  if (!promoCategories.length) return null;

  const current =
    promoCategories.find((c) => c.slug === activeTab) || promoCategories[0];

  return (
    <section
      aria-label="Promociones y Combos"
      className="rounded-3xl bg-rojo-cta text-blanco border-4 border-blanco shadow-sticker-lg overflow-hidden"
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-mostaza text-xs font-extrabold uppercase tracking-wider">
              <Fire size={15} weight="duotone" aria-hidden="true" />
              <span>Lo más pedido de la carta</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold leading-tight">
              {current.nombre}
            </h2>
            {current.descripcion ? (
              <p className="text-sm text-blanco/90 font-semibold">
                {current.descripcion}
              </p>
            ) : null}
          </div>

          {promoCategories.length > 1 ? (
            <div
              role="tablist"
              aria-label="Cambiar entre promociones y combos"
              className="inline-flex self-start sm:self-center bg-marron/25 p-1 rounded-full border border-blanco/20"
            >
              {promoCategories.map((cat) => {
                const active = cat.slug === current.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(cat.slug)}
                    className={[
                      "min-h-[40px] px-4 rounded-full text-sm font-heading font-bold transition-all cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mostaza",
                      active
                        ? "bg-mostaza text-marron shadow-sm"
                        : "text-blanco hover:bg-blanco/10",
                    ].join(" ")}
                  >
                    {cat.nombre}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {current.productos.map((prod) => {
            const count = qtyByProductAndSize[`${prod.id}:normal`] || 0;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => onSelectProduct(prod, current.nombre, "normal")}
                className="group text-left bg-blanco/12 hover:bg-blanco/20 border border-blanco/20 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mostaza"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {prod.etiqueta ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-mostaza">
                        {current.slug === "combos" ? (
                          <Sparkle size={12} weight="fill" aria-hidden="true" />
                        ) : (
                          <Tag size={12} weight="fill" aria-hidden="true" />
                        )}
                        {prod.etiqueta}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-heading text-base sm:text-lg font-extrabold text-blanco leading-snug">
                    {prod.nombre}
                  </p>
                  {prod.descripcion ? (
                    <p className="text-xs text-blanco/85 leading-snug">
                      {prod.descripcion}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="font-heading text-lg sm:text-xl font-extrabold text-mostaza tabular-price">
                    {formatCOP(prod.precio_normal)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mostaza text-marron text-xs font-extrabold group-hover:brightness-95">
                    <Plus size={13} weight="bold" aria-hidden="true" />
                    {count > 0 ? `En pedido (${count})` : "Pedir"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

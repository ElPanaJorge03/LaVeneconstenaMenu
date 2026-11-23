import { Crown, Plus, UsersThree } from "@phosphor-icons/react";
import { formatCOP } from "../../utils/formatCurrency";

const ACCENT_STYLES = {
  rojo: {
    ribbon: "bg-rojo-cta text-blanco",
    stripe: "bg-mostaza",
    countPill: "bg-blanco/20 text-blanco",
  },
  verde: {
    ribbon: "bg-verde-text text-blanco",
    stripe: "bg-verde",
    countPill: "bg-blanco/20 text-blanco",
  },
  mostaza: {
    ribbon: "bg-mostaza text-marron",
    stripe: "bg-rojo",
    countPill: "bg-marron/15 text-marron",
  },
};

export function MenuCategorySheet({
  categoria,
  onSelectProduct,
  qtyByProductAndSize = {},
}) {
  const accent = ACCENT_STYLES[categoria.color_acento] || ACCENT_STYLES.rojo;
  const clasicos = categoria.productos.filter((p) => !p.es_especial);
  const especiales = categoria.productos.filter((p) => p.es_especial);
  const hasAnyMini = clasicos.some((p) => p.tiene_mini);
  const isBebidas = categoria.slug === "bebidas";

  return (
    <section
      id={`cat-${categoria.slug}`}
      aria-labelledby={`heading-${categoria.slug}`}
      className="bg-blanco rounded-3xl border border-borde/90 shadow-sticker-md overflow-hidden scroll-mt-36"
    >
      {/* CINTA EDITORIAL DE CATEGORÍA */}
      <div className={`relative ${accent.ribbon} px-5 py-4`}>
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0 h-1 ${accent.stripe}`}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={`heading-${categoria.slug}`}
              className="font-heading text-2xl sm:text-[1.65rem] font-extrabold tracking-tight leading-none"
            >
              {categoria.nombre}
            </h2>
            {categoria.descripcion ? (
              <p className="text-xs sm:text-sm opacity-90 mt-1 font-medium">
                {categoria.descripcion}
              </p>
            ) : null}
          </div>
          <span
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-extrabold tabular-price ${accent.countPill}`}
          >
            {categoria.productos.length}{" "}
            {categoria.productos.length === 1 ? "opción" : "opciones"}
          </span>
        </div>
      </div>

      {/* ZONA A: CLÁSICOS DE LA CARTA (FILAS LIMPIAS CON BOTONES NORMAL / MINI) */}
      {clasicos.length > 0 ? (
        isBebidas ? (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {clasicos.map((prod) => {
              const qty = qtyByProductAndSize[`${prod.id}:normal`] || 0;
              const priced = prod.precio_normal > 0;
              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-crema/60 border border-borde/70"
                >
                  <span className="font-heading font-bold text-base text-marron">
                    {prod.nombre}
                  </span>
                  {priced ? (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectProduct(prod, categoria.nombre, "normal")
                      }
                      className="shrink-0 min-h-[40px] px-3.5 rounded-full bg-blanco border border-rojo/40 text-marron hover:bg-rojo-cta hover:text-blanco hover:border-rojo-cta font-heading font-extrabold text-sm tabular-price inline-flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo"
                    >
                      <span>{formatCOP(prod.precio_normal)}</span>
                      <Plus size={14} weight="bold" aria-hidden="true" />
                      {qty > 0 ? (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-mostaza text-marron text-[11px]">
                          ×{qty}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    <span className="shrink-0 px-3 py-1 rounded-full bg-crema-elevated text-marron-muted text-xs font-bold">
                      Consultar precio
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {/* CABECERA DE COLUMNAS NORMAL / MINI */}
            <div className="px-4 sm:px-5 py-2.5 bg-crema-elevated/70 border-b border-borde/70 flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-wider text-marron-muted">
              <span>Plato</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-[100px] sm:w-[116px] text-center text-marron">
                  Normal
                </span>
                {hasAnyMini ? (
                  <span className="w-[92px] sm:w-[106px] text-center text-verde-text">
                    MINI
                  </span>
                ) : null}
              </div>
            </div>

            <ul className="divide-y divide-borde/60">
              {clasicos.map((prod) => {
                const qtyNormal = qtyByProductAndSize[`${prod.id}:normal`] || 0;
                const qtyMini = qtyByProductAndSize[`${prod.id}:mini`] || 0;

                return (
                  <li
                    key={prod.id}
                    className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 even:bg-crema/35 hover:bg-mostaza-soft/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProduct(prod, categoria.nombre, "normal")
                        }
                        className="text-left font-heading font-bold text-[15px] sm:text-base text-marron hover:text-rojo-cta transition-colors cursor-pointer leading-snug focus-visible:outline-none focus-visible:underline"
                      >
                        {prod.nombre}
                      </button>
                      {prod.descripcion ? (
                        <p className="text-xs text-marron-muted mt-0.5 leading-snug">
                          {prod.descripcion}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* BOTÓN PRECIO NORMAL */}
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProduct(prod, categoria.nombre, "normal")
                        }
                        aria-label={`Pedir ${prod.nombre} Normal por ${formatCOP(prod.precio_normal)}`}
                        className={[
                          "relative w-[100px] sm:w-[116px] min-h-[44px] px-2.5 rounded-2xl border font-heading font-extrabold text-sm sm:text-[15px] tabular-price",
                          "inline-flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-[0.97]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo focus-visible:ring-offset-1",
                          qtyNormal > 0
                            ? "bg-rojo-cta text-blanco border-rojo-cta shadow-sm"
                            : "bg-blanco text-marron border-borde hover:border-rojo hover:bg-rojo-soft/70 hover:text-rojo-cta",
                        ].join(" ")}
                      >
                        <span>{formatCOP(prod.precio_normal)}</span>
                        {qtyNormal > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-mostaza text-marron text-[10px] leading-none">
                            ×{qtyNormal}
                          </span>
                        ) : (
                          <Plus
                            size={13}
                            weight="bold"
                            className="opacity-65 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>

                      {/* BOTÓN PRECIO MINI */}
                      {hasAnyMini ? (
                        prod.tiene_mini ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectProduct(prod, categoria.nombre, "mini")
                            }
                            aria-label={`Pedir ${prod.nombre} MINI por ${formatCOP(prod.precio_mini)}`}
                            className={[
                              "relative w-[92px] sm:w-[106px] min-h-[44px] px-2 rounded-2xl border font-heading font-extrabold text-sm tabular-price",
                              "inline-flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-[0.97]",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde focus-visible:ring-offset-1",
                              qtyMini > 0
                                ? "bg-verde-text text-blanco border-verde-text shadow-sm"
                                : "bg-verde-soft/80 text-verde-text border-verde/45 hover:bg-verde-text hover:text-blanco",
                            ].join(" ")}
                          >
                            <span>{formatCOP(prod.precio_mini)}</span>
                            {qtyMini > 0 ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-mostaza text-marron text-[10px] leading-none">
                                ×{qtyMini}
                              </span>
                            ) : null}
                          </button>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="w-[92px] sm:w-[106px] text-center text-xs text-marron-muted/40 select-none"
                          >
                            —
                          </span>
                        )
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      ) : null}

      {/* ZONA B: ESPECIALES DE LA CASA Y PARA COMPARTIR */}
      {especiales.length > 0 ? (
        <div className="bg-mostaza-soft/45 border-t-2 border-dashed border-mostaza/65 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-mostaza-text">
            <Crown size={18} weight="duotone" aria-hidden="true" />
            <h3 className="font-heading text-sm sm:text-base font-extrabold uppercase tracking-wide">
              Especiales de la casa
            </h3>
          </div>

          <div
            className={[
              "grid gap-3",
              especiales.length > 1
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1",
            ].join(" ")}
          >
            {especiales.map((prod) => {
              const qty = qtyByProductAndSize[`${prod.id}:normal`] || 0;
              return (
                <article
                  key={prod.id}
                  className="bg-blanco rounded-2xl border border-mostaza/55 p-4 shadow-sticker-sm flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-heading text-lg font-extrabold text-marron leading-tight">
                        {prod.nombre}
                      </h4>
                      {prod.porciones_texto ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rojo-soft text-rojo-cta text-xs font-extrabold">
                          <UsersThree size={13} weight="duotone" aria-hidden="true" />
                          {prod.porciones_texto}
                        </span>
                      ) : prod.etiqueta ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-mostaza text-marron text-xs font-extrabold">
                          {prod.etiqueta}
                        </span>
                      ) : null}
                    </div>
                    {prod.descripcion ? (
                      <p className="text-xs sm:text-sm text-marron-muted leading-relaxed">
                        {prod.descripcion}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-borde/60">
                    <span className="font-heading text-xl sm:text-2xl font-extrabold text-rojo-cta tabular-price">
                      {formatCOP(prod.precio_normal)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectProduct(prod, categoria.nombre, "normal")
                      }
                      aria-label={`Pedir ${prod.nombre} por ${formatCOP(prod.precio_normal)}`}
                      className="min-h-[44px] px-4 rounded-full bg-rojo-cta text-blanco font-heading font-bold text-sm shadow-cta hover:bg-rojo-hover active:scale-[0.98] inline-flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo focus-visible:ring-offset-2"
                    >
                      <Plus size={16} weight="bold" aria-hidden="true" />
                      <span>{qty > 0 ? `Agregar otro (${qty})` : "Pedir"}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

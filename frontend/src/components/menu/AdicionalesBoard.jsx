import { PlusCircle } from "@phosphor-icons/react";
import { formatCOP } from "../../utils/formatCurrency";

export function AdicionalesBoard({ adicionales = [] }) {
  if (!adicionales.length) return null;

  return (
    <section
      id="cat-adicionales"
      aria-labelledby="heading-adicionales"
      className="bg-crema-elevated rounded-3xl border-4 border-blanco shadow-sticker-md p-5 sm:p-6 scroll-mt-36 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-rojo-cta text-blanco font-heading font-extrabold text-base sm:text-lg tracking-wide">
              ADICIONALES
            </span>
          </div>
          <p className="text-xs sm:text-sm text-marron-muted pt-1">
            Toca cualquier plato de la carta para sumarle cualquiera de estos
            adicionales a tu gusto.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-marron-muted">
          <PlusCircle size={16} weight="duotone" className="text-rojo" aria-hidden="true" />
          {adicionales.length} extras disponibles
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {adicionales.map((extra) => (
          <div
            key={extra.id}
            className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-blanco border border-borde/80"
          >
            <span className="font-heading font-bold text-sm sm:text-base text-marron">
              {extra.nombre}
            </span>
            <span className="font-heading font-extrabold text-sm sm:text-base text-rojo-cta tabular-price">
              +{formatCOP(extra.precio)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

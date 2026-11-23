import { useEffect, useMemo, useState } from "react";
import { Check, Minus, NotePencil, Plus, X } from "@phosphor-icons/react";
import { formatCOP } from "../../utils/formatCurrency";
import { Button } from "../ui/Button";

export function ProductCustomizeModal({
  selection,
  adicionales = [],
  onClose,
  onConfirm,
}) {
  const producto = selection?.producto;
  const categoriaNombre = selection?.categoriaNombre || "";

  const [size, setSize] = useState(selection?.initialSize || "normal");
  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [notas, setNotas] = useState("");
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (selection) {
      setSize(
        selection.initialSize === "mini" && selection.producto?.tiene_mini
          ? "mini"
          : "normal"
      );
      setSelectedExtraIds([]);
      setNotas("");
      setCantidad(1);
    }
  }, [selection]);

  useEffect(() => {
    if (!selection) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selection, onClose]);

  const selectedAdicionales = useMemo(
    () => adicionales.filter((a) => selectedExtraIds.includes(a.id)),
    [adicionales, selectedExtraIds]
  );

  if (!producto) return null;

  const basePrice =
    size === "mini" && producto.tiene_mini
      ? producto.precio_mini
      : producto.precio_normal;
  const extrasTotal = selectedAdicionales.reduce((sum, a) => sum + a.precio, 0);
  const lineTotal = (basePrice + extrasTotal) * cantidad;
  const hideExtras =
    categoriaNombre.toLowerCase() === "bebidas";

  const toggleExtra = (id) => {
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      producto,
      categoriaNombre,
      size,
      adicionales: selectedAdicionales,
      notas,
      cantidad,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-negro/55 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-lg max-h-[90vh] bg-crema rounded-t-3xl sm:rounded-3xl border-t-4 sm:border-4 border-blanco shadow-sticker-lg flex flex-col overflow-hidden"
      >
        {/* CABECERA */}
        <div className="px-5 py-4 bg-blanco border-b border-borde flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rojo-cta">
              {categoriaNombre}
            </span>
            <h2
              id="customize-modal-title"
              className="font-heading text-xl sm:text-2xl font-extrabold text-marron leading-tight"
            >
              {producto.nombre}
            </h2>
            {producto.descripcion ? (
              <p className="text-xs sm:text-sm text-marron-muted mt-1 leading-relaxed">
                {producto.descripcion}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="shrink-0 min-h-[44px] min-w-[44px] rounded-full bg-crema-elevated text-marron flex items-center justify-center hover:bg-rojo-soft hover:text-rojo-cta transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo"
          >
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* CUERPO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* SELECTOR DE TAMAÑO NORMAL VS MINI */}
          {producto.tiene_mini ? (
            <fieldset className="space-y-2">
              <legend className="font-heading text-sm font-extrabold uppercase tracking-wide text-marron">
                Elige el tamaño
              </legend>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSize("normal")}
                  aria-pressed={size === "normal"}
                  className={[
                    "min-h-[56px] p-3 rounded-2xl border-2 text-left transition-all cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo",
                    size === "normal"
                      ? "bg-rojo-soft border-rojo-cta text-marron shadow-sm"
                      : "bg-blanco border-borde text-marron-muted hover:border-marron/40",
                  ].join(" ")}
                >
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-rojo-cta">
                    Normal
                  </span>
                  <span className="font-heading text-lg font-extrabold text-marron tabular-price">
                    {formatCOP(producto.precio_normal)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSize("mini")}
                  aria-pressed={size === "mini"}
                  className={[
                    "min-h-[56px] p-3 rounded-2xl border-2 text-left transition-all cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde",
                    size === "mini"
                      ? "bg-verde-soft border-verde-text text-marron shadow-sm"
                      : "bg-blanco border-borde text-marron-muted hover:border-marron/40",
                  ].join(" ")}
                >
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-verde-text">
                    MINI
                  </span>
                  <span className="font-heading text-lg font-extrabold text-marron tabular-price">
                    {formatCOP(producto.precio_mini)}
                  </span>
                </button>
              </div>
            </fieldset>
          ) : null}

          {/* ADICIONALES REALES */}
          {!hideExtras && adicionales.length > 0 ? (
            <fieldset className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <legend className="font-heading text-sm font-extrabold uppercase tracking-wide text-marron">
                  Adicionales (opcional)
                </legend>
                {selectedAdicionales.length > 0 ? (
                  <span className="text-xs font-extrabold text-rojo-cta tabular-price">
                    +{formatCOP(extrasTotal)}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {adicionales.map((extra) => {
                  const checked = selectedExtraIds.includes(extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra.id)}
                      aria-pressed={checked}
                      className={[
                        "min-h-[46px] px-3.5 py-2 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo",
                        checked
                          ? "bg-mostaza-soft border-mostaza text-marron shadow-sm"
                          : "bg-blanco border-borde text-marron hover:border-marron/40",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span
                          className={[
                            "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                            checked
                              ? "bg-rojo-cta border-rojo-cta text-blanco"
                              : "bg-crema border-borde",
                          ].join(" ")}
                        >
                          {checked ? (
                            <Check size={13} weight="bold" aria-hidden="true" />
                          ) : null}
                        </span>
                        <span className="text-sm font-bold truncate">
                          {extra.nombre}
                        </span>
                      </span>
                      <span className="text-xs font-extrabold text-rojo-cta tabular-price shrink-0">
                        +{formatCOP(extra.precio)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {/* NOTAS DE COCINA */}
          <div className="space-y-1.5">
            <label
              htmlFor="producto-notas"
              className="inline-flex items-center gap-1.5 font-heading text-sm font-extrabold uppercase tracking-wide text-marron"
            >
              <NotePencil size={16} weight="duotone" aria-hidden="true" />
              <span>Notas para cocina (opcional)</span>
            </label>
            <input
              id="producto-notas"
              type="text"
              maxLength={140}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Sin cebolla, salsa tártara aparte, bien tostado..."
              className="w-full min-h-[46px] px-4 rounded-2xl bg-blanco border border-borde text-sm text-marron placeholder:text-marron-muted/65 focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
            />
          </div>
        </div>

        {/* PIE FIJO: CANTIDAD + AGREGAR */}
        <div className="px-5 py-4 bg-blanco border-t border-borde flex items-center gap-3 safe-bottom">
          <div className="inline-flex items-center gap-1 bg-crema-elevated border border-borde rounded-full p-1">
            <button
              type="button"
              onClick={() => setCantidad((q) => Math.max(1, q - 1))}
              aria-label="Disminuir cantidad"
              className="w-10 h-10 rounded-full bg-blanco text-marron flex items-center justify-center hover:text-rojo-cta cursor-pointer"
            >
              <Minus size={16} weight="bold" aria-hidden="true" />
            </button>
            <span className="w-7 text-center font-heading font-extrabold text-base text-marron tabular-price">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => setCantidad((q) => Math.min(20, q + 1))}
              aria-label="Aumentar cantidad"
              className="w-10 h-10 rounded-full bg-rojo-cta text-blanco flex items-center justify-center hover:bg-rojo-hover cursor-pointer"
            >
              <Plus size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <Button type="submit" className="flex-1 justify-between px-5">
            <span>Agregar</span>
            <span className="tabular-price">{formatCOP(lineTotal)}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

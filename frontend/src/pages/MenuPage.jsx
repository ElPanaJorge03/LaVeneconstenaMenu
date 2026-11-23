import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClockCountdown,
  Crown,
  MagnifyingGlass,
  SlidersHorizontal,
  Sparkle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { BrandFooter } from "../components/layout/BrandFooter";
import { BrandHeader } from "../components/layout/BrandHeader";
import { AdicionalesBoard } from "../components/menu/AdicionalesBoard";
import { CartDrawer } from "../components/menu/CartDrawer";
import { MenuCategorySheet } from "../components/menu/MenuCategorySheet";
import { ProductCustomizeModal } from "../components/menu/ProductCustomizeModal";
import { PromosBanner } from "../components/menu/PromosBanner";
import { Button } from "../components/ui/Button";
import { MascotState } from "../components/ui/MascotState";
import { useCart } from "../hooks/useCart";
import { usePublicMenu } from "../hooks/useMenu";
import { getLastOrderCode, useLocalInfo } from "../hooks/useOrders";
import { formatCOP } from "../utils/formatCurrency";

function normalizeText(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function MenuPage({ mesaPreasignada = null }) {
  const { data, isLoading, isError, refetch } = usePublicMenu();
  const { data: localInfo } = useLocalInfo();
  const { totalItems, totalPrice, qtyByProductAndSize, addItem } = useCart();

  const localAbierto = localInfo ? localInfo.abierto !== false : true;
  const lastOrderCode = getLastOrderCode();

  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("all");
  const [filterMode, setFilterMode] = useState("all"); // all | mini | especiales
  const [selection, setSelection] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  const categorias = data?.categorias || [];
  const adicionales = data?.adicionales || [];

  const promoCategories = useMemo(
    () => categorias.filter((c) => c.es_promocion && c.productos.length > 0),
    [categorias]
  );

  const mainCategories = useMemo(
    () => categorias.filter((c) => !c.es_promocion && c.productos.length > 0),
    [categorias]
  );

  const query = normalizeText(search.trim());

  const filteredCategories = useMemo(() => {
    const source =
      selectedSlug === "all"
        ? mainCategories
        : mainCategories.filter((c) => c.slug === selectedSlug);

    return source
      .map((cat) => {
        const catMatches = query && normalizeText(cat.nombre).includes(query);
        const productos = cat.productos.filter((prod) => {
          if (filterMode === "mini" && !prod.tiene_mini) return false;
          if (filterMode === "especiales" && !prod.es_especial) return false;
          if (!query || catMatches) return true;
          return (
            normalizeText(prod.nombre).includes(query) ||
            normalizeText(prod.descripcion).includes(query) ||
            normalizeText(prod.porciones_texto).includes(query)
          );
        });
        return { ...cat, productos };
      })
      .filter((cat) => cat.productos.length > 0);
  }, [mainCategories, selectedSlug, filterMode, query]);

  const showPromos =
    !query && selectedSlug === "all" && filterMode === "all" && promoCategories.length > 0;

  const openCustomizer = (producto, categoriaNombre, initialSize = "normal") => {
    if (!localAbierto) return;
    setSelection({ producto, categoriaNombre, initialSize });
  };

  return (
    <div className="min-h-screen flex flex-col bg-crema">
      <BrandHeader
        cartCount={totalItems}
        cartTotal={totalPrice}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* CABECERA COMPACTA DE LA CARTA + BUSCADOR */}
      <section className="bg-crema pt-5 pb-4 sm:pt-7 sm:pb-5 border-b border-borde/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-marron leading-tight">
                La Carta de{" "}
                <span className="font-display font-normal text-rojo">
                  La VeneConsteña
                </span>
              </h1>
              <p className="text-sm sm:text-base text-marron-muted">
                Toca el precio <strong>Normal</strong> o{" "}
                <strong className="text-verde-text">MINI</strong> de cualquier
                plato para sumar adicionales y armar tu pedido.
              </p>
            </div>
            <img
              src="/assets/brand/mascot-confirmed.png"
              alt="Chef de La VeneConsteña"
              className="hidden sm:block w-20 h-20 object-contain sticker-drop shrink-0 select-none"
            />
          </div>

          {/* BUSCADOR + FILTROS RÁPIDOS */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={19}
                weight="bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-marron-muted pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar plato: suizo, patacón, 4 carnes, pollo..."
                aria-label="Buscar en la carta"
                className="w-full min-h-[48px] pl-11 pr-10 rounded-full bg-blanco border border-borde shadow-sticker-sm text-sm sm:text-base text-marron placeholder:text-marron-muted/70 focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-marron-muted hover:text-rojo-cta cursor-pointer"
                >
                  <X size={17} weight="bold" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <div
              role="group"
              aria-label="Filtros rápidos de la carta"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
            >
              <button
                type="button"
                onClick={() =>
                  setFilterMode((m) => (m === "mini" ? "all" : "mini"))
                }
                aria-pressed={filterMode === "mini"}
                className={[
                  "shrink-0 min-h-[46px] px-4 rounded-full text-xs sm:text-sm font-extrabold border inline-flex items-center gap-1.5 transition-colors cursor-pointer",
                  filterMode === "mini"
                    ? "bg-verde-text text-blanco border-verde-text"
                    : "bg-blanco text-verde-text border-verde/50 hover:bg-verde-soft",
                ].join(" ")}
              >
                <Sparkle size={15} weight="duotone" aria-hidden="true" />
                <span>Opción MINI</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilterMode((m) =>
                    m === "especiales" ? "all" : "especiales"
                  )
                }
                aria-pressed={filterMode === "especiales"}
                className={[
                  "shrink-0 min-h-[46px] px-4 rounded-full text-xs sm:text-sm font-extrabold border inline-flex items-center gap-1.5 transition-colors cursor-pointer",
                  filterMode === "especiales"
                    ? "bg-mostaza text-marron border-mostaza"
                    : "bg-blanco text-mostaza-text border-mostaza/65 hover:bg-mostaza-soft",
                ].join(" ")}
              >
                <Crown size={15} weight="duotone" aria-hidden="true" />
                <span>Especiales</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BARRA STICKY DE CATEGORÍAS */}
      {!isLoading && !isError && mainCategories.length > 0 ? (
        <div className="sticky top-[68px] z-30 bg-crema/95 backdrop-blur-md border-b border-borde/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedSlug("all")}
              aria-pressed={selectedSlug === "all"}
              className={[
                "shrink-0 min-h-[40px] px-4 rounded-full font-heading font-bold text-sm transition-all cursor-pointer",
                selectedSlug === "all"
                  ? "bg-marron text-crema shadow-sm"
                  : "bg-blanco text-marron border border-borde hover:border-marron",
              ].join(" ")}
            >
              Toda la carta
            </button>

            {mainCategories.map((cat) => {
              const active = selectedSlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedSlug(cat.slug)}
                  aria-pressed={active}
                  className={[
                    "shrink-0 min-h-[40px] px-4 rounded-full font-heading font-bold text-sm inline-flex items-center gap-1.5 transition-all cursor-pointer",
                    active
                      ? "bg-rojo-cta text-blanco shadow-cta"
                      : "bg-blanco text-marron border border-borde hover:border-rojo hover:text-rojo-cta",
                  ].join(" ")}
                >
                  <span>{cat.nombre}</span>
                  <span
                    className={[
                      "text-[11px] px-1.5 py-0.5 rounded-full tabular-price",
                      active
                        ? "bg-blanco/20 text-blanco"
                        : "bg-crema-elevated text-marron-muted",
                    ].join(" ")}
                  >
                    {cat.productos.length}
                  </span>
                </button>
              );
            })}

            {adicionales.length > 0 && selectedSlug === "all" ? (
              <a
                href="#cat-adicionales"
                className="shrink-0 min-h-[40px] px-4 rounded-full font-heading font-bold text-sm bg-mostaza-soft text-mostaza-text border border-mostaza/60 hover:bg-mostaza hover:text-marron inline-flex items-center transition-colors cursor-pointer"
              >
                Adicionales ({adicionales.length})
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* CUERPO PRINCIPAL DE LA CARTA */}
      <main
        className={[
          "flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 space-y-6",
          totalItems > 0 ? "pb-28" : "pb-10",
        ].join(" ")}
      >
        {isLoading ? (
          <MascotState
            variant="cooking"
            title="Preparando la carta..."
            description="Cargando todos los platos, tamaños Normal y MINI y adicionales frescos."
          />
        ) : isError ? (
          <MascotState
            variant="error"
            title="No pudimos cargar el menú"
            description="Verifica que el servidor esté encendido e intenta de nuevo."
            action={
              <Button size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          />
        ) : (
          <>
            {mesaPreasignada ? (
              <div className="rounded-3xl bg-verde-soft border-2 border-verde/55 px-5 py-3.5 flex items-center justify-between gap-3 shadow-sticker-sm">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-verde-text">
                    Pedido directo por QR
                  </span>
                  <p className="font-heading text-lg sm:text-xl font-extrabold text-marron">
                    Estás pidiendo desde{" "}
                    {mesaPreasignada.nombre || `Mesa ${mesaPreasignada.numero}`}
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-verde-text text-blanco font-heading font-extrabold text-sm shrink-0">
                  Mesa #{mesaPreasignada.numero}
                </span>
              </div>
            ) : null}

            {!localAbierto ? (
              <div
                role="alert"
                className="rounded-3xl bg-rojo-soft border-2 border-rojo/35 p-4 sm:p-5 flex items-center gap-4"
              >
                <img
                  src="/assets/brand/mascot-error.png"
                  alt="Local cerrado temporalmente"
                  className="w-16 h-16 object-contain shrink-0 select-none"
                />
                <div className="space-y-0.5">
                  <p className="font-heading text-lg font-extrabold text-rojo-cta inline-flex items-center gap-1.5">
                    <WarningCircle size={18} weight="duotone" aria-hidden="true" />
                    <span>En este momento estamos cerrados</span>
                  </p>
                  <p className="text-xs sm:text-sm text-marron">
                    {localInfo?.mensaje_cerrado ||
                      "Puedes revisar toda nuestra carta y pedir apenas abramos."}
                  </p>
                </div>
              </div>
            ) : null}

            {lastOrderCode ? (
              <div className="flex justify-end">
                <Link
                  to={`/pedido/${lastOrderCode}`}
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 rounded-full bg-mostaza-soft border border-mostaza/65 text-marron font-heading font-extrabold text-xs sm:text-sm hover:bg-mostaza transition-colors"
                >
                  <ClockCountdown size={16} weight="duotone" aria-hidden="true" />
                  <span>Seguir mi pedido ({lastOrderCode})</span>
                </Link>
              </div>
            ) : null}

            {showPromos ? (
              <PromosBanner
                promoCategories={promoCategories}
                onSelectProduct={openCustomizer}
                qtyByProductAndSize={qtyByProductAndSize}
              />
            ) : null}

            {filteredCategories.length === 0 ? (
              <MascotState
                variant="empty"
                title="No encontramos platos con ese filtro"
                description="Prueba con otro nombre o limpia los filtros para ver toda la carta."
                action={
                  <Button
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setSelectedSlug("all");
                      setFilterMode("all");
                    }}
                  >
                    <SlidersHorizontal size={16} weight="bold" aria-hidden="true" />
                    <span>Mostrar toda la carta</span>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-6">
                {filteredCategories.map((cat) => (
                  <MenuCategorySheet
                    key={cat.id}
                    categoria={cat}
                    onSelectProduct={openCustomizer}
                    qtyByProductAndSize={qtyByProductAndSize}
                  />
                ))}
              </div>
            )}

            {!query && selectedSlug === "all" && filterMode === "all" ? (
              <AdicionalesBoard adicionales={adicionales} />
            ) : null}
          </>
        )}
      </main>

      <BrandFooter />

      {/* ANUNCIO ACCESIBLE + BARRA FLOTANTE DEL CARRITO */}
      <div className="sr-only" role="status" aria-atomic="true">
        {totalItems > 0
          ? `${totalItems} ${totalItems === 1 ? "producto" : "productos"} en tu pedido, total ${formatCOP(totalPrice)}`
          : "Tu pedido está vacío"}
      </div>

      {totalItems > 0 ? (
        <div className="fixed bottom-3 inset-x-3 sm:left-auto sm:right-6 sm:w-[400px] z-40 safe-bottom">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="w-full min-h-[58px] px-5 py-3 rounded-full bg-rojo-cta text-blanco shadow-cta hover:bg-rojo-hover active:scale-[0.99] transition-all flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mostaza focus-visible:ring-offset-2 focus-visible:ring-offset-crema"
          >
            <span className="inline-flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-blanco text-rojo-cta font-heading font-extrabold text-sm flex items-center justify-center tabular-price">
                {totalItems}
              </span>
              <span className="font-heading font-bold text-base">
                Ver mi pedido
              </span>
            </span>
            <span className="font-heading font-extrabold text-lg tabular-price">
              {formatCOP(totalPrice)}
            </span>
          </button>
        </div>
      ) : null}

      <ProductCustomizeModal
        selection={selection}
        adicionales={adicionales}
        onClose={() => setSelection(null)}
        onConfirm={addItem}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        localAbierto={localAbierto}
        mensajeCerrado={localInfo?.mensaje_cerrado}
        mesaPreasignada={mesaPreasignada}
      />
    </div>
  );
}

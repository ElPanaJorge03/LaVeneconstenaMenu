import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ChefHat,
  List,
  MagnifyingGlass,
  ShieldCheck,
  ShoppingBagOpen,
  X,
} from "@phosphor-icons/react";
import { formatCOP } from "../../utils/formatCurrency";

export function BrandHeader({ cartCount = 0, cartTotal = 0, onOpenCart }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-crema/95 backdrop-blur-md border-b border-borde/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[68px] py-2 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="flex items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-crema"
          aria-label="La VeneConsteña — La Carta"
        >
          <img
            src="/assets/brand/logo.png"
            alt="La VeneConsteña"
            className="h-11 sm:h-14 w-auto object-contain sticker-drop select-none"
          />
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-1"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [
                "px-4 min-h-[42px] inline-flex items-center rounded-full text-sm font-extrabold transition-colors cursor-pointer",
                isActive
                  ? "bg-rojo-soft text-rojo-cta"
                  : "text-marron hover:bg-crema-elevated",
              ].join(" ")
            }
          >
            La Carta
          </NavLink>
          <NavLink
            to="/pedido"
            className={({ isActive }) =>
              [
                "px-4 min-h-[42px] inline-flex items-center gap-1.5 rounded-full text-sm font-bold transition-colors cursor-pointer",
                isActive
                  ? "bg-rojo-soft text-rojo-cta"
                  : "text-marron-muted hover:text-marron hover:bg-crema-elevated",
              ].join(" ")
            }
          >
            <MagnifyingGlass size={16} weight="duotone" aria-hidden="true" />
            <span>Seguir pedido</span>
          </NavLink>
          <span className="h-5 w-px bg-borde mx-1.5" aria-hidden="true" />
          <NavLink
            to="/mesera"
            className={({ isActive }) =>
              [
                "px-3.5 min-h-[40px] inline-flex items-center gap-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                isActive
                  ? "bg-marron text-crema"
                  : "text-marron-muted hover:text-marron hover:bg-crema-elevated",
              ].join(" ")
            }
          >
            <ChefHat size={15} weight="duotone" aria-hidden="true" />
            <span>Mesera</span>
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              [
                "px-3.5 min-h-[40px] inline-flex items-center gap-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                isActive
                  ? "bg-marron text-crema"
                  : "text-marron-muted hover:text-marron hover:bg-crema-elevated",
              ].join(" ")
            }
          >
            <ShieldCheck size={15} weight="duotone" aria-hidden="true" />
            <span>Admin</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {onOpenCart ? (
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Abrir mi pedido, ${cartCount} productos`}
              className={[
                "inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full font-heading font-bold transition-all cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-crema",
                cartCount > 0
                  ? "bg-rojo-cta text-blanco px-4 shadow-cta hover:bg-rojo-hover"
                  : "bg-blanco text-marron border border-borde px-3.5 shadow-sticker-sm hover:border-rojo hover:text-rojo-cta",
              ].join(" ")}
            >
              <ShoppingBagOpen size={20} weight="duotone" aria-hidden="true" />
              {cartCount > 0 ? (
                <>
                  <span className="text-sm tabular-price">{cartCount}</span>
                  <span className="hidden sm:inline text-sm tabular-price border-l border-blanco/30 pl-2">
                    {formatCOP(cartTotal)}
                  </span>
                </>
              ) : (
                <span className="hidden sm:inline text-sm">Pedido</span>
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-blanco border border-borde shadow-sticker-sm text-marron hover:border-rojo cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo"
          >
            {mobileOpen ? (
              <X size={21} weight="bold" aria-hidden="true" />
            ) : (
              <List size={21} weight="bold" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Navegación móvil"
          className="md:hidden border-t border-borde/80 bg-blanco px-4 py-3 space-y-1.5 shadow-sticker-md"
        >
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center px-4 min-h-[44px] rounded-2xl text-base font-extrabold text-marron hover:bg-crema-elevated"
          >
            La Carta
          </Link>
          <Link
            to="/pedido"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-4 min-h-[44px] rounded-2xl text-base font-bold text-marron hover:bg-crema-elevated"
          >
            <MagnifyingGlass size={18} weight="duotone" aria-hidden="true" />
            <span>Seguir mi pedido</span>
          </Link>
          <div className="pt-2 mt-2 border-t border-borde/70 flex items-center gap-2">
            <Link
              to="/mesera"
              onClick={() => setMobileOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-2xl bg-crema-elevated text-sm font-bold text-marron"
            >
              <ChefHat size={17} weight="duotone" aria-hidden="true" />
              <span>Mesera</span>
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-2xl bg-marron text-sm font-bold text-crema"
            >
              <ShieldCheck size={17} weight="duotone" aria-hidden="true" />
              <span>Admin</span>
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

import { Clock, MapPin, Phone, SlidersHorizontal } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLocalInfo } from "../../hooks/useOrders";

export function BrandFooter() {
  const { data: local } = useLocalInfo();

  const ubicacion = [local?.barrio, local?.direccion].filter(Boolean).join(" · ");

  return (
    <footer className="bg-negro text-crema mt-16 border-t-4 border-mostaza">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-5 space-y-4">
          <img
            src="/assets/brand/logo.png"
            alt={local?.nombre || "La VeneConsteña"}
            className="h-16 w-auto object-contain select-none"
          />
          <p className="text-sm text-crema/80 max-w-sm leading-relaxed">
            Comida rápida de barrio con sazón costeña hecha al momento. Pide desde
            tu mesa con QR, para recoger o a domicilio sin registro.
          </p>
        </div>

        <div className="md:col-span-4 space-y-3">
          <h2 className="font-heading text-lg font-bold text-mostaza">
            Información del local
          </h2>
          <ul className="space-y-2.5 text-sm text-crema/85">
            <li className="flex items-start gap-2.5">
              <Clock size={18} weight="duotone" className="text-mostaza shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {local?.horarios || "Horarios configurables desde Panel Admin"}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={18} weight="duotone" className="text-verde shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {ubicacion || "Barrio y dirección configurables desde Panel Admin"}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone size={18} weight="duotone" className="text-rojo shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {local?.telefono || "Contacto configurable desde Panel Admin"}
              </span>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-3">
          <h2 className="font-heading text-lg font-bold text-mostaza">
            Accesos
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            <Link
              to="/pedido"
              className="text-crema/85 hover:text-mostaza transition-colors w-fit"
            >
              Seguir mi pedido
            </Link>
            <Link
              to="/mesera"
              className="text-crema/85 hover:text-mostaza transition-colors w-fit"
            >
              Panel de mesera
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-crema/85 hover:text-mostaza transition-colors w-fit"
            >
              <SlidersHorizontal size={16} weight="duotone" aria-hidden="true" />
              <span>Panel administrador</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-blanco/10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-crema/65">
          <span>
            © {new Date().getFullYear()} {local?.nombre || "La VeneConsteña"}.
            Hecho con sabor casero.
          </span>
          <span>Pide desde tu mesa, para recoger o a domicilio</span>
        </div>
      </div>
    </footer>
  );
}

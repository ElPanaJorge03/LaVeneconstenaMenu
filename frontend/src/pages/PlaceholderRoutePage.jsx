import { ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { BrandFooter } from "../components/layout/BrandFooter";
import { BrandHeader } from "../components/layout/BrandHeader";
import { MascotState } from "../components/ui/MascotState";

export function PlaceholderRoutePage({
  title,
  description,
  phaseLabel,
  variant = "cooking",
}) {
  return (
    <div className="min-h-screen flex flex-col bg-crema">
      <BrandHeader />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center gap-6">
        <div className="text-center">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-mostaza-soft border border-mostaza/50 text-mostaza-text text-xs font-extrabold uppercase tracking-wider">
            {phaseLabel}
          </span>
        </div>

        <MascotState
          variant={variant}
          title={title}
          description={description}
          action={
            <Link
              to="/"
              className="inline-flex items-center gap-2 min-h-[46px] px-6 rounded-full bg-rojo-cta text-blanco font-heading font-bold text-sm shadow-cta hover:bg-rojo-hover transition-colors"
            >
              <ArrowLeft size={17} weight="bold" aria-hidden="true" />
              <span>Volver al inicio</span>
            </Link>
          }
        />
      </main>
      <BrandFooter />
    </div>
  );
}

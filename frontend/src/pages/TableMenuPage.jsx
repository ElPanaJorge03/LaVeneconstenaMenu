import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchPublicMesa } from "../api/client";
import { BrandFooter } from "../components/layout/BrandFooter";
import { BrandHeader } from "../components/layout/BrandHeader";
import { MascotState } from "../components/ui/MascotState";
import { MenuPage } from "./MenuPage";

export function TableMenuPage() {
  const { mesaId } = useParams();

  const { data: mesa, isLoading, isError } = useQuery({
    queryKey: ["public-mesa", mesaId],
    queryFn: () => fetchPublicMesa(mesaId),
    enabled: Boolean(mesaId),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-crema">
        <BrandHeader />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex items-center">
          <MascotState
            variant="cooking"
            title="Asignando tu mesa..."
            description="Cargando la carta de La VeneConsteña para tu mesa."
            className="w-full"
          />
        </main>
        <BrandFooter />
      </div>
    );
  }

  if (isError || !mesa) {
    return (
      <div className="min-h-screen flex flex-col bg-crema">
        <BrandHeader />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex items-center">
          <MascotState
            variant="error"
            title="Esta mesa no está activa"
            description="Escanea nuevamente el código QR o entra a la carta general para pedir."
            className="w-full"
            action={
              <Link
                to="/"
                className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-rojo-cta text-blanco font-heading font-bold text-sm"
              >
                Ir a la carta general
              </Link>
            }
          />
        </main>
        <BrandFooter />
      </div>
    );
  }

  return <MenuPage mesaPreasignada={mesa} />;
}

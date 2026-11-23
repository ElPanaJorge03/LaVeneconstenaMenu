import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowSquareOut,
  DownloadSimple,
  Plus,
  QrCode,
  Trash,
} from "@phosphor-icons/react";
import { adminFullApi } from "../../api/client";
import { Button } from "../ui/Button";
import { StickerCard } from "../ui/StickerCard";

export function AdminMesasSection() {
  const queryClient = useQueryClient();
  const [numero, setNumero] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const mesasQuery = useQuery({
    queryKey: ["admin-mesas"],
    queryFn: adminFullApi.listMesas,
  });

  const createMutation = useMutation({
    mutationFn: adminFullApi.createMesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mesas"] });
      setNumero("");
      setNombre("");
      setError("");
    },
    onError: (err) => setError(err.message || "No se pudo crear la mesa."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activa }) => adminFullApi.updateMesa(id, { activa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-mesas"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminFullApi.deleteMesa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-mesas"] }),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setError("");
    const num = parseInt(numero, 10);
    if (!num || num < 1) {
      setError("Ingresa un número de mesa válido.");
      return;
    }
    createMutation.mutate({
      numero: num,
      nombre: nombre.trim() || `Mesa ${num}`,
      activa: true,
    });
  };

  const handleDownloadQr = async (mesa) => {
    setDownloadingId(mesa.id);
    try {
      const blob = await adminFullApi.downloadMesaQrBlob(mesa.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LaVeneConstena-Mesa-${mesa.numero}-QR.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo descargar el QR.");
    } finally {
      setDownloadingId(null);
    }
  };

  const mesas = mesasQuery.data || [];

  return (
    <div className="space-y-5">
      <StickerCard elevation="sm" className="p-5 space-y-3">
        <h2 className="font-heading text-lg font-extrabold text-marron">
          Agregar nueva mesa con QR
        </h2>
        {error ? (
          <p className="text-xs font-bold text-rojo-cta bg-rojo-soft px-3 py-2 rounded-xl">
            {error}
          </p>
        ) : null}
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="number"
            min={1}
            required
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número (ej: 7)"
            className="sm:w-40 min-h-[44px] px-4 rounded-2xl bg-crema border border-borde text-sm"
          />
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre opcional (ej: Terraza 7)"
            className="flex-1 min-h-[44px] px-4 rounded-2xl bg-crema border border-borde text-sm"
          />
          <Button type="submit" size="sm" disabled={createMutation.isPending}>
            <Plus size={17} weight="bold" aria-hidden="true" />
            <span>Crear mesa</span>
          </Button>
        </form>
      </StickerCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mesas.map((mesa) => (
          <StickerCard key={mesa.id} elevation="md" className="p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-mostaza-soft text-mostaza-text flex items-center justify-center shrink-0">
                  <QrCode size={24} weight="duotone" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-extrabold text-marron leading-tight">
                    {mesa.nombre || `Mesa ${mesa.numero}`}
                  </h3>
                  <span className="text-xs font-bold text-marron-muted">
                    /mesa/{mesa.id}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  toggleMutation.mutate({ id: mesa.id, activa: !mesa.activa })
                }
                className={[
                  "px-2.5 py-1 rounded-full text-xs font-extrabold border cursor-pointer",
                  mesa.activa
                    ? "bg-verde-soft text-verde-text border-verde/45"
                    : "bg-rojo-soft text-rojo-cta border-rojo/30",
                ].join(" ")}
              >
                {mesa.activa ? "Activa" : "Inactiva"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={downloadingId === mesa.id}
                onClick={() => handleDownloadQr(mesa)}
              >
                <DownloadSimple size={16} weight="bold" aria-hidden="true" />
                <span>
                  {downloadingId === mesa.id ? "Generando..." : "Descargar QR"}
                </span>
              </Button>

              <Link
                to={`/mesa/${mesa.id}`}
                aria-label={`Abrir carta de Mesa ${mesa.numero}`}
                className="min-h-[44px] min-w-[44px] rounded-full bg-crema-elevated text-marron flex items-center justify-center hover:bg-mostaza-soft"
              >
                <ArrowSquareOut size={18} weight="duotone" aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Eliminar Mesa ${mesa.numero}?`)) {
                    deleteMutation.mutate(mesa.id);
                  }
                }}
                aria-label={`Eliminar Mesa ${mesa.numero}`}
                className="min-h-[44px] min-w-[44px] rounded-full bg-crema-elevated text-marron-muted hover:bg-rojo-soft hover:text-rojo-cta flex items-center justify-center cursor-pointer"
              >
                <Trash size={17} weight="duotone" aria-hidden="true" />
              </button>
            </div>
          </StickerCard>
        ))}
      </div>
    </div>
  );
}

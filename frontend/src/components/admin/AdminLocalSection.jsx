import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Storefront } from "@phosphor-icons/react";
import { adminFullApi } from "../../api/client";
import { Button } from "../ui/Button";
import { StickerCard } from "../ui/StickerCard";

export function AdminLocalSection() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nombre: "La VeneConsteña",
    abierto: true,
    mensaje_cerrado: "",
    horarios: "",
    barrio: "",
    direccion: "",
    telefono: "",
    instagram: "",
  });
  const [savedOk, setSavedOk] = useState(false);

  const configQuery = useQuery({
    queryKey: ["admin-local-config"],
    queryFn: adminFullApi.getConfigLocal,
  });

  useEffect(() => {
    if (configQuery.data) {
      setForm(configQuery.data);
    }
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: adminFullApi.updateConfigLocal,
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-local-config"], updated);
      queryClient.invalidateQueries({ queryKey: ["local-info"] });
      setSavedOk(true);
      window.setTimeout(() => setSavedOk(false), 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <StickerCard elevation="md" className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-marron inline-flex items-center gap-2">
            <Storefront size={22} weight="duotone" className="text-rojo" aria-hidden="true" />
            <span>Configuración del local</span>
          </h2>
          <p className="text-xs sm:text-sm text-marron-muted">
            Nada está fijo en código: actualiza aquí horarios, dirección,
            contacto y el estado abierto/cerrado.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SWITCH MAESTRO ABIERTO / CERRADO */}
        <div
          className={[
            "rounded-2xl p-4 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
            form.abierto
              ? "bg-verde-soft/65 border-verde/55"
              : "bg-rojo-soft border-rojo/40",
          ].join(" ")}
        >
          <div>
            <p className="font-heading text-base font-extrabold text-marron">
              Estado actual: {form.abierto ? "Local ABIERTO" : "Local CERRADO"}
            </p>
            <p className="text-xs text-marron-muted">
              {form.abierto
                ? "Los clientes pueden armar carrito y enviar pedidos."
                : "Los clientes ven la carta pero NO pueden enviar pedidos."}
            </p>
          </div>
          <Button
            type="button"
            variant={form.abierto ? "secondary" : "verde"}
            size="sm"
            onClick={() => {
              const next = !form.abierto;
              if (
                !next &&
                !window.confirm(
                  "¿Cerrar el local temporalmente? Los clientes no podrán enviar pedidos nuevos."
                )
              ) {
                return;
              }
              setForm((prev) => ({ ...prev, abierto: next }));
            }}
          >
            {form.abierto ? "Marcar como cerrado" : "Abrir local ahora"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="sm:col-span-2 block space-y-1">
            <span className="text-xs font-extrabold text-marron">Nombre del local</span>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-extrabold text-marron">Barrio</span>
            <input
              type="text"
              value={form.barrio}
              onChange={(e) => setForm({ ...form, barrio: e.target.value })}
              placeholder="Ej: Los Alpes / Villa Campestre..."
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-extrabold text-marron">Dirección</span>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Calle / Carrera / Referencia"
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-extrabold text-marron">Teléfono / WhatsApp</span>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="Ej: 324 181 4104"
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-extrabold text-marron">Instagram</span>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@lavenecostenafastfood"
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
            />
          </label>

          <label className="sm:col-span-2 block space-y-1">
            <span className="text-xs font-extrabold text-marron">Horarios de atención</span>
            <textarea
              rows={2}
              value={form.horarios}
              onChange={(e) => setForm({ ...form, horarios: e.target.value })}
              placeholder="Ej: Lunes a Domingo · 5:00 p. m. a 11:30 p. m."
              className="w-full p-3 rounded-2xl bg-crema border border-borde text-sm"
            />
          </label>

          <label className="sm:col-span-2 block space-y-1">
            <span className="text-xs font-extrabold text-marron">
              Mensaje cuando el local está cerrado
            </span>
            <input
              type="text"
              value={form.mensaje_cerrado}
              onChange={(e) =>
                setForm({ ...form, mensaje_cerrado: e.target.value })
              }
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {savedOk ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-verde-text">
              <CheckCircle size={18} weight="duotone" aria-hidden="true" />
              Cambios guardados en vivo
            </span>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </form>
    </StickerCard>
  );
}

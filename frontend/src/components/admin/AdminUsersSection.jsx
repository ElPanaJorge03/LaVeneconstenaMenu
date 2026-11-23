import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash, UserCircle } from "@phosphor-icons/react";
import { adminFullApi } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { StickerCard } from "../ui/StickerCard";

export function AdminUsersSection() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [rol, setRol] = useState("mesera");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: adminFullApi.listUsuarios,
  });

  const createMutation = useMutation({
    mutationFn: adminFullApi.createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      setUsername("");
      setFirstName("");
      setPassword("");
      setRol("mesera");
      setError("");
    },
    onError: (err) => setError(err.message || "No se pudo crear el usuario."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminFullApi.updateUsuario(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminFullApi.deleteUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] }),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setError("");
    createMutation.mutate({
      username: username.trim(),
      first_name: firstName.trim(),
      rol,
      password,
      is_active: true,
    });
  };

  const usuarios = usersQuery.data || [];

  return (
    <div className="space-y-5">
      <StickerCard elevation="sm" className="p-5 space-y-3">
        <h2 className="font-heading text-lg font-extrabold text-marron">
          Nuevo integrante del equipo
        </h2>
        {error ? (
          <p className="text-xs font-bold text-rojo-cta bg-rojo-soft px-3 py-2 rounded-xl">
            {error}
          </p>
        ) : null}
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
            className="min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
          />
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Nombre"
            className="min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
          />
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm font-bold"
          >
            <option value="mesera">Mesera</option>
            <option value="admin">Administrador</option>
          </select>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña (mín. 8)"
            className="min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
          />
          <Button type="submit" size="sm" disabled={createMutation.isPending}>
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Crear</span>
          </Button>
        </form>
      </StickerCard>

      <StickerCard elevation="md" className="divide-y divide-borde/70 overflow-hidden">
        {usuarios.map((u) => {
          const isSelf = u.id === currentUser?.id;
          return (
            <div
              key={u.id}
              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <UserCircle size={32} weight="duotone" className="text-marron-muted shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-heading font-extrabold text-base text-marron">
                    {u.username}
                  </span>
                  {u.first_name ? (
                    <span className="ml-2 text-xs font-bold text-marron-muted">
                      ({u.first_name})
                    </span>
                  ) : null}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={[
                        "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase",
                        u.rol === "admin"
                          ? "bg-rojo-soft text-rojo-cta"
                          : "bg-mostaza-soft text-mostaza-text",
                      ].join(" ")}
                    >
                      {u.rol}
                    </span>
                    {isSelf ? (
                      <span className="text-[11px] font-bold text-verde-text">
                        (Tu cuenta)
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {!isSelf ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateMutation.mutate({
                        id: u.id,
                        data: { rol: u.rol === "admin" ? "mesera" : "admin" },
                      })
                    }
                    className="min-h-[38px] px-3 rounded-full bg-crema-elevated text-xs font-extrabold text-marron hover:bg-mostaza-soft cursor-pointer"
                  >
                    Cambiar a {u.rol === "admin" ? "Mesera" : "Admin"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateMutation.mutate({
                        id: u.id,
                        data: { is_active: !u.is_active },
                      })
                    }
                    className={[
                      "min-h-[38px] px-3 rounded-full text-xs font-extrabold border cursor-pointer",
                      u.is_active
                        ? "bg-verde-soft text-verde-text border-verde/45"
                        : "bg-rojo-soft text-rojo-cta border-rojo/30",
                    ].join(" ")}
                  >
                    {u.is_active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar usuario "${u.username}"?`)) {
                        deleteMutation.mutate(u.id);
                      }
                    }}
                    aria-label={`Eliminar ${u.username}`}
                    className="min-h-[38px] min-w-[38px] rounded-full bg-crema-elevated text-marron-muted hover:bg-rojo-soft hover:text-rojo-cta flex items-center justify-center cursor-pointer"
                  >
                    <Trash size={16} weight="duotone" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </StickerCard>
    </div>
  );
}

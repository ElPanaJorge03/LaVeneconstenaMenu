import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import {
  ArrowClockwise,
  Broadcast,
  CheckCircle,
  CookingPot,
  CreditCard,
  MapPin,
  Minus,
  Money,
  Moped,
  Phone,
  Plus,
  QrCode,
  ShoppingBagOpen,
  SignOut,
  SpeakerHigh,
  SpeakerSlash,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { panelOrdersApi } from "../api/client";
import { BrandFooter } from "../components/layout/BrandFooter";
import { BrandHeader } from "../components/layout/BrandHeader";
import { Button } from "../components/ui/Button";
import { MascotState } from "../components/ui/MascotState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { StickerCard } from "../components/ui/StickerCard";
import { useAuth } from "../hooks/useAuth";
import { usePublicMenu } from "../hooks/useMenu";
import { formatCOP } from "../utils/formatCurrency";
import { playOrderChime } from "../utils/soundAlert";
import { createReconnectingSocket } from "../ws/socketClient";

const NEXT_STATE_ACTION = {
  nuevo: { next: "preparando", label: "Aceptar y preparar", variant: "mostaza" },
  preparando: { next: "listo", label: "Marcar listo", variant: "verde" },
  listo: { next: "entregado", label: "Marcar entregado", variant: "primary" },
};

const FILTER_TABS = [
  { id: "activos", label: "Activos" },
  { id: "nuevo", label: "Nuevos" },
  { id: "preparando", label: "Preparando" },
  { id: "listo", label: "Listos" },
  { id: "historial", label: "Entregados / Cancelados" },
];

function formatElapsed(isoDate) {
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000));
  if (diffMin < 1) return "Hace instantes";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `Hace ${h}h ${m}m`;
}

export function WaitressPanelPage() {
  const { isAuthenticated, isMeseraOrAdmin, token, user, logout } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundRef = useRef(false);
  soundRef.current = soundEnabled;

  const [wsStatus, setWsStatus] = useState("connecting");
  const [filter, setFilter] = useState("activos");
  const [manualOpen, setManualOpen] = useState(false);

  // Estado del modal de pedido manual
  const [manualMesaId, setManualMesaId] = useState("");
  const [manualMesaRef, setManualMesaRef] = useState("");
  const [manualCliente, setManualCliente] = useState("");
  const [manualNotas, setManualNotas] = useState("");
  const [manualPagado, setManualPagado] = useState(false);
  const [manualSearch, setManualSearch] = useState("");
  const [manualLines, setManualLines] = useState([]);
  const [manualError, setManualError] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["panel-pedidos"],
    queryFn: panelOrdersApi.list,
    enabled: isMeseraOrAdmin,
    refetchInterval: 30_000,
  });

  const mesasQuery = useQuery({
    queryKey: ["staff-mesas-activas"],
    queryFn: panelOrdersApi.listActiveMesas,
    enabled: isMeseraOrAdmin,
  });

  const menuQuery = usePublicMenu();

  // WebSocket tiempo real autenticado por JWT
  useEffect(() => {
    if (!isMeseraOrAdmin || !token || typeof window === "undefined" || !("WebSocket" in window)) {
      return undefined;
    }

    const client = createReconnectingSocket(
      `/ws/pedidos/panel/?token=${encodeURIComponent(token)}`,
      {
        onStatusChange: (status) => {
          setWsStatus(status);
          if (status === "connected") {
            queryClient.invalidateQueries({ queryKey: ["panel-pedidos"] });
          }
        },
        onMessage: (msg) => {
          if (msg?.type === "pedido_creado" && msg.pedido) {
            if (soundRef.current) {
              playOrderChime();
            }
            queryClient.setQueryData(["panel-pedidos"], (old = []) => {
              const filtered = old.filter((p) => p.id !== msg.pedido.id);
              return [msg.pedido, ...filtered];
            });
          } else if (msg?.type === "pedido_actualizado" && msg.pedido) {
            queryClient.setQueryData(["panel-pedidos"], (old = []) => {
              const exists = old.some((p) => p.id === msg.pedido.id);
              return exists
                ? old.map((p) => (p.id === msg.pedido.id ? msg.pedido : p))
                : [msg.pedido, ...old];
            });
          }
        },
      }
    );

    return () => client.close();
  }, [isMeseraOrAdmin, token, queryClient]);

  const changeEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) => panelOrdersApi.changeEstado(id, estado),
    onSuccess: (updated) => {
      queryClient.setQueryData(["panel-pedidos"], (old = []) =>
        old.map((p) => (p.id === updated.id ? updated : p))
      );
    },
  });

  const cashMutation = useMutation({
    mutationFn: (id) => panelOrdersApi.marcarEfectivo(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["panel-pedidos"], (old = []) =>
        old.map((p) => (p.id === updated.id ? updated : p))
      );
    },
  });

  const manualMutation = useMutation({
    mutationFn: panelOrdersApi.createManual,
    onSuccess: (created) => {
      queryClient.setQueryData(["panel-pedidos"], (old = []) => {
        const filtered = old.filter((p) => p.id !== created.id);
        return [created, ...filtered];
      });
      setManualOpen(false);
      setManualLines([]);
      setManualCliente("");
      setManualNotas("");
      setManualMesaRef("");
      setManualPagado(false);
      setManualError("");
    },
  });

  const pedidos = ordersQuery.data || [];
  const mesasActivas = mesasQuery.data || [];

  const counts = useMemo(
    () => ({
      activos: pedidos.filter((p) => ["nuevo", "preparando", "listo"].includes(p.estado)).length,
      nuevo: pedidos.filter((p) => p.estado === "nuevo").length,
      preparando: pedidos.filter((p) => p.estado === "preparando").length,
      listo: pedidos.filter((p) => p.estado === "listo").length,
      historial: pedidos.filter((p) => ["entregado", "cancelado"].includes(p.estado)).length,
    }),
    [pedidos]
  );

  const visiblePedidos = useMemo(() => {
    if (filter === "activos") {
      return pedidos.filter((p) => ["nuevo", "preparando", "listo"].includes(p.estado));
    }
    if (filter === "historial") {
      return pedidos.filter((p) => ["entregado", "cancelado"].includes(p.estado));
    }
    return pedidos.filter((p) => p.estado === filter);
  }, [pedidos, filter]);

  const flatMenuProducts = useMemo(() => {
    const q = manualSearch.trim().toLowerCase();
    const list = [];
    for (const cat of menuQuery.data?.categorias || []) {
      for (const p of cat.productos || []) {
        if (p.precio_normal <= 0) continue;
        if (
          !q ||
          p.nombre.toLowerCase().includes(q) ||
          cat.nombre.toLowerCase().includes(q)
        ) {
          list.push({ ...p, categoriaNombre: cat.nombre });
        }
      }
    }
    return list.slice(0, 30);
  }, [menuQuery.data, manualSearch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isMeseraOrAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-crema">
        <BrandHeader />
        <main className="flex-1 max-w-lg mx-auto px-4 py-12">
          <MascotState
            variant="error"
            title="Acceso restringido"
            description="Necesitas rol de mesera o administrador para entrar al panel de pedidos."
            action={<Button size="sm" onClick={logout}>Cambiar cuenta</Button>}
          />
        </main>
        <BrandFooter />
      </div>
    );
  }

  const toggleSound = () => {
    if (!soundEnabled) {
      playOrderChime();
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  const addManualProduct = (prod, tamano = "normal") => {
    const unit = tamano === "mini" && prod.tiene_mini ? prod.precio_mini : prod.precio_normal;
    const key = `${prod.id}:${tamano}`;
    setManualLines((prev) => {
      const idx = prev.findIndex((l) => l.key === key);
      if (idx >= 0) {
        return prev.map((l, i) => (i === idx ? { ...l, cantidad: l.cantidad + 1 } : l));
      }
      return [
        ...prev,
        { key, producto_id: prod.id, nombre: prod.nombre, tamano, unit, cantidad: 1 },
      ];
    });
  };

  const updateManualQty = (key, delta) => {
    setManualLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0)
    );
  };

  const manualTotal = manualLines.reduce((sum, l) => sum + l.unit * l.cantidad, 0);

  const submitManualOrder = async (e) => {
    e.preventDefault();
    setManualError("");
    if (manualLines.length === 0) {
      setManualError("Agrega al menos un plato.");
      return;
    }
    if (!manualMesaId && !manualMesaRef.trim()) {
      setManualError("Selecciona una mesa o escribe el número de mesa.");
      return;
    }
    try {
      await manualMutation.mutateAsync({
        tipo: "mesa",
        mesa_id: manualMesaId ? Number(manualMesaId) : null,
        mesa_referencia: manualMesaId ? "" : manualMesaRef.trim(),
        cliente_nombre: manualCliente.trim() || "Cliente en mesa",
        notas: manualNotas.trim(),
        metodo_pago: "efectivo",
        marcar_efectivo_pagado: manualPagado,
        items: manualLines.map((l) => ({
          producto_id: l.producto_id,
          tamano: l.tamano,
          cantidad: l.cantidad,
        })),
      });
    } catch (err) {
      setManualError(err.message || "No se pudo crear el pedido manual.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-crema">
      <BrandHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* BARRA SUPERIOR OPERATIVA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-marron">
                Panel de Mesera
              </h1>
              <span
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border",
                  wsStatus === "connected"
                    ? "bg-verde-soft text-verde-text border-verde/45"
                    : "bg-mostaza-soft text-mostaza-text border-mostaza/60",
                ].join(" ")}
              >
                <Broadcast size={14} weight="duotone" aria-hidden="true" />
                {wsStatus === "connected" ? "En vivo" : "Reconectando..."}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-marron-muted">
              Conectada como <strong>{user?.username}</strong> · Los pedidos
              nuevos entran automáticamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* BOTÓN EXPLÍCITO DE ALERTA SONORA (REGLA CRÍTICA #5) */}
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundEnabled}
              className={[
                "min-h-[46px] px-4 rounded-full border-2 font-heading font-bold text-sm inline-flex items-center gap-2 transition-all cursor-pointer",
                soundEnabled
                  ? "bg-verde-soft text-verde-text border-verde shadow-sm"
                  : "bg-mostaza-soft text-marron border-mostaza hover:bg-mostaza",
              ].join(" ")}
            >
              {soundEnabled ? (
                <>
                  <SpeakerHigh size={19} weight="duotone" aria-hidden="true" />
                  <span>Sonido activo</span>
                </>
              ) : (
                <>
                  <SpeakerSlash size={19} weight="duotone" aria-hidden="true" />
                  <span>Activar sonido</span>
                </>
              )}
            </button>

            <Button size="sm" onClick={() => setManualOpen(true)}>
              <Plus size={18} weight="bold" aria-hidden="true" />
              <span>Pedido manual</span>
            </Button>

            <button
              type="button"
              onClick={() => ordersQuery.refetch()}
              aria-label="Actualizar pedidos"
              className="min-h-[44px] min-w-[44px] rounded-full bg-blanco border border-borde text-marron flex items-center justify-center hover:border-rojo cursor-pointer"
            >
              <ArrowClockwise
                size={18}
                weight="bold"
                className={ordersQuery.isFetching ? "animate-spin" : ""}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={logout}
              aria-label="Cerrar sesión"
              className="min-h-[44px] min-w-[44px] rounded-full bg-blanco border border-borde text-marron-muted flex items-center justify-center hover:text-rojo-cta cursor-pointer"
            >
              <SignOut size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* FILTROS CON CONTEOS */}
        <div
          role="tablist"
          aria-label="Filtrar pedidos por estado"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {FILTER_TABS.map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(t.id)}
                className={[
                  "shrink-0 min-h-[44px] px-4 rounded-full font-heading font-bold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer",
                  active
                    ? "bg-rojo-cta text-blanco shadow-cta"
                    : "bg-blanco text-marron border border-borde hover:border-rojo",
                ].join(" ")}
              >
                <span>{t.label}</span>
                <span
                  className={[
                    "px-2 py-0.5 rounded-full text-xs tabular-price",
                    active
                      ? "bg-blanco/20 text-blanco"
                      : "bg-crema-elevated text-marron-muted",
                  ].join(" ")}
                >
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* GRILLA OPERATIVA DE PEDIDOS */}
        {ordersQuery.isLoading ? (
          <MascotState
            variant="cooking"
            title="Cargando pedidos en vivo..."
            description="Conectando con cocina."
          />
        ) : visiblePedidos.length === 0 ? (
          <MascotState
            variant="empty"
            title="Sin pedidos en esta bandeja"
            description="Cuando entre un nuevo pedido aparecerá aquí al instante."
            action={
              <Button size="sm" onClick={() => setManualOpen(true)}>
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Crear pedido manual</span>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visiblePedidos.map((pedido) => {
              const nextAction = NEXT_STATE_ACTION[pedido.estado];
              const isCashPending =
                pedido.pago?.metodo === "efectivo" &&
                pedido.pago?.estado !== "pagado" &&
                pedido.estado !== "cancelado";

              return (
                <StickerCard
                  key={pedido.id}
                  as="article"
                  elevation="md"
                  className={[
                    "p-4 sm:p-5 flex flex-col justify-between gap-4 border-2",
                    pedido.estado === "nuevo"
                      ? "border-rojo/60"
                      : pedido.estado === "preparando"
                        ? "border-mostaza"
                        : pedido.estado === "listo"
                          ? "border-verde"
                          : "border-borde/80",
                  ].join(" ")}
                >
                  <div className="space-y-3">
                    {/* CABECERA TARJETA */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-heading text-lg font-extrabold text-marron tracking-wide block leading-none">
                          {pedido.codigo}
                        </span>
                        <span className="text-xs font-bold text-marron-muted">
                          {formatElapsed(pedido.creado_en)}
                        </span>
                      </div>
                      <StatusBadge status={pedido.estado} size="sm" />
                    </div>

                    {/* CLIENTE + TIPO */}
                    <div className="rounded-2xl bg-crema px-3.5 py-2.5 border border-borde/70 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading font-extrabold text-sm text-marron">
                          {pedido.cliente_nombre}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blanco border border-borde text-xs font-extrabold text-marron">
                          {pedido.tipo === "mesa" ? (
                            <QrCode size={13} weight="duotone" aria-hidden="true" />
                          ) : pedido.tipo === "domicilio" ? (
                            <Moped size={13} weight="duotone" aria-hidden="true" />
                          ) : (
                            <ShoppingBagOpen size={13} weight="duotone" aria-hidden="true" />
                          )}
                          {pedido.mesa_display ||
                            (pedido.tipo === "domicilio" ? "Domicilio" : "Recoger")}
                        </span>
                      </div>

                      {pedido.telefono ? (
                        <p className="text-xs text-marron-muted flex items-center gap-1.5">
                          <Phone size={13} weight="duotone" aria-hidden="true" />
                          <span>{pedido.telefono}</span>
                        </p>
                      ) : null}

                      {pedido.direccion ? (
                        <p className="text-xs font-bold text-marron flex items-start gap-1.5">
                          <MapPin size={13} weight="duotone" className="text-rojo shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{pedido.direccion}</span>
                        </p>
                      ) : null}
                    </div>

                    {/* ÍTEMS */}
                    <ul className="divide-y divide-borde/60 text-sm">
                      {pedido.items.map((item) => (
                        <li key={item.id} className="py-2 first:pt-0 space-y-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-bold text-marron">
                              <strong className="text-rojo-cta">{item.cantidad}×</strong>{" "}
                              {item.nombre_producto}{" "}
                              {item.tamano === "mini" ? (
                                <span className="px-1.5 py-0.5 rounded-full bg-verde-soft text-verde-text text-[10px] font-extrabold uppercase">
                                  MINI
                                </span>
                              ) : null}
                            </span>
                            <span className="font-heading font-bold text-xs text-marron-muted tabular-price shrink-0">
                              {formatCOP(item.subtotal)}
                            </span>
                          </div>

                          {item.adicionales_snapshot?.length > 0 ? (
                            <p className="text-xs text-mostaza-text font-bold">
                              +{" "}
                              {item.adicionales_snapshot
                                .map((a) => a.nombre)
                                .join(", ")}
                            </p>
                          ) : null}

                          {item.notas ? (
                            <p className="text-xs font-bold bg-mostaza-soft/80 text-marron px-2.5 py-1 rounded-xl">
                              Nota: {item.notas}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>

                    {pedido.notas ? (
                      <div className="rounded-xl bg-mostaza-soft text-marron px-3 py-2 text-xs font-bold">
                        Nota general: {pedido.notas}
                      </div>
                    ) : null}
                  </div>

                  {/* TOTAL + PAGO + ACCIONES DE 1 TOQUE */}
                  <div className="space-y-2.5 pt-3 border-t border-borde">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading text-xl font-extrabold text-marron tabular-price">
                        {formatCOP(pedido.total)}
                      </span>

                      {pedido.pago ? (
                        <span
                          className={[
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border",
                            pedido.pago.estado === "pagado"
                              ? "bg-verde-soft text-verde-text border-verde/45"
                              : "bg-mostaza-soft text-mostaza-text border-mostaza/60",
                          ].join(" ")}
                        >
                          {pedido.pago.metodo === "bold" ? (
                            <CreditCard size={13} weight="duotone" aria-hidden="true" />
                          ) : (
                            <Money size={13} weight="duotone" aria-hidden="true" />
                          )}
                          {pedido.pago.metodo === "bold" ? "Bold" : "Efectivo"} ·{" "}
                          {pedido.pago.estado === "pagado" ? "Pagado" : "Pendiente"}
                        </span>
                      ) : null}
                    </div>

                    {isCashPending ? (
                      <Button
                        variant="verde"
                        size="sm"
                        className="w-full"
                        disabled={cashMutation.isPending}
                        onClick={() => cashMutation.mutate(pedido.id)}
                      >
                        <Money size={17} weight="duotone" aria-hidden="true" />
                        <span>Confirmar efectivo recibido</span>
                      </Button>
                    ) : null}

                    {nextAction ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant={nextAction.variant}
                          size="md"
                          className="flex-1"
                          disabled={changeEstadoMutation.isPending}
                          onClick={() =>
                            changeEstadoMutation.mutate({
                              id: pedido.id,
                              estado: nextAction.next,
                            })
                          }
                        >
                          {nextAction.next === "preparando" ? (
                            <CookingPot size={18} weight="duotone" aria-hidden="true" />
                          ) : (
                            <CheckCircle size={18} weight="duotone" aria-hidden="true" />
                          )}
                          <span>{nextAction.label}</span>
                        </Button>

                        <button
                          type="button"
                          aria-label={`Cancelar pedido ${pedido.codigo}`}
                          onClick={() => {
                            if (window.confirm(`¿Cancelar pedido ${pedido.codigo}?`)) {
                              changeEstadoMutation.mutate({
                                id: pedido.id,
                                estado: "cancelado",
                              });
                            }
                          }}
                          className="min-h-[48px] min-w-[48px] rounded-full bg-crema-elevated text-marron-muted hover:bg-rojo-soft hover:text-rojo-cta flex items-center justify-center cursor-pointer"
                        >
                          <XCircle size={20} weight="duotone" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </StickerCard>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL PEDIDO MANUAL EN MESA */}
      {manualOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-negro/55 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-order-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setManualOpen(false);
          }}
        >
          <form
            onSubmit={submitManualOrder}
            className="w-full sm:max-w-2xl max-h-[92vh] bg-crema rounded-t-3xl sm:rounded-3xl border-t-4 sm:border-4 border-blanco shadow-sticker-lg flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 bg-blanco border-b border-borde flex items-center justify-between">
              <div>
                <h2
                  id="manual-order-title"
                  className="font-heading text-xl font-extrabold text-marron"
                >
                  Nuevo pedido manual (Mesa)
                </h2>
                <p className="text-xs text-marron-muted">
                  Toma el pedido rápido para clientes presenciales
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                aria-label="Cerrar"
                className="w-10 h-10 rounded-full bg-crema-elevated flex items-center justify-center cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {manualError ? (
                <div className="rounded-2xl bg-rojo-soft px-4 py-2.5 text-sm font-bold text-rojo-cta">
                  {manualError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-extrabold text-marron">Mesa</span>
                  {mesasActivas.length > 0 ? (
                    <select
                      value={manualMesaId}
                      onChange={(e) => setManualMesaId(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 rounded-2xl bg-blanco border border-borde text-sm font-bold"
                    >
                      <option value="">Selecciona una mesa...</option>
                      {mesasActivas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre || `Mesa ${m.numero}`} (#{m.numero})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={manualMesaRef}
                      onChange={(e) => setManualMesaRef(e.target.value)}
                      placeholder="Número de mesa (ej: 4)"
                      className="w-full min-h-[44px] px-3.5 rounded-2xl bg-blanco border border-borde text-sm"
                    />
                  )}
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-extrabold text-marron">
                    Nombre cliente (opcional)
                  </span>
                  <input
                    type="text"
                    value={manualCliente}
                    onChange={(e) => setManualCliente(e.target.value)}
                    placeholder="Cliente en mesa"
                    className="w-full min-h-[44px] px-3.5 rounded-2xl bg-blanco border border-borde text-sm"
                  />
                </label>
              </div>

              {/* BUSCADOR RÁPIDO DE PLATOS */}
              <div className="space-y-2">
                <input
                  type="search"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Buscar plato para agregar (ej: suizo, salchipapa, carne)..."
                  className="w-full min-h-[44px] px-4 rounded-full bg-blanco border border-borde text-sm"
                />
                <div className="max-h-48 overflow-y-auto rounded-2xl bg-blanco border border-borde divide-y divide-borde/60">
                  {flatMenuProducts.map((p) => (
                    <div
                      key={p.id}
                      className="px-3.5 py-2 flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-marron block truncate">
                          {p.nombre}
                        </span>
                        <span className="text-[11px] text-marron-muted">
                          {p.categoriaNombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => addManualProduct(p, "normal")}
                          className="min-h-[36px] px-3 rounded-full bg-rojo-soft text-rojo-cta font-extrabold text-xs hover:bg-rojo-cta hover:text-blanco cursor-pointer tabular-price"
                        >
                          +{formatCOP(p.precio_normal)}
                        </button>
                        {p.tiene_mini ? (
                          <button
                            type="button"
                            onClick={() => addManualProduct(p, "mini")}
                            className="min-h-[36px] px-2.5 rounded-full bg-verde-soft text-verde-text font-extrabold text-xs hover:bg-verde-text hover:text-blanco cursor-pointer tabular-price"
                          >
                            MINI {formatCOP(p.precio_mini)}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESUMEN SELECCIONADO */}
              {manualLines.length > 0 ? (
                <div className="rounded-2xl bg-blanco border border-borde p-3.5 space-y-2">
                  <span className="text-xs font-extrabold uppercase text-marron-muted">
                    Platos agregados
                  </span>
                  {manualLines.map((l) => (
                    <div
                      key={l.key}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="font-bold text-marron">
                        {l.nombre}{" "}
                        {l.tamano === "mini" ? (
                          <span className="text-verde-text text-xs">(MINI)</span>
                        ) : null}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tabular-price">
                          {formatCOP(l.unit * l.cantidad)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateManualQty(l.key, -1)}
                          className="w-7 h-7 rounded-full bg-crema-elevated flex items-center justify-center cursor-pointer"
                        >
                          <Minus size={13} weight="bold" />
                        </button>
                        <span className="w-5 text-center font-extrabold tabular-price">
                          {l.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateManualQty(l.key, 1)}
                          className="w-7 h-7 rounded-full bg-rojo-cta text-blanco flex items-center justify-center cursor-pointer"
                        >
                          <Plus size={13} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <input
                  type="text"
                  value={manualNotas}
                  onChange={(e) => setManualNotas(e.target.value)}
                  placeholder="Notas de cocina (opcional)"
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-blanco border border-borde text-sm"
                />
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manualPagado}
                    onChange={(e) => setManualPagado(e.target.checked)}
                    className="w-5 h-5 accent-verde-text"
                  />
                  <span className="text-sm font-bold text-marron">
                    Ya pagó en efectivo
                  </span>
                </label>
              </div>
            </div>

            <div className="px-5 py-4 bg-blanco border-t border-borde flex items-center justify-between gap-3 safe-bottom">
              <div>
                <span className="block text-[11px] font-bold text-marron-muted">
                  Total manual
                </span>
                <span className="font-heading text-2xl font-extrabold text-marron tabular-price">
                  {formatCOP(manualTotal)}
                </span>
              </div>
              <Button type="submit" disabled={manualMutation.isPending}>
                {manualMutation.isPending ? "Creando..." : "Crear pedido"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <BrandFooter />
    </div>
  );
}

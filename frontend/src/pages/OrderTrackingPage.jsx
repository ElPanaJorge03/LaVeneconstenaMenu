import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowClockwise,
  BellRinging,
  Broadcast,
  Check,
  CheckCircle,
  CookingPot,
  Copy,
  CreditCard,
  MagnifyingGlass,
  Money,
  Moped,
  Package,
  QrCode,
  ShoppingBagOpen,
} from "@phosphor-icons/react";
import { initBoldPayment } from "../api/client";
import { BrandFooter } from "../components/layout/BrandFooter";
import { BrandHeader } from "../components/layout/BrandHeader";
import { Button } from "../components/ui/Button";
import { MascotState } from "../components/ui/MascotState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { StickerCard } from "../components/ui/StickerCard";
import { getLastOrderCode, useOrderTracking } from "../hooks/useOrders";
import { formatCOP } from "../utils/formatCurrency";
import { createReconnectingSocket } from "../ws/socketClient";

const TIMELINE_STEPS = [
  { id: "nuevo", label: "Recibido", icon: BellRinging },
  { id: "preparando", label: "En cocina", icon: CookingPot },
  { id: "listo", label: "¡Listo!", icon: CheckCircle },
  { id: "entregado", label: "Entregado", icon: Package },
];

const STATE_COPY = {
  nuevo: {
    mascot: "confirmed",
    title: "¡Recibimos tu pedido!",
    subtitle: "Ya está en fila para pasar a la plancha. Guarda tu código.",
  },
  preparando: {
    mascot: "cooking",
    title: "Cocinando a fuego alegre",
    subtitle: "Estamos preparando todo fresquito y al instante.",
  },
  listo: {
    mascot: "confirmed",
    title: "¡Tu pedido ya está listo!",
    subtitle: "Calientico y listo para entregar o recoger.",
  },
  entregado: {
    mascot: "confirmed",
    title: "¡Buen provecho!",
    subtitle: "Gracias por pedir en La VeneConsteña.",
  },
  cancelado: {
    mascot: "error",
    title: "Este pedido fue cancelado",
    subtitle: "Si crees que hubo un error, contáctanos o arma un nuevo pedido.",
  },
};

const TIPO_META = {
  mesa: { label: "En mesa", icon: QrCode },
  recoger: { label: "Para recoger", icon: ShoppingBagOpen },
  domicilio: { label: "Domicilio", icon: Moped },
};

function loadBoldCheckoutScript() {
  return new Promise((resolve, reject) => {
    if (window.BoldCheckout) {
      resolve(window.BoldCheckout);
      return;
    }
    const existing = document.querySelector('script[src*="boldPaymentButton.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.BoldCheckout));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.bold.co/library/boldPaymentButton.js";
    script.async = true;
    script.onload = () => resolve(window.BoldCheckout);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function OrderTrackingPage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lastCode = getLastOrderCode();

  const [searchCode, setSearchCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [wsStatus, setWsStatus] = useState("idle");
  const [boldLoading, setBoldLoading] = useState(false);
  const [boldMessage, setBoldMessage] = useState("");

  const { data: pedido, isLoading, isError, refetch, isFetching } =
    useOrderTracking(codigo);

  // WebSocket en tiempo real para el pedido del cliente
  useEffect(() => {
    if (!codigo || typeof window === "undefined" || !("WebSocket" in window)) {
      return undefined;
    }
    const client = createReconnectingSocket(
      `/ws/pedidos/seguimiento/${encodeURIComponent(codigo)}/`,
      {
        onStatusChange: (status) => {
          setWsStatus(status);
          if (status === "connected") {
            refetch();
          }
        },
        onMessage: (msg) => {
          if (msg?.pedido) {
            queryClient.setQueryData(["order-tracking", codigo], msg.pedido);
          }
        },
      }
    );

    return () => client.close();
  }, [codigo, queryClient, refetch]);

  const handleLookup = (e) => {
    e.preventDefault();
    const cleaned = searchCode.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/pedido/${cleaned}`);
  };

  const copyCode = async () => {
    if (!pedido?.codigo) return;
    try {
      await navigator.clipboard.writeText(pedido.codigo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleStartBoldPayment = async () => {
    if (!pedido?.codigo) return;
    setBoldMessage("");
    setBoldLoading(true);
    try {
      const cfg = await initBoldPayment(pedido.codigo);
      if (!cfg.configured) {
        setBoldMessage(
          "La integración oficial de Bold está lista en el backend. Agrega BOLD_API_KEY y BOLD_SECRET_KEY en tus variables de entorno para abrir la pasarela real."
        );
        return;
      }
      const BoldCheckout = await loadBoldCheckoutScript();
      const checkout = new BoldCheckout({
        orderId: cfg.orderId,
        currency: cfg.currency,
        amount: String(cfg.amount),
        apiKey: cfg.apiKey,
        integritySignature: cfg.integritySignature,
        description: cfg.description,
        redirectionUrl: cfg.redirectionUrl,
      });
      checkout.open();
    } catch (err) {
      setBoldMessage(err.message || "No se pudo iniciar el pago con Bold.");
    } finally {
      setBoldLoading(false);
    }
  };

  if (!codigo) {
    return (
      <div className="min-h-screen flex flex-col bg-crema">
        <BrandHeader />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-10 flex flex-col justify-center">
          <StickerCard elevation="lg" className="p-6 sm:p-8 space-y-5 text-center">
            <img
              src="/assets/brand/mascot-cooking.png"
              alt="Chef de La VeneConsteña"
              className="w-28 h-28 mx-auto object-contain sticker-drop select-none"
            />
            <div className="space-y-1">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-marron">
                Seguir mi pedido
              </h1>
              <p className="text-sm text-marron-muted">
                Ingresa el código que recibiste al confirmar tu pedido (ej:{" "}
                <strong className="text-marron">VC-7K9M-2P4X</strong>).
              </p>
            </div>

            <form onSubmit={handleLookup} className="space-y-3">
              <div className="relative">
                <MagnifyingGlass
                  size={18}
                  weight="bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-marron-muted"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Código de pedido (VC-...)"
                  aria-label="Código de pedido"
                  className="w-full min-h-[48px] pl-11 pr-4 rounded-full bg-crema border border-borde text-base font-bold uppercase tracking-wider text-marron focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                />
              </div>
              <Button type="submit" className="w-full">
                Buscar mi pedido
              </Button>
            </form>

            {lastCode ? (
              <div className="pt-2 border-t border-borde/70">
                <p className="text-xs font-bold text-marron-muted mb-2">
                  Último pedido desde este dispositivo:
                </p>
                <Link
                  to={`/pedido/${lastCode}`}
                  className="inline-flex items-center gap-2 min-h-[42px] px-4 rounded-full bg-mostaza-soft border border-mostaza/65 text-marron font-heading font-extrabold text-sm hover:bg-mostaza transition-colors"
                >
                  <span>Ver pedido {lastCode}</span>
                </Link>
              </div>
            ) : null}
          </StickerCard>
        </main>
        <BrandFooter />
      </div>
    );
  }

  const copy = STATE_COPY[pedido?.estado] || STATE_COPY.nuevo;
  const activeStepIdx = TIMELINE_STEPS.findIndex((s) => s.id === pedido?.estado);
  const TipoIcon = TIPO_META[pedido?.tipo]?.icon || ShoppingBagOpen;
  const showBoldAction =
    pedido?.pago?.metodo === "bold" &&
    pedido?.pago?.estado !== "pagado" &&
    pedido?.estado !== "cancelado";

  return (
    <div className="min-h-screen flex flex-col bg-crema">
      <BrandHeader />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-marron hover:text-rojo-cta transition-colors"
          >
            <ArrowLeft size={16} weight="bold" aria-hidden="true" />
            <span>Volver a la carta</span>
          </Link>

          <div className="flex items-center gap-2.5">
            {wsStatus === "connected" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-verde-soft text-verde-text text-[11px] font-extrabold">
                <Broadcast size={13} weight="duotone" aria-hidden="true" />
                En vivo
              </span>
            ) : null}
            <Link
              to="/pedido"
              className="text-xs font-bold text-marron-muted hover:text-marron underline"
            >
              Otro código
            </Link>
          </div>
        </div>

        {isLoading ? (
          <MascotState
            variant="cooking"
            title="Consultando tu pedido..."
            description={`Buscando el estado actualizado del código ${codigo}.`}
          />
        ) : isError || !pedido ? (
          <MascotState
            variant="error"
            title="No encontramos ese código"
            description="Verifica que hayas escrito bien el código de seguimiento e intenta de nuevo."
            action={
              <Link
                to="/pedido"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-rojo-cta text-blanco font-heading font-bold text-sm"
              >
                Intentar con otro código
              </Link>
            }
          />
        ) : (
          <>
            <StickerCard elevation="lg" className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <img
                  src={`/assets/brand/mascot-${copy.mascot}.png`}
                  alt={copy.title}
                  className="w-28 h-28 object-contain sticker-drop shrink-0 select-none"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <StatusBadge status={pedido.estado} />
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-crema-elevated border border-borde text-xs font-extrabold text-marron">
                      <TipoIcon size={14} weight="duotone" aria-hidden="true" />
                      {pedido.mesa_display || TIPO_META[pedido.tipo]?.label}
                    </span>
                  </div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-marron leading-tight">
                    {copy.title}
                  </h1>
                  <p className="text-sm text-marron-muted">
                    Hola <strong>{pedido.cliente_primer_nombre}</strong> ·{" "}
                    {copy.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-crema border border-borde px-4 py-3">
                <div>
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-marron-muted">
                    Código de seguimiento
                  </span>
                  <span className="font-heading text-xl font-extrabold text-rojo-cta tracking-wider">
                    {pedido.codigo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyCode}
                    className="min-h-[40px] px-3.5 rounded-full bg-blanco border border-borde text-xs font-extrabold text-marron hover:border-rojo inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={15} weight="bold" className="text-verde-text" aria-hidden="true" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} weight="duotone" aria-hidden="true" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="min-h-[40px] px-3.5 rounded-full bg-blanco border border-borde text-xs font-extrabold text-marron hover:border-rojo inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <ArrowClockwise
                      size={15}
                      weight="bold"
                      className={isFetching ? "animate-spin" : ""}
                      aria-hidden="true"
                    />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>

              {pedido.estado !== "cancelado" ? (
                <ol
                  aria-label="Progreso del pedido"
                  className="grid grid-cols-4 gap-2 pt-1"
                >
                  {TIMELINE_STEPS.map(({ id, label, icon: StepIcon }, idx) => {
                    const reached = activeStepIdx >= idx;
                    const current = activeStepIdx === idx;
                    return (
                      <li
                        key={id}
                        className="flex flex-col items-center text-center gap-1.5"
                      >
                        <div
                          className={[
                            "w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors",
                            current
                              ? "bg-rojo-cta border-rojo-cta text-blanco shadow-cta"
                              : reached
                                ? "bg-verde-soft border-verde text-verde-text"
                                : "bg-crema-elevated border-borde text-marron-muted/60",
                          ].join(" ")}
                        >
                          <StepIcon size={20} weight="duotone" aria-hidden="true" />
                        </div>
                        <span
                          className={[
                            "text-[11px] sm:text-xs font-extrabold leading-tight",
                            reached ? "text-marron" : "text-marron-muted/60",
                          ].join(" ")}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </StickerCard>

            {/* BLOQUE DE PAGO ONLINE BOLD */}
            {showBoldAction ? (
              <StickerCard
                elevation="md"
                className="p-5 bg-mostaza-soft/55 border-mostaza/70 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-extrabold text-marron inline-flex items-center gap-1.5">
                      <CreditCard size={20} weight="duotone" className="text-mostaza-text" aria-hidden="true" />
                      <span>Completa tu pago con Bold</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-marron-muted">
                      El estado de pago se confirma automáticamente al aprobarse
                      en Bold.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleStartBoldPayment}
                    disabled={boldLoading}
                  >
                    {boldLoading
                      ? "Preparando Bold..."
                      : `Pagar ${formatCOP(pedido.total)}`}
                  </Button>
                </div>

                {boldMessage ? (
                  <p className="text-xs font-bold text-marron bg-blanco rounded-2xl px-3.5 py-2.5 border border-borde">
                    {boldMessage}
                  </p>
                ) : null}
              </StickerCard>
            ) : null}

            <StickerCard elevation="md" className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-borde/70 pb-3">
                <h2 className="font-heading text-lg font-extrabold text-marron">
                  Resumen de tus platos
                </h2>
                {pedido.pago ? (
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border",
                      pedido.pago.estado === "pagado"
                        ? "bg-verde-soft text-verde-text border-verde/45"
                        : "bg-mostaza-soft text-mostaza-text border-mostaza/55",
                    ].join(" ")}
                  >
                    {pedido.pago.metodo === "bold" ? (
                      <CreditCard size={14} weight="duotone" aria-hidden="true" />
                    ) : (
                      <Money size={14} weight="duotone" aria-hidden="true" />
                    )}
                    <span>
                      {pedido.pago.metodo === "bold" ? "Bold" : "Efectivo"} ·{" "}
                      {pedido.pago.estado === "pagado" ? "Pagado" : "Pendiente"}
                    </span>
                  </span>
                ) : null}
              </div>

              <ul className="divide-y divide-borde/60">
                {pedido.items.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-heading font-extrabold text-base text-marron">
                          {item.cantidad}× {item.nombre_producto}
                        </span>
                        <span
                          className={[
                            "ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                            item.tamano === "mini"
                              ? "bg-verde-soft text-verde-text"
                              : "bg-crema-elevated text-marron-muted",
                          ].join(" ")}
                        >
                          {item.tamano === "mini" ? "MINI" : "Normal"}
                        </span>
                      </div>
                      <span className="font-heading font-extrabold text-base text-marron tabular-price shrink-0">
                        {formatCOP(item.subtotal)}
                      </span>
                    </div>

                    {item.adicionales_snapshot?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.adicionales_snapshot.map((ex) => (
                          <span
                            key={ex.id}
                            className="px-2 py-0.5 rounded-full bg-mostaza-soft text-mostaza-text text-[11px] font-bold"
                          >
                            + {ex.nombre} ({formatCOP(ex.precio)})
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {item.notas ? (
                      <p className="text-xs italic text-marron-muted">
                        Nota: “{item.notas}”
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>

              {pedido.notas ? (
                <div className="rounded-2xl bg-crema px-3.5 py-2.5 text-xs text-marron-muted border border-borde/70">
                  <strong>Notas generales:</strong> {pedido.notas}
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-3 border-t border-borde">
                <span className="font-bold text-marron-muted">Total confirmado</span>
                <span className="font-heading text-2xl font-extrabold text-rojo-cta tabular-price">
                  {formatCOP(pedido.total)}
                </span>
              </div>
            </StickerCard>
          </>
        )}
      </main>

      <BrandFooter />
    </div>
  );
}

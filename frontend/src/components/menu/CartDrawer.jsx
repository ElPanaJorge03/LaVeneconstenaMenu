import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Minus,
  Money,
  Moped,
  Plus,
  QrCode,
  ShoppingBagOpen,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useCart } from "../../hooks/useCart";
import { useCreateOrder } from "../../hooks/useOrders";
import { formatCOP } from "../../utils/formatCurrency";
import { Button } from "../ui/Button";
import { MascotState } from "../ui/MascotState";
import { StickerCard } from "../ui/StickerCard";

const ORDER_TYPES = [
  {
    id: "mesa",
    label: "En mesa",
    hint: "En el local",
    icon: QrCode,
  },
  {
    id: "recoger",
    label: "Recoger",
    hint: "Paso por él",
    icon: ShoppingBagOpen,
  },
  {
    id: "domicilio",
    label: "Domicilio",
    hint: "Sin recargo",
    icon: Moped,
  },
];

export function CartDrawer({
  open,
  onClose,
  localAbierto = true,
  mensajeCerrado = "",
  mesaPreasignada = null,
}) {
  const navigate = useNavigate();
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const createOrder = useCreateOrder();

  const [step, setStep] = useState("cart"); // cart | checkout
  const [tipo, setTipo] = useState(mesaPreasignada ? "mesa" : "recoger");
  const [mesaRef, setMesaRef] = useState(mesaPreasignada ? String(mesaPreasignada) : "");
  const [clienteNombre, setClienteNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("cart");
      setSubmitError("");
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const validateCheckout = () => {
    const next = {};
    if (!clienteNombre.trim()) {
      next.clienteNombre = "Escribe tu nombre para llamar tu pedido.";
    }
    if (tipo === "mesa" && !mesaPreasignada && !mesaRef.trim()) {
      next.mesaRef = "Indica en qué número de mesa estás.";
    }
    if ((tipo === "recoger" || tipo === "domicilio") && !telefono.trim()) {
      next.telefono = "Ingresa tu teléfono o WhatsApp.";
    }
    if (tipo === "domicilio" && !direccion.trim()) {
      next.direccion = "Escribe tu dirección completa y barrio.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateCheckout()) return;

    const payload = {
      tipo,
      cliente_nombre: clienteNombre.trim(),
      telefono: telefono.trim(),
      direccion: tipo === "domicilio" ? direccion.trim() : "",
      mesa_id: mesaPreasignada?.id || null,
      mesa_referencia: tipo === "mesa" && !mesaPreasignada?.id ? mesaRef.trim() : "",
      notas: notas.trim(),
      metodo_pago: metodoPago,
      items: items.map((item) => ({
        producto_id: item.productoId,
        tamano: item.size,
        cantidad: item.cantidad,
        adicionales_ids: (item.adicionales || []).map((a) => a.id),
        notas: item.notas || "",
      })),
    };

    try {
      const created = await createOrder.mutateAsync(payload);
      clearCart();
      onClose();
      navigate(`/pedido/${created.codigo}`);
    } catch (err) {
      if (err.fieldErrors) {
        const mapped = {};
        if (err.fieldErrors.cliente_nombre) mapped.clienteNombre = String(err.fieldErrors.cliente_nombre);
        if (err.fieldErrors.telefono) mapped.telefono = String(err.fieldErrors.telefono);
        if (err.fieldErrors.direccion) mapped.direccion = String(err.fieldErrors.direccion);
        if (err.fieldErrors.mesa_referencia || err.fieldErrors.mesa) {
          mapped.mesaRef = String(err.fieldErrors.mesa_referencia || err.fieldErrors.mesa);
        }
        setErrors(mapped);
        setSubmitError(
          err.fieldErrors.items
            ? String(err.fieldErrors.items)
            : "Revisa los campos marcados antes de enviar."
        );
      } else {
        setSubmitError(err.message || "No pudimos registrar tu pedido. Intenta de nuevo.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end bg-negro/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-md max-h-[92vh] sm:h-full bg-crema rounded-t-3xl sm:rounded-none sm:rounded-l-3xl shadow-sticker-lg flex flex-col overflow-hidden">
        {/* CABECERA */}
        <div className="px-5 py-4 bg-blanco border-b border-borde flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {step === "checkout" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("cart");
                  setSubmitError("");
                }}
                aria-label="Volver al resumen del carrito"
                className="w-10 h-10 rounded-full bg-crema-elevated text-marron flex items-center justify-center hover:text-rojo-cta cursor-pointer shrink-0"
              >
                <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              </button>
            ) : null}
            <div className="min-w-0">
              <h2
                id="cart-drawer-title"
                className="font-heading text-xl font-extrabold text-marron truncate"
              >
                {step === "cart" ? "Tu pedido" : "Confirmar pedido"}
              </h2>
              <p className="text-xs text-marron-muted">
                {step === "cart"
                  ? "Paso 1 de 2 · Revisa tus platos y adicionales"
                  : "Paso 2 de 2 · Sin registro, en menos de 1 minuto"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="min-h-[44px] min-w-[44px] rounded-full bg-crema-elevated text-marron flex items-center justify-center hover:bg-rojo-soft hover:text-rojo-cta transition-colors cursor-pointer shrink-0"
          >
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* PASO 1: CARRITO */}
        {step === "cart" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {!localAbierto ? (
                <div
                  role="alert"
                  className="rounded-2xl bg-rojo-soft border border-rojo/30 px-4 py-3 text-xs sm:text-sm font-bold text-rojo-cta flex items-start gap-2"
                >
                  <WarningCircle size={18} weight="duotone" className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    {mensajeCerrado ||
                      "El local está cerrado en este momento. No se pueden enviar pedidos."}
                  </span>
                </div>
              ) : null}

              {items.length === 0 ? (
                <MascotState
                  variant="empty"
                  compact
                  action={
                    <Button size="sm" onClick={onClose}>
                      Explorar la carta
                    </Button>
                  }
                />
              ) : (
                items.map((item) => (
                  <StickerCard
                    key={item.key}
                    elevation="sm"
                    className="p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-heading font-extrabold text-base text-marron leading-snug">
                            {item.nombre}
                          </span>
                          <span
                            className={[
                              "px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase",
                              item.size === "mini"
                                ? "bg-verde-soft text-verde-text"
                                : "bg-crema-elevated text-marron-muted",
                            ].join(" ")}
                          >
                            {item.size === "mini" ? "MINI" : "Normal"}
                          </span>
                        </div>
                        {item.categoriaNombre ? (
                          <p className="text-xs text-marron-muted">
                            {item.categoriaNombre}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={`Eliminar ${item.nombre}`}
                        className="p-1.5 rounded-full text-marron-muted hover:text-rojo-cta hover:bg-rojo-soft transition-colors cursor-pointer"
                      >
                        <Trash size={16} weight="duotone" aria-hidden="true" />
                      </button>
                    </div>

                    {item.adicionales?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.adicionales.map((a) => (
                          <span
                            key={a.id}
                            className="px-2 py-0.5 rounded-full bg-mostaza-soft text-mostaza-text text-[11px] font-bold"
                          >
                            + {a.nombre} ({formatCOP(a.precio)})
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {item.notas ? (
                      <p className="text-xs italic text-marron-muted bg-crema px-3 py-1.5 rounded-xl border border-borde/70">
                        “{item.notas}”
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-heading text-lg font-extrabold text-rojo-cta tabular-price">
                        {formatCOP(item.unitPrice * item.cantidad)}
                      </span>

                      <div className="inline-flex items-center gap-1 bg-crema-elevated border border-borde rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, -1)}
                          aria-label={`Restar ${item.nombre}`}
                          className="w-9 h-9 rounded-full bg-blanco text-marron flex items-center justify-center hover:text-rojo-cta cursor-pointer"
                        >
                          <Minus size={14} weight="bold" aria-hidden="true" />
                        </button>
                        <span className="w-6 text-center font-heading font-extrabold text-sm text-marron tabular-price">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, 1)}
                          aria-label={`Sumar ${item.nombre}`}
                          className="w-9 h-9 rounded-full bg-rojo-cta text-blanco flex items-center justify-center hover:bg-rojo-hover cursor-pointer"
                        >
                          <Plus size={14} weight="bold" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </StickerCard>
                ))
              )}
            </div>

            {items.length > 0 ? (
              <div className="p-5 bg-blanco border-t border-borde space-y-3 safe-bottom">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-marron-muted">
                    Total estimado (sin costo domicilio)
                  </span>
                  <span className="font-heading text-2xl font-extrabold text-marron tabular-price">
                    {formatCOP(totalPrice)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    <Trash size={16} weight="duotone" aria-hidden="true" />
                    <span>Vaciar</span>
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!localAbierto}
                    onClick={() => setStep("checkout")}
                  >
                    <span>Continuar</span>
                    <ArrowRight size={18} weight="bold" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          /* PASO 2: DATOS DEL INVITADO Y ENVÍO REAL */
          <form onSubmit={handleConfirmOrder} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {submitError ? (
                <div
                  role="alert"
                  className="rounded-2xl bg-rojo-soft border border-rojo/30 px-4 py-3 text-sm font-bold text-rojo-cta"
                >
                  {submitError}
                </div>
              ) : null}

              {/* TIPO DE PEDIDO */}
              <fieldset className="space-y-2">
                <legend className="font-heading text-sm font-extrabold uppercase tracking-wide text-marron">
                  ¿Cómo quieres recibirlo?
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {ORDER_TYPES.map(({ id, label, hint, icon: Icon }) => {
                    const active = tipo === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setTipo(id);
                          setErrors((prev) => ({
                            ...prev,
                            direccion: undefined,
                            mesaRef: undefined,
                          }));
                        }}
                        aria-pressed={active}
                        className={[
                          "min-h-[76px] p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer",
                          active
                            ? "bg-rojo-soft border-rojo-cta text-marron shadow-sm"
                            : "bg-blanco border-borde text-marron-muted hover:border-marron/40",
                        ].join(" ")}
                      >
                        <Icon
                          size={22}
                          weight="duotone"
                          className={active ? "text-rojo-cta" : "text-marron-muted"}
                          aria-hidden="true"
                        />
                        <span className="font-heading font-extrabold text-xs sm:text-sm text-marron leading-none">
                          {label}
                        </span>
                        <span className="text-[10px] font-bold text-marron-muted">
                          {hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* MESA */}
              {tipo === "mesa" ? (
                <div className="space-y-1">
                  <label
                    htmlFor="checkout-mesa"
                    className="block text-xs font-extrabold uppercase tracking-wide text-marron"
                  >
                    Número de mesa *
                  </label>
                  <input
                    id="checkout-mesa"
                    type="text"
                    value={mesaRef}
                    disabled={Boolean(mesaPreasignada)}
                    onChange={(e) => {
                      setMesaRef(e.target.value);
                      setErrors((p) => ({ ...p, mesaRef: undefined }));
                    }}
                    placeholder="Ej: 4"
                    className="w-full min-h-[46px] px-4 rounded-2xl bg-blanco border border-borde text-base text-marron focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                  />
                  {errors.mesaRef ? (
                    <p className="text-xs font-bold text-rojo-cta">{errors.mesaRef}</p>
                  ) : null}
                </div>
              ) : null}

              {/* NOMBRE */}
              <div className="space-y-1">
                <label
                  htmlFor="checkout-nombre"
                  className="block text-xs font-extrabold uppercase tracking-wide text-marron"
                >
                  Tu nombre *
                </label>
                <input
                  id="checkout-nombre"
                  type="text"
                  autoComplete="name"
                  value={clienteNombre}
                  onChange={(e) => {
                    setClienteNombre(e.target.value);
                    setErrors((p) => ({ ...p, clienteNombre: undefined }));
                  }}
                  placeholder="Ej: Andrea Gómez"
                  className="w-full min-h-[46px] px-4 rounded-2xl bg-blanco border border-borde text-base text-marron focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                />
                {errors.clienteNombre ? (
                  <p className="text-xs font-bold text-rojo-cta">
                    {errors.clienteNombre}
                  </p>
                ) : null}
              </div>

              {/* TELÉFONO */}
              <div className="space-y-1">
                <label
                  htmlFor="checkout-telefono"
                  className="block text-xs font-extrabold uppercase tracking-wide text-marron"
                >
                  Teléfono / WhatsApp {tipo === "mesa" ? "(opcional)" : "*"}
                </label>
                <input
                  id="checkout-telefono"
                  type="tel"
                  autoComplete="tel"
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setErrors((p) => ({ ...p, telefono: undefined }));
                  }}
                  placeholder="Ej: 300 123 4567"
                  className="w-full min-h-[46px] px-4 rounded-2xl bg-blanco border border-borde text-base text-marron focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                />
                {errors.telefono ? (
                  <p className="text-xs font-bold text-rojo-cta">{errors.telefono}</p>
                ) : null}
              </div>

              {/* DIRECCIÓN (SOLO DOMICILIO) */}
              {tipo === "domicilio" ? (
                <div className="space-y-1">
                  <label
                    htmlFor="checkout-direccion"
                    className="block text-xs font-extrabold uppercase tracking-wide text-marron"
                  >
                    Dirección y barrio *
                  </label>
                  <input
                    id="checkout-direccion"
                    type="text"
                    autoComplete="street-address"
                    value={direccion}
                    onChange={(e) => {
                      setDireccion(e.target.value);
                      setErrors((p) => ({ ...p, direccion: undefined }));
                    }}
                    placeholder="Calle, número, apartamento o punto de referencia"
                    className="w-full min-h-[46px] px-4 rounded-2xl bg-blanco border border-borde text-base text-marron focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                  />
                  {errors.direccion ? (
                    <p className="text-xs font-bold text-rojo-cta">
                      {errors.direccion}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* MÉTODO DE PAGO */}
              <fieldset className="space-y-2">
                <legend className="font-heading text-sm font-extrabold uppercase tracking-wide text-marron">
                  Método de pago
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago("efectivo")}
                    aria-pressed={metodoPago === "efectivo"}
                    className={[
                      "p-3 rounded-2xl border-2 text-left space-y-1 transition-all cursor-pointer",
                      metodoPago === "efectivo"
                        ? "bg-verde-soft border-verde-text shadow-sm"
                        : "bg-blanco border-borde hover:border-marron/40",
                    ].join(" ")}
                  >
                    <Money size={22} weight="duotone" className="text-verde-text" aria-hidden="true" />
                    <span className="block font-heading font-extrabold text-sm text-marron">
                      Efectivo
                    </span>
                    <span className="block text-[11px] text-marron-muted">
                      Pagas al recibir o en mesa
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago("bold")}
                    aria-pressed={metodoPago === "bold"}
                    className={[
                      "p-3 rounded-2xl border-2 text-left space-y-1 transition-all cursor-pointer",
                      metodoPago === "bold"
                        ? "bg-mostaza-soft border-mostaza shadow-sm"
                        : "bg-blanco border-borde hover:border-marron/40",
                    ].join(" ")}
                  >
                    <CreditCard size={22} weight="duotone" className="text-mostaza-text" aria-hidden="true" />
                    <span className="block font-heading font-extrabold text-sm text-marron">
                      Bold online
                    </span>
                    <span className="block text-[11px] text-marron-muted">
                      Tarjeta / PSE (Fase 6)
                    </span>
                  </button>
                </div>
              </fieldset>

              {/* NOTAS GENERALES */}
              <div className="space-y-1">
                <label
                  htmlFor="checkout-notas"
                  className="block text-xs font-extrabold uppercase tracking-wide text-marron"
                >
                  Notas generales (opcional)
                </label>
                <textarea
                  id="checkout-notas"
                  rows={2}
                  maxLength={350}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Llevo billete de $50.000, salsas aparte..."
                  className="w-full p-3 rounded-2xl bg-blanco border border-borde text-sm text-marron focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                />
              </div>
            </div>

            <div className="p-5 bg-blanco border-t border-borde space-y-3 safe-bottom">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-marron-muted">
                  Total a confirmar
                </span>
                <span className="font-heading text-2xl font-extrabold text-marron tabular-price">
                  {formatCOP(totalPrice)}
                </span>
              </div>

              <Button
                type="submit"
                disabled={createOrder.isPending || !localAbierto}
                className="w-full"
              >
                <span>
                  {createOrder.isPending
                    ? "Enviando a cocina..."
                    : "Enviar mi pedido"}
                </span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

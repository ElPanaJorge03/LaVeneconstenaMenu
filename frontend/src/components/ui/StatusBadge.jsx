import {
  BellRinging,
  CheckCircle,
  CookingPot,
  Package,
  XCircle,
} from "@phosphor-icons/react";

const STATUS_META = {
  nuevo: {
    label: "Nuevo",
    icon: BellRinging,
    classes: "bg-rojo-soft text-rojo-cta border-rojo/25",
  },
  preparando: {
    label: "Preparando",
    icon: CookingPot,
    classes: "bg-mostaza-soft text-mostaza-text border-mostaza/45",
  },
  listo: {
    label: "Listo",
    icon: CheckCircle,
    classes: "bg-verde-soft text-verde-text border-verde/45",
  },
  entregado: {
    label: "Entregado",
    icon: Package,
    classes: "bg-crema-elevated text-marron border-borde",
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    classes: "bg-crema-elevated/80 text-marron-muted border-borde",
  },
};

export function StatusBadge({ status = "nuevo", size = "md", className = "" }) {
  const meta = STATUS_META[status] || STATUS_META.nuevo;
  const Icon = meta.icon;
  const sizeClass =
    size === "sm" ? "px-2.5 py-1 text-xs gap-1" : "px-3.5 py-1.5 text-sm gap-1.5";

  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap rounded-full border font-bold leading-none",
        meta.classes,
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon
        size={size === "sm" ? 14 : 16}
        weight="duotone"
        aria-hidden="true"
      />
      <span>{meta.label}</span>
    </span>
  );
}

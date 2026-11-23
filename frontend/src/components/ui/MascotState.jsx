import { StickerCard } from "./StickerCard";

const MASCOT_VARIANTS = {
  empty: {
    src: "/assets/brand/mascot-empty.png",
    alt: "Chef de La VeneConsteña invitándote a elegir tu pedido",
    defaultTitle: "Tu pedido está vacío",
    defaultDescription:
      "Explora el menú y arma tu antojo costeño con los adicionales que más te gusten.",
  },
  cooking: {
    src: "/assets/brand/mascot-cooking.png",
    alt: "Chef de La VeneConsteña cocinando tu pedido",
    defaultTitle: "Cocinando a fuego alegre...",
    defaultDescription:
      "Estamos preparando todo fresco y al instante para que llegue calientico.",
  },
  confirmed: {
    src: "/assets/brand/mascot-confirmed.png",
    alt: "Chef de La VeneConsteña celebrando un pedido confirmado",
    defaultTitle: "¡Pedido recibido!",
    defaultDescription:
      "Ya llegó a cocina. Puedes ver el avance en tiempo real desde aquí.",
  },
  error: {
    src: "/assets/brand/mascot-error.png",
    alt: "Chef de La VeneConsteña avisando un inconveniente",
    defaultTitle: "Ups, algo no salió como esperábamos",
    defaultDescription:
      "Intenta de nuevo en unos segundos o revisa tu conexión.",
  },
};

export function MascotState({
  variant = "empty",
  title,
  description,
  action = null,
  compact = false,
  className = "",
}) {
  const meta = MASCOT_VARIANTS[variant] || MASCOT_VARIANTS.empty;

  return (
    <StickerCard
      elevation="sm"
      className={[
        "flex flex-col items-center text-center",
        compact ? "p-5 gap-3" : "p-7 sm:p-9 gap-4",
        className,
      ].join(" ")}
    >
      <img
        src={meta.src}
        alt={meta.alt}
        loading="lazy"
        className={[
          "object-contain sticker-drop select-none",
          compact ? "w-28 h-28" : "w-36 h-36 sm:w-44 sm:h-44",
        ].join(" ")}
      />
      <div className="max-w-sm space-y-1.5">
        <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-marron leading-tight">
          {title || meta.defaultTitle}
        </h3>
        <p className="text-sm sm:text-base text-marron-muted leading-relaxed">
          {description || meta.defaultDescription}
        </p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </StickerCard>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "bg-rojo-cta text-blanco shadow-cta hover:bg-rojo-hover hover:shadow-cta-hover active:scale-[0.98]",
    secondary:
      "bg-blanco text-marron border-2 border-borde shadow-sticker-sm hover:border-rojo hover:text-rojo-cta active:scale-[0.98]",
    verde:
      "bg-verde-soft text-verde-text border border-verde/40 hover:bg-verde/25 active:scale-[0.98]",
    mostaza:
      "bg-mostaza text-marron shadow-sticker-sm hover:brightness-95 active:scale-[0.98]",
    ghost:
      "bg-transparent text-marron hover:bg-crema-elevated active:scale-[0.98]",
  };

  const sizes = {
    sm: "min-h-[44px] px-4 text-sm gap-1.5",
    md: "min-h-[48px] px-6 text-base gap-2",
    lg: "min-h-[52px] px-7 text-lg gap-2.5",
    icon: "min-h-[44px] min-w-[44px] p-2.5",
  };

  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-full font-heading font-bold tracking-tight cursor-pointer select-none",
        "transition-all duration-150 ease-tactile",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-crema",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

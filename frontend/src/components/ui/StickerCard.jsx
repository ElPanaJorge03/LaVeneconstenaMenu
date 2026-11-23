export function StickerCard({
  as: Component = "div",
  elevation = "md",
  interactive = false,
  className = "",
  children,
  ...props
}) {
  const shadowMap = {
    sm: "shadow-sticker-sm",
    md: "shadow-sticker-md",
    lg: "shadow-sticker-lg",
  };

  return (
    <Component
      className={[
        "bg-blanco border border-borde/80 rounded-3xl",
        shadowMap[elevation] || shadowMap.md,
        interactive
          ? "transition-shadow duration-200 ease-tactile hover:shadow-sticker-lg"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}

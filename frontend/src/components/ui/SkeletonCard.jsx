export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-blanco border border-borde/80 rounded-3xl shadow-sticker-sm overflow-hidden animate-pulse"
    >
      <div className="aspect-[4/3] bg-crema-elevated" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-2/3 rounded-full bg-crema-elevated" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded-full bg-crema-elevated" />
          <div className="h-3.5 w-4/5 rounded-full bg-crema-elevated" />
        </div>
        <div className="pt-2 flex items-center justify-between">
          <div className="h-6 w-20 rounded-full bg-crema-elevated" />
          <div className="h-11 w-28 rounded-full bg-crema-elevated" />
        </div>
      </div>
    </div>
  );
}

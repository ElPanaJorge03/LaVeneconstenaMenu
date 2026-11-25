import { useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  ChartBar,
  CheckCircle,
  ChefHat,
  ForkKnife,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  QrCode,
  SignOut,
  Storefront,
  Trash,
  UsersThree,
  WarningCircle,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { AdminLocalSection } from "../components/admin/AdminLocalSection";
import { AdminMesasSection } from "../components/admin/AdminMesasSection";
import { AdminSalesSection } from "../components/admin/AdminSalesSection";
import { AdminUsersSection } from "../components/admin/AdminUsersSection";
import { BrandFooter } from "../components/layout/BrandFooter";
import { BrandHeader } from "../components/layout/BrandHeader";
import { Button } from "../components/ui/Button";
import { MascotState } from "../components/ui/MascotState";
import { StickerCard } from "../components/ui/StickerCard";
import { useAuth } from "../hooks/useAuth";
import { useAdminMenuData, useAdminMenuMutations } from "../hooks/useMenu";
import { formatCOP } from "../utils/formatCurrency";

const ADMIN_SECTIONS = [
  { id: "resumen", label: "Ventas", icon: ChartBar },
  { id: "menu", label: "Menú", icon: ForkKnife },
  { id: "mesas", label: "Mesas y QR", icon: QrCode },
  { id: "equipo", label: "Equipo", icon: UsersThree },
  { id: "local", label: "Local", icon: Storefront },
];

const EMPTY_PRODUCT_FORM = {
  id: null,
  categoria: "",
  nombre: "",
  descripcion: "",
  precio_normal: 0,
  precio_mini: "",
  es_especial: false,
  porciones_texto: "",
  etiqueta: "",
  disponible: true,
  orden: 1,
};

const EMPTY_CATEGORY_FORM = {
  id: null,
  nombre: "",
  descripcion: "",
  color_acento: "rojo",
  es_promocion: false,
  orden: 1,
  activa: true,
};

const EMPTY_EXTRA_FORM = {
  id: null,
  nombre: "",
  precio: 3000,
  disponible: true,
  orden: 1,
};

export function AdminMenuPage() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const [section, setSection] = useState("menu");
  const [tab, setTab] = useState("productos");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const [productModal, setProductModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  const [extraModal, setExtraModal] = useState(null);
  const [formError, setFormError] = useState("");

  const { categorias, productos, adicionales } = useAdminMenuData(isAdmin);
  const mutations = useAdminMenuMutations();

  const catList = categorias.data || [];
  const prodList = productos.data || [];
  const extraList = adicionales.data || [];

  const sinPrecioCount = useMemo(
    () => prodList.filter((p) => p.precio_normal === 0).length,
    [prodList]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prodList.filter((p) => {
      if (catFilter === "sin-precio" && p.precio_normal > 0) return false;
      if (
        catFilter !== "all" &&
        catFilter !== "sin-precio" &&
        String(p.categoria) !== String(catFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria_nombre || "").toLowerCase().includes(q)
      );
    });
  }, [prodList, search, catFilter]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-crema">
        <BrandHeader />
        <main className="flex-1 max-w-xl mx-auto px-4 py-12">
          <MascotState
            variant="error"
            title="Solo para administradores"
            description="Tu cuenta actual no tiene permisos para editar la carta. Inicia sesión con un usuario Admin o vuelve al panel de mesera."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  to="/mesera"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-5 rounded-full bg-rojo-cta text-blanco font-heading font-bold text-sm"
                >
                  <ChefHat size={17} weight="duotone" aria-hidden="true" />
                  <span>Ir a Panel Mesera</span>
                </Link>
                <Button variant="secondary" size="sm" onClick={logout}>
                  Cambiar de cuenta
                </Button>
              </div>
            }
          />
        </main>
        <BrandFooter />
      </div>
    );
  }

  const saveProduct = async (e) => {
    e.preventDefault();
    setFormError("");
    const payload = {
      categoria: Number(productModal.categoria),
      nombre: productModal.nombre.trim(),
      descripcion: productModal.descripcion.trim(),
      precio_normal: Math.max(0, parseInt(productModal.precio_normal || 0, 10) || 0),
      precio_mini:
        productModal.precio_mini === "" || productModal.precio_mini === null
          ? null
          : parseInt(productModal.precio_mini, 10),
      es_especial: Boolean(productModal.es_especial),
      porciones_texto: productModal.porciones_texto.trim(),
      etiqueta: productModal.etiqueta.trim(),
      disponible: Boolean(productModal.disponible),
      orden: parseInt(productModal.orden || 1, 10) || 1,
      ...(productModal.imagenFile ? { imagenFile: productModal.imagenFile } : {}),
    };

    try {
      if (productModal.id) {
        await mutations.updateProducto.mutateAsync({
          id: productModal.id,
          data: payload,
        });
      } else {
        await mutations.createProducto.mutateAsync(payload);
      }
      setProductModal(null);
    } catch (err) {
      setFormError(err.message || "No se pudo guardar el producto.");
    }
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setFormError("");
    const payload = {
      nombre: categoryModal.nombre.trim(),
      descripcion: categoryModal.descripcion.trim(),
      color_acento: categoryModal.color_acento,
      es_promocion: Boolean(categoryModal.es_promocion),
      orden: parseInt(categoryModal.orden || 1, 10) || 1,
      activa: Boolean(categoryModal.activa),
    };
    try {
      if (categoryModal.id) {
        await mutations.updateCategoria.mutateAsync({
          id: categoryModal.id,
          data: payload,
        });
      } else {
        await mutations.createCategoria.mutateAsync(payload);
      }
      setCategoryModal(null);
    } catch (err) {
      setFormError(err.message || "No se pudo guardar la categoría.");
    }
  };

  const saveExtra = async (e) => {
    e.preventDefault();
    setFormError("");
    const payload = {
      nombre: extraModal.nombre.trim(),
      precio: Math.max(0, parseInt(extraModal.precio || 0, 10) || 0),
      disponible: Boolean(extraModal.disponible),
      orden: parseInt(extraModal.orden || 1, 10) || 1,
    };
    try {
      if (extraModal.id) {
        await mutations.updateAdicional.mutateAsync({
          id: extraModal.id,
          data: payload,
        });
      } else {
        await mutations.createAdicional.mutateAsync(payload);
      }
      setExtraModal(null);
    } catch (err) {
      setFormError(err.message || "No se pudo guardar el adicional.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-crema">
      <BrandHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ENCABEZADO ADMIN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rojo-cta">
              Panel Administración · La VeneConsteña
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-marron">
              Centro de Control
            </h1>
            <p className="text-sm text-marron-muted">
              Sesión activa: <strong>{user?.username}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/mesera"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-mostaza-soft border border-mostaza/65 text-marron font-heading font-bold text-sm hover:bg-mostaza transition-colors"
            >
              <ChefHat size={17} weight="duotone" aria-hidden="true" />
              <span>Ir a Pedidos en vivo</span>
            </Link>
            <Button variant="secondary" size="sm" onClick={logout}>
              <SignOut size={17} weight="bold" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL DEL PANEL ADMIN */}
        <nav
          aria-label="Secciones de administración"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {ADMIN_SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                aria-current={active ? "page" : undefined}
                className={[
                  "shrink-0 min-h-[44px] px-4 rounded-full font-heading font-bold text-sm inline-flex items-center gap-2 transition-all cursor-pointer",
                  active
                    ? "bg-marron text-crema shadow-sm"
                    : "bg-blanco text-marron border border-borde hover:border-marron",
                ].join(" ")}
              >
                <Icon size={17} weight="duotone" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {section === "resumen" ? <AdminSalesSection /> : null}
        {section === "mesas" ? <AdminMesasSection /> : null}
        {section === "equipo" ? <AdminUsersSection /> : null}
        {section === "local" ? <AdminLocalSection /> : null}

        {section === "menu" ? (
        <div className="space-y-6">
        {/* MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StickerCard elevation="sm" className="p-4">
            <span className="text-xs font-bold text-marron-muted">Productos</span>
            <p className="font-heading text-2xl font-extrabold text-marron tabular-price">
              {prodList.length}
            </p>
          </StickerCard>
          <StickerCard elevation="sm" className="p-4">
            <span className="text-xs font-bold text-marron-muted">Categorías</span>
            <p className="font-heading text-2xl font-extrabold text-marron tabular-price">
              {catList.length}
            </p>
          </StickerCard>
          <StickerCard elevation="sm" className="p-4">
            <span className="text-xs font-bold text-marron-muted">Adicionales</span>
            <p className="font-heading text-2xl font-extrabold text-marron tabular-price">
              {extraList.length}
            </p>
          </StickerCard>
          <button
            type="button"
            onClick={() => {
              setTab("productos");
              setCatFilter("sin-precio");
            }}
            className="text-left bg-mostaza-soft/75 border border-mostaza/65 rounded-3xl shadow-sticker-sm p-4 hover:brightness-95 transition cursor-pointer"
          >
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-mostaza-text">
              <WarningCircle size={14} weight="duotone" aria-hidden="true" />
              Sin precio definido
            </span>
            <p className="font-heading text-2xl font-extrabold text-marron tabular-price">
              {sinPrecioCount}
            </p>
          </button>
        </div>

        {/* PESTAÑAS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            className="inline-flex bg-blanco border border-borde rounded-full p-1 shadow-sticker-sm"
          >
            {[
              { id: "productos", label: "Productos" },
              { id: "categorias", label: "Categorías" },
              { id: "adicionales", label: "Adicionales" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={[
                  "min-h-[42px] px-5 rounded-full font-heading font-bold text-sm transition-colors cursor-pointer",
                  tab === item.id
                    ? "bg-rojo-cta text-blanco"
                    : "text-marron hover:bg-crema-elevated",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "productos" ? (
            <Button
              size="sm"
              onClick={() => {
                setFormError("");
                setProductModal({
                  ...EMPTY_PRODUCT_FORM,
                  categoria: catList[0]?.id || "",
                });
              }}
            >
              <Plus size={17} weight="bold" aria-hidden="true" />
              <span>Nuevo producto</span>
            </Button>
          ) : tab === "categorias" ? (
            <Button
              size="sm"
              onClick={() => {
                setFormError("");
                setCategoryModal({
                  ...EMPTY_CATEGORY_FORM,
                  orden: catList.length + 1,
                });
              }}
            >
              <Plus size={17} weight="bold" aria-hidden="true" />
              <span>Nueva categoría</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setFormError("");
                setExtraModal({
                  ...EMPTY_EXTRA_FORM,
                  orden: extraList.length + 1,
                });
              }}
            >
              <Plus size={17} weight="bold" aria-hidden="true" />
              <span>Nuevo adicional</span>
            </Button>
          )}
        </div>

        {/* TAB: PRODUCTOS */}
        {tab === "productos" ? (
          <StickerCard elevation="md" className="overflow-hidden">
            <div className="p-4 bg-crema-elevated/60 border-b border-borde flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={17}
                  weight="bold"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-marron-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar producto por nombre..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-blanco border border-borde text-sm text-marron focus:outline-none focus:border-rojo"
                />
              </div>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                aria-label="Filtrar por categoría"
                className="min-h-[44px] px-4 rounded-full bg-blanco border border-borde text-sm font-bold text-marron focus:outline-none focus:border-rojo"
              >
                <option value="all">Todas las categorías ({prodList.length})</option>
                <option value="sin-precio">
                  Sin precio definido ({sinPrecioCount})
                </option>
                {catList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.total_productos})
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-borde/70">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-crema/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-extrabold text-base text-marron">
                        {p.nombre}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-crema-elevated text-marron-muted text-xs font-bold">
                        {p.categoria_nombre}
                      </span>
                      {p.es_especial ? (
                        <span className="px-2 py-0.5 rounded-full bg-mostaza-soft text-mostaza-text text-[11px] font-extrabold">
                          Especial
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-bold text-marron-muted mt-0.5 tabular-price">
                      <span>
                        Normal:{" "}
                        <strong className="text-marron">
                          {p.precio_normal > 0
                            ? formatCOP(p.precio_normal)
                            : "Sin precio"}
                        </strong>
                      </span>
                      {p.tiene_mini ? (
                        <span>
                          MINI:{" "}
                          <strong className="text-verde-text">
                            {formatCOP(p.precio_mini)}
                          </strong>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => mutations.toggleProducto.mutate(p.id)}
                      className={[
                        "min-h-[40px] px-3.5 rounded-full text-xs font-extrabold border inline-flex items-center gap-1.5 cursor-pointer transition-colors",
                        p.disponible
                          ? "bg-verde-soft text-verde-text border-verde/45 hover:bg-verde/25"
                          : "bg-rojo-soft text-rojo-cta border-rojo/30 hover:bg-rojo/15",
                      ].join(" ")}
                    >
                      {p.disponible ? (
                        <>
                          <CheckCircle size={15} weight="duotone" aria-hidden="true" />
                          <span>Disponible</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={15} weight="duotone" aria-hidden="true" />
                          <span>Agotado</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormError("");
                        setProductModal({
                          ...p,
                          precio_mini: p.precio_mini ?? "",
                        });
                      }}
                      aria-label={`Editar ${p.nombre}`}
                      className="min-h-[40px] min-w-[40px] rounded-full bg-crema-elevated text-marron flex items-center justify-center hover:bg-mostaza-soft cursor-pointer"
                    >
                      <PencilSimple size={17} weight="duotone" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${p.nombre}"?`)) {
                          mutations.deleteProducto.mutate(p.id);
                        }
                      }}
                      aria-label={`Eliminar ${p.nombre}`}
                      className="min-h-[40px] min-w-[40px] rounded-full bg-crema-elevated text-marron-muted flex items-center justify-center hover:bg-rojo-soft hover:text-rojo-cta cursor-pointer"
                    >
                      <Trash size={17} weight="duotone" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </StickerCard>
        ) : null}

        {/* TAB: CATEGORÍAS */}
        {tab === "categorias" ? (
          <StickerCard elevation="md" className="divide-y divide-borde/70 overflow-hidden">
            {catList.map((c) => (
              <div
                key={c.id}
                className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-crema/40"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-extrabold text-base text-marron">
                      {c.orden}. {c.nombre}
                    </span>
                    <span className="text-xs font-bold text-marron-muted">
                      ({c.total_productos} platos)
                    </span>
                    {!c.activa ? (
                      <span className="px-2 py-0.5 rounded-full bg-rojo-soft text-rojo-cta text-xs font-bold">
                        Oculta
                      </span>
                    ) : null}
                  </div>
                  {c.descripcion ? (
                    <p className="text-xs text-marron-muted">{c.descripcion}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError("");
                      setCategoryModal({ ...c });
                    }}
                    aria-label={`Editar categoría ${c.nombre}`}
                    className="min-h-[40px] min-w-[40px] rounded-full bg-crema-elevated text-marron flex items-center justify-center hover:bg-mostaza-soft cursor-pointer"
                  >
                    <PencilSimple size={17} weight="duotone" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Eliminar la categoría "${c.nombre}" y sus productos?`
                        )
                      ) {
                        mutations.deleteCategoria.mutate(c.id);
                      }
                    }}
                    aria-label={`Eliminar categoría ${c.nombre}`}
                    className="min-h-[40px] min-w-[40px] rounded-full bg-crema-elevated text-marron-muted flex items-center justify-center hover:bg-rojo-soft hover:text-rojo-cta cursor-pointer"
                  >
                    <Trash size={17} weight="duotone" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </StickerCard>
        ) : null}

        {/* TAB: ADICIONALES */}
        {tab === "adicionales" ? (
          <StickerCard elevation="md" className="divide-y divide-borde/70 overflow-hidden">
            {extraList.map((extra) => (
              <div
                key={extra.id}
                className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-crema/40"
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading font-extrabold text-base text-marron">
                    {extra.nombre}
                  </span>
                  <span className="font-heading font-extrabold text-sm text-rojo-cta tabular-price">
                    +{formatCOP(extra.precio)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => mutations.toggleAdicional.mutate(extra.id)}
                    className={[
                      "min-h-[40px] px-3.5 rounded-full text-xs font-extrabold border cursor-pointer",
                      extra.disponible
                        ? "bg-verde-soft text-verde-text border-verde/45"
                        : "bg-rojo-soft text-rojo-cta border-rojo/30",
                    ].join(" ")}
                  >
                    {extra.disponible ? "Disponible" : "Agotado"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormError("");
                      setExtraModal({ ...extra });
                    }}
                    aria-label={`Editar adicional ${extra.nombre}`}
                    className="min-h-[40px] min-w-[40px] rounded-full bg-crema-elevated text-marron flex items-center justify-center hover:bg-mostaza-soft cursor-pointer"
                  >
                    <PencilSimple size={17} weight="duotone" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar adicional "${extra.nombre}"?`)) {
                        mutations.deleteAdicional.mutate(extra.id);
                      }
                    }}
                    aria-label={`Eliminar adicional ${extra.nombre}`}
                    className="min-h-[40px] min-w-[40px] rounded-full bg-crema-elevated text-marron-muted flex items-center justify-center hover:bg-rojo-soft hover:text-rojo-cta cursor-pointer"
                  >
                    <Trash size={17} weight="duotone" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </StickerCard>
        ) : null}
        </div>
        ) : null}
      </main>

      {/* MODAL PRODUCTO */}
      {productModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-negro/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveProduct}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-blanco rounded-3xl border-4 border-blanco shadow-sticker-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-extrabold text-marron">
                {productModal.id ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button
                type="button"
                onClick={() => setProductModal(null)}
                aria-label="Cerrar"
                className="w-10 h-10 rounded-full bg-crema-elevated flex items-center justify-center cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {formError ? (
              <div className="rounded-2xl bg-rojo-soft px-3.5 py-2.5 text-sm font-bold text-rojo-cta">
                {formError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="sm:col-span-2 block space-y-1">
                <span className="text-xs font-extrabold text-marron">Nombre</span>
                <input
                  type="text"
                  required
                  value={productModal.nombre}
                  onChange={(e) =>
                    setProductModal({ ...productModal, nombre: e.target.value })
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
                />
              </label>

              <label className="sm:col-span-2 block space-y-1">
                <span className="text-xs font-extrabold text-marron">Categoría</span>
                <select
                  required
                  value={productModal.categoria}
                  onChange={(e) =>
                    setProductModal({
                      ...productModal,
                      categoria: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm font-bold"
                >
                  {catList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-extrabold text-marron">
                  Precio Normal (COP)
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  required
                  value={productModal.precio_normal}
                  onChange={(e) =>
                    setProductModal({
                      ...productModal,
                      precio_normal: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm tabular-price"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-extrabold text-verde-text">
                  Precio MINI (opcional)
                </span>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={productModal.precio_mini}
                  onChange={(e) =>
                    setProductModal({
                      ...productModal,
                      precio_mini: e.target.value,
                    })
                  }
                  placeholder="Dejar vacío si no aplica"
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm tabular-price"
                />
              </label>

              <label className="sm:col-span-2 block space-y-1">
                <span className="text-xs font-extrabold text-marron">
                  Descripción / ingredientes
                </span>
                <textarea
                  rows={2}
                  value={productModal.descripcion}
                  onChange={(e) =>
                    setProductModal({
                      ...productModal,
                      descripcion: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-crema border border-borde text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-extrabold text-marron">
                  Porciones (ej: 2 personas)
                </span>
                <input
                  type="text"
                  value={productModal.porciones_texto}
                  onChange={(e) =>
                    setProductModal({
                      ...productModal,
                      porciones_texto: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
                />
              </label>

              <label className="flex items-center gap-2 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productModal.es_especial}
                  onChange={(e) =>
                    setProductModal({
                      ...productModal,
                      es_especial: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-rojo-cta"
                />
                <span className="text-sm font-bold text-marron">
                  Destacar como Especial
                </span>
              </label>

              <label className="sm:col-span-2 block space-y-1.5">
                <span className="text-xs font-extrabold text-marron">
                  Foto del plato (opcional · JPG/PNG/WebP)
                </span>
                {productModal.imagen && !productModal.imagenFile ? (
                  <img
                    src={productModal.imagen}
                    alt={productModal.nombre}
                    className="w-20 h-20 rounded-2xl object-cover border border-borde"
                  />
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setProductModal({
                      ...productModal,
                      imagenFile: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full text-xs text-marron file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-crema-elevated file:font-bold file:text-marron hover:file:bg-mostaza-soft cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProductModal(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Guardar cambios
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {/* MODAL CATEGORÍA */}
      {categoryModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-negro/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveCategory}
            className="w-full max-w-md bg-blanco rounded-3xl shadow-sticker-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-extrabold text-marron">
                {categoryModal.id ? "Editar categoría" : "Nueva categoría"}
              </h2>
              <button
                type="button"
                onClick={() => setCategoryModal(null)}
                className="w-10 h-10 rounded-full bg-crema-elevated flex items-center justify-center cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            {formError ? (
              <div className="rounded-2xl bg-rojo-soft px-3.5 py-2 text-sm font-bold text-rojo-cta">
                {formError}
              </div>
            ) : null}
            <label className="block space-y-1">
              <span className="text-xs font-extrabold text-marron">Nombre</span>
              <input
                type="text"
                required
                value={categoryModal.nombre}
                onChange={(e) =>
                  setCategoryModal({ ...categoryModal, nombre: e.target.value })
                }
                className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-extrabold text-marron">Descripción</span>
              <input
                type="text"
                value={categoryModal.descripcion}
                onChange={(e) =>
                  setCategoryModal({
                    ...categoryModal,
                    descripcion: e.target.value,
                  })
                }
                className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-extrabold text-marron">Color cinta</span>
                <select
                  value={categoryModal.color_acento}
                  onChange={(e) =>
                    setCategoryModal({
                      ...categoryModal,
                      color_acento: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-2xl bg-crema border border-borde text-sm font-bold"
                >
                  <option value="rojo">Rojo marca</option>
                  <option value="verde">Verde costeño</option>
                  <option value="mostaza">Mostaza</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-extrabold text-marron">Orden</span>
                <input
                  type="number"
                  min={1}
                  value={categoryModal.orden}
                  onChange={(e) =>
                    setCategoryModal({ ...categoryModal, orden: e.target.value })
                  }
                  className="w-full min-h-[44px] px-3 rounded-2xl bg-crema border border-borde text-sm"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={categoryModal.activa}
                onChange={(e) =>
                  setCategoryModal({ ...categoryModal, activa: e.target.checked })
                }
                className="w-5 h-5 accent-rojo-cta"
              />
              <span className="text-sm font-bold text-marron">
                Visible en la carta pública
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCategoryModal(null)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Guardar
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {/* MODAL ADICIONAL */}
      {extraModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-negro/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveExtra}
            className="w-full max-w-md bg-blanco rounded-3xl shadow-sticker-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-extrabold text-marron">
                {extraModal.id ? "Editar adicional" : "Nuevo adicional"}
              </h2>
              <button
                type="button"
                onClick={() => setExtraModal(null)}
                className="w-10 h-10 rounded-full bg-crema-elevated flex items-center justify-center cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            {formError ? (
              <div className="rounded-2xl bg-rojo-soft px-3.5 py-2 text-sm font-bold text-rojo-cta">
                {formError}
              </div>
            ) : null}
            <label className="block space-y-1">
              <span className="text-xs font-extrabold text-marron">Nombre</span>
              <input
                type="text"
                required
                value={extraModal.nombre}
                onChange={(e) =>
                  setExtraModal({ ...extraModal, nombre: e.target.value })
                }
                className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-extrabold text-marron">
                Precio (COP enteros)
              </span>
              <input
                type="number"
                min={0}
                step={100}
                required
                value={extraModal.precio}
                onChange={(e) =>
                  setExtraModal({ ...extraModal, precio: e.target.value })
                }
                className="w-full min-h-[44px] px-3.5 rounded-2xl bg-crema border border-borde text-sm tabular-price"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setExtraModal(null)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Guardar
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <BrandFooter />
    </div>
  );
}

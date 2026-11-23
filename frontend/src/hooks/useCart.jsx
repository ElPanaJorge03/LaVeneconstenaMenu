import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CART_STORAGE_KEY = "vc_cart_v1";
const CartContext = createContext(null);

function makeItemKey(productId, size, adicionales, notas) {
  const extraIds = [...adicionales]
    .map((a) => a.id)
    .sort((a, b) => a - b)
    .join(",");
  return `${productId}:${size}:${extraIds}:${(notas || "").trim().toLowerCase()}`;
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const addItem = useCallback(
    ({ producto, categoriaNombre, size = "normal", adicionales = [], notas = "", cantidad = 1 }) => {
      const unitBase =
        size === "mini" && producto.precio_mini
          ? producto.precio_mini
          : producto.precio_normal;
      const extrasSum = adicionales.reduce((acc, a) => acc + a.precio, 0);
      const unitPrice = unitBase + extrasSum;
      const key = makeItemKey(producto.id, size, adicionales, notas);

      setItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.key === key);
        if (existingIndex >= 0) {
          return prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, cantidad: item.cantidad + cantidad }
              : item
          );
        }
        return [
          ...prev,
          {
            key,
            productoId: producto.id,
            nombre: producto.nombre,
            categoriaNombre: categoriaNombre || "",
            size,
            unitBase,
            unitPrice,
            adicionales: adicionales.map((a) => ({
              id: a.id,
              nombre: a.nombre,
              precio: a.precio,
            })),
            notas: (notas || "").trim(),
            cantidad,
          },
        ];
      });
    },
    []
  );

  const updateQuantity = useCallback((key, delta) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, cantidad: item.cantidad + delta } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((acc, item) => acc + item.unitPrice * item.cantidad, 0),
    [items]
  );

  const qtyByProductAndSize = useMemo(() => {
    const map = {};
    for (const item of items) {
      const k = `${item.productoId}:${item.size}`;
      map[k] = (map[k] || 0) + item.cantidad;
    }
    return map;
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      totalPrice,
      qtyByProductAndSize,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      totalItems,
      totalPrice,
      qtyByProductAndSize,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}

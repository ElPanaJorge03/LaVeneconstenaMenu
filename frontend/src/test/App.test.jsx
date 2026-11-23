import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../hooks/useAuth";
import { CartProvider } from "../hooks/useCart";
import { formatCOP } from "../utils/formatCurrency";

const MOCK_MENU = {
  categorias: [
    {
      id: 1,
      nombre: "Promociones",
      slug: "promociones",
      descripcion: "De Lunes a Jueves (No aplica festivos)",
      color_acento: "rojo",
      es_promocion: true,
      orden: 1,
      productos: [
        {
          id: 101,
          nombre: "2 Perros Sencillos",
          descripcion: "",
          precio_normal: 11000,
          precio_mini: null,
          tiene_mini: false,
          es_especial: false,
          porciones_texto: "Lun a Jue",
          etiqueta: "Promo x2",
          orden: 1,
        },
      ],
    },
    {
      id: 2,
      nombre: "Perros Calientes",
      slug: "perros-calientes",
      descripcion: "Clásicos y suizos",
      color_acento: "rojo",
      es_promocion: false,
      orden: 2,
      productos: [
        {
          id: 201,
          nombre: "Choriperro",
          descripcion: "",
          precio_normal: 13000,
          precio_mini: 7500,
          tiene_mini: true,
          es_especial: false,
          porciones_texto: "",
          etiqueta: "",
          orden: 1,
        },
      ],
    },
  ],
  adicionales: [
    { id: 1, nombre: "Gratinado", precio: 4000, disponible: true, orden: 1 },
  ],
};

const MOCK_ORDER_CREATED = {
  codigo: "VC-TEST-1234",
  tipo: "recoger",
  estado: "nuevo",
  mesa_display: "",
  cliente_primer_nombre: "Camila",
  notas: "",
  total: 11500,
  pago: { metodo: "efectivo", estado: "pendiente", monto: 11500, pagado_en: null },
  items: [
    {
      id: 1,
      producto_id: 201,
      nombre_producto: "Choriperro",
      tamano: "mini",
      cantidad: 1,
      precio_unitario: 11500,
      adicionales_snapshot: [{ id: 1, nombre: "Gratinado", precio: 4000 }],
      subtotal: 11500,
      notas: "",
    },
  ],
  creado_en: "2026-11-23T18:30:00Z",
  actualizado_en: "2026-11-23T18:30:00Z",
};

function renderApp(initialPath = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn((url, opts) => {
      if (String(url).includes("/api/v1/local/info/")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ nombre: "La VeneConsteña", abierto: true }),
        });
      }
      if (String(url).includes("/api/v1/pedidos/public/") && opts?.method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(MOCK_ORDER_CREATED),
        });
      }
      if (String(url).includes("/api/v1/pedidos/seguimiento/VC-TEST-1234/")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(MOCK_ORDER_CREATED),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_MENU),
      });
    })
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <App />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("La VeneConsteña — Fase 2 y 3 (Carta + Checkout + Seguimiento)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("formatea dinero en enteros COP sin decimales", () => {
    expect(formatCOP(18500)).toMatch(/18\.500/);
    expect(formatCOP(0)).toMatch(/0/);
  });

  it("permite pedir MINI + adicional, confirmar pedido y ver seguimiento con código", async () => {
    renderApp("/");

    fireEvent.click(
      await screen.findByRole("button", { name: /Pedir Choriperro MINI/i })
    );
    fireEvent.click(await screen.findByRole("button", { name: /Gratinado/i }));
    fireEvent.click(screen.getByRole("button", { name: /Agregar/i }));

    const cartBtn = await screen.findByRole("button", { name: /Ver mi pedido/i });
    expect(cartBtn).toHaveTextContent(/11\.500/);
    fireEvent.click(cartBtn);

    fireEvent.click(await screen.findByRole("button", { name: /Continuar/i }));

    fireEvent.change(screen.getByLabelText(/Tu nombre/i), {
      target: { value: "Camila" },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), {
      target: { value: "3005551234" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Enviar mi pedido/i }));

    await waitFor(() => {
      expect(screen.getByText("VC-TEST-1234")).toBeInTheDocument();
    });
    expect(screen.getByText(/¡Recibimos tu pedido!/i)).toBeInTheDocument();
  });
});

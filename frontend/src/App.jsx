import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { MascotState } from "./components/ui/MascotState";
import { MenuPage } from "./pages/MenuPage";

const AdminMenuPage = lazy(() =>
  import("./pages/AdminMenuPage").then((m) => ({ default: m.AdminMenuPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const OrderTrackingPage = lazy(() =>
  import("./pages/OrderTrackingPage").then((m) => ({
    default: m.OrderTrackingPage,
  }))
);
const TableMenuPage = lazy(() =>
  import("./pages/TableMenuPage").then((m) => ({ default: m.TableMenuPage }))
);
const WaitressPanelPage = lazy(() =>
  import("./pages/WaitressPanelPage").then((m) => ({
    default: m.WaitressPanelPage,
  }))
);
const PlaceholderRoutePage = lazy(() =>
  import("./pages/PlaceholderRoutePage").then((m) => ({
    default: m.PlaceholderRoutePage,
  }))
);

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-crema flex items-center justify-center p-4">
      <MascotState
        variant="cooking"
        compact
        title="Cargando..."
        description="Preparando la vista de La VeneConsteña."
        className="max-w-sm w-full"
      />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/mesa/:mesaId" element={<TableMenuPage />} />
        <Route path="/pedido" element={<OrderTrackingPage />} />
        <Route path="/pedido/:codigo" element={<OrderTrackingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mesera" element={<WaitressPanelPage />} />
        <Route path="/admin" element={<AdminMenuPage />} />
        <Route
          path="*"
          element={
            <PlaceholderRoutePage
              phaseLabel="404"
              title="No encontramos esa página"
              description="Parece que ese plato no está en la carta. Vuelve al inicio para explorar La VeneConsteña."
              variant="error"
            />
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;

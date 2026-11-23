import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LockKey, SignIn, User } from "@phosphor-icons/react";
import { BrandFooter } from "../components/layout/BrandFooter";
import { BrandHeader } from "../components/layout/BrandHeader";
import { Button } from "../components/ui/Button";
import { StickerCard } from "../components/ui/StickerCard";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }

    setSubmitting(true);
    try {
      const session = await login(username.trim(), password);
      const target =
        session.user.rol === "admin"
          ? from
          : "/mesera";
      navigate(target, { replace: true });
    } catch (err) {
      setError(
        err.status === 401
          ? "Usuario o contraseña incorrectos."
          : err.message || "No se pudo iniciar sesión."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-crema">
      <BrandHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <StickerCard elevation="lg" className="w-full max-w-md p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <img
              src="/assets/brand/mascot-confirmed.png"
              alt="Chef de La VeneConsteña"
              className="w-24 h-24 mx-auto object-contain sticker-drop select-none"
            />
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-marron">
              Acceso del equipo
            </h1>
            <p className="text-sm text-marron-muted">
              Inicia sesión como <strong>Admin</strong> o <strong>Mesera</strong>.
              Los clientes piden sin registro desde la carta.
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl bg-rojo-soft border border-rojo/30 px-4 py-3 text-sm font-bold text-rojo-cta"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="block text-sm font-extrabold text-marron"
              >
                Usuario
              </label>
              <div className="relative">
                <User
                  size={18}
                  weight="duotone"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-marron-muted"
                  aria-hidden="true"
                />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-2xl bg-crema border border-borde text-base text-marron focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-extrabold text-marron"
              >
                Contraseña
              </label>
              <div className="relative">
                <LockKey
                  size={18}
                  weight="duotone"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-marron-muted"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-2xl bg-crema border border-borde text-base text-marron focus:outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              <SignIn size={18} weight="bold" aria-hidden="true" />
              <span>{submitting ? "Ingresando..." : "Entrar al panel"}</span>
            </Button>
          </form>
        </StickerCard>
      </main>

      <BrandFooter />
    </div>
  );
}

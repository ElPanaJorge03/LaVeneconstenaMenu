# La VeneConsteña — Aplicación Web de Pedidos (PWA)

Aplicación web mobile-first para **La VeneConsteña** con carta interactiva (Normal/MINI + 15 adicionales), pedidos sin registro (mesa QR, recoger y domicilio), seguimiento en tiempo real, panel de mesera con alerta sonora, pagos Bold (con verificación oficial HMAC-SHA256) y panel de administración completo.

## Arquitectura del monorepo
- `backend/` — Django 5.1, DRF, SimpleJWT, Django Channels (Daphne + Redis), PostgreSQL, `qrcode`
- `frontend/` — React 19, Vite, Tailwind CSS, TanStack Query, Phosphor Icons, PWA (`vite-plugin-pwa`)
- `design-system/la-veneconstena/` — `MASTER.md`, tokens y guías UX por vista
- `.agents/skills/ui-ux-pro-max/` — Skill UI/UX Pro Max integrada

## Correr en local
```powershell
# 1. Backend (HTTP + WebSockets en :8000)
cd backend
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_menu
.\.venv\Scripts\daphne.exe -b 0.0.0.0 -p 8000 config.asgi:application

# 2. Frontend (Vite en :5173)
cd frontend
npm.cmd install
npm.cmd run dev
```

## Rutas principales
- `/` — Carta Viva pública (Promos/Combos, búsqueda, filtro MINI, personalización, carrito y checkout)
- `/mesa/:id` — Carta con mesa preasignada al escanear QR
- `/pedido` y `/pedido/:codigo` — Seguimiento en vivo por código + botón Bold
- `/mesera` — Panel de pedidos en tiempo real con alerta sonora, pedido manual y cobro en efectivo
- `/admin` — Ventas e historial, CRUD Menú, Mesas + descarga QR PNG, Equipo (usuarios/roles) y Configuración del local
- `/login` — Inicio de sesión JWT (`admin` / `mesera`)

## Tests y Build
```powershell
# Backend
cd backend && .\.venv\Scripts\python.exe -m pytest -v

# Frontend
cd frontend && npm.cmd test && npm.cmd run build
```

## Despliegue en Railway
1. Crea un proyecto en Railway y conecta este repositorio.
2. Agrega los servicios **PostgreSQL** y **Redis**.
3. Crea servicio **Backend** usando `backend/railway.toml` y configura las variables de `.env.example` (`SECRET_KEY`, `DEBUG=False`, `DATABASE_URL`, `REDIS_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL`, `BOLD_API_KEY`, `BOLD_SECRET_KEY`, `CLOUDINARY_URL`).
4. Crea servicio **Frontend** usando `frontend/railway.toml` con `VITE_API_URL` y `VITE_WS_URL` apuntando al dominio público del backend.
5. En el portal de Bold configura la URL del webhook apuntando a `https://<tu-backend>/api/v1/pagos/bold/webhook/`.
6. Corre una vez `python manage.py seed_menu` y `python manage.py createsuperuser` en el servicio backend.

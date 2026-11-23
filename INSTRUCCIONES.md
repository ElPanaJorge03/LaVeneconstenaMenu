# INSTRUCCIONES — La VeneConsteña

Lee primero `CONTEXTO.md`. Este archivo define **cómo trabajar** en el proyecto.

## 1. Forma de trabajar
- Responde en **español**, conciso y directo (ahorra tokens). Código y nombres técnicos en inglés cuando sea convención.
- **Si falta información, no asumas ni implementes: pregunta primero** y espera la respuesta.
- Trabaja por fases (ver sección 6). Entrega una fase completa y funcional antes de pasar a la siguiente.
- Antes de cambios grandes (modelos, estructura, dependencias nuevas) explica el plan en pocas líneas.
- No agregues funcionalidades fuera del alcance de `CONTEXTO.md` sin consultarme.

## 2. Estructura del repo (monorepo)
```
/
├── CONTEXTO.md
├── INSTRUCCIONES.md
├── backend/      # Django + DRF + Channels
│   ├── config/   # settings, asgi, urls
│   └── apps/     # usuarios, menu, mesas, pedidos, pagos, local
└── frontend/     # React + Vite + Tailwind
    └── src/      # pages, components, hooks, api, ws, styles
```

## 3. Convenciones de código
**Backend**
- Python 3.12, Django + DRF, una app por dominio. Serializers y ViewSets claros, permisos por rol (`admin`, `mesera`).
- Lógica de negocio en `services.py`, no en las vistas.
- Configuración solo por variables de entorno (`django-environ`). Nunca secretos en el repo.
- Dinero en **enteros (COP)** o `DecimalField`; nunca `float`.
- Migraciones versionadas y tests para pedidos, pagos y permisos.

**Frontend**
- React + hooks, componentes pequeños, Tailwind con tokens de diseño en `tailwind.config` (colores y fuentes de `CONTEXTO.md`).
- Estado de carrito local; datos del servidor con TanStack Query.
- Cliente de WebSocket aislado en `src/ws/` con reconexión automática.
- Accesible y mobile-first; probar en pantallas de 360px.

## 4. Reglas críticas
1. **Pagos Bold:** crear pago desde el backend; confirmar **solo por webhook** con verificación de firma según la documentación oficial de Bold. Nunca confiar en el frontend para marcar un pago como pagado. Llaves solo en variables de entorno.
2. **Pedido de cliente sin login:** identificar por `codigo` aleatorio no adivinable; el seguimiento solo expone datos mínimos.
3. **Permisos:** endpoints de panel solo con JWT y rol correcto. Endpoints públicos limitados (menú, crear pedido, ver estado por código) con throttling.
4. **Validación de precios en backend:** el total siempre se recalcula en el servidor, nunca se acepta el del cliente.
5. **Alerta sonora:** los navegadores bloquean audio sin interacción; incluir botón “Activar sonido” en el panel de la mesera y mostrar su estado.
6. **Tiempo real:** WebSocket para panel y seguimiento del cliente; si cae la conexión, reconectar y refrescar el estado.
7. **Local cerrado:** si `ConfigLocal` está cerrado, el menú se muestra pero no se permite pedir.

## 5. Diseño
- Respetar la identidad de `CONTEXTO.md`: paleta, tipografías, esquinas redondeadas, estilo sticker, mascota.
- Usar variables/tokens, no colores sueltos.
- Textos en español cercano y amable, tono costeño sin exagerar.
- Estados vacíos, de carga y de error con la mascota.

## 6. Fases
1. **Base:** monorepo, Django + DRF, React + Vite + Tailwind, tokens de diseño, Docker/Railway config, CI básica.
2. **Menú:** modelos y CRUD (admin), vista pública del menú.
3. **Pedidos:** carrito, creación de pedido (mesa/recoger/domicilio), código de seguimiento, estados.
4. **Panel mesera:** tiempo real con Channels + Redis, alerta sonora, pedido manual, efectivo.
5. **Mesas y QR:** CRUD de mesas, generación de QR, flujo `/mesa/{id}`.
6. **Pagos Bold:** creación de pago, webhook, estados de pago.
7. **Admin completo:** usuarios/roles, configuración del local, historial y ventas.
8. **Pulido y despliegue:** PWA, pruebas, variables de entorno, deploy en Railway.

## 6.1 Definición de terminado (por fase)
- Funciona en local y en Railway.
- Tests de lo crítico pasan.
- Sin secretos en el repo; `.env.example` actualizado.
- Cumple el diseño y se ve bien en móvil.

## 7. Variables de entorno (esperadas)
`SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `REDIS_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `BOLD_API_KEY`, `BOLD_SECRET_KEY`, `CLOUDINARY_URL`, `VITE_API_URL`, `VITE_WS_URL`.

## 8. Qué NO hacer
- No hardcodear horarios, dirección ni contacto.
- No usar `float` para dinero.
- No exponer datos de otros pedidos ni de usuarios.
- No agregar registro de clientes ni cobro de domicilio (fuera de alcance por ahora).
- No instalar librerías pesadas sin justificarlo.

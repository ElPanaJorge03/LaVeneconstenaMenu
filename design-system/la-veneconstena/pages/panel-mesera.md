# Page Override — Panel Mesera (Tiempo Real)

Hereda `MASTER.md` priorizando **velocidad operativa bajo presión** y **cero errores de toque**:

1. **Densidad alta controlada (8px–16px):** Más tarjetas visibles por pantalla que en la vista cliente, pero manteniendo lectura instantánea del número de pedido, tipo (`Mesa #4` / `Recoger` / `Domicilio`), tiempo transcurrido y lista de ítems + notas resaltadas en mostaza suave.
2. **Control de alerta sonora siempre visible en header:** Botón explícito `"Activar sonido"` / `"Sonido activo"` (cumple bloqueo de autoplay de navegadores) con ícono `SpeakerHigh` / `SpeakerSlash` y estado persistente.
3. **Acciones de un solo toque (≥ 48px):** Botón principal de avance al siguiente estado (`Aceptar y preparar`, `Marcar listo`, `Entregado`) + badge claro de pago (`Efectivo pendiente` con botón `"Marcar pagado"` o `Pagado con Bold`).
4. **Flujo de pedido manual rápido:** Botón prominente `"+ Nuevo pedido mesa"` que abre un selector ágil de mesa + catálogo compacto.
5. **Indicador de conexión WebSocket:** Píldora discreta `En vivo` (verde) o `Reconectando...` (mostaza) con botón de refresco manual si cae la red.

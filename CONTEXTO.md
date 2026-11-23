# CONTEXTO — La VeneConsteña

## 1. Proyecto
Aplicación web para **La VeneConsteña**, restaurante de **comida rápida** de barrio. Su objetivo principal es **recibir pedidos** (menú digital + carrito + pago), tanto de clientes remotos como de clientes en mesa mediante QR. Incluye panel para la mesera y panel de administración.

- Sin cobro de domicilio por ahora.
- Horarios, barrio, dirección y contacto **no están hardcodeados**: se configuran desde el panel admin.

## 2. Usuarios y roles
| Rol | Acceso | Qué hace |
|---|---|---|
| **Cliente** | Público, sin registro | Ve menú, arma carrito, pide (mesa/recoger/domicilio), paga, sigue el estado de su pedido |
| **Mesera** | Login (JWT) | Recibe pedidos con alerta sonora, cambia estados, crea pedidos manuales para clientes en mesa, registra pagos en efectivo |
| **Admin** | Login (JWT) | Todo lo de mesera + gestión de menú, categorías, mesas/QR, usuarios, configuración del local, historial y ventas básicas |

## 3. Funcionalidades

### Cliente
1. Ver menú por categorías, con foto, descripción, precio y adicionales.
2. Carrito: agregar, quitar, editar cantidades, notas por producto.
3. Tipos de pedido: **mesa** (vía QR), **recoger**, **domicilio**.
4. Datos del cliente como invitado: nombre, teléfono, dirección (solo domicilio), notas.
5. Pago: **efectivo** o **online con Bold**.
6. Seguimiento del pedido en tiempo real (`/pedido/{codigo}`).
7. Info del local: horario, ubicación, contacto, estado abierto/cerrado.

### Mesera
1. Panel de pedidos en tiempo real con **alerta sonora** al llegar uno nuevo.
2. Cambiar estado del pedido.
3. Crear pedido manual (clientes físicos en mesa).
4. Marcar pago en efectivo como recibido.

### Admin
1. CRUD de productos, categorías, adicionales, precios y disponibilidad.
2. CRUD de mesas y generación/descarga de QR (`/mesa/{id}`).
3. Gestión de usuarios y roles.
4. Configuración del local (nombre, horarios, dirección, contacto, abierto/cerrado).
5. Historial de pedidos y ventas básicas.

## 4. Flujos clave
- **Pedido remoto:** menú → carrito → datos → pago (efectivo/Bold) → código de seguimiento → panel mesera.
- **Pedido en mesa:** escanea QR → menú con mesa preasignada → pedido → pago (efectivo/Bold).
- **Pedido manual:** mesera crea el pedido en el panel para una mesa.
- **Estados:** `nuevo → preparando → listo → entregado` (+ `cancelado`). Cada cambio se emite por WebSocket al cliente y al panel.
- **Pago Bold:** se crea el pago desde el backend; el estado de pago se confirma **solo por webhook** (nunca por el frontend).

## 5. Stack (aprobado)
| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + Tailwind (PWA, mobile-first) |
| Backend | Django + Django REST Framework |
| Tiempo real | Django Channels (WebSocket) + Redis |
| Base de datos | PostgreSQL |
| Pagos | Bold |
| QR | `qrcode` en backend |
| Imágenes | Cloudinary (o Volume de Railway) |
| Auth | JWT para admin y mesera; cliente sin login |
| Despliegue | Railway (frontend, backend, Postgres, Redis) |

**Repositorio:** monorepo (`/frontend` y `/backend`).

## 6. Modelo de datos (borrador)
`Usuario(rol)`, `Mesa`, `Categoria`, `Producto`, `Adicional`, `Pedido(tipo, estado, mesa?, cliente_nombre, telefono, direccion?, notas, codigo, total)`, `ItemPedido`, `Pago(metodo, estado, referencia_bold)`, `ConfigLocal`.

## 7. Identidad de diseño (basada en el logo)

**Logo:** texto script grueso “La VeneConsteña” con “La” en verde y el resto en rojo, mascota chef kawaii con hamburguesa y pulgar arriba sobre círculo mostaza, contorno blanco tipo sticker.

**Personalidad:** alegre, casera, cercana, costeña, antojadiza.

### Paleta (aproximada del logo; confirmar con el archivo original)
| Token | Hex | Uso |
|---|---|---|
| `--rojo` | `#E4492F` | Color primario, CTAs, precios, énfasis |
| `--verde` | `#8AB544` | Secundario, estados positivos (listo/abierto), acentos |
| `--mostaza` | `#E8B93E` | Acento, badges, destacados |
| `--marron` | `#4A2C25` | Texto principal, contornos |
| `--crema` | `#FFF8EC` | Fondo de la app |
| `--blanco` | `#FFFFFF` | Tarjetas, contorno estilo sticker |
| `--negro` | `#1A1A1A` | Fondo oscuro opcional (el logo luce sobre negro) |

### Tipografía
- **Display/títulos de marca:** Pacifico (script, evoca el logo).
- **Encabezados UI:** Baloo 2 (redondeada, amable).
- **Cuerpo:** Nunito.
- Script solo para títulos cortos; nunca en párrafos ni botones pequeños.

### Estilo visual
- Esquinas muy redondeadas (`rounded-2xl`/`3xl`), botones tipo píldora.
- Tarjetas blancas con **borde/sombra tipo sticker** (contorno blanco grueso + sombra suave).
- Mascota como elemento recurrente: estado vacío, carga, pedido confirmado, error.
- Iconografía redondeada, foto de comida protagonista con fondo cálido.
- Mobile-first: la mayoría de pedidos vendrán del celular.

### Colores de estado de pedido
`nuevo` rojo · `preparando` mostaza · `listo` verde · `entregado` marrón/gris · `cancelado` gris.

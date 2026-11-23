# Design System Master File — La VeneConsteña

> **LOGIC:** Antes de construir cualquier vista, revisa `design-system/la-veneconstena/pages/[page-name].md`.
> Si el archivo de página existe, sus reglas **anulan** (override) las de este archivo maestro.
> Si no existe, sigue estrictamente las reglas de este documento.

---

**Proyecto:** La VeneConsteña  
**Categoría:** Fast Food / Neighborhood Restaurant — Mobile-First Ordering, Kitchen/Waitress Panel & Admin  
**Base metodológica:** `ui-ux-pro-max` (Vibrant & Block-based + Tactile Sticker UI + 3-Step Conversion Funnel) fusionado con la identidad oficial de `CONTEXTO.md` y el logo de marca.  
**Token files:** `tokens.json` (W3C DTCG) · `tokens.css` (CSS Custom Properties)

---

## 1. Identidad & Dirección Visual

- **Personalidad:** Alegre, casera, cercana, costeña, antojadiza — **nunca** genérica ni fría.
- **Estilo:** **Tactile Sticker Craft + High-Clarity Commerce**
  - Fondo cálido crema (`#FFF8EC`) que hace saltar la fotografía de comida y las tarjetas blancas.
  - Tarjetas blancas (`#FFFFFF`) con **borde sticker limpio** (`2px solid #FFFFFF` / contorno cálido `#EFE2CE` + sombra suave cálida en tono marrón `rgba(74, 44, 37, 0.10)`).
  - Esquinas muy redondeadas (`rounded-2xl` 16px, `rounded-3xl` 24px), botones y chips tipo píldora (`rounded-full`).
  - **Jerarquía de 3 segundos:** En cualquier tarjeta de producto el ojo escanea en orden exacto: Foto → Nombre (`Baloo 2`) → Descripción breve (máx. 2 líneas) → Precio en COP (`tabular-nums`) + CTA táctil.
  - **Mascota chef kawaii** como hilo conductor humano en estados vacíos, carga/preparación, pedido confirmado y errores/local cerrado.

---

## 2. Paleta de Marca & Contraste WCAG AA

Todos los pares de texto/fondo han sido verificados contra WCAG 2.1 AA (≥ 4.5:1 texto normal, ≥ 3:1 texto grande / bordes UI).

### Tokens de Marca (`CONTEXTO.md`)

| Token | Hex | CSS Variable | Uso principal |
|-------|-----|--------------|---------------|
| Rojo marca | `#E4492F` | `--rojo` | Identidad, highlights, precios grandes, íconos de énfasis, estado `nuevo` |
| Rojo CTA accesible | `#C8371E` | `--rojo-cta` | Fondo de botones primarios con texto `#FFFFFF` (contraste **5.2:1 AA**) |
| Rojo hover | `#AD2C16` | `--rojo-hover` | Estado hover/pressed en CTAs primarios |
| Rojo suave | `#FDECE8` | `--rojo-soft` | Tinte suave para badges de alerta / estado `nuevo` |
| Verde marca | `#8AB544` | `--verde` | Acentos positivos, abierto, estado `listo` |
| Verde texto accesible | `#426312` | `--verde-text` | Texto sobre `--verde-soft` o `#FFFFFF` (contraste **7.1:1 AAA**) |
| Verde suave | `#EEF6DF` | `--verde-soft` | Fondo de pills positivos (`Abierto`, `Listo`) |
| Mostaza marca | `#E8B93E` | `--mostaza` | Badges destacados, círculo de mascota, estado `preparando` |
| Mostaza texto accesible | `#7A5600` | `--mostaza-text` | Texto/ícono sobre `--mostaza-soft` (contraste **6.1:1 AA**) |
| Mostaza suave | `#FDF4D7` | `--mostaza-soft` | Fondo de pills destacados y estado `preparando` |
| Marrón principal | `#4A2C25` | `--marron` | Texto principal sobre crema/blanco (**12.5:1 AAA**) y texto sobre `--mostaza` (**7.9:1 AAA**) |
| Marrón secundario | `#75564E` | `--marron-muted` | Descripciones, subtítulos, metadatos (**6.4:1 AA**) |
| Crema fondo | `#FFF8EC` | `--crema` | Fondo global de la app |
| Crema elevada | `#FAF0DE` | `--crema-elevated` | Inputs suaves, skeletons, divisores cálidos |
| Blanco sticker | `#FFFFFF` | `--blanco` | Tarjetas, modales, contorno sticker, texto sobre rojo CTA |
| Borde cálido | `#EBDCCB` | `--borde` | Separadores y contornos de tarjetas/inputs |
| Negro opcional | `#1A1A1A` | `--negro` | Hero oscuro opcional o footer de alto contraste donde luce el logo |

### Estados de Pedido (Semántica + Ícono Obligatorio)

> **Regla `ui-ux-pro-max`:** Nunca depender solo del color; cada estado siempre combina **color + ícono Phosphor + texto claro**.

| Estado | Fondo | Texto / Borde | Punto / Ícono |
|--------|-------|---------------|---------------|
| `nuevo` | `--rojo-soft` (`#FDECE8`) | `--rojo-cta` (`#C8371E`) | `BellRinging` |
| `preparando` | `--mostaza-soft` (`#FDF4D7`) | `--mostaza-text` (`#7A5600`) | `CookingPot` |
| `listo` | `--verde-soft` (`#EEF6DF`) | `--verde-text` (`#426312`) | `CheckCircle` |
| `entregado` | `--crema-elevated` (`#FAF0DE`) | `--marron` (`#4A2C25`) | `Package` |
| `cancelado` | `#F1ECE8` | `#6B5E5A` | `XCircle` |

---

## 3. Tipografía

| Rol | Familia | Pesos | Reglas estrictas |
|-----|---------|-------|------------------|
| **Display / Marca** | `Pacifico` | 400 | **Solo** para nombre de marca y titulares cortos del Hero (2–4 palabras). **Nunca** en párrafos, precios, tablas ni botones pequeños. |
| **Encabezados UI** | `Baloo 2` | 600, 700, 800 | Títulos de sección, nombres de categoría, nombres de producto, precios destacados, botones principales. |
| **Cuerpo / UI** | `Nunito` | 400, 500, 600, 700, 800 | Descripciones, inputs, badges, tablas admin, notas, totales (`font-variant-numeric: tabular-nums`). |

**Google Fonts:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;500;600;700;800&family=Pacifico&display=swap" rel="stylesheet" />
```

---

## 4. Espaciado, Elevación Sticker y Movimiento

### Ritmo de 8px
- `--space-1`: `4px` · `--space-2`: `8px` · `--space-3`: `12px` · `--space-4`: `16px` · `--space-6`: `24px` · `--space-8`: `32px` · `--space-12`: `48px` · `--space-16`: `64px`
- Contenedor máximo cliente: `max-w-6xl` con padding responsivo `px-4 sm:px-6 lg:px-8`.
- **Target táctil mínimo:** `min-h-[44px] min-w-[44px]` (`48px` en CTAs primarios y panel mesera), con `gap-2` (≥ 8px) entre controles adyacentes y `touch-action: manipulation`.

### Sombras Sticker (cálidas en base `#4A2C25`)
- `--shadow-sticker-sm`: `0 0 0 3px #FFFFFF, 0 4px 12px rgba(74, 44, 37, 0.08)`
- `--shadow-sticker-md`: `0 0 0 4px #FFFFFF, 0 10px 24px rgba(74, 44, 37, 0.12)`
- `--shadow-sticker-lg`: `0 0 0 5px #FFFFFF, 0 18px 36px rgba(74, 44, 37, 0.16)`
- `--shadow-cta`: `0 8px 20px -4px rgba(200, 55, 30, 0.38)`

### Micro-interacciones
- Duración: `150ms–220ms` con `cubic-bezier(0.22, 1, 0.36, 1)`.
- Feedback táctil inmediato sin mover el layout (`active:scale-[0.98]`, cambios de elevación/color — nunca `scale` que desplace vecinos).
- Respetar estrictamente `@media (prefers-reduced-motion: reduce)`.

---

## 5. Iconografía (`ui-ux-pro-max`)

- **Librería oficial:** **Phosphor Icons** (`@phosphor-icons/react`), peso `duotone` o `bold` en badges/nav y `regular` en UI secundaria.
- **Cero emojis como íconos estructurales** (ni en nav, ni en botones, ni en badges de estado).
- Íconos decorativos junto a texto llevan `aria-hidden="true"`. Botones de solo ícono llevan `aria-label` descriptivo en español.

---

## 6. Anti-Patrones Prohibidos

- ❌ Emojis como íconos UI (`🍔`, `🛒`, `🔔`) → usar `@phosphor-icons/react`.
- ❌ Texto blanco sobre amarillo mostaza `#E8B93E` → usar marrón `#4A2C25`.
- ❌ `Pacifico` en botones, precios o párrafos largos.
- ❌ Colores hex hardcodeados en componentes → usar tokens de Tailwind (`bg-crema`, `text-marron`, `bg-rojo-cta`, etc.).
- ❌ Saltos de layout en hover o carga sin skeletons.
- ❌ `focus:outline-none` sin reemplazo visible → siempre `focus-visible:ring-2 focus-visible:ring-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-crema`.
- ❌ Scroll horizontal en pantallas de `360px` / `375px`.
- ❌ Contenido tapado por barras fijas inferiores (añadir `pb-28` cuando la barra de carrito está activa).
- ❌ Regiones `aria-live` con números sueltos (`3`) → anunciar contexto completo (`"3 productos en tu carrito, total $42.000"`).

---

## 7. Checklist Pre-Entrega (Obligatorio en cada Fase)

- [ ] 0 emojis como íconos estructurales (solo `@phosphor-icons/react` + assets oficiales).
- [ ] Tokens de diseño respetados al 100% (sin hex sueltos en JSX).
- [ ] Contraste WCAG AA ≥ 4.5:1 verificado en textos y estados.
- [ ] `cursor-pointer` y `focus-visible:ring-2` en todos los elementos interactivos.
- [ ] Áreas táctiles ≥ 44×44 px y `gap-2` mínimo en móvil.
- [ ] Probado en **360px**, **768px** y **1280px+** sin overflow horizontal.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Estados vacío, carga y error muestran la mascota chef de La VeneConsteña.

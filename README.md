# Mercado Scout

Calculadora de precio de venta — MercadoLibre Chile. App web simple (HTML +
JS puro, sin backend ni build step, sin dependencias externas) para saber si
conviene vender un producto a un precio dado de MercadoLibre Chile.

*(El nombre visible de la app es "Mercado Scout" — ago-2026. La carpeta, el
repo público y la URL publicada siguen llamándose `ml-price-checker` a
propósito, para no romper el link ya compartido/guardado; solo cambió el
branding dentro de la página: título, logo, favicon.)*

## Qué hace

1. (Opcional) Buscás el producto por nombre, link, o subís una foto — dos
   botones abren la búsqueda en una pestaña nueva sin perder la calculadora:
   - **🔍 Buscar en Google**: si hay foto, resalta la vista previa y te
     indica mantenerla presionada (celular) o clic derecho (computadora)
     para usar "Buscar imagen con Google" del menú nativo del navegador. Si
     no hay foto, busca el texto del nombre/link.
   - **🔍 Buscar en MercadoLibre**: abre el listado de MercadoLibre Chile con
     el nombre/link como texto de búsqueda (solo texto, ML no tiene entrada
     web por foto).
   - Ninguno de los dos trae precios de vuelta a la app — son atajos para
     identificar el producto y ver precios manualmente (ver por qué abajo).
2. Ingresás **precio de compra** y **precio de MercadoLibre**.
3. Tocás **🔎 Sugerir comisión real (según categoría)**: busca categorías
   candidatas según el nombre del producto y te muestra la comisión REAL de
   tu cuenta ML para cada una (ej. "Sellos — Clásica 14.0% ($4.312)") — al
   tocar la que corresponde, precarga el % (editable igual a mano si no
   coincide o preferís poner otro). El **costo de envío** sigue siendo
   manual, con lo que te muestre la calculadora de ML para ese producto (ver
   por qué no se pudo automatizar en `HANDOFF.md`).
4. La calculadora descuenta ese cargo (ya viene con todo incluido, no le
   suma IVA aparte) + el costo de envío + el IVA que hay que declarar sobre
   tu margen (precio de venta - precio de compra).
5. Te muestra la ganancia neta, el ROI real y un veredicto claro: conviene o
   no conviene vender a ese precio.

No hay búsqueda automática de precios ni de listados: el precio de
MercadoLibre se ingresa a mano a propósito (ver "Por qué no hay búsqueda
automática" abajo).

## Por qué no hay búsqueda automática de precios ML

MercadoLibre cerró el acceso a su API de búsqueda (`/sites/{site}/search`)
**incluso para llamadas autenticadas**. Se probó en agosto 2026 con un
`access_token` real, válido, recién refrescado, de una cuenta vendedora real
(power seller) — y devuelve `403 Forbidden` igual.

El bloqueo no es solo del buscador: se probó también con un link de producto
puntual (agosto 2026) — la idea era, dado el link de una publicación ya
identificada, traer su precio automáticamente. Se probó contra una
publicación real (`mercadolibre.cl/.../up/MLCU...`) desde dos ángulos, y
ambos fallan igual:
- **Página del producto (fetch normal, server-side):** MercadoLibre no
  devuelve el HTML — redirige a `gz/account-verification`, su pantalla de
  "tráfico sospechoso" (bot-check), en vez de la página real.
- **API pública de catálogo `/products/{id}`, sin login:** `403 Forbidden`
  directo.

Conclusión: no hay forma gratuita de traer precios de MercadoLibre de forma
automática, ni por búsqueda ni por link puntual. No vale la pena intentar un
scraping para esto sin una sesión de navegador real completa (cookies +
fingerprint), que no es viable de automatizar acá. Por eso el precio de
MercadoLibre es un campo manual — y en este diseño, además, es directamente
el precio que se evalúa (no algo a buscar y promediar).

*(Versiones anteriores de esta app dejaban un Edge Function `buscar-en-mercadolibre`
+ login Supabase por si ML reabría el acceso. Se sacaron en el rediseño de
agosto 2026 al simplificar el formulario — ver `HANDOFF.md` para el historial.)*

## Si editas los archivos y no ves los cambios

Los `.js`/`.css` se cargan con `?v=N` en `index.html` como cache-buster (el
navegador cachea agresivamente los recursos de `file://` por URL exacta,
independiente de que recargues la página — si no subís la versión, podés
seguir viendo código viejo aunque el archivo en disco ya esté actualizado).
Si volvés a editar algo acá, subí ese número en **todos** los
`<script>`/`<link>` de `index.html`, o hacé un hard refresh (Ctrl+Shift+R).

## Cómo abrir

Doble clic en `index.html`. No hace falta servidor: no hay ninguna llamada de
red, todo el cálculo es local.

## Supuestos de la calculadora (Chile) — EDITABLES en `js/config.js`

Verificado con datos reales (agosto 2026: una venta real y la calculadora
oficial de costos de MercadoLibre, capturas del usuario):

- **Cargo por venta**: el % que ML muestra (varía por categoría, ej. 14% o
  15% en los dos ejemplos verificados) ya es el cargo final — **no se le
  suma IVA aparte**, eso estaba mal en una versión anterior de este cálculo.
  Se puede traer automático con el botón "Sugerir comisión real" (llama a
  `supabase/functions/costos-mercadolibre/`, que usa la API oficial de ML
  con el `access_token` de la cuenta conectada) o ingresar a mano — precarga
  con `comisionPct` de `config.js` mientras tanto.
- **Costo de envío**: real y variable (10-13% del precio en los ejemplos
  vistos, no un monto fijo) — depende de peso/dimensión/categoría. Se
  investigó automatizarlo (agosto 2026) pero MercadoLibre en Chile no usa
  código postal como dato principal y el endpoint público lo rechaza incluso
  con datos reales — se ingresa a mano con lo que muestre la calculadora de
  ML para ese producto (ver `HANDOFF.md` para el detalle de la investigación).
- **Cargo fijo por bajo precio**: la vieja referencia de blogs (~$600 bajo
  $19.990) NO apareció en un ejemplo real de $6.990 — está en 0 en
  `config.js` hasta tener evidencia real de cuándo aplica.
- **IVA sobre el margen**: 19% de (precio de venta - precio de compra),
  asumiendo que el precio de compra ya viene con IVA incluido — es lo que
  hay que declarar al SII por la reventa, no un cargo de MercadoLibre.

**Antes de fijar precios reales, verificá el % de comisión sugerido (por si
la categoría detectada no es exactamente la tuya) y el costo real de envío
en tu panel de vendedor de MercadoLibre.**

Ver `HANDOFF.md` para el detalle completo de qué capturas confirmaron cada
número, cómo funciona la automatización de comisión, y qué se investigó y
se descartó para el envío.

## Estructura

```
tools/ml-price-checker/
├── index.html          # producto (búsqueda opcional) + campos + resultado
├── css/styles.css
├── js/
│   ├── config.js        # comisión default, IVA de margen, URL del Edge Function (editable)
│   ├── calculator.js    # lógica pura de cálculo (sin DOM)
│   ├── costos.js        # cliente de costos-mercadolibre (categorías + comisión real)
│   └── app.js            # búsqueda/foto + conecta formulario -> cálculo -> resultado
└── README.md

Función server-side asociada (fuera de esta carpeta, en el proyecto principal):

supabase/functions/costos-mercadolibre/index.ts
```

## Historial de diseño

Ver `HANDOFF.md` para el contexto completo de decisiones tomadas
(rediseño a formulario mínimo en agosto 2026, por qué se sacó cada campo,
qué se probó y se descartó).

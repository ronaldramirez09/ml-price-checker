// config.js
// Parámetros de la calculadora para MercadoLibre Chile (MLC).
//
// El % de comisión es editable en la propia pantalla (varía por categoría —
// verificado con datos reales: 14% en accesorios de auto, 15% en la
// calculadora oficial para otro producto — ver HANDOFF.md). Este valor es
// solo el que se precarga al abrir la calculadora.

const ML_CONFIG = {
  siteId: 'MLC', // Chile
  moneda: 'CLP',

  // Edge Function pública (sin login) del proyecto Supabase de
  // inventario-central que da categorías candidatas + comisión real por
  // categoría, usando el access_token ya conectado de la cuenta ML de abajo.
  // Ver supabase/functions/costos-mercadolibre/index.ts.
  costosApiUrl: 'https://fgagafhucfpzjbbcomqn.supabase.co/functions/v1/costos-mercadolibre',

  // Cuenta de MercadoLibre a usar para traer comisión real ("Mercatodo",
  // la cuenta real conectada — hay otra cuenta demo en el proyecto).
  cuentaIdMercadoLibre: 'cbe940fc-4f32-4470-8c62-b51d46e86741',

  // IVA que hay que declarar sobre el margen de la reventa (precio de venta
  // - precio de compra), asumiendo que el precio de compra ya viene con IVA
  // incluido. Ver la nota en calculator.js sobre cómo se aplica.
  ivaMargenPct: 0.19,

  // Comisión de ML precargada (editable en el formulario). El % real lo
  // muestra ML mismo en su "Costos estimados" al publicar/editar cada
  // producto o en el desglose "Cargos por venta" de cada venta ya
  // concretada — y YA viene con todo incluido, no hay que sumarle IVA.
  comisionPct: 0.15,

  // Cargo fijo por publicación de bajo precio: la calculadora oficial de ML
  // para un producto de $6.990 (ago-2026, ver HANDOFF.md) NO mostró ningún
  // cargo fijo aparte de la comisión + envío — contradice el dato de blogs
  // que decía "~$600 bajo $19.990". Se deja en 0 hasta confirmar con un
  // ejemplo real bajo algún umbral que sí lo muestre; si aparece uno,
  // subir `cargoFijo` y ajustar `cargoFijoUmbralPrecio` acá.
  cargoFijo: 0,
  cargoFijoUmbralPrecio: 19990,
};

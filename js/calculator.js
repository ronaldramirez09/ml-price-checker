// calculator.js
// Lógica pura de cálculo: dado un precio de compra y un precio de venta en
// MercadoLibre, calcula la ganancia neta y el ROI reales después de
// comisión (ya incluye IVA) + cargo fijo + envío + IVA sobre el margen de
// reventa. Sin DOM, sin fetch — solo matemática, para poder testearla/
// reusarla fácil.

/**
 * @param {Object} input
 * @param {number} input.precioCompra            - lo que pagaste por el producto (CLP, ya con IVA incluido)
 * @param {number} input.precioVenta             - precio de venta en MercadoLibre a evaluar (CLP)
 * @param {number} input.comisionPct             - cargo por venta de ML, como fracción (ej. 0.14 = 14%). Es el % TOTAL que muestra ML en su calculadora/Seller Center — ya viene todo incluido, no hay que sumarle IVA aparte (verificado contra una venta real: $30.800 x 14% = $4.312 exacto, sin extra).
 * @param {number} [input.ivaMargenPct]          - IVA que el vendedor debe declarar sobre su margen (venta - compra), como fracción (default 0.19)
 * @param {number} [input.cargoFijo]             - monto del cargo fijo en CLP, para ventas bajo el umbral
 * @param {number} [input.cargoFijoUmbralPrecio] - umbral de precio bajo el cual aplica el cargo fijo (CLP)
 * @param {number} [input.costoEnvio]            - costo de envío que asume el vendedor, en CLP (lo que muestra la calculadora de ML para ese producto — varía por peso/dimensión, no es automático)
 * @returns {Object} resultado del cálculo
 */
function evaluarVentaEnMercadoLibre(input) {
  const {
    precioCompra,
    precioVenta,
    comisionPct,
    ivaMargenPct = 0.19,
    cargoFijo = 0,
    cargoFijoUmbralPrecio = 0,
    costoEnvio = 0,
  } = input;

  if (!(precioCompra > 0)) {
    throw new Error('El precio de compra debe ser mayor a 0.');
  }
  if (!(precioVenta > 0)) {
    throw new Error('El precio de MercadoLibre debe ser mayor a 0.');
  }

  // El cargo fijo no es opcional: MercadoLibre lo aplica automáticamente a
  // las publicaciones bajo el umbral de precio, sin importar lo que elija
  // el vendedor — por eso se calcula solo, a partir del precio de venta,
  // en vez de depender de un checkbox.
  const cargoFijoAplicado = precioVenta < cargoFijoUmbralPrecio ? cargoFijo : 0;

  // comisionPct YA es el cargo total que cobra ML (verificado con datos
  // reales, ver el comentario del parámetro arriba) — no se le suma IVA por
  // separado acá.
  const comisionEfectivaPct = comisionPct;
  const feeVariable = precioVenta * comisionEfectivaPct;

  // IVA que hay que declarar sobre el margen (venta - compra): el precio de
  // compra ya viene con IVA incluido (lo pagaste vos como consumidor final
  // de tu proveedor), así que el IVA a pagar por la reventa se calcula
  // sobre la diferencia nominal venta - compra, no sobre el precio de venta
  // completo. Cálculo simple pedido explícitamente por el usuario (19% de
  // la diferencia en pesos, ej. compra 10.000 / venta 30.000 → IVA = 19% de
  // 20.000 = 3.800) — no es el método de crédito/débito fiscal del SII
  // (que dividiría por 1,19 antes de aplicar el 19%); si en algún momento
  // hace falta ese cálculo más técnico, hay que ajustar esta fórmula.
  const margenBruto = precioVenta - precioCompra;
  const ivaMargen = Math.max(0, margenBruto) * ivaMargenPct;

  // Lo que MercadoLibre efectivamente te transfiere por esa venta (antes de
  // descontar lo que pagaste por el producto y el IVA de margen, que no son
  // cargos de MercadoLibre) — coincide exacto con el "Total" que ML muestra
  // en el desglose de una venta ya concretada.
  const totalMercadoLibre = precioVenta - feeVariable - cargoFijoAplicado - costoEnvio;

  const gananciaNeta = totalMercadoLibre - precioCompra - ivaMargen;
  const roiReal = gananciaNeta / precioCompra;
  const margenSobreVenta = gananciaNeta / precioVenta;

  return {
    precioCompra,
    precioVenta,
    comisionEfectivaPct,
    feeVariable,
    cargoFijoAplicado,
    costoEnvio,
    totalMercadoLibre,
    margenBruto,
    ivaMargen,
    gananciaNeta,
    roiReal,
    margenSobreVenta,
    rentable: gananciaNeta > 0,
  };
}

// Exponer en window para uso directo desde app.js (sin bundler / módulos ES).
window.evaluarVentaEnMercadoLibre = evaluarVentaEnMercadoLibre;

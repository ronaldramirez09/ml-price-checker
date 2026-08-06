// costos.js
// Cliente del Edge Function costos-mercadolibre: categorías candidatas por
// nombre de producto + comisión real por categoría/precio. Ver
// supabase/functions/costos-mercadolibre/index.ts para el detalle de cómo
// se verificó esto contra ventas reales (agosto 2026).

/**
 * @param {string} query - nombre o link del producto
 * @returns {Promise<{candidatos: Array<{categoryId: string, categoryName: string, domainName: string}>, error: string|null}>}
 */
async function sugerirCategorias(query) {
  try {
    const res = await fetch(ML_CONFIG.costosApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'categorias', query, site_id: ML_CONFIG.siteId }),
    });
    const data = await res.json();
    if (!res.ok) return { candidatos: [], error: data.error || `Error ${res.status}` };
    return { candidatos: data.candidatos || [], error: null };
  } catch (err) {
    return { candidatos: [], error: `No se pudo contactar el servicio de categorías: ${err.message}` };
  }
}

/**
 * @param {string} categoryId
 * @param {number} price
 * @returns {Promise<{opciones: Array<{listingTypeId: string, listingTypeName: string, percentageFee: number, saleFeeAmount: number}>, error: string|null}>}
 */
async function obtenerComisionReal(categoryId, price) {
  try {
    const res = await fetch(ML_CONFIG.costosApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'comision',
        category_id: categoryId,
        price,
        site_id: ML_CONFIG.siteId,
        cuenta_id: ML_CONFIG.cuentaIdMercadoLibre,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { opciones: [], error: data.error || `Error ${res.status}` };
    return { opciones: data.opciones || [], error: null };
  } catch (err) {
    return { opciones: [], error: `No se pudo contactar el servicio de comisión: ${err.message}` };
  }
}

window.sugerirCategorias = sugerirCategorias;
window.obtenerComisionReal = obtenerComisionReal;

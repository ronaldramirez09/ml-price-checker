// app.js
// Conecta el formulario con calculator.js y pinta la tarjeta de resultado.
// Sin frameworks, DOM directo.

const $ = (sel) => document.querySelector(sel);

// Foto opcional del producto, para buscar por imagen en Google. Vive en
// memoria (nunca se sube a ningún servidor propio) y se descarta al cambiar
// de producto o quitarla con el botón "Quitar foto".
let fotoProductoSeleccionada = null;

function formatoCLP(valor) {
  if (valor == null || Number.isNaN(valor)) return '—';
  const signo = valor < 0 ? '-' : '';
  return signo + Math.abs(valor).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function formatoPct(valor) {
  if (valor == null || Number.isNaN(valor)) return '—';
  return `${(valor * 100).toFixed(1)}%`;
}

/**
 * Si el texto ingresado parece un link de un producto de MercadoLibre,
 * extrae una query de búsqueda razonable a partir del link (fallback simple:
 * si no es link, se usa tal cual).
 */
function normalizarConsultaProducto(textoOLink) {
  const texto = (textoOLink || '').trim();
  const esLink = /^https?:\/\//i.test(texto);
  if (!esLink) return texto;

  try {
    const url = new URL(texto);
    // El slug del producto suele venir en el path, con guiones en vez de espacios.
    const slug = url.pathname
      .split('/')
      .filter(Boolean)
      .pop() || '';
    const limpio = slug
      .replace(/-/g, ' ')
      .replace(/\b(MLC|MLM|MLA)-?\d+\b/gi, '')
      .replace(/_/g, ' ')
      .trim();
    return limpio || texto;
  } catch {
    return texto;
  }
}

function renderResultado(resultado) {
  const card = $('#tarjetaResultado');
  card.classList.remove('oculto');

  $('#rPrecioCompra').textContent = formatoCLP(resultado.precioCompra);
  $('#rPrecioVenta').textContent = formatoCLP(resultado.precioVenta);
  $('#rComision').textContent = `${formatoPct(resultado.comisionEfectivaPct)} (${formatoCLP(resultado.feeVariable)})`;
  $('#rCostoEnvio').textContent = resultado.costoEnvio > 0 ? formatoCLP(resultado.costoEnvio) : 'No ingresado';
  $('#rCargoFijo').textContent =
    resultado.cargoFijoAplicado > 0 ? formatoCLP(resultado.cargoFijoAplicado) : 'No aplica (precio sobre el umbral)';
  $('#rTotalMl').textContent = formatoCLP(resultado.totalMercadoLibre);
  $('#rIvaMargen').textContent = formatoCLP(resultado.ivaMargen);
  $('#rGananciaNeta').textContent = formatoCLP(resultado.gananciaNeta);
  $('#rRoiReal').textContent = formatoPct(resultado.roiReal);
  $('#rMargen').textContent = formatoPct(resultado.margenSobreVenta);

  const alerta = $('#alertaRentabilidad');
  if (resultado.rentable) {
    alerta.className = 'alerta alerta-ok';
    alerta.textContent = `✅ Conviene venderlo a ${formatoCLP(resultado.precioVenta)}: te queda una ganancia neta de ${formatoCLP(resultado.gananciaNeta)} (ROI ${formatoPct(resultado.roiReal)}).`;
  } else {
    alerta.className = 'alerta alerta-warn';
    alerta.textContent = `⚠️ A ${formatoCLP(resultado.precioVenta)} PIERDES ${formatoCLP(Math.abs(resultado.gananciaNeta))} después de comisión${resultado.cargoFijoAplicado > 0 ? ', cargo fijo' : ''} e IVA sobre el margen. No conviene vender a ese precio.`;
  }
}

function manejarSeleccionFoto(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) {
    fotoProductoSeleccionada = null;
    $('#previewFoto').classList.add('oculto');
    return;
  }

  fotoProductoSeleccionada = file;
  const reader = new FileReader();
  reader.onload = () => {
    $('#previewFotoImg').src = reader.result;
    $('#previewFoto').classList.remove('oculto');
  };
  reader.readAsDataURL(file);
}

function quitarFoto() {
  fotoProductoSeleccionada = null;
  $('#fotoProductoCamara').value = '';
  $('#fotoProductoGaleria').value = '';
  $('#previewFotoImg').src = '';
  $('#previewFoto').classList.add('oculto');
}

function mostrarNotaBusqueda(texto) {
  const nota = $('#notaBusqueda');
  nota.textContent = texto;
  nota.classList.remove('oculto');
}

function ocultarNotaBusqueda() {
  $('#notaBusqueda').classList.add('oculto');
}

// Google no tiene una API pública gratuita para "buscar por foto y devolver
// resultados" (eso es Google Cloud Vision, de pago). Probamos primero
// copiar la foto al portapapeles y abrir Google Lens en pestaña nueva, pero
// en el celular lens.google.com no muestra una caja para pegar la imagen —
// solo empuja a instalar la app. Lo que veníamos usando: el menú nativo del
// navegador sobre la imagen (mantener presionada en celular, clic derecho
// en computadora) trae "Buscar imagen con Google" / "Buscar imagen con
// Google Lens" de fábrica en Chrome y Safari — PERO Chrome viene sacando
// esa opción en versiones nuevas (la reemplazaron por "Preguntar a un
// chatbot de IA", confirmado ago-2026), así que ya no es confiable. Por eso
// ahora se dan dos caminos: si el menú nativo todavía la muestra, esa sigue
// siendo la más directa; si no, "Copiar imagen" sí sigue estando siempre,
// así que abrimos Google Imágenes en una pestaña nueva lista para pegar
// (Ctrl+V) ahí. Si no hay foto, se usa el nombre/link como búsqueda de
// texto normal.
function buscarProductoEnGoogle() {
  ocultarNotaBusqueda();
  const nombreOLink = $('#nombreOLink').value.trim();

  if (fotoProductoSeleccionada) {
    const preview = $('#previewFotoImg');
    preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    preview.classList.add('foto-destacada');
    setTimeout(() => preview.classList.remove('foto-destacada'), 2500);

    mostrarNotaBusqueda(
      '👆 Mantén presionada la foto de arriba (en computadora, clic derecho). Si te aparece "Buscar imagen con Google" o "Buscar imagen con Google Lens", usá esa opción. Si tu navegador no la muestra (pasa en versiones nuevas de Chrome), elegí "Copiar imagen" y pegala (Ctrl+V) en la pestaña de Google Imágenes que se acaba de abrir.',
    );
    window.open('https://images.google.com/', '_blank', 'noopener');
    return;
  }

  if (nombreOLink) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(nombreOLink)}`, '_blank', 'noopener');
    return;
  }

  alert('Sube una foto o escribe el nombre/link del producto para buscarlo en Google.');
}

// MercadoLibre no tiene un punto de entrada web para buscar por foto (a
// diferencia de Google Lens), así que este botón solo funciona con
// nombre/link de texto. Si el usuario solo cargó una foto, lo mandamos
// primero a identificar el producto con "Buscar en Google".
function buscarProductoEnMercadoLibre() {
  ocultarNotaBusqueda();
  const nombreOLink = $('#nombreOLink').value.trim();

  if (!nombreOLink) {
    mostrarNotaBusqueda(
      fotoProductoSeleccionada
        ? '🔎 MercadoLibre no soporta búsqueda por foto en la web. Primero usa "Buscar en Google" para identificar el producto, y después escribe su nombre acá para buscarlo en MercadoLibre.'
        : 'Escribe el nombre o link del producto para buscarlo en MercadoLibre.',
    );
    return;
  }

  const query = normalizarConsultaProducto(nombreOLink);
  window.open(`https://listado.mercadolibre.cl/${encodeURIComponent(query)}`, '_blank', 'noopener');
}

// Busca categorías candidatas para el nombre del producto y, para cada una,
// la comisión real (con el token de la cuenta ML conectada). Pinta botones
// clicables — al tocar uno, precarga ese % en el campo de comisión (que
// sigue siendo editable a mano después).
async function sugerirComision() {
  const nombreOLink = $('#nombreOLink').value.trim();
  const precioVenta = parseFloat($('#precioVenta').value);
  const cont = $('#sugerenciasComision');

  if (!nombreOLink) {
    alert('Escribe el nombre del producto arriba para poder sugerir la categoría.');
    return;
  }
  if (!precioVenta || precioVenta <= 0) {
    alert('Completa el precio en MercadoLibre para poder calcular la comisión real.');
    return;
  }

  const btn = $('#btnSugerirComision');
  btn.disabled = true;
  btn.textContent = 'Buscando...';
  cont.classList.remove('oculto');
  cont.innerHTML = '<p class="muted">Buscando categorías y comisión real...</p>';

  const query = normalizarConsultaProducto(nombreOLink);
  const { candidatos, error: errorCategorias } = await sugerirCategorias(query);

  if (errorCategorias) {
    cont.innerHTML = `<p class="alerta alerta-warn">${errorCategorias}</p>`;
    btn.disabled = false;
    btn.textContent = '🔎 Sugerir comisión real (según categoría)';
    return;
  }
  if (candidatos.length === 0) {
    cont.innerHTML = '<p class="muted">MercadoLibre no encontró categorías para ese nombre — probá con un nombre más genérico o completa el % a mano.</p>';
    btn.disabled = false;
    btn.textContent = '🔎 Sugerir comisión real (según categoría)';
    return;
  }

  const resultados = await Promise.all(
    candidatos.map(async (c) => ({ candidato: c, ...(await obtenerComisionReal(c.categoryId, precioVenta)) })),
  );

  cont.innerHTML = '';
  const titulo = document.createElement('p');
  titulo.className = 'muted';
  titulo.textContent = '¿En cuál de estas categorías publicás? (tocá la que corresponda):';
  cont.appendChild(titulo);

  for (const r of resultados) {
    if (r.error || r.opciones.length === 0) continue;
    for (const op of r.opciones) {
      const opBtn = document.createElement('button');
      opBtn.type = 'button';
      opBtn.className = 'btn-secundario btn-chico sugerencia-comision';
      opBtn.textContent = `${r.candidato.categoryName} (${r.candidato.domainName}) — ${op.listingTypeName} ${formatoPct(op.percentageFee)} (${formatoCLP(op.saleFeeAmount)})`;
      opBtn.addEventListener('click', () => {
        $('#comisionPct').value = (op.percentageFee * 100).toFixed(1);
        cont.querySelectorAll('.sugerencia-comision').forEach((b) => b.classList.remove('sugerencia-elegida'));
        opBtn.classList.add('sugerencia-elegida');
      });
      cont.appendChild(opBtn);
    }
  }

  if (!cont.querySelector('.sugerencia-comision')) {
    cont.innerHTML += '<p class="muted">No se pudo traer la comisión real para estas categorías — completa el % a mano.</p>';
  }

  btn.disabled = false;
  btn.textContent = '🔎 Sugerir comisión real (según categoría)';
}

// Tema claro/oscuro: por defecto sigue el del sistema (prefers-color-scheme
// en styles.css). Si el usuario toca el switch, queda guardado en
// localStorage y desde ahí manda ese valor siempre (ver script inline en el
// <head> de index.html, que lo aplica antes de pintar para no parpadear).
function temaEfectivoActual() {
  const guardado = document.documentElement.getAttribute('data-theme');
  if (guardado === 'light' || guardado === 'dark') return guardado;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function actualizarBotonTema() {
  const btn = $('#btnTema');
  const esOscuro = temaEfectivoActual() === 'dark';
  btn.textContent = esOscuro ? '☀️' : '🌙';
  btn.setAttribute('aria-label', esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
}

function alternarTema() {
  const nuevoTema = temaEfectivoActual() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nuevoTema);
  try {
    localStorage.setItem('mlpc-tema', nuevoTema);
  } catch (e) {
    // Si localStorage no está disponible (modo privado estricto, etc.), el
    // tema igual cambia para esta carga de página, solo no se guarda.
  }
  actualizarBotonTema();
}

function onSubmit(ev) {
  ev.preventDefault();

  const precioCompra = parseFloat($('#precioCompra').value);
  const precioVenta = parseFloat($('#precioVenta').value);
  const comisionPct = parseFloat($('#comisionPct').value) / 100;
  const costoEnvio = parseFloat($('#costoEnvio').value) || 0;

  let resultado;
  try {
    resultado = evaluarVentaEnMercadoLibre({
      precioCompra,
      precioVenta,
      comisionPct,
      ivaMargenPct: ML_CONFIG.ivaMargenPct,
      cargoFijo: ML_CONFIG.cargoFijo,
      cargoFijoUmbralPrecio: ML_CONFIG.cargoFijoUmbralPrecio,
      costoEnvio,
    });
  } catch (e) {
    alert(e.message);
    return;
  }

  renderResultado(resultado);
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    $('#comisionPct').value = (ML_CONFIG.comisionPct * 100).toFixed(1);
    $('#formCalculadora').addEventListener('submit', onSubmit);

    actualizarBotonTema();
    $('#btnTema').addEventListener('click', alternarTema);

    // Dos botones separados en vez de un único <input file>: algunos
    // navegadores móviles solo ofrecen una opción (cámara O galería) según
    // si el input tiene el atributo `capture`, en vez de dejar elegir — con
    // dos inputs ocultos, cada botón fuerza explícitamente su propia opción.
    $('#btnTomarFoto').addEventListener('click', () => $('#fotoProductoCamara').click());
    $('#btnElegirFoto').addEventListener('click', () => $('#fotoProductoGaleria').click());
    $('#fotoProductoCamara').addEventListener('change', manejarSeleccionFoto);
    $('#fotoProductoGaleria').addEventListener('change', manejarSeleccionFoto);
    $('#btnQuitarFoto').addEventListener('click', quitarFoto);
    $('#btnBuscarGoogle').addEventListener('click', buscarProductoEnGoogle);
    $('#btnBuscarMl').addEventListener('click', buscarProductoEnMercadoLibre);
    $('#btnSugerirComision').addEventListener('click', sugerirComision);
  } catch (e) {
    // Si algo revienta acá, mejor mostrarlo en pantalla que dejar la página
    // muda (sin esto, un error de inicialización se ve igual que "no pasó nada").
    console.error('Error inicializando la app:', e);
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<pre style="background:#fdecea;color:#a4262c;padding:1rem;white-space:pre-wrap;">Error inicializando la calculadora: ${e.message}</pre>`,
    );
  }
});

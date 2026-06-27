// Exportación de elementos del DOM a archivo (PDF / PNG).
//
// Antes 5 lugares repetían el mismo setup de html2pdf().set({...}) y 2 imports de las
// libs pesadas (html2pdf.js ~776kB, html2canvas ~201kB) estaban EAGER, entrando al
// bundle de página aunque el usuario no exportara nada. Aquí se centraliza:
//   - una sola fuente del config de html2pdf (cada llamada pasa solo lo que difiere),
//   - import dinámico (lazy): la lib pesada se baja recién al exportar.
//
// NOTA de arquitectura: se usa html2pdf (snapshot visual DOM→canvas→PDF) a propósito.
// pdf-lib (dibujo programático) NO sirve para estos casos: los CVs/informes se renderizan
// como componentes React estilizados y se capturan tal cual. Cambiar a pdf-lib obligaría
// a reposicionar todo por coordenadas y degradaría la fidelidad.

/**
 * Genera un PDF a partir de un elemento del DOM (snapshot visual con html2pdf).
 * Reproduce el config que antes vivía inline en cada call site; solo cambia lo que
 * cada uno pasa por parámetro.
 *
 * @param {HTMLElement} target  nodo a capturar (ej. ref.current o contenedor.firstChild).
 * @param {Object} opts
 * @param {string}  opts.filename
 * @param {number}  [opts.margin=0]
 * @param {number}  [opts.quality=0.98]      calidad JPEG de la imagen embebida.
 * @param {'a4'|number[]} [opts.format='a4'] formato jsPDF ('a4' o [ancho, alto]).
 * @param {'mm'|'px'} [opts.unit='mm']       unidad jsPDF.
 * @param {Object}  [opts.html2canvas={}]    overrides extra de html2canvas (se mergean
 *                                           sobre { scale: 2, useCORS: true }).
 * @param {Object}  [opts.pagebreak]         config de saltos de página (opcional).
 * @param {'save'|'blob'} [opts.output='save'] 'save' descarga el archivo; 'blob' lo devuelve.
 * @returns {Promise<Blob|void>} Blob si output==='blob', si no void (tras descargar).
 */
export async function generarPdf(target, {
  filename,
  margin = 0,
  quality = 0.98,
  format = 'a4',
  unit = 'mm',
  html2canvas = {},
  pagebreak,
  output = 'save',
} = {}) {
  const { default: html2pdf } = await import('html2pdf.js')
  const worker = html2pdf().set({
    margin,
    filename,
    image: { type: 'jpeg', quality },
    html2canvas: { scale: 2, useCORS: true, ...html2canvas },
    jsPDF: { unit, format, orientation: 'portrait' },
    ...(pagebreak ? { pagebreak } : {}),
  }).from(target)
  return output === 'blob' ? worker.outputPdf('blob') : worker.save()
}

/**
 * Descarga un elemento del DOM como PNG (html2canvas).
 * @param {HTMLElement} target
 * @param {Object} opts
 * @param {string} opts.filename
 * @param {string} [opts.backgroundColor='#ffffff']
 * @param {number} [opts.scale=2]
 * @returns {Promise<void>}
 */
export async function descargarPng(target, { filename, backgroundColor = '#ffffff', scale = 2 } = {}) {
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(target, { scale, useCORS: true, backgroundColor, logging: false })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

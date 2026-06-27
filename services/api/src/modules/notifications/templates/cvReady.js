// Template del email "CV optimizado listo".
// Separado de la lógica para que el service no cargue HTML inline.

function cvReadyEmail({ format }) {
  const formatLabel = format === 'word' ? 'Word' : 'PDF';
  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1C1C1E;">Tu CV optimizado está listo</h2>
      <p style="color: #6b7280;">Adjunto encontrarás tu CV en formato ${formatLabel}, listo para enviar a reclutadores.</p>
      <p style="color: #6b7280; font-size: 13px;">Generado con <strong>ELVIA</strong> — sin inventar información, solo mejoramos lo que ya tienes.</p>
    </div>
  `;
}

module.exports = { cvReadyEmail };

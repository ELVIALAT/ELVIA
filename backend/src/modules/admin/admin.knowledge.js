// admin.knowledge — base de conocimiento (RAG) del Bot ELVIA.
//   POST /knowledge/upload → sube PDF/TXT, lo chunkea (~1000 chars) e inserta
//                            en elvia_knowledge (búsqueda de texto, sin embedding).
//   GET  /knowledge/logs   → historial de documentos cargados.
// Solo super_admin.

const express = require('express')
const multer = require('multer')
const pdfParse = require('pdf-parse')
const auth = require('../../middleware/auth')
const requireRole = require('../../middleware/requireAdmin')
const { supabaseAdmin } = require('../../lib/supabase')

const router = express.Router()
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB

router.post('/knowledge/upload', auth, requireRole('super_admin'), upload.single('file'), async (req, res) => {
  console.log('[KnowledgeUpload] Inicio de proceso para archivo:', req.file?.originalname)

  if (!req.file) {
    return res.status(400).json({ error: 'Debes enviar un archivo (file).' })
  }

  try {
    const file = req.file
    let text = ''

    console.log('[KnowledgeUpload] Extrayendo texto...')
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer)
      text = data.text
    } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
      text = file.buffer.toString('utf-8')
    } else {
      console.error('[KnowledgeUpload] Formato no soportado:', file.mimetype)
      return res.status(400).json({ error: 'Formato no soportado. Sube PDF o TXT.' })
    }

    if (!text || !text.trim()) {
      console.error('[KnowledgeUpload] Texto extraído vacío.')
      return res.status(400).json({ error: 'El archivo está vacío o no se pudo extraer texto.' })
    }

    console.log(`[KnowledgeUpload] Texto extraído con éxito (${text.length} caracteres).`)

    // Dividir texto en chunks de ~1000 caracteres por párrafo.
    const paragraphs = text.split(/\n\s*\n/)
    const chunks = []
    let currentChunk = ''
    for (const p of paragraphs) {
      if ((currentChunk.length + p.length) > 1000 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      currentChunk += p + '\n\n'
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim())

    console.log(`[KnowledgeUpload] Chunks generados: ${chunks.length}`)
    console.log('[KnowledgeUpload] Iniciando inserción en Supabase (Búsqueda de Texto)...')

    // Insertar chunks de forma masiva.
    const rows = chunks.map((chunk, i) => ({
      content: chunk,
      metadata: { filename: file.originalname, chunk_index: i },
      // El embedding queda nulo: usamos búsqueda de texto.
    }))

    const { error: insertError } = await supabaseAdmin.from('elvia_knowledge').insert(rows)

    if (insertError) {
      console.error('[KnowledgeUpload] Error al insertar:', insertError.message)
      throw new Error('Error al guardar los fragmentos en la base de datos.')
    }

    const insertCount = chunks.length
    console.log(`[KnowledgeUpload] Proceso finalizado. Insertados: ${insertCount}/${chunks.length} fragmentos.`)

    // Registrar en el historial.
    await supabaseAdmin.from('knowledge_logs').insert({
      filename: file.originalname,
      file_size_bytes: file.size,
      total_chunks: insertCount,
    })

    res.json({ ok: true, message: `Documento procesado. ${insertCount} fragmentos agregados a la IA.` })
  } catch (err) {
    console.error('[KnowledgeUpload] ERROR CRÍTICO:', err)
    res.status(500).json({ error: `Error procesando el documento: ${err.message}` })
  }
})

router.get('/knowledge/logs', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('knowledge_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('[Admin] Error listando logs de conocimiento:', err.message)
    res.status(500).json({ error: 'Error al obtener el historial.' })
  }
})

module.exports = router

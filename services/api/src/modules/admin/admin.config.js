// admin.config — POST /config: upsert de configuración del sitio (SEO, copy,
// landing). Tabla landing_config, keyed por config_key. Solo super_admin.

const express = require('express')
const auth = require('../../middleware/auth')
const requireRole = require('../../middleware/requireAdmin')
const { supabase } = require('../../lib/supabase')

const router = express.Router()

router.post('/config', auth, requireRole('super_admin'), async (req, res) => {
  const { config_key, config_value } = req.body

  if (!config_key) {
    return res.status(400).json({ error: 'config_key es requerido' })
  }

  try {
    const { error } = await supabase
      .from('landing_config')
      .upsert({ config_key, config_value, updated_at: new Date().toISOString() }, { onConflict: 'config_key' })

    if (error) throw error
    res.json({ ok: true, message: `Configuración '${config_key}' actualizada.` })
  } catch (err) {
    console.error('[Admin] Error actualizando config:', err.message)
    res.status(500).json({ error: 'Error actualizando configuración' })
  }
})

module.exports = router

// features/career-project/utils.js
// Helpers puros del Gerente de Búsqueda / Proyecto Laboral.
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 2).
import {
  MONEDA_POR_PAIS, INDICATIVOS, PRESTACIONES_POR_PAIS,
  MONEDAS_US, TASAS_DESDE_MXN,
} from './constants'

export const detectarMoneda=(p)=>MONEDA_POR_PAIS[p]||'USD'
export const indicativoPorPais=(p)=>{
  const e=INDICATIVOS.find(i=>i.label===p||i.label.startsWith((p||'').split(' ')[0]))
  return e?.ind||'+1'
}
export const getPrestaciones=(p)=>PRESTACIONES_POR_PAIS[p]||PRESTACIONES_POR_PAIS['default']
export const soloNumericos = (val, moneda) => {
  if (MONEDAS_US.includes(moneda)) return val.replace(/[^0-9.]/g, '')
  return val.replace(/[^0-9,]/g, '')
}
export const formatearMonto = (val, moneda) => {
  if (!val) return ''
  const isUS = MONEDAS_US.includes(moneda)
  const dec = isUS ? '.' : ','
  const mil = isUS ? ',' : '.'
  const clean = isUS ? val.replace(/[^0-9.]/g, '') : val.replace(/[^0-9,]/g, '')
  const parts = clean.split(dec)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, mil)
  return parts.join(dec)
}
export const parseMonto = (val, moneda) => {
  if (!val) return 0
  const isUS = MONEDAS_US.includes(moneda)
  const clean = isUS ? val.replace(/,/g, '') : val.replace(/\./g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

export function convertirDesdeMXN(montoMXN, moneda) {
  const tasa = TASAS_DESDE_MXN[moneda] || 1
  return Math.round(montoMXN * tasa)
}

export const sanitizarTexto = (txt) => {
  if (!txt) return ''
  return txt.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
}

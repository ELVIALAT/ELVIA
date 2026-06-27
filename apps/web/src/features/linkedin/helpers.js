// features/linkedin/helpers.js
// Helpers de LinkedIn Optima: colores por puntaje (puro) y copia al portapapeles.
// Extraído verbatim desde pages/LinkedinPro.jsx (Fase 3).
import toast from 'react-hot-toast'

// Colores y labels por puntaje
export function colorPuntaje(score) {
  if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', label: 'Excelente', labelBg: 'bg-emerald-100', labelText: 'text-emerald-700' }
  if (score >= 60) return { text: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    bar: 'bg-blue-500',    label: 'Bueno',     labelBg: 'bg-blue-100',    labelText: 'text-blue-700'    }
  if (score >= 40) return { text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500',   label: 'Regular',   labelBg: 'bg-amber-100',   labelText: 'text-amber-700'   }
  return               { text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500',     label: 'Urgente',   labelBg: 'bg-red-100',     labelText: 'text-red-700'     }
}

// Copia al portapapeles + toast (helper compartido por las cards de sección).
export const copiarPortapapeles = async (texto, etiqueta) => {
  if (!texto) return
  try {
    await navigator.clipboard.writeText(texto)
    toast.success(`${etiqueta} copiado al portapapeles`)
  } catch {
    toast.error('No pudimos copiar — intenta seleccionar el texto manualmente')
  }
}

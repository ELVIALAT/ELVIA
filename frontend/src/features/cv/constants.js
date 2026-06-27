// features/cv/constants.js
// Constantes (datos puros) de la Factoría CV (wizard "Crear CV desde cero").
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
// Nota: HABILIDADES_COMUNES del original quedó fuera por estar sin uso (dead code).

export const PASOS = [
  { id: 'datos',       label: 'Datos Personales',    icon: '👤' },
  { id: 'resumen',     label: 'Resumen Profesional',  icon: '📝' },
  { id: 'experiencia', label: 'Experiencia Laboral',  icon: '💼' },
  { id: 'educacion',   label: 'Educación',            icon: '🎓' },
  { id: 'habilidades', label: 'Habilidades',          icon: '⭐' },
  { id: 'idiomas',     label: 'Idiomas',              icon: '🌍' },
  { id: 'preview',     label: 'Vista Previa',         icon: '👁️' },
]

export const NIVELES_CEFR   = ['Nativo', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1']
export const IDIOMAS_LIST   = ['Español', 'Inglés', 'Francés', 'Portugués', 'Alemán', 'Italiano', 'Japonés']
export const PAISES         = ['México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Brasil', 'España', 'Estados Unidos', 'Otro']

export const ESTADO_EMPTY = {
  nombre: '', nombre2: '', apellido: '', apellido2: '',
  email: '', indicativo: '+52', telefono: '', ciudad: '', pais: '',
  cargo_objetivo: '',
  resumen: '',
  experiencias: [{ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }],
  educacion:    [{ institucion: '', titulo: '', anio: '' }],
  habilidades: [],
  idiomas:     [],
}

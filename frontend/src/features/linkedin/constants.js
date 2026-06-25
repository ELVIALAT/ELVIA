// features/linkedin/constants.js
// Constantes (datos puros) de LinkedIn Optima.
// Extraído verbatim desde pages/LinkedinPro.jsx (Fase 3).

export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Secciones del perfil a analizar
export const SECCIONES = [
  {
    id: 'titular',
    label: 'Titular (Headline)',
    placeholder: 'Ej: Senior Product Manager | SaaS B2B | +8 años liderando equipos de producto en LATAM',
    descripcion: 'La línea debajo de tu nombre. Máx 220 caracteres.',
    maxLength: 220,
    rows: 2,
  },
  {
    id: 'extracto',
    label: 'Extracto (About)',
    placeholder: 'Pega aquí tu sección "Acerca de" completa...',
    descripcion: 'Tu resumen personal. Máx 2.600 caracteres.',
    maxLength: 2600,
    rows: 5,
  },
  {
    id: 'experiencia',
    label: 'Experiencia',
    placeholder: 'Empresa ABC · Gerente de Marketing Digital\nene. 2022 – presente · 3 años\nBogotá, Colombia\nLideré un equipo de 8 personas y aumenté la tasa de conversión en 35%...\n\nEmpresa XYZ · Jefe de Producto\nmar. 2019 – dic. 2021 · 2 años 10 meses\nMedellín, Colombia\nDesarrollé el roadmap de producto SaaS para 50 000 usuarios activos...',
    descripcion: 'Copia cada cargo con empresa, fechas y descripción. Ordena del más reciente al más antiguo.',
    maxLength: 5000,
    rows: 10,
  },
  {
    id: 'habilidades',
    label: 'Aptitudes (Skills)',
    placeholder: 'Ej: Product Management, Agile, Scrum, SQL, Tableau, Liderazgo de equipos...',
    descripcion: 'Lista tus aptitudes principales, separadas por coma. LinkedIn las llama "Skills".',
    maxLength: 1000,
    rows: 3,
  },
  {
    id: 'idiomas',
    label: 'Idiomas (Languages)',
    placeholder: 'Ej: Español (Nativo), Inglés (B2 – Avanzado), Portugués (A2 – Básico)...',
    descripcion: 'Idiomas que manejas y nivel de dominio.',
    maxLength: 300,
    rows: 2,
  },
  {
    id: 'educacion',
    label: 'Educación',
    placeholder: 'Institución — Título | Año\nActividades o logros relevantes...',
    descripcion: 'Instituciones, títulos y años.',
    maxLength: 1000,
    rows: 3,
  },
]

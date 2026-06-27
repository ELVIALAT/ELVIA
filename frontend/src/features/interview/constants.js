// features/interview/constants.js
// Constantes (datos puros) del Simulador de Entrevista.
// Extraído verbatim desde pages/Entrevista.jsx (Fase 3).

export const ENTREVISTADORES = [
  { value: 'HR',             label: 'HR / Recursos Humanos',  desc: 'Cultura, motivación y fit' },
  { value: 'Hiring Manager', label: 'Hiring Manager',          desc: 'Técnico y casos prácticos' },
  { value: 'Headhunter',     label: 'Headhunter',              desc: 'Logros y propuesta de valor' },
]

export const NUM_PREGUNTAS = [5, 7, 10]

export const TIPO_FEEDBACK = [
  { value: 'final',    label: 'Al final',          desc: 'Recibe todo el feedback al terminar' },
  { value: 'pregunta', label: 'Por pregunta',       desc: 'Feedback inmediato tras cada respuesta' },
]

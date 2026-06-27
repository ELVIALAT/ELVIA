// features/profile/constants.js
// Catálogos y helpers del Perfil (mismo que Onboarding). Extraído verbatim de pages/Perfil.jsx (Fase 3 refinamiento).

export const PAISES_LATAM = [
  'México','Colombia','Argentina','Chile','Perú','Venezuela','Ecuador','Bolivia',
  'Uruguay','Paraguay','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua',
  'Panamá','República Dominicana','Cuba','España','Estados Unidos','Canadá','Brasil','Otro',
]

export const INDICATIVOS = [
  { code:'MX', label:'México',             ind:'+52'  },
  { code:'CO', label:'Colombia',           ind:'+57'  },
  { code:'AR', label:'Argentina',          ind:'+54'  },
  { code:'CL', label:'Chile',              ind:'+56'  },
  { code:'PE', label:'Perú',               ind:'+51'  },
  { code:'VE', label:'Venezuela',          ind:'+58'  },
  { code:'EC', label:'Ecuador',            ind:'+593' },
  { code:'BO', label:'Bolivia',            ind:'+591' },
  { code:'UY', label:'Uruguay',            ind:'+598' },
  { code:'PY', label:'Paraguay',           ind:'+595' },
  { code:'CR', label:'Costa Rica',         ind:'+506' },
  { code:'GT', label:'Guatemala',          ind:'+502' },
  { code:'HN', label:'Honduras',           ind:'+504' },
  { code:'SV', label:'El Salvador',        ind:'+503' },
  { code:'NI', label:'Nicaragua',          ind:'+505' },
  { code:'PA', label:'Panamá',             ind:'+507' },
  { code:'DO', label:'Rep. Dominicana',    ind:'+1'   },
  { code:'CU', label:'Cuba',               ind:'+53'  },
  { code:'ES', label:'España',             ind:'+34'  },
  { code:'US', label:'Estados Unidos',     ind:'+1'   },
  { code:'CA', label:'Canadá',             ind:'+1'   },
  { code:'BR', label:'Brasil',             ind:'+55'  },
  { code:'XX', label:'Otro',               ind:''     },
]

export const indicativoPorPais = (pais) => {
  const entry = INDICATIVOS.find(i => i.label === pais || i.label.startsWith(pais?.split(' ')[0] || ''))
  return entry?.ind || '+1'
}

export const NIVELES_CARGO = ['Asesor externo','Analista','Asistente','Jefe','Coordinador','Gerente','Director','C-Level']

export const INDUSTRIAS_LATAM = [
  'Manufactura e Industria','Tecnología y Software','Banca y Servicios Financieros',
  'Seguros','Comercio y Retail','Salud y Farmacéutica','Agroindustria y Alimentos',
  'Construcción e Infraestructura','Energía y Petróleo','Telecomunicaciones',
  'Logística y Transporte','Consultoría','Educación','Gobierno y Sector Público',
  'Medios y Entretenimiento','Turismo y Hospitalidad','Automotriz','Minería',
  'Bienes Raíces','Marketing y Publicidad','Legal y Jurídico','Recursos Humanos',
  'Startups y Emprendimiento','Otro',
]

export const AREAS = ['Operaciones','Supply Chain','Finanzas','IT','R&D','Recursos Humanos','Ingeniería','Dirección General','Marketing','Ventas','Legal','Otro']
export const TIPOS_TRABAJO = ['Híbrido','Presencial','Remoto']
export const IDIOMAS = ['Español','Inglés','Francés','Portugués','Alemán','Italiano','Chino Mandarín','Japonés','Árabe','Coreano','Ruso','Otro']
export const NIVELES_CEFR = ['Nativo','C2','C1','B2','B1','A2','A1']
export const NIVELES_EDUCACION = ['Preparatoria / Bachillerato','Técnico / Tecnólogo','Universidad / Licenciatura','Especialización','Maestría','Doctorado','Certificación Profesional']
export const EXPERIENCIAS = [
  { value: 0, label: 'Sin experiencia' },{ value: 1, label: '1-2 años' },
  { value: 3, label: '3-5 años' },{ value: 6, label: '6-10 años' },{ value: 11, label: 'Más de 10 años' },
]

export const PRESTACIONES_POR_PAIS = {
  'México': ['IMSS','INFONAVIT','AFORE','Aguinaldo (30 días)','Prima vacacional','Seguro de gastos médicos','Seguro de vida','Vales de despensa','Fondo de ahorro','Auto de empresa','Caja de ahorro','Car allowance','House allowance','Viáticos'],
  'Colombia': ['EPS (salud)','Pensión','ARL','Prima de servicios','Cesantías','Vacaciones adicionales','Dotación','Caja de compensación','Seguro de vida'],
  'Argentina': ['Obra social','ART','SAC (aguinaldo)','Jubilación','Vacaciones legales','Plan médico privado','Seguro de vida'],
  'Chile': ['AFP','Isapre / Fonasa','Seguro de cesantía','Gratificación legal','Seguro de accidentes'],
  'Perú': ['EsSalud','AFP / ONP','Gratificación','CTS','Seguro de vida ley','Vacaciones'],
  'Venezuela': ['IVSS','Bono de alimentación','Utilidades','Cesta ticket','Seguro médico'],
  'Ecuador': ['IESS','Décimo tercer sueldo','Décimo cuarto sueldo','Fondos de reserva','Vacaciones'],
  'default': ['Seguro médico','Seguro de vida','Bono anual de desempeño','Plan de pensión','Vehículo / viáticos','Vacaciones adicionales','Flexibilidad horaria','Home office','Capacitación y desarrollo'],
}
export const getPrestaciones = (pais) => PRESTACIONES_POR_PAIS[pais] || PRESTACIONES_POR_PAIS['default']

export const MEXICO_DETALLE = {
  'Aguinaldo (30 días)':     { tipo: 'dias',     label: 'Días',          default: '30'      },
  'Prima vacacional':        { tipo: 'pct',      label: '% prima',       default: '25'      },
  'Seguro de gastos médicos':{ tipo: 'selector', label: 'Cobertura',     opciones: ['Personal','Familiar'], default: 'Personal' },
  'Vales de despensa':       { tipo: 'monto',    label: 'Monto mensual', default: ''        },
  'Fondo de ahorro':         { tipo: 'pct',      label: '% fondo',       default: ''        },
  'Auto de empresa':         { tipo: 'monto',    label: 'Valor / mes',   default: ''        },
  'Car allowance':           { tipo: 'monto',    label: 'Monto mensual', default: ''        },
  'House allowance':         { tipo: 'monto',    label: 'Monto mensual', default: ''        },
  'Viáticos':                { tipo: 'monto',    label: 'Monto mensual', default: ''        },
}

export const MONEDAS = [
  { code:'MXN',symbol:'$' },{ code:'COP',symbol:'$' },{ code:'ARS',symbol:'$' },
  { code:'CLP',symbol:'$' },{ code:'PEN',symbol:'S/' },{ code:'USD',symbol:'$' },
  { code:'EUR',symbol:'€' },{ code:'BRL',symbol:'R$' },{ code:'UYU',symbol:'$' },
]
export const MONEDA_POR_PAIS = {
  'México':'MXN','Colombia':'COP','Argentina':'ARS','Chile':'CLP','Perú':'PEN',
  'Uruguay':'UYU','Venezuela':'USD','Ecuador':'USD','El Salvador':'USD','Panamá':'USD',
  'España':'EUR','Estados Unidos':'USD','Canadá':'CAD','Brasil':'BRL',
}
export const detectarMoneda = (pais) => MONEDA_POR_PAIS[pais] || 'USD'

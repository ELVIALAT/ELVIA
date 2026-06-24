// features/career-project/constants.js
// Constantes (datos puros) del Gerente de Búsqueda / Proyecto Laboral.
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 1).
import {
  Brain, CalendarCheck, Toolbox, FileMagnifyingGlass,
  LinkedinLogo, MagnifyingGlass, Robot, Notepad,
  CheckCircle, User, Sparkle,
} from '@phosphor-icons/react'
import { RECURSOS_DEFAULT as RECURSOS_DEFAULT_BASE } from '../../utils/progresoLaboral'

export const PILARES = [
  { id: 'perfil',           label: 'Mi Perfil',           icon: User,                color: 'indigo', weight: 20 },
  { id: 'autoconocimiento', label: 'Competencias',         icon: Brain,               color: 'violet', weight: 20 },
  { id: 'recursos',         label: 'Gastos',               icon: Toolbox,             color: 'blue',   weight: 10 },
  { id: 'semana',           label: 'Horario semanal',      icon: CalendarCheck,       color: 'teal',   weight: 10 },
  { id: 'oferta',           label: 'Mi oferta de valor',   icon: Sparkle,             color: 'rose',   weight: 30 },
  { id: 'documentos',       label: 'Optimizador de CV',    icon: FileMagnifyingGlass, color: 'amber',  weight: 10 },
]

// ─── Catálogos para Mi Perfil ─────────────────────────────────────────────────
export const PAISES_LATAM = [
  'México','Colombia','Argentina','Chile','Perú','Venezuela','Ecuador','Bolivia',
  'Uruguay','Paraguay','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua',
  'Panamá','República Dominicana','Cuba','España','Estados Unidos','Canadá','Brasil','Otro',
]
export const INDICATIVOS = [
  {code:'MX',label:'México',ind:'+52'},{code:'CO',label:'Colombia',ind:'+57'},
  {code:'AR',label:'Argentina',ind:'+54'},{code:'CL',label:'Chile',ind:'+56'},
  {code:'PE',label:'Perú',ind:'+51'},{code:'VE',label:'Venezuela',ind:'+58'},
  {code:'EC',label:'Ecuador',ind:'+593'},{code:'BO',label:'Bolivia',ind:'+591'},
  {code:'UY',label:'Uruguay',ind:'+598'},{code:'PY',label:'Paraguay',ind:'+595'},
  {code:'CR',label:'Costa Rica',ind:'+506'},{code:'GT',label:'Guatemala',ind:'+502'},
  {code:'HN',label:'Honduras',ind:'+504'},{code:'SV',label:'El Salvador',ind:'+503'},
  {code:'NI',label:'Nicaragua',ind:'+505'},{code:'PA',label:'Panamá',ind:'+507'},
  {code:'DO',label:'Rep. Dominicana',ind:'+1'},{code:'CU',label:'Cuba',ind:'+53'},
  {code:'ES',label:'España',ind:'+34'},{code:'US',label:'Estados Unidos',ind:'+1'},
  {code:'CA',label:'Canadá',ind:'+1'},{code:'BR',label:'Brasil',ind:'+55'},
  {code:'XX',label:'Otro',ind:''},
]
export const MONEDA_POR_PAIS = {
  'México':'MXN','Colombia':'COP','Argentina':'ARS','Chile':'CLP','Perú':'PEN',
  'Uruguay':'UYU','Venezuela':'USD','Ecuador':'USD','El Salvador':'USD','Panamá':'USD',
  'España':'EUR','Estados Unidos':'USD','Canadá':'CAD','Brasil':'BRL',
}
export const PRESTACIONES_POR_PAIS = {
  'México':['IMSS','INFONAVIT','Días de vacaciones','Aguinaldo','Prima vacacional','Seguro de gastos médicos','Seguro de vida','Vales de despensa','Vales de gasolina','Otros vales','Fondo de ahorro','Auto de empresa','Car allowance','Viáticos','PTU','AFORE'],
  'Colombia':['EPS (salud)','Pensión','ARL','Prima de servicios','Cesantías','Vacaciones adicionales','Dotación','Caja de compensación','Seguro de vida'],
  'Argentina':['Obra social','ART','SAC (aguinaldo)','Jubilación','Plan médico privado','Seguro de vida'],
  'Chile':['AFP','Isapre / Fonasa','Seguro de cesantía','Gratificación legal'],
  'Perú':['EsSalud','AFP / ONP','Gratificación','CTS','Seguro de vida ley'],
  'default':['Seguro médico','Seguro de vida','Bono anual','Plan de pensión','Vehículo / viáticos','Vacaciones adicionales','Flexibilidad horaria','Home office'],
}
export const NIVELES_CARGO=['Asesor externo','Analista','Asistente','Jefe','Coordinador','Gerente','Director','C-Level']
export const INDUSTRIAS_LATAM=[
  'Manufactura e Industria','Tecnología y Software','Banca y Servicios Financieros',
  'Seguros','Comercio y Retail','Salud y Farmacéutica','Agroindustria y Alimentos',
  'Construcción e Infraestructura','Energía y Petróleo','Telecomunicaciones',
  'Logística y Transporte','Consultoría','Educación','Gobierno y Sector Público',
  'Medios y Entretenimiento','Turismo y Hospitalidad','Automotriz','Minería',
  'Bienes Raíces','Marketing y Publicidad','Legal y Jurídico','Recursos Humanos',
  'Startups y Emprendimiento',
]
export const AREAS_FUNC=['Operaciones','Supply Chain','Finanzas','IT','R&D','Recursos Humanos','Ingeniería','Dirección General','Marketing','Ventas','Legal','Otro']
export const TIPOS_TRABAJO=['Híbrido','Presencial','Remoto']
export const IDIOMAS_LIST=['Español','Inglés','Francés','Portugués','Alemán','Italiano','Chino Mandarín','Japonés','Árabe','Otro']
export const NIVELES_CEFR=['Nativo','C2','C1','B2','B1','A2','A1']
export const NIVELES_EDUCACION=['No profesional','Profesional','Postgrado']
export const MONEDAS_LIST=[{code:'MXN',symbol:'$'},{code:'COP',symbol:'$'},{code:'ARS',symbol:'$'},{code:'CLP',symbol:'$'},{code:'PEN',symbol:'S/'},{code:'USD',symbol:'$'},{code:'EUR',symbol:'€'},{code:'BRL',symbol:'R$'},{code:'UYU',symbol:'$'}]
export const MONEDAS_US=['MXN','USD','CAD']
export const MEXICO_DETALLE={
  'Días de vacaciones':     { tipo:'dias',     label:'Días',          default:'12'       },
  'Aguinaldo':              { tipo:'dias',     label:'Días',          default:'30'       },
  'Prima vacacional':       { tipo:'pct',      label:'% prima',       default:'25'       },
  'Seguro de gastos médicos':{ tipo:'selector', label:'Cobertura',    opciones:['Personal','Familiar'], default:'Personal' },
  'Vales de despensa':      { tipo:'monto',    label:'Monto mensual', default:''         },
  'Vales de gasolina':      { tipo:'monto',    label:'Monto mensual', default:''         },
  'Otros vales':            { tipo:'monto',    label:'Monto mensual', default:''         },
  'Fondo de ahorro':        { tipo:'pct',      label:'% fondo',       default:''         },
  'Auto de empresa':        { tipo:'monto',    label:'Valor / mes',   default:''         },
  'Car allowance':          { tipo:'monto',    label:'Monto mensual', default:''         },
  'House allowance':        { tipo:'monto',    label:'Monto mensual', default:''         },
  'Viáticos':               { tipo:'monto',    label:'Monto mensual', default:''         },
  'PTU':                    { tipo:'monto',    label:'Monto anual',   default:''         },
}
export const CIUDADES_SUGERIDAS=['México','Colombia','Argentina','Chile','Perú','Brasil','Estados Unidos','España','Portugal','Asia','Remoto','Otro']
export const ANIOS_EXP=['Menos de 1','1-2','3-5','6-10','11-15','16-20','Más de 20']

export const COLORES = {
  indigo: {
    pill:   'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    active: 'bg-indigo-600 text-white border-indigo-600',
    header: 'bg-indigo-50 border-indigo-100',
    icon:   'text-indigo-600',
    bar:    'bg-indigo-500',
    soft:   'bg-indigo-50',
    badge:  'bg-indigo-100 text-indigo-700',
    ring:   'ring-indigo-200',
  },
  violet: {
    pill:   'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
    active: 'bg-violet-600 text-white border-violet-600',
    header: 'bg-violet-50 border-violet-100',
    icon:   'text-violet-600',
    bar:    'bg-violet-500',
    soft:   'bg-violet-50',
    badge:  'bg-violet-100 text-violet-700',
    ring:   'ring-violet-200',
  },
  blue: {
    pill:   'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    active: 'bg-blue-600 text-white border-blue-600',
    header: 'bg-blue-50 border-blue-100',
    icon:   'text-blue-600',
    bar:    'bg-blue-500',
    soft:   'bg-blue-50',
    badge:  'bg-blue-100 text-blue-700',
    ring:   'ring-blue-200',
  },
  teal: {
    pill:   'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    active: 'bg-emerald-600 text-white border-emerald-600',
    header: 'bg-emerald-50 border-emerald-100',
    icon:   'text-emerald-600',
    bar:    'bg-emerald-500',
    soft:   'bg-emerald-50',
    badge:  'bg-emerald-100 text-emerald-700',
    ring:   'ring-emerald-200',
  },
  amber: {
    pill:   'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    active: 'bg-amber-500 text-white border-amber-500',
    header: 'bg-amber-50 border-amber-100',
    icon:   'text-amber-600',
    bar:    'bg-amber-500',
    soft:   'bg-amber-50',
    badge:  'bg-amber-100 text-amber-700',
    ring:   'ring-amber-200',
  },
  rose: {
    pill:   'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    active: 'bg-rose-600 text-white border-rose-600',
    header: 'bg-rose-50 border-rose-100',
    icon:   'text-rose-600',
    bar:    'bg-rose-500',
    soft:   'bg-rose-50',
    badge:  'bg-rose-100 text-rose-700',
    ring:   'ring-rose-200',
  },
}

export const DIAS     = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const HORARIOS = ['7am-9am','9am-11am','11am-1pm','1pm-3pm','3pm-5pm','5pm-7pm','7pm-9pm']

// Precios de Suscripción Optima en MXN según plan
export const PRECIO_OPTIMA_MXN = { free: 0, semanal: 99, mensual: 249, trimestral: 659 }

// Tasas de conversión aproximadas (base MXN)
export const TASAS_DESDE_MXN = {
  MXN: 1, USD: 0.059, EUR: 0.054, COP: 232, ARS: 17.2,
  CLP: 55, PEN: 0.22, BRL: 0.30, UYU: 2.35, CAD: 0.080,
}

// Usar la constante centralizada desde utils (única fuente de verdad)
export const RECURSOS_DEFAULT = RECURSOS_DEFAULT_BASE

export const DOCS_LIST = [
  { id:'cv',          label:'CV Inicial con ELVIA',               link:'/cv-desde-cero',  Icon:FileMagnifyingGlass, nota:'Tu CV base, construido y optimizado paso a paso con el estándar premium Harvard.' },
  { id:'linkedin',    label:'LinkedIn actualizado y auditado',     link:'/linkedin-pro',   Icon:LinkedinLogo, target:'_blank', nota:'Perfil LinkedIn® analizado y optimizado con keywords de tu industria.' },
  { id:'cv_vacante',  label:'CV adaptado a una vacante objetivo',  link:'/cv-vs-job',      Icon:MagnifyingGlass,    nota:'CV personalizado para una vacante de alto interés, con match > 70%.'        },
  { id:'entrevista',  label:'Práctica de entrevista realizada',    link:'/entrevista',     Icon:Robot,              nota:'Al menos una simulación de entrevista completa con feedback de ELVIA.'       },
  { id:'carta',       label:'Carta de presentación lista',         link:null,              Icon:Notepad,            nota:'Carta personalizada para tu vacante objetivo. Redáctala con ayuda de ELVIA.' },
  { id:'referencias', label:'Referencias profesionales confirmadas',link:null,             Icon:CheckCircle,        nota:'Al menos 2 referencias avisadas y listas para ser contactadas.'             },
]

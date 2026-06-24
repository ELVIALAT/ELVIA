// features/career-project/components/PilarMiPerfil.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 4).
// OJO: contiene sessionStorage (estado entre tabs) — preservado tal cual, NO tocar shapes.
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { supabase } from '../../../services/authService'
import { extractarPerfilCV, descargarCV } from '../../../services/cvService'
import HelpBadge from '../../../components/common/HelpBadge'
import { PlusMinus, SpinnerGap, CheckCircle, Lock, Folders, UploadSimple, CheckFat, WarningCircle } from '@phosphor-icons/react'
import {
  PAISES_LATAM, INDICATIVOS, NIVELES_CARGO, INDUSTRIAS_LATAM, AREAS_FUNC,
  TIPOS_TRABAJO, IDIOMAS_LIST, NIVELES_CEFR, NIVELES_EDUCACION, MONEDAS_LIST,
  MONEDAS_US, MEXICO_DETALLE, CIUDADES_SUGERIDAS, ANIOS_EXP,
} from '../constants'
import { detectarMoneda, indicativoPorPais, getPrestaciones, soloNumericos, formatearMonto, parseMonto } from '../utils'
import PanelCompensacion from './PanelCompensacion'
import PanelPerfilador from './PanelPerfilador'

export default function PilarMiPerfil({ perfil, extraData, onChange, onSavePerfil, onSaveComp, saving, isPaidPlan, data, userId, pct }) {
  const d = extraData || {}
  const up = (key, val) => onChange({ ...d, [key]: val })
  const [subTab, setSubTab] = useState('datos')
  const isComplete = (pct || 0) >= 100
  const [citySearch, setCitySearch] = useState('')
  const [showCitySugg, setShowCitySugg] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvDatos, setCvDatos] = useState(null)
  const [cvFileName, setCvFileName] = useState('')
  const [cvErr, setCvErr] = useState('')
  const [cvMismatch, setCvMismatch] = useState(false)  // alerta si CV no coincide con registro
  const [cvForceApply, setCvForceApply] = useState(false) // usuario confirma que es su CV a pesar de discrepancia
  const lpLoaded = useRef(false)   // evita auto-save en la carga inicial
  const autoSaveTimer = useRef(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  const [originalCvId, setOriginalCvId] = useState(null)
  const [descargandoOriginal, setDescargandoOriginal] = useState(null)
  const [justSaved, setJustSaved] = useState(false) // Feedback visual para botones

  // 1. Buscar ID de CV original para descarga
  useEffect(() => {
    if (!userId || !perfil?.cv_path) return
    const getCvId = async () => {
      const { data } = await supabase.from('cv_results').select('id').eq('user_id', userId).eq('tipo', 'original').order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (data) setOriginalCvId(data.id)
    }
    getCvId()
  }, [userId, perfil])

  const handleDescargarOriginal = async (formato) => {
    let cvId = originalCvId
    
    // Fallback: si no tenemos el ID (posiblemente recién generado), intentamos buscarlo
    if (!cvId) {
      const { data } = await supabase
        .from('cv_results')
        .select('id')
        .eq('user_id', userId)
        .eq('tipo', 'original')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (data) {
        cvId = data.id
        setOriginalCvId(data.id)
      }
    }

    if (!cvId) {
      toast.error('No se encontró el ID del CV original para descargar. Intenta recargar la página.')
      return
    }

    setDescargandoOriginal(formato)
    try {
      await descargarCV(cvId, formato)
    } catch (err) {
      toast.error('Error al descargar el CV')
    } finally {
      setDescargandoOriginal(null)
    }
  }
  // Refs para flush en unmount
  const [lp, setLP] = useState({
    nombre1:'',nombre2:'',apellido1:'',apellido2:'',
    pais:'',ciudad:'',edad:'',indicativo1:'+52',telefono1:'',
    email_secundario:'',
    pais_prestaciones:'',salario_monto:'',moneda:'',
    prestaciones:[],prestaciones_detalle:{},
    bono_activo:false,bono_tipo:'',bono_esquema:'',
    bono_frecuencia:'',bono_pct:'',bono_num_salarios:'',
    bono_monto:'',variable_monto:'',prestaciones_otros:'',
    idiomas: [],
    fondo_ahorro_monto: '',
    bonos_extra: [],
    expectativa_salarial_monto: '',
    expectativa_prestaciones: '',
    area_otro: '',
    industria_otro: '',
  })
  const lpRef          = useRef(lp)
  const onSavePerfilRef = useRef(onSavePerfil)
  useEffect(() => { lpRef.current = lp },                [lp])
  useEffect(() => { onSavePerfilRef.current = onSavePerfil }, [onSavePerfil])

  // Carga inicial desde perfil — prefiere sessionStorage para carga instantánea al cambiar pilar
  useEffect(() => {
    if (!perfil) return
    const CACHE_KEY = userId ? `perfil_lp_${userId}` : null

    // Intentar restaurar desde caché (evita ver datos viejos al cambiar de pilar y volver)
    if (CACHE_KEY) {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          lpLoaded.current = false
          setLP(JSON.parse(cached))
          setTimeout(() => { lpLoaded.current = true }, 100)
          return
        } catch { /* ignorar */ }
      }
    }

    lpLoaded.current = false
    setLP({
      nombre1:perfil.nombre1||'',nombre2:perfil.nombre2||'',
      apellido1:perfil.apellido1||'',apellido2:perfil.apellido2||'',
      pais:perfil.pais||'',ciudad:perfil.ciudad||'',edad:perfil.edad||'',
      indicativo1:perfil.indicativo1||'+52',telefono1:perfil.telefono1||'',
      email_secundario:perfil.email_secundario||'',
      salario_monto:(perfil.salario_esperado||'').split(' ')[0]||'',
      moneda:(perfil.salario_esperado||'').split(' ')[1]||detectarMoneda(perfil.pais)||'',
      pais_prestaciones:perfil.pais_prestaciones||perfil.pais||'',
      prestaciones:perfil.prestaciones||[],
      prestaciones_detalle:perfil.prestaciones_detalle||{},
      bono_activo:perfil.bono_activo||false,
      bono_tipo:perfil.bono_tipo||'',bono_esquema:perfil.bono_esquema||'',
      bono_frecuencia:perfil.bono_frecuencia||'',bono_pct:perfil.bono_pct||'',
      bono_num_salarios:perfil.bono_num_salarios||'',
      bono_monto:perfil.bono_monto||'',variable_monto:perfil.variable_monto||'',
      prestaciones_otros:perfil.prestaciones_otros||'',
      fondo_ahorro_monto: d?.fondo_ahorro_monto || '',
      bonos_extra: d?.bonos_extra || [],
      expectativa_salarial_monto: d?.expectativa_salarial_monto || '',
      expectativa_prestaciones: d?.expectativa_prestaciones || '',
      area_otro: d?.area_otro || '',
      industria_otro: d?.industria_otro || '',
    })
    setTimeout(() => { lpLoaded.current = true }, 100)
  },[perfil, userId])

  const onSavePerfilLocal = async (p) => {
    await onSavePerfil(p)
    // También guardar de forma síncrona en el estado del padre al hacer clic en guardar principal
    onChange({
      ...d,
      fondo_ahorro_monto: p.fondo_ahorro_monto,
      bonos_extra: p.bonos_extra,
      expectativa_salarial_monto: p.expectativa_salarial_monto,
      expectativa_prestaciones: p.expectativa_prestaciones,
      area_otro: p.area_otro,
      industria_otro: p.industria_otro,
    })
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
    if (subTab === 'datos') setSubTab('comp')
    else if (subTab === 'comp') {
      setSubTab('asp')
      if (onSaveComp) onSaveComp()
    }
  }

  // Auto-save con debounce de 1.5s — solo después de que el usuario haya editado
  // Usamos refs para onSavePerfil y onChange para evitar que el cambio de referencia
  // de esas props cause re-renders del padre mientras el usuario está tipeando.
  useEffect(() => {
    if (!lpLoaded.current) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      onSavePerfilRef.current(lp, { silent: true })
      // Propagar al parent — usa ref para no disparar re-render por cambio de prop
      onChangeRef.current({
        ...d,
        fondo_ahorro_monto: lp.fondo_ahorro_monto,
        bonos_extra: lp.bonos_extra,
        expectativa_salarial_monto: lp.expectativa_salarial_monto,
        expectativa_prestaciones: lp.expectativa_prestaciones,
        area_otro: lp.area_otro,
        industria_otro: lp.industria_otro,
      })
    }, 1500)
    // No cancelar el timer en el cleanup del debounce — solo al montar/desmontar
  }, [lp]) // eslint-disable-line react-hooks/exhaustive-deps

  // Flush inmediato al desmontar — guarda en sessionStorage (síncrono) + Supabase (async)
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
        if (lpLoaded.current) {
          // Guardar en sessionStorage de forma síncrona para carga instantánea al volver
          if (userId) sessionStorage.setItem(`perfil_lp_${userId}`, JSON.stringify(lpRef.current))
          onSavePerfilRef.current(lpRef.current, { silent: true })
          onChangeRef.current({
            ...d,
            fondo_ahorro_monto: lpRef.current.fondo_ahorro_monto,
            bonos_extra: lpRef.current.bonos_extra,
            expectativa_salarial_monto: lpRef.current.expectativa_salarial_monto,
            expectativa_prestaciones: lpRef.current.expectativa_prestaciones,
            area_otro: lpRef.current.area_otro,
            industria_otro: lpRef.current.industria_otro,
          })
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const togglePrest=(p)=>setLP(f=>({...f,prestaciones:f.prestaciones.includes(p)?f.prestaciones.filter(x=>x!==p):[...f.prestaciones,p]}))
  const toggleIdioma=(id)=>{const arr=Array.isArray(d.idiomas)?d.idiomas:[];const ex=arr.find(i=>i.idioma===id);up('idiomas',ex?arr.filter(i=>i.idioma!==id):[...arr,{idioma:id,nivel:'B2'}])}
  const updNivelIdioma=(id,nivel)=>up('idiomas',(Array.isArray(d.idiomas)?d.idiomas:[]).map(i=>i.idioma===id?{...i,nivel}:i))
  const toggleArea=(a)=>{const arr=Array.isArray(d.areas)?d.areas:[];up('areas',arr.includes(a)?arr.filter(x=>x!==a):[...arr,a])}
  const toggleInd=(ind)=>{const arr=Array.isArray(d.industrias_deseadas)?d.industrias_deseadas:[];up('industrias_deseadas',arr.includes(ind)?arr.filter(x=>x!==ind):[...arr,ind])}
  const toggleNC=(n)=>{const arr=Array.isArray(d.niveles_cargo)?d.niveles_cargo:[];up('niveles_cargo',arr.includes(n)?arr.filter(x=>x!==n):[...arr,n])}
  const TABS=[{id:'datos',label:'Datos Personales'},{id:'comp',label:'Compensación'},{id:'asp',label:'Perfilador'}]
  const iBtn=(sel,txt,fn)=><button key={txt} onClick={fn} className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${sel?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{txt}</button>

  // Normalizar string para comparación (lowercase, sin espacios/acentos)
  const normalizeName = (s) => {
    if (!s || typeof s !== 'string') return ''
    return s.toLowerCase().trim().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setCvUploading(true)
    setCvErr('')
    setCvDatos(null)
    setCvFileName(file.name)
    setCvMismatch(false)
    setCvForceApply(false)
    try {
      const datos = await extractarPerfilCV(file)
      if (datos?.error) throw new Error(datos.error)

      // Validar que el nombre/apellido del CV coincida con el registro del usuario
      const cvNombre = normalizeName(datos.nombre1)
      const cvApellido = normalizeName(datos.apellido1)
      const regNombre = normalizeName(perfil?.nombre1)
      const regApellido = normalizeName(perfil?.apellido1)

      // Si el usuario tiene nombre registrado, verificar que coincida
      if (regNombre && regNombre !== cvNombre) {
        setCvMismatch(true)
      } else if (regApellido && regApellido !== cvApellido) {
        setCvMismatch(true)
      }

      setCvDatos(datos)
    } catch (err) {
      setCvFileName('')
      const msg = err?.message || ''
      if (msg.includes('401') || msg.includes('403')) {
        setCvErr('Sesión expirada. Recarga la página e intenta de nuevo.')
      } else if (msg.includes('413')) {
        setCvErr('El archivo es muy grande. Máximo 5MB.')
      } else if (msg.includes('Formato')) {
        setCvErr('Formato no soportado. Sube un PDF o Word (.docx).')
      } else {
        setCvErr('No pudimos procesar el CV. Intenta de nuevo.')
      }
    } finally {
      setCvUploading(false)
    }
  }

  const aplicarDatosCV = () => {
    if (!cvDatos) return
    setLP(f => ({
      ...f,
      nombre1:    cvDatos.nombre1    || f.nombre1,
      nombre2:    cvDatos.nombre2    || f.nombre2,
      apellido1:  cvDatos.apellido1  || f.apellido1,
      apellido2:  cvDatos.apellido2  || f.apellido2,
      ciudad:     cvDatos.ciudad     || f.ciudad,
      pais:       cvDatos.pais       || f.pais,
      edad:       cvDatos.edad       ? String(cvDatos.edad) : f.edad,
      telefono1:  cvDatos.telefono1  || f.telefono1,
      indicativo1: cvDatos.pais ? indicativoPorPais(cvDatos.pais) : f.indicativo1,
      moneda:     cvDatos.pais ? detectarMoneda(cvDatos.pais) : f.moneda,
    }))
    if (Array.isArray(cvDatos.idiomas) && cvDatos.idiomas.length > 0) {
      up('idiomas', cvDatos.idiomas)
    }
    if (Array.isArray(cvDatos.educacion) && cvDatos.educacion.length > 0) {
      up('educacion_lista', cvDatos.educacion)
    }
    setCvDatos(null)
    setCvFileName('')
  }

  return (
    <div className="space-y-6">
      {/* Sección upload CV: movida al tab Optimizador de CV — preservada para rollback (quitar false &&) */}
      {false && <div className={`p-4 rounded-2xl border-2 border-dashed transition-colors ${cvDatos ? 'bg-green-50 border-green-300' : 'bg-indigo-50 border-indigo-200'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700">¿Tienes un CV? Súbelo y llenamos el formulario por ti</p>
            <p className="text-xs text-slate-400 mt-0.5">{cvFileName || 'PDF o Word · Máx. 5MB'}</p>
          </div>
          <label className={`cursor-pointer flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 ${cvUploading?'bg-slate-400':'bg-indigo-600 hover:bg-indigo-700'}`}>
            {cvUploading ? <SpinnerGap size={14} className="animate-spin"/> : <UploadSimple size={14} weight="bold"/>}
            {cvUploading ? 'Analizando...' : cvFileName ? 'Cambiar' : 'Subir CV'}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVUpload} disabled={cvUploading}/>
          </label>
        </div>
        {cvDatos && (
          <>
            {cvMismatch ? (
              <div className="mt-3 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0 mt-0.5"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-700 mb-1">El CV no corresponde al usuario registrado</p>
                  <p className="text-sm text-red-600 leading-snug">
                    Los nombres y apellidos con los que te registraste deben estar en la CV, valida que el documento esta correctamente escrito.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckFat size={16} weight="fill" className="text-green-500 shrink-0"/>
                  <p className="text-xs text-slate-700">
                    <span className="font-bold">{[cvDatos.nombre1, cvDatos.apellido1].filter(Boolean).join(' ')}</span>
                    {cvDatos.pais && <span className="text-slate-400"> · {cvDatos.pais}</span>}
                    {cvDatos.idiomas?.length > 0 && <span className="text-slate-400"> · {cvDatos.idiomas.length} idioma(s)</span>}
                    {cvDatos.educacion?.length > 0 && <span className="text-slate-400"> · {cvDatos.educacion.length} estudio(s)</span>}
                  </p>
                </div>
                <button onClick={aplicarDatosCV} className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition-colors">
                  Aplicar →
                </button>
              </div>
            )}
          </>
        )}
        {cvErr && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
            <WarningCircle size={13}/> {cvErr}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
            <span className="font-bold">⚠️ Aviso importante:</span> Si usas la información de otra persona sin autorización expresa, se incumplen los términos y condiciones de ELVIA así como la privacidad de la información. Solo debes subir CVs propios o autorizados.
          </p>
        </div>

        {/* Botón "Crear desde cero" */}
        <Link to="/cv-desde-cero" className="mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-indigo-300 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors">
          <PlusMinus size={16}/> Crear CV desde cero
        </Link>

        {/* Detección de borrador guardado (solo usuarios pago) */}
        {isPaidPlan && data?.cv_borrador && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-amber-800 font-semibold">Tienes un CV en progreso</p>
            <Link to="/cv-desde-cero" className="text-sm text-amber-600 hover:text-amber-700 font-bold">Continuar →</Link>
          </div>
        )}

        {/* Estado de CV Generado */}
        {perfil?.cv_path && (
          <div className={`mt-4 p-4 rounded-2xl border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {isComplete ? <CheckCircle size={14} weight="bold" /> : <Lock size={12} weight="bold" />}
                  </div>
                  <p className="text-sm font-black text-slate-800">Tu CV Inicial Generado</p>
                </div>
                {!isComplete && (
                  <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-tight bg-amber-50 px-2 py-0.5 rounded border border-amber-100 w-fit">
                    Bloqueado hasta completar el 100%
                  </p>
                )}
                <p className="text-xs text-slate-600 font-medium truncate mb-2">
                  {perfil.cv_filename || 'cv_original.txt'}
                </p>
                <div className="flex items-center gap-1.5">
                  {isComplete ? (
                    <Link to="/mis-cvs" className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors">
                      <Folders size={14} weight="bold" /> Ver en mis documentos
                    </Link>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 cursor-not-allowed">
                      <Folders size={14} weight="bold" /> Ver en mis documentos
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button 
                  onClick={() => isComplete && handleDescargarOriginal('pdf')}
                  disabled={!isComplete || descargandoOriginal === 'pdf'}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 border text-[11px] font-black rounded-lg transition-all ${isComplete ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  {descargandoOriginal === 'pdf' ? <SpinnerGap size={12} className="animate-spin" /> : '↓ PDF'}
                </button>
                <button 
                  onClick={() => isComplete && handleDescargarOriginal('word')}
                  disabled={!isComplete || descargandoOriginal === 'word'}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 border text-[11px] font-black rounded-lg transition-all ${isComplete ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  {descargandoOriginal === 'word' ? <SpinnerGap size={12} className="animate-spin" /> : '↓ Word'}
                </button>
              </div>
            </div>
            {!isComplete && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                  Podrás ver este CV en tu sección de mis documentos cuando termines todo el proceso.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Banner: Importancia de CV (si no hay CV cargada ni borrador) */}
        {!perfil?.cv_path && !data?.cv_borrador && (
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-sm text-slate-700 font-semibold">⚠️ Sin CV inicial no llegarás al 100% de esta sección y no podrás usar todas las funcionalidades del Gerente de Proyecto.</p>
          </div>
        )}
      </div>}
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setSubTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer -mb-px ${subTab===t.id?'border-indigo-600 text-indigo-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {subTab==='datos'&&(
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-sm font-black text-slate-800">Datos Personales del Proyecto</h3>
            <HelpBadge id="proyecto.datos" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'nombre1',   label: 'Primer nombre *',   isReadOnly: true },
              { k: 'nombre2',   label: 'Segundo nombre',     isReadOnly: false },
              { k: 'apellido1', label: 'Primer apellido *', isReadOnly: true },
              { k: 'apellido2', label: 'Segundo apellido',   isReadOnly: false }
            ].map(({ k, label, isReadOnly }) => (
              <div key={k}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">{label}</label>
                {isReadOnly ? (
                  <input 
                    value={perfil?.[k] || ''} 
                    readOnly 
                    title="Este campo no se puede modificar"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                ) : (
                  <input 
                    value={lp[k] || ''} 
                    onChange={e => setLP(f => ({ ...f, [k]: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">País *</label>
              <select value={lp.pais} onChange={e=>{const p=e.target.value;setLP(f=>({...f,pais:p,indicativo1:indicativoPorPais(p),moneda:detectarMoneda(p),pais_prestaciones:(!f.pais_prestaciones||f.pais_prestaciones===f.pais)?p:f.pais_prestaciones}))}}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40">
                <option value="">Selecciona</option>{PAISES_LATAM.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Ciudad actual</label>
              <input value={lp.ciudad||''} onChange={e=>setLP(f=>({...f,ciudad:e.target.value}))} placeholder="Tu ciudad"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Teléfono principal</label>
              <div className="flex gap-1.5">
                <select value={lp.indicativo1} onChange={e=>setLP(f=>({...f,indicativo1:e.target.value}))}
                  className="border border-slate-300 rounded-xl px-2 py-2.5 text-xs focus:outline-none w-24 shrink-0">
                  {INDICATIVOS.map(i=><option key={i.code} value={i.ind}>{i.code} {i.ind}</option>)}</select>
                <input type="tel" value={lp.telefono1||''} onChange={e=>setLP(f=>({...f,telefono1:e.target.value}))} placeholder="55 1234 5678"
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/></div></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Edad</label>
              <input type="number" value={lp.edad||''} onChange={e=>setLP(f=>({...f,edad:e.target.value}))} placeholder="Ej: 32" min={18} max={70}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/></div>
          </div>
          <button onClick={()=>onSavePerfilLocal(lp)} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-60">
            {saving?<SpinnerGap size={16} className="animate-spin"/>:<CheckCircle size={16} weight="fill"/>} Guardar y continuar</button>
        </div>
      )}
      {subTab==='comp'&&<PanelCompensacion d={d} justSaved={justSaved} lp={lp} onSavePerfilLocal={onSavePerfilLocal} saving={saving} setLP={setLP}/>}
      {subTab==='asp'&&<PanelPerfilador citySearch={citySearch} d={d} data={data} iBtn={iBtn} justSaved={justSaved} lp={lp} onChange={onChange} onSavePerfilLocal={onSavePerfilLocal} saving={saving} setCitySearch={setCitySearch} setLP={setLP} setShowCitySugg={setShowCitySugg} showCitySugg={showCitySugg} toggleArea={toggleArea} toggleIdioma={toggleIdioma} toggleInd={toggleInd} toggleNC={toggleNC} up={up} updNivelIdioma={updNivelIdioma}/>}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { usePlan } from '../context/usePlan'
import { supabase } from '../services/authService'
import HelpBadge from '../components/common/HelpBadge'
import { indicativoPorPais, MEXICO_DETALLE, detectarMoneda } from '../features/profile/constants'
import TabDatosPersonales from '../features/profile/components/TabDatosPersonales'
import TabCompensacion from '../features/profile/components/TabCompensacion'
import TabAspiraciones from '../features/profile/components/TabAspiraciones'

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Perfil() {
  const { user, loading: authLoading } = useAuth()
  const { perfil, refreshPerfil } = useProfile()
  const { creditosRestantes, LIMITE_PLAN, usageCount, isPaidPlan } = usePlan()
  const navigate = useNavigate()

  const bloqueado = !!(perfil?.nombre1 && perfil?.apellido1)

  const [saving, setSaving]     = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [copiado, setCopiado]   = useState(false)
  const [ciudadInput, setCiudadInput] = useState('')
  const [tab, setTab]           = useState('personal')

  const [form, setForm] = useState({
    // Sección 1
    nombre1: '', nombre2: '', apellido1: '', apellido2: '',
    indicativo1: '+52', telefono1: '', indicativo2: '+52', telefono2: '', email_secundario: '',
    pais: '', ciudad: '', ciudades_busqueda: [], edad: '',
    // Sección 2
    salario_monto: '', moneda: 'MXN', prestaciones: [],
    prestaciones_detalle: {},
    bono_activo: false, bono_tipo: '', bono_frecuencia: '',
    bono_monto: '', bono_pct: '', variable_monto: '',
    prestaciones_otros: '',
    // Sección 3
    nivel_cargo: '', industrias_deseadas: [], tipo_trabajo: '', area: '',
    areas: [],
    idiomas: [], educacion: [],
    // Campos legacy
    cargo_actual: '', cargo_objetivo: '', experiencia_anos: '',
    industria_actual: '',
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
  }, [user, authLoading])

  useEffect(() => {
    if (!perfil) return
    const [monto, monedaSaved] = (perfil.salario_esperado || '').split(' ')
    setForm({
      nombre1:            perfil.nombre1 || '',
      nombre2:            perfil.nombre2 || '',
      apellido1:          perfil.apellido1 || '',
      apellido2:          perfil.apellido2 || '',
      indicativo1:        perfil.indicativo1 || '+52',
      telefono1:          perfil.telefono1 || '',
      indicativo2:        perfil.indicativo2 || '+52',
      telefono2:          perfil.telefono2 || '',
      email_secundario:   perfil.email_secundario || '',
      pais:               perfil.pais || '',
      ciudad:             perfil.ciudad || '',
      ciudades_busqueda:  perfil.ciudades_busqueda || [],
      edad:               perfil.edad || '',
      salario_monto:      monto || '',
      moneda:             monedaSaved || detectarMoneda(perfil.pais),
      prestaciones:       perfil.prestaciones || [],
      prestaciones_detalle: perfil.prestaciones_detalle
        ? { ...perfil.prestaciones_detalle, __bono: undefined, __otros: undefined }
        : {},
      prestaciones_otros:  perfil.prestaciones_detalle?.__otros || '',
      bono_activo:     !!(perfil.prestaciones_detalle?.__bono),
      bono_tipo:       perfil.prestaciones_detalle?.__bono?.tipo || '',
      bono_frecuencia: perfil.prestaciones_detalle?.__bono?.frecuencia || '',
      bono_monto:      perfil.prestaciones_detalle?.__bono?.tipo === 'Bono' ? (perfil.prestaciones_detalle?.__bono?.monto || '') : '',
      bono_pct:        perfil.prestaciones_detalle?.__bono?.pct || '',
      variable_monto:  perfil.prestaciones_detalle?.__bono?.tipo === 'Variable mensual' ? (perfil.prestaciones_detalle?.__bono?.monto || '') : '',
      nivel_cargo:        perfil.nivel_cargo || '',
      industrias_deseadas: perfil.industrias_deseadas || [],
      tipo_trabajo:       perfil.tipo_trabajo || '',
      area:               perfil.area || '',
      areas:              perfil.area ? perfil.area.split(', ').filter(Boolean) : [],
      idiomas:            Array.isArray(perfil.idiomas)   ? perfil.idiomas   : [],
      educacion:          Array.isArray(perfil.educacion) ? perfil.educacion : [],
      cargo_actual:       perfil.cargo_actual || '',
      cargo_objetivo:     perfil.cargo_objetivo || '',
      experiencia_anos:   perfil.experiencia_anos ?? '',
      industria_actual:   perfil.industria_actual || '',
    })
  }, [perfil])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handlePaisChange = (e) => {
    const pais = e.target.value
    const ind  = indicativoPorPais(pais)
    setForm(f => ({ ...f, pais, moneda: detectarMoneda(pais), indicativo1: ind, indicativo2: ind }))
  }

  const agregarCiudad = () => {
    const val = ciudadInput.trim()
    if (!val || form.ciudades_busqueda.length >= 5 || form.ciudades_busqueda.includes(val)) { setCiudadInput(''); return }
    setForm(f => ({ ...f, ciudades_busqueda: [...f.ciudades_busqueda, val] }))
    setCiudadInput('')
  }
  const quitarCiudad = (c) => setForm(f => ({ ...f, ciudades_busqueda: f.ciudades_busqueda.filter(x => x !== c) }))

  const toggleIndustria = (ind) => setForm(f => ({
    ...f,
    industrias_deseadas: f.industrias_deseadas.includes(ind)
      ? f.industrias_deseadas.filter(x => x !== ind)
      : [...f.industrias_deseadas, ind],
  }))

  const toggleArea = (a) => setForm(f => ({
    ...f,
    areas: f.areas.includes(a) ? f.areas.filter(x => x !== a) : [...f.areas, a],
  }))

  const toggleIdioma = (idioma) => setForm(f => {
    const existe = f.idiomas.find(i => i.idioma === idioma)
    if (existe) return { ...f, idiomas: f.idiomas.filter(i => i.idioma !== idioma) }
    return { ...f, idiomas: [...f.idiomas, { idioma, nivel: 'B2' }] }
  })

  const updateNivelIdioma = (idioma, nivel) => setForm(f => ({
    ...f,
    idiomas: f.idiomas.map(i => i.idioma === idioma ? { ...i, nivel } : i),
  }))

  const agregarEducacion = () => setForm(f => ({
    ...f,
    educacion: [...f.educacion, { nivel: '', titulo: '', institucion: '', anio: '' }],
  }))

  const quitarEducacion = (idx) => setForm(f => ({
    ...f,
    educacion: f.educacion.filter((_, i) => i !== idx),
  }))

  const updateEducacion = (idx, field, value) => setForm(f => ({
    ...f,
    educacion: f.educacion.map((e, i) => i === idx ? { ...e, [field]: value } : e),
  }))

  const togglePrestacion = (p) => setForm(f => {
    const isChecked = f.prestaciones.includes(p)
    const nuevas = isChecked ? f.prestaciones.filter(x => x !== p) : [...f.prestaciones, p]
    const detalle = { ...f.prestaciones_detalle }
    if (isChecked) delete detalle[p]
    else if (MEXICO_DETALLE[p]) detalle[p] = MEXICO_DETALLE[p].default
    return { ...f, prestaciones: nuevas, prestaciones_detalle: detalle }
  })

  const updateDetalle = (prestacion, valor) => setForm(f => ({
    ...f,
    prestaciones_detalle: { ...f.prestaciones_detalle, [prestacion]: valor },
  }))

  const guardar = async () => {
    setSaving(true)
    setGuardado(false)
    const nombreCompleto = [form.nombre1, form.nombre2, form.apellido1, form.apellido2]
      .map(s => s?.trim()).filter(Boolean).join(' ')
    const salario_esperado = form.salario_monto ? `${form.salario_monto} ${form.moneda}` : ''
    const prestaciones_detalle = {
      ...form.prestaciones_detalle,
      ...(form.bono_activo && form.bono_tipo ? {
        __bono: {
          tipo: form.bono_tipo,
          frecuencia: form.bono_tipo === 'Bono' ? form.bono_frecuencia : null,
          monto: form.bono_tipo === 'Bono' ? form.bono_monto : form.variable_monto,
          pct: form.bono_tipo === 'Bono' ? form.bono_pct : null,
        },
      } : {}),
      ...(form.prestaciones_otros?.trim() ? { __otros: form.prestaciones_otros.trim() } : {}),
    }
    const { salario_monto, moneda, bono_activo, bono_tipo, bono_frecuencia, bono_monto, bono_pct, variable_monto, areas, prestaciones_otros, ...rest } = form
    const { error } = await supabase.from('profiles').update({
      ...rest,
      area: form.areas.join(', '),
      idiomas: form.idiomas,
      educacion: form.educacion,
      salario_esperado, prestaciones_detalle, nombre: nombreCompleto,
      indicativo1: form.indicativo1, indicativo2: form.indicativo2,
    }).eq('id', user.id)
    setSaving(false)
    if (!error) { setGuardado(true); refreshPerfil(); setTimeout(() => setGuardado(false), 3000) }
  }

  const copiarCodigo = () => {
    if (!perfil?.referral_code) return
    navigator.clipboard.writeText(perfil.referral_code)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }
  const compartirLink = () => {
    const link = `${window.location.origin}/auth?ref=${perfil?.referral_code}`
    navigator.clipboard.writeText(link)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  if (authLoading) return null

  const TABS = [
    { id: 'personal',      label: 'Datos personales' },
    { id: 'compensacion',  label: 'Compensación' },
    { id: 'aspiraciones',  label: 'Aspiraciones' },
    { id: 'plan',          label: 'Plan' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-0.5 text-gray-500 text-sm">{user?.email}</p>
      </div>

      {/* Alerta onboarding */}
      {!perfil?.nombre1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <span className="text-amber-500 text-xl shrink-0 mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Completa tu configuración inicial</p>
            <p className="text-xs text-amber-700 mt-0.5">Para acceder a todas las funciones necesitas completar el onboarding.</p>
            <Link to="/onboarding" className="text-xs font-semibold text-primary underline mt-2 inline-block">Ir al onboarding →</Link>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg whitespace-nowrap transition-colors
              ${tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <TabDatosPersonales
          form={form} set={set} setForm={setForm} user={user} bloqueado={bloqueado}
          handlePaisChange={handlePaisChange}
          ciudadInput={ciudadInput} setCiudadInput={setCiudadInput}
          agregarCiudad={agregarCiudad} quitarCiudad={quitarCiudad}
        />
      )}

      {tab === 'compensacion' && (
        <TabCompensacion
          form={form} set={set} setForm={setForm}
          togglePrestacion={togglePrestacion} updateDetalle={updateDetalle}
        />
      )}

      {tab === 'aspiraciones' && (
        <TabAspiraciones
          form={form} set={set} setForm={setForm}
          toggleArea={toggleArea} toggleIndustria={toggleIndustria} toggleIdioma={toggleIdioma}
          updateNivelIdioma={updateNivelIdioma}
          agregarEducacion={agregarEducacion} quitarEducacion={quitarEducacion} updateEducacion={updateEducacion}
        />
      )}

      {/* ── TAB: Plan ── */}
      {tab === 'plan' && (
        <div className="space-y-5">
          {/* Plan y créditos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                Mi Plan y Créditos
                <HelpBadge id="perfil.plan" />
              </h2>
            </div>
            {(() => {
              const planLabel   = 'Gratuito'
              const expiresAt   = perfil?.plan_expires_at ? new Date(perfil.plan_expires_at) : null
              const diasRest    = expiresAt ? Math.max(0, Math.ceil((expiresAt - new Date()) / (1000*60*60*24))) : null
              const creditosDisp = isPaidPlan ? '∞' : Math.max(0, creditosRestantes)
              const barPct       = isPaidPlan ? 100 : Math.round((Math.max(0,creditosRestantes) / LIMITE_PLAN) * 100)
              return (
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-2xl font-black ${isPaidPlan ? 'text-primary' : 'text-gray-900'}`}>{planLabel}</span>
                      {isPaidPlan && <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">Activo</span>}
                    </div>
                    {expiresAt && (
                      <p className={`text-sm font-medium mb-3 ${diasRest <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
                        📅 Vigente hasta: <strong>{expiresAt.toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })}</strong>
                        {diasRest !== null && <span className="ml-2 text-xs text-gray-400">({diasRest} días restantes)</span>}
                      </p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">{creditosDisp}</span>
                      <span className="text-gray-400">/ {isPaidPlan ? '∞' : LIMITE_PLAN} créditos disponibles</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{usageCount} utilizados</p>
                    <div className="w-48 bg-gray-100 rounded-full h-1.5 mt-2">
                      <div className={`h-1.5 rounded-full ${!isPaidPlan && creditosRestantes === 0 ? 'bg-red-400' : !isPaidPlan && creditosRestantes === 1 ? 'bg-amber-400' : 'bg-green-500'}`}
                        style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 shrink-0">
                    <button className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                      {isPaidPlan ? 'Ver todos los planes →' : 'Mejorar plan — Próximamente'}
                    </button>
                    {!isPaidPlan && <p className="text-xs text-gray-400">Planes desde $9 USD/mes</p>}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Referidos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Programa de referidos</h2>
            <p className="text-sm text-gray-500 mb-4">Comparte tu código y gana <strong>2 créditos</strong> por cada persona que se registre.</p>
            {perfil?.referral_code ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
                  <span className="text-xs text-gray-400 font-medium">Tu código:</span>
                  <span className="font-mono font-bold text-gray-900 tracking-widest text-sm">{perfil.referral_code.toUpperCase()}</span>
                </div>
                <button onClick={copiarCodigo} className="text-sm font-medium border border-gray-300 rounded-xl px-4 py-2.5 hover:border-primary hover:text-primary transition-colors">
                  {copiado ? '✓ Copiado' : 'Copiar código'}
                </button>
                <button onClick={compartirLink} className="text-sm font-medium bg-primary text-white rounded-xl px-4 py-2.5 hover:bg-blue-700 transition-colors">
                  Compartir link
                </button>
              </div>
            ) : <div className="text-sm text-gray-400">Cargando código...</div>}
            {perfil?.bonus_credits > 0 && (
              <p className="mt-3 text-sm text-green-600 font-medium">🎉 Has ganado {perfil.bonus_credits} créditos por referidos</p>
            )}
          </div>
        </div>
      )}

      {/* Botón guardar (no en tab Plan) */}
      {tab !== 'plan' && (
        <div className="flex items-center gap-3 mt-5 pb-8">
          <button onClick={guardar} disabled={saving}
            className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {guardado && <span className="text-sm text-green-600">✓ Guardado correctamente</span>}
        </div>
      )}
    </div>
  )
}

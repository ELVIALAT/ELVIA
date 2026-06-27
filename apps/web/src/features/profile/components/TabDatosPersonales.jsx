// features/profile/components/TabDatosPersonales.jsx
// Tab "Datos personales" del Perfil. Extraído verbatim de pages/Perfil.jsx (Fase 3 refinamiento).
import { INDICATIVOS, PAISES_LATAM } from '../constants'
import HelpBadge from '../../../components/common/HelpBadge'

export default function TabDatosPersonales({
  form, set, setForm, user, bloqueado, handlePaisChange,
  ciudadInput, setCiudadInput, agregarCiudad, quitarCiudad,
}) {
  return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Datos Personales
              <HelpBadge id="perfil.personal" />
            </h2>
          </div>

          {/* Nombre y apellidos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Nombre completo</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key:'nombre1',   label:'Nombre 1 *',   placeholder:'Ana',       locked: bloqueado },
                { key:'nombre2',   label:'Nombre 2',     placeholder:'María' },
                { key:'apellido1', label:'Apellido 1 *', placeholder:'González',  locked: bloqueado },
                { key:'apellido2', label:'Apellido 2',   placeholder:'Martínez' },
              ].map(({ key, label, placeholder, locked }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type="text" value={form[key]} onChange={set(key)} disabled={locked} placeholder={placeholder}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${locked ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : 'border-gray-300'}`} />
                  {locked && <p className="text-xs text-gray-400 mt-0.5">🔒 No modificable</p>}
                </div>
              ))}
            </div>
            {bloqueado && (
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Nombre y apellido principal no se pueden modificar — son la llave de validación de tu CV.
              </p>
            )}
          </div>

          {/* Teléfonos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Teléfonos</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { indKey:'indicativo1', telKey:'telefono1', label:'Teléfono 1' },
                { indKey:'indicativo2', telKey:'telefono2', label:'Teléfono 2' },
              ].map(({ indKey, telKey, label }) => (
                <div key={telKey}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <div className="flex gap-1.5">
                    <select value={form[indKey]} onChange={e => setForm(f => ({ ...f, [indKey]: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-1.5 py-2.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary shrink-0 w-24">
                      {INDICATIVOS.map(i => <option key={i.code} value={i.ind}>{i.code} {i.ind}</option>)}
                    </select>
                    <input type="tel" value={form[telKey]} onChange={set(telKey)} placeholder="55 1234 5678"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emails */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Correos electrónicos</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email principal</label>
                <input type="email" value={user?.email || ''} disabled
                  className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email secundario</label>
                <input type="email" value={form.email_secundario} onChange={set('email_secundario')} placeholder="otro@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ubicación</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">País</label>
                <select value={form.pais} onChange={handlePaisChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona</option>
                  {PAISES_LATAM.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
                <input type="text" value={form.ciudad} onChange={set('ciudad')} placeholder="Ciudad de México"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Edad</label>
                <input type="number" value={form.edad} onChange={set('edad')} placeholder="35" min="16" max="80"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1.5">Ciudades de búsqueda <span className="text-gray-400">(hasta 5)</span></label>
              <div className="flex gap-2">
                <input type="text" value={ciudadInput} onChange={e => setCiudadInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarCiudad())}
                  placeholder="Guadalajara, Monterrey..."
                  disabled={form.ciudades_busqueda.length >= 5}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50" />
                <button onClick={agregarCiudad} disabled={!ciudadInput.trim() || form.ciudades_busqueda.length >= 5}
                  className="border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm hover:border-primary hover:text-primary disabled:opacity-40 transition-colors">+</button>
              </div>
              {form.ciudades_busqueda.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.ciudades_busqueda.map(c => (
                    <span key={c} className="flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1">
                      {c}<button onClick={() => quitarCiudad(c)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
  )
}

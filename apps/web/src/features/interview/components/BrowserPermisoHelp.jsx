// features/interview/components/BrowserPermisoHelp.jsx
// Ayuda contextual de permisos de micrófono por navegador (chrome/safari/firefox/mobile).
// Se muestra cuando el error es de micrófono denegado; si no, muestra el error simple.
// Extraído verbatim desde pages/Entrevista.jsx (Fase 3, bloque de error del paso entrevista).
import { useEntrevistaCtx } from '../EntrevistaContext'

export default function BrowserPermisoHelp() {
  const { error, activeBrowserTab, setActiveBrowserTab, setError, toggleEscucha } = useEntrevistaCtx()
  if (!error) return null
  if (!error.includes('micrófono denegado')) {
    return <p className="text-xs text-red-500 font-medium">{error}</p>
  }
  return (
    <div className="bg-red-50/90 border border-red-200/80 rounded-2xl p-5 text-sm text-red-800 space-y-4 mt-3 shadow-sm transition-all duration-300">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0" role="img" aria-label="microphone">🎙️</span>
        <div className="space-y-1">
          <p className="font-bold text-red-950 text-base">Acceso al micrófono bloqueado</p>
          <p className="text-xs text-red-800/90 leading-relaxed">
            Por seguridad, las aplicaciones web <strong>no pueden forzar la apertura</strong> de la configuración del navegador. Debes permitir el acceso manualmente siguiendo estos sencillos pasos:
          </p>
        </div>
      </div>

      {/* Selector de Navegador */}
      <div className="flex flex-wrap gap-1 border-b border-red-200/30 pb-2">
        <button
          type="button"
          onClick={() => setActiveBrowserTab('chrome')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeBrowserTab === 'chrome'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-red-800 hover:bg-red-100/60'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="3" />
            <line x1="3" y1="8" x2="5" y2="8" />
            <line x1="11" y1="8" x2="21" y2="8" />
            <circle cx="16" cy="16" r="3" />
            <line x1="3" y1="16" x2="13" y2="16" />
            <line x1="19" y1="16" x2="21" y2="16" />
          </svg>
          Chrome / Edge
        </button>

        <button
          type="button"
          onClick={() => setActiveBrowserTab('safari')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeBrowserTab === 'safari'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-red-800 hover:bg-red-100/60'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          Safari
        </button>

        <button
          type="button"
          onClick={() => setActiveBrowserTab('firefox')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeBrowserTab === 'firefox'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-red-800 hover:bg-red-100/60'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Firefox
        </button>

        <button
          type="button"
          onClick={() => setActiveBrowserTab('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeBrowserTab === 'mobile'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-red-800 hover:bg-red-100/60'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
          </svg>
          Celular / Tablet
        </button>
      </div>

      {/* Pasos Detallados según Navegador */}
      <div className="bg-white/95 rounded-xl p-4 border border-red-100/50 space-y-3 text-xs text-red-950 leading-relaxed shadow-sm">
        {activeBrowserTab === 'chrome' && (
          <>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">1</span>
              <div>
                En la barra de direcciones superior, a la izquierda de la dirección de la web, haz clic en el icono de <strong>Ajustes del Sitio / Controles</strong> que parece dos deslizadores o sliders horizontales:
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 ml-1.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono text-[9px] align-middle select-none">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="3" />
                    <line x1="3" y1="8" x2="5" y2="8" />
                    <line x1="11" y1="8" x2="21" y2="8" />
                    <circle cx="16" cy="16" r="3" />
                    <line x1="3" y1="16" x2="13" y2="16" />
                    <line x1="19" y1="16" x2="21" y2="16" />
                  </svg>
                  <span>Ajustes del sitio (🎛️)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">2</span>
              <div>
                En la pequeña ventana que se abre, localiza la opción de <strong>Micrófono</strong> y activa el interruptor o cámbialo a <strong className="text-emerald-700 font-bold">"Permitir"</strong>.
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">3</span>
              <div>
                Si no ves la opción rápida, haz clic en <strong>Configuración del sitio</strong> al final de esa misma pequeña ventana y cambia el permiso de <strong>Micrófono</strong> a <strong>"Permitir"</strong>.
              </div>
            </div>
          </>
        )}

        {activeBrowserTab === 'safari' && (
          <>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">1</span>
              <div>
                En la barra de menús superior de tu Mac, haz clic en <strong>Safari</strong> y selecciona <strong>Configuración para este sitio web...</strong>
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">2</span>
              <div>
                En la ventana emergente, busca la opción de <strong>Micrófono</strong> y cámbiala a <strong className="text-emerald-700 font-bold">"Permitir"</strong> (Allow).
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">3</span>
              <div>
                Si estás en un dispositivo móvil iPhone o iPad, consulta la pestaña <strong>Celular / Tablet</strong> arriba.
              </div>
            </div>
          </>
        )}

        {activeBrowserTab === 'firefox' && (
          <>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">1</span>
              <div>
                Haz clic en el icono del <strong>candado (🔒)</strong> o del **micrófono tachado** ubicado a la izquierda de la barra de direcciones.
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">2</span>
              <div>
                En la sección de permisos, busca "Usar el micrófono" y haz clic en la **"X"** que aparece al lado de "Bloqueado Temporalmente" o "Bloqueado".
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">3</span>
              <div>
                Haz clic en el botón de **"Probar de nuevo"** abajo y cuando el navegador te pregunte por permiso, marca la casilla "Recordar esta decisión" y haz clic en <strong className="text-emerald-700 font-bold">"Permitir"</strong>.
              </div>
            </div>
          </>
        )}

        {activeBrowserTab === 'mobile' && (
          <>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-8 h-5 rounded bg-red-100 text-red-700 font-bold shrink-0 text-[9px] uppercase">iOS</span>
              <div>
                Ve a la aplicación de <strong>Ajustes</strong> de tu iPhone/iPad &gt; desplázate hasta la app de <strong>Safari</strong> &gt; toca en <strong>Micrófono</strong> y selecciona <strong className="text-emerald-700 font-bold">"Permitir"</strong>.
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-8 h-5 rounded bg-red-100 text-red-700 font-bold shrink-0 text-[9px] uppercase">Android</span>
              <div>
                Abre Chrome &gt; toca los 3 puntos verticales &gt; <strong>Configuración</strong> &gt; <strong>Configuración de sitios</strong> &gt; <strong>Micrófono</strong> &gt; selecciona `elvia.lat` y establécelo en "Permitir".
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="flex items-center justify-center w-8 h-5 rounded bg-red-100 text-red-700 font-bold shrink-0 text-[9px] uppercase">Sist.</span>
              <div>
                Asegúrate de que tu navegador tenga permiso de acceso al micrófono en los Ajustes del Sistema &gt; Privacidad & Seguridad &gt; Micrófono.
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-1">
        <p className="text-[10px] text-red-800/80 italic text-center sm:text-left">
          Una vez permitida la opción en el navegador, presiona el botón para continuar.
        </p>
        <button
          type="button"
          onClick={async () => {
            setError('');
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach(track => track.stop());
              toggleEscucha();
            } catch (err) {
              setError('Permiso de micrófono denegado. Actívalo en la configuración del navegador.');
            }
          }}
          className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-red-200 select-none shrink-0"
        >
          Probar de nuevo
        </button>
      </div>
    </div>
  )
}

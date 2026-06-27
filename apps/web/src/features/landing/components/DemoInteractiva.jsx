// features/landing/components/DemoInteractiva.jsx
// Simulador en tiempo real (auto-type) con auth-wall overlay.
// El estado vive en el orquestador (Landing2.jsx) y se pasa por props.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { FileMagnifyingGlass, MagnifyingGlass } from '@phosphor-icons/react'

export default function DemoInteractiva({
  demoSectionRef,
  demoText,
  demoTypingDone,
  demoLoading,
  demoLoadingText,
  showDemoOverlay,
  handleDemoSubmit,
  modoComercial,
  navigate,
}) {
  return (
    <section ref={demoSectionRef} className="relative z-10 py-24 px-6 bg-slate-50 border-t border-gray-200" id="simulador">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase mb-2 block">Simulador en tiempo real</span>
          <h2 className="font-headline font-black text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">Prueba la magia gratis.<br className="hidden md:block"/> Sin registrarte.</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Con solo la descripción de una vacante real, ELVIA evalúa ajustes a tu perfil, siempre basado en tu información de autoconocimiento, nunca inventando nada.</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 border border-gray-200 p-6 md:p-10 relative overflow-hidden">
          {/* Widget Interactive component */}
          <div className="space-y-8 relative z-10">
             <div>
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">1</div> Tu Experiencia (Simulado)</h3>
                <div className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-200 transition-colors">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                     <FileMagnifyingGlass size={24} className="text-white" weight="duotone" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-blue-950">TU CV Optimizado con ELVIA</p>
                     <p className="text-xs text-blue-700 font-medium">Perfil intermedio precargado para esta demostración</p>
                   </div>
                </div>
             </div>

             <div>
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-black">2</div>
                  Descripción del cargo (Simulado)
                  {!demoTypingDone && demoText.length > 0 && (
                    <span className="ml-auto text-xs text-teal-500 font-semibold flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-3.5 bg-teal-500 rounded-sm animate-pulse" />
                      Escribiendo...
                    </span>
                  )}
                  {demoTypingDone && (
                    <span className="ml-auto text-xs text-emerald-600 font-semibold">✓ Listo — ¡Haz clic abajo!</span>
                  )}
                </h3>
                <div className="relative">
                  <textarea
                     readOnly
                     value={demoText}
                     rows="5"
                     className={`w-full border-2 rounded-2xl px-5 py-4 text-sm focus:outline-none resize-none transition-all duration-500 ${
                       demoTypingDone
                         ? 'border-teal-400 bg-teal-50/40 text-gray-700'
                         : 'border-gray-200 bg-gray-50/70 text-gray-600'
                     }`}
                     placeholder="Cargando descripción de cargo simulada..."
                  />
                  {!demoTypingDone && demoText.length > 0 && (
                    <span className="absolute bottom-4 right-5 inline-block w-0.5 h-4 bg-gray-500 animate-pulse" />
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-400 italic flex items-center gap-1.5">
                  <span className="inline-flex text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Demo</span>
                  Información ficticia utilizada únicamente para esta simulación. No representa una vacante real.
                </p>
             </div>

             <button
                onClick={handleDemoSubmit}
                disabled={demoText.trim().length < 15 || demoLoading || showDemoOverlay}
                className={`w-full text-white font-bold text-lg py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl focus:ring-4 focus:ring-gray-900/20 ${
                  demoTypingDone
                    ? 'bg-[#E8541A] hover:bg-[#E8541A]/90 shadow-[#E8541A]/40 animate-bounce-subtle'
                    : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/10'
                }`}
             >
                {demoLoading ? <span className="animate-spin rounded-full border-2 border-white/20 border-t-white w-5 h-5" /> : <MagnifyingGlass size={22} weight="bold" />}
                {demoLoadingText}
             </button>
          </div>

          {/* Auth Wall Overlay (Hidden by default) */}
          {showDemoOverlay && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md p-6 animate-fade-in">
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 ring-4 ring-gray-50 text-center relative pointer-events-auto transform transition-all duration-500 ease-out translate-y-0 opacity-100">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30 ring-8 ring-green-50">
                  <span className="text-4xl font-black">82%</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">¡Tienes un buen perfil!</h3>
                <p className="text-gray-500 mb-2 text-sm leading-relaxed mx-auto px-2">
                  ELVIA detectó que tu perfil es sólido, aunque puedes incluir <b>4 palabras clave obligatorias</b> para ser más atractivo a esta vacante.
                </p>
                <p className="text-gray-400 mb-8 text-xs italic mx-auto px-2">
                  Este es un ejemplo — para tener esta funcionalidad, regístrate.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => modoComercial
                      ? document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })
                      : navigate('/auth?register=true')}
                    className="w-full bg-[#1A91F0] text-white font-bold py-4 px-6 rounded-2xl hover:bg-blue-600 hover:shadow-lg transition-all shadow-md focus:ring-4 focus:ring-blue-500/20"
                  >
                    {modoComercial ? 'Quiero más información' : 'Empezar gratis ahora'}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {modoComercial ? 'Cuéntanos sobre tu equipo y te contactamos.' : 'Descubre tu análisis completo. 100% Gratis.'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}

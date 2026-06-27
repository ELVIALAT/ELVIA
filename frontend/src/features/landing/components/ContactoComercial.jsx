// features/landing/components/ContactoComercial.jsx
// Formulario de contacto comercial (B2B). El estado vive en el orquestador.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { CheckCircle, ArrowRight } from '@phosphor-icons/react'

export default function ContactoComercial({
  contactoForm,
  setContactoForm,
  contactoEnviando,
  contactoEnviado,
  contactoError,
  enviarContactoComercial,
}) {
  return (
    <section id="contacto-comercial" className="relative z-10 py-20 px-6 border-t border-gray-200 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#E8541A] mb-3">¿Tu empresa necesita ELVIA?</p>
          <h2 className="font-headline font-black text-4xl md:text-5xl text-[#002650] mb-4">
            Cuéntanos sobre tu equipo
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Acompañamos a empresas en transiciones, outplacement y desarrollo de carrera. Déjanos tus datos y te contactamos en 24h.
          </p>
        </div>

        {contactoEnviado ? (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-10 text-center">
            <CheckCircle size={56} weight="duotone" className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-emerald-900 mb-2">¡Recibimos tu mensaje!</h3>
            <p className="text-emerald-700">
              Nuestro equipo comercial te contactará en menos de 24 horas hábiles.
            </p>
          </div>
        ) : (
          <form onSubmit={enviarContactoComercial} className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre completo *</label>
                <input type="text" required value={contactoForm.nombre}
                  onChange={e => setContactoForm({...contactoForm, nombre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Empresa *</label>
                <input type="text" required value={contactoForm.empresa}
                  onChange={e => setContactoForm({...contactoForm, empresa: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email corporativo *</label>
                <input type="email" required value={contactoForm.email}
                  onChange={e => setContactoForm({...contactoForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono (opcional)</label>
                <input type="tel" value={contactoForm.telefono}
                  onChange={e => setContactoForm({...contactoForm, telefono: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all" />
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">¿Cuéntanos un poco sobre tu necesidad? (opcional)</label>
              <textarea rows="4" value={contactoForm.mensaje}
                onChange={e => setContactoForm({...contactoForm, mensaje: e.target.value})}
                placeholder="Ej: Estamos planeando un proceso de outplacement para 50 colaboradores..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all resize-none" />
            </div>

            {contactoError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                {contactoError}
              </div>
            )}

            <button type="submit" disabled={contactoEnviando}
              className="w-full mt-6 bg-[#E8541A] hover:bg-[#E8541A]/90 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {contactoEnviando ? (
                <><span className="animate-spin rounded-full border-2 border-white/20 border-t-white w-5 h-5" /> Enviando…</>
              ) : (
                <>Enviar solicitud <ArrowRight size={18} weight="bold" /></>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              O escríbenos directamente a <a href="mailto:comercial@elvia.lat" className="text-[#E8541A] font-bold hover:underline">comercial@elvia.lat</a>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}

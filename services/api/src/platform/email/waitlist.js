// Email de lista de espera (B2C waitlist) con templates por situación + link de referido.
const { resend, FROM_EMAIL, escapeHtml } = require('./client');

// Templates personalizados según situación del usuario — refactorizado para DRY
const WAITLIST_TEMPLATES = {
  'Sin empleo y en búsqueda activa': {
    emoji: '🌱',
    intro: 'Este momento de transición es, ante todo, una oportunidad para redescubrir tu valor profesional. ELVIA no es una aplicación más; es un sistema de autogestión diseñado para que tú tomes el control total de tu carrera, empezando por entender profundamente qué es lo que te hace único en el mercado actual.',
    features: [
      'Módulos de autoconocimiento para identificar tu oferta de valor real.',
      'Optimización de CV basada en tu esencia y metas (formato Harvard).',
      'Análisis de compatibilidad estratégica con vacantes reales.',
      'Sistema de gestión para que seas tu propio gerente de búsqueda laboral.'
    ],
    cta: 'Como pionero/a, tendrás acceso preferente a nuestro sistema. Estamos trabajando para que seas tú quien domine el proceso.'
  },
  'Con empleo y en búsqueda activa': {
    emoji: '🎯',
    intro: 'Evolucionar profesionalmente mientras trabajas requiere estrategia y una visión clara de ti mismo. ELVIA es tu sistema de autogestión silencioso, enfocado en ayudarte a identificar cuándo y dónde tu talento brillará más, preparándote para que el siguiente paso sea el correcto.',
    features: [
      'Herramientas de introspección para definir tu siguiente nivel profesional.',
      'CV dinámico que evoluciona con tus logros y visión.',
      'Gestión discreta y estratégica de oportunidades de mercado.',
      'Control total y autogestión de tu visibilidad ante empresas.'
    ],
    cta: 'Por ser parte de este grupo inicial, accederás a beneficios exclusivos. Es momento de gestionar tu carrera con intención.'
  },
  'Quiero gestionar mi siguiente paso': {
    emoji: '🧭',
    intro: 'La autogestión es la base de una carrera exitosa y duradera. En ELVIA creemos que antes de las herramientas viene la persona. Estamos creando un sistema que te acompaña a profundizar en tu perfil para que cada decisión laboral que tomes sea intencional, potente y alineada con quien eres.',
    features: [
      'Diagnóstico de perfil y diseño de tu propuesta de valor única.',
      'Sistema de gestión de hitos y metas profesionales a largo plazo.',
      'Análisis estratégico de empresas y culturas organizacionales.',
      'IA que actúa como un consultor de autoconocimiento permanente.'
    ],
    cta: 'Como pionero/a, serás de los primeros en experimentar este nuevo paradigma de gestión de carrera. El control es tuyo.'
  }
};

const getWaitlistEmailTemplate = (nombre, situacion, referralLink) => {
  const baseStyles = 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;';
  const nombre_escaped = escapeHtml(nombre);
  const template = WAITLIST_TEMPLATES[situacion] || WAITLIST_TEMPLATES['Sin empleo y en búsqueda activa'];
  const featuresHTML = template.features.map(f => `<li>${f}</li>`).join('');

  // Extraer código del link (asumimos formato ?ref=CODIGO)
  const referralCode = referralLink.split('ref=')[1] || '---';

  return `
    <div style="${baseStyles}">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://elvia.lat/elvia-logo-transparent.png" alt="ELVIA Logo" style="width: 140px; height: auto;" />
      </div>

      <h2 style="color: #E8541A;">¡Hola ${nombre_escaped}! ${template.emoji}</h2>
      <p>Gracias por unirte a la lista de espera de <strong>ELVIA</strong>.</p>
      <p>${template.intro}</p>

      <p><strong>Lo que obtendrás como pionero:</strong></p>
      <ul style="color: #374151;">
        ${featuresHTML}
      </ul>

      <div style="background: #F8FAFC; border: 2px solid #E2E8F0; padding: 32px; border-radius: 24px; margin: 32px 0; text-align: center;">
        <h3 style="color: #0F172A; margin-top: 0; font-size: 20px;">🎁 ¡Tu Recompensa Exclusiva!</h3>
        <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">
          Si <strong>5 personas</strong> se unen con tu link, te daremos un <strong>código de descuento exclusivo para tu plan</strong> cuando lancemos.
        </p>

        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; font-weight: bold; margin-bottom: 8px;">Tu Código de Invitado:</p>
        <div style="background: #FFFFFF; padding: 16px; border-radius: 12px; border: 2px solid #E8541A; margin-bottom: 24px; font-family: monospace; font-size: 24px; font-weight: bold; color: #E8541A; letter-spacing: 2px;">
          ${referralCode}
        </div>

        <p style="font-size: 14px; color: #64748B; margin-bottom: 16px;">Comparte tu link personalizado:</p>

        <div style="margin-bottom: 24px;">
          <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Mira esto! Me acabo de unir a la lista de espera de ELVIA, un sistema de autogestión para la transición de carrera con herramientas de clase mundial. Únete con mi link: ${referralLink}`)}"
             style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 4px;">
             WhatsApp
          </a>
          <a href="mailto:?subject=Te invito a conocer ELVIA - Sistema de Autogestión Laboral&body=${encodeURIComponent(`¡Hola!\n\nMe acabo de registrar en la lista de espera de ELVIA, una plataforma increíble que funciona como un sistema de autogestión para la transición de carrera.\n\nTienen herramientas muy potentes para optimizar tu perfil y encontrar mejores oportunidades.\n\nComo soy de los primeros, me dieron un enlace de invitado. Si te registras con mi link, ambos podremos acceder a beneficios exclusivos y descuentos cuando lancen.\n\nÚnete usando mi enlace único aquí:\n${referralLink}\n\n¡Espero que te sirva tanto como a mí!\n\n---\nELVIA | CONECTA TU PRESENTE CON EL FUTURO QUE QUIERES`)}"
             style="display: inline-block; background: #64748B; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 4px;">
             Reenviar por Email
          </a>
        </div>

        <p style="font-size: 12px; color: #94A3B8;">O copia este link: <br/> <span style="color: #E8541A;">${referralLink}</span></p>
      </div>

      <p>${template.cta}</p>
      <p>¡Nos encanta escucharte! Si tienes sugerencias, responde este correo.</p>
      <p>Un saludo,<br/><strong>El equipo de ELVIA</strong></p>
      <p style="color: #E8541A; font-weight: bold; font-size: 14px; margin-top: 24px;">ELVIA | CONECTA TU PRESENTE CON EL FUTURO QUE QUIERES</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; margin-bottom: 8px;">© 2026 ELVIA · Sistema de Autogestión Laboral</p>
      <p style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
        Recibiste este correo ya que te inscribiste y aceptaste nuestra política de privacidad de datos en el portal oficial de ELVIA.
      </p>
    </div>
  `;
};

const sendWelcomeWaitlistEmail = async (to, nombre, situacion, referralLink) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  const html = getWaitlistEmailTemplate(nombre, situacion, referralLink);

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'hola@elvia.lat',
    subject: 'Tu acceso a ELVIA está confirmado 🚀',
    html,
  });
};

module.exports = { WAITLIST_TEMPLATES, getWaitlistEmailTemplate, sendWelcomeWaitlistEmail };

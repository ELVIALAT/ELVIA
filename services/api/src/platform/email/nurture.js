// Emails de nurture / engagement: hitos de progreso y secuencia de onboarding B2B.
const { resend, FROM_EMAIL, escapeHtml } = require('./client');

/**
 * Correo 1: Oferta de Valor Completada (Hito de Autoconocimiento)
 */
const sendOfertaValorCompletadaEmail = async (to, nombre) => {
  if (!resend) {
    console.warn('[Resend] sendOfertaValorCompletadaEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe = escapeHtml((nombre || '').trim())
  const loginUrl = process.env.FRONTEND_URL || 'https://elvia.lat/login'

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: '🌟 ¡Muy bien hecho! Tu Autoconocimiento está listo en ELVIA®',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: #002650; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 16px;">
          ¡Muy bien hecho${nombreSafe ? `, ${nombreSafe}` : ''}! 🌟
        </h2>
        <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">
          Has finalizado con éxito la sección de <strong>Autoconocimiento</strong> y definido tu <strong>Oferta de Valor Profesional</strong>. ¡Este es el pilar fundamental de tu Proyecto Laboral!
        </p>
        <p style="color: #475569; margin: 0 0 24px; font-size: 15px;">
          Ahora estás a solo un paso de desbloquear todas las herramientas inteligentes de la plataforma. Solo falta que generes y confirmes tu **CV optimizado** para activar el Simulador de Entrevistas, el Análisis de LinkedIn y el Match de Vacantes.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}"
             style="display: inline-block; background: #002650; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,38,80,0.15);">
            Optimizar mi CV ahora
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          El control total de tu carrera está en tus manos. Si tienes dudas o comentarios sobre tu oferta de valor, escríbenos a
          <a href="mailto:soporte@elvia.lat" style="color: #002650;">soporte@elvia.lat</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0 0 8px;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad
        </p>
        <p style="font-size: 10px; color: #cbd5e1; text-align: center; line-height: 1.4; margin: 0;">
          Recibes este correo porque estás registrado en la plataforma ELVIA® de optimización y aceleración profesional. Tu privacidad es de máxima importancia para nosotros. Tratamos todos tus datos personales de manera estrictamente confidencial de acuerdo con nuestras Políticas de Privacidad y el disclaimer de privacidad de datos.
        </p>
      </div>
    `,
  })
}

/**
 * Correo 2: Infografía Descargada/Generada
 */
const sendInfografiaGeneradaEmail = async (to, nombre) => {
  if (!resend) {
    console.warn('[Resend] sendInfografiaGeneradaEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe = escapeHtml((nombre || '').trim())
  const docsUrl = `${process.env.FRONTEND_URL || 'https://elvia.lat'}/mis-cvs`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: '📊 Has descargado tu Infografía Profesional en ELVIA®',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: #002650; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 16px;">
          ¡Hola${nombreSafe ? `, ${nombreSafe}` : ''}! 👋
        </h2>
        <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">
          Hemos detectado que has generado o descargado tu **Infografía Profesional**. En ella podrás ver un mapa visual consolidado de tu perfil: tu propuesta de valor, ritmo de búsqueda semanal, propósito Ikigai y repertorio de competencias clave.
        </p>
        <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">
          Si tuviste algún inconveniente al descargar el documento en tu dispositivo, no te preocupes: tu reporte visual se encuentra guardado de forma permanente y segura en tu sección de <strong>Mis documentos</strong> en la plataforma.
        </p>
        <p style="color: #475569; margin: 0 0 24px; font-size: 15px; font-style: italic;">
          *Recuerda que para visualizar este reporte consolidado y descargar tu infografía, es necesario haber generado también tu CV optimizado estilo Harvard en la suite.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${docsUrl}"
             style="display: inline-block; background: #002650; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,38,80,0.15);">
            Ir a Mis documentos
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          ¿Deseas actualizar tu infografía? Puedes hacerlo editando los pilares de tu Proyecto Laboral en cualquier momento. Si necesitas soporte, escríbenos a
          <a href="mailto:soporte@elvia.lat" style="color: #002650;">soporte@elvia.lat</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0 0 8px;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad
        </p>
        <p style="font-size: 10px; color: #cbd5e1; text-align: center; line-height: 1.4; margin: 0;">
          Recibes este correo porque estás registrado en la plataforma ELVIA® de optimización y aceleración profesional. Tu privacidad es de máxima importancia para nosotros. Tratamos todos tus datos personales de manera estrictamente confidencial de acuerdo con nuestras Políticas de Privacidad y el disclaimer de privacidad de datos.
        </p>
      </div>
    `,
  })
}

/**
 * Correo 3: CV Optimizado Generado (Desbloqueo Total)
 */
const sendCVOptimizadoCompletadaEmail = async (to, nombre) => {
  if (!resend) {
    console.warn('[Resend] sendCVOptimizadoCompletadaEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe = escapeHtml((nombre || '').trim())
  const dashboardUrl = `${process.env.FRONTEND_URL || 'https://elvia.lat'}/dashboard`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: '🎉 ¡Felicitaciones! Has desbloqueado todo el poder de ELVIA®',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: #002650; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 16px;">
          ¡Felicidades${nombreSafe ? `, ${nombreSafe}` : ''}! 🎉
        </h2>
        <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">
          ¡Has confirmado y finalizado la optimización de tu CV Inicial! Con esto, has <strong>desbloqueado el 100% de las funcionalidades avanzadas</strong> de la plataforma ELVIA®.
        </p>
        <p style="color: #475569; margin: 0 0 24px; font-size: 15px;">
          Es momento de materializar y poner en acción toda la planeación que estructuraste en tu sección de Autoconocimiento. Tu Centro de Control ya está activo para que simules entrevistas personalizadas con IA, audites tu perfil de LinkedIn y busques vacantes de manera inteligente.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}"
             style="display: inline-block; background: #002650; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,38,80,0.15);">
            Ir a mi Centro de Control
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          El camino hacia tu siguiente gran paso profesional está listo. Estamos muy orgullosos de acompañarte. Si necesitas asistencia, contáctanos en
          <a href="mailto:soporte@elvia.lat" style="color: #002650;">soporte@elvia.lat</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0 0 8px;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad
        </p>
        <p style="font-size: 10px; color: #cbd5e1; text-align: center; line-height: 1.4; margin: 0;">
          Recibes este correo porque estás registrado en la plataforma ELVIA® de optimización y aceleración profesional. Tu privacidad es de máxima importancia para nosotros. Tratamos todos tus datos personales de manera estrictamente confidencial de acuerdo con nuestras Políticas de Privacidad y el disclaimer de privacidad de datos.
        </p>
      </div>
    `,
  })
}

/**
 * Engagement Day+1: si Gerente < 30% al día siguiente de activación.
 * "Tu primer paso: 7 min para destrabar tu carrera"
 */
const sendOnboarding1Email = async (to, { nombre, companyName, primaryColor, loginUrl, diasRestantes }) => {
  if (!resend) {
    console.warn('[Resend] sendOnboarding1Email — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe  = escapeHtml((nombre || '').trim())
  const companySafe = escapeHtml(companyName || 'tu empresa')
  const color       = escapeHtml(primaryColor || '#019DF4')
  const loginSafe   = escapeHtml(loginUrl || 'https://elvia.lat')
  const dias        = Number(diasRestantes) || 9

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: `⚡ Tu primer paso: 7 min para destrabar tu búsqueda`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">

        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: ${color}; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 8px;">
          Hola${nombreSafe ? ` ${nombreSafe}` : ''} 👋
        </h2>
        <p style="color: #475569; margin: 0 0 20px; font-size: 15px;">
          Ayer activaste tu acceso al programa de <strong>${companySafe}</strong> en ELVIA®. ¡Bien hecho!
        </p>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 10px 10px 0; padding: 18px 20px; margin: 0 0 28px;">
          <p style="margin: 0 0 6px; font-weight: bold; color: #92400e; font-size: 15px;">
            ⏱️ Hay un paso que desbloquea todo lo demás
          </p>
          <p style="margin: 0; font-size: 14px; color: #78350f;">
            En solo <strong>7 minutos</strong> puedes completar las primeras secciones de tu Gerente de Proyecto Laboral. Eso activa el CV optimizado, la simulación de entrevistas y el match con vacantes.
          </p>
        </div>

        <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">
          <strong>¿Por dónde empezar?</strong>
        </p>
        <ol style="color: #475569; font-size: 14px; padding-left: 20px; margin: 0 0 28px;">
          <li style="margin-bottom: 8px;">Entra a la plataforma con tu correo y contraseña.</li>
          <li style="margin-bottom: 8px;">Ve a <strong>"Autoconocimiento – Gerente de proyecto laboral"</strong> (primer ítem del menú).</li>
          <li>Completa tu <strong>Perfil</strong> y <strong>Competencias</strong>. Son las secciones más cortas y desbloquean lo demás.</li>
        </ol>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginSafe}"
             style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Empezar ahora →
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Tienes <strong>${dias} días</strong> de acceso en este programa. Aprovecha al máximo cada herramienta.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad<br/>
          <span style="font-size: 10px; color: #cbd5e1;">
            Recibes este correo por ser participante del programa ${companySafe}.
            Si tienes dudas escríbenos a <a href="mailto:soporte@elvia.lat" style="color: #94a3b8;">soporte@elvia.lat</a>
          </span>
        </p>
      </div>
    `,
  })
}

/**
 * Engagement Day+3: si Gerente < 60% al tercer día.
 * "Te falta poco para desbloquear tu CV"
 */
const sendOnboarding3Email = async (to, { nombre, companyName, primaryColor, loginUrl, progreso, diasRestantes }) => {
  if (!resend) {
    console.warn('[Resend] sendOnboarding3Email — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe  = escapeHtml((nombre || '').trim())
  const companySafe = escapeHtml(companyName || 'tu empresa')
  const color       = escapeHtml(primaryColor || '#019DF4')
  const loginSafe   = escapeHtml(loginUrl || 'https://elvia.lat')
  const pct         = Math.round(Number(progreso) || 0)
  const dias        = Number(diasRestantes) || 7

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: `🎯 ${pct}% completado — te falta poco para desbloquear tu CV`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">

        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: ${color}; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 8px;">
          ¡Hola${nombreSafe ? ` ${nombreSafe}` : ''}! Ya llevas un ${pct}% 💪
        </h2>
        <p style="color: #475569; margin: 0 0 20px; font-size: 15px;">
          Vas bien. Y estás más cerca de lo que crees de tener tu <strong>CV optimizado estilo Harvard</strong> y todas las herramientas activas.
        </p>

        <!-- Barra de progreso visual -->
        <div style="background: #f1f5f9; border-radius: 99px; height: 12px; margin: 0 0 6px; overflow: hidden;">
          <div style="background: ${color}; width: ${pct}%; height: 100%; border-radius: 99px;"></div>
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0 0 28px; text-align: right;">${pct}% completado</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin: 0 0 28px;">
          <p style="margin: 0 0 10px; font-weight: bold; color: #14532d; font-size: 14px;">
            ✅ ¿Qué desbloqueas al llegar al 100%?
          </p>
          <ul style="margin: 0; padding-left: 18px; color: #166534; font-size: 14px;">
            <li style="margin-bottom: 6px;"><strong>CV optimizado</strong> con formato Harvard + ATS-friendly</li>
            <li style="margin-bottom: 6px;"><strong>Simulador de entrevistas</strong> con IA personalizada a tu perfil</li>
            <li style="margin-bottom: 6px;"><strong>Análisis de LinkedIn®</strong> con sugerencias concretas</li>
            <li><strong>Match de vacantes</strong> con score de compatibilidad</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginSafe}"
             style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Continuar donde lo dejé →
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Quedan <strong>${dias} días</strong> en tu programa. ¡Tú puedes!
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad<br/>
          <span style="font-size: 10px; color: #cbd5e1;">
            Recibes este correo por ser participante del programa ${companySafe}.
            <a href="mailto:soporte@elvia.lat" style="color: #94a3b8;">soporte@elvia.lat</a>
          </span>
        </p>
      </div>
    `,
  })
}

/**
 * Engagement Day+7: recap de mitad de programa (siempre se envía).
 * Muestra progreso real + urgencia (X días restantes).
 */
const sendRecap7Email = async (to, { nombre, companyName, primaryColor, loginUrl, progreso, cvGenerado, vacantesAnalizadas, entrevistasSimuladas, diasRestantes }) => {
  if (!resend) {
    console.warn('[Resend] sendRecap7Email — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe  = escapeHtml((nombre || '').trim())
  const companySafe = escapeHtml(companyName || 'tu empresa')
  const color       = escapeHtml(primaryColor || '#019DF4')
  const loginSafe   = escapeHtml(loginUrl || 'https://elvia.lat')
  const pct         = Math.round(Number(progreso) || 0)
  const dias        = Number(diasRestantes) || 3
  const cvOk        = !!cvGenerado
  const vacantes    = Number(vacantesAnalizadas) || 0
  const entrevistas = Number(entrevistasSimuladas) || 0

  // Mensaje de urgencia según días restantes
  const urgenciaMsg = dias <= 3
    ? `⚠️ Solo quedan <strong>${dias} días</strong> de acceso. Aprovecha ahora.`
    : `Quedan <strong>${dias} días</strong> en tu programa.`

  // Ítem de logro dinámico
  const logros = []
  if (pct >= 100) logros.push('✅ Autoconocimiento completado al 100%')
  else logros.push(`📊 Autoconocimiento: <strong>${pct}%</strong> completado`)
  if (cvOk) logros.push('✅ CV optimizado generado')
  else logros.push('⬜ CV optimizado: pendiente')
  if (vacantes > 0) logros.push(`✅ ${vacantes} vacante${vacantes > 1 ? 's' : ''} analizada${vacantes > 1 ? 's' : ''}`)
  else logros.push('⬜ Análisis de vacantes: pendiente')
  if (entrevistas > 0) logros.push(`✅ ${entrevistas} simulación${entrevistas > 1 ? 'es' : ''} de entrevista completada${entrevistas > 1 ? 's' : ''}`)
  else logros.push('⬜ Simulaciones de entrevista: pendiente')

  const logrosHTML = logros.map(l => `<li style="margin-bottom: 10px; font-size: 14px;">${l}</li>`).join('')

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: `📊 Llevas 7 días en ELVIA® — esto has logrado`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">

        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: ${color}; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 8px;">
          ${nombreSafe ? `${nombreSafe}, llevas` : 'Llevas'} 7 días en el programa 🎉
        </h2>
        <p style="color: #475569; margin: 0 0 20px; font-size: 15px;">
          Aquí está tu resumen. Cada acción que tomaste en la plataforma es un paso real hacia tu próxima oportunidad.
        </p>

        <!-- Resumen de logros -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 0 0 28px;">
          <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #64748b;">
            Tu progreso hasta hoy
          </p>
          <ul style="margin: 0; padding-left: 0; list-style: none; color: #1e293b;">
            ${logrosHTML}
          </ul>
        </div>

        <!-- Barra de progreso -->
        <div style="background: #f1f5f9; border-radius: 99px; height: 10px; margin: 0 0 6px; overflow: hidden;">
          <div style="background: ${color}; width: ${pct}%; height: 100%; border-radius: 99px;"></div>
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0 0 28px; text-align: right;">${pct}% del Autoconocimiento completado</p>

        <!-- Urgencia -->
        <div style="background: #fff7ed; border-left: 4px solid #f97316; border-radius: 0 10px 10px 0; padding: 16px 20px; margin: 0 0 28px;">
          <p style="margin: 0; font-size: 14px; color: #7c2d12;">
            ${urgenciaMsg} Las herramientas avanzadas — CV, entrevistas, análisis LinkedIn® — requieren completar el Autoconocimiento. No dejes pasar el tiempo.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginSafe}"
             style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ir a la plataforma →
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad<br/>
          <span style="font-size: 10px; color: #cbd5e1;">
            Recibes este correo por ser participante del programa ${companySafe}.
            <a href="mailto:soporte@elvia.lat" style="color: #94a3b8;">soporte@elvia.lat</a>
          </span>
        </p>
      </div>
    `,
  })
}

module.exports = {
  sendOfertaValorCompletadaEmail,
  sendInfografiaGeneradaEmail,
  sendCVOptimizadoCompletadaEmail,
  sendOnboarding1Email,
  sendOnboarding3Email,
  sendRecap7Email,
};

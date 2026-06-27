// Política de acceso / plan del usuario.
//
// ELVIA es B2B puro: NO hay planes freemium, el acceso es full para todos
// (modelo freemium eliminado 2026-06-22 — ver docs/legacy/freemium-model.md).
// Por eso esto es un hook que devuelve un objeto CONSTANTE, no un Context: el
// valor nunca cambia en runtime, así que no necesita Provider ni causa re-renders.
//
// Es el ÚNICO punto de costura si B2C vuelve algún día (ADR-004): aquí se
// reemplazaría el objeto plano por lógica real basada en el perfil/suscripción.
// Mientras tanto, los campos existen para los componentes que aún los leen
// (Perfil, Landing2, useChat, useCVWizard, PilarMiPerfil).
import { useMemo } from 'react'

const PLAN_ACCESS = Object.freeze({
  // Acceso a features
  isPaidPlan: true,
  trialExpired: false,
  canOptimizeCV: true,
  canMatchCV: true,
  creditosMatchRestantes: Infinity,
  watermark: false,
  // Retrocompatibilidad: campos de cuota que la UI de créditos todavía referencia
  usageCount: 0,
  creditosRestantes: Infinity,
  LIMITE_PLAN: Infinity,
})

/**
 * Política de acceso/plan, hoy plana para B2B puro.
 * @returns {Readonly<typeof PLAN_ACCESS>}
 */
export function usePlan() {
  // useMemo por simetría con el resto de hooks y para que el retorno sea estable;
  // el objeto ya es una constante de módulo congelada.
  return useMemo(() => PLAN_ACCESS, [])
}

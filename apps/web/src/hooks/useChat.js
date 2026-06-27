import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { usePlan } from '../context/usePlan';
import { useTrackEvent } from './useTrackEvent';

const MAX_MENSAJES_FREE = 20;
const MAX_MENSAJES_PRO  = 50;

const MENSAJE_DASHBOARD = `¡Hola! Soy **ELVIA**, tu mentora de carrera 24/7. 👋

Estás en tu **Dashboard** — tu centro de control.

Este es el mejor momento para tomarte un respiro y dedicar el tiempo que necesitas para llenar tu **Gerente de Búsqueda**. Ahí construyes tu estrategia completa: perfil, recursos, semana de búsqueda y propuesta de valor. Cuanto antes lo completes, antes se desbloquean todas las herramientas.

¿En qué te puedo ayudar hoy?`;

const MENSAJE_GENERAL = `Hola, soy **ELVIA**, tu asistente y mentora en todo tu proceso de crecimiento profesional. Puedes preguntarme cómo usar cualquier función de la app o pedirme consejos sobre tu carrera.`;

const MENSAJE_MANUAL = `📖 **Modo manual activado.** Respondo solo con información oficial del manual de uso de ELVIA. Si no encuentro la respuesta ahí, te lo digo y te conecto con un mentor.`;

export function useChat({ mode = 'general' } = {}) {
  const location = useLocation();
  const { isPaidPlan } = usePlan();
  const trackEvent = useTrackEvent();

  const MAX_MENSAJES_SESION = isPaidPlan ? MAX_MENSAJES_PRO : MAX_MENSAJES_FREE;

  const initialMessage = mode === 'manual'
    ? MENSAJE_MANUAL
    : (location.pathname === '/dashboard' ? MENSAJE_DASHBOARD : MENSAJE_GENERAL);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: initialMessage }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const mensajesUsuario = messages.filter(m => m.role === 'user').length;
  const limitAlcanzado = mensajesUsuario >= MAX_MENSAJES_SESION;

  const sendMessage = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const userMsg = quickText || inputVal.trim();
    if (!userMsg || loading) return;

    if (limitAlcanzado) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Has alcanzado el límite de ${MAX_MENSAJES_SESION} mensajes por sesión. Recarga la página para iniciar una nueva conversación.`
      }]);
      return;
    }

    if (!quickText) setInputVal('');

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    if (mode === 'manual') {
      trackEvent('bot_ayuda_query', 'bot_manual', { question_length: userMsg.length, pathname: location.pathname });
    }

    try {
      const endpoint = mode === 'manual' ? '/api/chat/manual' : '/api/chat';
      const payload = mode === 'manual'
        ? { message: userMsg, history: messages.slice(1) }
        : { message: userMsg, history: messages.slice(1), context: `El usuario se encuentra en la URL: ${location.pathname}` };

      const res = await api.post(endpoint, payload);

      if (res.reply) {
        if (mode === 'manual') {
          trackEvent('bot_ayuda_reply', 'bot_manual', {
            has_citas: (res.citas || []).length > 0,
            cita_principal: res.citas?.[0]?.anchor || null,
            escalated: Boolean(res.requiere_escalamiento),
          });
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.reply,
          citas: res.citas || [],
          requiere_escalamiento: res.requiere_escalamiento || false,
        }]);
      } else if (res.error) {
        const esAuthError = ['Token inválido o expirado', 'Token no proporcionado', 'No autorizado'].includes(res.error);
        const msg = esAuthError
          ? 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.'
          : 'Lo siento, hubo un error al conectar con mis sistemas. Intenta de nuevo más tarde.';
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
      }
    } catch (err) {
      const msg = err?.message || 'Error de red. Asegúrate de tener conexión.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([{ role: 'assistant', content: initialMessage }]);
    setInputVal('');
  };

  return {
    messages,
    inputVal,
    setInputVal,
    loading,
    sendMessage,
    resetConversation,
    mensajesUsuario,
    maxMensajes: MAX_MENSAJES_SESION,
    limitAlcanzado,
    mode,
  };
}

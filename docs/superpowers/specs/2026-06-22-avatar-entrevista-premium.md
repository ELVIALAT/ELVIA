# Spec — Avatar premium del Simulador de Entrevistas

**Fecha:** 2026-06-22
**Estado:** Aprobado, pendiente de ejecución (DESPUÉS del refactor modular de `interview`).
**Decisión:** enfoque costo-eficiente premium — **OpenAI TTS + rostro humano en video loop + repreguntas adaptativas + streaming**. NO tiempo real (Tavus/streaming) por costo ($30-60/h vs ~$1-2/h).

## Estado actual (2026-06-22)
- `frontend/src/pages/Entrevista.jsx` (1174 LOC). TTS = `speechSynthesis` del browser (robótico, variable por dispositivo). STT = `SpeechRecognition` (solo Chrome bien).
- "Avatar" = logo estático en un cuadro con borde que cambia al hablar (`hablando` state). No hay rostro.
- Assets disponibles: `Avatar-Elvia-HD.webp`, `mentor_hero_human.png`, `Optima video mentor 0.mp4`.
- Backend: `interviewController.js` (75 LOC) → genera preguntas + evalúa con Claude.

## Insight rector
El realismo percibido viene ~70% de la VOZ, no del rostro. Rostro perfecto + voz robótica = uncanny valley. Por eso: invertir primero en voz premium, rostro con video loop ($0), evitar el último 10% caro del tiempo real.

## Plan por capas

### 1. Voz premium (mayor impacto) ✅ HECHO (2026-06-22, commit c5a0612)
- Backend: `POST /api/interview/tts` (auth + dailyCap + Zod) → OpenAI TTS (`tts-1`, voz `onyx`) → audio mp3. En `src/modules/interview/interview.tts.js`. Degrada si falta OPENAI_API_KEY.
- Frontend: `leerEnVoz` en Entrevista.jsx pide audio al backend y reproduce; fallback a `leerEnVozBrowser` (speechSynthesis) si falla. `detenerVoz()` unifica el stop.
- ⏳ PENDIENTE de este paso: cachear audio por pregunta (las preguntas se repiten) para no re-generar; requiere OPENAI_API_KEY en Railway para activarse en staging.

### 2. Rostro en video loop ($0)
- Reemplazar el logo por un rostro humano. Usar `Optima video mentor 0.mp4` o generar 3 loops cortos UNA vez con HeyGen (~$5 total, no por uso): `idle` (escuchando), `hablando`, `asintiendo`.
- Reproducir el loop según estado (`hablando` ya existe). Crossfade entre loops.
- Un rostro humano real en loop se ve más premium que un avatar 3D mediocre.

### 3. Repreguntas adaptativas
- Hoy lee preguntas de una lista. Mejorar: que el entrevistador reaccione a la respuesta del candidato ("mencionaste X, profundiza") vía Claude con el historial de la conversación.

### 4. Streaming de respuestas
- Que el entrevistador empiece a hablar mientras genera (no esperar todo). Claude streaming → TTS por chunks.

### 5. (Opcional) Análisis de la respuesta hablada
- Tono, muletillas, ritmo — no solo el contenido. Requiere STT con timestamps.

## Costo estimado
~$1-2 por hora de práctica (casi todo voz OpenAI TTS). Sin infra de streaming de video. HeyGen solo si se generan los loops (one-time ~$5).

## Dependencia
Ejecutar sobre el módulo `interview` ya refactorizado a `src/modules/interview/` (routes→controller→service→repository→schemas). El TTS y la lógica adaptativa viven en el service.

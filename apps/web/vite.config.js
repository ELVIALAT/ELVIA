import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':       ['@phosphor-icons/react', 'react-hot-toast'],
          // OJO: NO agrupar las libs PDF (html2canvas/html2pdf.js/jspdf) en un chunk
          // vendor. Sus consumidores son todos lazy (4 `await import` + 2 rutas lazy),
          // pero un chunk vendor manual fuerza un modulepreload eager en index.html
          // (~984 kB descargados en la carga inicial aunque casi nadie genere un PDF).
          // Sin agruparlas, Rollup las deja en un chunk async real, cargado on-demand.
          // recharts NO va aquí: solo lo usan los tabs de Admin (ruta lazy), pero
          // agruparlo con react-markdown (eager vía AiChatBot del shell) lo arrastraba
          // al preload eager (~400 kB). Sin agruparlo, va al chunk lazy de Admin.
          'vendor-data':     ['react-markdown'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-misc':     ['framer-motion', '@marsidev/react-turnstile'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})

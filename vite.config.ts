import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polifilia manual para evitar errores de Node.js
    global: 'window',
    'process.env': {},
  }
})

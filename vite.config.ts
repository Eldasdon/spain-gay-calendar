import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // relativo, para que funcione tanto en GitHub Pages (repo.github.io/nombre/)
  // como en cualquier otra ruta/subcarpeta
  base: './',
})

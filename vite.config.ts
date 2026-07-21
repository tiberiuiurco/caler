import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// `base: './'` keeps every asset reference relative so the build output can
// be dropped into GitHub Pages (or any static host/sub-path) unmodified.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})

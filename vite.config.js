import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'Mis Tareas - Gestor de Tareas',
        short_name: 'Mis Tareas',
        description: 'Aplicación personal de gestión de tareas con soporte offline',
        theme_color: '#4c6ef5',
        background_color: '#f5f6f8',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'es',
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}']
      }
    })
  ],
  server: { port: 3000 },
  preview: { port: 3000 }
})

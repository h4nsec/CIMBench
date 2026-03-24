import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      // Proxy FHIR package registry requests to avoid CORS in dev
      '/fhir-proxy/packages': {
        target: 'https://packages.fhir.org',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/fhir-proxy\/packages/, ''),
      },
      '/fhir-proxy/packages2': {
        target: 'https://packages2.fhir.org',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/fhir-proxy\/packages2/, ''),
      },
      '/fhir-proxy/build': {
        target: 'https://build.fhir.org',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/fhir-proxy\/build/, ''),
      },
    },
  },
})

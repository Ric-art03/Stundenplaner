import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // `*.manual.test.ts` greift auf die echte Datenbank zu und braucht den
    // Dienstschlüssel aus .env.local. Solche Prüfungen laufen nur auf Abruf
    // (`npm run test:pruefplan`), damit `npm test` ohne Netz und Zugangsdaten
    // durchläuft.
    exclude: ['tests/**', 'node_modules/**', '**/*.manual.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})

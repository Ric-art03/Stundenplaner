import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/**
 * Nur für die datenbankabhängigen Prüfungen (`*.manual.test.ts`), die der
 * Standardlauf bewusst auslässt. Sie brauchen den Dienstschlüssel aus
 * `.env.local` und laufen gegen das echte Supabase-Projekt.
 *
 * Eigene Datei statt `mergeConfig`, weil dort die Ausschlusslisten
 * aneinandergehängt würden und der Ausschluss aus `vitest.config.ts` die
 * Dateien wieder herausfiltern würde.
 *
 * Aufruf: npm run test:pruefplan
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.manual.test.ts'],
    exclude: ['tests/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})

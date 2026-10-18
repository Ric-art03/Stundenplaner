// Starter des Prüfprogramms (PROJ-4). Lädt `cli.ts` über Vite — so gelten
// dieselben Pfade (`@/…`) wie in der App, und das Programm prüft mit genau den
// Listen und Grenzen des Übungsformulars, ohne eine zweite Fassung davon.
//
//   npm run bestand -- <befehl> <datei> [--ja]
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runnerImport } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const { module } = await runnerImport(path.join(root, 'scripts', 'library', 'cli.ts'), {
  configFile: false,
  root,
  logLevel: 'error',
  resolve: { alias: { '@': path.join(root, 'src') } },
})

process.exitCode = await module.main(process.argv.slice(2))

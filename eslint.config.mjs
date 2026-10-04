import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

// ESLint 9 erwartet diese Flat-Config. Die frühere .eslintrc.json wurde nicht
// mehr gelesen, und `next lint` gibt es in Next 16 nicht mehr — dadurch lief
// das Projekt eine Zeit lang ganz ohne Linting.
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...nextCoreWebVitals,
]

export default config

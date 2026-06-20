import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  //Vitest config. Pure-logic utils (e.g. pathbuilderImport) run under the default node
  //environment; switch a given test file to jsdom via a `// @vitest-environment jsdom`
  //pragma if/when component tests are added with @testing-library.
  test: {
    environment: 'node',
  },
})

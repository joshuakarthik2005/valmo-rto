/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { combined, lakh } from './src/lib/model'

// Meta tags read their numbers from the model too, so the link preview cannot drift.
const ogRange = `${lakh(combined('conservative').net)}–${lakh(combined('ceiling').net)}`

export default defineConfig({
  plugins: [
    react(),
    { name: 'og-from-model', transformIndexHtml: (html) => html.replaceAll('%OG_RANGE%', ogRange) },
  ],
  build: {
    target: 'es2020',
    // The original single-file prototype stays reachable at /legacy/
    rollupOptions: { input: { main: 'index.html', legacy: 'legacy/index.html' } },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'] },
})

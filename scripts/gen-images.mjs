// Renders social/share images with the local Chrome: public/og.png, apple-touch-icon.png, favicon.ico (PNG payload).
// Run after `npm run build` with a preview server on :4173:  node scripts/gen-images.mjs
import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

const b = await chromium.launch({ channel: 'chrome' })
const svg = readFileSync('public/favicon.svg', 'utf8')
for (const [file, size] of [['public/apple-touch-icon.png', 180], ['public/favicon.ico', 48]]) {
  const p = await b.newPage({ viewport: { width: size, height: size } })
  await p.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  writeFileSync(file, await p.screenshot({ omitBackground: true }))
  await p.close()
}
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await p.goto('http://localhost:4173/#/og', { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
await p.screenshot({ path: 'public/og.png' })
await b.close()
console.log('images written')

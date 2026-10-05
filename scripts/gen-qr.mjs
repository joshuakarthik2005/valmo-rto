// Generates QR codes from src/data/links.ts so the QR and printed text cannot disagree.
//   node scripts/gen-qr.mjs          -> src/generated/qr-live.svg (the "Try it on your phone" QR in the app)
//   node scripts/gen-qr.mjs --png    -> also docs/qr-repo.png and docs/qr-live.png (for the deck)
import { mkdirSync, writeFileSync } from 'node:fs'
import QRCode from 'qrcode'
import { LINKS } from '../src/data/links.ts'

const targets = { repo: LINKS.repo, live: LINKS.live }
const IN_APP = ['live']
const opts = { errorCorrectionLevel: 'M', margin: 1, color: { dark: '#2A1424', light: '#FFFFFF' } }

mkdirSync('src/generated', { recursive: true })
for (const [name, url] of Object.entries(targets)) {
  if (IN_APP.includes(name)) {
    const svg = await QRCode.toString(url, { ...opts, type: 'svg' })
    writeFileSync(`src/generated/qr-${name}.svg`, svg)
  }
  if (process.argv.includes('--png')) {
    mkdirSync('docs', { recursive: true })
    await QRCode.toFile(`docs/qr-${name}.png`, url, { ...opts, width: 1024, margin: 2 })
  }
}
console.log('App QR:', LINKS.live, process.argv.includes('--png') ? '| PNGs: ' + Object.values(targets).join(', ') : '')

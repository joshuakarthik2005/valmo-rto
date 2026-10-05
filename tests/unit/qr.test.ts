import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { LINKS } from '../../src/data/links'

const opts = { errorCorrectionLevel: 'M' as const, margin: 1, color: { dark: '#2A1424', light: '#FFFFFF' } }

function decodePng(buf: Buffer) {
  const png = PNG.sync.read(buf)
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data
}

describe('Verify-it-yourself QR codes', () => {
  for (const [name, url] of [['repo', LINKS.repo], ['live', LINKS.live]] as const) {
    it(`${name} QR decodes to the printed URL (${url})`, async () => {
      const buf = await QRCode.toBuffer(url, { ...opts, width: 400 })
      expect(decodePng(buf)).toBe(url)
    })
    it(`${name} QR shipped in the app is generated from links.ts`, async () => {
      const path = `src/generated/qr-${name}.svg`
      expect(existsSync(path)).toBe(true)
      expect(readFileSync(path, 'utf8')).toBe(await QRCode.toString(url, { ...opts, type: 'svg' }))
    })
    const png = `docs/qr-${name}.png`
    it.runIf(existsSync(png))(`docs/qr-${name}.png decodes to ${url}`, () => {
      expect(decodePng(readFileSync(png))).toBe(url)
    })
  }
  it('printed repo path matches the QR target', () => {
    expect(LINKS.repo).toBe(`https://${LINKS.repoDisplay}`)
    expect(LINKS.live).toBe(`https://${LINKS.liveDisplay}`)
  })
})

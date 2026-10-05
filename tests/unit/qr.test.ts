import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { LINKS } from '../../src/data/links'

function decodePng(buf: Buffer) {
  const png = PNG.sync.read(buf)
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data
}

/**
 * Rasterises the SVG that `qrcode` emits (one stroked path of "M x y h n m dx dy" runs,
 * each 1 module tall) and decodes it, so the test reads the exact file shipped in the app.
 */
function decodeQrSvg(svg: string) {
  const size = Number(/viewBox="0 0 (\d+) \d+"/.exec(svg)![1])
  const d = /<path stroke="[^"]+" d="([^"]+)"/.exec(svg)![1]
  const grid = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  let x = 0, y = 0
  for (const [, cmd, args] of d.matchAll(/([MmHh])([^MmHh]*)/g)) {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number)
    if (cmd === 'M') { x = n[0]; y = n[1] }
    else if (cmd === 'm') { x += n[0]; y += n[1] }
    else {
      const len = cmd === 'h' ? n[0] : n[0] - x
      for (let k = 0; k < len; k++) grid[Math.floor(y)][x + k] = true
      x += len
    }
  }
  const scale = 10
  const w = size * scale
  const data = new Uint8ClampedArray(w * w * 4)
  for (let py = 0; py < w; py++) for (let px = 0; px < w; px++) {
    const dark = grid[Math.floor(py / scale)][Math.floor(px / scale)]
    const i = (py * w + px) * 4
    data[i] = data[i + 1] = data[i + 2] = dark ? 0 : 255
    data[i + 3] = 255
  }
  return jsQR(data, w, w)?.data
}

describe('Verify-it-yourself QR codes', () => {
  it('the app ships exactly one QR: "Try it on your phone"', () => {
    expect(existsSync('src/generated/qr-live.svg')).toBe(true)
    expect(existsSync('src/generated/qr-repo.svg')).toBe(false)
  })

  it(`the in-app QR decodes to the production URL (${LINKS.live})`, () => {
    expect(decodeQrSvg(readFileSync('src/generated/qr-live.svg', 'utf8'))).toBe(LINKS.live)
  })

  for (const [name, url] of [['repo', LINKS.repo], ['live', LINKS.live]] as const) {
    it(`docs/qr-${name}.png (for the deck) decodes to ${url}`, () => {
      const png = `docs/qr-${name}.png`
      expect(existsSync(png), `${png} missing: run node scripts/gen-qr.mjs --png`).toBe(true)
      expect(decodePng(readFileSync(png))).toBe(url)
    })
  }

  it('printed repo path and production URL match the QR targets', () => {
    expect(LINKS.repo).toBe(`https://${LINKS.repoDisplay}`)
    expect(LINKS.live).toBe(`https://${LINKS.liveDisplay}`)
  })
})

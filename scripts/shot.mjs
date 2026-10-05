import { chromium } from '@playwright/test'
const [,, url, out, w='1440', h='900'] = process.argv
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: +w, height: +h } })
const errs = []
p.on('console', m => m.type()==='error' && errs.push(m.text()))
p.on('pageerror', e => errs.push(String(e)))
await p.goto(url, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
await p.screenshot({ path: out, fullPage: true })
console.log('errors:', errs.length ? errs : 'none')
await b.close()

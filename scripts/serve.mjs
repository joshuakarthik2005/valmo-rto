// Production-like static server for tests: serves dist/ and applies the response headers from vercel.json,
// so the CSP and security headers are live under Playwright and Lighthouse CI, not only on Vercel.
//   node scripts/serve.mjs [--port 4173]
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'

const port = Number(process.argv[process.argv.indexOf('--port') + 1] || 4173)
const root = 'dist'
const rules = (JSON.parse(readFileSync('vercel.json', 'utf8')).headers ?? []).map((r) => ({
  // vercel.json sources here are plain regex groups such as /(.*) and /((?!legacy).*); anchor them
  re: new RegExp(`^${r.source}$`),
  headers: r.headers,
}))
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/vnd.microsoft.icon', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = normalize(join(root, path))
  if (!file.startsWith(normalize(root))) { res.writeHead(403).end(); return }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); return }
  for (const r of rules) if (r.re.test(path)) for (const h of r.headers) res.setHeader(h.key, h.value)
  const type = TYPES[extname(file)] ?? 'application/octet-stream'
  res.setHeader('content-type', type)
  let body = readFileSync(file)
  // Compress text like Vercel does (brotli, else gzip); fonts and images are already compressed
  const accept = String(req.headers['accept-encoding'] ?? '')
  if (/text|javascript|json|svg/.test(type)) {
    res.setHeader('vary', 'accept-encoding')
    if (accept.includes('br')) { body = brotliCompressSync(body); res.setHeader('content-encoding', 'br') }
    else if (accept.includes('gzip')) { body = gzipSync(body); res.setHeader('content-encoding', 'gzip') }
  }
  res.setHeader('content-length', body.length)
  res.end(body)
}).listen(port, () => console.log(`Local: http://localhost:${port}/ (vercel.json headers applied)`))

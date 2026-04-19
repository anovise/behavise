import { createBehavier } from 'behavier'

// ─── Init ─────────────────────────────────────────────────────────────────

const b = createBehavier({
  pointer: { autoStart: true, maxSamples: 600, minDistance: 2 },
  dwell: { autoStart: true, threshold: 800, tolerance: 10 },
  navigation: { autoStart: true },
  scroll: { autoStart: true, throttleMs: 50 },
  click: { autoStart: true },
  visibility: { autoStart: true, threshold: 0.3 },
})

// ─── Utilities ────────────────────────────────────────────────────────────

function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return `${m}m ${pad(s)}s`
}

// ─── Pointer ──────────────────────────────────────────────────────────────

const canvas = $('ptr-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

function resizeCanvas(): void {
  const w = canvas.offsetWidth
  const h = canvas.offsetHeight
  if (w > 0 && h > 0) {
    canvas.width = w
    canvas.height = h
  }
}
// Double rAF ensures CSS layout has been applied before measuring dimensions
requestAnimationFrame(() => requestAnimationFrame(resizeCanvas))
window.addEventListener('resize', resizeCanvas, { passive: true })

function drawTrail(): void {
  const history = b.pointer!.history
  const W = canvas.width
  const H = canvas.height
  const wW = window.innerWidth
  const wH = window.innerHeight

  ctx.clearRect(0, 0, W, H)

  const n = history.length
  if (n < 2) return

  const start = Math.max(0, n - 400)

  for (let i = start + 1; i < n; i++) {
    const p = history[i]
    const prev = history[i - 1]
    if (!p || !prev) continue

    const t = (i - start) / (n - start)
    ctx.beginPath()
    ctx.moveTo((prev.x / wW) * W, (prev.y / wH) * H)
    ctx.lineTo((p.x / wW) * W, (p.y / wH) * H)
    ctx.strokeStyle = `rgba(129, 140, 248, ${t * 0.75})`
    ctx.lineWidth = t * 1.8
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const last = history[n - 1]
  if (!last) return

  const lx = (last.x / wW) * W
  const ly = (last.y / wH) * H

  ctx.beginPath()
  ctx.arc(lx, ly, 5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(129, 140, 248, 0.2)'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(lx, ly, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = '#818cf8'
  ctx.fill()
}

b.pointer!.on('move', ({ x, y }) => {
  $('ptr-x').textContent = String(x)
  $('ptr-y').textContent = String(y)
  $('ptr-samples').textContent = String(b.pointer!.history.length)
  drawTrail()
  const hc = document.getElementById('hero-cursor')
  if (hc) hc.textContent = `${x}, ${y}`
})

// ─── Clicks ───────────────────────────────────────────────────────────────

let totalClicks = 0
const clickLog = $('click-log')

b.click!.on('click', ({ target, count, x, y }) => {
  totalClicks++
  $('click-total').textContent = String(totalClicks)
  const hk = document.getElementById('hero-clicks')
  if (hk) hk.textContent = String(totalClicks)

  const empty = clickLog.querySelector('.log-empty')
  if (empty) empty.remove()

  const entry = document.createElement('div')
  entry.className = 'log-entry'
  entry.innerHTML = `<span class="log-target">${target}</span><span class="log-count">${count}×</span>`
  clickLog.prepend(entry)

  while (clickLog.children.length > 5) {
    clickLog.lastElementChild?.remove()
  }

  spawnRipple(x, y)
})

function spawnRipple(x: number, y: number): void {
  const el = document.createElement('div')
  el.className = 'click-ripple'
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  document.body.appendChild(el)
  el.addEventListener('animationend', () => el.remove(), { once: true })
}

// ─── Scroll ───────────────────────────────────────────────────────────────

b.scroll!.on('scroll', ({ depthPercent, maxDepthPercent }) => {
  const fill = $('scroll-fill')
  const marker = $('scroll-max-marker')
  fill.style.height = `${depthPercent}%`
  marker.style.bottom = `${maxDepthPercent}%`
  $('scroll-depth').textContent = `${depthPercent}%`
  $('scroll-max').textContent = `${maxDepthPercent}%`
  const hd = document.getElementById('hero-depth')
  if (hd) hd.textContent = `${depthPercent}%`
})

// Show initial scroll depth (0% at page top) immediately
;(function syncScrollNow(): void {
  const scrolled = window.scrollY
  const total = document.documentElement.scrollHeight - window.innerHeight
  const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0
  $('scroll-fill').style.height = `${pct}%`
  $('scroll-depth').textContent = `${pct}%`
  $('scroll-max').textContent = `${pct}%`
})()

// ─── Dwell ────────────────────────────────────────────────────────────────

const DWELL_ZONES = [
  { elId: 'dzone-0', label: 'Hero Zone' },
  { elId: 'dzone-1', label: 'Feature Area' },
  { elId: 'dzone-2', label: 'CTA Section' },
]

const dwellAccum: Record<string, number> = {}

// Build zone rows in the card
const dwellListEl = $('dwell-list')
for (const { label } of DWELL_ZONES) {
  dwellAccum[label] = 0
  const safeId = label.replace(/\s+/g, '-')

  const row = document.createElement('div')
  row.className = 'dwell-row'
  row.innerHTML = `
    <div class="dwell-row-top">
      <span class="dwell-zone-name">${label}</span>
      <span class="dwell-zone-time mono" id="dwell-time-${safeId}">0s</span>
    </div>
    <div class="dwell-bar-track">
      <div class="dwell-bar-fill" id="dwell-bar-${safeId}"></div>
    </div>
  `
  dwellListEl.appendChild(row)
}

function updateDwellZones(): void {
  for (const { elId, label } of DWELL_ZONES) {
    const el = $(elId)
    const rect = el.getBoundingClientRect()
    b.dwell!.removeZone(label)
    b.dwell!.addZone({
      id: label,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    })
  }
}

updateDwellZones()
window.addEventListener('scroll', updateDwellZones, { passive: true })
window.addEventListener('resize', updateDwellZones, { passive: true })

b.dwell!.on('dwell', ({ zoneId, duration }) => {
  dwellAccum[zoneId] = (dwellAccum[zoneId] ?? 0) + duration
  const safeId = zoneId.replace(/\s+/g, '-')

  const timeEl = $(`dwell-time-${safeId}`)
  if (timeEl) timeEl.textContent = formatMs(dwellAccum[zoneId]!)

  // Flash the zone box
  const zoneEl = DWELL_ZONES.find((z) => z.label === zoneId)
  if (zoneEl) {
    const box = $(zoneEl.elId)
    box.classList.remove('is-active')
    // Force reflow so animation restarts
    void box.offsetWidth
    box.classList.add('is-active')
    setTimeout(() => box.classList.remove('is-active'), 500)
  }

  // Update relative bars
  const maxAccum = Math.max(...Object.values(dwellAccum))
  for (const { label } of DWELL_ZONES) {
    const barEl = document.getElementById(`dwell-bar-${label.replace(/\s+/g, '-')}`)
    if (barEl && maxAccum > 0) {
      barEl.style.width = `${((dwellAccum[label] ?? 0) / maxAccum) * 100}%`
    }
  }
})

// ─── Visibility ───────────────────────────────────────────────────────────

const VIS_TARGETS = [
  { elId: 'vis-0', label: 'Hero Banner' },
  { elId: 'vis-1', label: 'Feature Card' },
  { elId: 'vis-2', label: 'CTA Block' },
]

const visListEl = $('vis-list')

for (const { elId, label } of VIS_TARGETS) {
  const el = $(elId)
  b.visibility!.observe(el, label)

  const safeId = label.replace(/\s+/g, '-')
  const row = document.createElement('div')
  row.className = 'vis-row'
  row.innerHTML = `
    <div class="vis-row-top">
      <span class="vis-name">${label}</span>
      <span class="vis-badge vis-badge--out" id="vis-badge-${safeId}">out</span>
    </div>
    <span class="vis-time-label" id="vis-time-${safeId}">0s visible · 0 views</span>
  `
  visListEl.appendChild(row)
}

function updateVisRow(
  target: string,
  totalVisible: number,
  intersections: number,
  inView: boolean,
): void {
  const safeId = target.replace(/\s+/g, '-')
  const badge = document.getElementById(`vis-badge-${safeId}`)
  const label = document.getElementById(`vis-time-${safeId}`)
  const visEl = VIS_TARGETS.find((v) => v.label === target)

  if (badge) {
    badge.textContent = inView ? 'in view' : 'out'
    badge.className = `vis-badge ${inView ? 'vis-badge--in' : 'vis-badge--out'}`
  }
  if (label) {
    label.textContent = `${formatMs(totalVisible)} visible · ${intersections} view${intersections !== 1 ? 's' : ''}`
  }
  if (visEl) {
    $(visEl.elId).classList.toggle('is-visible', inView)
  }
}

b.visibility!.on('visible', ({ target, totalVisible, intersections }) => {
  updateVisRow(target, totalVisible, intersections, true)
})
b.visibility!.on('hidden', ({ target, totalVisible, intersections }) => {
  updateVisRow(target, totalVisible, intersections, false)
})

// ─── Navigation ───────────────────────────────────────────────────────────

$('nav-url').textContent = location.pathname || '/'

const pageStart = Date.now()

setInterval(() => {
  const elapsed = Math.floor((Date.now() - pageStart) / 1000)
  const timeStr = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${pad(elapsed % 60)}s`
  $('nav-time').textContent = timeStr
  const ht = document.getElementById('hero-time')
  if (ht) ht.textContent = timeStr

  const counts = b.navigation?.visitCounts ?? {}
  const total = Object.values(counts).reduce((a, v) => a + v, 0)
  $('nav-visits').textContent = String(total || 1)
}, 1000)

b.navigation!.on('visit', ({ url }) => {
  $('nav-url').textContent = url || location.pathname
})

// ─── Copy buttons ─────────────────────────────────────────────────────────

const COPY_SVG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M2 11V3a2 2 0 012-2h8"/></svg>`
const CHECK_SVG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l4 4 6-7"/></svg>`

function makeCopyable(btnId: string, iconId: string, text: string): void {
  const btn = document.getElementById(btnId)
  const icon = document.getElementById(iconId)
  if (!btn || !icon) return
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      icon.innerHTML = CHECK_SVG
      btn.classList.add('is-copied')
      setTimeout(() => {
        icon.innerHTML = COPY_SVG
        btn.classList.remove('is-copied')
      }, 2000)
    })
  })
}

makeCopyable('btn-copy-install', 'btn-copy-icon', 'npm install behavier')
makeCopyable('btn-copy-install-cta', 'btn-copy-icon-cta', 'npm install behavier')


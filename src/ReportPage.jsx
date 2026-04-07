import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, TrendingUp,
  Timer, BarChart3, CircleAlert, Flame, Activity, Moon, Sunrise,
  Sun, Cloud, Sunset, Star
} from 'lucide-react'
import { db } from './firebase'
import { ref, onValue } from 'firebase/database'
import { processFirebaseSnap } from './crypto'

const f = base => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const TIPO_COLORI = {
  'Crisi tonico-cloniche': '#F7295A',
  'Crisi di assenza': '#7B5EA7',
  'Crisi miocloniche': '#FF8C42',
  'Crisi toniche': '#2e84e9',
  'Crisi cloniche': '#00BFA6',
  'Crisi atoniche': '#FFD93D',
}

const PERIODI = [
  { key: 'week', label: '7g', days: 7 },
  { key: 'month', label: '30g', days: 30 },
  { key: '3months', label: '3M', days: 90 },
  { key: '6months', label: '6M', days: 180 },
  { key: 'year', label: '1A', days: 365 },
  { key: 'all', label: 'Tutto', days: 99999 },
]

const FASCE = [
  { label: 'Notte', sub: '0-4', color: '#193f9e', Icon: Moon, range: [0, 4] },
  { label: 'Alba', sub: '4-8', color: '#FF8C42', Icon: Sunrise, range: [4, 8] },
  { label: 'Mattina', sub: '8-12', color: '#FFD93D', Icon: Sun, range: [8, 12] },
  { label: 'Pomerig.', sub: '12-16', color: '#2e84e9', Icon: Cloud, range: [12, 16] },
  { label: 'Sera', sub: '16-20', color: '#FF8C42', Icon: Sunset, range: [16, 20] },
  { label: 'Notte', sub: '20-24', color: '#7B5EA7', Icon: Star, range: [20, 24] },
]

const DEMO_CRISI = [
  { id: 1, type: 'Crisi tonico-cloniche', duration: '00:02:34', durationSec: 154, timestamp: Date.now() - 1 * 86400000, intensita: 8, perdCoscienza: true },
  { id: 2, type: 'Crisi di assenza', duration: '00:00:18', durationSec: 18, timestamp: Date.now() - 1 * 86400000 + 3600000 * 12, intensita: 4, perdCoscienza: false },
  { id: 3, type: 'Crisi miocloniche', duration: '00:00:45', durationSec: 45, timestamp: Date.now() - 3 * 86400000, intensita: 5, perdCoscienza: false },
  { id: 4, type: 'Crisi tonico-cloniche', duration: '00:03:10', durationSec: 190, timestamp: Date.now() - 6 * 86400000, intensita: 9, perdCoscienza: true },
  { id: 5, type: 'Crisi tonico-cloniche', duration: '00:03:30', durationSec: 210, timestamp: Date.now() - 6 * 86400000 + 3600000 * 3, intensita: 8, perdCoscienza: true },
  { id: 6, type: 'Crisi atoniche', duration: '00:00:08', durationSec: 8, timestamp: Date.now() - 9 * 86400000, intensita: 3, perdCoscienza: false },
  { id: 7, type: 'Crisi di assenza', duration: '00:00:22', durationSec: 22, timestamp: Date.now() - 12 * 86400000, intensita: 3, perdCoscienza: false },
  { id: 8, type: 'Crisi toniche', duration: '00:01:20', durationSec: 80, timestamp: Date.now() - 12 * 86400000 + 3600000 * 22, intensita: 6, perdCoscienza: true },
  { id: 9, type: 'Crisi tonico-cloniche', duration: '00:01:55', durationSec: 115, timestamp: Date.now() - 15 * 86400000, intensita: 7, perdCoscienza: true },
  { id: 10, type: 'Crisi di assenza', duration: '00:00:30', durationSec: 30, timestamp: Date.now() - 17 * 86400000, intensita: 2, perdCoscienza: false },
  { id: 11, type: 'Crisi toniche', duration: '00:01:10', durationSec: 70, timestamp: Date.now() - 19 * 86400000, intensita: 6, perdCoscienza: true },
  { id: 12, type: 'Crisi tonico-cloniche', duration: '00:02:55', durationSec: 175, timestamp: Date.now() - 22 * 86400000, intensita: 8, perdCoscienza: true },
  { id: 13, type: 'Crisi di assenza', duration: '00:00:20', durationSec: 20, timestamp: Date.now() - 22 * 86400000 + 3600000 * 9, intensita: 3, perdCoscienza: false },
  { id: 14, type: 'Crisi miocloniche', duration: '00:00:55', durationSec: 55, timestamp: Date.now() - 25 * 86400000, intensita: 5, perdCoscienza: false },
  { id: 15, type: 'Crisi toniche', duration: '00:01:30', durationSec: 90, timestamp: Date.now() - 27 * 86400000, intensita: 7, perdCoscienza: true },
  { id: 16, type: 'Crisi tonico-cloniche', duration: '00:03:20', durationSec: 200, timestamp: Date.now() - 29 * 86400000, intensita: 9, perdCoscienza: true },
  { id: 17, type: 'Crisi tonico-cloniche', duration: '00:02:40', durationSec: 160, timestamp: Date.now() - 365 * 86400000 - 2 * 86400000, intensita: 8, perdCoscienza: true },
  { id: 18, type: 'Crisi di assenza', duration: '00:00:20', durationSec: 20, timestamp: Date.now() - 365 * 86400000 - 5 * 86400000, intensita: 4, perdCoscienza: false },
  { id: 19, type: 'Crisi tonico-cloniche', duration: '00:03:00', durationSec: 180, timestamp: Date.now() - 365 * 86400000 - 8 * 86400000, intensita: 9, perdCoscienza: true },
  { id: 20, type: 'Crisi tonico-cloniche', duration: '00:03:40', durationSec: 220, timestamp: Date.now() - 365 * 86400000 - 11 * 86400000, intensita: 9, perdCoscienza: true },
  { id: 21, type: 'Crisi miocloniche', duration: '00:00:40', durationSec: 40, timestamp: Date.now() - 365 * 86400000 - 14 * 86400000, intensita: 5, perdCoscienza: false },
  { id: 22, type: 'Crisi di assenza', duration: '00:00:25', durationSec: 25, timestamp: Date.now() - 365 * 86400000 - 17 * 86400000, intensita: 3, perdCoscienza: false },
  { id: 23, type: 'Crisi toniche', duration: '00:01:25', durationSec: 85, timestamp: Date.now() - 365 * 86400000 - 20 * 86400000, intensita: 6, perdCoscienza: true },
  { id: 24, type: 'Crisi tonico-cloniche', duration: '00:03:15', durationSec: 195, timestamp: Date.now() - 365 * 86400000 - 23 * 86400000, intensita: 8, perdCoscienza: true },
  { id: 25, type: 'Crisi di assenza', duration: '00:00:18', durationSec: 18, timestamp: Date.now() - 365 * 86400000 - 26 * 86400000, intensita: 2, perdCoscienza: false },
  { id: 26, type: 'Crisi tonico-cloniche', duration: '00:02:50', durationSec: 170, timestamp: Date.now() - 365 * 86400000 - 29 * 86400000, intensita: 8, perdCoscienza: true },
]

function toKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function durSec(c) {
  if (c.durationSec) return Number(c.durationSec)
  if (!c.duration) return 0
  const p = String(c.duration).split(':').map(Number)
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]
  if (p.length === 2) return p[0] * 60 + p[1]
  return 0
}
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }

export default function ReportPage({ onBack, isDemo }) {
  const [crisi, setCrisi] = useState([])
  const [terapie, setTerapie] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('month')
  const [monthOffset, setMonthOffset] = useState(0)

  const calRef = useRef(null)
  const fasciaRef = useRef(null)
  const circRef = useRef(null)
  const lineRef = useRef(null)
  const durRef = useRef(null)
  const intervalloRef = useRef(null)

  useEffect(() => {
    if (isDemo) { setCrisi(DEMO_CRISI); setTerapie([{ id: 1 }, { id: 2 }, { id: 3 }]); setLoading(false); return }
    let n = 0
    const done = () => { n++; if (n >= 2) setLoading(false) }
    const u1 = onValue(ref(db, 'crises'), s => { setCrisi(processFirebaseSnap(s)); done() })
    const u2 = onValue(ref(db, 'terapies'), s => { setTerapie(processFirebaseSnap(s)); done() })
    return () => { u1(); u2() }
  }, [isDemo])

  const giorni = PERIODI.find(p => p.key === periodo)?.days || 30
  const fromTs = Date.now() - giorni * 86400000
  const all = useMemo(() => (Array.isArray(crisi) ? crisi : []).filter(c => c && c.timestamp), [crisi])
  const periodo_crisi = useMemo(() => all.filter(c => c.timestamp >= fromTs).sort((a, b) => a.timestamp - b.timestamp), [all, fromTs])
  const prevFrom = fromTs - 365 * 86400000
  const prevTo = Date.now() - 365 * 86400000

  const tipiCount = useMemo(() => {
    const o = {}; periodo_crisi.forEach(c => { o[c.type] = (o[c.type] || 0) + 1 }); return o
  }, [periodo_crisi])

  const mediaInt = periodo_crisi.length > 0
    ? (periodo_crisi.reduce((s, c) => s + (Number(c.intensita) || 0), 0) / periodo_crisi.length).toFixed(1) : '-'
  const conPerdita = periodo_crisi.filter(c => c.perdCoscienza).length

  const sortedAll = [...all].sort((a, b) => b.timestamp - a.timestamp)
  const daysSinceLastCrisi = sortedAll.length > 0 ? Math.floor((Date.now() - sortedAll[0].timestamp) / 86400000) : null
  const sortedAsc = [...all].sort((a, b) => a.timestamp - b.timestamp)
  let maxGap = 0
  for (let i = 1; i < sortedAsc.length; i++) {
    const g = Math.floor((sortedAsc[i].timestamp - sortedAsc[i - 1].timestamp) / 86400000)
    if (g > maxGap) maxGap = g
  }

  const navDate = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + monthOffset); return d }, [monthOffset])
  const navY = navDate.getFullYear(), navM = navDate.getMonth()
  const monthDays = daysInMonth(navY, navM)
  const firstDow = (new Date(navY, navM, 1).getDay() + 6) % 7
  const monthCrisi = all.filter(c => { const d = new Date(c.timestamp); return d.getFullYear() === navY && d.getMonth() === navM })
  const dayMap = useMemo(() => {
    const m = {}; monthCrisi.forEach(c => { const k = toKey(c.timestamp); m[k] = (m[k] || 0) + 1 }); return m
  }, [monthCrisi, navY, navM])

  const hourly = useMemo(() => { const a = Array(24).fill(0); periodo_crisi.forEach(c => a[new Date(c.timestamp).getHours()]++); return a }, [periodo_crisi])
  const fasceCounts = useMemo(() => FASCE.map(fa => periodo_crisi.filter(c => { const h = new Date(c.timestamp).getHours(); return h >= fa.range[0] && h < fa.range[1] }).length), [periodo_crisi])

  const durataPerTipo = useMemo(() => {
    const m = {}
    periodo_crisi.forEach(c => { if (!m[c.type]) m[c.type] = { tot: 0, n: 0 }; m[c.type].tot += durSec(c); m[c.type].n++ })
    return Object.entries(m).map(([t, v]) => ({ type: t, avg: Math.round(v.tot / v.n), count: v.n })).sort((a, b) => b.avg - a.avg)
  }, [periodo_crisi])

  const weeksData = useMemo(() => {
    const numW = Math.min(Math.ceil(giorni / 7), 12)
    const curr = [], prev = []
    for (let i = numW - 1; i >= 0; i--) {
      const s = Date.now() - i * 7 * 86400000 - 6 * 86400000, e = Date.now() - i * 7 * 86400000
      curr.push(all.filter(c => c.timestamp >= s && c.timestamp <= e).length)
      const sp = s - 365 * 86400000, ep = e - 365 * 86400000
      prev.push(all.filter(c => c.timestamp >= sp && c.timestamp <= ep).length)
    }
    return { curr, prev, numW }
  }, [all, giorni])

  useEffect(() => {
    if (!calRef.current || loading) return
    const canvas = calRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const cellW = (W - 16) / 7, cellH = (H - 36) / 6
    const wd = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
    wd.forEach((w, i) => {
      ctx.fillStyle = '#bec1cc'; ctx.font = `bold ${f(10)} -apple-system`; ctx.textAlign = 'center'
      ctx.fillText(w, 8 + i * cellW + cellW / 2, 16)
    })
    for (let d = 1; d <= monthDays; d++) {
      const idx = firstDow + d - 1, r = Math.floor(idx / 7), c = idx % 7
      const x = 8 + c * cellW, y = 22 + r * cellH
      const k = `${navY}-${String(navM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const count = dayMap[k] || 0
      const fills = ['#f3f4f7', '#ffd9e0', '#ff8fa8', '#ff5e86', '#F7295A']
      ctx.fillStyle = fills[Math.min(count, 4)]
      ctx.beginPath(); ctx.roundRect(x + 2, y + 2, cellW - 4, cellH - 4, [10]); ctx.fill()
      ctx.fillStyle = count > 0 ? '#fff' : '#bec1cc'
      ctx.font = `bold ${f(10)} -apple-system`; ctx.textAlign = 'left'
      ctx.fillText(String(d), x + 7, y + 14)
      if (count > 0) {
        ctx.fillStyle = '#fff'; ctx.font = `900 ${f(18)} -apple-system`; ctx.textAlign = 'center'
        ctx.fillText(String(count), x + cellW / 2, y + cellH - 7)
      }
      const today = new Date()
      if (d === today.getDate() && navM === today.getMonth() && navY === today.getFullYear()) {
        ctx.strokeStyle = '#193f9e'; ctx.lineWidth = 2.5
        ctx.beginPath(); ctx.roundRect(x + 2, y + 2, cellW - 4, cellH - 4, [10]); ctx.stroke()
      }
    }
  }, [dayMap, monthDays, firstDow, navY, navM, loading])

  useEffect(() => {
    if (!fasciaRef.current || loading) return
    const canvas = fasciaRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const max = Math.max(1, ...fasceCounts)
    const pL = 18, pR = 10, pT = 10, pB = 42
    const slotW = (W - pL - pR) / FASCE.length
    const barW = slotW - 10
    const plotH = H - pT - pB
    for (let i = 0; i <= max; i++) {
      const y = pT + plotH - (i / max) * plotH
      ctx.strokeStyle = '#f0f1f4'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(W - pR, y); ctx.stroke()
      ctx.fillStyle = '#bec1cc'; ctx.font = `bold ${f(9)} -apple-system`; ctx.textAlign = 'right'
      ctx.fillText(String(i), pL - 2, y + 4)
    }
    fasceCounts.forEach((count, i) => {
      const x = pL + i * slotW + 5
      const barH = Math.max(4, (count / max) * plotH * 0.9)
      const y = pT + plotH - barH
      const pct = count / max
      const fill = pct > 0.75 ? '#F7295A' : pct > 0.5 ? '#ff5e86' : pct > 0.2 ? '#ff8fa8' : count > 0 ? '#ffd9e0' : '#f0f1f4'
      ctx.fillStyle = fill
      ctx.beginPath(); ctx.roundRect(x, y, barW, barH, [8, 8, 0, 0]); ctx.fill()
      if (count > 0) {
        ctx.fillStyle = pct > 0.3 ? '#fff' : '#02153f'
        ctx.font = `900 ${f(13)} -apple-system`; ctx.textAlign = 'center'
        ctx.fillText(String(count), x + barW / 2, y + barH / 2 + 5)
      }
      ctx.fillStyle = FASCE[i].color
      ctx.beginPath(); ctx.arc(x + barW / 2, H - 28, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#394058'; ctx.font = `bold ${f(9)} -apple-system`; ctx.textAlign = 'center'
      ctx.fillText(FASCE[i].label, x + barW / 2, H - 16)
      ctx.fillStyle = '#bec1cc'; ctx.font = `${f(8)} -apple-system`
      ctx.fillText(FASCE[i].sub, x + barW / 2, H - 5)
    })
  }, [fasceCounts, loading])

  useEffect(() => {
    if (!circRef.current || loading) return
    const canvas = circRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const pL = 8, pR = 8, pT = 6, pB = 22
    const cellW = (W - pL - pR) / 24, cellH = H - pT - pB
    const max = Math.max(1, ...hourly)
    hourly.forEach((v, i) => {
      const x = pL + i * cellW
      const pct = v / max
      const fill = v === 0 ? '#f3f4f7' : pct < 0.3 ? '#ffe6eb' : pct < 0.6 ? '#ff8fa8' : '#F7295A'
      ctx.fillStyle = fill
      ctx.beginPath(); ctx.roundRect(x + 1, pT, cellW - 2, cellH, [5]); ctx.fill()
      if (v > 0) {
        ctx.fillStyle = '#fff'; ctx.font = `900 ${f(10)} -apple-system`; ctx.textAlign = 'center'
        ctx.fillText(String(v), x + cellW / 2, pT + cellH / 2 + 4)
      }
      if (i % 4 === 0) {
        ctx.fillStyle = '#bec1cc'; ctx.font = `bold ${f(9)} -apple-system`; ctx.textAlign = 'center'
        ctx.fillText(`${i}h`, x + cellW / 2, H - 2)
      }
    })
  }, [hourly, loading])

  useEffect(() => {
    if (!lineRef.current || loading) return
    const canvas = lineRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const { curr, prev, numW } = weeksData
    const maxV = Math.max(1, ...curr, ...prev)
    const pL = 28, pR = 12, pT = 20, pB = 28, plotW = W - pL - pR, plotH = H - pT - pB
    for (let i = 0; i <= maxV; i++) {
      const y = pT + plotH - (i / maxV) * plotH
      ctx.strokeStyle = '#f0f1f4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(pL + plotW, y); ctx.stroke()
      ctx.fillStyle = '#bec1cc'; ctx.font = `bold ${f(9)} -apple-system`; ctx.textAlign = 'right'
      ctx.fillText(String(i), pL - 4, y + 4)
    }
    ctx.beginPath()
    prev.forEach((v, i) => { const x = pL + plotW * i / (numW - 1), y = pT + plotH - (v / maxV) * plotH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
    ctx.lineTo(pL + plotW, pT + plotH); ctx.lineTo(pL, pT + plotH); ctx.closePath()
    ctx.fillStyle = 'rgba(190,193,204,0.15)'; ctx.fill()
    ctx.beginPath()
    curr.forEach((v, i) => { const x = pL + plotW * i / (numW - 1), y = pT + plotH - (v / maxV) * plotH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
    ctx.lineTo(pL + plotW, pT + plotH); ctx.lineTo(pL, pT + plotH); ctx.closePath()
    ctx.fillStyle = 'rgba(46,132,233,0.10)'; ctx.fill()
    ctx.setLineDash([6, 4]); ctx.strokeStyle = '#bec1cc'; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    ctx.beginPath()
    prev.forEach((v, i) => { const x = pL + plotW * i / (numW - 1), y = pT + plotH - (v / maxV) * plotH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
    ctx.stroke(); ctx.setLineDash([])
    ctx.strokeStyle = '#2e84e9'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    ctx.beginPath()
    curr.forEach((v, i) => { const x = pL + plotW * i / (numW - 1), y = pT + plotH - (v / maxV) * plotH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
    ctx.stroke()
    curr.forEach((v, i) => {
      const x = pL + plotW * i / (numW - 1), y = pT + plotH - (v / maxV) * plotH
      ctx.fillStyle = v > 0 ? '#F7295A' : '#2e84e9'; ctx.beginPath(); ctx.arc(x, y, v > 0 ? 5 : 3, 0, Math.PI * 2); ctx.fill()
      if (v > 0) { ctx.fillStyle = '#02153f'; ctx.font = `900 ${f(10)} -apple-system`; ctx.textAlign = 'center'; ctx.fillText(String(v), x, y - 8) }
    })
    curr.forEach((_, i) => {
      const x = pL + plotW * i / (numW - 1)
      ctx.fillStyle = '#bec1cc'; ctx.font = `bold ${f(9)} -apple-system`; ctx.textAlign = 'center'
      ctx.fillText(`S${i + 1}`, x, H - 4)
    })
    const tot = curr.reduce((a, b) => a + b, 0), totP = prev.reduce((a, b) => a + b, 0)
    const delta = tot - totP, up = delta > 0
    ctx.fillStyle = up ? '#F7295A' : '#00BFA6'
    ctx.font = `bold ${f(10)} -apple-system`; ctx.textAlign = 'right'
    ctx.fillText(`${up ? '+' : '-'}${Math.abs(delta)} vs anno scorso`, W - pR, pT - 4)
  }, [weeksData, loading])

  useEffect(() => {
    if (!durRef.current || loading || durataPerTipo.length === 0) return
    const canvas = durRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const max = Math.max(1, ...durataPerTipo.map(e => e.avg))
    const rowH = H / durataPerTipo.length
    durataPerTipo.forEach(({ type, avg, count }, i) => {
      const color = TIPO_COLORI[type] || '#7c8088'
      const y = i * rowH + 5, bH = rowH - 10
      const barW = Math.max(8, (avg / max) * (W - 168))
      ctx.fillStyle = color + '22'; ctx.beginPath(); ctx.roundRect(156, y, W - 166, bH, [8]); ctx.fill()
      ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(156, y, barW, bH, [8]); ctx.fill()
      ctx.fillStyle = '#394058'; ctx.font = `bold ${f(10)} -apple-system`; ctx.textAlign = 'right'
      ctx.fillText(type.replace('Crisi ', ''), 150, y + bH / 2 + 4)
      const mins = Math.floor(avg / 60), secs = avg % 60
      const lbl = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
      if (barW > 32) {
        ctx.fillStyle = '#fff'; ctx.font = `900 ${f(11)} -apple-system`; ctx.textAlign = 'left'
        ctx.fillText(lbl, 162, y + bH / 2 + 4)
      } else {
        ctx.fillStyle = '#394058'; ctx.font = `900 ${f(11)} -apple-system`; ctx.textAlign = 'left'
        ctx.fillText(lbl, 156 + barW + 4, y + bH / 2 + 4)
      }
      ctx.fillStyle = color + '33'; ctx.beginPath(); ctx.roundRect(W - 34, y + 2, 30, bH - 4, [6]); ctx.fill()
      ctx.fillStyle = color; ctx.font = `bold ${f(10)} -apple-system`; ctx.textAlign = 'center'
      ctx.fillText(`${count}x`, W - 19, y + bH / 2 + 4)
    })
  }, [durataPerTipo, loading])

  useEffect(() => {
    if (!intervalloRef.current || loading) return
    const canvas = intervalloRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    if (daysSinceLastCrisi === null) {
      ctx.fillStyle = '#bec1cc'; ctx.font = `bold ${f(13)} -apple-system`; ctx.textAlign = 'center'
      ctx.fillText('Nessuna crisi registrata', W / 2, H / 2); return
    }
    const goal = 30
    const pct = Math.min(daysSinceLastCrisi / goal, 1)
    const fill = daysSinceLastCrisi >= 14 ? '#00BFA6' : daysSinceLastCrisi >= 7 ? '#FF8C42' : '#F7295A'
    const pL = 16, pR = 16, barY = 52, barH = 30, barW = W - pL - pR
    ctx.fillStyle = '#02153f'; ctx.font = `900 ${f(15)} -apple-system`; ctx.textAlign = 'left'
    ctx.fillText(`Ultima crisi: ${daysSinceLastCrisi} giorn${daysSinceLastCrisi === 1 ? 'o' : 'i'} fa`, pL, 24)
    ctx.fillStyle = '#7c8088'; ctx.font = `bold ${f(10)} -apple-system`
    ctx.fillText(`Obiettivo clinico: ${goal} giorni senza crisi`, pL, 40)
    ctx.fillStyle = '#f3f4f7'; ctx.beginPath(); ctx.roundRect(pL, barY, barW, barH, [15]); ctx.fill()
    if (pct > 0) { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(pL, barY, barW * pct, barH, [15]); ctx.fill() }
    ctx.fillStyle = '#fff'; ctx.font = `900 ${f(12)} -apple-system`; ctx.textAlign = 'center'
    if (pct > 0.12) ctx.fillText(`${daysSinceLastCrisi}g / ${goal}g`, pL + (barW * pct) / 2, barY + barH / 2 + 5)
    ctx.strokeStyle = '#193f9e'; ctx.lineWidth = 2; ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(pL + barW, barY - 4); ctx.lineTo(pL + barW, barY + barH + 4); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#193f9e'; ctx.font = `bold ${f(9)} -apple-system`; ctx.textAlign = 'center'
    ctx.fillText(`obiettivo ${goal}g`, pL + barW, barY - 8)
    if (maxGap > 0) {
      ctx.fillStyle = '#394058'; ctx.font = `bold ${f(10)} -apple-system`; ctx.textAlign = 'left'
      ctx.fillText(`Periodo piu lungo senza crisi: ${maxGap} giorni`, pL, barY + barH + 20)
    }
  }, [daysSinceLastCrisi, maxGap, loading])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f3f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <BarChart3 size={40} color="#193f9e" style={{ margin: '0 auto 12px', display: 'block' }} />
        <div style={{ fontSize: f(14), color: '#7c8088' }}>Caricamento report...</div>
      </div>
    </div>
  )

  const monthName = navDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <div style={{ background: '#f3f4f7', minHeight: '100vh', paddingBottom: '100px', width: '100%', maxWidth: '520px', margin: '0 auto', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>

      <div style={{ background: 'linear-gradient(135deg,#193f9e,#2e84e9)', padding: '14px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
          <div>
            <div style={{ fontSize: f(18), fontWeight: '900', color: '#fff' }}>Report</div>
            <div style={{ fontSize: f(11), color: 'rgba(255,255,255,0.78)' }}>{isDemo ? 'Dati demo' : 'Analisi completa'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {PERIODI.map(p => (
            <button key={p.key} onClick={() => setPeriodo(p.key)} style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: f(12), fontFamily: 'inherit', whiteSpace: 'nowrap', background: periodo === p.key ? '#fff' : 'rgba(255,255,255,0.2)', color: periodo === p.key ? '#193f9e' : '#fff', transition: 'all 0.2s' }}>{p.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px', marginBottom: '10px' }}>
          {[
            { label: 'Crisi periodo', val: periodo_crisi.length, color: '#F7295A', Icon: Flame },
            { label: 'Media intensita', val: mediaInt, color: '#FF8C42', Icon: BarChart3 },
            { label: 'Perdita cosc.', val: conPerdita, color: '#7B5EA7', Icon: CircleAlert },
          ].map(({ label, val, color, Icon }, i) => (
            <div key={i} style={{ background: '#feffff', borderRadius: '14px', padding: '10px 8px', boxShadow: shSm, textAlign: 'center' }}>
              <Icon size={15} color={color} style={{ margin: '0 auto 4px', display: 'block' }} />
              <div style={{ fontSize: f(22), fontWeight: '900', color, marginBottom: '2px' }}>{val}</div>
              <div style={{ fontSize: f(8.5), color: '#7c8088', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#feffff', borderRadius: '18px', padding: '14px', marginBottom: '10px', boxShadow: sh }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CalendarDays size={16} color="#193f9e" />
            <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>Calendario crisi</div>
          </div>
          <div style={{ fontSize: f(10), color: '#7c8088', marginBottom: '10px' }}>I giorni in rosso hanno avuto crisi. Il numero grande indica quante. Bordato blu = oggi.</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <button onClick={() => setMonthOffset(v => v - 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e7eaf0', background: '#feffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={16} color="#394058" />
            </button>
            <div style={{ fontSize: f(12), fontWeight: '800', color: '#02153f', textTransform: 'capitalize' }}>{monthName}</div>
            <button onClick={() => setMonthOffset(v => v + 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e7eaf0', background: '#feffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} color="#394058" />
            </button>
          </div>
          <canvas ref={calRef} width={460} height={240} style={{ width: '100%', height: 'auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: f(10), color: '#7c8088', fontWeight: '700' }}>Crisi:</span>
            {[['#f3f4f7', '0'], ['#ffd9e0', '1'], ['#ff8fa8', '2-3'], ['#ff5e86', '3-4'], ['#F7295A', '4+']].map(([bg, lbl]) => (
              <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '14px', height: '10px', borderRadius: '4px', background: bg, border: bg === '#f3f4f7' ? '1px solid #ddd' : 'none', display: 'inline-block' }} />
                <span style={{ fontSize: f(10), color: '#7c8088' }}>{lbl}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: '#feffff', borderRadius: '18px', padding: '14px', marginBottom: '10px', boxShadow: sh }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Clock size={16} color="#7B5EA7" />
            <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>Fasce orarie delle crisi</div>
          </div>
          <div style={{ fontSize: f(10), color: '#7c8088', marginBottom: '10px' }}>Le 24 ore divise in 6 blocchi da 4 ore. Il numero dentro la barra indica le crisi avvenute in quella fascia. Rosso = fascia piu a rischio.</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '4px' }}>
            {FASCE.map(({ Icon, color }, i) => (
              <div key={i} style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
                <Icon size={14} color={color} />
              </div>
            ))}
          </div>
          {periodo_crisi.length > 0
            ? <canvas ref={fasciaRef} width={460} height={160} style={{ width: '100%', height: 'auto' }} />
            : <div style={{ textAlign: 'center', padding: '20px', color: '#bec1cc', fontSize: f(13) }}>Nessun dato nel periodo</div>}
        </div>

        <div style={{ background: '#feffff', borderRadius: '18px', padding: '14px', marginBottom: '10px', boxShadow: sh }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Activity size={16} color="#FF8C42" />
            <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>Pattern circadiano ora per ora</div>
          </div>
          <div style={{ fontSize: f(10), color: '#7c8088', marginBottom: '10px' }}>Ogni cella corrisponde a un'ora del giorno (0-23). Colore piu scuro = piu crisi in quell'ora. Il numero indica quante.</div>
          {periodo_crisi.length > 0
            ? <canvas ref={circRef} width={460} height={52} style={{ width: '100%', height: 'auto' }} />
            : <div style={{ textAlign: 'center', padding: '20px', color: '#bec1cc', fontSize: f(13) }}>Nessun dato nel periodo</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: f(10), color: '#7c8088', fontWeight: '700' }}>Frequenza:</span>
            {[['#f3f4f7', 'Nessuna'], ['#ffe6eb', 'Bassa'], ['#ff8fa8', 'Media'], ['#F7295A', 'Alta']].map(([bg, lbl]) => (
              <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '14px', height: '10px', borderRadius: '3px', background: bg, border: bg === '#f3f4f7' ? '1px solid #ddd' : 'none', display: 'inline-block' }} />
                <span style={{ fontSize: f(9), color: '#7c8088' }}>{lbl}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: '#feffff', borderRadius: '18px', padding: '14px', marginBottom: '10px', boxShadow: sh }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TrendingUp size={16} color="#2e84e9" />
            <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>Tendenza e confronto anno precedente</div>
          </div>
          <div style={{ fontSize: f(10), color: '#7c8088', marginBottom: '10px' }}>Linea blu = anno in corso. Linea grigia tratteggiata = stesso periodo dell'anno scorso. Linea blu sotto = miglioramento.</div>
          <canvas ref={lineRef} width={460} height={180} style={{ width: '100%', height: 'auto' }} />
          <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '22px', height: '3px', background: '#2e84e9', borderRadius: '2px', display: 'inline-block' }} />
              <span style={{ fontSize: f(10), color: '#7c8088' }}>Anno corrente</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '22px', height: '0', border: '2px dashed #bec1cc', display: 'inline-block' }} />
              <span style={{ fontSize: f(10), color: '#7c8088' }}>Anno scorso (stesso periodo)</span>
            </span>
          </div>
        </div>

        <div style={{ background: '#feffff', borderRadius: '18px', padding: '14px', marginBottom: '10px', boxShadow: sh }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Timer size={16} color="#00BFA6" />
            <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>Durata media per tipo di crisi</div>
          </div>
          <div style={{ fontSize: f(10), color: '#7c8088', marginBottom: '10px' }}>Ogni barra mostra la durata media per tipo. Il badge a destra indica quanti episodi registrati nel periodo.</div>
          {durataPerTipo.length > 0
            ? <canvas ref={durRef} width={460} height={Math.max(100, durataPerTipo.length * 40)} style={{ width: '100%', height: 'auto' }} />
            : <div style={{ textAlign: 'center', padding: '20px', color: '#bec1cc', fontSize: f(13) }}>Nessun dato nel periodo</div>}
        </div>

        <div style={{ background: '#feffff', borderRadius: '18px', padding: '14px', marginBottom: '10px', boxShadow: sh }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CircleAlert size={16} color="#00BFA6" />
            <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>Intervallo libero da crisi</div>
          </div>
          <div style={{ fontSize: f(10), color: '#7c8088', marginBottom: '10px' }}>Giorni dall'ultima crisi rispetto all'obiettivo clinico di 30 giorni. Verde = buon controllo, arancio = attenzione, rosso = crisi recente.</div>
          <canvas ref={intervalloRef} width={460} height={100} style={{ width: '100%', height: 'auto' }} />
        </div>

        {periodo_crisi.length > 0 && (
          <div style={{ background: '#feffff', borderRadius: '18px', padding: '14px', marginBottom: '10px', boxShadow: sh }}>
            <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f', marginBottom: '12px' }}>Dettaglio per tipo</div>
            {Object.entries(tipiCount).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => {
              const color = TIPO_COLORI[tipo] || '#7c8088'
              const pct = Math.round((count / periodo_crisi.length) * 100)
              return (
                <div key={tipo} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: f(12), fontWeight: '700', color: '#394058' }}>{tipo}</span>
                    </div>
                    <span style={{ fontSize: f(12), color: '#7c8088', fontWeight: '600' }}>{count}x · {pct}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: '#f3f4f7', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: color, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ background: '#feffff', borderRadius: '18px', padding: '14px', boxShadow: sh }}>
          <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f', marginBottom: '12px' }}>Riepilogo generale</div>
          {[
            { label: 'Totale crisi registrate', val: all.length, color: '#F7295A' },
            { label: 'Terapie attive', val: terapie.length, color: '#00BFA6' },
            { label: 'Crisi con perdita coscienza', val: all.filter(c => c.perdCoscienza).length, color: '#7B5EA7' },
            { label: 'Intensita media (totale)', val: all.length > 0 ? (all.reduce((s, c) => s + (Number(c.intensita) || 0), 0) / all.length).toFixed(1) : '-', color: '#FF8C42' },
            { label: 'Giorni liberi da crisi', val: daysSinceLastCrisi !== null ? `${daysSinceLastCrisi}g` : '-', color: '#00BFA6' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid #f0f1f4' : 'none' }}>
              <span style={{ fontSize: f(12), color: '#394058', fontWeight: '600' }}>{item.label}</span>
              <span style={{ fontSize: f(16), fontWeight: '900', color: item.color }}>{item.val}</span>
            </div>
          ))}
        </div>

        {all.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#bec1cc' }}>
            <BarChart3 size={40} color="#bec1cc" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: f(14), marginBottom: '4px' }}>Nessuna crisi registrata</div>
            <div style={{ fontSize: f(12) }}>I report appariranno qui dopo aver registrato le crisi</div>
          </div>
        )}

      </div>
    </div>
  )
}
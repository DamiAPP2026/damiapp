import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, TrendingUp,
  Timer, BarChart3, CircleAlert, Flame, Activity, Moon, Sunrise,
  Sun, Cloud, Sunset, Star, Droplets, AlertTriangle, CheckCircle2,
  XCircle, Zap, Heart, Brain
} from 'lucide-react'
import { db } from './firebase'
import { ref, onValue } from 'firebase/database'
import { processFirebaseSnap } from './crypto'

// --- COSTANTI DESIGN SYSTEM ---
const f = base => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'
const C = {
  blu: '#193f9e',
  bluM: '#2e84e9',
  crisi: '#F7295A',
  terapie: '#00BFA6',
  toilet: '#7B5EA7',
  sos: '#e53935',
  arancio: '#FF8C42',
  giallo: '#FFD93D',
  testo: '#02153f',
  testo2: '#394058',
  muted: '#7c8088',
  sub: '#bec1cc',
  bg: '#f3f4f7',
  card: '#feffff',
  bd: '#e7eaf0',
}

const TIPO_COLORI = {
  'Crisi tonico-cloniche': C.crisi,
  'Crisi di assenza': C.toilet,
  'Crisi miocloniche': C.arancio,
  'Crisi toniche': C.bluM,
  'Crisi cloniche': C.terapie,
  'Crisi atoniche': C.giallo,
}

const PERIODI = [
  { key: 'week',     label: '7g',   days: 7 },
  { key: 'month',    label: '30g',  days: 30 },
  { key: '3months',  label: '3M',   days: 90 },
  { key: '6months',  label: '6M',   days: 180 },
  { key: 'year',     label: '1A',   days: 365 },
  { key: 'all',      label: 'Tutto',days: 99999 },
]

const FASCE = [
  { label: 'Notte',    sub: '0-4',   color: C.blu,     Icon: Moon,    range: [0, 4] },
  { label: 'Alba',     sub: '4-8',   color: C.arancio, Icon: Sunrise, range: [4, 8] },
  { label: 'Mattina',  sub: '8-12',  color: C.giallo,  Icon: Sun,     range: [8, 12] },
  { label: 'Pomerig.', sub: '12-16', color: C.bluM,    Icon: Cloud,   range: [12, 16] },
  { label: 'Sera',     sub: '16-20', color: C.arancio, Icon: Sunset,  range: [16, 20] },
  { label: 'Notte',    sub: '20-24', color: C.toilet,  Icon: Star,    range: [20, 24] },
]

// --- DATI DEMO ---
const DEMO_CRISI = [
  { id: 1,  type: 'Crisi tonico-cloniche', duration: '00:02:34', durationSec: 154, timestamp: Date.now() - 1*86400000,               intensita: 8, perdCoscienza: true,  trigger: 'Mancanza sonno', note: '' },
  { id: 2,  type: 'Crisi di assenza',      duration: '00:00:18', durationSec: 18,  timestamp: Date.now() - 1*86400000 + 3600000*12,   intensita: 4, perdCoscienza: false, trigger: '',              note: '' },
  { id: 3,  type: 'Crisi miocloniche',     duration: '00:00:45', durationSec: 45,  timestamp: Date.now() - 3*86400000,               intensita: 5, perdCoscienza: false, trigger: 'Stress',        note: '' },
  { id: 4,  type: 'Crisi tonico-cloniche', duration: '00:03:10', durationSec: 190, timestamp: Date.now() - 6*86400000,               intensita: 9, perdCoscienza: true,  trigger: 'Mancanza sonno', note: '' },
  { id: 5,  type: 'Crisi tonico-cloniche', duration: '00:03:30', durationSec: 210, timestamp: Date.now() - 6*86400000 + 3600000*3,   intensita: 8, perdCoscienza: true,  trigger: '',              note: '' },
  { id: 6,  type: 'Crisi atoniche',        duration: '00:00:08', durationSec: 8,   timestamp: Date.now() - 9*86400000,               intensita: 3, perdCoscienza: false, trigger: '',              note: '' },
  { id: 7,  type: 'Crisi di assenza',      duration: '00:00:22', durationSec: 22,  timestamp: Date.now() - 12*86400000,              intensita: 3, perdCoscienza: false, trigger: '',              note: '' },
  { id: 8,  type: 'Crisi toniche',         duration: '00:01:20', durationSec: 80,  timestamp: Date.now() - 12*86400000 + 3600000*22, intensita: 6, perdCoscienza: true,  trigger: 'Febbre',        note: '' },
  { id: 9,  type: 'Crisi tonico-cloniche', duration: '00:01:55', durationSec: 115, timestamp: Date.now() - 15*86400000,              intensita: 7, perdCoscienza: true,  trigger: '',              note: '' },
  { id: 10, type: 'Crisi di assenza',      duration: '00:00:30', durationSec: 30,  timestamp: Date.now() - 17*86400000,              intensita: 2, perdCoscienza: false, trigger: '',              note: '' },
  { id: 11, type: 'Crisi toniche',         duration: '00:01:10', durationSec: 70,  timestamp: Date.now() - 19*86400000,              intensita: 6, perdCoscienza: true,  trigger: 'Stress',        note: '' },
  { id: 12, type: 'Crisi tonico-cloniche', duration: '00:02:55', durationSec: 175, timestamp: Date.now() - 22*86400000,              intensita: 8, perdCoscienza: true,  trigger: '',              note: '' },
  { id: 13, type: 'Crisi di assenza',      duration: '00:00:20', durationSec: 20,  timestamp: Date.now() - 22*86400000 + 3600000*9,  intensita: 3, perdCoscienza: false, trigger: '',              note: '' },
  { id: 14, type: 'Crisi miocloniche',     duration: '00:00:55', durationSec: 55,  timestamp: Date.now() - 25*86400000,              intensita: 5, perdCoscienza: false, trigger: 'Mancanza sonno', note: '' },
  { id: 15, type: 'Crisi toniche',         duration: '00:01:30', durationSec: 90,  timestamp: Date.now() - 27*86400000,              intensita: 7, perdCoscienza: true,  trigger: '',              note: '' },
  { id: 16, type: 'Crisi tonico-cloniche', duration: '00:03:20', durationSec: 200, timestamp: Date.now() - 29*86400000,              intensita: 9, perdCoscienza: true,  trigger: 'Mancanza sonno', note: '' },
  // anno scorso stesso periodo
  { id: 17, type: 'Crisi tonico-cloniche', duration: '00:02:40', durationSec: 160, timestamp: Date.now() - 365*86400000 - 2*86400000,  intensita: 8, perdCoscienza: true  },
  { id: 18, type: 'Crisi di assenza',      duration: '00:00:20', durationSec: 20,  timestamp: Date.now() - 365*86400000 - 5*86400000,  intensita: 4, perdCoscienza: false },
  { id: 19, type: 'Crisi tonico-cloniche', duration: '00:03:00', durationSec: 180, timestamp: Date.now() - 365*86400000 - 8*86400000,  intensita: 9, perdCoscienza: true  },
  { id: 20, type: 'Crisi tonico-cloniche', duration: '00:03:40', durationSec: 220, timestamp: Date.now() - 365*86400000 - 11*86400000, intensita: 9, perdCoscienza: true  },
  { id: 21, type: 'Crisi miocloniche',     duration: '00:00:40', durationSec: 40,  timestamp: Date.now() - 365*86400000 - 14*86400000, intensita: 5, perdCoscienza: false },
  { id: 22, type: 'Crisi di assenza',      duration: '00:00:25', durationSec: 25,  timestamp: Date.now() - 365*86400000 - 17*86400000, intensita: 3, perdCoscienza: false },
  { id: 23, type: 'Crisi toniche',         duration: '00:01:25', durationSec: 85,  timestamp: Date.now() - 365*86400000 - 20*86400000, intensita: 6, perdCoscienza: true  },
  { id: 24, type: 'Crisi tonico-cloniche', duration: '00:03:15', durationSec: 195, timestamp: Date.now() - 365*86400000 - 23*86400000, intensita: 8, perdCoscienza: true  },
  { id: 25, type: 'Crisi di assenza',      duration: '00:00:18', durationSec: 18,  timestamp: Date.now() - 365*86400000 - 26*86400000, intensita: 2, perdCoscienza: false },
  { id: 26, type: 'Crisi tonico-cloniche', duration: '00:02:50', durationSec: 170, timestamp: Date.now() - 365*86400000 - 29*86400000, intensita: 8, perdCoscienza: true  },
]

const DEMO_TOILET = [
  { id: 1,  timestamp: Date.now() - 1*86400000  + 3600000*8,  incidentePippi: false, incidenteCacca: false, bisogno: 'pippi' },
  { id: 2,  timestamp: Date.now() - 1*86400000  + 3600000*14, incidentePippi: true,  incidenteCacca: false, bisogno: 'pippi' },
  { id: 3,  timestamp: Date.now() - 2*86400000  + 3600000*9,  incidentePippi: false, incidenteCacca: false, bisogno: 'cacca' },
  { id: 4,  timestamp: Date.now() - 3*86400000  + 3600000*7,  incidentePippi: false, incidenteCacca: true,  bisogno: 'cacca' },
  { id: 5,  timestamp: Date.now() - 4*86400000  + 3600000*8,  incidentePippi: false, incidenteCacca: false, bisogno: 'pippi' },
  { id: 6,  timestamp: Date.now() - 5*86400000  + 3600000*10, incidentePippi: true,  incidenteCacca: false, bisogno: 'pippi' },
  { id: 7,  timestamp: Date.now() - 6*86400000  + 3600000*8,  incidentePippi: false, incidenteCacca: false, bisogno: 'entrambi' },
  { id: 8,  timestamp: Date.now() - 7*86400000  + 3600000*9,  incidentePippi: false, incidenteCacca: false, bisogno: 'pippi' },
  { id: 9,  timestamp: Date.now() - 8*86400000  + 3600000*13, incidentePippi: true,  incidenteCacca: false, bisogno: 'pippi' },
  { id: 10, timestamp: Date.now() - 9*86400000  + 3600000*8,  incidentePippi: false, incidenteCacca: false, bisogno: 'cacca' },
  { id: 11, timestamp: Date.now() - 10*86400000 + 3600000*8,  incidentePippi: false, incidenteCacca: false, bisogno: 'pippi' },
  { id: 12, timestamp: Date.now() - 11*86400000 + 3600000*16, incidentePippi: false, incidenteCacca: true,  bisogno: 'cacca' },
  { id: 13, timestamp: Date.now() - 12*86400000 + 3600000*8,  incidentePippi: false, incidenteCacca: false, bisogno: 'pippi' },
  { id: 14, timestamp: Date.now() - 14*86400000 + 3600000*8,  incidentePippi: true,  incidenteCacca: false, bisogno: 'pippi' },
  { id: 15, timestamp: Date.now() - 15*86400000 + 3600000*9,  incidentePippi: false, incidenteCacca: false, bisogno: 'entrambi' },
  { id: 16, timestamp: Date.now() - 365*86400000 - 2*86400000 + 3600000*8,  incidentePippi: true,  incidenteCacca: false },
  { id: 17, timestamp: Date.now() - 365*86400000 - 5*86400000 + 3600000*9,  incidentePippi: false, incidenteCacca: false },
  { id: 18, timestamp: Date.now() - 365*86400000 - 8*86400000 + 3600000*8,  incidentePippi: true,  incidenteCacca: true  },
  { id: 19, timestamp: Date.now() - 365*86400000 - 11*86400000 + 3600000*10,incidentePippi: false, incidenteCacca: false },
  { id: 20, timestamp: Date.now() - 365*86400000 - 14*86400000 + 3600000*8, incidentePippi: true,  incidenteCacca: false },
]

// --- UTILS ---
function toKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function durSec(c) {
  if (c.durationSec) return Number(c.durationSec)
  if (!c.duration) return 0
  const p = String(c.duration).split(':').map(Number)
  if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2]
  if (p.length === 2) return p[0]*60 + p[1]
  return 0
}
function fmtSec(s) {
  const m = Math.floor(s / 60), r = s % 60
  return m > 0 ? `${m}m ${r}s` : `${r}s`
}
function daysInMonth(y, m) { return new Date(y, m+1, 0).getDate() }

// --- CARD WRAPPER ---
function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.card, borderRadius: '18px', padding: '14px', marginBottom: '10px', boxShadow: sh, ...style }}>
      {children}
    </div>
  )
}

// --- MINI STAT ---
function MiniStat({ label, val, color, Icon }) {
  return (
    <div style={{ background: C.card, borderRadius: '14px', padding: '10px 8px', boxShadow: shSm, textAlign: 'center' }}>
      {Icon && <Icon size={15} color={color} style={{ margin: '0 auto 4px', display: 'block' }} />}
      <div style={{ fontSize: f(22), fontWeight: '900', color, marginBottom: '2px' }}>{val}</div>
      <div style={{ fontSize: f(8.5), color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: '1.2' }}>{label}</div>
    </div>
  )
}

// --- SEZIONE TITLE ---
function SectionTitle({ Icon, color, title, sub }) {
  return (
    <div style={{ marginBottom: sub ? '4px' : '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={16} color={color} />
        <div style={{ fontSize: f(13), fontWeight: '800', color: C.testo }}>{title}</div>
      </div>
      {sub && <div style={{ fontSize: f(10), color: C.muted, marginTop: '3px', marginBottom: '10px', lineHeight: '1.4' }}>{sub}</div>}
    </div>
  )
}

// --- LEGENDA ---
function Legenda({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
      {items.map(([bg, lbl]) => (
        <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ width: '14px', height: '10px', borderRadius: '4px', background: bg, border: bg === C.bg || bg === '#f3f4f7' ? `1px solid ${C.bd}` : 'none', display: 'inline-block' }} />
          <span style={{ fontSize: f(9), color: C.muted }}>{lbl}</span>
        </span>
      ))}
    </div>
  )
}

// --- EXPORT PRINCIPALE ---
export default function ReportPage({ onBack, isDemo }) {
  // --- STATE ---
  const [crisi,       setCrisi]       = useState([])
  const [terapie,     setTerapie]     = useState([])
  const [toiletData,  setToiletData]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [periodo,     setPeriodo]     = useState('month')
  const [monthOffset, setMonthOffset] = useState(0)
  const [tabAttiva,   setTabAttiva]   = useState('crisi') // 'crisi' | 'toilet'

  // --- REFS CANVAS CRISI ---
  const calRef       = useRef(null)
  const fasciaRef    = useRef(null)
  const circRef      = useRef(null)
  const lineRef      = useRef(null)
  const durRef       = useRef(null)
  const intervalloRef = useRef(null)

  // --- REFS CANVAS TOILET ---
  const toiletBarRef  = useRef(null)
  const toiletCircRef = useRef(null)
  const toiletLineRef = useRef(null)

  // --- CARICAMENTO ---
  useEffect(() => {
    if (isDemo) {
      setCrisi(DEMO_CRISI)
      setTerapie([{ id: 1, nome: 'Keppra 500mg', orario: '08:00' }, { id: 2, nome: 'Depakine 200mg', orario: '20:00' }, { id: 3, nome: 'Rivotril 0.5mg', orario: '14:00' }])
      setToiletData(DEMO_TOILET)
      setLoading(false)
      return
    }
    let n = 0
    const done = () => { n++; if (n >= 3) setLoading(false) }
    const u1 = onValue(ref(db, 'crises'),        s => { setCrisi(processFirebaseSnap(s) || []);       done() })
    const u2 = onValue(ref(db, 'terapies'),      s => { setTerapie(processFirebaseSnap(s) || []);     done() })
    const u3 = onValue(ref(db, 'toilet_training'),s => { setToiletData(processFirebaseSnap(s) || []); done() })
    return () => { u1(); u2(); u3() }
  }, [isDemo])

  // --- PERIODO ---
  const giorni  = PERIODI.find(p => p.key === periodo)?.days || 30
  const fromTs  = Date.now() - giorni * 86400000

  // --- CRISI CALCOLATE ---
  const all          = useMemo(() => (Array.isArray(crisi) ? crisi : []).filter(c => c && c.timestamp), [crisi])
  const periodoCrisi = useMemo(() => all.filter(c => c.timestamp >= fromTs).sort((a, b) => a.timestamp - b.timestamp), [all, fromTs])

  const tipiCount   = useMemo(() => { const o = {}; periodoCrisi.forEach(c => { o[c.type] = (o[c.type]||0) + 1 }); return o }, [periodoCrisi])
  const mediaInt    = periodoCrisi.length > 0 ? (periodoCrisi.reduce((s,c) => s + (Number(c.intensita)||0), 0) / periodoCrisi.length).toFixed(1) : '-'
  const conPerdita  = periodoCrisi.filter(c => c.perdCoscienza).length
  const conPerdPct  = periodoCrisi.length > 0 ? Math.round((conPerdita / periodoCrisi.length) * 100) : 0

  const sortedAll   = [...all].sort((a,b) => b.timestamp - a.timestamp)
  const daysSinceLast = sortedAll.length > 0 ? Math.floor((Date.now() - sortedAll[0].timestamp) / 86400000) : null
  const sortedAsc   = [...all].sort((a,b) => a.timestamp - b.timestamp)
  let maxGap = 0
  for (let i = 1; i < sortedAsc.length; i++) {
    const g = Math.floor((sortedAsc[i].timestamp - sortedAsc[i-1].timestamp) / 86400000)
    if (g > maxGap) maxGap = g
  }

  // trigger piu frequente
  const triggerCount = useMemo(() => {
    const o = {}
    periodoCrisi.forEach(c => { if (c.trigger && c.trigger.trim()) o[c.trigger] = (o[c.trigger]||0) + 1 })
    return Object.entries(o).sort((a,b) => b[1]-a[1])
  }, [periodoCrisi])

  const hourly      = useMemo(() => { const a = Array(24).fill(0); periodoCrisi.forEach(c => a[new Date(c.timestamp).getHours()]++); return a }, [periodoCrisi])
  const fasceCounts = useMemo(() => FASCE.map(fa => periodoCrisi.filter(c => { const h = new Date(c.timestamp).getHours(); return h >= fa.range[0] && h < fa.range[1] }).length), [periodoCrisi])

  const durataPerTipo = useMemo(() => {
    const m = {}
    periodoCrisi.forEach(c => { if (!m[c.type]) m[c.type] = { tot: 0, n: 0 }; m[c.type].tot += durSec(c); m[c.type].n++ })
    return Object.entries(m).map(([t,v]) => ({ type: t, avg: Math.round(v.tot/v.n), count: v.n })).sort((a,b) => b.avg - a.avg)
  }, [periodoCrisi])

  const weeksData = useMemo(() => {
    const numW = Math.min(Math.ceil(giorni/7), 12)
    const curr = [], prev = []
    for (let i = numW-1; i >= 0; i--) {
      const s = Date.now() - i*7*86400000 - 6*86400000, e = Date.now() - i*7*86400000
      curr.push(all.filter(c => c.timestamp >= s && c.timestamp <= e).length)
      prev.push(all.filter(c => c.timestamp >= s-365*86400000 && c.timestamp <= e-365*86400000).length)
    }
    return { curr, prev, numW }
  }, [all, giorni])

  // --- CALENDARIO ---
  const navDate  = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + monthOffset); return d }, [monthOffset])
  const navY     = navDate.getFullYear(), navM = navDate.getMonth()
  const monthDays = daysInMonth(navY, navM)
  const firstDow  = (new Date(navY, navM, 1).getDay() + 6) % 7
  const dayMap    = useMemo(() => {
    const m = {}
    all.filter(c => { const d = new Date(c.timestamp); return d.getFullYear()===navY && d.getMonth()===navM })
       .forEach(c => { const k = toKey(c.timestamp); m[k] = (m[k]||0)+1 })
    return m
  }, [all, navY, navM])

  // --- TOILET CALCOLATO ---
  const toiletAll     = useMemo(() => (Array.isArray(toiletData) ? toiletData : []).filter(t => t && t.timestamp), [toiletData])
  const toiletPeriodo = useMemo(() => toiletAll.filter(t => t.timestamp >= fromTs), [toiletAll, fromTs])
  const toiletRiuscite = toiletPeriodo.filter(t => !t.incidentePippi && !t.incidenteCacca).length
  const toiletIncPippi = toiletPeriodo.filter(t => t.incidentePippi).length
  const toiletIncCacca = toiletPeriodo.filter(t => t.incidenteCacca).length
  const pctRiuscite    = toiletPeriodo.length > 0 ? Math.round((toiletRiuscite/toiletPeriodo.length)*100) : 0
  const freqGiorn      = toiletPeriodo.length > 0 ? (toiletPeriodo.length/giorni).toFixed(1) : '0'

  const hourlyToilet = useMemo(() => {
    const a = Array(24).fill(0)
    toiletPeriodo.forEach(t => { if (t.timestamp) a[new Date(t.timestamp).getHours()]++ })
    return a
  }, [toiletPeriodo])

  const toiletWeeks = useMemo(() => {
    const numW = Math.min(Math.ceil(giorni/7), 12)
    const sessions = [], incidents = [], prev = []
    for (let i = numW-1; i >= 0; i--) {
      const s = Date.now() - i*7*86400000 - 6*86400000, e = Date.now() - i*7*86400000
      const w = toiletAll.filter(t => t.timestamp >= s && t.timestamp <= e)
      sessions.push(w.length)
      incidents.push(w.filter(t => t.incidentePippi || t.incidenteCacca).length)
      const wp = toiletAll.filter(t => t.timestamp >= s-365*86400000 && t.timestamp <= e-365*86400000)
      prev.push(wp.filter(t => t.incidentePippi || t.incidenteCacca).length)
    }
    return { sessions, incidents, prev, numW }
  }, [toiletAll, giorni])

  // ======================================================
  // CANVAS: CALENDARIO
  // ======================================================
  useEffect(() => {
    if (!calRef.current || loading) return
    const canvas = calRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const cellW = (W-16)/7, cellH = (H-36)/6
    ;['L','M','M','G','V','S','D'].forEach((w, i) => {
      ctx.fillStyle = C.sub; ctx.font = `bold ${f(10)} -apple-system`; ctx.textAlign = 'center'
      ctx.fillText(w, 8 + i*cellW + cellW/2, 16)
    })
    for (let d = 1; d <= monthDays; d++) {
      const idx = firstDow+d-1, r = Math.floor(idx/7), c = idx%7
      const x = 8+c*cellW, y = 22+r*cellH
      const k = `${navY}-${String(navM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const count = dayMap[k] || 0
      const fills = [C.bg,'#ffd9e0','#ff8fa8','#ff5e86',C.crisi]
      ctx.fillStyle = fills[Math.min(count,4)]
      ctx.beginPath(); ctx.roundRect(x+2,y+2,cellW-4,cellH-4,[10]); ctx.fill()
      ctx.fillStyle = count > 0 ? '#fff' : C.sub
      ctx.font = `bold ${f(10)} -apple-system`; ctx.textAlign = 'left'
      ctx.fillText(String(d), x+7, y+14)
      if (count > 0) {
        ctx.fillStyle = '#fff'; ctx.font = `900 ${f(18)} -apple-system`; ctx.textAlign = 'center'
        ctx.fillText(String(count), x+cellW/2, y+cellH-7)
      }
      const today = new Date()
      if (d===today.getDate() && navM===today.getMonth() && navY===today.getFullYear()) {
        ctx.strokeStyle = C.blu; ctx.lineWidth = 2.5
        ctx.beginPath(); ctx.roundRect(x+2,y+2,cellW-4,cellH-4,[10]); ctx.stroke()
      }
    }
  }, [dayMap, monthDays, firstDow, navY, navM, loading])

  // ======================================================
  // CANVAS: FASCE ORARIE
  // ======================================================
  useEffect(() => {
    if (!fasciaRef.current || loading) return
    const canvas = fasciaRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)
    const max = Math.max(1, ...fasceCounts)
    const pL=18,pR=10,pT=10,pB=42, slotW=(W-pL-pR)/FASCE.length, barW=slotW-10, plotH=H-pT-pB
    for (let i=0; i<=max; i++) {
      const y = pT+plotH-(i/max)*plotH
      ctx.strokeStyle='#f0f1f4'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke()
      ctx.fillStyle=C.sub; ctx.font=`bold ${f(9)} -apple-system`; ctx.textAlign='right'
      ctx.fillText(String(i), pL-2, y+4)
    }
    fasceCounts.forEach((count,i) => {
      const x = pL+i*slotW+5
      const barH = Math.max(4,(count/max)*plotH*0.9), y = pT+plotH-barH
      const pct = count/max
      const fill = pct>0.75 ? C.crisi : pct>0.5 ? '#ff5e86' : pct>0.2 ? '#ff8fa8' : count>0 ? '#ffd9e0' : '#f0f1f4'
      ctx.fillStyle = fill
      ctx.beginPath(); ctx.roundRect(x,y,barW,barH,[8,8,0,0]); ctx.fill()
      if (count > 0) {
        ctx.fillStyle = pct>0.3 ? '#fff' : C.testo
        ctx.font = `900 ${f(13)} -apple-system`; ctx.textAlign = 'center'
        ctx.fillText(String(count), x+barW/2, y+barH/2+5)
      }
      ctx.fillStyle = FASCE[i].color
      ctx.beginPath(); ctx.arc(x+barW/2, H-28, 5, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle=C.testo2; ctx.font=`bold ${f(9)} -apple-system`; ctx.textAlign='center'
      ctx.fillText(FASCE[i].label, x+barW/2, H-16)
      ctx.fillStyle=C.sub; ctx.font=`${f(8)} -apple-system`
      ctx.fillText(FASCE[i].sub, x+barW/2, H-5)
    })
  }, [fasceCounts, loading])

  // ======================================================
  // CANVAS: CIRCADIANO 24h
  // ======================================================
  function drawCircadiano(canvasRef, data, fillFn) {
    if (!canvasRef.current || loading) return
    const canvas = canvasRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)
    const pL=8,pR=8,pT=6,pB=22, cellW=(W-pL-pR)/24, cellH=H-pT-pB
    const max = Math.max(1,...data)
    data.forEach((v,i) => {
      const x = pL+i*cellW
      ctx.fillStyle = fillFn(v/max, v)
      ctx.beginPath(); ctx.roundRect(x+1,pT,cellW-2,cellH,[5]); ctx.fill()
      if (v>0) {
        ctx.fillStyle='#fff'; ctx.font=`900 ${f(10)} -apple-system`; ctx.textAlign='center'
        ctx.fillText(String(v), x+cellW/2, pT+cellH/2+4)
      }
      if (i%4===0) {
        ctx.fillStyle=C.sub; ctx.font=`bold ${f(9)} -apple-system`; ctx.textAlign='center'
        ctx.fillText(`${i}h`, x+cellW/2, H-2)
      }
    })
  }

  useEffect(() => {
    drawCircadiano(circRef, hourly, (pct,v) =>
      v===0 ? '#f3f4f7' : pct<0.3 ? '#ffe6eb' : pct<0.6 ? '#ff8fa8' : C.crisi
    )
  }, [hourly, loading])

  useEffect(() => {
    drawCircadiano(toiletCircRef, hourlyToilet, (pct,v) =>
      v===0 ? '#f3f4f7' : pct<0.3 ? '#ede0ff' : pct<0.6 ? '#c4a8ee' : C.toilet
    )
  }, [hourlyToilet, loading])

  // ======================================================
  // CANVAS: CONFRONTO ANNI (line chart)
  // ======================================================
  function drawLineChart(canvasRef, currData, prevData, numW, currColor, dotColor) {
    if (!canvasRef.current || loading) return
    const canvas = canvasRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)
    const maxV = Math.max(1,...currData,...prevData)
    const pL=28,pR=12,pT=20,pB=28, plotW=W-pL-pR, plotH=H-pT-pB
    for (let i=0; i<=maxV; i++) {
      const y = pT+plotH-(i/maxV)*plotH
      ctx.strokeStyle='#f0f1f4'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(pL+plotW,y); ctx.stroke()
      ctx.fillStyle=C.sub; ctx.font=`bold ${f(9)} -apple-system`; ctx.textAlign='right'
      ctx.fillText(String(i), pL-4, y+4)
    }
    // area anno scorso
    ctx.beginPath()
    prevData.forEach((v,i) => { const x=pL+plotW*i/(numW-1), y=pT+plotH-(v/maxV)*plotH; i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y) })
    ctx.lineTo(pL+plotW,pT+plotH); ctx.lineTo(pL,pT+plotH); ctx.closePath()
    ctx.fillStyle='rgba(190,193,204,0.15)'; ctx.fill()
    // area anno corrente
    ctx.beginPath()
    currData.forEach((v,i) => { const x=pL+plotW*i/(numW-1), y=pT+plotH-(v/maxV)*plotH; i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y) })
    ctx.lineTo(pL+plotW,pT+plotH); ctx.lineTo(pL,pT+plotH); ctx.closePath()
    ctx.fillStyle = currColor + '1a'; ctx.fill()
    // linea anno scorso
    ctx.setLineDash([6,4]); ctx.strokeStyle=C.sub; ctx.lineWidth=2; ctx.lineJoin='round'
    ctx.beginPath()
    prevData.forEach((v,i) => { const x=pL+plotW*i/(numW-1), y=pT+plotH-(v/maxV)*plotH; i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y) })
    ctx.stroke(); ctx.setLineDash([])
    // linea anno corrente
    ctx.strokeStyle=currColor; ctx.lineWidth=2.5; ctx.lineJoin='round'
    ctx.beginPath()
    currData.forEach((v,i) => { const x=pL+plotW*i/(numW-1), y=pT+plotH-(v/maxV)*plotH; i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y) })
    ctx.stroke()
    // punti
    currData.forEach((v,i) => {
      const x=pL+plotW*i/(numW-1), y=pT+plotH-(v/maxV)*plotH
      ctx.fillStyle = v>0 ? dotColor : currColor; ctx.beginPath(); ctx.arc(x,y,v>0?5:3,0,Math.PI*2); ctx.fill()
      if (v>0) { ctx.fillStyle=C.testo; ctx.font=`900 ${f(10)} -apple-system`; ctx.textAlign='center'; ctx.fillText(String(v),x,y-8) }
    })
    // etichette asse x
    currData.forEach((_,i) => {
      ctx.fillStyle=C.sub; ctx.font=`bold ${f(9)} -apple-system`; ctx.textAlign='center'
      ctx.fillText(`S${i+1}`, pL+plotW*i/(numW-1), H-4)
    })
    // delta vs anno scorso
    const tot=currData.reduce((a,b)=>a+b,0), totP=prevData.reduce((a,b)=>a+b,0)
    const delta=tot-totP, up=delta>0
    ctx.fillStyle = up ? C.crisi : C.terapie
    ctx.font=`bold ${f(10)} -apple-system`; ctx.textAlign='right'
    ctx.fillText(`${up?'+':'-'}${Math.abs(delta)} vs anno scorso`, W-pR, pT-4)
  }

  useEffect(() => {
    const { curr, prev, numW } = weeksData
    drawLineChart(lineRef, curr, prev, numW, C.bluM, C.crisi)
  }, [weeksData, loading])

  useEffect(() => {
    if (toiletPeriodo.length === 0) return
    const { incidents, prev, numW } = toiletWeeks
    drawLineChart(toiletLineRef, incidents, prev, numW, C.toilet, C.arancio)
  }, [toiletWeeks, toiletPeriodo, loading])

  // ======================================================
  // CANVAS: DURATA MEDIA PER TIPO
  // ======================================================
  useEffect(() => {
    if (!durRef.current || loading || durataPerTipo.length === 0) return
    const canvas = durRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)
    const max = Math.max(1,...durataPerTipo.map(e=>e.avg))
    const rowH = H / durataPerTipo.length
    durataPerTipo.forEach(({ type, avg, count }, i) => {
      const color = TIPO_COLORI[type] || C.muted
      const y=i*rowH+5, bH=rowH-10
      const barW = Math.max(8,(avg/max)*(W-168))
      ctx.fillStyle=color+'22'; ctx.beginPath(); ctx.roundRect(156,y,W-166,bH,[8]); ctx.fill()
      ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(156,y,barW,bH,[8]); ctx.fill()
      ctx.fillStyle=C.testo2; ctx.font=`bold ${f(10)} -apple-system`; ctx.textAlign='right'
      ctx.fillText(type.replace('Crisi ',''), 150, y+bH/2+4)
      const lbl = fmtSec(avg)
      if (barW>32) {
        ctx.fillStyle='#fff'; ctx.font=`900 ${f(11)} -apple-system`; ctx.textAlign='left'
        ctx.fillText(lbl, 162, y+bH/2+4)
      } else {
        ctx.fillStyle=C.testo2; ctx.font=`900 ${f(11)} -apple-system`; ctx.textAlign='left'
        ctx.fillText(lbl, 156+barW+4, y+bH/2+4)
      }
      ctx.fillStyle=color+'33'; ctx.beginPath(); ctx.roundRect(W-34,y+2,30,bH-4,[6]); ctx.fill()
      ctx.fillStyle=color; ctx.font=`bold ${f(10)} -apple-system`; ctx.textAlign='center'
      ctx.fillText(`${count}x`, W-19, y+bH/2+4)
    })
  }, [durataPerTipo, loading])

  // ======================================================
  // CANVAS: INTERVALLO LIBERO DA CRISI
  // ======================================================
  useEffect(() => {
    if (!intervalloRef.current || loading) return
    const canvas = intervalloRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)
    if (daysSinceLast === null) {
      ctx.fillStyle=C.sub; ctx.font=`bold ${f(13)} -apple-system`; ctx.textAlign='center'
      ctx.fillText('Nessuna crisi registrata', W/2, H/2); return
    }
    const goal=30, pct=Math.min(daysSinceLast/goal,1)
    const fill = daysSinceLast>=14 ? C.terapie : daysSinceLast>=7 ? C.arancio : C.crisi
    const pL=16,pR=16,barY=52,barH=30,barW=W-pL-pR
    ctx.fillStyle=C.testo; ctx.font=`900 ${f(15)} -apple-system`; ctx.textAlign='left'
    ctx.fillText(`Ultima crisi: ${daysSinceLast} giorn${daysSinceLast===1?'o':'i'} fa`, pL, 24)
    ctx.fillStyle=C.muted; ctx.font=`bold ${f(10)} -apple-system`
    ctx.fillText(`Obiettivo clinico: ${goal} giorni senza crisi`, pL, 40)
    ctx.fillStyle='#f3f4f7'; ctx.beginPath(); ctx.roundRect(pL,barY,barW,barH,[15]); ctx.fill()
    if (pct>0) { ctx.fillStyle=fill; ctx.beginPath(); ctx.roundRect(pL,barY,barW*pct,barH,[15]); ctx.fill() }
    ctx.fillStyle='#fff'; ctx.font=`900 ${f(12)} -apple-system`; ctx.textAlign='center'
    if (pct>0.12) ctx.fillText(`${daysSinceLast}g / ${goal}g`, pL+(barW*pct)/2, barY+barH/2+5)
    ctx.strokeStyle=C.blu; ctx.lineWidth=2; ctx.setLineDash([4,3])
    ctx.beginPath(); ctx.moveTo(pL+barW,barY-4); ctx.lineTo(pL+barW,barY+barH+4); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle=C.blu; ctx.font=`bold ${f(9)} -apple-system`; ctx.textAlign='center'
    ctx.fillText(`obiettivo ${goal}g`, pL+barW, barY-8)
    if (maxGap>0) {
      ctx.fillStyle=C.testo2; ctx.font=`bold ${f(10)} -apple-system`; ctx.textAlign='left'
      ctx.fillText(`Periodo piu lungo senza crisi: ${maxGap} giorni`, pL, barY+barH+20)
    }
  }, [daysSinceLast, maxGap, loading])

  // ======================================================
  // CANVAS: TOILET BAR SETTIMANALE
  // ======================================================
  useEffect(() => {
    if (!toiletBarRef.current || loading || toiletPeriodo.length === 0) return
    const canvas = toiletBarRef.current, ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)
    const { sessions, incidents, numW } = toiletWeeks
    const max = Math.max(1,...sessions,...incidents)
    const pL=18,pR=10,pT=10,pB=28, slotW=(W-pL-pR)/numW, barW=(slotW-12)/2, plotH=H-pT-pB
    for (let i=0; i<=max; i++) {
      const y = pT+plotH-(i/max)*plotH
      ctx.strokeStyle='#f0f1f4'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke()
      ctx.fillStyle=C.sub; ctx.font=`bold ${f(9)} -apple-system`; ctx.textAlign='right'
      ctx.fillText(String(i), pL-2, y+4)
    }
    sessions.forEach((s,i) => {
      const inc = incidents[i]
      const x = pL+i*slotW+6
      const bHS = Math.max(4,(s/max)*plotH*0.9)
      const bHI = inc>0 ? Math.max(4,(inc/max)*plotH*0.9) : 0
      ctx.fillStyle=C.toilet
      ctx.beginPath(); ctx.roundRect(x,pT+plotH-bHS,barW,bHS,[6,6,0,0]); ctx.fill()
      if (s>0) { ctx.fillStyle='#fff'; ctx.font=`900 ${f(10)} -apple-system`; ctx.textAlign='center'; ctx.fillText(String(s),x+barW/2,pT+plotH-bHS/2+4) }
      if (bHI>0) {
        ctx.fillStyle=C.arancio
        ctx.beginPath(); ctx.roundRect(x+barW+2,pT+plotH-bHI,barW,bHI,[6,6,0,0]); ctx.fill()
        ctx.fillStyle='#fff'; ctx.font=`900 ${f(10)} -apple-system`; ctx.textAlign='center'
        ctx.fillText(String(inc), x+barW+2+barW/2, pT+plotH-bHI/2+4)
      }
      ctx.fillStyle=C.sub; ctx.font=`bold ${f(9)} -apple-system`; ctx.textAlign='center'
      ctx.fillText(`S${i+1}`, x+barW, H-4)
    })
  }, [toiletWeeks, toiletPeriodo, loading])

  // --- LOADING ---
  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <BarChart3 size={40} color={C.blu} style={{ margin:'0 auto 12px', display:'block' }} />
        <div style={{ fontSize:f(14), color:C.muted }}>Caricamento report...</div>
      </div>
    </div>
  )

  const monthName = navDate.toLocaleDateString('it-IT',{ month:'long', year:'numeric' })

  return (
    <div style={{ background:C.bg, minHeight:'100vh', paddingBottom:'100px', width:'100%', maxWidth:'520px', margin:'0 auto', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>

      {/* ===== HEADER ===== */}
      <div style={{ background:`linear-gradient(135deg,${C.blu},${C.bluM})`, padding:'14px 16px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
          <button onClick={onBack} style={{ width:'40px',height:'40px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
          <div>
            <div style={{ fontSize:f(18),fontWeight:'900',color:'#fff' }}>Report</div>
            <div style={{ fontSize:f(11),color:'rgba(255,255,255,0.78)' }}>{isDemo?'Dati demo':'Analisi completa'}</div>
          </div>
        </div>
        {/* Selettore periodo */}
        <div style={{ display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'2px' }}>
          {PERIODI.map(p => (
            <button key={p.key} onClick={() => setPeriodo(p.key)}
              style={{ padding:'7px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(12),fontFamily:'inherit',whiteSpace:'nowrap',
                background: periodo===p.key ? '#fff' : 'rgba(255,255,255,0.2)',
                color: periodo===p.key ? C.blu : '#fff',transition:'all 0.2s' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'12px' }}>

        {/* ===== TAB SWITCHER ===== */}
        <div style={{ display:'flex',background:C.bd,borderRadius:'14px',padding:'4px',marginBottom:'14px',gap:'4px' }}>
          {[
            { key:'crisi',  label:'Crisi',          Icon: Brain,    color: C.crisi  },
            { key:'toilet', label:'Toilet Training', Icon: Droplets, color: C.toilet },
          ].map(({ key, label, Icon, color }) => (
            <button key={key} onClick={() => setTabAttiva(key)}
              style={{ flex:1, padding:'9px 6px', borderRadius:'11px', border:'none', cursor:'pointer', fontWeight:'700',
                fontSize:f(11), fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px',
                background: tabAttiva===key ? C.card : 'transparent',
                color: tabAttiva===key ? color : C.muted,
                boxShadow: tabAttiva===key ? shSm : 'none',
                transition:'all 0.2s' }}>
              <Icon size={13} color={tabAttiva===key ? color : C.muted} />
              {label}
            </button>
          ))}
        </div>

        {/* ================================================================
            TAB: CRISI
        ================================================================ */}
        {tabAttiva === 'crisi' && (
          <>
            {/* STAT RAPIDE */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'7px',marginBottom:'10px' }}>
              <MiniStat label="Crisi periodo" val={periodoCrisi.length} color={C.crisi}    Icon={Flame} />
              <MiniStat label="Media intensita" val={mediaInt}         color={C.arancio}   Icon={BarChart3} />
              <MiniStat label="Perdita cosc." val={conPerdita}         color={C.toilet}    Icon={CircleAlert} />
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'7px',marginBottom:'10px' }}>
              <MiniStat label="Con perdita %" val={periodoCrisi.length > 0 ? `${conPerdPct}%` : '-'} color={C.toilet}  Icon={AlertTriangle} />
              <MiniStat label="Tipi diversi"  val={Object.keys(tipiCount).length}              color={C.bluM}    Icon={Activity} />
              <MiniStat label="Trigger noti"  val={triggerCount.length}                        color={C.arancio}  Icon={Zap} />
            </div>

            {/* 1. CALENDARIO */}
            <Card>
              <SectionTitle Icon={CalendarDays} color={C.blu} title="Calendario crisi"
                sub="Rosso = giorno con crisi. Numero grande = quante crisi. Bordato blu = oggi." />
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px' }}>
                <button onClick={() => setMonthOffset(v=>v-1)} style={{ width:'32px',height:'32px',borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.card,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <ChevronLeft size={16} color={C.testo2} />
                </button>
                <div style={{ fontSize:f(12),fontWeight:'800',color:C.testo,textTransform:'capitalize' }}>{monthName}</div>
                <button onClick={() => setMonthOffset(v=>v+1)} style={{ width:'32px',height:'32px',borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.card,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <ChevronRight size={16} color={C.testo2} />
                </button>
              </div>
              <canvas ref={calRef} width={460} height={240} style={{ width:'100%',height:'auto' }} />
              <Legenda items={[['#f3f4f7','0'],['#ffd9e0','1'],['#ff8fa8','2-3'],['#ff5e86','3-4'],[C.crisi,'4+']]} />
            </Card>

            {/* 2. FASCE ORARIE */}
            <Card>
              <SectionTitle Icon={Clock} color={C.toilet} title="Fasce orarie delle crisi"
                sub="24 ore in 6 blocchi da 4h. Rosso = fascia piu a rischio. Il numero indica le crisi." />
              <div style={{ display:'flex',justifyContent:'space-around',marginBottom:'4px' }}>
                {FASCE.map(({ Icon, color },i) => (
                  <div key={i} style={{ display:'flex',flex:1,justifyContent:'center' }}>
                    <Icon size={14} color={color} />
                  </div>
                ))}
              </div>
              {periodoCrisi.length > 0
                ? <canvas ref={fasciaRef} width={460} height={160} style={{ width:'100%',height:'auto' }} />
                : <div style={{ textAlign:'center',padding:'20px',color:C.sub,fontSize:f(13) }}>Nessun dato nel periodo</div>}
            </Card>

            {/* 3. PATTERN CIRCADIANO */}
            <Card>
              <SectionTitle Icon={Activity} color={C.arancio} title="Pattern circadiano ora per ora"
                sub="Ogni cella = 1 ora (0-23). Piu scuro = piu crisi in quell'ora." />
              {periodoCrisi.length > 0
                ? <canvas ref={circRef} width={460} height={52} style={{ width:'100%',height:'auto' }} />
                : <div style={{ textAlign:'center',padding:'20px',color:C.sub,fontSize:f(13) }}>Nessun dato nel periodo</div>}
              <Legenda items={[['#f3f4f7','Nessuna'],['#ffe6eb','Bassa'],['#ff8fa8','Media'],[C.crisi,'Alta']]} />
            </Card>

            {/* 4. CONFRONTO ANNO */}
            <Card>
              <SectionTitle Icon={TrendingUp} color={C.bluM} title="Tendenza e confronto anno precedente"
                sub="Blu = anno in corso. Grigio tratteggiato = stesso periodo anno scorso." />
              <canvas ref={lineRef} width={460} height={180} style={{ width:'100%',height:'auto' }} />
              <div style={{ display:'flex',gap:'14px',marginTop:'8px',flexWrap:'wrap' }}>
                <span style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                  <span style={{ width:'22px',height:'3px',background:C.bluM,borderRadius:'2px',display:'inline-block' }} />
                  <span style={{ fontSize:f(10),color:C.muted }}>Anno corrente</span>
                </span>
                <span style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                  <span style={{ width:'22px',height:'0',border:`2px dashed ${C.sub}`,display:'inline-block' }} />
                  <span style={{ fontSize:f(10),color:C.muted }}>Anno scorso (stesso periodo)</span>
                </span>
              </div>
            </Card>

            {/* 5. DURATA MEDIA */}
            <Card>
              <SectionTitle Icon={Timer} color={C.terapie} title="Durata media per tipo di crisi"
                sub="Ogni barra = durata media. Badge a destra = numero episodi nel periodo." />
              {durataPerTipo.length > 0
                ? <canvas ref={durRef} width={460} height={Math.max(100,durataPerTipo.length*42)} style={{ width:'100%',height:'auto' }} />
                : <div style={{ textAlign:'center',padding:'20px',color:C.sub,fontSize:f(13) }}>Nessun dato nel periodo</div>}
            </Card>

            {/* 6. INTERVALLO LIBERO DA CRISI */}
            <Card>
              <SectionTitle Icon={CircleAlert} color={C.terapie} title="Intervallo libero da crisi"
                sub="Verde = buon controllo (14g+), arancio = attenzione (7-14g), rosso = crisi recente." />
              <canvas ref={intervalloRef} width={460} height={100} style={{ width:'100%',height:'auto' }} />
            </Card>

            {/* 7. TRIGGER PIU FREQUENTI */}
            {triggerCount.length > 0 && (
              <Card>
                <SectionTitle Icon={Zap} color={C.arancio} title="Trigger piu frequenti" />
                {triggerCount.map(([trigger, count]) => {
                  const pct = Math.round((count/periodoCrisi.length)*100)
                  return (
                    <div key={trigger} style={{ marginBottom:'10px' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'4px' }}>
                        <span style={{ fontSize:f(12),fontWeight:'700',color:C.testo2 }}>{trigger}</span>
                        <span style={{ fontSize:f(12),color:C.muted,fontWeight:'600' }}>{count}x - {pct}%</span>
                      </div>
                      <div style={{ height:'6px',borderRadius:'3px',background:'#f3f4f7',overflow:'hidden' }}>
                        <div style={{ height:'100%',borderRadius:'3px',width:`${pct}%`,background:C.arancio,transition:'width 0.4s' }} />
                      </div>
                    </div>
                  )
                })}
              </Card>
            )}

            {/* 8. DETTAGLIO PER TIPO */}
            {periodoCrisi.length > 0 && (
              <Card>
                <SectionTitle Icon={BarChart3} color={C.crisi} title="Distribuzione per tipo" />
                {Object.entries(tipiCount).sort((a,b) => b[1]-a[1]).map(([tipo,count]) => {
                  const color = TIPO_COLORI[tipo] || C.muted
                  const pct   = Math.round((count/periodoCrisi.length)*100)
                  return (
                    <div key={tipo} style={{ marginBottom:'10px' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'4px' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
                          <div style={{ width:'10px',height:'10px',borderRadius:'50%',background:color,flexShrink:0 }} />
                          <span style={{ fontSize:f(12),fontWeight:'700',color:C.testo2 }}>{tipo}</span>
                        </div>
                        <span style={{ fontSize:f(12),color:C.muted,fontWeight:'600' }}>{count}x - {pct}%</span>
                      </div>
                      <div style={{ height:'6px',borderRadius:'3px',background:'#f3f4f7',overflow:'hidden' }}>
                        <div style={{ height:'100%',borderRadius:'3px',width:`${pct}%`,background:color,transition:'width 0.4s' }} />
                      </div>
                    </div>
                  )
                })}
              </Card>
            )}

            {/* 9. PERDITA DI COSCIENZA */}
            {periodoCrisi.length > 0 && (
              <Card>
                <SectionTitle Icon={Heart} color={C.toilet} title="Perdita di coscienza" />
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px' }}>
                  {[
                    { label:'Con perdita',   val:conPerdita,                         color:C.crisi,   Icon:XCircle     },
                    { label:'Senza perdita', val:periodoCrisi.length - conPerdita,    color:C.terapie, Icon:CheckCircle2 },
                  ].map(({ label, val, color, Icon:Ic }) => (
                    <div key={label} style={{ background:'#f8f9ff',borderRadius:'12px',padding:'12px',textAlign:'center' }}>
                      <Ic size={20} color={color} style={{ margin:'0 auto 6px',display:'block' }} />
                      <div style={{ fontSize:f(24),fontWeight:'900',color }}>{val}</div>
                      <div style={{ fontSize:f(9),color:C.muted,fontWeight:'700',textTransform:'uppercase' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {periodoCrisi.length > 0 && (
                  <div style={{ marginTop:'10px',height:'10px',borderRadius:'5px',background:'#f3f4f7',overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:'5px',width:`${conPerdPct}%`,background:C.crisi,transition:'width 0.4s' }} />
                  </div>
                )}
                <div style={{ display:'flex',justifyContent:'space-between',marginTop:'4px' }}>
                  <span style={{ fontSize:f(9),color:C.muted }}>{conPerdPct}% con perdita</span>
                  <span style={{ fontSize:f(9),color:C.muted }}>{100-conPerdPct}% senza perdita</span>
                </div>
              </Card>
            )}

            {/* RIEPILOGO GENERALE */}
            <Card>
              <div style={{ fontSize:f(13),fontWeight:'800',color:C.testo,marginBottom:'12px' }}>Riepilogo generale</div>
              {[
                { label:'Totale crisi registrate',    val:all.length,                       color:C.crisi   },
                { label:'Terapie attive',             val:terapie.length,                   color:C.terapie },
                { label:'Crisi con perdita (totale)', val:all.filter(c=>c.perdCoscienza).length, color:C.toilet  },
                { label:'Intensita media (totale)',   val:all.length>0 ? (all.reduce((s,c)=>s+(Number(c.intensita)||0),0)/all.length).toFixed(1) : '-', color:C.arancio },
                { label:'Giorni liberi da crisi',     val:daysSinceLast!==null ? `${daysSinceLast}g` : '-', color:C.terapie },
                { label:'Record senza crisi',         val:maxGap>0 ? `${maxGap}g` : '-',   color:C.bluM    },
              ].map((item,i) => (
                <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<5?`1px solid #f0f1f4`:'none' }}>
                  <span style={{ fontSize:f(12),color:C.testo2,fontWeight:'600' }}>{item.label}</span>
                  <span style={{ fontSize:f(16),fontWeight:'900',color:item.color }}>{item.val}</span>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* ================================================================
            TAB: TOILET TRAINING
        ================================================================ */}
        {tabAttiva === 'toilet' && (
          <>
            {/* STAT RAPIDE TOILET */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'7px',marginBottom:'10px' }}>
              <MiniStat label="Sessioni nel periodo" val={toiletPeriodo.length} color={C.toilet}  Icon={Droplets} />
              <MiniStat label="Freq. giornaliera"    val={freqGiorn}            color={C.bluM}    Icon={TrendingUp} />
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'7px',marginBottom:'10px' }}>
              <MiniStat label="Riuscite"  val={toiletRiuscite} color={C.terapie} />
              <MiniStat label="Inc. pippi" val={toiletIncPippi} color={C.arancio} />
              <MiniStat label="Inc. cacca" val={toiletIncCacca} color={C.crisi}   />
            </div>

            {/* % RIUSCITE */}
            {toiletPeriodo.length > 0 && (
              <Card>
                <SectionTitle Icon={CheckCircle2} color={C.terapie} title="Percentuale sessioni riuscite"
                  sub="Verde = riuscite, arancio = incidenti pippi, rosso = incidenti cacca." />
                <div style={{ display:'flex',gap:'8px',marginBottom:'8px' }}>
                  {[
                    { label:'Riuscite',  pct:Math.round((toiletRiuscite/toiletPeriodo.length)*100), color:C.terapie },
                    { label:'Inc. pippi',pct:Math.round((toiletIncPippi/toiletPeriodo.length)*100), color:C.arancio },
                    { label:'Inc. cacca',pct:Math.round((toiletIncCacca/toiletPeriodo.length)*100), color:C.crisi   },
                  ].map(({ label, pct, color }) => (
                    <div key={label} style={{ flex:1,background:'#f8f9ff',borderRadius:'12px',padding:'10px 6px',textAlign:'center' }}>
                      <div style={{ fontSize:f(22),fontWeight:'900',color }}>{pct}%</div>
                      <div style={{ fontSize:f(9),color:C.muted,fontWeight:'700',textTransform:'uppercase',lineHeight:'1.2' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {/* barra composita */}
                <div style={{ display:'flex',height:'12px',borderRadius:'6px',overflow:'hidden',gap:'2px' }}>
                  {toiletRiuscite > 0 && <div style={{ flex:toiletRiuscite,background:C.terapie,borderRadius:'6px 0 0 6px' }} />}
                  {toiletIncPippi > 0 && <div style={{ flex:toiletIncPippi,background:C.arancio }} />}
                  {toiletIncCacca > 0 && <div style={{ flex:toiletIncCacca,background:C.crisi,borderRadius:'0 6px 6px 0' }} />}
                </div>
              </Card>
            )}

            {/* BARRE SETTIMANALI */}
            {toiletPeriodo.length > 0 && (
              <Card>
                <SectionTitle Icon={BarChart3} color={C.toilet} title="Sessioni vs incidenti per settimana"
                  sub="Viola = sessioni totali. Arancio = incidenti (pippi + cacca)." />
                <canvas ref={toiletBarRef} width={460} height={160} style={{ width:'100%',height:'auto' }} />
                <div style={{ display:'flex',gap:'14px',marginTop:'8px' }}>
                  <span style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                    <span style={{ width:'14px',height:'10px',borderRadius:'4px',background:C.toilet,display:'inline-block' }} />
                    <span style={{ fontSize:f(10),color:C.muted }}>Sessioni</span>
                  </span>
                  <span style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                    <span style={{ width:'14px',height:'10px',borderRadius:'4px',background:C.arancio,display:'inline-block' }} />
                    <span style={{ fontSize:f(10),color:C.muted }}>Incidenti</span>
                  </span>
                </div>
              </Card>
            )}

            {/* PATTERN CIRCADIANO TOILET */}
            {toiletPeriodo.length > 0 && (
              <Card>
                <SectionTitle Icon={Clock} color={C.toilet} title="Pattern orario sessioni toilet"
                  sub="Ogni cella = 1 ora del giorno. Piu scuro = piu sessioni." />
                <canvas ref={toiletCircRef} width={460} height={52} style={{ width:'100%',height:'auto' }} />
                <Legenda items={[['#f3f4f7','Nessuna'],['#ede0ff','Bassa'],['#c4a8ee','Media'],[C.toilet,'Alta']]} />
              </Card>
            )}

            {/* TREND INCIDENTI ANNO SU ANNO */}
            {toiletPeriodo.length > 0 && (
              <Card>
                <SectionTitle Icon={TrendingUp} color={C.toilet} title="Trend incidenti - confronto anno"
                  sub="Viola = anno corrente. Grigio tratteggiato = anno scorso (stesso periodo)." />
                <canvas ref={toiletLineRef} width={460} height={180} style={{ width:'100%',height:'auto' }} />
                <div style={{ display:'flex',gap:'14px',marginTop:'8px' }}>
                  <span style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                    <span style={{ width:'22px',height:'3px',background:C.toilet,borderRadius:'2px',display:'inline-block' }} />
                    <span style={{ fontSize:f(10),color:C.muted }}>Anno corrente</span>
                  </span>
                  <span style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                    <span style={{ width:'22px',height:'0',border:`2px dashed ${C.sub}`,display:'inline-block' }} />
                    <span style={{ fontSize:f(10),color:C.muted }}>Anno scorso</span>
                  </span>
                </div>
              </Card>
            )}

            {/* NESSUN DATO */}
            {toiletPeriodo.length === 0 && (
              <Card>
                <div style={{ textAlign:'center',padding:'28px',color:C.sub }}>
                  <Droplets size={36} color={C.sub} style={{ margin:'0 auto 10px',display:'block' }} />
                  <div style={{ fontSize:f(13),marginBottom:'4px' }}>Nessun dato toilet nel periodo selezionato</div>
                  <div style={{ fontSize:f(11) }}>Prova a selezionare un periodo piu ampio</div>
                </div>
              </Card>
            )}

            {/* RIEPILOGO TOILET */}
            <Card>
              <div style={{ fontSize:f(13),fontWeight:'800',color:C.testo,marginBottom:'12px' }}>Riepilogo toilet (totale storico)</div>
              {[
                { label:'Sessioni totali registrate',  val:toiletAll.length,                                                            color:C.toilet  },
                { label:'Riuscite totali',             val:toiletAll.filter(t=>!t.incidentePippi&&!t.incidenteCacca).length,             color:C.terapie },
                { label:'Incidenti pippi (totale)',    val:toiletAll.filter(t=>t.incidentePippi).length,                                  color:C.arancio },
                { label:'Incidenti cacca (totale)',    val:toiletAll.filter(t=>t.incidenteCacca).length,                                  color:C.crisi   },
                { label:'% riuscite (totale storico)', val:toiletAll.length>0?`${Math.round((toiletAll.filter(t=>!t.incidentePippi&&!t.incidenteCacca).length/toiletAll.length)*100)}%`:'-', color:C.terapie },
              ].map((item,i) => (
                <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<4?`1px solid #f0f1f4`:'none' }}>
                  <span style={{ fontSize:f(12),color:C.testo2,fontWeight:'600' }}>{item.label}</span>
                  <span style={{ fontSize:f(16),fontWeight:'900',color:item.color }}>{item.val}</span>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* EMPTY STATE TOTALE */}
        {all.length === 0 && toiletAll.length === 0 && (
          <div style={{ textAlign:'center',padding:'32px',color:C.sub }}>
            <BarChart3 size={40} color={C.sub} style={{ margin:'0 auto 12px',display:'block' }} />
            <div style={{ fontSize:f(14),marginBottom:'4px' }}>Nessun dato registrato</div>
            <div style={{ fontSize:f(12) }}>I report appariranno qui dopo aver registrato dati</div>
          </div>
        )}

      </div>
    </div>
  )
}

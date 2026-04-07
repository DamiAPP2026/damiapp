import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, CalendarDays, Flame, LineChart as LineChartIcon, Radar, BarChart3, CircleAlert } from 'lucide-react'
import { db } from './firebase'
import { ref, onValue } from 'firebase/database'
import { processFirebaseSnap } from './crypto'

const DEMO_CRISI = [
  {id:1,type:'Crisi tonico-cloniche',duration:'00:02:34',timestamp:Date.now()-1*86400000,intensita:8,perdCoscienza:true},
  {id:2,type:'Crisi di assenza',duration:'00:00:18',timestamp:Date.now()-3*86400000,intensita:4,perdCoscienza:false},
  {id:3,type:'Crisi miocloniche',duration:'00:00:45',timestamp:Date.now()-6*86400000,intensita:5,perdCoscienza:false},
  {id:4,type:'Crisi tonico-cloniche',duration:'00:03:10',timestamp:Date.now()-9*86400000,intensita:9,perdCoscienza:true},
  {id:5,type:'Crisi atoniche',duration:'00:00:08',timestamp:Date.now()-17*86400000,intensita:3,perdCoscienza:false},
  {id:6,type:'Crisi di assenza',duration:'00:00:22',timestamp:Date.now()-22*86400000,intensita:3,perdCoscienza:false},
  {id:7,type:'Crisi toniche',duration:'00:01:20',timestamp:Date.now()-27*86400000,intensita:6,perdCoscienza:true},
  {id:8,type:'Crisi tonico-cloniche',duration:'00:01:55',timestamp:Date.now()-35*86400000,intensita:7,perdCoscienza:true},
  {id:9,type:'Crisi di assenza',duration:'00:00:30',timestamp:Date.now()-42*86400000,intensita:2,perdCoscienza:false},
]

const TIPO_COLORI = {
  'Crisi tonico-cloniche':'#F7295A','Crisi di assenza':'#7B5EA7',
  'Crisi miocloniche':'#FF8C42','Crisi toniche':'#2e84e9',
  'Crisi cloniche':'#00BFA6','Crisi atoniche':'#FFD93D',
}

const PERIODI = [
  {key:'week', label:'7g', days:7},
  {key:'month', label:'30g', days:30},
  {key:'3months', label:'3M', days:90},
  {key:'6months', label:'6M', days:180},
  {key:'year', label:'1A', days:365},
  {key:'all', label:'Tutto', days:99999},
]

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'
const f = (base) => `${Math.round(base * 1.15)}px`

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function toKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function monthLabel(d) {
  return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}
function durationToSec(duration) {
  if (!duration) return 0
  const p = String(duration).split(':').map(Number)
  if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2]
  if (p.length === 2) return p[0]*60 + p[1]
  return Number(duration) || 0
}

export default function ReportPage({ onBack, isDemo, onNavigate }) {
  const [crisi, setCrisi] = useState([])
  const [terapie, setTerapie] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('month')
  const [monthOffset, setMonthOffset] = useState(0)
  const calendarCanvasRef = useRef(null)
  const heatCanvasRef = useRef(null)
  const lineCanvasRef = useRef(null)
  const radarCanvasRef = useRef(null)
  const tipiCanvasRef = useRef(null)

  useEffect(() => {
    if (isDemo) {
      setCrisi(DEMO_CRISI)
      setTerapie([{id:1},{id:2},{id:3}])
      setLoading(false)
      return
    }
    let loaded = 0
    const check = () => { loaded++; if (loaded >= 2) setLoading(false) }
    const u1 = onValue(ref(db, 'crises'), snap => { setCrisi(processFirebaseSnap(snap)); check() })
    const u2 = onValue(ref(db, 'terapies'), snap => { setTerapie(processFirebaseSnap(snap)); check() })
    return () => { u1(); u2() }
  }, [isDemo])

  const giorniPeriodo = PERIODI.find(p => p.key === periodo)?.days || 30
  const fromTs = Date.now() - giorniPeriodo * 86400000
  const crisesSafe = useMemo(() => (Array.isArray(crisi) ? crisi : []).filter(c => c && c.timestamp), [crisi])
  const crisiPeriodo = useMemo(() => crisesSafe.filter(c => c.timestamp >= fromTs).sort((a,b) => a.timestamp - b.timestamp), [crisesSafe, fromTs])
  const crisiPeriodoDesc = useMemo(() => [...crisiPeriodo].sort((a,b) => b.timestamp - a.timestamp), [crisiPeriodo])

  const tipiCount = useMemo(() => {
    const o = {}
    crisiPeriodo.forEach(c => { o[c.type] = (o[c.type] || 0) + 1 })
    return o
  }, [crisiPeriodo])

  const mediaIntensita = crisiPeriodo.length > 0 ? (crisiPeriodo.reduce((s,c) => s + (Number(c.intensita) || 0), 0) / crisiPeriodo.length).toFixed(1) : '—'
  const conPerdita = crisiPeriodo.filter(c => c.perdCoscienza).length
  const intensitaMediaTotale = crisesSafe.length > 0 ? (crisesSafe.reduce((s,c) => s + (Number(c.intensita) || 0), 0) / crisesSafe.length).toFixed(1) : '—'
  const durataMediaMin = crisesSafe.length > 0 ? (crisesSafe.reduce((s,c) => s + durationToSec(c.duration), 0) / crisesSafe.length / 60).toFixed(1) : '—'

  const currentMonth = new Date()
  currentMonth.setMonth(currentMonth.getMonth() + monthOffset)
  const monthDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  const monthCrises = crisesSafe.filter(c => {
    const d = new Date(c.timestamp)
    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth()
  })

  const dayMap = useMemo(() => {
    const m = {}
    monthCrises.forEach(c => {
      const k = toKey(c.timestamp)
      if (!m[k]) m[k] = []
      m[k].push(c)
    })
    return m
  }, [monthCrises, currentMonth.getFullYear(), currentMonth.getMonth()])

  const radarData = useMemo(() => {
    const arr = Array.from({ length: 24 }, () => 0)
    crisiPeriodo.forEach(c => { arr[new Date(c.timestamp).getHours()] += 1 })
    return arr
  }, [crisiPeriodo])

  const lineData = useMemo(() => {
    const base = []
    const start = new Date(fromTs)
    start.setHours(0,0,0,0)
    const totalDays = Math.max(1, giorniPeriodo)
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = toKey(d.getTime())
      const items = crisiPeriodo.filter(c => toKey(c.timestamp) === key)
      base.push({
        key,
        label: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
        count: items.length,
      })
    }
    return base
  }, [crisiPeriodo, fromTs, giorniPeriodo])

  useEffect(() => {
    if (!calendarCanvasRef.current || loading) return
    const canvas = calendarCanvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0,0,W,H)
    ctx.fillStyle = '#feffff'
    ctx.fillRect(0,0,W,H)

    const cols = 7
    const rows = Math.ceil((monthDays + new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()) / 7)
    const cellW = (W - 20) / cols
    const cellH = (H - 30) / rows
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
    const startDay = firstDay === 0 ? 6 : firstDay - 1

    const title = monthLabel(currentMonth)
    ctx.fillStyle = '#08184c'
    ctx.font = `700 ${f(15)} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(title.charAt(0).toUpperCase() + title.slice(1), 10, 18)

    const weekdays = ['L','M','M','G','V','S','D']
    ctx.font = `700 ${f(10)} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.fillStyle = '#bec1cc'
    weekdays.forEach((wd, i) => ctx.fillText(wd, 12 + i * cellW, 30))

    for (let d = 1; d <= monthDays; d++) {
      const idx = startDay + d - 1
      const row = Math.floor(idx / 7)
      const col = idx % 7
      const x = col * cellW + 8
      const y = row * cellH + 38
      const key = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const count = (dayMap[key] || []).length
      const intensity = Math.min(count, 5)
      const fill = count === 0 ? '#f3f4f7' : intensity === 1 ? '#ffd9e0' : intensity === 2 ? '#ffb3c4' : intensity === 3 ? '#ff8fa8' : intensity === 4 ? '#ff5e86' : '#F7295A'
      ctx.fillStyle = fill
      ctx.beginPath()
      ctx.roundRect(x, y, cellW - 14, cellH - 12, [8])
      ctx.fill()
      ctx.fillStyle = count > 0 ? '#08184c' : '#bec1cc'
      ctx.font = `700 ${f(11)} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
      ctx.fillText(String(d), x + 8, y + 14)
      if (count > 0) {
        ctx.fillStyle = '#02153f'
        ctx.font = `700 ${f(10)} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
        ctx.fillText(`${count} crisi`, x + 8, y + cellH - 18)
      }
    }
  }, [currentMonth, monthDays, dayMap, loading])

  useEffect(() => {
    if (!heatCanvasRef.current || loading) return
    const canvas = heatCanvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0,0,W,H)
    const cols = 7
    const rows = 6
    const monthData = {}
    monthCrises.forEach(c => { const k = toKey(c.timestamp); monthData[k] = (monthData[k] || 0) + 1 })
    const max = Math.max(1, ...Object.values(monthData))
    const cellW = (W - 20) / cols
    const cellH = (H - 32) / rows
    const startDay = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7
    for (let d = 1; d <= monthDays; d++) {
      const idx = startDay + d - 1
      const r = Math.floor(idx / 7)
      const c = idx % 7
      const x = c * cellW + 8
      const y = r * cellH + 26
      const key = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const count = monthData[key] || 0
      const pct = count / max
      const fill = count === 0 ? '#f3f4f7' : pct < 0.25 ? '#ffe6eb' : pct < 0.5 ? '#ffbac9' : pct < 0.75 ? '#ff869f' : '#F7295A'
      ctx.fillStyle = fill
      ctx.beginPath()
      ctx.roundRect(x, y, cellW - 14, cellH - 12, [8])
      ctx.fill()
      ctx.fillStyle = count > 0 ? '#08184c' : '#bec1cc'
      ctx.font = `700 ${f(11)} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
      ctx.fillText(String(d), x + 8, y + 14)
      if (count > 0) {
        ctx.fillStyle = '#02153f'
        ctx.font = `700 ${f(10)} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
        ctx.fillText(String(count), x + 8, y + cellH - 18)
      }
    }
  }, [currentMonth, monthDays, monthCrises, loading])

  useEffect(() => {
    if (!lineCanvasRef.current || loading) return
    const canvas = lineCanvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0,0,W,H)
    const padL = 32, padR = 12, padT = 18, padB = 26
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const maxCount = Math.max(1, ...lineData.map(d => d.count))
    ctx.strokeStyle = '#bec1cc'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, padT)
    ctx.lineTo(padL, padT + plotH)
    ctx.lineTo(padL + plotW, padT + plotH)
    ctx.stroke()
    ctx.strokeStyle = '#193f9e'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    lineData.forEach((d, i) => {
      const x = padL + (plotW * i) / Math.max(1, lineData.length - 1)
      const y = padT + plotH - (d.count / maxCount) * (plotH - 6)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    lineData.forEach((d, i) => {
      const x = padL + (plotW * i) / Math.max(1, lineData.length - 1)
      const y = padT + plotH - (d.count / maxCount) * (plotH - 6)
      ctx.fillStyle = '#2e84e9'
      ctx.beginPath()
      ctx.arc(x, y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.fillStyle = '#7c8088'
    ctx.font = `700 ${f(10)} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    const step = Math.ceil(lineData.length / 6)
    lineData.forEach((d, i) => {
      if (i % step === 0 || i === lineData.length - 1) {
        const x = padL + (plotW * i) / Math.max(1, lineData.length - 1)
        ctx.save(); ctx.translate(x, H - 6); ctx.rotate(-Math.PI / 4); ctx.fillText(d.label, 0, 0); ctx.restore()
      }
    })
  }, [lineData, loading])

  useEffect(() => {
    if (!radarCanvasRef.current || loading) return
    const canvas = radarCanvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0,0,W,H)
    const cx = W / 2, cy = H / 2
    const rMax = Math.min(W, H) * 0.36
    const max = Math.max(1, ...radarData)
    const angles = Array.from({ length: 24 }, (_, i) => (Math.PI * 2 * i) / 24 - Math.PI / 2)
    for (let r = 1; r <= 4; r++) {
      ctx.strokeStyle = '#e7eaf0'
      ctx.beginPath()
      ctx.arc(cx, cy, (rMax * r) / 4, 0, Math.PI * 2)
      ctx.stroke()
    }
    angles.forEach(a => {
      ctx.strokeStyle = '#eef0f5'
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * rMax, cy + Math.sin(a) * rMax); ctx.stroke()
    })
    ctx.beginPath()
    radarData.forEach((v, i) => {
      const a = angles[i]
      const rr = (v / max) * rMax
      const x = cx + Math.cos(a) * rr
      const y = cy + Math.sin(a) * rr
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.closePath()
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rMax)
    grad.addColorStop(0, 'rgba(46,132,233,0.35)')
    grad.addColorStop(1, 'rgba(25,63,158,0.06)')
    ctx.fillStyle = grad
    ctx.strokeStyle = '#193f9e'
    ctx.lineWidth = 2.5
    ctx.fill(); ctx.stroke()
    radarData.forEach((v, i) => {
      const a = angles[i]
      const rr = (v / max) * rMax
      const x = cx + Math.cos(a) * rr
      const y = cy + Math.sin(a) * rr
      ctx.fillStyle = v > 0 ? '#F7295A' : '#bec1cc'
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill()
    })
  }, [radarData, loading])

  useEffect(() => {
    if (!tipiCanvasRef.current || loading || crisiPeriodo.length === 0) return
    const canvas = tipiCanvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0,0,W,H)
    const entries = Object.entries(tipiCount).sort((a,b) => b[1] - a[1])
    const max = Math.max(1, ...entries.map(e => e[1]))
    const rowH = H / Math.max(1, entries.length)
    entries.forEach(([tipo, count], i) => {
      const color = TIPO_COLORI[tipo] || '#7c8088'
      const y = i * rowH + 5
      const barH = rowH - 10
      const barW = (count / max) * (W - 92)
      ctx.fillStyle = '#f3f4f7'
      ctx.beginPath(); ctx.roundRect(80, y, W - 90, barH, [8]); ctx.fill()
      ctx.fillStyle = color
      ctx.beginPath(); ctx.roundRect(80, y, Math.max(8, barW), barH, [8]); ctx.fill()
      ctx.fillStyle = '#394058'
      ctx.font = `700 ${f(11)} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(tipo.replace('Crisi ', ''), 74, y + barH / 2 + 4)
      ctx.fillStyle = '#feffff'
      ctx.textAlign = 'left'
      ctx.fillText(String(count), 88, y + barH / 2 + 4)
    })
  }, [tipiCount, crisiPeriodo.length, loading])

  const stats = [
    { label: 'Crisi periodo', val: crisiPeriodo.length, color: '#F7295A', icon: Flame },
    { label: 'Media intensità', val: mediaIntensita, color: '#FF8C42', icon: BarChart3 },
    { label: 'Con perdita cosc.', val: conPerdita, color: '#7B5EA7', icon: CircleAlert },
  ]

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize: f(32), marginBottom:'12px' }}>📊</div>
        <div style={{ fontSize: f(14), color:'#7c8088' }}>Caricamento report...</div>
      </div>
    </div>
  )

  return (
    <div style={{ background:'#f3f4f7', minHeight:'100vh', paddingBottom:'100px', width:'100%', maxWidth:'520px', margin:'0 auto', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ background:'linear-gradient(135deg,#193f9e,#2e84e9)', padding:'14px 16px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
          <button onClick={onBack} style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.18)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ChevronLeft size={20} color="#fff"/>
          </button>
          <div>
            <div style={{ fontSize:f(18), fontWeight:'900', color:'#fff' }}>Report</div>
            <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.78)' }}>{isDemo ? 'Dati demo' : 'Analisi completa'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'2px' }}>
          {PERIODI.map(p => (
            <button key={p.key} onClick={() => setPeriodo(p.key)} style={{ padding:'7px 14px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'700', fontSize:f(12), fontFamily:'inherit', whiteSpace:'nowrap', background:periodo===p.key ? '#fff' : 'rgba(255,255,255,0.2)', color:periodo===p.key ? '#193f9e' : '#fff', transition:'all 0.2s' }}>{p.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'12px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px', marginBottom:'10px' }}>
          {stats.map(({label, val, color, icon:Icon}, i) => (
            <div key={i} style={{ background:'#feffff', borderRadius:'14px', padding:'10px 8px', boxShadow:shSm, textAlign:'center' }}>
              <Icon size={16} color={color} style={{ margin:'0 auto 4px' }} />
              <div style={{ fontSize:f(22), fontWeight:'900', color, marginBottom:'2px' }}>{val}</div>
              <div style={{ fontSize:f(8.5), color:'#7c8088', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.3px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
            <CalendarDays size={16} color="#193f9e" />
            <div style={{ fontSize:f(13), fontWeight:'800', color:'#02153f' }}>Calendario delle crisi</div>
          </div>
          <canvas ref={calendarCanvasRef} width={460} height={190} style={{ width:'100%', height:'auto' }} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'10px' }}>
            <button onClick={() => setMonthOffset(v => v - 1)} style={{ border:'1px solid rgba(2,21,63,0.10)', background:'#feffff', color:'#02153f', borderRadius:'12px', padding:'8px 12px', fontWeight:'700' }}>Mese prec.</button>
            <button onClick={() => setMonthOffset(0)} style={{ border:'1px solid rgba(2,21,63,0.10)', background:'#feffff', color:'#02153f', borderRadius:'12px', padding:'8px 12px', fontWeight:'700' }}>Mese attuale</button>
            <button onClick={() => setMonthOffset(v => v + 1)} style={{ border:'1px solid rgba(2,21,63,0.10)', background:'#feffff', color:'#02153f', borderRadius:'12px', padding:'8px 12px', fontWeight:'700' }}>Mese succ.</button>
          </div>
        </div>

        <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
            <Flame size={16} color="#F7295A" />
            <div style={{ fontSize:f(13), fontWeight:'800', color:'#02153f' }}>Heat map mensile</div>
          </div>
          <canvas ref={heatCanvasRef} width={460} height={170} style={{ width:'100%', height:'auto' }} />
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'10px', flexWrap:'wrap' }}>
            <span style={{ fontSize:f(11), color:'#7c8088', fontWeight:'700' }}>Meno</span>
            {['#f3f4f7','#ffe6eb','#ffbac9','#ff869f','#F7295A'].map((c, idx) => <span key={idx} style={{ width:'18px', height:'10px', borderRadius:'999px', background:c, display:'inline-block' }} />)}
            <span style={{ fontSize:f(11), color:'#7c8088', fontWeight:'700' }}>Più</span>
          </div>
        </div>

        <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
            <LineChartIcon size={16} color="#193f9e" />
            <div style={{ fontSize:f(13), fontWeight:'800', color:'#02153f' }}>Grafici a linee giornalieri</div>
          </div>
          <canvas ref={lineCanvasRef} width={460} height={190} style={{ width:'100%', height:'auto' }} />
          <div style={{ fontSize:f(11), color:'#7c8088', marginTop:'8px' }}>La linea mostra il numero di crisi per giorno nel periodo selezionato.</div>
        </div>

        <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
            <Radar size={16} color="#7B5EA7" />
            <div style={{ fontSize:f(13), fontWeight:'800', color:'#02153f' }}>Radar chart orario</div>
          </div>
          <canvas ref={radarCanvasRef} width={460} height={250} style={{ width:'100%', height:'auto' }} />
          <div style={{ fontSize:f(11), color:'#7c8088', marginTop:'8px' }}>Utile per vedere a colpo d'occhio le fasce orarie più a rischio.</div>
        </div>

        <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
            <BarChart3 size={16} color="#00BFA6" />
            <div style={{ fontSize:f(13), fontWeight:'800', color:'#02153f' }}>Distribuzione tipi di crisi</div>
          </div>
          {crisiPeriodo.length > 0 ? (
            <canvas ref={tipiCanvasRef} width={460} height={Math.max(120, Object.keys(tipiCount).length * 38)} style={{ width:'100%', height:'auto' }} />
          ) : (
            <div style={{ textAlign:'center', padding:'20px', color:'#bec1cc', fontSize:f(13) }}>Nessun dato nel periodo selezionato</div>
          )}
        </div>

        <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh }}>
          <div style={{ fontSize:f(13), fontWeight:'800', color:'#02153f', marginBottom:'12px' }}>Dettaglio per tipo</div>
          {Object.entries(tipiCount).sort((a,b) => b[1]-a[1]).map(([tipo,count]) => {
            const color = TIPO_COLORI[tipo] || '#7c8088'
            const pct = Math.round((count / crisiPeriodo.length) * 100)
            return (
              <div key={tipo} style={{ marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px', gap:'10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', minWidth:0 }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:color, flex:'0 0 auto' }} />
                    <span style={{ fontSize:f(12), fontWeight:'700', color:'#394058', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tipo}</span>
                  </div>
                  <span style={{ fontSize:f(12), color:'#7c8088', fontWeight:'600', flex:'0 0 auto' }}>{count}x · {pct}%</span>
                </div>
                <div style={{ height:'6px', borderRadius:'3px', background:'#f3f4f7', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:'3px', width:`${pct}%`, background:color, transition:'width 0.4s' }} />
                </div>
              </div>
            )
          })}
          {crisiPeriodo.length === 0 && <div style={{ color:'#bec1cc', fontSize:f(13), textAlign:'center', padding:'8px 0' }}>Nessun dato disponibile nel periodo selezionato.</div>}
        </div>

        <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', boxShadow:sh }}>
          <div style={{ fontSize:f(13), fontWeight:'800', color:'#02153f', marginBottom:'12px' }}>Riepilogo generale</div>
          {[
            { label:'Totale crisi registrate', val:crisesSafe.length, color:'#F7295A' },
            { label:'Terapie attive', val:terapie.length, color:'#00BFA6' },
            { label:'Crisi con perdita coscienza', val:crisesSafe.filter(c => c.perdCoscienza).length, color:'#7B5EA7' },
            { label:'Intensità media (totale)', val:intensitaMediaTotale, color:'#FF8C42' },
            { label:'Durata media (min)', val:durataMediaMin, color:'#2e84e9' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i < 4 ? '1px solid #f0f1f4' : 'none' }}>
              <span style={{ fontSize:f(12), color:'#394058', fontWeight:'600' }}>{item.label}</span>
              <span style={{ fontSize:f(16), fontWeight:'900', color:item.color }}>{item.val}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', boxShadow:sh, marginTop:'10px' }}>
          <div style={{ fontSize:f(13), fontWeight:'800', color:'#02153f', marginBottom:'12px' }}>Calendario crisi del periodo</div>
          {crisiPeriodo.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(92px, 1fr))', gap:'8px' }}>
              {crisiPeriodoDesc.slice(0, 12).map(c => (
                <div key={c.id || c.timestamp} style={{ background:'#fdfdfd', border:'1px solid rgba(2,21,63,0.08)', borderRadius:'14px', padding:'10px', boxShadow:shSm }}>
                  <div style={{ fontSize:f(11), color:'#bec1cc', fontWeight:'700' }}>{new Date(c.timestamp).toLocaleDateString('it-IT', { day:'2-digit', month:'short' })}</div>
                  <div style={{ fontSize:f(12), color:'#08184c', fontWeight:'800', marginTop:'4px', lineHeight:1.25 }}>{c.type}</div>
                  <div style={{ fontSize:f(11), color:'#7c8088', marginTop:'6px' }}>{c.duration || '—'} · {c.intensita || '—'}/10</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'20px', color:'#bec1cc', fontSize:f(13) }}>Nessuna crisi registrata nel periodo.</div>
          )}
        </div>
      </div>
    </div>
  )
}
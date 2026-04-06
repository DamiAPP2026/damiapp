import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'

const DEMO_CRISI = [
  {id:1, type:'Crisi tonico-cloniche', duration:'00:02:34', date:'06/04/2026 08:23', timestamp: Date.now() - 1*86400000, areas:['Braccio dx','Gamba dx'], trigger:'Poco sonno', intensita:8, perdCoscienza:true, postCrisi:'Sonno profondo', note:'Notte agitata'},
  {id:2, type:'Crisi di assenza', duration:'00:00:18', date:'04/04/2026 14:10', timestamp: Date.now() - 3*86400000, areas:['Crisi generalizzata'], trigger:'Stress', intensita:4, perdCoscienza:false, postCrisi:'Normale', note:''},
  {id:3, type:'Crisi miocloniche', duration:'00:00:45', date:'01/04/2026 07:55', timestamp: Date.now() - 6*86400000, areas:['Braccio sx'], trigger:'Farmaco dimenticato', intensita:5, perdCoscienza:false, postCrisi:'Stanchezza', note:'Dosi saltate la sera prima'},
  {id:4, type:'Crisi tonico-cloniche', duration:'00:03:10', date:'28/03/2026 22:40', timestamp: Date.now() - 9*86400000, areas:['Parte dx del corpo','Capo verso dx'], trigger:'Febbre', intensita:9, perdCoscienza:true, postCrisi:'Sonno profondo', note:'Temperatura 38.5'},
  {id:5, type:'Crisi atoniche', duration:'00:00:08', date:'20/03/2026 11:15', timestamp: Date.now() - 17*86400000, areas:['Crisi generalizzata'], trigger:'Nessuno noto', intensita:3, perdCoscienza:false, postCrisi:'Confusione', note:''},
  {id:6, type:'Crisi di assenza', duration:'00:00:22', date:'15/03/2026 09:30', timestamp: Date.now() - 22*86400000, areas:[], trigger:'Stress', intensita:3, perdCoscienza:false, postCrisi:'Normale', note:''},
  {id:7, type:'Crisi toniche', duration:'00:01:20', date:'10/03/2026 16:45', timestamp: Date.now() - 27*86400000, areas:['Gamba sx','Parte sx del corpo'], trigger:'Poco sonno', intensita:6, perdCoscienza:true, postCrisi:'Stanchezza', note:''},
]

const TIPO_COLORI = {
  'Crisi tonico-cloniche': '#F7295A',
  'Crisi di assenza': '#7B5EA7',
  'Crisi miocloniche': '#FF8C42',
  'Crisi toniche': '#2e84e9',
  'Crisi cloniche': '#00BFA6',
  'Crisi atoniche': '#FFD93D',
}

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

export default function DiarioCrisi({ onBack, isDemo }) {
  const [mese, setMese] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const canvasRef = useRef(null)

  const crisi = DEMO_CRISI

  const giorni = ['L','M','M','G','V','S','D']
  const mesi = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
    'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

  // Crisi del mese corrente
  const crisiMese = crisi.filter(c => {
    const d = new Date(c.timestamp)
    return d.getMonth() === mese.getMonth() && d.getFullYear() === mese.getFullYear()
  })

  // Crisi per giorno del mese
  const crisiByDay = {}
  crisiMese.forEach(c => {
    const d = new Date(c.timestamp).getDate()
    crisiByDay[d] = (crisiByDay[d] || 0) + 1
  })

  // Primo giorno del mese (0=dom → converti a lun=0)
  const primoGiorno = new Date(mese.getFullYear(), mese.getMonth(), 1).getDay()
  const offset = primoGiorno === 0 ? 6 : primoGiorno - 1
  const giorniMese = new Date(mese.getFullYear(), mese.getMonth() + 1, 0).getDate()

  // Grafico a barre per settimana
  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const W = canvasRef.current.width
    const H = canvasRef.current.height
    ctx.clearRect(0, 0, W, H)

    // Ultime 8 settimane
    const weeks = []
    for (let i = 7; i >= 0; i--) {
      const start = new Date()
      start.setDate(start.getDate() - i * 7 - 6)
      const end = new Date()
      end.setDate(end.getDate() - i * 7)
      const count = crisi.filter(c =>
        c.timestamp >= start.getTime() && c.timestamp <= end.getTime()
      ).length
      weeks.push({ label: `S${8-i}`, count })
    }

    const max = Math.max(...weeks.map(w => w.count), 1)
    const barW = (W - 40) / weeks.length - 6
    const chartH = H - 30

    weeks.forEach((w, i) => {
      const x = 20 + i * ((W - 40) / weeks.length)
      const barH = (w.count / max) * chartH * 0.85
      const y = chartH - barH

      // Barra
      const grad = ctx.createLinearGradient(0, y, 0, chartH)
      grad.addColorStop(0, '#2e84e9')
      grad.addColorStop(1, '#193f9e')
      ctx.fillStyle = w.count > 0 ? grad : '#f0f1f4'
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH + 2, [4, 4, 0, 0])
      ctx.fill()

      // Label
      ctx.fillStyle = '#bec1cc'
      ctx.font = '10px -apple-system'
      ctx.textAlign = 'center'
      ctx.fillText(w.label, x + barW/2, H - 6)

      // Numero
      if (w.count > 0) {
        ctx.fillStyle = '#02153f'
        ctx.font = 'bold 11px -apple-system'
        ctx.fillText(w.count, x + barW/2, y - 4)
      }
    })
  }, [crisi, mese])

  // Stats
  const mediaIntensita = crisiMese.length > 0
    ? (crisiMese.reduce((s, c) => s + (c.intensita || 0), 0) / crisiMese.length).toFixed(1)
    : '—'
  const tipiCount = {}
  crisi.forEach(c => { tipiCount[c.type] = (tipiCount[c.type] || 0) + 1 })
  const tipoMax = Object.entries(tipiCount).sort((a,b) => b[1]-a[1])[0]

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .diario-wrap{background:#f3f4f7;min-height:100vh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          padding-bottom:80px;width:100%;max-width:480px;margin:0 auto;}
        .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:8px;}
        .cal-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;
          border-radius:8px;font-size:12px;font-weight:600;color:#7c8088;
          background:#f3f4f7;cursor:default;}
        .cal-day.header{background:transparent;font-weight:800;color:#bec1cc;font-size:11px;}
        .cal-day.has-crisi{background:linear-gradient(135deg,#F7295A,#FF8C42);
          color:#fff;font-weight:800;cursor:pointer;}
        .cal-day.empty{background:transparent;}
      `}</style>

      <div className="diario-wrap">

        {/* HEADER */}
        <div style={{
          background:'linear-gradient(135deg,#F7295A,#FF8C42)',
          padding:'14px 16px 20px'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px'}}>
            <button onClick={onBack} style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'rgba(255,255,255,0.2)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}><ChevronLeft size={20} color="#fff"/></button>
            <div>
              <div style={{fontSize:'18px', fontWeight:'900', color:'#fff'}}>📋 Diario crisi</div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.75)'}}>
                {crisi.length} crisi totali registrate
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* STATS RAPIDE */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px', marginBottom:'10px'}}>
            {[
              {label:'Questo mese', val:crisiMese.length, color:'#F7295A', bg:'#FEF0F4'},
              {label:'Media intensità', val:mediaIntensita, color:'#FF8C42', bg:'#FFF4EC'},
              {label:'Tipo più freq.', val:tipoMax ? tipoMax[1]+'x' : '—', color:'#7B5EA7', bg:'#F5F3FF'},
            ].map(({label, val, color, bg}, i) => (
              <div key={i} style={{
                background:'#feffff', borderRadius:'14px', padding:'10px 8px',
                boxShadow:shSm, textAlign:'center'
              }}>
                <div style={{fontSize:'20px', fontWeight:'900', color, marginBottom:'2px'}}>{val}</div>
                <div style={{fontSize:'9px', color:'#7c8088', fontWeight:'700',
                  textTransform:'uppercase', letterSpacing:'0.3px'}}>{label}</div>
              </div>
            ))}
          </div>

          {/* GRAFICO SETTIMANALE */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'10px'}}>
              📊 Andamento settimanale
            </div>
            <canvas
              ref={canvasRef}
              width={420} height={120}
              style={{width:'100%', height:'auto'}}
            />
          </div>

          {/* CALENDARIO */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
              <button onClick={() => setMese(new Date(mese.getFullYear(), mese.getMonth()-1, 1))} style={{
                width:'32px', height:'32px', borderRadius:'50%',
                background:'#f3f4f7', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center'
              }}><ChevronLeft size={16} color="#7c8088"/></button>
              <span style={{fontSize:'14px', fontWeight:'800', color:'#02153f', textTransform:'capitalize'}}>
                {mesi[mese.getMonth()]} {mese.getFullYear()}
              </span>
              <button onClick={() => setMese(new Date(mese.getFullYear(), mese.getMonth()+1, 1))} style={{
                width:'32px', height:'32px', borderRadius:'50%',
                background:'#f3f4f7', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center'
              }}><ChevronRight size={16} color="#7c8088"/></button>
            </div>

            <div className="cal-grid">
              {giorni.map((g,i) => (
                <div key={i} className="cal-day header">{g}</div>
              ))}
              {[...Array(offset)].map((_,i) => (
                <div key={`e${i}`} className="cal-day empty"/>
              ))}
              {[...Array(giorniMese)].map((_,i) => {
                const d = i+1
                const hc = crisiByDay[d] > 0
                return (
                  <div key={d} className={`cal-day${hc ? ' has-crisi' : ''}`}
                    onClick={() => hc && setSelected(d)}
                    title={hc ? `${crisiByDay[d]} crisi` : ''}>
                    {d}
                    {hc && crisiByDay[d] > 1 && (
                      <span style={{fontSize:'8px', marginLeft:'1px'}}>×{crisiByDay[d]}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {crisiMese.length === 0 && (
              <div style={{textAlign:'center', padding:'16px', color:'#bec1cc', fontSize:'13px'}}>
                Nessuna crisi in questo mese
              </div>
            )}
          </div>

          {/* TIPO PIÙ FREQUENTE */}
          {Object.keys(tipiCount).length > 0 && (
            <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
              <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'10px'}}>
                📈 Distribuzione per tipo
              </div>
              {Object.entries(tipiCount).sort((a,b) => b[1]-a[1]).map(([tipo, count]) => {
                const color = TIPO_COLORI[tipo] || '#7c8088'
                const pct = Math.round((count / crisi.length) * 100)
                return (
                  <div key={tipo} style={{marginBottom:'8px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                      <span style={{fontSize:'11px', fontWeight:'700', color:'#394058'}}>{tipo}</span>
                      <span style={{fontSize:'11px', color:'#7c8088'}}>{count}x · {pct}%</span>
                    </div>
                    <div style={{height:'6px', borderRadius:'3px', background:'#f3f4f7', overflow:'hidden'}}>
                      <div style={{
                        height:'100%', borderRadius:'3px',
                        width:`${pct}%`, background:color,
                        transition:'width 0.4s'
                      }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* LISTA CRISI */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'12px'}}>
              📋 Lista crisi (recenti prima)
            </div>
            {[...crisi].sort((a,b) => b.timestamp - a.timestamp).map((c, i) => {
              const color = TIPO_COLORI[c.type] || '#7c8088'
              return (
                <div key={c.id} style={{
                  padding:'12px', borderRadius:'14px', marginBottom:'8px',
                  background:'#f3f4f7', border:`1.5px solid ${color}22`
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px'}}>
                    <div style={{
                      width:'10px', height:'10px', borderRadius:'50%',
                      background:color, flexShrink:0
                    }}/>
                    <div style={{fontSize:'13px', fontWeight:'800', color, flex:1}}>{c.type}</div>
                    <div style={{
                      fontSize:'11px', fontWeight:'700', color:'#fff',
                      background:color, padding:'2px 8px', borderRadius:'20px'
                    }}>{c.duration}</div>
                  </div>
                  <div style={{fontSize:'11px', color:'#7c8088', marginBottom:'4px'}}>
                    📅 {c.date}
                  </div>
                  {c.areas && c.areas.length > 0 && (
                    <div style={{fontSize:'11px', color:'#394058', marginBottom:'3px'}}>
                      🎯 {c.areas.join(', ')}
                    </div>
                  )}
                  {c.trigger && c.trigger !== 'Nessuno noto' && (
                    <div style={{fontSize:'11px', color:'#394058', marginBottom:'3px'}}>
                      ⚡ Trigger: {c.trigger}
                    </div>
                  )}
                  <div style={{display:'flex', gap:'6px', marginTop:'6px', flexWrap:'wrap'}}>
                    {c.intensita && (
                      <span style={{
                        fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px',
                        background: c.intensita<=3 ? '#E8FBF8' : c.intensita<=6 ? '#FFF9E6' : '#FEF0F4',
                        color: c.intensita<=3 ? '#00BFA6' : c.intensita<=6 ? '#FF8C42' : '#F7295A'
                      }}>Intensità {c.intensita}/10</span>
                    )}
                    {c.perdCoscienza && (
                      <span style={{
                        fontSize:'10px', fontWeight:'700', padding:'2px 8px',
                        borderRadius:'20px', background:'#FEF0F4', color:'#F7295A'
                      }}>Perdita coscienza</span>
                    )}
                    {c.postCrisi && (
                      <span style={{
                        fontSize:'10px', fontWeight:'700', padding:'2px 8px',
                        borderRadius:'20px', background:'#F5F3FF', color:'#7B5EA7'
                      }}>{c.postCrisi}</span>
                    )}
                  </div>
                  {c.note && (
                    <div style={{
                      fontSize:'11px', color:'#7c8088', marginTop:'6px',
                      fontStyle:'italic', borderTop:'1px solid #f0f1f4', paddingTop:'6px'
                    }}>📝 {c.note}</div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </>
  )
}
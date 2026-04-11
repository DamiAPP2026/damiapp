import { useEffect, useRef, useState } from 'react'

const f = (base) => `${Math.round(base * 1.15)}px`

function matchOggi(dataField) {
  if (!dataField) return false
  const d = new Date()
  const oggi = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const raw = String(dataField).replace(/[\/\-\s]/g,'')
  const oggiRaw = oggi.replace(/[\/\-\s]/g,'')
  return raw === oggiRaw || String(dataField) === oggi
}

function matchIeri(dataField) {
  if (!dataField) return false
  const d = new Date(Date.now()-86400000)
  const ieri = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const raw = String(dataField).replace(/[\/\-\s]/g,'')
  const ieriRaw = ieri.replace(/[\/\-\s]/g,'')
  return raw === ieriRaw || String(dataField) === ieri
}

// ── Grafico canvas andamento 7 giorni ──────────────────────────
function Grafico7gg({ dati }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const W = canvasRef.current.width
    const H = canvasRef.current.height
    ctx.clearRect(0,0,W,H)

    const days = []
    for (let i=6; i>=0; i--) {
      const d = new Date()
      d.setDate(d.getDate()-i)
      d.setHours(0,0,0,0)
      const dEnd = new Date(d); dEnd.setHours(23,59,59,999)
      const bagno = dati.filter(s => {
        const ts = s.timestamp || 0
        return ts>=d.getTime() && ts<=dEnd.getTime() && s.bisogno && s.bisogno!=='nessuno'
      }).length
      const incidenti = dati.filter(s => {
        const ts = s.timestamp || 0
        return ts>=d.getTime() && ts<=dEnd.getTime() && (s.incidentePippi||s.incidenteCacca)
      }).length
      const label = ['L','M','M','G','V','S','D'][d.getDay()===0?6:d.getDay()-1]
      days.push({label, bagno, incidenti})
    }

    const maxVal = Math.max(...days.map(d=>d.bagno+d.incidenti), 1)
    const barW = (W-40)/days.length - 4
    const chartH = H - 28

    days.forEach((d,i) => {
      const x = 20 + i*((W-40)/days.length)

      if (d.bagno > 0) {
        const barH = (d.bagno/maxVal)*chartH*0.85
        const y = chartH - barH
        ctx.fillStyle = '#7B5EA7'
        ctx.beginPath(); ctx.roundRect(x, y, barW, barH+2, [4,4,0,0]); ctx.fill()
      }

      if (d.incidenti > 0) {
        const barHB = (d.bagno/maxVal)*chartH*0.85
        const barHI = (d.incidenti/maxVal)*chartH*0.4
        const y = chartH - barHB - barHI
        ctx.fillStyle = '#F7295A'
        ctx.beginPath(); ctx.roundRect(x, y, barW, barHI, [4,4,0,0]); ctx.fill()
      }

      if (d.bagno===0 && d.incidenti===0) {
        ctx.fillStyle = '#f0f1f4'
        ctx.beginPath(); ctx.roundRect(x, chartH-3, barW, 3, [2,2,0,0]); ctx.fill()
      }

      ctx.fillStyle = '#bec1cc'
      ctx.font = '10px -apple-system'
      ctx.textAlign = 'center'
      ctx.fillText(d.label, x+barW/2, H-8)
    })
  }, [dati])

  return <canvas ref={canvasRef} width={420} height={110} style={{width:'100%',height:'auto'}}/>
}

// ── Heatmap 24h × tipo bisogno ─────────────────────────────────
function HeatmapOraria({ dati, periodo }) {
  const tipi = ['pippi','cacca','entrambi']
  const labels = ['💧 Pipì','💩 Cacca','🔄 Entrambi']
  const colori = ['#2e84e9','#FF8C42','#7B5EA7']

  // filtro periodo
  const fromTs = periodo==='7gg' ? Date.now()-7*86400000
    : periodo==='30gg' ? Date.now()-30*86400000 : 0
  const filtered = dati.filter(s=>(s.timestamp||0)>=fromTs)

  // matrice [tipo][fascia_3h] = count
  const fasce = 8 // 0-3, 3-6, 6-9, ... 21-24
  const matrix = tipi.map(() => Array(fasce).fill(0))

  filtered.forEach(s => {
    if (!s.bisogno || s.bisogno==='nessuno') return
    const h = parseInt((s.ora||'00').split(':')[0])
    const fasciaIdx = Math.floor(h/3)
    const tipoIdx = tipi.indexOf(s.bisogno)
    if (tipoIdx>=0 && fasciaIdx<fasce) matrix[tipoIdx][fasciaIdx]++
  })

  const maxVal = Math.max(...matrix.flat(), 1)

  const labelFasce = ['0-3','3-6','6-9','9-12','12-15','15-18','18-21','21-24']

  return (
    <div>
      <div style={{display:'flex',gap:'4px',marginBottom:'6px'}}>
        <div style={{width:'70px',flexShrink:0}}/>
        {labelFasce.map(l=>(
          <div key={l} style={{flex:1,textAlign:'center',fontSize:f(8),color:'#bec1cc',fontWeight:'600'}}>{l}</div>
        ))}
      </div>
      {tipi.map((tipo,ti)=>(
        <div key={tipo} style={{display:'flex',alignItems:'center',gap:'4px',marginBottom:'4px'}}>
          <div style={{width:'70px',fontSize:f(9),color:'#394058',fontWeight:'700',flexShrink:0}}>{labels[ti]}</div>
          {matrix[ti].map((val,fi)=>{
            const intensity = val/maxVal
            const bg = val===0 ? '#f3f4f7'
              : `rgba(${colori[ti]==='#2e84e9'?'46,132,233':colori[ti]==='#FF8C42'?'255,140,66':'123,94,167'},${0.15+intensity*0.85})`
            return (
              <div key={fi} style={{
                flex:1,aspectRatio:'1',borderRadius:'6px',
                background:bg,display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:f(8),fontWeight:'700',color:val>0?'#fff':'transparent'
              }}>
                {val>0?val:''}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Grafico incidenza oraria ───────────────────────────────────
function GraficoOrario({ dati, periodo }) {
  const canvasRef = useRef(null)

  const fromTs = periodo==='7gg' ? Date.now()-7*86400000
    : periodo==='30gg' ? Date.now()-30*86400000 : 0
  const filtered = dati.filter(s=>(s.timestamp||0)>=fromTs)

  const counts = Array(24).fill(0)
  filtered.forEach(s => {
    if (!s.bisogno || s.bisogno==='nessuno') return
    const h = parseInt((s.ora||'00').split(':')[0])
    if (h>=0 && h<24) counts[h]++
  })

  const picco = counts.indexOf(Math.max(...counts))

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const W = canvasRef.current.width
    const H = canvasRef.current.height
    ctx.clearRect(0,0,W,H)

    const maxVal = Math.max(...counts, 1)
    const barW = (W-20)/24 - 1
    const chartH = H - 22

    counts.forEach((n,i) => {
      const x = 10 + i*((W-20)/24)
      const barH = (n/maxVal)*chartH*0.9
      const y = chartH - barH
      const isPicco = i===picco && n>0
      ctx.fillStyle = isPicco ? '#F7295A' : n>0 ? '#7B5EA7' : '#f0f1f4'
      ctx.beginPath(); ctx.roundRect(x, y, barW, barH+2, [3,3,0,0]); ctx.fill()
      if (i%3===0) {
        ctx.fillStyle = '#bec1cc'
        ctx.font = '8px -apple-system'
        ctx.textAlign = 'center'
        ctx.fillText(`${i}h`, x+barW/2, H-5)
      }
      if (n>0 && isPicco) {
        ctx.fillStyle = '#F7295A'
        ctx.font = 'bold 9px -apple-system'
        ctx.fillText(n, x+barW/2, y-3)
      }
    })
  }, [dati, periodo])

  return (
    <div>
      {picco>=0 && counts[picco]>0 && (
        <div style={{
          background:'#FEF0F4',borderRadius:'10px',padding:'6px 10px',
          marginBottom:'8px',fontSize:f(11),color:'#F7295A',fontWeight:'700'
        }}>
          Picco massimo: ore {picco}:00 ({counts[picco]} sessioni)
        </div>
      )}
      <canvas ref={canvasRef} width={420} height={90} style={{width:'100%',height:'auto'}}/>
    </div>
  )
}

// ── Grafico incidenti ──────────────────────────────────────────
function GraficoIncidenti({ dati }) {
  const canvasRef = useRef(null)

  // Ultimi 30 giorni: linea giornaliera incidenti
  const giorni30 = []
  for (let i=29; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0)
    const e = new Date(d); e.setHours(23,59,59,999)
    const n = dati.filter(s=>{
      const ts=s.timestamp||0
      return ts>=d.getTime()&&ts<=e.getTime()&&(s.incidentePippi||s.incidenteCacca)
    }).length
    giorni30.push(n)
  }

  const totInc = dati.filter(s=>s.incidentePippi||s.incidenteCacca).length
  const totPippi = dati.filter(s=>s.incidentePippi).length
  const totCacca = dati.filter(s=>s.incidenteCacca).length

  // Giorni puliti vs con incidenti negli ultimi 30gg
  const giorniPuliti = giorni30.filter(n=>n===0).length
  const giorniConInc = giorni30.filter(n=>n>0).length

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const W = canvasRef.current.width
    const H = canvasRef.current.height
    ctx.clearRect(0,0,W,H)

    if (giorni30.every(n=>n===0)) {
      ctx.fillStyle = '#bec1cc'
      ctx.font = '12px -apple-system'
      ctx.textAlign = 'center'
      ctx.fillText('Nessun incidente negli ultimi 30 giorni 🎉', W/2, H/2)
      return
    }

    const maxVal = Math.max(...giorni30, 1)
    const chartH = H - 20
    const stepX = (W-20)/29

    // Area sotto la linea
    ctx.beginPath()
    ctx.moveTo(10, chartH)
    giorni30.forEach((n,i) => {
      const x = 10 + i*stepX
      const y = chartH - (n/maxVal)*chartH*0.85
      if (i===0) ctx.lineTo(x,y)
      else ctx.lineTo(x,y)
    })
    ctx.lineTo(10+28*stepX, chartH)
    ctx.closePath()
    ctx.fillStyle = 'rgba(247,41,90,0.08)'
    ctx.fill()

    // Linea
    ctx.beginPath()
    giorni30.forEach((n,i) => {
      const x = 10 + i*stepX
      const y = chartH - (n/maxVal)*chartH*0.85
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
    })
    ctx.strokeStyle = '#F7295A'
    ctx.lineWidth = 2
    ctx.stroke()

    // Punti
    giorni30.forEach((n,i) => {
      if (n===0) return
      const x = 10 + i*stepX
      const y = chartH - (n/maxVal)*chartH*0.85
      ctx.beginPath()
      ctx.arc(x,y,3,0,Math.PI*2)
      ctx.fillStyle = '#F7295A'
      ctx.fill()
    })

    // Label asse X
    ctx.fillStyle = '#bec1cc'
    ctx.font = '8px -apple-system'
    ctx.textAlign = 'center'
    ctx.fillText('-30gg', 10, H-4)
    ctx.fillText('oggi', 10+28*stepX, H-4)
  }, [dati])

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',marginBottom:'10px'}}>
        {[
          {label:'Tot. incidenti',val:totInc,color:'#F7295A',bg:'#FEF0F4'},
          {label:'Pipì addosso',val:totPippi,color:'#2e84e9',bg:'#EEF3FD'},
          {label:'Cacca addosso',val:totCacca,color:'#FF8C42',bg:'#FFF5EE'},
          {label:'Giorni puliti',val:giorniPuliti,color:'#00BFA6',bg:'#E8FBF8'},
        ].map(({label,val,color,bg},i)=>(
          <div key={i} style={{background:bg,borderRadius:'10px',padding:'7px',textAlign:'center'}}>
            <div style={{fontSize:f(16),fontWeight:'900',color}}>{val}</div>
            <div style={{fontSize:f(8),color:'#7c8088',marginTop:'1px'}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Barra giorni puliti vs con incidenti */}
      <div style={{marginBottom:'10px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
          <span style={{fontSize:f(10),color:'#7c8088'}}>Ultimi 30 giorni</span>
          <span style={{fontSize:f(10),color:'#7c8088'}}>{giorniConInc} con incidenti · {giorniPuliti} puliti</span>
        </div>
        <div style={{height:'8px',borderRadius:'4px',background:'#f3f4f7',overflow:'hidden',display:'flex'}}>
          <div style={{width:`${(giorniConInc/30)*100}%`,background:'#F7295A',transition:'width 0.4s'}}/>
          <div style={{flex:1,background:'#00BFA6'}}/>
        </div>
      </div>

      {/* Linea temporale incidenti */}
      <canvas ref={canvasRef} width={420} height={80} style={{width:'100%',height:'auto'}}/>
    </div>
  )
}

// ── COMPONENTE PRINCIPALE ──────────────────────────────────────
export default function ToiletCharts({ dati, compact=false, titolo=true }) {
  const [tab, setTab] = useState('stats')
  const [periodoH, setPeriodoH] = useState('30gg')

  const oggi = dati.filter(s=>matchOggi(s.data))
  const ieri = dati.filter(s=>matchIeri(s.data))

  const bagnoOggi = oggi.filter(s=>s.bisogno&&s.bisogno!=='nessuno').length
  const incOggi = oggi.filter(s=>s.incidentePippi||s.incidenteCacca).length
  const bagnoIeri = ieri.filter(s=>s.bisogno&&s.bisogno!=='nessuno').length
  const incIeri = ieri.filter(s=>s.incidentePippi||s.incidenteCacca).length

  const totBagno7 = dati.filter(s=>(s.timestamp||0)>=Date.now()-7*86400000&&s.bisogno&&s.bisogno!=='nessuno').length
  const pipi = dati.filter(s=>s.bisogno==='pippi'||s.bisogno==='entrambi').length
  const cacca = dati.filter(s=>s.bisogno==='cacca'||s.bisogno==='entrambi').length
  const autonomia = dati.filter(s=>s.modalita==='caa-auto').length
  const incTot = dati.filter(s=>s.incidentePippi||s.incidenteCacca).length

  if (dati.length===0) return (
    <div style={{textAlign:'center',padding:'24px',color:'#bec1cc'}}>
      <div style={{fontSize:'28px',marginBottom:'8px'}}>🚽</div>
      <div style={{fontSize:f(13)}}>Nessuna sessione registrata</div>
    </div>
  )

  const TABS = [
    {k:'stats',l:'📊 Stats'},
    {k:'7gg',l:'📈 7 giorni'},
    {k:'orario',l:'🕐 Orario'},
    {k:'incidenti',l:'⚠️ Incidenti'},
  ]

  return (
    <div>
      {titolo && (
        <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
          📊 Analisi Toilet Training
        </div>
      )}

      {/* Tab selector */}
      {!compact && (
        <div style={{display:'flex',gap:'5px',marginBottom:'14px',overflowX:'auto',paddingBottom:'2px'}}>
          {TABS.map(({k,l})=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              padding:'6px 12px',borderRadius:'20px',border:'none',cursor:'pointer',
              fontWeight:'700',fontSize:f(11),whiteSpace:'nowrap',fontFamily:'inherit',
              background:tab===k?'#7B5EA7':'#f3f4f7',
              color:tab===k?'#fff':'#7c8088',transition:'all 0.2s'
            }}>{l}</button>
          ))}
        </div>
      )}

      {/* ── TAB STATS ── */}
      {(tab==='stats'||compact) && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',marginBottom:'12px'}}>
            {[
              {label:'Bagno oggi',val:bagnoOggi,color:'#7B5EA7',bg:'#F5F3FF'},
              {label:'Inc. oggi',val:incOggi,color:incOggi>0?'#F7295A':'#00BFA6',bg:incOggi>0?'#FEF0F4':'#E8FBF8'},
              {label:'Bagno ieri',val:bagnoIeri,color:'#7B5EA7',bg:'#F5F3FF'},
              {label:'Inc. ieri',val:incIeri,color:incIeri>0?'#F7295A':'#00BFA6',bg:incIeri>0?'#FEF0F4':'#E8FBF8'},
            ].map(({label,val,color,bg},i)=>(
              <div key={i} style={{background:bg,borderRadius:'12px',padding:'8px 6px',textAlign:'center'}}>
                <div style={{fontSize:f(18),fontWeight:'900',color,lineHeight:1}}>{val}</div>
                <div style={{fontSize:f(8),color:'#7c8088',fontWeight:'700',marginTop:'2px',textTransform:'uppercase',letterSpacing:'0.3px'}}>{label}</div>
              </div>
            ))}
          </div>

          {!compact && (
            <div style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px',marginBottom:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <span style={{fontSize:f(12),fontWeight:'800',color:'#02153f'}}>Andamento 7 giorni</span>
                <div style={{display:'flex',gap:'8px'}}>
                  <span style={{fontSize:f(9),fontWeight:'700',color:'#7B5EA7'}}>■ Bagno</span>
                  <span style={{fontSize:f(9),fontWeight:'700',color:'#F7295A'}}>■ Incidente</span>
                </div>
              </div>
              <Grafico7gg dati={dati}/>
            </div>
          )}

          <div style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px'}}>
            <div style={{fontSize:f(12),fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>Riepilogo totale</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
              {[
                {label:'Bagno 7 giorni',val:totBagno7,color:'#7B5EA7'},
                {label:'Incidenti totali',val:incTot,color:'#F7295A'},
                {label:'Pipì in bagno',val:pipi,color:'#2e84e9'},
                {label:'Cacca in bagno',val:cacca,color:'#FF8C42'},
                {label:'CAA autonoma',val:autonomia,color:'#00BFA6'},
                {label:'Sessioni totali',val:dati.length,color:'#394058'},
              ].map(({label,val,color},i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<4?'1px solid #e8eaf0':'none'}}>
                  <span style={{fontSize:f(11),color:'#394058'}}>{label}</span>
                  <span style={{fontSize:f(14),fontWeight:'900',color}}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7 GIORNI ── */}
      {tab==='7gg' && !compact && (
        <div>
          <div style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px',marginBottom:'12px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <span style={{fontSize:f(12),fontWeight:'800',color:'#02153f'}}>Andamento settimanale</span>
              <div style={{display:'flex',gap:'8px'}}>
                <span style={{fontSize:f(9),fontWeight:'700',color:'#7B5EA7'}}>■ Bagno</span>
                <span style={{fontSize:f(9),fontWeight:'700',color:'#F7295A'}}>■ Incidente</span>
              </div>
            </div>
            <Grafico7gg dati={dati}/>
          </div>

          <div style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px'}}>
            <div style={{fontSize:f(12),fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>Dettaglio per giorno</div>
            {[6,5,4,3,2,1,0].map(i=>{
              const d=new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0)
              const e=new Date(d); e.setHours(23,59,59,999)
              const b=dati.filter(s=>(s.timestamp||0)>=d.getTime()&&(s.timestamp||0)<=e.getTime()&&s.bisogno&&s.bisogno!=='nessuno').length
              const inc=dati.filter(s=>(s.timestamp||0)>=d.getTime()&&(s.timestamp||0)<=e.getTime()&&(s.incidentePippi||s.incidenteCacca)).length
              const gg=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'][d.getDay()===0?6:d.getDay()-1]
              const isOggi=i===0
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 0',borderBottom:i>0?'1px solid #e8eaf0':'none'}}>
                  <span style={{fontSize:f(11),fontWeight:isOggi?'800':'600',color:isOggi?'#7B5EA7':'#394058',width:'30px'}}>{isOggi?'Oggi':gg}</span>
                  <div style={{flex:1,display:'flex',gap:'5px'}}>
                    <span style={{fontSize:f(10),padding:'2px 8px',borderRadius:'20px',background:'#F5F3FF',color:'#7B5EA7',fontWeight:'700'}}>{b} bagno</span>
                    {inc>0&&<span style={{fontSize:f(10),padding:'2px 8px',borderRadius:'20px',background:'#FEF0F4',color:'#F7295A',fontWeight:'700'}}>⚠️ {inc} inc.</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB ORARIO ── */}
      {tab==='orario' && !compact && (
        <div>
          <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
            {['7gg','30gg','tutto'].map(p=>(
              <button key={p} onClick={()=>setPeriodoH(p)} style={{
                padding:'5px 12px',borderRadius:'20px',border:'none',cursor:'pointer',
                fontWeight:'700',fontSize:f(11),fontFamily:'inherit',
                background:periodoH===p?'#7B5EA7':'#f3f4f7',
                color:periodoH===p?'#fff':'#7c8088',transition:'all 0.2s'
              }}>{p==='tutto'?'Tutto':p}</button>
            ))}
          </div>

          <div style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px',marginBottom:'12px'}}>
            <div style={{fontSize:f(12),fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>
              📊 Distribuzione oraria sessioni bagno
            </div>
            <GraficoOrario dati={dati} periodo={periodoH}/>
          </div>

          <div style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px'}}>
            <div style={{fontSize:f(12),fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>
              🌡 Heatmap tipo bisogno × ora
            </div>
            <HeatmapOraria dati={dati} periodo={periodoH}/>
          </div>
        </div>
      )}

      {/* ── TAB INCIDENTI ── */}
      {tab==='incidenti' && !compact && (
        <div style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px'}}>
          <div style={{fontSize:f(12),fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>
            ⚠️ Analisi incidenti
          </div>
          <GraficoIncidenti dati={dati}/>
        </div>
      )}

    </div>
  )
}
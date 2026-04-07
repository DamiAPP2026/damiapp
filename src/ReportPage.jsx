import { useState, useEffect, useRef } from 'react'
import { ChevronLeft } from 'lucide-react'
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

export default function ReportPage({ onBack, isDemo, onNavigate }) {
  const [crisi, setCrisi] = useState([])
  const [terapie, setTerapie] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('month')
  const canvasRef = useRef(null)
  const canvasTipiRef = useRef(null)

  useEffect(() => {
    if (isDemo) {
      setCrisi(DEMO_CRISI)
      setTerapie([{id:1},{id:2},{id:3}])
      setLoading(false)
      return
    }
    let loaded = 0
    const check = () => { loaded++; if(loaded>=2) setLoading(false) }
    const u1 = onValue(ref(db,'crises'), snap => { setCrisi(processFirebaseSnap(snap)); check() })
    const u2 = onValue(ref(db,'terapies'), snap => { setTerapie(processFirebaseSnap(snap)); check() })
    return () => { u1(); u2() }
  }, [isDemo])

  const giorniPeriodo = PERIODI.find(p=>p.key===periodo)?.days || 30
  const fromTs = Date.now() - giorniPeriodo * 86400000
  const crisiPeriodo = crisi.filter(c => c.timestamp >= fromTs)

  const tipiCount = {}
  crisiPeriodo.forEach(c => { tipiCount[c.type]=(tipiCount[c.type]||0)+1 })

  const mediaIntensita = crisiPeriodo.length > 0
    ? (crisiPeriodo.reduce((s,c)=>s+(c.intensita||0),0)/crisiPeriodo.length).toFixed(1) : '—'

  const conPerdita = crisiPeriodo.filter(c=>c.perdCoscienza).length

  // Grafico andamento per settimana
  useEffect(() => {
    if (!canvasRef.current || loading) return
    const ctx = canvasRef.current.getContext('2d')
    const W = canvasRef.current.width
    const H = canvasRef.current.height
    ctx.clearRect(0,0,W,H)

    const numWeeks = Math.min(Math.ceil(giorniPeriodo/7), 12)
    const weeks = []
    for (let i=numWeeks-1; i>=0; i--) {
      const start = new Date(); start.setDate(start.getDate()-i*7-6); start.setHours(0,0,0,0)
      const end = new Date(); end.setDate(end.getDate()-i*7); end.setHours(23,59,59,999)
      const count = crisi.filter(c=>c.timestamp>=start.getTime()&&c.timestamp<=end.getTime()).length
      weeks.push({label:`S${numWeeks-i}`,count})
    }

    const max = Math.max(...weeks.map(w=>w.count),1)
    const barW = (W-40)/weeks.length-4
    const chartH = H-30

    weeks.forEach((w,i) => {
      const x = 20+i*((W-40)/weeks.length)
      const barH = (w.count/max)*chartH*0.85
      const y = chartH-barH
      const grad = ctx.createLinearGradient(0,y,0,chartH)
      grad.addColorStop(0,'#2e84e9'); grad.addColorStop(1,'#193f9e')
      ctx.fillStyle = w.count>0 ? grad : '#f0f1f4'
      ctx.beginPath(); ctx.roundRect(x,y,barW,barH+2,[4,4,0,0]); ctx.fill()
      ctx.fillStyle='#bec1cc'; ctx.font='9px -apple-system'; ctx.textAlign='center'
      ctx.fillText(w.label,x+barW/2,H-6)
      if(w.count>0){
        ctx.fillStyle='#02153f'; ctx.font='bold 10px -apple-system'
        ctx.fillText(w.count,x+barW/2,y-4)
      }
    })
  },[crisi,periodo,loading])

  // Grafico tipi (barre orizzontali)
  useEffect(() => {
    if (!canvasTipiRef.current || loading || crisiPeriodo.length===0) return
    const ctx = canvasTipiRef.current.getContext('2d')
    const W = canvasTipiRef.current.width
    const H = canvasTipiRef.current.height
    ctx.clearRect(0,0,W,H)

    const entries = Object.entries(tipiCount).sort((a,b)=>b[1]-a[1])
    const max = Math.max(...entries.map(e=>e[1]),1)
    const rowH = H/entries.length

    entries.forEach(([tipo,count],i) => {
      const color = TIPO_COLORI[tipo]||'#7c8088'
      const y = i*rowH+4
      const barH = rowH-8
      const barW = (count/max)*(W-80)

      // Barra
      ctx.fillStyle = color+'33'
      ctx.beginPath(); ctx.roundRect(70,y,W-80,barH,[4]); ctx.fill()
      ctx.fillStyle = color
      ctx.beginPath(); ctx.roundRect(70,y,barW,barH,[4]); ctx.fill()

      // Label
      const shortLabel = tipo.replace('Crisi ','').substring(0,10)
      ctx.fillStyle='#394058'; ctx.font='bold 10px -apple-system'; ctx.textAlign='right'
      ctx.fillText(shortLabel,65,y+barH/2+4)

      // Numero
      ctx.fillStyle='#fff'; ctx.font='bold 11px -apple-system'; ctx.textAlign='left'
      if(barW>20) ctx.fillText(count,76,y+barH/2+4)
    })
  },[crisiPeriodo,loading])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'12px'}}>📊</div>
        <div style={{fontSize:'14px',color:'#7c8088'}}>Caricamento report...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}
        .report-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="report-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#193f9e,#7B5EA7)',padding:'14px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:'18px',fontWeight:'900',color:'#fff'}}>📊 Report</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.75)'}}>
                {isDemo?'🎭 Dati demo':'Analisi completa'}
              </div>
            </div>
          </div>

          {/* Selezione periodo */}
          <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'2px'}}>
            {PERIODI.map(p=>(
              <button key={p.key} onClick={()=>setPeriodo(p.key)} style={{
                padding:'7px 14px',borderRadius:'20px',border:'none',cursor:'pointer',
                fontWeight:'700',fontSize:'12px',fontFamily:'inherit',whiteSpace:'nowrap',
                background:periodo===p.key?'#fff':'rgba(255,255,255,0.2)',
                color:periodo===p.key?'#193f9e':'#fff',
                transition:'all 0.2s'
              }}>{p.label}</button>
            ))}
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* STATS RAPIDE */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'7px',marginBottom:'10px'}}>
            {[
              {label:'Crisi periodo',val:crisiPeriodo.length,color:'#F7295A'},
              {label:'Media intensità',val:mediaIntensita,color:'#FF8C42'},
              {label:'Con perdita cosc.',val:conPerdita,color:'#7B5EA7'},
            ].map(({label,val,color},i)=>(
              <div key={i} style={{background:'#feffff',borderRadius:'14px',padding:'10px 8px',boxShadow:shSm,textAlign:'center'}}>
                <div style={{fontSize:'22px',fontWeight:'900',color,marginBottom:'2px'}}>{val}</div>
                <div style={{fontSize:'8.5px',color:'#7c8088',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.3px'}}>{label}</div>
              </div>
            ))}
          </div>

          {/* GRAFICO ANDAMENTO */}
          <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
            <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>
              📈 Andamento crisi per settimana
            </div>
            {crisi.length===0
              ? <div style={{textAlign:'center',padding:'20px',color:'#bec1cc',fontSize:'13px'}}>Nessun dato disponibile</div>
              : <canvas ref={canvasRef} width={420} height={130} style={{width:'100%',height:'auto'}}/>
            }
          </div>

          {/* GRAFICO TIPI */}
          {crisiPeriodo.length>0 && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>
                🎯 Distribuzione per tipo
              </div>
              <canvas
                ref={canvasTipiRef}
                width={420}
                height={Object.keys(tipiCount).length*36}
                style={{width:'100%',height:'auto'}}
              />
            </div>
          )}

          {/* DETTAGLIO TIPI */}
          {crisiPeriodo.length>0 && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                📋 Dettaglio per tipo
              </div>
              {Object.entries(tipiCount).sort((a,b)=>b[1]-a[1]).map(([tipo,count])=>{
                const color = TIPO_COLORI[tipo]||'#7c8088'
                const pct = Math.round((count/crisiPeriodo.length)*100)
                return (
                  <div key={tipo} style={{marginBottom:'10px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div style={{width:'10px',height:'10px',borderRadius:'50%',background:color}}/>
                        <span style={{fontSize:'12px',fontWeight:'700',color:'#394058'}}>{tipo}</span>
                      </div>
                      <span style={{fontSize:'12px',color:'#7c8088',fontWeight:'600'}}>{count}x · {pct}%</span>
                    </div>
                    <div style={{height:'6px',borderRadius:'3px',background:'#f3f4f7',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:'3px',width:`${pct}%`,background:color,transition:'width 0.4s'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* RIEPILOGO GENERALE */}
          <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
            <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
              📌 Riepilogo generale
            </div>
            {[
              {label:'Totale crisi registrate',val:crisi.length,color:'#F7295A'},
              {label:'Terapie attive',val:terapie.length,color:'#00BFA6'},
              {label:'Crisi con perdita coscienza',val:crisi.filter(c=>c.perdCoscienza).length,color:'#7B5EA7'},
              {label:'Intensità media (totale)',val:crisi.length>0?(crisi.reduce((s,c)=>s+(c.intensita||0),0)/crisi.length).toFixed(1):'—',color:'#FF8C42'},
            ].map(({label,val,color},i)=>(
              <div key={i} style={{
                display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'10px 0',
                borderBottom:i<3?'1px solid #f0f1f4':'none'
              }}>
                <span style={{fontSize:'12px',color:'#394058',fontWeight:'600'}}>{label}</span>
                <span style={{fontSize:'16px',fontWeight:'900',color}}>{val}</span>
              </div>
            ))}
          </div>

          {crisi.length===0 && (
            <div style={{textAlign:'center',padding:'32px',color:'#bec1cc'}}>
              <div style={{fontSize:'40px',marginBottom:'12px'}}>📊</div>
              <div style={{fontSize:'14px',marginBottom:'4px'}}>Nessuna crisi registrata</div>
              <div style={{fontSize:'12px'}}>I report appariranno qui dopo aver registrato le crisi</div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
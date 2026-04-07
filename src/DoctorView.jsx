import { useState, useEffect, useRef } from 'react'
import { LogOut, AlertTriangle, Pill, FileText, Phone, ChevronRight } from 'lucide-react'
import { db } from './firebase'
import { ref, get } from 'firebase/database'
import { decrypt } from './crypto'

const TIPO_COLORI = {
  'Crisi tonico-cloniche':'#F7295A','Crisi di assenza':'#7B5EA7',
  'Crisi miocloniche':'#FF8C42','Crisi toniche':'#2e84e9',
  'Crisi cloniche':'#00BFA6','Crisi atoniche':'#FFD93D',
}

const PERIODI = [
  {key:'all', label:'Tutto'},
  {key:'week', label:'7g'},
  {key:'month', label:'30g'},
  {key:'3months', label:'3M'},
  {key:'6months', label:'6M'},
  {key:'year', label:'1A'},
]

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

export default function DoctorView({ tokenData, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('month')
  const canvasRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const promises = []
      const perms = tokenData.permissions || {}

      // Crisi — sempre incluse
      promises.push(get(ref(db, 'crises')))
      // Terapie — se permesso
      promises.push(perms.shareTerapie ? get(ref(db, 'terapies')) : Promise.resolve(null))
      // Documenti — se permesso
      promises.push(perms.shareDocuments ? get(ref(db, 'documents')) : Promise.resolve(null))
      // Contatti — se permesso
      promises.push(perms.shareContacts ? get(ref(db, 'contacts')) : Promise.resolve(null))

      const [crisiSnap, terapieSnap, docsSnap, contattiSnap] = await Promise.all(promises)

      function parseSnap(snap) {
        if (!snap) return []
        const val = snap.val()
        if (!val) return []
        return Object.entries(val).map(([k, enc]) => {
          const d = typeof enc === 'object' ? enc : decrypt(enc)
          return d ? {...d, _key:k} : null
        }).filter(Boolean)
      }

      setData({
        crisi: parseSnap(crisiSnap).sort((a,b) => b.timestamp - a.timestamp),
        terapie: parseSnap(terapieSnap).sort((a,b) => (a.orario||'').localeCompare(b.orario||'')),
        documenti: parseSnap(docsSnap),
        contatti: parseSnap(contattiSnap),
      })
    } catch(err) {
      console.error(err)
    }
    setLoading(false)
  }

  function getCrisiPeriodo() {
    if (!data?.crisi) return []
    if (periodo === 'all') return data.crisi
    const days = {week:7,month:30,'3months':90,'6months':180,year:365}[periodo]
    const from = Date.now() - days * 86400000
    return data.crisi.filter(c => c.timestamp >= from)
  }

  const crisiPeriodo = getCrisiPeriodo()
  const tipiCount = {}
  crisiPeriodo.forEach(c => { tipiCount[c.type] = (tipiCount[c.type]||0)+1 })
  const mediaInt = crisiPeriodo.length > 0
    ? (crisiPeriodo.reduce((s,c)=>s+(c.intensita||0),0)/crisiPeriodo.length).toFixed(1)
    : '—'

  // Grafico canvas
  useEffect(() => {
    if (!canvasRef.current || !data) return
    const ctx = canvasRef.current.getContext('2d')
    const W = canvasRef.current.width
    const H = canvasRef.current.height
    ctx.clearRect(0,0,W,H)
    const weeks = []
    for (let i=7; i>=0; i--) {
      const start = new Date(); start.setDate(start.getDate()-i*7-6); start.setHours(0,0,0,0)
      const end = new Date(); end.setDate(end.getDate()-i*7); end.setHours(23,59,59,999)
      const count = (data.crisi||[]).filter(c=>c.timestamp>=start.getTime()&&c.timestamp<=end.getTime()).length
      weeks.push({label:`S${8-i}`,count})
    }
    const max = Math.max(...weeks.map(w=>w.count),1)
    const barW = (W-40)/weeks.length-4
    const chartH = H-30
    weeks.forEach((w,i)=>{
      const x = 20+i*((W-40)/weeks.length)
      const barH = (w.count/max)*chartH*0.85
      const y = chartH-barH
      const grad = ctx.createLinearGradient(0,y,0,chartH)
      grad.addColorStop(0,'#2e84e9'); grad.addColorStop(1,'#193f9e')
      ctx.fillStyle = w.count>0 ? grad : '#f0f1f4'
      ctx.beginPath(); ctx.roundRect(x,y,barW,barH+2,[4,4,0,0]); ctx.fill()
      ctx.fillStyle='#bec1cc'; ctx.font='9px -apple-system'; ctx.textAlign='center'
      ctx.fillText(w.label,x+barW/2,H-6)
      if(w.count>0){ctx.fillStyle='#02153f'; ctx.font='bold 10px -apple-system'; ctx.fillText(w.count,x+barW/2,y-4)}
    })
  },[data,periodo])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'12px'}}>👨‍⚕️</div>
        <div style={{fontSize:'14px',color:'#7c8088'}}>Caricamento dati paziente...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}
        .doc-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:40px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="doc-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#08184c,#193f9e)',padding:'16px 16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <div>
              <div style={{fontSize:'18px',fontWeight:'900',color:'#fff'}}>
                👨‍⚕️ Vista Medico
              </div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginTop:'2px'}}>
                Dr. {tokenData.medicoName} — Sola lettura
              </div>
            </div>
            <button onClick={onLogout} style={{
              display:'flex',alignItems:'center',gap:'6px',
              padding:'8px 14px',borderRadius:'20px',border:'none',
              background:'rgba(255,255,255,0.15)',color:'#fff',
              fontSize:'12px',fontWeight:'700',cursor:'pointer'
            }}>
              <LogOut size={14} color="#fff"/>
              Esci
            </button>
          </div>

          {/* Badge sola lettura */}
          <div style={{
            background:'rgba(255,255,255,0.12)',borderRadius:'12px',
            padding:'8px 12px',display:'flex',alignItems:'center',gap:'8px'
          }}>
            <FileText size={14} color="rgba(255,255,255,0.8)"/>
            <span style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',fontWeight:'600'}}>
              Accesso in sola lettura · Scade: {tokenData.expiresAt ? new Date(tokenData.expiresAt).toLocaleDateString('it-IT') : 'N/D'}
            </span>
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* PERMESSI ATTIVI */}
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
            {[
              {label:'Crisi', color:'#F7295A', bg:'#FEF0F4', always:true},
              {label:'Terapie', color:'#00BFA6', bg:'#E8FBF8', show:tokenData.permissions?.shareTerapie},
              {label:'Documenti', color:'#193f9e', bg:'#EEF3FD', show:tokenData.permissions?.shareDocuments},
              {label:'Contatti', color:'#7B5EA7', bg:'#F5F3FF', show:tokenData.permissions?.shareContacts},
            ].filter(p=>p.always||p.show).map((p,i)=>(
              <span key={i} style={{fontSize:'11px',fontWeight:'700',padding:'4px 10px',borderRadius:'20px',background:p.bg,color:p.color}}>
                ✓ {p.label}
              </span>
            ))}
          </div>

          {/* STATS RAPIDE */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'7px',marginBottom:'10px'}}>
            {[
              {label:'Crisi totali',val:data?.crisi?.length||0,color:'#F7295A'},
              {label:'Questo mese',val:crisiPeriodo.length,color:'#FF8C42'},
              {label:'Media intens.',val:mediaInt,color:'#7B5EA7'},
            ].map(({label,val,color},i)=>(
              <div key={i} style={{background:'#feffff',borderRadius:'14px',padding:'10px 8px',boxShadow:shSm,textAlign:'center'}}>
                <div style={{fontSize:'22px',fontWeight:'900',color,marginBottom:'2px'}}>{val}</div>
                <div style={{fontSize:'9px',color:'#7c8088',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.3px'}}>{label}</div>
              </div>
            ))}
          </div>

          {/* SELEZIONE PERIODO */}
          <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
            <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>
              📊 Andamento crisi
            </div>
            <div style={{display:'flex',gap:'5px',marginBottom:'12px',overflowX:'auto'}}>
              {PERIODI.map(p=>(
                <button key={p.key} onClick={()=>setPeriodo(p.key)} style={{
                  padding:'5px 12px',borderRadius:'20px',border:'none',cursor:'pointer',
                  fontWeight:'700',fontSize:'11px',whiteSpace:'nowrap',fontFamily:'inherit',
                  background:periodo===p.key?'#193f9e':'#f3f4f7',
                  color:periodo===p.key?'#fff':'#7c8088',transition:'all 0.2s'
                }}>{p.label}</button>
              ))}
            </div>
            {(data?.crisi?.length||0) === 0
              ? <div style={{textAlign:'center',padding:'20px',color:'#bec1cc',fontSize:'13px'}}>Nessuna crisi registrata</div>
              : <canvas ref={canvasRef} width={420} height={110} style={{width:'100%',height:'auto'}}/>
            }
          </div>

          {/* DISTRIBUZIONE TIPI */}
          {Object.keys(tipiCount).length > 0 && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                🎯 Distribuzione per tipo
              </div>
              {Object.entries(tipiCount).sort((a,b)=>b[1]-a[1]).map(([tipo,count])=>{
                const color = TIPO_COLORI[tipo]||'#7c8088'
                const pct = Math.round((count/crisiPeriodo.length)*100)
                return (
                  <div key={tipo} style={{marginBottom:'8px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div style={{width:'8px',height:'8px',borderRadius:'50%',background:color}}/>
                        <span style={{fontSize:'12px',fontWeight:'700',color:'#394058'}}>{tipo}</span>
                      </div>
                      <span style={{fontSize:'12px',color:'#7c8088'}}>{count}x · {pct}%</span>
                    </div>
                    <div style={{height:'6px',borderRadius:'3px',background:'#f3f4f7',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:'3px',width:`${pct}%`,background:color}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* LISTA CRISI */}
          {(data?.crisi?.length||0) > 0 && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                📋 Ultime crisi
              </div>
              {(data?.crisi||[]).slice(0,10).map((c,i)=>{
                const color = TIPO_COLORI[c.type]||'#7c8088'
                return (
                  <div key={i} style={{padding:'10px',borderRadius:'12px',marginBottom:'7px',background:'#f3f4f7',border:`1.5px solid ${color}22`}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:color,flexShrink:0}}/>
                      <span style={{fontSize:'13px',fontWeight:'800',color,flex:1}}>{c.type}</span>
                      <span style={{fontSize:'11px',fontWeight:'700',color:'#fff',background:color,padding:'2px 8px',borderRadius:'20px'}}>{c.duration}</span>
                    </div>
                    <div style={{fontSize:'11px',color:'#7c8088',marginBottom:'3px'}}>📅 {c.date}</div>
                    {c.areas?.length>0&&<div style={{fontSize:'11px',color:'#394058',marginBottom:'2px'}}>🎯 {c.areas.join(', ')}</div>}
                    {c.trigger&&c.trigger!=='Nessuno noto'&&<div style={{fontSize:'11px',color:'#394058',marginBottom:'2px'}}>⚡ {c.trigger}</div>}
                    <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginTop:'5px'}}>
                      {c.intensita&&<span style={{fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:c.intensita<=3?'#E8FBF8':c.intensita<=6?'#FFF9E6':'#FEF0F4',color:c.intensita<=3?'#00BFA6':c.intensita<=6?'#FF8C42':'#F7295A'}}>Int. {c.intensita}/10</span>}
                      {c.perdCoscienza&&<span style={{fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#FEF0F4',color:'#F7295A'}}>Perdita coscienza</span>}
                      {c.postCrisi&&<span style={{fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#F5F3FF',color:'#7B5EA7'}}>{c.postCrisi}</span>}
                    </div>
                    {c.note&&<div style={{fontSize:'11px',color:'#7c8088',marginTop:'5px',fontStyle:'italic',borderTop:'1px solid #f0f1f4',paddingTop:'5px'}}>📝 {c.note}</div>}
                  </div>
                )
              })}
            </div>
          )}

          {/* TERAPIE — solo lettura */}
          {tokenData.permissions?.shareTerapie && (data?.terapie?.length||0) > 0 && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                💊 Terapie programmate
              </div>
              {(data?.terapie||[]).map((t,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 0',borderBottom:i<(data.terapie.length-1)?'1px solid #f0f1f4':'none'}}>
                  <Pill size={16} color="#00BFA6"/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'#02153f'}}>{t.nome}</div>
                    <div style={{fontSize:'11px',color:'#7c8088'}}>{t.quantita}{t.note?` · ${t.note}`:''}</div>
                  </div>
                  <span style={{fontSize:'12px',fontWeight:'700',color:'#193f9e'}}>{t.orario}</span>
                </div>
              ))}
            </div>
          )}

          {/* CONTATTI — solo lettura */}
          {tokenData.permissions?.shareContacts && (data?.contatti?.length||0) > 0 && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                📞 Contatti
              </div>
              {(data?.contatti||[]).map((c,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 0',borderBottom:i<(data.contatti.length-1)?'1px solid #f0f1f4':'none'}}>
                  <Phone size={16} color="#F7295A"/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'#02153f'}}>{c.nome}</div>
                    <div style={{fontSize:'11px',color:'#7c8088'}}>{c.ruolo||''}</div>
                  </div>
                  <span style={{fontSize:'12px',color:'#7c8088'}}>{c.telefono}</span>
                </div>
              ))}
            </div>
          )}

          {/* NESSUN DATO */}
          {(data?.crisi?.length||0) === 0 && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh}}>
              <div style={{fontSize:'32px',marginBottom:'12px'}}>📋</div>
              <div style={{fontSize:'14px',color:'#7c8088'}}>Nessun dato disponibile</div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
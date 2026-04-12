import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, CreditCard, TrendingUp } from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const CATEGORIE = [
  { key:'neurologo',  label:'Neurologo',   color:'#F7295A', bg:'#FEF0F4' },
  { key:'terapista',  label:'Terapista',   color:'#7B5EA7', bg:'#F5F3FF' },
  { key:'farmacia',   label:'Farmacia',    color:'#00BFA6', bg:'#E8FBF8' },
  { key:'pediatra',   label:'Pediatra',    color:'#2e84e9', bg:'#EEF3FD' },
  { key:'analisi',    label:'Analisi',     color:'#FF8C42', bg:'#FFF5EE' },
  { key:'altro',      label:'Altro',       color:'#394058', bg:'#f3f4f7' },
]

function getCat(key) { return CATEGORIE.find(c=>c.key===key) || CATEGORIE[CATEGORIE.length-1] }

const oggi = new Date()
const DEMO_PAGAMENTI = [
  { id:1, terapeuta:'Dr. Rossi — Neurologo',  importo:150, data:`${oggi.getFullYear()}-${String(oggi.getMonth()+1).padStart(2,'0')}-05`, categoria:'neurologo', note:'Visita controllo', _firebaseKey:'dp1' },
  { id:2, terapeuta:'Centro Terapie',          importo:80,  data:`${oggi.getFullYear()}-${String(oggi.getMonth()+1).padStart(2,'0')}-10`, categoria:'terapista', note:'Seduta logopedia', _firebaseKey:'dp2' },
  { id:3, terapeuta:'Farmacia Centrale',       importo:65,  data:`${oggi.getFullYear()}-${String(oggi.getMonth()+1).padStart(2,'0')}-12`, categoria:'farmacia',  note:'Keppra 500mg x3', _firebaseKey:'dp3' },
  { id:4, terapeuta:'Centro Terapie',          importo:80,  data:`${oggi.getFullYear()}-${String(oggi.getMonth()).padStart(2,'0')}-20`,   categoria:'terapista', note:'Seduta logopedia', _firebaseKey:'dp4' },
  { id:5, terapeuta:'Dr.ssa Bianchi — Pediatra',importo:90, data:`${oggi.getFullYear()}-${String(oggi.getMonth()).padStart(2,'0')}-15`,   categoria:'pediatra',  note:'',                _firebaseKey:'dp5' },
  { id:6, terapeuta:'Farmacia Centrale',       importo:55,  data:`${oggi.getFullYear()}-${String(oggi.getMonth()).padStart(2,'0')}-08`,   categoria:'farmacia',  note:'Depakine',         _firebaseKey:'dp6' },
]

const EMPTY_FORM = { terapeuta:'', importo:'', data: new Date().toISOString().split('T')[0], categoria:'terapista', note:'' }

// Grafico barre per categorie
function GraficoCategorie({ pagamenti }) {
  const canvasRef = useRef(null)
  const totPerCat = CATEGORIE.map(c => ({
    ...c,
    tot: pagamenti.filter(p=>p.categoria===c.key).reduce((s,p)=>s+Number(p.importo||0),0)
  })).filter(c=>c.tot>0).sort((a,b)=>b.tot-a.tot)

  useEffect(()=>{
    if(!canvasRef.current||totPerCat.length===0) return
    const ctx=canvasRef.current.getContext('2d')
    const W=canvasRef.current.width, H=canvasRef.current.height
    ctx.clearRect(0,0,W,H)
    const max=Math.max(...totPerCat.map(c=>c.tot),1)
    const pL=10,pR=10,pT=10,pB=30
    const barW=(W-pL-pR)/totPerCat.length-6
    const plotH=H-pT-pB
    totPerCat.forEach((c,i)=>{
      const x=pL+i*(barW+6)
      const bH=Math.max(6,(c.tot/max)*plotH*0.9)
      const y=pT+plotH-bH
      ctx.fillStyle=c.color
      ctx.beginPath();ctx.roundRect(x,y,barW,bH,[8,8,0,0]);ctx.fill()
      ctx.fillStyle='#fff';ctx.font=`bold ${f(9)} -apple-system`;ctx.textAlign='center'
      if(bH>18) ctx.fillText(`€${c.tot}`,x+barW/2,y+bH/2+4)
      else { ctx.fillStyle=c.color;ctx.font=`bold ${f(9)} -apple-system`;ctx.fillText(`€${c.tot}`,x+barW/2,y-4) }
      ctx.fillStyle='#7c8088';ctx.font=`bold ${f(9)} -apple-system`;ctx.textAlign='center'
      ctx.fillText(c.label.slice(0,7),x+barW/2,H-5)
    })
  },[pagamenti])

  if(totPerCat.length===0) return null
  return <canvas ref={canvasRef} width={440} height={110} style={{width:'100%',height:'auto'}}/>
}

export default function PagamentiPage({ onBack, isDemo }) {
  const [pagamenti, setPagamenti]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [sezione, setSezione]       = useState('lista') // lista | grafici
  const [saved, setSaved]           = useState(false)
  const [filtroMese, setFiltroMese] = useState('tutti')

  useEffect(()=>{
    if(isDemo){setPagamenti(DEMO_PAGAMENTI);setLoading(false);return}
    const r=ref(db,'payments')
    const unsub=onValue(r,snap=>{
      setPagamenti(processFirebaseSnap(snap).sort((a,b)=>new Date(b.data)-new Date(a.data)))
      setLoading(false)
    })
    return()=>unsub()
  },[isDemo])

  function apriNuovo(){ setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true) }
  function apriModifica(p){ setForm({terapeuta:p.terapeuta||'',importo:String(p.importo||''),data:p.data||'',categoria:p.categoria||'altro',note:p.note||''}); setEditTarget(p); setShowForm(true) }

  function handleSalva(){
    if(!form.terapeuta.trim()){alert('Inserisci il nome del terapeuta/servizio');return}
    if(!form.importo||isNaN(Number(form.importo))){alert('Inserisci un importo valido');return}
    const pag={id:editTarget?.id||Date.now(),...form,importo:Number(form.importo)}
    if(!isDemo){
      if(editTarget?._firebaseKey) set(ref(db,`payments/${editTarget._firebaseKey}`),encrypt(pag))
      else push(ref(db,'payments'),encrypt(pag))
    } else {
      if(editTarget) setPagamenti(prev=>prev.map(p=>p.id===editTarget.id?{...pag,_firebaseKey:p._firebaseKey}:p))
      else setPagamenti(prev=>[{...pag,_firebaseKey:`demo_${Date.now()}`},...prev])
    }
    setSaved(true)
    setTimeout(()=>{setSaved(false);setShowForm(false)},1200)
  }

  function handleElimina(p){
    if(!window.confirm(`Eliminare questo pagamento?`))return
    if(!isDemo&&p._firebaseKey) remove(ref(db,`payments/${p._firebaseKey}`))
    else setPagamenti(prev=>prev.filter(x=>x.id!==p.id))
  }

  // Mesi disponibili
  const mesiDisponibili = [...new Set(pagamenti.map(p=>(p.data||'').slice(0,7)))].sort().reverse()

  const pagFiltrati = filtroMese==='tutti' ? pagamenti : pagamenti.filter(p=>(p.data||'').startsWith(filtroMese))
  const totale      = pagFiltrati.reduce((s,p)=>s+Number(p.importo||0),0)
  const totMese     = pagamenti.filter(p=>{const n=new Date();return(p.data||'').startsWith(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`)}).reduce((s,p)=>s+Number(p.importo||0),0)
  const totAnno     = pagamenti.filter(p=>(p.data||'').startsWith(String(new Date().getFullYear()))).reduce((s,p)=>s+Number(p.importo||0),0)

  const fmtData = (d) => { if(!d)return ''; const p=d.split('-'); return `${p[2]}/${p[1]}/${p[0]}` }
  const fmtMese = (m) => { if(!m)return ''; const [y,mo]=m.split('-'); const nomi=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']; return `${nomi[parseInt(mo)-1]} ${y}` }

  const inStyle = {width:'100%',padding:'11px 12px',borderRadius:'12px',border:'1.5px solid #f0f1f4',fontSize:f(13),color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}
  const lbStyle = {fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'5px',display:'block'}

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}><CreditCard size={36} color="#bec1cc" style={{margin:'0 auto 10px',display:'block'}}/><div style={{fontSize:f(13),color:'#bec1cc'}}>Caricamento...</div></div>
    </div>
  )

  return(
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.pg-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="pg-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#00BFA6,#193f9e)',padding:'14px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>💳 Pagamenti</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                {isDemo?'🎭 Dati demo':'Spese mediche e terapie'}
              </div>
            </div>
            <button onClick={apriNuovo} style={{marginLeft:'auto',width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <Plus size={20} color="#fff"/>
            </button>
          </div>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
            {[
              {label:'Questo mese',val:`€${totMese}`},
              {label:"Quest'anno",  val:`€${totAnno}`},
              {label:'N. pagamenti',val:pagamenti.length},
            ].map(({label,val},i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:i<2?f(16):f(20),fontWeight:'900',color:'#fff'}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#f3f4f7',margin:'12px 12px 0',borderRadius:'12px',padding:'3px',gap:'3px'}}>
          {[{k:'lista',l:'📋 Lista'},{k:'grafici',l:'📊 Grafici'}].map(({k,l})=>(
            <button key={k} onClick={()=>setSezione(k)} style={{padding:'9px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:sezione===k?'#feffff':'transparent',color:sezione===k?'#00BFA6':'#7c8088',boxShadow:sezione===k?'0 2px 8px rgba(2,21,63,0.10)':'none',transition:'all 0.2s'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:'12px'}}>

          {sezione==='lista' && (
            <>
              {/* Filtro mese */}
              <div style={{overflowX:'auto',marginBottom:'10px'}}>
                <div style={{display:'flex',gap:'6px',paddingBottom:'4px',width:'max-content'}}>
                  <button onClick={()=>setFiltroMese('tutti')} style={{padding:'6px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:filtroMese==='tutti'?'#193f9e':'#feffff',color:filtroMese==='tutti'?'#fff':'#7c8088',whiteSpace:'nowrap'}}>
                    Tutti — €{pagamenti.reduce((s,p)=>s+Number(p.importo||0),0)}
                  </button>
                  {mesiDisponibili.map(m=>(
                    <button key={m} onClick={()=>setFiltroMese(m)} style={{padding:'6px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:filtroMese===m?'#00BFA6':'#feffff',color:filtroMese===m?'#fff':'#7c8088',whiteSpace:'nowrap'}}>
                      {fmtMese(m)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Totale filtrato */}
              {filtroMese!=='tutti'&&(
                <div style={{background:'#feffff',borderRadius:'14px',padding:'10px 14px',marginBottom:'10px',boxShadow:shSm,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:f(12),fontWeight:'700',color:'#7c8088'}}>{fmtMese(filtroMese)}</span>
                  <span style={{fontSize:f(18),fontWeight:'900',color:'#00BFA6'}}>€{totale}</span>
                </div>
              )}

              {/* Lista */}
              {pagFiltrati.length===0 ? (
                <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh}}>
                  <CreditCard size={40} color="#bec1cc" style={{margin:'0 auto 12px',display:'block'}}/>
                  <div style={{fontSize:f(13),color:'#7c8088',marginBottom:'4px'}}>Nessun pagamento</div>
                  <div style={{fontSize:f(12),color:'#bec1cc'}}>Aggiungi il primo con il +</div>
                </div>
              ) : (
                pagFiltrati.map((p,i)=>{
                  const cat=getCat(p.categoria)
                  return(
                    <div key={p.id||i} style={{background:'#feffff',borderRadius:'16px',padding:'12px 14px',marginBottom:'8px',boxShadow:shSm,display:'flex',alignItems:'center',gap:'12px'}}>
                      <div style={{width:'42px',height:'42px',borderRadius:'12px',background:cat.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <CreditCard size={18} color="#fff"/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.terapeuta}</div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'3px'}}>
                          <span style={{fontSize:f(10),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:cat.bg,color:cat.color}}>{cat.label}</span>
                          <span style={{fontSize:f(10),color:'#bec1cc'}}>{fmtData(p.data)}</span>
                        </div>
                        {p.note&&<div style={{fontSize:f(10),color:'#bec1cc',marginTop:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>📝 {p.note}</div>}
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:f(16),fontWeight:'900',color:'#193f9e',marginBottom:'4px'}}>€{Number(p.importo||0).toFixed(2)}</div>
                        <div style={{display:'flex',gap:'4px'}}>
                          <button onClick={()=>apriModifica(p)} style={{width:'28px',height:'28px',borderRadius:'50%',background:'#EEF3FD',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Edit2 size={12} color="#193f9e"/>
                          </button>
                          <button onClick={()=>handleElimina(p)} style={{width:'28px',height:'28px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Trash2 size={12} color="#F7295A"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </>
          )}

          {sezione==='grafici' && (
            <>
              {/* Spese per categoria */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
                  <TrendingUp size={15} color="#00BFA6"/> Spese per categoria (totale)
                </div>
                <GraficoCategorie pagamenti={pagamenti}/>
                {CATEGORIE.map(c=>{
                  const tot=pagamenti.filter(p=>p.categoria===c.key).reduce((s,p)=>s+Number(p.importo||0),0)
                  if(tot===0) return null
                  const pct=Math.round((tot/pagamenti.reduce((s,p)=>s+Number(p.importo||0),1))*100)
                  return(
                    <div key={c.key} style={{marginBottom:'7px',marginTop:'8px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                        <span style={{fontSize:f(12),fontWeight:'700',color:'#394058'}}>{c.label}</span>
                        <span style={{fontSize:f(11),color:'#7c8088'}}>€{tot} · {pct}%</span>
                      </div>
                      <div style={{height:'6px',borderRadius:'3px',background:'#f3f4f7',overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:'3px',width:`${pct}%`,background:c.color}}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Riepilogo mensile */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>📅 Per mese</div>
                {mesiDisponibili.length===0
                  ? <div style={{textAlign:'center',padding:'16px',color:'#bec1cc',fontSize:f(12)}}>Nessun dato</div>
                  : mesiDisponibili.map(m=>{
                    const tot=pagamenti.filter(p=>(p.data||'').startsWith(m)).reduce((s,p)=>s+Number(p.importo||0),0)
                    const n=pagamenti.filter(p=>(p.data||'').startsWith(m)).length
                    return(
                      <div key={m} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid #f0f1f4'}}>
                        <div>
                          <div style={{fontSize:f(13),fontWeight:'700',color:'#02153f'}}>{fmtMese(m)}</div>
                          <div style={{fontSize:f(10),color:'#bec1cc'}}>{n} pagamenti</div>
                        </div>
                        <span style={{fontSize:f(16),fontWeight:'900',color:'#193f9e'}}>€{tot}</span>
                      </div>
                    )
                  })
                }
              </div>
            </>
          )}
        </div>

        {/* MODAL FORM */}
        {showForm&&(
          <div style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.5)',zIndex:2000,display:'flex',alignItems:'flex-end',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
            <div style={{background:'#feffff',borderRadius:'24px 24px 0 0',padding:'20px',width:'100%',maxWidth:'480px',maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <span style={{fontSize:f(16),fontWeight:'900',color:'#02153f'}}>{editTarget?'Modifica pagamento':'Nuovo pagamento'}</span>
                <button onClick={()=>setShowForm(false)} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <X size={16} color="#7c8088"/>
                </button>
              </div>

              <label style={lbStyle}>Terapeuta / Servizio *</label>
              <input value={form.terapeuta} onChange={e=>setForm(p=>({...p,terapeuta:e.target.value}))} placeholder="Es: Dr. Rossi — Neurologo" style={{...inStyle,marginBottom:'12px'}}
                onFocus={e=>e.target.style.borderColor='#00BFA6'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div>
                  <label style={lbStyle}>Importo (€) *</label>
                  <input value={form.importo} onChange={e=>setForm(p=>({...p,importo:e.target.value}))} placeholder="0.00" type="number" min="0" step="0.01" style={inStyle}
                    onFocus={e=>e.target.style.borderColor='#00BFA6'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
                <div>
                  <label style={lbStyle}>Data</label>
                  <input value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))} type="date" style={inStyle}
                    onFocus={e=>e.target.style.borderColor='#00BFA6'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
              </div>

              <label style={lbStyle}>Categoria</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'12px'}}>
                {CATEGORIE.map(c=>(
                  <div key={c.key} onClick={()=>setForm(p=>({...p,categoria:c.key}))} style={{padding:'8px',borderRadius:'10px',cursor:'pointer',textAlign:'center',border:`2px solid ${form.categoria===c.key?c.color:'#f0f1f4'}`,background:form.categoria===c.key?c.bg:'#feffff',transition:'all 0.15s'}}>
                    <div style={{fontSize:f(11),fontWeight:'700',color:form.categoria===c.key?c.color:'#394058'}}>{c.label}</div>
                  </div>
                ))}
              </div>

              <label style={lbStyle}>Note</label>
              <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Es: Keppra 500mg x3..." rows={2} style={{...inStyle,resize:'none',marginBottom:'16px'}}
                onFocus={e=>e.target.style.borderColor='#00BFA6'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              <button onClick={handleSalva} style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#00BFA6,#193f9e)',boxShadow:'0 6px 20px rgba(0,191,166,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.3s'}}>
                {saved?<><Check size={18} color="#fff"/> Salvato!</>:<>{editTarget?'Aggiorna':'Aggiungi pagamento'}</>}
              </button>
              {isDemo&&<div style={{textAlign:'center',marginTop:'10px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Demo — non salvato su Firebase</div>}
            </div>
          </div>
        )}

      </div>
    </>
  )
}

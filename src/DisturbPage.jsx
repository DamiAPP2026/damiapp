// DisturbPage.jsx — patch v2
// Modifiche:
// 1. Aggiunta `desc` breve in grigio sotto ogni tipo di disturbo (// ← MODIFICATO)
// 2. Timer via Web Worker + Wake Lock (da patch precedente)

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Check, Play, Square, RotateCcw, Edit2, Trash2, X, Save } from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'
import { useTimerWorker } from './useTimerWorker'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

// ← MODIFICATO: aggiunta proprietà `desc`
const TIPI_DISTURBO = [
  { key:'tremore',    label:'Tremore',    color:'#FF8C42', desc:'oscillazioni ritmiche involontarie' },
  { key:'distonia',   label:'Distonia',   color:'#7B5EA7', desc:'contrazioni muscolari sostenute' },
  { key:'corea',      label:'Corea',      color:'#2e84e9', desc:'movimenti bruschi irregolari' },
  { key:'tic',        label:'Tic',        color:'#00BFA6', desc:'movimenti/suoni ripetitivi' },
  { key:'spasmo',     label:'Spasmo',     color:'#F7295A', desc:'contrazione improvvisa intensa' },
  { key:'braccio_dx', label:'Braccio Dx', color:'#193f9e', desc:'disturbo arto superiore destro' },
  { key:'braccio_sx', label:'Braccio Sx', color:'#8e44ad', desc:'disturbo arto superiore sinistro' },
  { key:'scialorrea', label:'Scialorrea', color:'#e67e22', desc:'salivazione eccessiva incontrollata' },
  { key:'altro',      label:'Altro',      color:'#394058', desc:'disturbo non classificato sopra' },
]

const INTENSITA_LABELS = ['','Lieve','Lieve','Lieve','Moderata','Moderata','Moderata','Intensa','Intensa','Severa','Severa']

const DEMO_LOG = [
  { id:1, timestamp:Date.now()-3600000,    data:'12/04/2026', ora:'08:15', tipi:['tremore'],               intensita:4, durataSecondi:125, nota:'' },
  { id:2, timestamp:Date.now()-86400000,   data:'11/04/2026', ora:'14:30', tipi:['distonia','braccio_sx'], intensita:7, durataSecondi:340, nota:'Dopo pasto' },
  { id:3, timestamp:Date.now()-2*86400000, data:'10/04/2026', ora:'09:00', tipi:['spasmo'],                intensita:6, durataSecondi:45,  nota:'' },
  { id:4, timestamp:Date.now()-3*86400000, data:'09/04/2026', ora:'20:10', tipi:['tremore','scialorrea'],  intensita:3, durataSecondi:200, nota:'' },
  { id:5, timestamp:Date.now()-5*86400000, data:'07/04/2026', ora:'11:45', tipi:['tic'],                   intensita:2, durataSecondi:30,  nota:'' },
]

function fmt(s) {
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60
  if(h>0) return `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`
  if(m>0) return `${m}m ${String(sec).padStart(2,'0')}s`
  return `${sec}s`
}
function fmtShort(s) {
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60
  if(h>0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}
function getTipiLabel(tipi=[]) {
  return tipi.map(k=>TIPI_DISTURBO.find(t=>t.key===k)?.label||k).join(' + ')
}
function getColorePrincipale(tipi=[]) {
  return TIPI_DISTURBO.find(t=>t.key===tipi[0])?.color||'#394058'
}
function toISO(data='') {
  if(data.includes('-')) return data
  const [dd,mm,yyyy]=data.split('/'); return `${yyyy}-${mm}-${dd}`
}
function toITA(data='') {
  if(data.includes('/')) return data
  const [yyyy,mm,dd]=data.split('-'); return `${dd}/${mm}/${yyyy}`
}

function CalendarioMese({ log, mese, setMese }) {
  const mesiNomi=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
  const primoGiorno=new Date(mese.getFullYear(),mese.getMonth(),1).getDay()
  const offset=primoGiorno===0?6:primoGiorno-1
  const giorniMese=new Date(mese.getFullYear(),mese.getMonth()+1,0).getDate()
  const byDay={}
  log.forEach(e=>{
    const d=new Date(e.timestamp)
    if(d.getMonth()===mese.getMonth()&&d.getFullYear()===mese.getFullYear())
      byDay[d.getDate()]=(byDay[d.getDate()]||0)+1
  })
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
        <button onClick={()=>setMese(new Date(mese.getFullYear(),mese.getMonth()-1,1))} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',fontSize:'16px'}}>‹</button>
        <span style={{fontSize:f(13),fontWeight:'800',color:'#02153f'}}>{mesiNomi[mese.getMonth()]} {mese.getFullYear()}</span>
        <button onClick={()=>setMese(new Date(mese.getFullYear(),mese.getMonth()+1,1))} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',fontSize:'16px'}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px'}}>
        {['L','M','M','G','V','S','D'].map((g,i)=><div key={i} style={{textAlign:'center',fontSize:f(9),fontWeight:'700',color:'#bec1cc',padding:'3px 0'}}>{g}</div>)}
        {[...Array(offset)].map((_,i)=><div key={`e${i}`}/>)}
        {[...Array(giorniMese)].map((_,i)=>{
          const d=i+1,n=byDay[d]||0
          let bg='#f3f4f7',color='#7c8088'
          if(n===1){bg='#FFF5EE';color='#FF8C42'}
          else if(n>=2&&n<=3){bg='#FF8C42';color='#fff'}
          else if(n>3){bg='#F7295A';color='#fff'}
          return(
            <div key={d} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'8px',background:bg}}>
              <span style={{fontSize:f(10),fontWeight:'700',color}}>{d}</span>
              {n>0&&<span style={{fontSize:'7px',color,marginTop:'1px'}}>×{n}</span>}
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:'10px',marginTop:'10px',flexWrap:'wrap'}}>
        {[{bg:'#f3f4f7',c:'#7c8088',l:'0'},{bg:'#FFF5EE',c:'#FF8C42',l:'1'},{bg:'#FF8C42',c:'#fff',l:'2-3'},{bg:'#F7295A',c:'#fff',l:'4+'}].map(({bg,c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <div style={{width:'12px',height:'12px',borderRadius:'3px',background:bg,border:'1px solid #f0f1f4'}}/>
            <span style={{fontSize:f(9),color:'#7c8088'}}>{l} episodi</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GraficoOrario({ log }) {
  const canvasRef=useRef(null)
  const counts=Array(24).fill(0)
  log.forEach(e=>{ const h=parseInt((e.ora||'0').split(':')[0]); if(h>=0&&h<24)counts[h]++ })
  const picco=counts.indexOf(Math.max(...counts))
  useEffect(()=>{
    if(!canvasRef.current)return
    const ctx=canvasRef.current.getContext('2d')
    const W=canvasRef.current.width,H=canvasRef.current.height
    ctx.clearRect(0,0,W,H)
    const maxV=Math.max(...counts,1),barW=(W-20)/24-1,chartH=H-22
    counts.forEach((n,i)=>{
      const x=10+i*((W-20)/24),barH=(n/maxV)*chartH*0.9,y=chartH-barH
      ctx.fillStyle=(i===picco&&n>0)?'#F7295A':n>0?'#FF8C42':'#f0f1f4'
      ctx.beginPath();ctx.roundRect(x,y,barW,barH+2,[3,3,0,0]);ctx.fill()
      if(i%6===0){ctx.fillStyle='#bec1cc';ctx.font='8px -apple-system';ctx.textAlign='center';ctx.fillText(`${i}h`,x+barW/2,H-5)}
    })
  },[log])
  return(
    <div>
      {picco>=0&&counts[picco]>0&&(
        <div style={{background:'#FEF0F4',borderRadius:'10px',padding:'6px 10px',marginBottom:'8px',fontSize:f(11),color:'#F7295A',fontWeight:'700'}}>
          Picco: ore {picco}:00 ({counts[picco]} episodi)
        </div>
      )}
      <canvas ref={canvasRef} width={420} height={90} style={{width:'100%',height:'auto'}}/>
    </div>
  )
}

function DurataManuale({ value, onChange }) {
  const h=Math.floor(value/3600), m=Math.floor((value%3600)/60), s=value%60
  function update(nh,nm,ns){onChange(Math.max(0,nh)*3600+Math.max(0,nm)*60+Math.max(0,ns))}
  const fs={width:'100%',padding:'14px 4px',borderRadius:'14px',border:'2px solid #f0f1f4',fontSize:f(22),fontWeight:'900',color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',textAlign:'center',boxSizing:'border-box',MozAppearance:'textfield'}
  const ls={fontSize:f(10),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',textAlign:'center',marginTop:'5px'}
  return(
    <div style={{display:'grid',gridTemplateColumns:'1fr 16px 1fr 16px 1fr',alignItems:'center',gap:'4px'}}>
      <div>
        <input type="number" min="0" max="23" value={h||''} placeholder="0" onChange={e=>update(parseInt(e.target.value)||0,m,s)} style={fs}
          onFocus={e=>{e.target.style.borderColor='#FF8C42';e.target.select()}} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
        <div style={ls}>ore</div>
      </div>
      <div style={{textAlign:'center',fontSize:f(22),fontWeight:'900',color:'#bec1cc',paddingBottom:'22px'}}>:</div>
      <div>
        <input type="number" min="0" max="59" value={m||''} placeholder="0" onChange={e=>update(h,Math.min(59,parseInt(e.target.value)||0),s)} style={fs}
          onFocus={e=>{e.target.style.borderColor='#FF8C42';e.target.select()}} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
        <div style={ls}>min</div>
      </div>
      <div style={{textAlign:'center',fontSize:f(22),fontWeight:'900',color:'#bec1cc',paddingBottom:'22px'}}>:</div>
      <div>
        <input type="number" min="0" max="59" value={s||''} placeholder="0" onChange={e=>update(h,m,Math.min(59,parseInt(e.target.value)||0))} style={fs}
          onFocus={e=>{e.target.style.borderColor='#FF8C42';e.target.select()}} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
        <div style={ls}>sec</div>
      </div>
    </div>
  )
}

function emptyForm() {
  const now=new Date()
  return { tipi:[], data:now.toISOString().split('T')[0], ora:now.toTimeString().slice(0,5), intensita:5, nota:'', durataSecondi:0, usaTimer:true }
}

export default function DisturbPage({ onBack, isDemo }) {
  const [sezione,setSezione]       = useState('form')
  const [mese,setMese]             = useState(new Date())
  const [log,setLog]               = useState([])
  const [loading,setLoading]       = useState(true)
  const [form,setForm]             = useState(emptyForm())
  const [editTarget,setEditTarget] = useState(null)
  const [saved,setSaved]           = useState(false)

  const { timerSec, running, startTimer, stopTimer, resetTimer } = useTimerWorker(0)

  useEffect(()=>{
    if(isDemo){setLog(DEMO_LOG);setLoading(false);return}
    const r=ref(db,'disturbi_movimento')
    const u=onValue(r,snap=>{setLog(processFirebaseSnap(snap).sort((a,b)=>b.timestamp-a.timestamp));setLoading(false)})
    return()=>u()
  },[isDemo])

  useEffect(()=>{
    if(form.usaTimer) setForm(p=>({...p,durataSecondi:timerSec}))
  },[timerSec])

  function toggleTipo(key){setForm(p=>({...p,tipi:p.tipi.includes(key)?p.tipi.filter(k=>k!==key):[...p.tipi,key]}))}

  function apriModifica(ep){
    setForm({
      tipi:          ep.tipi||(ep.tipo?[ep.tipo]:[]),
      data:          toISO(ep.data||''),
      ora:           ep.ora||'',
      intensita:     ep.intensita||5,
      nota:          ep.nota||ep.note||'',
      durataSecondi: ep.durataSecondi||0,
      usaTimer:      false,
    })
    resetTimer()
    setEditTarget(ep)
    setSezione('form')
    window.scrollTo({top:0,behavior:'smooth'})
  }

  function annullaModifica(){
    setEditTarget(null)
    setForm(emptyForm())
    resetTimer()
  }

  async function handleSave(){
    if(form.tipi.length===0){alert('Seleziona almeno un tipo di disturbo');return}
    if(form.durataSecondi===0){alert('Inserisci la durata (usa il timer o i campi)');return}
    await stopTimer()
    const episodio={
      id:            editTarget?.id||Date.now(),
      timestamp:     editTarget?.timestamp||Date.now(),
      data:          toITA(form.data),
      ora:           form.ora,
      tipi:          form.tipi,
      tipo:          form.tipi[0]||'altro',
      intensita:     form.intensita,
      durataSecondi: form.durataSecondi,
      nota:          form.nota,
    }
    if(!isDemo){
      if(editTarget?._firebaseKey) set(ref(db,`disturbi_movimento/${editTarget._firebaseKey}`),encrypt(episodio))
      else push(ref(db,'disturbi_movimento'),encrypt(episodio))
    } else {
      if(editTarget) setLog(prev=>prev.map(e=>e.id===editTarget.id?{...episodio,_firebaseKey:e._firebaseKey}:e))
      else setLog(prev=>[episodio,...prev])
    }
    setSaved(true)
    setTimeout(()=>{
      setSaved(false); setEditTarget(null); setForm(emptyForm()); resetTimer()
    },1400)
  }

  function handleElimina(ep){
    if(!window.confirm('Eliminare questo episodio?'))return
    if(!isDemo&&ep._firebaseKey) remove(ref(db,`disturbi_movimento/${ep._firebaseKey}`))
    else setLog(prev=>prev.filter(e=>e.id!==ep.id))
  }

  const oggi7    = log.filter(e=>Date.now()-e.timestamp<7*86400000).length
  const mediaInt = log.length>0?(log.reduce((s,e)=>s+(e.intensita||0),0)/log.length).toFixed(1):'—'
  const epMese   = log.filter(e=>{const d=new Date(e.timestamp);return d.getMonth()===mese.getMonth()&&d.getFullYear()===mese.getFullYear()})

  const inStyle={width:'100%',padding:'11px 12px',borderRadius:'12px',border:'1.5px solid #f0f1f4',fontSize:f(13),color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}
  const lbStyle={fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'6px',display:'block'}

  function EpisodioCard({e}){
    const colore=getColorePrincipale(e.tipi||[e.tipo])
    return(
      <div style={{padding:'10px',borderRadius:'12px',marginBottom:'7px',background:'#f3f4f7',borderLeft:`3px solid ${colore}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'4px'}}>
          <div>
            <div style={{fontSize:f(13),fontWeight:'800',color:colore}}>{getTipiLabel(e.tipi||[e.tipo])}</div>
            <div style={{fontSize:f(10),color:'#bec1cc',marginTop:'2px'}}>{e.data} · {e.ora}</div>
          </div>
          <div style={{display:'flex',gap:'5px',flexShrink:0}}>
            <button onClick={()=>apriModifica(e)} style={{width:'28px',height:'28px',borderRadius:'50%',background:'#EEF3FD',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Edit2 size={12} color="#193f9e"/>
            </button>
            <button onClick={()=>handleElimina(e)} style={{width:'28px',height:'28px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Trash2 size={12} color="#F7295A"/>
            </button>
          </div>
        </div>
        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
          {e.durataSecondi>0&&<span style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:'rgba(0,0,0,0.06)',color:'#394058'}}>⏱ {fmt(e.durataSecondi)}</span>}
          {e.intensita&&<span style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:e.intensita<=3?'#E8FBF8':e.intensita<=6?'#FFF5EE':'#FEF0F4',color:e.intensita<=3?'#00BFA6':e.intensita<=6?'#FF8C42':'#F7295A'}}>Int. {e.intensita}/10</span>}
        </div>
        {(e.nota||e.note)&&<div style={{fontSize:f(10),color:'#7c8088',marginTop:'4px',fontStyle:'italic'}}>📝 {e.nota||e.note}</div>}
      </div>
    )
  }

  return(
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.dm-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1;}`}</style>
      <div className="dm-wrap">

        <div style={{background:'linear-gradient(135deg,#FF8C42,#F7295A)',padding:'14px 16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div style={{flex:1}}>
              <div style={{fontSize:f(17),fontWeight:'900',color:'#fff'}}>Disturbi del Movimento</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>{isDemo?'🎭 Dati demo':'Registra episodio'}</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
            {[{label:'Tot.',val:log.length},{label:'7 giorni',val:oggi7},{label:'Int. media',val:mediaInt}].map(({label,val},i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:f(20),fontWeight:'900',color:'#fff'}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',background:'#f3f4f7',margin:'12px 12px 0',borderRadius:'12px',padding:'3px',gap:'3px'}}>
          {[{k:'form',l:'➕ Nuovo'},{k:'calendario',l:'📅 Calendario'},{k:'statistiche',l:'📊 Stats'}].map(({k,l})=>(
            <button key={k} onClick={()=>setSezione(k)} style={{padding:'9px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:sezione===k?'#feffff':'transparent',color:sezione===k?'#FF8C42':'#7c8088',boxShadow:sezione===k?shSm:'none',transition:'all 0.2s'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:'12px'}}>

          {sezione==='form'&&(
            <>
              {editTarget&&(
                <div style={{background:'#FFF5EE',borderRadius:'14px',padding:'10px 14px',marginBottom:'10px',border:'2px solid #FF8C42',display:'flex',alignItems:'center',gap:'10px'}}>
                  <Edit2 size={15} color="#FF8C42" style={{flexShrink:0}}/>
                  <div style={{flex:1,fontSize:f(12),fontWeight:'700',color:'#FF8C42'}}>Modifica: {editTarget.data} ore {editTarget.ora}</div>
                  <button onClick={annullaModifica} style={{width:'26px',height:'26px',borderRadius:'50%',background:'#FF8C42',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <X size={13} color="#fff"/>
                  </button>
                </div>
              )}

              {/* TIPO DI DISTURBO */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'2px'}}>Tipo di disturbo</div>
                <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>Puoi selezionarne più di uno</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'7px'}}>
                  {TIPI_DISTURBO.map(t=>{
                    const sel=form.tipi.includes(t.key)
                    return(
                      <div key={t.key} onClick={()=>toggleTipo(t.key)}
                        style={{padding:'11px 6px',borderRadius:'12px',cursor:'pointer',textAlign:'center',position:'relative',border:`2px solid ${sel?t.color:'#f0f1f4'}`,background:sel?`${t.color}15`:'#feffff',transition:'all 0.15s'}}>
                        {sel&&(
                          <div style={{position:'absolute',top:'4px',right:'4px',width:'15px',height:'15px',borderRadius:'50%',background:t.color,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Check size={9} color="#fff" strokeWidth={3}/>
                          </div>
                        )}
                        <div style={{fontSize:f(11),fontWeight:'800',color:sel?t.color:'#394058',lineHeight:'1.2'}}>{t.label}</div>
                        {/* ← MODIFICATO: descrizione breve */}
                        <div style={{fontSize:'9px',color:'#7c8088',marginTop:'3px',lineHeight:'1.3'}}>{t.desc}</div>
                      </div>
                    )
                  })}
                </div>
                {form.tipi.length>0&&(
                  <div style={{marginTop:'10px',padding:'8px 12px',background:'#FFF5EE',borderRadius:'10px',fontSize:f(11),fontWeight:'700',color:'#FF8C42'}}>
                    ✓ {getTipiLabel(form.tipi)}
                  </div>
                )}
              </div>

              {/* QUANDO */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>Quando</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                  <div><label style={lbStyle}>Data</label><input type="date" value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))} style={inStyle}/></div>
                  <div><label style={lbStyle}>Ora</label><input type="time" value={form.ora} onChange={e=>setForm(p=>({...p,ora:e.target.value}))} style={inStyle}/></div>
                </div>
                <label style={lbStyle}>Intensità: {form.intensita}/10 — {INTENSITA_LABELS[form.intensita]}</label>
                <input type="range" min="1" max="10" value={form.intensita} onChange={e=>setForm(p=>({...p,intensita:Number(e.target.value)}))} style={{width:'100%',accentColor:'#FF8C42',marginBottom:'6px'}}/>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:f(9),color:'#00BFA6',fontWeight:'600'}}>Lieve</span>
                  <span style={{fontSize:f(9),color:'#FF8C42',fontWeight:'600'}}>Moderata</span>
                  <span style={{fontSize:f(9),color:'#F7295A',fontWeight:'600'}}>Severa</span>
                </div>
              </div>

              {/* DURATA */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>Durata</div>
                <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>
                  {[{k:true,l:'⏱ Timer live'},{k:false,l:'✏️ Inserisci'}].map(({k,l})=>(
                    <button key={String(k)} onClick={()=>setForm(p=>({...p,usaTimer:k}))}
                      style={{flex:1,padding:'8px',borderRadius:'12px',border:`2px solid ${form.usaTimer===k?'#FF8C42':'#f0f1f4'}`,background:form.usaTimer===k?'#FFF5EE':'#feffff',color:form.usaTimer===k?'#FF8C42':'#7c8088',fontWeight:'700',fontSize:f(12),cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
                      {l}
                    </button>
                  ))}
                </div>
                {form.usaTimer?(
                  <>
                    <div style={{fontSize:f(44),fontWeight:'900',textAlign:'center',color:'#02153f',letterSpacing:'-2px',fontVariantNumeric:'tabular-nums',marginBottom:'12px'}}>{fmtShort(timerSec)}</div>
                    <div style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'8px'}}>
                      <button onClick={()=>startTimer()} disabled={running} style={{width:'48px',height:'48px',borderRadius:'50%',border:'none',cursor:'pointer',background:running?'#f3f4f7':'linear-gradient(135deg,#FF8C42,#F7295A)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:running?'none':'0 4px 14px rgba(255,140,66,0.4)'}}>
                        <Play size={20} color={running?'#bec1cc':'#fff'} fill={running?'#bec1cc':'#fff'}/>
                      </button>
                      <button onClick={stopTimer} style={{width:'48px',height:'48px',borderRadius:'50%',border:'none',cursor:'pointer',background:'linear-gradient(135deg,#7c8088,#394058)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <Square size={18} color="#fff" fill="#fff"/>
                      </button>
                      <button onClick={resetTimer} style={{width:'48px',height:'48px',borderRadius:'50%',border:'none',cursor:'pointer',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <RotateCcw size={18} color="#7c8088"/>
                      </button>
                    </div>
                    {running&&<div style={{textAlign:'center',fontSize:f(11),color:'#FF8C42',fontWeight:'700'}}>🔴 Registrazione in corso...</div>}
                    {!running&&timerSec>0&&<div style={{textAlign:'center',fontSize:f(11),color:'#00BFA6',fontWeight:'700'}}>✓ Durata: {fmt(timerSec)}</div>}
                  </>
                ):(
                  <>
                    <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px',textAlign:'center'}}>Tocca il campo e inserisci il valore</div>
                    <DurataManuale value={form.durataSecondi} onChange={sec=>setForm(p=>({...p,durataSecondi:sec}))}/>
                    {form.durataSecondi>0&&(
                      <div style={{marginTop:'12px',padding:'9px 12px',background:'#E8FBF8',borderRadius:'10px',fontSize:f(12),fontWeight:'700',color:'#00BFA6',textAlign:'center'}}>
                        ✓ Durata totale: {fmt(form.durataSecondi)}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* NOTE */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <label style={lbStyle}>Note (opzionale)</label>
                <textarea value={form.nota} onChange={e=>setForm(p=>({...p,nota:e.target.value}))} placeholder="Es: dopo pasto, in posizione seduta..." rows={2} style={{...inStyle,resize:'none',lineHeight:'1.5'}}/>
              </div>

              <button onClick={handleSave} style={{width:'100%',padding:'16px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':editTarget?'linear-gradient(135deg,#FF8C42,#193f9e)':'linear-gradient(135deg,#FF8C42,#F7295A)',boxShadow:'0 6px 20px rgba(255,140,66,0.4)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.3s',marginBottom:'8px'}}>
                {saved?<><Check size={18} color="#fff"/>Salvato!</>:editTarget?<><Save size={18} color="#fff"/>Aggiorna episodio</>:<>Salva episodio</>}
              </button>
              {isDemo&&<div style={{textAlign:'center',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Demo — non salvato</div>}
            </>
          )}

          {sezione==='calendario'&&(
            <>
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>Calendario episodi</div>
                <CalendarioMese log={log} mese={mese} setMese={setMese}/>
              </div>
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>Episodi del mese ({epMese.length})</div>
                {epMese.length===0
                  ?<div style={{textAlign:'center',padding:'16px',color:'#bec1cc',fontSize:f(12)}}>Nessun episodio questo mese</div>
                  :epMese.map((e,i)=><EpisodioCard key={e.id||i} e={e}/>)
                }
              </div>
            </>
          )}

          {sezione==='statistiche'&&(
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'7px',marginBottom:'10px'}}>
                {[
                  {label:'Totale',     val:log.length,                                        color:'#FF8C42'},
                  {label:'Int. media', val:mediaInt,                                          color:'#F7295A'},
                  {label:'Tipi usati', val:new Set(log.flatMap(e=>e.tipi||[e.tipo])).size,    color:'#7B5EA7'},
                ].map(({label,val,color},i)=>(
                  <div key={i} style={{background:'#feffff',borderRadius:'14px',padding:'10px 8px',boxShadow:shSm,textAlign:'center'}}>
                    <div style={{fontSize:f(22),fontWeight:'900',color}}>{val}</div>
                    <div style={{fontSize:f(9),color:'#7c8088',fontWeight:'700',textTransform:'uppercase'}}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>Distribuzione oraria</div>
                {log.length===0?<div style={{textAlign:'center',padding:'16px',color:'#bec1cc'}}>Nessun dato</div>:<GraficoOrario log={log}/>}
              </div>
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>Per tipo</div>
                {TIPI_DISTURBO.map(t=>{
                  const n=log.filter(e=>(e.tipi||[e.tipo]).includes(t.key)).length
                  if(n===0)return null
                  const pct=Math.round((n/log.length)*100)
                  return(
                    <div key={t.key} style={{marginBottom:'8px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                        <span style={{fontSize:f(12),fontWeight:'700',color:'#394058'}}>{t.label}</span>
                        <span style={{fontSize:f(11),color:'#7c8088'}}>{n}× · {pct}%</span>
                      </div>
                      <div style={{height:'6px',borderRadius:'3px',background:'#f3f4f7',overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:'3px',width:`${pct}%`,background:t.color}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>Tutti gli episodi</div>
                {log.length===0
                  ?<div style={{textAlign:'center',padding:'16px',color:'#bec1cc'}}>Nessun episodio</div>
                  :log.slice(0,30).map((e,i)=><EpisodioCard key={e.id||i} e={e}/>)
                }
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

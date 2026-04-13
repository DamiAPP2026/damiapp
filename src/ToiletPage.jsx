import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronLeft, Plus, Trash2, Edit2, Check, X,
  Droplets, Clock, Bell, BellOff, Play, Square,
  RotateCcw, AlertTriangle, Timer, ToggleLeft, ToggleRight
} from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'
import ToiletCharts from './ToiletCharts'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const COUNTDOWN_MS = 90 * 60 * 1000  // 90 minuti
const WARN_MS      = 15 * 60 * 1000  // avviso a 15 min dalla fine

const BISOGNI  = ['Pipì','Cacca','Entrambi','Nessuno']
const MODALITA = ['Vasino','WC grande','WC con adattatore','Pannolone']

const oggi  = new Date()
const fmtOggi = `${String(oggi.getDate()).padStart(2,'0')}/${String(oggi.getMonth()+1).padStart(2,'0')}/${oggi.getFullYear()}`
const oraOggi = `${String(oggi.getHours()).padStart(2,'0')}:${String(oggi.getMinutes()).padStart(2,'0')}`

const DEMO_DATA = [
  { id:1, timestamp: Date.now()-7200000, data:fmtOggi, ora:'09:00', bisogno:'Pipì',    modalita:'WC grande',           incidentePippi:false, oraPippi:'', incidenteCacca:false, oraCacca:'', _firebaseKey:'td1' },
  { id:2, timestamp: Date.now()-3600000, data:fmtOggi, ora:'10:30', bisogno:'Cacca',   modalita:'WC con adattatore',   incidentePippi:false, oraPippi:'', incidenteCacca:false, oraCacca:'', _firebaseKey:'td2' },
  { id:3, timestamp: Date.now()-1800000, data:fmtOggi, ora:'11:45', bisogno:'Entrambi',modalita:'WC grande',           incidentePippi:true,  oraPippi:'11:20', incidenteCacca:false, oraCacca:'', _firebaseKey:'td3' },
]

const EMPTY_FORM = { data:fmtOggi, ora:oraOggi, bisogno:'Pipì', modalita:'WC grande', incidentePippi:false, oraPippi:'', incidenteCacca:false, oraCacca:'' }

// ── Suono AudioContext ────────────────────────────────────────
function suonaAvviso(finale = false) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const sequenza = finale
      ? [523, 659, 784, 1047]  // Do-Mi-Sol-Do acuto (più festoso)
      : [440, 523]              // La-Do (avviso gentile)
    sequenza.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25)
      gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.25)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.4)
      osc.start(ctx.currentTime + i * 0.25)
      osc.stop(ctx.currentTime + i * 0.25 + 0.4)
    })
  } catch(e) {}
}

// ── Componente Countdown ─────────────────────────────────────
function CountdownWidget({ isDemo }) {
  // Stato persistente: nextTs = timestamp target, attivo = countdown in corso
  const [nextTs,     setNextTs]     = useState(null)
  const [attivo,     setAttivo]     = useState(false)
  const [secondiRim, setSecondiRim] = useState(0)
  const [suonatoWarn, setSuonatoWarn] = useState(false)
  const [suonatoFine, setSuonatoFine] = useState(false)
  const [scaduto,    setScaduto]    = useState(false)
  const intervalRef = useRef(null)

  const STORAGE_KEY = 'damiapp_toilet_next'

  // Al mount: ripristina il countdown se era attivo
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const ts = parseInt(saved, 10)
      if (ts > Date.now()) {
        setNextTs(ts)
        setAttivo(true)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Tick del countdown
  useEffect(() => {
    if (!attivo || !nextTs) {
      clearInterval(intervalRef.current)
      return
    }
    function tick() {
      const rimasti = nextTs - Date.now()
      if (rimasti <= 0) {
        setSecondiRim(0)
        setScaduto(true)
        setAttivo(false)
        clearInterval(intervalRef.current)
        localStorage.removeItem(STORAGE_KEY)
        if (!suonatoFine) { suonaAvviso(true); setSuonatoFine(true) }
        return
      }
      setSecondiRim(Math.floor(rimasti / 1000))
      setScaduto(false)
      // Avviso a 15 minuti dalla fine
      if (rimasti <= WARN_MS && !suonatoWarn) {
        suonaAvviso(false)
        setSuonatoWarn(true)
      }
    }
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => clearInterval(intervalRef.current)
  }, [attivo, nextTs, suonatoWarn, suonatoFine])

  function avviaCountdown() {
    const ts = Date.now() + COUNTDOWN_MS
    setNextTs(ts)
    setAttivo(true)
    setScaduto(false)
    setSuonatoWarn(false)
    setSuonatoFine(false)
    localStorage.setItem(STORAGE_KEY, String(ts))
  }

  function resetCountdown() {
    clearInterval(intervalRef.current)
    setNextTs(null)
    setAttivo(false)
    setScaduto(false)
    setSuonatoWarn(false)
    setSuonatoFine(false)
    setSecondiRim(0)
    localStorage.removeItem(STORAGE_KEY)
  }

  const hh = Math.floor(secondiRim / 3600)
  const mm = Math.floor((secondiRim % 3600) / 60)
  const ss = secondiRim % 60

  const progresso = nextTs ? Math.max(0, Math.min(1, (nextTs - Date.now()) / COUNTDOWN_MS)) : 0
  const isWarn    = secondiRim > 0 && secondiRim <= WARN_MS / 1000

  const colore = scaduto ? '#F7295A' : isWarn ? '#FF8C42' : '#7B5EA7'
  const bg     = scaduto ? '#FEF0F4' : isWarn ? '#FFF5EE' : '#F5F3FF'

  return (
    <div style={{background:bg, borderRadius:'18px', padding:'16px', marginBottom:'12px', boxShadow:shSm, border:`2px solid ${colore}22`, transition:'all 0.3s'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
        <div style={{width:'36px',height:'36px',borderRadius:'10px',background:colore,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Timer size={18} color="#fff"/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:f(13),fontWeight:'900',color:'#02153f'}}>Prossima toilette</div>
          <div style={{fontSize:f(10),color:'#7c8088'}}>Ogni 90 minuti · avviso a 15 min</div>
        </div>
        {(attivo || scaduto) && (
          <button onClick={resetCountdown} style={{width:'30px',height:'30px',borderRadius:'50%',background:'rgba(0,0,0,0.06)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <RotateCcw size={13} color="#7c8088"/>
          </button>
        )}
      </div>

      {/* Display tempo */}
      {(attivo || scaduto) && (
        <>
          {scaduto ? (
            <div style={{textAlign:'center',padding:'12px 0',marginBottom:'10px'}}>
              <div style={{fontSize:f(22),fontWeight:'900',color:'#F7295A',letterSpacing:'0.02em'}}>⏰ È ora!</div>
              <div style={{fontSize:f(11),color:'#F7295A',marginTop:'4px'}}>Tempo scaduto — porta al bagno</div>
            </div>
          ) : (
            <>
              <div style={{textAlign:'center',marginBottom:'10px'}}>
                <div style={{fontSize:f(32),fontWeight:'900',color:colore,fontVariantNumeric:'tabular-nums',letterSpacing:'0.04em',fontFamily:'monospace'}}>
                  {String(hh).padStart(2,'0')}:{String(mm).padStart(2,'0')}:{String(ss).padStart(2,'0')}
                </div>
                {isWarn && (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',marginTop:'4px'}}>
                    <AlertTriangle size={13} color="#FF8C42"/>
                    <span style={{fontSize:f(11),color:'#FF8C42',fontWeight:'700'}}>Presto ora del bagno</span>
                  </div>
                )}
              </div>
              {/* Barra progresso */}
              <div style={{height:'6px',background:'rgba(0,0,0,0.08)',borderRadius:'3px',marginBottom:'10px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${progresso*100}%`,background:`linear-gradient(90deg,${colore},${colore}88)`,borderRadius:'3px',transition:'width 1s linear'}}/>
              </div>
            </>
          )}
        </>
      )}

      {/* Pulsante avvia / riavvia */}
      {!attivo && (
        <button onClick={avviaCountdown}
          style={{width:'100%',padding:'12px',borderRadius:'12px',border:'none',cursor:'pointer',background:`linear-gradient(135deg,#7B5EA7,#2e84e9)`,color:'#fff',fontWeight:'800',fontSize:f(13),fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 4px 14px rgba(123,94,167,0.30)'}}>
          <Play size={15} color="#fff"/>
          {scaduto ? 'Riavvia countdown (90 min)' : 'Avvia countdown (90 min)'}
        </button>
      )}
      {attivo && (
        <button onClick={resetCountdown}
          style={{width:'100%',padding:'10px',borderRadius:'12px',border:'none',cursor:'pointer',background:'rgba(0,0,0,0.06)',color:'#7c8088',fontWeight:'700',fontSize:f(12),fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
          <Square size={13} color="#7c8088"/> Ferma countdown
        </button>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
export default function ToiletPage({ onBack, isDemo, onNavigate }) {
  const [tab,        setTab]        = useState('nuovo')
  const [sessioni,   setSessioni]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form,       setForm]       = useState({ ...EMPTY_FORM })
  const [saved,      setSaved]      = useState(false)
  // Toggle countdown: preferenza utente
  const [countdownOn, setCountdownOn] = useState(() => {
    try { return localStorage.getItem('damiapp_countdown_on') !== 'false' } catch { return true }
  })

  useEffect(() => {
    if (isDemo) { setSessioni(DEMO_DATA); setLoading(false); return }
    const u = onValue(ref(db,'toilet_training'), snap => {
      setSessioni(processFirebaseSnap(snap).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)))
      setLoading(false)
    })
    return () => u()
  }, [isDemo])

  function toggleCountdown() {
    const nuovoStato = !countdownOn
    setCountdownOn(nuovoStato)
    try { localStorage.setItem('damiapp_countdown_on', String(nuovoStato)) } catch {}
  }

  function apriNuovo()   { setForm({...EMPTY_FORM}); setEditTarget(null); setShowForm(true) }
  function apriModifica(s) {
    setForm({ data:s.data||'', ora:s.ora||'', bisogno:s.bisogno||'Pipì', modalita:s.modalita||'WC grande',
              incidentePippi:!!s.incidentePippi, oraPippi:s.oraPippi||'',
              incidenteCacca:!!s.incidenteCacca, oraCacca:s.oraCacca||'' })
    setEditTarget(s); setShowForm(true)
  }

  function handleSalva() {
    const doc = { id: editTarget?.id || Date.now(), timestamp: editTarget?.timestamp || Date.now(), ...form }
    if (!isDemo) {
      if (editTarget?._firebaseKey) set(ref(db,`toilet_training/${editTarget._firebaseKey}`), encrypt(doc))
      else push(ref(db,'toilet_training'), encrypt(doc))
    } else {
      if (editTarget) setSessioni(prev=>prev.map(s=>s.id===editTarget.id?{...doc,_firebaseKey:s._firebaseKey}:s))
      else setSessioni(prev=>[{...doc,_firebaseKey:`demo_${Date.now()}`},...prev])
    }
    setSaved(true)
    setTimeout(()=>{ setSaved(false); setShowForm(false) }, 1200)
  }

  function handleElimina(s) {
    if(!window.confirm('Eliminare questa sessione?')) return
    if(!isDemo && s._firebaseKey) remove(ref(db,`toilet_training/${s._firebaseKey}`))
    else setSessioni(prev=>prev.filter(x=>x.id!==s.id))
  }

  const incidentiOggi = sessioni.filter(s => s.data===fmtOggi && (s.incidentePippi || s.incidenteCacca)).length
  const sessioniOggi  = sessioni.filter(s => s.data===fmtOggi).length

  const inStyle={width:'100%',padding:'11px 12px',borderRadius:'12px',border:'1.5px solid #f0f1f4',fontSize:f(13),color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}
  const lbStyle={fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'5px',display:'block'}

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}><Droplets size={36} color="#bec1cc" style={{margin:'0 auto 10px',display:'block'}}/><div style={{fontSize:f(13),color:'#bec1cc'}}>Caricamento...</div></div>
    </div>
  )

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.tt-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="tt-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#7B5EA7,#2e84e9)',padding:'14px 16px 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div style={{flex:1}}>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff',display:'flex',alignItems:'center',gap:'8px'}}>
                <Droplets size={18} color="#fff"/> Toilet Training
              </div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                Oggi: {sessioniOggi} sessioni{incidentiOggi>0?` · ${incidentiOggi} incidenti`:''}
              </div>
            </div>
            <button onClick={apriNuovo} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <Plus size={20} color="#fff"/>
            </button>
          </div>

          {/* Toggle countdown nel header */}
          <div style={{background:'rgba(255,255,255,0.12)',borderRadius:'12px',padding:'10px 14px',marginBottom:'12px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}} onClick={toggleCountdown}>
            <div style={{flex:1}}>
              <div style={{fontSize:f(12),fontWeight:'800',color:'#fff'}}>Countdown 90 min</div>
              <div style={{fontSize:f(10),color:'rgba(255,255,255,0.65)'}}>
                {countdownOn ? 'Attivo — suona allo scadere' : 'Disattivato'}
              </div>
            </div>
            {countdownOn
              ? <ToggleRight size={28} color="#fff"/>
              : <ToggleLeft  size={28} color="rgba(255,255,255,0.45)"/>
            }
          </div>

          {/* Tab */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px',paddingBottom:'0'}}>
            {[['nuovo','Nuova'],['storico','Storico'],['grafici','Grafici']].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{padding:'9px 4px',borderRadius:'10px 10px 0 0',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:tab===k?'#f3f4f7':'transparent',color:tab===k?'#7B5EA7':'rgba(255,255,255,0.75)',transition:'all 0.15s'}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* ── TAB NUOVA ── */}
          {tab==='nuovo'&&(
            <>
              {/* Countdown widget (solo se attivo) */}
              {countdownOn && <CountdownWidget isDemo={isDemo}/>}

              {/* Stats oggi */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                <div style={{background:'#feffff',borderRadius:'14px',padding:'12px',boxShadow:shSm,textAlign:'center'}}>
                  <div style={{fontSize:f(22),fontWeight:'900',color:'#7B5EA7'}}>{sessioniOggi}</div>
                  <div style={{fontSize:f(10),color:'#7c8088',marginTop:'2px'}}>sessioni oggi</div>
                </div>
                <div style={{background:incidentiOggi>0?'#FEF0F4':'#feffff',borderRadius:'14px',padding:'12px',boxShadow:shSm,textAlign:'center'}}>
                  <div style={{fontSize:f(22),fontWeight:'900',color:incidentiOggi>0?'#F7295A':'#bec1cc'}}>{incidentiOggi}</div>
                  <div style={{fontSize:f(10),color:incidentiOggi>0?'#F7295A':'#7c8088',marginTop:'2px'}}>incidenti oggi</div>
                </div>
              </div>

              {/* Ultime sessioni oggi */}
              <div style={{fontSize:f(11),color:'#7c8088',fontWeight:'700',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.4px'}}>Ultime sessioni di oggi</div>
              {sessioni.filter(s=>s.data===fmtOggi).length===0?(
                <div style={{background:'#feffff',borderRadius:'14px',padding:'20px',textAlign:'center',boxShadow:shSm,marginBottom:'12px'}}>
                  <Droplets size={28} color="#bec1cc" style={{margin:'0 auto 8px',display:'block'}}/>
                  <div style={{fontSize:f(12),color:'#bec1cc'}}>Nessuna sessione registrata oggi</div>
                </div>
              ):(
                sessioni.filter(s=>s.data===fmtOggi).slice(0,5).map((s,i)=>(
                  <SessioneCard key={s.id||i} s={s} onModifica={()=>apriModifica(s)} onElimina={()=>handleElimina(s)}/>
                ))
              )}

              <button onClick={apriNuovo} style={{width:'100%',padding:'14px',borderRadius:'16px',border:'none',cursor:'pointer',background:'linear-gradient(135deg,#7B5EA7,#2e84e9)',color:'#fff',fontWeight:'800',fontSize:f(14),fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 6px 20px rgba(123,94,167,0.30)',marginTop:'8px'}}>
                <Plus size={18} color="#fff"/> Registra sessione
              </button>
            </>
          )}

          {/* ── TAB STORICO ── */}
          {tab==='storico'&&(
            <>
              {sessioni.length===0?(
                <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh}}>
                  <Droplets size={40} color="#bec1cc" style={{margin:'0 auto 12px',display:'block'}}/>
                  <div style={{fontSize:f(14),color:'#7c8088'}}>Nessuna sessione registrata</div>
                </div>
              ):(
                sessioni.map((s,i)=>(
                  <SessioneCard key={s.id||i} s={s} onModifica={()=>apriModifica(s)} onElimina={()=>handleElimina(s)} showDate/>
                ))
              )}
            </>
          )}

          {/* ── TAB GRAFICI ── */}
          {tab==='grafici'&&(
            <ToiletCharts sessioni={sessioni} isDemo={isDemo}/>
          )}
        </div>

        {/* MODAL FORM */}
        {showForm&&(
          <div style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.55)',zIndex:2000,display:'flex',alignItems:'flex-end',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
            <div style={{background:'#feffff',borderRadius:'24px 24px 0 0',padding:'20px',width:'100%',maxWidth:'480px',maxHeight:'92vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <span style={{fontSize:f(16),fontWeight:'900',color:'#02153f'}}>{editTarget?'Modifica sessione':'Nuova sessione'}</span>
                <button onClick={()=>setShowForm(false)} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <X size={16} color="#7c8088"/>
                </button>
              </div>

              {/* Data + Ora */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div><label style={lbStyle}>Data</label>
                  <input value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))} style={inStyle}
                    onFocus={e=>e.target.style.borderColor='#7B5EA7'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
                <div><label style={lbStyle}>Ora</label>
                  <input value={form.ora} onChange={e=>setForm(p=>({...p,ora:e.target.value}))} style={inStyle}
                    onFocus={e=>e.target.style.borderColor='#7B5EA7'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
              </div>

              {/* Bisogno */}
              <label style={lbStyle}>Bisogno</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'12px'}}>
                {BISOGNI.map(b=>(
                  <div key={b} onClick={()=>setForm(p=>({...p,bisogno:b}))}
                    style={{padding:'10px',borderRadius:'10px',cursor:'pointer',border:`2px solid ${form.bisogno===b?'#7B5EA7':'#f0f1f4'}`,background:form.bisogno===b?'#F5F3FF':'#feffff',textAlign:'center',fontWeight:'700',fontSize:f(12),color:form.bisogno===b?'#7B5EA7':'#394058',transition:'all 0.15s'}}>
                    {b}
                  </div>
                ))}
              </div>

              {/* Modalità */}
              <label style={lbStyle}>Modalità</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'14px'}}>
                {MODALITA.map(m=>(
                  <div key={m} onClick={()=>setForm(p=>({...p,modalita:m}))}
                    style={{padding:'10px',borderRadius:'10px',cursor:'pointer',border:`2px solid ${form.modalita===m?'#7B5EA7':'#f0f1f4'}`,background:form.modalita===m?'#F5F3FF':'#feffff',textAlign:'center',fontWeight:'700',fontSize:f(12),color:form.modalita===m?'#7B5EA7':'#394058',transition:'all 0.15s'}}>
                    {m}
                  </div>
                ))}
              </div>

              {/* Incidenti */}
              <div style={{background:'#FEF0F4',borderRadius:'14px',padding:'14px',marginBottom:'16px'}}>
                <div style={{fontSize:f(12),fontWeight:'800',color:'#F7295A',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
                  <AlertTriangle size={14} color="#F7295A"/> Incidenti
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                  <div onClick={()=>setForm(p=>({...p,incidentePippi:!p.incidentePippi}))}
                    style={{width:'22px',height:'22px',borderRadius:'6px',border:`2px solid ${form.incidentePippi?'#F7295A':'#f0b0bc'}`,background:form.incidentePippi?'#F7295A':'#feffff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                    {form.incidentePippi&&<Check size={13} color="#fff"/>}
                  </div>
                  <span style={{fontSize:f(12),color:'#394058',flex:1}}>Incidente pipì</span>
                  {form.incidentePippi&&(
                    <input value={form.oraPippi} onChange={e=>setForm(p=>({...p,oraPippi:e.target.value}))} placeholder="Ora" style={{...inStyle,width:'80px',padding:'6px 8px',fontSize:f(11)}}/>
                  )}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div onClick={()=>setForm(p=>({...p,incidenteCacca:!p.incidenteCacca}))}
                    style={{width:'22px',height:'22px',borderRadius:'6px',border:`2px solid ${form.incidenteCacca?'#F7295A':'#f0b0bc'}`,background:form.incidenteCacca?'#F7295A':'#feffff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                    {form.incidenteCacca&&<Check size={13} color="#fff"/>}
                  </div>
                  <span style={{fontSize:f(12),color:'#394058',flex:1}}>Incidente cacca</span>
                  {form.incidenteCacca&&(
                    <input value={form.oraCacca} onChange={e=>setForm(p=>({...p,oraCacca:e.target.value}))} placeholder="Ora" style={{...inStyle,width:'80px',padding:'6px 8px',fontSize:f(11)}}/>
                  )}
                </div>
              </div>

              <button onClick={handleSalva} style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#7B5EA7,#2e84e9)',boxShadow:'0 6px 20px rgba(123,94,167,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.3s',fontFamily:'inherit'}}>
                {saved?<><Check size={18} color="#fff"/>Salvato!</>:<>{editTarget?'Aggiorna sessione':'Salva sessione'}</>}
              </button>
              {isDemo&&<div style={{textAlign:'center',marginTop:'10px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>Demo — non salvato su Firebase</div>}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Card sessione ─────────────────────────────────────────────
function SessioneCard({ s, onModifica, onElimina, showDate }) {
  const hasInc = s.incidentePippi || s.incidenteCacca
  return (
    <div style={{background:'#feffff',borderRadius:'16px',marginBottom:'8px',boxShadow:'0 2px 10px rgba(2,21,63,0.06)',overflow:'hidden'}}>
      <div style={{height:'3px',background:hasInc?'#F7295A':'linear-gradient(90deg,#7B5EA7,#2e84e9)'}}/>
      <div style={{padding:'12px',display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{width:'40px',height:'40px',borderRadius:'12px',background:hasInc?'#FEF0F4':'#F5F3FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Droplets size={18} color={hasInc?'#F7295A':'#7B5EA7'}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f'}}>
            {s.bisogno} · {s.modalita}
          </div>
          <div style={{fontSize:f(10),color:'#bec1cc',marginTop:'2px'}}>
            {showDate?`${s.data} `:''}ore {s.ora}
            {hasInc&&<span style={{color:'#F7295A',marginLeft:'6px',fontWeight:'700'}}>⚠ incidente</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:'4px',flexShrink:0}}>
          <button onClick={onModifica} style={{width:'28px',height:'28px',borderRadius:'50%',background:'#EEF3FD',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Edit2 size={12} color="#2e84e9"/>
          </button>
          <button onClick={onElimina} style={{width:'28px',height:'28px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Trash2 size={12} color="#F7295A"/>
          </button>
        </div>
      </div>
    </div>
  )
}

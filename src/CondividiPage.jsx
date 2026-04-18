import { useState, useEffect } from 'react'
import {
  ChevronLeft, Copy, Trash2, Check, Plus, Shield, Clock,
  Eye, EyeOff, RefreshCw, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, set, get, remove } from 'firebase/database'
import { encrypt, processFirebaseSnap, decrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
  return `DMI${rand(4)}${rand(5)}`
}

const RUOLI = [
  { key:'medico',        label:'Medico',               sub:'Neurologo, pediatra, specialista',      icon:'👨‍⚕️', color:'#193f9e', bg:'#EEF3FD', grad:'linear-gradient(135deg,#193f9e,#2e84e9)' },
  { key:'toilet_writer', label:'Educatore / Terapista', sub:'Accesso scrittura Toilet Training',     icon:'🧑‍🏫', color:'#7B5EA7', bg:'#F5F3FF', grad:'linear-gradient(135deg,#7B5EA7,#2e84e9)' },
  { key:'viewer',        label:'Visualizzatore',        sub:'Nonni, babysitter, assistente',         icon:'👁️',  color:'#00BFA6', bg:'#E8FBF8', grad:'linear-gradient(135deg,#00BFA6,#2e84e9)' },
]

const DURATE = [
  { gg:0,   label:'Una tantum', sub:'Scade dopo 1 uso' },
  { gg:1,   label:'1 giorno',   sub:'Visita rapida'    },
  { gg:30,  label:'1 mese',     sub:'Mensile'          },
  { gg:90,  label:'3 mesi',     sub:'Trimestrale'      },
  { gg:180, label:'6 mesi',     sub:'Semestrale'       },
  { gg:365, label:'1 anno',     sub:'Annuale'          },
]

const PERMESSI_MEDICO = [
  { key:'shareCrises',    label:'Crisi epilettiche', sub:'Registro completo in sola lettura',   color:'#F7295A', bg:'#FEF0F4', icon:'⚡', locked:true  },
  { key:'shareTerapie',   label:'Terapie',           sub:'Farmaci e orari',                      color:'#00BFA6', bg:'#E8FBF8', icon:'💊', locked:false },
  { key:'shareToilet',    label:'Toilet Training',   sub:'Calendario e grafici aggregati',        color:'#7B5EA7', bg:'#F5F3FF', icon:'🚽', locked:false },
  { key:'shareDiario',    label:'Diario crisi',      sub:'Note dettagliate sessioni',             color:'#F7295A', bg:'#FEF0F4', icon:'📖', locked:false },
  { key:'shareReport',    label:'Report',            sub:'Grafici e statistiche',                 color:'#FF8C42', bg:'#FFF5EE', icon:'📊', locked:false },
  { key:'shareMagazzino', label:'Magazzino',         sub:'Scorte medicinali',                     color:'#193f9e', bg:'#EEF3FD', icon:'📦', locked:false },
  { key:'shareDisturbi',  label:'Disturbi',          sub:'Episodi registrati',                    color:'#FF8C42', bg:'#FFF5EE', icon:'🧠', locked:false },
  { key:'shareDocuments', label:'Documenti',         sub:'Seleziona i documenti da condividere',  color:'#2e84e9', bg:'#EEF3FD', icon:'📄', locked:false },
  { key:'shareChat',      label:'Chat',              sub:'Messaggistica con il medico',           color:'#193f9e', bg:'#EEF3FD', icon:'💬', locked:false },
]

const DEFAULT_PERMS_MEDICO = {
  shareCrises:true, shareTerapie:false, shareToilet:false,
  shareDiario:false, shareReport:false, shareMagazzino:false,
  shareDisturbi:false, shareDocuments:false, shareChat:false,
  selectedDocIds:[],
}

const DEFAULT_PERMS_VIEWER = {
  shareCrisi:true, shareTerapie:true, shareToilet:true, shareGrafici:true,
}

const DEMO_TOKENS = [
  { id:1, role:'medico',        medicoName:'Dr. Bianchi', intestatario:'',        token:'DMIABC12345', active:true,  createdAt:Date.now()-10*86400000, expiresAt:Date.now()+80*86400000, usaEGetta:false, usato:false, permissions:{shareCrises:true,shareTerapie:true,shareToilet:false,shareDocuments:false,shareChat:true,selectedDocIds:[]}, accessLogs:[{at:Date.now()-2*86400000}], _firebaseKey:'demo1' },
  { id:2, role:'toilet_writer', medicoName:'',            intestatario:'Damiano', token:'DMIWRT55432', active:true,  createdAt:Date.now()-5*86400000,  expiresAt:Date.now()+25*86400000, usaEGetta:false, usato:false, permissions:{}, accessLogs:[], _firebaseKey:'demo3' },
  { id:3, role:'viewer',        medicoName:'Nonna Maria', intestatario:'',        token:'DMIVIEW9900', active:false, createdAt:Date.now()-100*86400000,expiresAt:Date.now()-10*86400000, usaEGetta:false, usato:false, permissions:{shareCrisi:true,shareTerapie:true,shareToilet:true,shareGrafici:true}, accessLogs:[], _firebaseKey:'demo2' },
]

function getRuolo(key) { return RUOLI.find(r=>r.key===key)||RUOLI[0] }

export default function CondividiPage({ onBack, isDemo }) {
  const [tokens,        setTokens]       = useState([])
  const [sezione,       setSezione]      = useState('lista')
  const [role,          setRole]         = useState('medico')
  const [medicoName,    setMedico]       = useState('')
  const [intestatario,  setIntestatario] = useState('')
  const [giorni,        setGiorni]       = useState(90)
  const [perms,         setPerms]        = useState({...DEFAULT_PERMS_MEDICO})
  const [tokenGenerato, setTokenGen]     = useState(null)
  const [copied,        setCopied]       = useState(false)
  const [tokenVisible,  setVisible]      = useState({})
  const [documenti,     setDocumenti]    = useState([])
  const [docsExpanded,  setDocsExpanded] = useState(false)
  const [showRinnova,   setShowRinnova]  = useState(null)
  const [nuovaDurata,   setNuovaDurata]  = useState(90)

  useEffect(() => {
    if (isDemo) { setTokens(DEMO_TOKENS); return }
    const unsub = onValue(ref(db,'sharetokens'), snap => {
      setTokens(processFirebaseSnap(snap).sort((a,b)=>b.createdAt-a.createdAt))
    })
    return () => unsub()
  }, [isDemo])

  useEffect(() => {
    if (isDemo) {
      setDocumenti([
        {id:1,nome:'EEG 12-04-2026',     tipo:'eeg',         data:fmtOggi(), _firebaseKey:'d1'},
        {id:2,nome:'Ricetta Keppra',      tipo:'ricetta',     data:'01/04/2026', _firebaseKey:'d2'},
        {id:3,nome:'Visita neurologica',  tipo:'referto',     data:'15/03/2026', _firebaseKey:'d3'},
        {id:4,nome:'Certificato L.104',   tipo:'certificato', data:'10/01/2025', _firebaseKey:'d4'},
        {id:5,nome:'Piano educativo PEI', tipo:'verbale',     data:'10/09/2025', _firebaseKey:'d5'},
      ])
      return
    }
    get(ref(db,'documents')).then(snap => {
      if (!snap.val()) return
      const lista = Object.entries(snap.val()).map(([k,enc])=>{
        const d = typeof enc==='object' ? enc : decrypt(enc)
        return d ? {...d,_firebaseKey:k} : null
      }).filter(Boolean)
      setDocumenti(lista)
    })
  }, [isDemo])

  function fmtOggi() {
    const d = new Date()
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  }

  function resetForm() {
    setRole('medico'); setMedico(''); setIntestatario('')
    setGiorni(90); setPerms({...DEFAULT_PERMS_MEDICO}); setDocsExpanded(false)
  }

  function handleGenera() {
    const nome = role==='toilet_writer' ? intestatario : medicoName
    if (!nome.trim()) {
      alert(role==='toilet_writer' ? "Inserisci il nome dell'intestatario" : 'Inserisci il nome del collaboratore')
      return
    }
    const token = generateToken()
    const usaEGetta = giorni===0
    const nuovoToken = {
      id: Date.now(), role,
      medicoName:    role!=='toilet_writer' ? medicoName.trim() : '',
      intestatario:  role==='toilet_writer' ? intestatario.trim() : '',
      token, active: true,
      createdAt:  Date.now(),
      expiresAt:  usaEGetta ? Date.now()+86400000 : Date.now()+giorni*86400000,
      usaEGetta, usato: false,
      permissions: role==='medico' ? {...perms}
        : role==='viewer' ? {...DEFAULT_PERMS_VIEWER} : {},
      accessLogs: [],
    }
    if (!isDemo) push(ref(db,'sharetokens'), encrypt(nuovoToken))
    else setTokens(prev=>[{...nuovoToken,_firebaseKey:`demo_${Date.now()}`},...prev])
    setTokenGen(nuovoToken); setSezione('generato')
  }

  function handleRevoca(t) {
    if (!window.confirm(`Revocare l'accesso a ${t.medicoName||t.intestatario||'questo utente'}?`)) return
    const updated = {...t, active:false}
    if (!isDemo && t._firebaseKey) {
      const toSave = {...updated}; delete toSave._firebaseKey
      set(ref(db,`sharetokens/${t._firebaseKey}`), encrypt(toSave))
    } else {
      setTokens(prev=>prev.map(tk=>tk.id===t.id?{...tk,active:false}:tk))
    }
  }

  function handleElimina(t) {
    const nome = t.medicoName || t.intestatario || 'questo utente'
    if (!window.confirm('Eliminare definitivamente il token di ' + nome + '?\nQuesta operazione è irreversibile.')) return
    if (!isDemo && t._firebaseKey) {
      remove(ref(db, 'sharetokens/' + t._firebaseKey))
    } else {
      setTokens(prev => prev.filter(tk => tk.id !== t.id))
    }
  }

  function handleEliminaTutti() {
    if (!window.confirm('Eliminare definitivamente TUTTI i token scaduti e revocati?\nQuesta operazione è irreversibile.')) return
    const scadutiDaEliminare = tokens.filter(t => !t.active || (t.expiresAt && t.expiresAt <= Date.now()))
    if (!isDemo) {
      scadutiDaEliminare.forEach(t => {
        if (t._firebaseKey) remove(ref(db, 'sharetokens/' + t._firebaseKey))
      })
    } else {
      setTokens(prev => prev.filter(t => t.active && (!t.expiresAt || t.expiresAt > Date.now())))
    }
  }

  function handleRinnova(t) {
    const gg = nuovaDurata
    const updated = {
      ...t, active:true, usaEGetta:gg===0, usato:false,
      expiresAt: gg===0 ? Date.now()+86400000 : Date.now()+gg*86400000
    }
    if (!isDemo && t._firebaseKey) {
      const toSave = {...updated}; delete toSave._firebaseKey
      set(ref(db,`sharetokens/${t._firebaseKey}`), encrypt(toSave))
    } else {
      setTokens(prev=>prev.map(tk=>tk.id===t.id?updated:tk))
    }
    setShowRinnova(null)
  }

  function handleCopy(token) {
    navigator.clipboard?.writeText(token).catch(()=>{})
    setCopied(true); setTimeout(()=>setCopied(false),2500)
  }

  function toggleVisible(id) { setVisible(prev=>({...prev,[id]:!prev[id]})) }
  function toggleDoc(docId) {
    setPerms(p=>{
      const ids = p.selectedDocIds||[]
      return {...p, selectedDocIds: ids.includes(docId)?ids.filter(i=>i!==docId):[...ids,docId]}
    })
  }
  function togglePerm(key) { setPerms(p=>({...p,[key]:!p[key]})) }

  const attivi  = tokens.filter(t=> t.active && (t.expiresAt===null||t.expiresAt>Date.now()))
  const scaduti = tokens.filter(t=>!t.active || (t.expiresAt&&t.expiresAt<=Date.now()))

  function giorniRim(t) {
    if (!t.expiresAt) return null
    return Math.max(0,Math.ceil((t.expiresAt-Date.now())/86400000))
  }
  function colScad(gg) {
    if (gg===null) return '#00BFA6'
    if (gg<=1) return '#F7295A'
    if (gg<=30) return '#FF8C42'
    return '#00BFA6'
  }

  const inSt = { width:'100%',padding:'12px 14px',borderRadius:'12px',border:'1.5px solid #f0f1f4',fontSize:f(14),color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',boxSizing:'border-box' }
  const lbSt = { fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'6px',display:'block' }

  // ── PANEL RINNOVO riutilizzabile ──────────────────────────────
  function PanelRinnova({ t }) {
    return (
      <div style={{marginTop:'10px',padding:'12px',background:'#f3f4f7',borderRadius:'14px',border:'1.5px solid #193f9e22'}}>
        <div style={{fontSize:f(12),fontWeight:'700',color:'#02153f',marginBottom:'8px'}}>Nuova durata</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'5px',marginBottom:'10px'}}>
          {DURATE.map(({gg,label})=>(
            <div key={gg} onClick={()=>setNuovaDurata(gg)} style={{
              padding:'7px 4px',borderRadius:'10px',cursor:'pointer',textAlign:'center',
              border:`2px solid ${nuovaDurata===gg?'#193f9e':'#e8eaf0'}`,
              background:nuovaDurata===gg?'#EEF3FD':'#feffff',
              fontSize:f(11),fontWeight:'700',color:nuovaDurata===gg?'#193f9e':'#394058',
              transition:'all 0.15s'
            }}>{label}</div>
          ))}
        </div>
        <button type="button" onClick={()=>handleRinnova(t)} style={{
          width:'100%',padding:'10px',borderRadius:'50px',border:'none',cursor:'pointer',
          fontWeight:'800',fontSize:f(13),color:'#fff',fontFamily:'inherit',
          background:'linear-gradient(135deg,#193f9e,#2e84e9)',
          boxShadow:'0 4px 14px rgba(25,63,158,0.3)',
          display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'
        }}>
          <RefreshCw size={14} color="#fff"/> Rinnova token
        </button>
      </div>
    )
  }

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.cw{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:120px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="cw">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#193f9e,#2e84e9)',padding:'14px 16px 22px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <button type="button" onClick={sezione==='lista'?onBack:()=>{setSezione('lista');resetForm()}}
              style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>🔗 Condividi dati</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                {sezione==='lista'?'Accessi attivi':sezione==='nuovo'?'Nuovo accesso':'Token generato!'}
              </div>
            </div>
          </div>
          {sezione==='lista' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
              {[
                {label:'Token attivi',  val:attivi.length,                                              color:'#fff'},
                {label:'Accessi totali',val:tokens.reduce((s,t)=>s+(t.accessLogs?.length||0),0),        color:'#fff'},
                {label:'Revocati',      val:scaduti.length, color:scaduti.length>0?'#FFD93D':'#fff'},
              ].map(({label,val,color},i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                  <div style={{fontSize:f(20),fontWeight:'900',color}}>{val}</div>
                  <div style={{fontSize:f(10),color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{padding:'12px'}}>

          {/* ════ LISTA ════ */}
          {sezione==='lista' && (<>
            <div style={{background:'#EEF3FD',borderRadius:'14px',padding:'12px 14px',marginBottom:'12px',border:'1.5px solid #193f9e22',display:'flex',gap:'10px',alignItems:'flex-start'}}>
              <Shield size={18} color="#193f9e" style={{flexShrink:0,marginTop:'1px'}}/>
              <div style={{fontSize:f(12),color:'#193f9e',lineHeight:'1.6'}}>
                Ogni accesso è in <strong>sola lettura</strong> per i dati selezionati. Puoi revocare o rinnovare in qualsiasi momento.
              </div>
            </div>

            <button type="button" onClick={()=>{setSezione('nuovo');resetForm()}} style={{
              width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',
              fontWeight:'800',fontSize:f(15),color:'#fff',
              background:'linear-gradient(135deg,#193f9e,#2e84e9)',
              boxShadow:'0 6px 20px rgba(25,63,158,0.35)',
              display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'16px'
            }}>
              <Plus size={18} color="#fff"/> Genera nuovo token
            </button>

            <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>🔐 Token attivi ({attivi.length})</div>

            {attivi.length===0 ? (
              <div style={{background:'#feffff',borderRadius:'16px',padding:'28px',textAlign:'center',boxShadow:shSm,marginBottom:'12px'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>🔗</div>
                <div style={{fontSize:f(13),color:'#7c8088',marginBottom:'4px'}}>Nessun token attivo</div>
                <div style={{fontSize:f(11),color:'#bec1cc'}}>Genera un token per condividere i dati</div>
              </div>
            ) : attivi.map(t=>{
              const gg  = giorniRim(t)
              const col = colScad(gg)
              const ruolo = getRuolo(t.role||'medico')
              const vis = tokenVisible[t.id]
              const nomeDisplay = t.role==='toilet_writer' ? t.intestatario : (t.medicoName||'—')
              const tokenDisplay = vis ? t.token : t.token?.slice(0,3)+'••••••••'
              return (
                <div key={t.id} style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'4px'}}>
                        <span style={{fontSize:'16px'}}>{ruolo.icon}</span>
                        <div style={{fontSize:f(15),fontWeight:'800',color:'#02153f',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nomeDisplay}</div>
                      </div>
                      <span style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:ruolo.bg,color:ruolo.color,display:'inline-block',marginBottom:'6px'}}>{ruolo.label}</span>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div style={{fontFamily:"'Courier New',monospace",fontSize:f(14),fontWeight:'700',color:'#193f9e',letterSpacing:'2px'}}>{tokenDisplay}</div>
                        <button type="button" onClick={()=>toggleVisible(t.id)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',display:'flex',alignItems:'center'}}>
                          {vis?<EyeOff size={13} color="#7c8088"/>:<Eye size={13} color="#7c8088"/>}
                        </button>
                      </div>
                    </div>
                    <button type="button" onClick={()=>handleRevoca(t)} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:'8px'}}>
                      <Trash2 size={14} color="#F7295A"/>
                    </button>
                  </div>

                  {t.role==='medico' && (
                    <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'10px'}}>
                      {PERMESSI_MEDICO.filter(p=>t.permissions?.[p.key]).map(p=>(
                        <span key={p.key} style={{fontSize:f(9),fontWeight:'700',padding:'2px 6px',borderRadius:'20px',background:p.bg,color:p.color}}>{p.icon} {p.label}</span>
                      ))}
                    </div>
                  )}
                  {t.role==='viewer' && (
                    <div style={{marginBottom:'10px'}}>
                      <span style={{fontSize:f(9),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#E8FBF8',color:'#00BFA6'}}>👁️ Crisi · Terapie · Toilet · Grafici</span>
                    </div>
                  )}
                  {t.role==='toilet_writer' && (
                    <div style={{display:'flex',gap:'5px',marginBottom:'10px'}}>
                      <span style={{fontSize:f(9),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#F5F3FF',color:'#7B5EA7'}}>✏️ Scrittura Toilet Training</span>
                      {t.usaEGetta&&<span style={{fontSize:f(9),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#FFF5EE',color:'#FF8C42'}}>Una tantum</span>}
                    </div>
                  )}

                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                      <Clock size={12} color={col}/>
                      <span style={{fontSize:f(11),color:col,fontWeight:'700'}}>
                        {t.usaEGetta?(t.usato?'Usato':'Una tantum'):gg===null?'—':gg===0?'Scade oggi':`${gg} giorni`}
                      </span>
                    </div>
                    <span style={{fontSize:f(10),color:'#bec1cc'}}>{t.accessLogs?.length||0} accessi</span>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px'}}>
                    <button type="button" onClick={()=>handleCopy(t.token)} style={{padding:'8px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:copied?'#E8FBF8':'#EEF3FD',color:copied?'#00BFA6':'#193f9e',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                      {copied?<><Check size={11}/> Copiato</>:<><Copy size={11}/> Copia</>}
                    </button>
                    <button type="button" onClick={()=>{setShowRinnova(showRinnova===t.id?null:t.id);setNuovaDurata(90)}} style={{padding:'8px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:'#EEF3FD',color:'#193f9e',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                      <RefreshCw size={11}/> Rinnova
                    </button>
                    <button type="button" onClick={()=>handleRevoca(t)} style={{padding:'8px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:'#FEF0F4',color:'#F7295A',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                      <Trash2 size={11}/> Revoca
                    </button>
                  </div>
                  {showRinnova===t.id && <PanelRinnova t={t}/>}
                </div>
              )
            })}

            {scaduti.length>0 && (<>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'16px 0 8px'}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#bec1cc'}}>Revocati / Scaduti ({scaduti.length})</div>
                <button type="button" onClick={handleEliminaTutti} style={{padding:'5px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:'#FEF0F4',color:'#F7295A',display:'flex',alignItems:'center',gap:'4px'}}>
                  <Trash2 size={10}/> Elimina tutti
                </button>
              </div>
              {scaduti.map(t=>{
                const ruolo = getRuolo(t.role||'medico')
                const nomeDisplay = t.role==='toilet_writer' ? t.intestatario : (t.medicoName||'—')
                return (
                  <div key={t.id} style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px 14px',marginBottom:'7px',opacity:0.7}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}>
                          <span style={{fontSize:'13px'}}>{ruolo.icon}</span>
                          <div style={{fontSize:f(13),fontWeight:'700',color:'#7c8088'}}>{nomeDisplay}</div>
                        </div>
                        <div style={{fontFamily:"'Courier New',monospace",fontSize:f(12),color:'#bec1cc',letterSpacing:'1px'}}>{t.token}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'5px'}}>
                        <span style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:'#FEF0F4',color:'#F7295A'}}>Revocato</span>
                        <div style={{display:'flex',gap:'5px'}}>
                          <button type="button" onClick={()=>{setShowRinnova(showRinnova===t.id?null:t.id);setNuovaDurata(90)}} style={{padding:'4px 10px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:'#EEF3FD',color:'#193f9e',display:'flex',alignItems:'center',gap:'4px'}}>
                            <RefreshCw size={10}/> Rinnova
                          </button>
                          <button type="button" onClick={()=>handleElimina(t)} style={{padding:'4px 10px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:'#FEF0F4',color:'#F7295A',display:'flex',alignItems:'center',gap:'4px'}}>
                            <Trash2 size={10}/> Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                    {showRinnova===t.id && <PanelRinnova t={t}/>}
                  </div>
                )
              })}
            </>)}
          </>)}

          {/* ════ NUOVO TOKEN ════ */}
          {sezione==='nuovo' && (<>

            {/* Ruolo */}
            <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>Chi accede?</div>
              {RUOLI.map(r=>(
                <div key={r.key} onClick={()=>{setRole(r.key);setPerms(r.key==='medico'?{...DEFAULT_PERMS_MEDICO}:r.key==='viewer'?{...DEFAULT_PERMS_VIEWER}:{})}}
                  style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'14px',marginBottom:'7px',cursor:'pointer',
                    border:`2px solid ${role===r.key?r.color:'#f0f1f4'}`,
                    background:role===r.key?r.bg:'#feffff',transition:'all 0.15s'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'12px',background:role===r.key?r.grad:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'20px'}}>
                    {r.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:f(13),fontWeight:'800',color:role===r.key?r.color:'#02153f'}}>{r.label}</div>
                    <div style={{fontSize:f(10),color:'#7c8088',marginTop:'1px'}}>{r.sub}</div>
                  </div>
                  {role===r.key && <Check size={16} color={r.color}/>}
                </div>
              ))}
            </div>

            {/* Nome */}
            <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                {role==='toilet_writer' ? '🏷️ Intestatario del token' : '👤 Nome del collaboratore'}
              </div>
              {role==='toilet_writer' ? (<>
                <label style={lbSt}>Nome del paziente</label>
                <input value={intestatario} onChange={e=>setIntestatario(e.target.value)} placeholder="Es: Damiano Rossi"
                  style={{...inSt,marginBottom:'10px'}}
                  onFocus={e=>e.target.style.borderColor='#7B5EA7'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                <div style={{background:'#F5F3FF',borderRadius:'10px',padding:'10px 12px',fontSize:f(11),color:'#7B5EA7',lineHeight:'1.6',border:'1.5px solid #7B5EA722'}}>
                  🧑‍🏫 Questo token permette di <strong>registrare sessioni Toilet Training</strong> per il paziente indicato.
                </div>
              </>) : (<>
                <label style={lbSt}>{role==='viewer'?'Nome visualizzatore':'Nome medico/collaboratore'}</label>
                <input value={medicoName} onChange={e=>setMedico(e.target.value)}
                  placeholder={role==='viewer'?'Es: Nonna Maria':'Es: Dr. Rossi — Neurologo'}
                  style={inSt}
                  onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
              </>)}
            </div>

            {/* Durata */}
            <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                <Clock size={14} color="#193f9e" style={{marginRight:'6px',verticalAlign:'middle'}}/>
                Durata accesso
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
                {DURATE.map(({gg,label,sub})=>(
                  <div key={gg} onClick={()=>setGiorni(gg)} style={{
                    padding:'10px 6px',borderRadius:'12px',cursor:'pointer',textAlign:'center',
                    border:`2px solid ${giorni===gg?'#193f9e':'#f0f1f4'}`,
                    background:giorni===gg?'#EEF3FD':'#feffff',transition:'all 0.15s'
                  }}>
                    <div style={{fontSize:f(12),fontWeight:'800',color:giorni===gg?'#193f9e':'#02153f'}}>{label}</div>
                    <div style={{fontSize:f(9),color:'#7c8088',marginTop:'2px'}}>{sub}</div>
                  </div>
                ))}
              </div>
              {giorni===0 && (
                <div style={{marginTop:'10px',padding:'8px 12px',background:'#FFF5EE',borderRadius:'10px',fontSize:f(11),color:'#FF8C42',border:'1.5px solid #FF8C4222'}}>
                  ⚠️ Il token sarà valido per <strong>un solo accesso</strong>, dopodiché si disabilita automaticamente.
                </div>
              )}
            </div>

            {/* Permessi medico */}
            {role==='medico' && (
              <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>🔒 Dati da condividere</div>
                <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>Il medico vede solo ciò che selezioni</div>

                {PERMESSI_MEDICO.filter(p=>p.key!=='shareDocuments').map(({key,label,sub,color,bg,icon,locked})=>(
                  <div key={key} onClick={()=>!locked&&togglePerm(key)} style={{
                    display:'flex',alignItems:'center',gap:'12px',
                    padding:'11px 12px',borderRadius:'14px',marginBottom:'7px',
                    background:perms[key]?bg:'#f3f4f7',
                    border:`2px solid ${perms[key]?color+'33':'transparent'}`,
                    cursor:locked?'default':'pointer',transition:'all 0.15s'
                  }}>
                    <span style={{fontSize:'18px',width:'24px',textAlign:'center',flexShrink:0}}>{icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:f(13),fontWeight:'700',color:perms[key]?color:'#394058'}}>{label}</div>
                      <div style={{fontSize:f(10),color:'#7c8088',marginTop:'1px'}}>{locked?'Sempre incluso':sub}</div>
                    </div>
                    <div style={{width:'44px',height:'24px',borderRadius:'12px',background:perms[key]?color:'#dde0ed',position:'relative',flexShrink:0,transition:'background 0.2s'}}>
                      <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'#fff',position:'absolute',top:'3px',left:perms[key]?'23px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                    </div>
                  </div>
                ))}

                {/* Documenti granulari */}
                <div onClick={()=>togglePerm('shareDocuments')} style={{
                  display:'flex',alignItems:'center',gap:'12px',
                  padding:'11px 12px',borderRadius:perms.shareDocuments?'14px 14px 0 0':'14px',marginBottom:perms.shareDocuments?'0':'7px',
                  background:perms.shareDocuments?'#EEF3FD':'#f3f4f7',
                  border:`2px solid ${perms.shareDocuments?'#2e84e933':'transparent'}`,
                  borderBottom:perms.shareDocuments?'none':'',
                  cursor:'pointer',transition:'all 0.15s'
                }}>
                  <span style={{fontSize:'18px',width:'24px',textAlign:'center',flexShrink:0}}>📄</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:f(13),fontWeight:'700',color:perms.shareDocuments?'#2e84e9':'#394058'}}>Documenti</div>
                    <div style={{fontSize:f(10),color:'#7c8088',marginTop:'1px'}}>Seleziona documento per documento</div>
                  </div>
                  <div style={{width:'44px',height:'24px',borderRadius:'12px',background:perms.shareDocuments?'#2e84e9':'#dde0ed',position:'relative',flexShrink:0,transition:'background 0.2s'}}>
                    <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'#fff',position:'absolute',top:'3px',left:perms.shareDocuments?'23px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                  </div>
                </div>

                {perms.shareDocuments && (
                  <div style={{background:'#EEF3FD',borderRadius:'0 0 14px 14px',padding:'12px',marginBottom:'7px',border:'2px solid #2e84e933',borderTop:'none'}}>
                    <div style={{fontSize:f(11),fontWeight:'700',color:'#2e84e9',marginBottom:'8px'}}>
                      Seleziona i documenti ({(perms.selectedDocIds||[]).length} selezionati)
                    </div>
                    {documenti.length===0 ? (
                      <div style={{fontSize:f(11),color:'#bec1cc',textAlign:'center',padding:'8px'}}>Nessun documento disponibile</div>
                    ) : (<>
                      {(docsExpanded?documenti:documenti.slice(0,4)).map(d=>{
                        const id = d._firebaseKey||d.id
                        const sel = (perms.selectedDocIds||[]).includes(id)
                        return (
                          <div key={id} onClick={e=>{e.stopPropagation();toggleDoc(id)}} style={{
                            display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',
                            borderRadius:'10px',marginBottom:'5px',cursor:'pointer',
                            background:sel?'rgba(46,132,233,0.12)':'rgba(255,255,255,0.7)',
                            border:`1.5px solid ${sel?'#2e84e9':'transparent'}`,transition:'all 0.15s'
                          }}>
                            <div style={{width:'20px',height:'20px',borderRadius:'6px',border:`2px solid ${sel?'#2e84e9':'#bec1cc'}`,background:sel?'#2e84e9':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                              {sel&&<Check size={12} color="#fff"/>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:f(11),fontWeight:'700',color:sel?'#193f9e':'#02153f',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.nome}</div>
                              {d.data&&<div style={{fontSize:f(9),color:'#7c8088'}}>{d.data}</div>}
                            </div>
                          </div>
                        )
                      })}
                      {documenti.length>4&&(
                        <button type="button" onClick={e=>{e.stopPropagation();setDocsExpanded(v=>!v)}} style={{
                          width:'100%',padding:'7px',borderRadius:'10px',border:'none',cursor:'pointer',
                          background:'rgba(46,132,233,0.1)',color:'#2e84e9',fontWeight:'700',fontSize:f(11),
                          display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',fontFamily:'inherit',marginTop:'4px'
                        }}>
                          {docsExpanded?<><ChevronUp size={13}/> Mostra meno</>:<><ChevronDown size={13}/> Vedi tutti ({documenti.length})</>}
                        </button>
                      )}
                    </>)}
                  </div>
                )}

                {/* Disclaimer chat */}
                {perms.shareChat && (
                  <div style={{background:'#FFF5EE',borderRadius:'12px',padding:'10px 12px',marginTop:'4px',border:'1.5px solid #FF8C4244',display:'flex',gap:'8px',alignItems:'flex-start'}}>
                    <AlertCircle size={14} color="#FF8C42" style={{flexShrink:0,marginTop:'1px'}}/>
                    <div style={{fontSize:f(10),color:'#8B6914',lineHeight:'1.6'}}>
                      I messaggi in chat sono <strong>permanenti, non eliminabili e non recuperabili</strong> se persi. DamiAPP non è responsabile del contenuto della chat. La chat non sostituisce una visita medica.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Viewer — info permessi fissi */}
            {role==='viewer' && (
              <div style={{background:'#E8FBF8',borderRadius:'14px',padding:'12px 14px',marginBottom:'10px',border:'1.5px solid #00BFA622'}}>
                <div style={{fontSize:f(12),fontWeight:'700',color:'#00BFA6',marginBottom:'6px'}}>👁️ Il visualizzatore vedrà:</div>
                {['Crisi (riepilogo ultima settimana)','Terapie del giorno','Toilet Training (grafici aggregati)','Statistiche riassuntive'].map((v,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'4px'}}>
                    <Check size={13} color="#00BFA6"/>
                    <span style={{fontSize:f(12),color:'#394058'}}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Riepilogo + genera */}
            <div style={{background:'#EEF3FD',borderRadius:'14px',padding:'12px 14px',marginBottom:'12px',border:'1.5px solid #193f9e22'}}>
              <div style={{fontSize:f(12),fontWeight:'700',color:'#193f9e',marginBottom:'4px'}}>Riepilogo accesso</div>
              <div style={{fontSize:f(12),color:'#394058',lineHeight:'1.6'}}>
                <strong>{role==='toilet_writer'?(intestatario||'(nome mancante)'):(medicoName||'(nome mancante)')}</strong>
                {' · '}{getRuolo(role).label}{' · '}{DURATE.find(d=>d.gg===giorni)?.label}
                {role==='medico'&&` · ${PERMESSI_MEDICO.filter(p=>perms[p.key]).length} sezioni`}
                {role==='medico'&&perms.shareDocuments&&` · ${(perms.selectedDocIds||[]).length} doc`}
              </div>
            </div>

            <button type="button" onClick={handleGenera} style={{
              width:'100%',padding:'16px',borderRadius:'50px',border:'none',cursor:'pointer',
              fontWeight:'800',fontSize:f(15),color:'#fff',
              background:'linear-gradient(135deg,#193f9e,#2e84e9)',
              boxShadow:'0 6px 20px rgba(25,63,158,0.35)',
              display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'
            }}>
              🔗 Genera token
            </button>
            {isDemo&&<div style={{textAlign:'center',marginTop:'10px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Modalità demo — token non salvato</div>}
          </>)}

          {/* ════ TOKEN GENERATO ════ */}
          {sezione==='generato' && tokenGenerato && (<>
            <div style={{background:'#feffff',borderRadius:'18px',padding:'20px',boxShadow:sh,marginBottom:'10px'}}>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <div style={{width:'64px',height:'64px',borderRadius:'50%',background:getRuolo(tokenGenerato.role).grad,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:'28px',boxShadow:'0 6px 20px rgba(0,0,0,0.15)'}}>
                  {getRuolo(tokenGenerato.role).icon}
                </div>
                <div style={{fontSize:f(20),fontWeight:'900',color:'#08184c',marginBottom:'4px'}}>Token generato!</div>
                <div style={{fontSize:f(12),color:'#7c8088'}}>Comunica questo codice a {tokenGenerato.medicoName||tokenGenerato.intestatario}</div>
                <span style={{display:'inline-block',marginTop:'6px',fontSize:f(11),fontWeight:'700',padding:'3px 10px',borderRadius:'20px',background:getRuolo(tokenGenerato.role).bg,color:getRuolo(tokenGenerato.role).color}}>
                  {getRuolo(tokenGenerato.role).label}
                </span>
              </div>

              <div style={{background:'#f3f4f7',borderRadius:'16px',padding:'22px',textAlign:'center',marginBottom:'14px',border:'2px dashed #193f9e44'}}>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:f(28),fontWeight:'900',color:'#193f9e',letterSpacing:'4px',marginBottom:'6px'}}>
                  {tokenGenerato.token}
                </div>
                <div style={{fontSize:f(11),color:'#7c8088'}}>
                  {tokenGenerato.usaEGetta ? '⚠️ Una tantum — scade dopo il primo accesso'
                    : tokenGenerato.expiresAt ? `Valido fino al ${new Date(tokenGenerato.expiresAt).toLocaleDateString('it-IT')}`
                    : 'Nessuna scadenza'}
                </div>
              </div>

              {tokenGenerato.role==='medico' && (
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:f(12),fontWeight:'700',color:'#7c8088',marginBottom:'7px'}}>Dati condivisi</div>
                  <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                    {PERMESSI_MEDICO.filter(p=>tokenGenerato.permissions?.[p.key]).map(p=>(
                      <span key={p.key} style={{fontSize:f(10),fontWeight:'700',padding:'3px 9px',borderRadius:'20px',background:p.bg,color:p.color}}>{p.icon} {p.label}</span>
                    ))}
                    {(tokenGenerato.permissions?.selectedDocIds||[]).length>0 && (
                      <span style={{fontSize:f(10),fontWeight:'700',padding:'3px 9px',borderRadius:'20px',background:'#EEF3FD',color:'#2e84e9'}}>
                        📄 {tokenGenerato.permissions.selectedDocIds.length} doc
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button type="button" onClick={()=>handleCopy(tokenGenerato.token)} style={{
                width:'100%',padding:'14px',borderRadius:'50px',border:'none',cursor:'pointer',
                fontWeight:'800',fontSize:f(14),fontFamily:'inherit',
                background:copied?'linear-gradient(135deg,#00BFA6,#2e84e9)':'#EEF3FD',
                color:copied?'#fff':'#193f9e',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
                marginBottom:'8px',transition:'all 0.25s'
              }}>
                {copied?<><Check size={16}/> Copiato negli appunti!</>:<><Copy size={16}/> Copia token</>}
              </button>
              <button type="button" onClick={()=>setSezione('lista')} style={{
                width:'100%',padding:'14px',borderRadius:'50px',border:'none',cursor:'pointer',
                fontWeight:'800',fontSize:f(14),fontFamily:'inherit',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',color:'#fff',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)'
              }}>
                Torna alla lista token
              </button>
            </div>

            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:shSm}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>📋 Istruzioni</div>
              {[
                {n:'1',txt:`Apri il sito ${typeof window!=='undefined'?window.location.origin:'damiapp2026.netlify.app'}`},
                {n:'2',txt:`Seleziona "${getRuolo(tokenGenerato.role).label}" nella schermata di accesso`},
                {n:'3',txt:`Inserisci il token: ${tokenGenerato.token}`},
                {n:'4',txt:tokenGenerato.role==='toilet_writer'?'Registra le sessioni Toilet Training':'Accedi in sola lettura ai dati condivisi'},
              ].map(({n,txt})=>(
                <div key={n} style={{display:'flex',gap:'10px',marginBottom:'8px',alignItems:'flex-start'}}>
                  <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'linear-gradient(135deg,#193f9e,#2e84e9)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:f(10),fontWeight:'900',color:'#fff'}}>{n}</span>
                  </div>
                  <span style={{fontSize:f(12),color:'#394058',lineHeight:'1.5',paddingTop:'2px'}}>{txt}</span>
                </div>
              ))}
            </div>
            {isDemo&&<div style={{textAlign:'center',marginTop:'12px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Demo — token non salvato</div>}
          </>)}

        </div>
      </div>
    </>
  )
}

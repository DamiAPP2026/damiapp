import { useState, useEffect } from 'react'
import { ChevronLeft, Copy, Trash2, Check, Plus, Shield, Clock, Eye, EyeOff } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, set } from 'firebase/database'
import { encrypt, processFirebaseSnap } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
  return `DMI${rand(4)}${rand(5)}`
}

const DURATE = [
  {gg:7,   label:'7 giorni',   sub:'Visita rapida'},
  {gg:30,  label:'30 giorni',  sub:'Un mese'},
  {gg:90,  label:'3 mesi',     sub:'Trimestrale'},
  {gg:180, label:'6 mesi',     sub:'Semestrale'},
  {gg:365, label:'1 anno',     sub:'Annuale'},
  {gg:9999,label:'Illimitato', sub:'Senza scadenza'},
]

const PERMESSI_CONFIG = [
  {key:'shareCrises',    label:'Crisi epilettiche', sub:'Registro completo crisi',         color:'#F7295A', bg:'#FEF0F4',  locked:true},
  {key:'shareTerapie',   label:'Terapie',           sub:'Farmaci e orari',                 color:'#00BFA6', bg:'#E8FBF8',  locked:false},
  {key:'shareToilet',    label:'Toilet Training',   sub:'Sessioni e grafici',              color:'#7B5EA7', bg:'#F5F3FF',  locked:false},
  {key:'shareDocuments', label:'Documenti medici',  sub:'Referti e certificati',           color:'#2e84e9', bg:'#EEF3FD',  locked:false},
  {key:'shareContacts',  label:'Rubrica',           sub:'Contatti e riferimenti',          color:'#FF8C42', bg:'#FFF5EE',  locked:false},
]

const DEMO_TOKENS = [
  {
    id:1, medicoName:'Dr. Bianchi', token:'DMIABC12345', active:true,
    createdAt:Date.now()-10*86400000, expiresAt:Date.now()+80*86400000,
    permissions:{shareCrises:true,shareTerapie:true,shareToilet:false,shareDocuments:false,shareContacts:false},
    accessLogs:[{at:Date.now()-2*86400000}],
    _firebaseKey:'demo1'
  },
  {
    id:2, medicoName:'Dr. Verdi', token:'DMIXYZ98765', active:false,
    createdAt:Date.now()-100*86400000, expiresAt:Date.now()-10*86400000,
    permissions:{shareCrises:true,shareTerapie:false,shareToilet:false,shareDocuments:false,shareContacts:false},
    accessLogs:[],
    _firebaseKey:'demo2'
  },
]

export default function CondividiPage({ onBack, isDemo }) {
  const [tokens, setTokens]     = useState([])
  const [sezione, setSezione]   = useState('lista')   // lista | nuovo | generato
  const [medicoName, setMedico] = useState('')
  const [giorni, setGiorni]     = useState(90)
  const [perms, setPerms]       = useState({
    shareCrises:true, shareTerapie:false,
    shareToilet:false, shareDocuments:false, shareContacts:false
  })
  const [tokenGenerato, setTokenGen] = useState(null)
  const [copied, setCopied]          = useState(false)
  const [tokenVisible, setVisible]   = useState({})

  useEffect(() => {
    if (isDemo) { setTokens(DEMO_TOKENS); return }
    const tRef = ref(db,'sharetokens')
    const unsub = onValue(tRef, snap => {
      const lista = processFirebaseSnap(snap).sort((a,b)=>b.createdAt-a.createdAt)
      setTokens(lista)
    })
    return () => unsub()
  }, [isDemo])

  function handleGenera() {
    if (!medicoName.trim()) { alert('Inserisci il nome del medico'); return }
    const token = generateToken()
    const durataGG = giorni
    const nuovoToken = {
      id: Date.now(),
      medicoName: medicoName.trim(),
      token,
      active: true,
      createdAt: Date.now(),
      expiresAt: durataGG===9999 ? null : Date.now()+durataGG*86400000,
      permissions: perms,
      accessLogs: [],
    }
    if (!isDemo) push(ref(db,'sharetokens'), encrypt(nuovoToken))
    setTokenGen(nuovoToken)
    setSezione('generato')
  }

  function handleRevoca(t) {
    if (!window.confirm(`Revocare l'accesso a ${t.medicoName}?`)) return
    if (!isDemo && t._firebaseKey) {
      const updated = {...t, active:false}
      delete updated._firebaseKey
      set(ref(db,`sharetokens/${t._firebaseKey}`), encrypt(updated))
    } else {
      setTokens(prev=>prev.map(tk=>tk.id===t.id?{...tk,active:false}:tk))
    }
  }

  function handleCopy(token) {
    navigator.clipboard?.writeText(token).catch(()=>{})
    setCopied(true)
    setTimeout(()=>setCopied(false), 2500)
  }

  function toggleVisible(id) {
    setVisible(prev=>({...prev,[id]:!prev[id]}))
  }

  const attivi   = tokens.filter(t=>t.active && (t.expiresAt===null||t.expiresAt>Date.now()))
  const scaduti  = tokens.filter(t=>!t.active || (t.expiresAt&&t.expiresAt<=Date.now()))

  function giorniRimanenti(t) {
    if (!t.expiresAt) return null
    return Math.max(0, Math.ceil((t.expiresAt-Date.now())/86400000))
  }

  function colorScadenza(gg) {
    if (gg===null) return '#00BFA6'
    if (gg<=7) return '#F7295A'
    if (gg<=30) return '#FF8C42'
    return '#00BFA6'
  }

  const inputStyle = {
    width:'100%', padding:'12px 14px', borderRadius:'12px',
    border:'1.5px solid #f0f1f4', fontSize:f(14), color:'#02153f',
    background:'#f3f4f7', fontFamily:'inherit', outline:'none', boxSizing:'border-box'
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}
        .cw{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="cw">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#193f9e,#2e84e9)',padding:'14px 16px 22px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <button onClick={sezione==='lista'?onBack:()=>setSezione('lista')} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>🔗 Condividi dati</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                {sezione==='lista'?'Accessi medici':sezione==='nuovo'?'Nuovo accesso':'Token generato!'}
              </div>
            </div>
          </div>

          {/* Stats header */}
          {sezione==='lista' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
              {[
                {label:'Token attivi',val:attivi.length,color:'#fff'},
                {label:'Accessi totali',val:tokens.reduce((s,t)=>(s+(t.accessLogs?.length||0)),0),color:'#fff'},
                {label:'Revocati',val:scaduti.length,color:scaduti.length>0?'#FFD93D':'#fff'},
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

          {/* ── LISTA TOKEN ── */}
          {sezione==='lista' && (
            <>
              {/* Info box */}
              <div style={{background:'#EEF3FD',borderRadius:'14px',padding:'12px 14px',marginBottom:'12px',border:'1.5px solid #193f9e22',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                <Shield size={18} color="#193f9e" style={{flexShrink:0,marginTop:'1px'}}/>
                <div style={{fontSize:f(12),color:'#193f9e',lineHeight:'1.6'}}>
                  Il medico accede in <strong>sola lettura</strong> ai dati selezionati. Puoi revocare l'accesso in qualsiasi momento.
                </div>
              </div>

              {/* Pulsante nuovo token */}
              <button onClick={()=>{setSezione('nuovo');setMedico('');setGiorni(90);setPerms({shareCrises:true,shareTerapie:false,shareToilet:false,shareDocuments:false,shareContacts:false})}} style={{
                width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',
                fontWeight:'800',fontSize:f(15),color:'#fff',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'16px'
              }}>
                <Plus size={18} color="#fff"/> Genera nuovo token medico
              </button>

              {/* Token attivi */}
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>
                🔐 Token attivi ({attivi.length})
              </div>
              {attivi.length===0 ? (
                <div style={{background:'#feffff',borderRadius:'16px',padding:'28px',textAlign:'center',boxShadow:shSm,marginBottom:'12px'}}>
                  <div style={{fontSize:'32px',marginBottom:'10px'}}>🔗</div>
                  <div style={{fontSize:f(13),color:'#7c8088',marginBottom:'4px'}}>Nessun token attivo</div>
                  <div style={{fontSize:f(11),color:'#bec1cc'}}>Genera un token per condividere i dati con il medico</div>
                </div>
              ) : (
                attivi.map(t=>{
                  const gg = giorniRimanenti(t)
                  const col = colorScadenza(gg)
                  const vis = tokenVisible[t.id]
                  const tokenDisplay = vis ? t.token : t.token.slice(0,3)+'••••••••'
                  return (
                    <div key={t.id} style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                        <div>
                          <div style={{fontSize:f(15),fontWeight:'800',color:'#02153f'}}>👨‍⚕️ {t.medicoName}</div>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'5px'}}>
                            <div style={{fontFamily:"'Courier New',monospace",fontSize:f(15),fontWeight:'700',color:'#193f9e',letterSpacing:'2px'}}>
                              {tokenDisplay}
                            </div>
                            <button onClick={()=>toggleVisible(t.id)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',display:'flex',alignItems:'center'}}>
                              {vis?<EyeOff size={14} color="#7c8088"/>:<Eye size={14} color="#7c8088"/>}
                            </button>
                          </div>
                        </div>
                        <button onClick={()=>handleRevoca(t)} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <Trash2 size={14} color="#F7295A"/>
                        </button>
                      </div>

                      {/* Permessi badge */}
                      <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'10px'}}>
                        {PERMESSI_CONFIG.filter(p=>t.permissions?.[p.key]).map(p=>(
                          <span key={p.key} style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:p.bg,color:p.color}}>
                            {p.label}
                          </span>
                        ))}
                      </div>

                      {/* Info scadenza + accessi */}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                          <Clock size={12} color={col}/>
                          <span style={{fontSize:f(11),color:col,fontWeight:'700'}}>
                            {gg===null?'Nessuna scadenza':gg===0?'Scade oggi':`${gg} giorni rimanenti`}
                          </span>
                        </div>
                        <span style={{fontSize:f(10),color:'#bec1cc'}}>
                          {t.accessLogs?.length||0} accessi
                        </span>
                      </div>

                      {/* Azioni */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>
                        <button onClick={()=>handleCopy(t.token)} style={{
                          padding:'9px',borderRadius:'50px',border:'none',cursor:'pointer',
                          fontWeight:'700',fontSize:f(11),fontFamily:'inherit',
                          background:copied?'#E8FBF8':'#EEF3FD',
                          color:copied?'#00BFA6':'#193f9e',
                          display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'
                        }}>
                          {copied?<><Check size={13} color="#00BFA6"/> Copiato!</>:<><Copy size={13} color="#193f9e"/> Copia token</>}
                        </button>
                        <button onClick={()=>handleRevoca(t)} style={{
                          padding:'9px',borderRadius:'50px',border:'none',cursor:'pointer',
                          fontWeight:'700',fontSize:f(11),fontFamily:'inherit',
                          background:'#FEF0F4',color:'#F7295A',
                          display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'
                        }}>
                          <Trash2 size={13} color="#F7295A"/> Revoca
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Token scaduti/revocati */}
              {scaduti.length>0 && (
                <>
                  <div style={{fontSize:f(13),fontWeight:'800',color:'#bec1cc',margin:'16px 0 8px'}}>
                    Revocati / Scaduti ({scaduti.length})
                  </div>
                  {scaduti.map(t=>(
                    <div key={t.id} style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px 14px',marginBottom:'7px',opacity:0.65}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <div style={{fontSize:f(13),fontWeight:'700',color:'#7c8088'}}>👨‍⚕️ {t.medicoName}</div>
                          <div style={{fontFamily:"'Courier New',monospace",fontSize:f(12),color:'#bec1cc',marginTop:'3px',letterSpacing:'1px'}}>
                            {t.token}
                          </div>
                        </div>
                        <span style={{fontSize:f(10),fontWeight:'700',padding:'3px 9px',borderRadius:'20px',background:'#FEF0F4',color:'#F7295A'}}>
                          Revocato
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── NUOVO TOKEN — WIZARD ── */}
          {sezione==='nuovo' && (
            <>
              {/* Nome medico */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>👨‍⚕️ Chi è il medico?</div>
                <input
                  value={medicoName} onChange={e=>setMedico(e.target.value)}
                  placeholder="Es: Dr. Rossi — Neurologo"
                  style={inputStyle}
                  onFocus={e=>e.target.style.borderColor='#2e84e9'}
                  onBlur={e=>e.target.style.borderColor='#f0f1f4'}
                />
              </div>

              {/* Durata */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                  <Clock size={15} color="#193f9e" style={{marginRight:'6px',verticalAlign:'middle'}}/>
                  Durata accesso
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px'}}>
                  {DURATE.map(({gg,label,sub})=>(
                    <div key={gg} onClick={()=>setGiorni(gg)} style={{
                      padding:'10px 8px',borderRadius:'12px',cursor:'pointer',textAlign:'center',
                      border:`2px solid ${giorni===gg?'#193f9e':'#f0f1f4'}`,
                      background:giorni===gg?'#EEF3FD':'#feffff',
                      transition:'all 0.15s'
                    }}>
                      <div style={{fontSize:f(12),fontWeight:'800',color:giorni===gg?'#193f9e':'#02153f'}}>{label}</div>
                      <div style={{fontSize:f(9),color:'#7c8088',marginTop:'2px'}}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permessi */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'14px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>🔒 Dati da condividere</div>
                <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>Il medico vedrà solo i dati che selezioni</div>
                {PERMESSI_CONFIG.map(({key,label,sub,color,bg,locked})=>(
                  <div key={key} onClick={()=>!locked&&setPerms(p=>({...p,[key]:!p[key]}))} style={{
                    display:'flex',alignItems:'center',gap:'12px',
                    padding:'12px',borderRadius:'14px',marginBottom:'7px',
                    background:perms[key]?bg:'#f3f4f7',
                    border:`2px solid ${perms[key]?color+'33':'transparent'}`,
                    cursor:locked?'default':'pointer',
                    transition:'all 0.15s'
                  }}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:f(13),fontWeight:'700',color:perms[key]?color:'#394058'}}>{label}</div>
                      <div style={{fontSize:f(10),color:'#7c8088',marginTop:'1px'}}>
                        {locked?'Sempre incluso — obbligatorio':sub}
                      </div>
                    </div>
                    <div style={{width:'48px',height:'26px',borderRadius:'13px',background:perms[key]?color:'#dde0ed',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                      <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'3px',left:perms[key]?'25px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Riepilogo + Genera */}
              <div style={{background:'#EEF3FD',borderRadius:'14px',padding:'12px 14px',marginBottom:'12px',border:'1.5px solid #193f9e22'}}>
                <div style={{fontSize:f(12),fontWeight:'700',color:'#193f9e',marginBottom:'4px'}}>Riepilogo accesso</div>
                <div style={{fontSize:f(12),color:'#394058'}}>
                  <strong>{medicoName||'(nome mancante)'}</strong> · {DURATE.find(d=>d.gg===giorni)?.label} · {PERMESSI_CONFIG.filter(p=>perms[p.key]).length} sezioni condivise
                </div>
              </div>

              <button onClick={handleGenera} style={{
                width:'100%',padding:'16px',borderRadius:'50px',border:'none',cursor:'pointer',
                fontWeight:'800',fontSize:f(15),color:'#fff',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'
              }}>
                🔗 Genera token
              </button>
              {isDemo&&<div style={{textAlign:'center',marginTop:'10px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Modalità demo — token non salvato</div>}
            </>
          )}

          {/* ── TOKEN GENERATO ── */}
          {sezione==='generato' && tokenGenerato && (
            <>
              <div style={{background:'#feffff',borderRadius:'18px',padding:'20px',boxShadow:sh,marginBottom:'10px'}}>
                <div style={{textAlign:'center',marginBottom:'20px'}}>
                  <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg,#00BFA6,#2e84e9)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',boxShadow:'0 6px 20px rgba(0,191,166,0.35)'}}>
                    <Check size={30} color="#fff" strokeWidth={3}/>
                  </div>
                  <div style={{fontSize:f(20),fontWeight:'900',color:'#08184c',marginBottom:'4px'}}>Token generato!</div>
                  <div style={{fontSize:f(12),color:'#7c8088'}}>Comunica questo codice a {tokenGenerato.medicoName}</div>
                </div>

                {/* Token display grande */}
                <div style={{background:'#f3f4f7',borderRadius:'16px',padding:'22px',textAlign:'center',marginBottom:'14px',border:'2px dashed #193f9e44'}}>
                  <div style={{fontFamily:"'Courier New',monospace",fontSize:f(28),fontWeight:'900',color:'#193f9e',letterSpacing:'4px',marginBottom:'6px'}}>
                    {tokenGenerato.token}
                  </div>
                  <div style={{fontSize:f(11),color:'#7c8088'}}>
                    {tokenGenerato.expiresAt
                      ? `Valido fino al ${new Date(tokenGenerato.expiresAt).toLocaleDateString('it-IT')}`
                      : 'Nessuna scadenza'
                    }
                  </div>
                </div>

                {/* Permessi inclusi */}
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:f(12),fontWeight:'700',color:'#7c8088',marginBottom:'7px'}}>Dati condivisi</div>
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                    {PERMESSI_CONFIG.filter(p=>tokenGenerato.permissions?.[p.key]).map(p=>(
                      <span key={p.key} style={{fontSize:f(11),fontWeight:'700',padding:'3px 10px',borderRadius:'20px',background:p.bg,color:p.color}}>
                        ✓ {p.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Copia */}
                <button onClick={()=>handleCopy(tokenGenerato.token)} style={{
                  width:'100%',padding:'14px',borderRadius:'50px',border:'none',cursor:'pointer',
                  fontWeight:'800',fontSize:f(14),fontFamily:'inherit',
                  background:copied?'linear-gradient(135deg,#00BFA6,#2e84e9)':'#EEF3FD',
                  color:copied?'#fff':'#193f9e',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
                  marginBottom:'8px',transition:'all 0.25s'
                }}>
                  {copied?<><Check size={16} color="#fff"/> Copiato negli appunti!</>:<><Copy size={16} color="#193f9e"/> Copia token</>}
                </button>

                <button onClick={()=>setSezione('lista')} style={{
                  width:'100%',padding:'14px',borderRadius:'50px',border:'none',cursor:'pointer',
                  fontWeight:'800',fontSize:f(14),fontFamily:'inherit',
                  background:'linear-gradient(135deg,#193f9e,#2e84e9)',color:'#fff',
                  boxShadow:'0 6px 20px rgba(25,63,158,0.35)'
                }}>
                  Torna alla lista token
                </button>
              </div>

              {/* Istruzioni per il medico */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:shSm}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>📋 Istruzioni per il medico</div>
                {[
                  {n:'1',txt:`Apri il sito ${window.location.origin||'damiapp2026.netlify.app'}`},
                  {n:'2',txt:'Seleziona la scheda "Medico" nella schermata di accesso'},
                  {n:'3',txt:`Inserisci il token: ${tokenGenerato.token}`},
                  {n:'4',txt:'Accedi in sola lettura ai dati condivisi'},
                ].map(({n,txt})=>(
                  <div key={n} style={{display:'flex',gap:'10px',marginBottom:'8px',alignItems:'flex-start'}}>
                    <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'linear-gradient(135deg,#193f9e,#2e84e9)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontSize:f(10),fontWeight:'900',color:'#fff'}}>{n}</span>
                    </div>
                    <span style={{fontSize:f(12),color:'#394058',lineHeight:'1.5',paddingTop:'2px'}}>{txt}</span>
                  </div>
                ))}
              </div>

              {isDemo&&<div style={{textAlign:'center',marginTop:'12px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Modalità demo — token non salvato su Firebase</div>}
            </>
          )}

        </div>
      </div>
    </>
  )
}
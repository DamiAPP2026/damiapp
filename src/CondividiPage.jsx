import { useState, useEffect } from 'react'
import { ChevronLeft, Copy, Trash2, Check, Plus } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, set } from 'firebase/database'
import { encrypt, decrypt } from './crypto'

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'
const f = (base) => `${Math.round(base * 1.15)}px`

function generateToken() {
  return 'DMI' + Math.random().toString(36).substr(2, 9).toUpperCase()
}

const DURATE = [
  {g:1, label:'1 giorno'},
  {g:10, label:'10 giorni'},
  {g:30, label:'30 giorni'},
  {g:60, label:'60 giorni'},
  {g:180, label:'6 mesi'},
  {g:365, label:'1 anno'},
]

const PERMESSI_CONFIG = [
  {key:'shareCrises', label:'🚨 Crisi epilettiche', sub:'Registro crisi e durate', color:'#F7295A', locked:true},
  {key:'shareTerapie', label:'💊 Terapie', sub:'Farmaci e orari', color:'#00BFA6'},
  {key:'shareToilet', label:'🚽 Toilet Training', sub:'Sessioni e incidenti', color:'#7B5EA7'},
  {key:'shareDocuments', label:'📄 Documenti medici', sub:'Referti e visite', color:'#2e84e9'},
  {key:'shareContacts', label:'📞 Contatti', sub:'Rubrica medici', color:'#FF8C42'},
]

const DEMO_TOKENS = [
  {
    id:1, medicoName:'Dr. Rossi', token:'DMIABCD12345', active:true,
    createdAt:new Date().toLocaleString('it-IT'),
    expiresAt:new Date(Date.now()+60*86400000).toISOString(),
    permissions:{shareCrises:true,shareTerapie:true,shareToilet:false,shareDocuments:false,shareContacts:false}
  }
]

export default function CondividiPage({ onBack, isDemo }) {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [medicoName, setMedicoName] = useState('')
  const [giorni, setGiorni] = useState(30)
  const [perms, setPerms] = useState({
    shareCrises:true,
    shareTerapie:false,
    shareToilet:false,
    shareDocuments:false,
    shareContacts:false,
  })
  const [tokenGenerato, setTokenGenerato] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isDemo) { setTokens(DEMO_TOKENS); setLoading(false); return }
    const tRef = ref(db, 'sharetokens')
    const unsubscribe = onValue(tRef, (snapshot) => {
      const val = snapshot.val()
      if (val) {
        const lista = []
        Object.entries(val).forEach(([key, encData]) => {
          const t = typeof encData === 'object' ? encData : decrypt(encData)
          if (t) lista.push({...t, _firebaseKey:key})
        })
        setTokens(lista.sort((a,b)=>(b.id||0)-(a.id||0)))
      } else {
        setTokens([])
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [isDemo])

  function handleGenera() {
    if (!medicoName.trim()) { alert('Inserisci il nome del medico'); return }
    const nuovoToken = {
      id: Date.now(),
      token: generateToken(),
      medicoName: medicoName.trim(),
      createdAt: new Date().toLocaleString('it-IT'),
      expiresAt: new Date(Date.now()+giorni*86400000).toISOString(),
      active: true,
      permissions: perms,
      accessLogs: []
    }
    if (!isDemo) push(ref(db,'sharetokens'), encrypt(nuovoToken))
    setTokenGenerato(nuovoToken)
    setStep(2)
  }

  function handleRevoca(t) {
    if (!window.confirm(`Revocare l'accesso a ${t.medicoName}?`)) return
    if (!isDemo && t._firebaseKey) {
      const aggiornato = {...t, active:false}
      delete aggiornato._firebaseKey
      set(ref(db,`sharetokens/${t._firebaseKey}`), encrypt(aggiornato))
    }
    setTokens(prev=>prev.map(tk=>tk.id===t.id?{...tk,active:false}:tk))
  }

  function handleCopy(token) {
    navigator.clipboard?.writeText(token).then(()=>{
      setCopied(true); setTimeout(()=>setCopied(false),2000)
    })
  }

  function resetWizard() {
    setStep(0); setMedicoName(''); setGiorni(30)
    setPerms({shareCrises:true,shareTerapie:false,shareToilet:false,shareDocuments:false,shareContacts:false})
    setTokenGenerato(null); setCopied(false)
  }

  function getPermessiLabel(permissions) {
    const attivi = PERMESSI_CONFIG.filter(p=>permissions?.[p.key])
    return attivi.map(p=>p.label.split(' ').slice(1).join(' ')).join(', ')
  }

  const activeTokens = tokens.filter(t=>t.active)
  const revokedTokens = tokens.filter(t=>!t.active)

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'12px'}}>🔗</div>
        <div style={{fontSize:f(14),color:'#7c8088'}}>Caricamento...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}
        .cond-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="cond-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#193f9e,#2e84e9)',padding:'14px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <button onClick={step>0?resetWizard:onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>🔗 Condividi dati</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                {step===0?'Gestisci accessi medici':step===1?'Nuovo accesso medico':'✅ Token generato!'}
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* ── STEP 0: LISTA TOKEN ── */}
          {step===0&&(
            <>
              <div style={{background:'#EEF3FD',borderRadius:'14px',padding:'12px 14px',marginBottom:'12px',border:'1.5px solid #193f9e22',fontSize:f(12),color:'#193f9e',lineHeight:'1.6'}}>
                ℹ️ Genera un token sicuro da condividere con il tuo medico. Il medico avrà accesso in <strong>sola lettura</strong> ai dati che scegli tu.
              </div>

              <button onClick={()=>setStep(1)} style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:'linear-gradient(135deg,#193f9e,#2e84e9)',boxShadow:'0 6px 20px rgba(25,63,158,0.35)',marginBottom:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                <Plus size={18} color="#fff"/>
                Genera nuovo token medico
              </button>

              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>
                🔐 Token attivi ({activeTokens.length})
              </div>

              {activeTokens.length===0?(
                <div style={{background:'#feffff',borderRadius:'14px',padding:'24px',textAlign:'center',boxShadow:shSm,marginBottom:'10px'}}>
                  <div style={{fontSize:'28px',marginBottom:'8px'}}>🔗</div>
                  <div style={{fontSize:f(13),color:'#7c8088'}}>Nessun token attivo</div>
                  <div style={{fontSize:f(11),color:'#bec1cc',marginTop:'4px'}}>Genera un token per condividere i dati col medico</div>
                </div>
              ):(
                activeTokens.map(t=>{
                  const scadenza = t.expiresAt?new Date(t.expiresAt):null
                  const gg = scadenza?Math.ceil((scadenza-Date.now())/86400000):null
                  const permessiAttivi = PERMESSI_CONFIG.filter(p=>t.permissions?.[p.key])
                  return (
                    <div key={t.id} style={{background:'#feffff',borderRadius:'16px',padding:'14px',marginBottom:'8px',boxShadow:sh}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                        <div>
                          <div style={{fontSize:f(14),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>👨‍⚕️ {t.medicoName}</div>
                          <div style={{fontFamily:"'Courier New',monospace",fontSize:f(17),fontWeight:'700',color:'#193f9e',letterSpacing:'2px'}}>{t.token}</div>
                        </div>
                        <button onClick={()=>handleRevoca(t)} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <Trash2 size={14} color="#F7295A"/>
                        </button>
                      </div>

                      {/* Permessi badge */}
                      <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'8px'}}>
                        {permessiAttivi.map(p=>(
                          <span key={p.key} style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:`${p.color}15`,color:p.color}}>
                            {p.label}
                          </span>
                        ))}
                        <span style={{fontSize:f(10),fontWeight:'600',padding:'2px 8px',borderRadius:'20px',background:'#f3f4f7',color:'#7c8088'}}>
                          👁 Sola lettura
                        </span>
                      </div>

                      <div style={{fontSize:f(11),color:gg!==null&&gg<10?'#F7295A':'#7c8088',marginBottom:'10px'}}>
                        ⏳ {gg!==null?`Scade tra ${gg} giorni`:'Nessuna scadenza'}
                      </div>

                      <button onClick={()=>handleCopy(t.token)} style={{width:'100%',padding:'10px',borderRadius:'12px',border:'none',cursor:'pointer',background:'#EEF3FD',color:'#193f9e',fontWeight:'700',fontSize:f(12),display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                        <Copy size={14} color="#193f9e"/>
                        Copia token
                      </button>
                    </div>
                  )
                })
              )}

              {revokedTokens.length>0&&(
                <>
                  <div style={{fontSize:f(13),fontWeight:'800',color:'#bec1cc',margin:'12px 0 8px'}}>
                    Accessi revocati ({revokedTokens.length})
                  </div>
                  {revokedTokens.map(t=>(
                    <div key={t.id} style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px',marginBottom:'6px',opacity:0.6}}>
                      <div style={{fontSize:f(13),fontWeight:'700',color:'#7c8088'}}>👨‍⚕️ {t.medicoName}</div>
                      <div style={{fontFamily:"'Courier New',monospace",fontSize:f(13),color:'#bec1cc',marginTop:'2px'}}>{t.token}</div>
                      <div style={{fontSize:f(10),color:'#bec1cc',marginTop:'4px'}}>❌ Accesso revocato</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── STEP 1: WIZARD ── */}
          {step===1&&(
            <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',boxShadow:sh}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'16px'}}>
                👨‍⚕️ Dati del medico
              </div>

              {/* Nome */}
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'6px'}}>
                  Nome del medico / professionista *
                </div>
                <input value={medicoName} onChange={e=>setMedicoName(e.target.value)}
                  placeholder="Es: Dr. Rossi, Dott.ssa Bianchi..." autoFocus
                  style={{width:'100%',padding:'12px',borderRadius:'12px',border:'1.5px solid #f0f1f4',fontSize:f(14),color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor='#2e84e9'}
                  onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
              </div>

              {/* Durata */}
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'8px'}}>
                  Durata accesso
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px'}}>
                  {DURATE.map(({g,label})=>(
                    <div key={g} onClick={()=>setGiorni(g)} style={{
                      padding:'10px 6px',borderRadius:'12px',cursor:'pointer',
                      textAlign:'center',fontSize:f(11),fontWeight:'700',
                      border:`2px solid ${giorni===g?'#193f9e':'#f0f1f4'}`,
                      background:giorni===g?'#EEF3FD':'#feffff',
                      color:giorni===g?'#193f9e':'#7c8088',
                      transition:'all 0.15s'
                    }}>{label}</div>
                  ))}
                </div>
              </div>

              {/* Permessi */}
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'8px'}}>
                  Dati da condividere
                </div>
                <div style={{background:'#EEF3FD',borderRadius:'10px',padding:'8px 12px',marginBottom:'10px',fontSize:f(11),color:'#193f9e',fontWeight:'600'}}>
                  👁 Il medico vedrà i dati in SOLA LETTURA — non potrà modificare nulla
                </div>

                {PERMESSI_CONFIG.map(({key,label,sub,color,locked})=>(
                  <div key={key} onClick={()=>!locked&&setPerms(p=>({...p,[key]:!p[key]}))} style={{
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'12px',borderRadius:'12px',marginBottom:'7px',
                    background:perms[key]?`${color}12`:'#f3f4f7',
                    border:`1.5px solid ${perms[key]?`${color}33`:'transparent'}`,
                    cursor:locked?'default':'pointer',
                    transition:'all 0.15s'
                  }}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:f(13),fontWeight:'700',color:perms[key]?color:'#394058'}}>
                        {label}
                      </div>
                      <div style={{fontSize:f(10),color:'#7c8088',marginTop:'2px'}}>
                        {locked?'Sempre incluso — ':''}{sub}
                      </div>
                    </div>
                    <div style={{width:'46px',height:'26px',borderRadius:'13px',background:perms[key]?color:'#dde0ed',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                      <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'3px',left:perms[key]?'23px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleGenera} style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:'linear-gradient(135deg,#193f9e,#2e84e9)',boxShadow:'0 6px 20px rgba(25,63,158,0.35)'}}>
                🔗 Genera Token
              </button>
            </div>
          )}

          {/* ── STEP 2: TOKEN GENERATO ── */}
          {step===2&&tokenGenerato&&(
            <div style={{background:'#feffff',borderRadius:'18px',padding:'20px',boxShadow:sh}}>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'linear-gradient(135deg,#00BFA6,#2e84e9)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',boxShadow:'0 6px 20px rgba(0,191,166,0.35)'}}>
                  <Check size={28} color="#fff" strokeWidth={3}/>
                </div>
                <div style={{fontSize:f(18),fontWeight:'900',color:'#08184c',marginBottom:'4px'}}>Token generato!</div>
                <div style={{fontSize:f(12),color:'#7c8088',marginBottom:'6px'}}>Comunica questo token a {tokenGenerato.medicoName}</div>
                <div style={{fontSize:f(11),color:'#193f9e',fontWeight:'600'}}>
                  👁 Sola lettura · ⏳ {giorni===1?'1 giorno':giorni<30?`${giorni} giorni`:giorni===30?'30 giorni':giorni===60?'60 giorni':giorni===180?'6 mesi':'1 anno'}
                </div>
              </div>

              {/* Token visibile */}
              <div style={{background:'#f3f4f7',borderRadius:'16px',padding:'20px',textAlign:'center',marginBottom:'12px',border:'2px dashed #193f9e44'}}>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:f(22),fontWeight:'900',color:'#193f9e',letterSpacing:'3px',wordBreak:'break-all',marginBottom:'8px'}}>
                  {tokenGenerato.token}
                </div>
                <div style={{fontSize:f(11),color:'#7c8088'}}>
                  Scade il: {new Date(tokenGenerato.expiresAt).toLocaleDateString('it-IT')}
                </div>
              </div>

              {/* Riepilogo permessi */}
              <div style={{background:'#EEF3FD',borderRadius:'12px',padding:'10px 12px',marginBottom:'14px'}}>
                <div style={{fontSize:f(11),fontWeight:'700',color:'#193f9e',marginBottom:'6px'}}>Dati condivisi:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                  {PERMESSI_CONFIG.filter(p=>tokenGenerato.permissions?.[p.key]).map(p=>(
                    <span key={p.key} style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:`${p.color}15`,color:p.color}}>
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>

              <button onClick={()=>handleCopy(tokenGenerato.token)} style={{width:'100%',padding:'14px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(14),background:copied?'linear-gradient(135deg,#00BFA6,#2e84e9)':'#EEF3FD',color:copied?'#fff':'#193f9e',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'10px',transition:'all 0.2s'}}>
                {copied?<><Check size={16} color="#fff"/> Copiato!</>:<><Copy size={16} color="#193f9e"/> Copia token</>}
              </button>

              <button onClick={resetWizard} style={{width:'100%',padding:'14px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(14),background:'linear-gradient(135deg,#193f9e,#2e84e9)',color:'#fff',boxShadow:'0 6px 20px rgba(25,63,158,0.35)'}}>
                Torna alla lista token
              </button>

              {isDemo&&(
                <div style={{textAlign:'center',marginTop:'10px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>
                  🎭 Modalità demo — token non salvato su Firebase
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
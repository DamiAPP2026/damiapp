import { useState, useEffect } from 'react'
import { ChevronLeft, Copy, Trash2, Check } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, update } from 'firebase/database'

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

function generateToken(medicoName) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const rand = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
    // Formato: DMI-XXXX-XXXX (solo lettere e numeri facili da leggere, no caratteri speciali)
    return `DMI${rand(4)}${rand(4)}`
  }

export default function CondividiPage({ onBack, isDemo }) {
  const [tokens, setTokens] = useState([])
  const [step, setStep] = useState(0) // 0=lista, 1=wizard
  const [medicoName, setMedicoName] = useState('')
  const [giorni, setGiorni] = useState(90)
  const [perms, setPerms] = useState({
    shareCrises: true,
    shareTerapie: false,
    shareDocuments: false,
    shareContacts: false,
  })
  const [tokenGenerato, setTokenGenerato] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isDemo) {
      setTokens([
        {id:1, medicoName:'Dr. Rossi', token:'DMI·7K2X·9P4R', active:true,
          expiresAt: Date.now()+60*86400000, permissions:{shareCrises:true, shareTerapie:true}},
      ])
      return
    }
    const tRef = ref(db, 'sharetokens')
    const unsubscribe = onValue(tRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setTokens(Object.entries(data).map(([id, v]) => ({...v, firebaseId:id})))
      } else {
        setTokens([])
      }
    })
    return () => unsubscribe()
  }, [isDemo])

  function handleGenera() {
    if (!medicoName.trim()) { alert('Inserisci il nome del medico'); return }
    const token = generateToken(medicoName)
    const nuovoToken = {
      id: Date.now(),
      medicoName: medicoName.trim(),
      token,
      active: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + giorni * 86400000,
      permissions: perms,
    }
    if (!isDemo) {
      push(ref(db, 'sharetokens'), nuovoToken)
    }
    setTokenGenerato(nuovoToken)
    setStep(2)
  }

  function handleRevoca(t) {
    if (!window.confirm(`Revocare l'accesso a ${t.medicoName}?`)) return
    if (!isDemo && t.firebaseId) {
      update(ref(db, `sharetokens/${t.firebaseId}`), {active: false})
    }
    setTokens(prev => prev.map(tk => tk.id===t.id ? {...tk, active:false} : tk))
  }

  function handleCopy(token) {
    navigator.clipboard?.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const activeTokens = tokens.filter(t => t.active)
  const expiredTokens = tokens.filter(t => !t.active)

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .condividi-wrap{background:#f3f4f7;min-height:100vh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="condividi-wrap">

        {/* HEADER */}
        <div style={{
          background:'linear-gradient(135deg,#193f9e,#2e84e9)',
          padding:'14px 16px 24px'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <button onClick={step > 0 ? () => setStep(0) : onBack} style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'rgba(255,255,255,0.2)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}><ChevronLeft size={20} color="#fff"/></button>
            <div>
              <div style={{fontSize:'18px', fontWeight:'900', color:'#fff'}}>🔗 Condividi dati</div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.75)'}}>
                {step===0 ? 'Gestisci accessi medici' : step===1 ? 'Nuovo accesso medico' : 'Token generato!'}
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* STEP 0: LISTA TOKEN */}
          {step === 0 && (
            <>
              <div style={{
                background:'#EEF3FD', borderRadius:'14px', padding:'12px 14px',
                marginBottom:'12px', border:'1.5px solid #193f9e22',
                fontSize:'12px', color:'#193f9e', lineHeight:'1.6'
              }}>
                ℹ️ Genera un token sicuro da condividere con il tuo medico.
                Puoi revocare l'accesso in qualsiasi momento.
              </div>

              <button onClick={() => { setStep(1); setMedicoName(''); setTokenGenerato(null) }} style={{
                width:'100%', padding:'15px', borderRadius:'50px', border:'none',
                cursor:'pointer', fontWeight:'800', fontSize:'15px', color:'#fff',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)', marginBottom:'14px',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'
              }}>
                🔗 Genera nuovo token medico
              </button>

              {/* Token attivi */}
              <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'8px'}}>
                🔐 Token attivi ({activeTokens.length})
              </div>
              {activeTokens.length === 0 ? (
                <div style={{
                  background:'#feffff', borderRadius:'14px', padding:'24px',
                  textAlign:'center', boxShadow:sh, marginBottom:'10px'
                }}>
                  <div style={{fontSize:'28px', marginBottom:'8px'}}>🔗</div>
                  <div style={{fontSize:'13px', color:'#7c8088'}}>Nessun token attivo</div>
                </div>
              ) : (
                activeTokens.map(t => {
                  const giorniRimanenti = Math.ceil((t.expiresAt - Date.now()) / 86400000)
                  return (
                    <div key={t.id} style={{
                      background:'#feffff', borderRadius:'16px', padding:'14px',
                      marginBottom:'8px', boxShadow:sh
                    }}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px'}}>
                        <div>
                          <div style={{fontSize:'14px', fontWeight:'800', color:'#02153f'}}>
                            👨‍⚕️ {t.medicoName}
                          </div>
                          <div style={{
                            fontFamily:"'Courier New', monospace", fontSize:'16px',
                            fontWeight:'700', color:'#193f9e', letterSpacing:'2px',
                            marginTop:'4px'
                          }}>{t.token}</div>
                        </div>
                        <button onClick={() => handleRevoca(t)} style={{
                          width:'32px', height:'32px', borderRadius:'50%',
                          background:'#FEF0F4', border:'none', cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center'
                        }}>
                          <Trash2 size={14} color="#F7295A"/>
                        </button>
                      </div>
                      <div style={{display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px'}}>
                        {t.permissions?.shareCrises && (
                          <span style={{fontSize:'10px', fontWeight:'700', padding:'2px 8px',
                            borderRadius:'20px', background:'#FEF0F4', color:'#F7295A'}}>Crisi</span>
                        )}
                        {t.permissions?.shareTerapie && (
                          <span style={{fontSize:'10px', fontWeight:'700', padding:'2px 8px',
                            borderRadius:'20px', background:'#E8FBF8', color:'#00BFA6'}}>Terapie</span>
                        )}
                        {t.permissions?.shareDocuments && (
                          <span style={{fontSize:'10px', fontWeight:'700', padding:'2px 8px',
                            borderRadius:'20px', background:'#EEF3FD', color:'#193f9e'}}>Documenti</span>
                        )}
                        {t.permissions?.shareContacts && (
                          <span style={{fontSize:'10px', fontWeight:'700', padding:'2px 8px',
                            borderRadius:'20px', background:'#F5F3FF', color:'#7B5EA7'}}>Contatti</span>
                        )}
                      </div>
                      <div style={{fontSize:'11px', color: giorniRimanenti < 10 ? '#F7295A' : '#7c8088'}}>
                        ⏳ Scade tra {giorniRimanenti} giorni
                      </div>
                    </div>
                  )
                })
              )}

              {/* Token revocati */}
              {expiredTokens.length > 0 && (
                <>
                  <div style={{fontSize:'13px', fontWeight:'800', color:'#bec1cc', margin:'12px 0 8px'}}>
                    Accessi revocati ({expiredTokens.length})
                  </div>
                  {expiredTokens.map(t => (
                    <div key={t.id} style={{
                      background:'#f3f4f7', borderRadius:'14px', padding:'12px',
                      marginBottom:'6px', opacity:0.6
                    }}>
                      <div style={{fontSize:'13px', fontWeight:'700', color:'#7c8088'}}>
                        👨‍⚕️ {t.medicoName}
                      </div>
                      <div style={{fontFamily:"'Courier New', monospace", fontSize:'13px',
                        color:'#bec1cc', marginTop:'2px'}}>{t.token}</div>
                      <div style={{fontSize:'10px', color:'#bec1cc', marginTop:'4px'}}>
                        ❌ Accesso revocato
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* STEP 1: WIZARD NUOVO TOKEN */}
          {step === 1 && (
            <div style={{background:'#feffff', borderRadius:'18px', padding:'16px', boxShadow:sh}}>
              <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'14px'}}>
                👨‍⚕️ Dati del medico
              </div>

              <div style={{marginBottom:'14px'}}>
                <label style={{
                  fontSize:'11px', fontWeight:'700', color:'#7c8088',
                  textTransform:'uppercase', letterSpacing:'0.4px',
                  marginBottom:'6px', display:'block'
                }}>Nome del medico</label>
                <input
                  value={medicoName}
                  onChange={e => setMedicoName(e.target.value)}
                  placeholder="Es: Dr. Rossi"
                  style={{
                    width:'100%', padding:'12px', borderRadius:'12px',
                    border:'1.5px solid #f0f1f4', fontSize:'14px', color:'#02153f',
                    background:'#f3f4f7', fontFamily:'inherit', outline:'none',
                    boxSizing:'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor='#2e84e9'}
                  onBlur={e => e.target.style.borderColor='#f0f1f4'}
                />
              </div>

              <div style={{marginBottom:'14px'}}>
                <label style={{
                  fontSize:'11px', fontWeight:'700', color:'#7c8088',
                  textTransform:'uppercase', letterSpacing:'0.4px',
                  marginBottom:'6px', display:'block'
                }}>Durata accesso</label>
                <div style={{display:'flex', gap:'6px'}}>
                  {[30, 60, 90, 180].map(g => (
                    <div key={g} onClick={() => setGiorni(g)} style={{
                      flex:1, padding:'10px 4px', borderRadius:'12px', cursor:'pointer',
                      textAlign:'center', fontSize:'12px', fontWeight:'700',
                      border:`2px solid ${giorni===g ? '#193f9e' : '#f0f1f4'}`,
                      background: giorni===g ? '#EEF3FD' : '#feffff',
                      color: giorni===g ? '#193f9e' : '#7c8088'
                    }}>{g}gg</div>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:'16px'}}>
                <label style={{
                  fontSize:'11px', fontWeight:'700', color:'#7c8088',
                  textTransform:'uppercase', letterSpacing:'0.4px',
                  marginBottom:'8px', display:'block'
                }}>Dati da condividere</label>
                {[
                  {key:'shareCrises', label:'🚨 Crisi epilettiche', locked:true},
                  {key:'shareTerapie', label:'💊 Terapie'},
                  {key:'shareDocuments', label:'📄 Documenti medici'},
                  {key:'shareContacts', label:'📞 Contatti'},
                ].map(({key, label, locked}) => (
                  <div key={key} onClick={() => !locked && setPerms(p => ({...p, [key]:!p[key]}))} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 12px', borderRadius:'12px', marginBottom:'6px',
                    background: perms[key] ? '#EEF3FD' : '#f3f4f7',
                    border:`1.5px solid ${perms[key] ? '#193f9e33' : 'transparent'}`,
                    cursor: locked ? 'default' : 'pointer'
                  }}>
                    <div>
                      <div style={{fontSize:'12px', fontWeight:'700', color: perms[key] ? '#193f9e' : '#394058'}}>
                        {label}
                      </div>
                      {locked && <div style={{fontSize:'10px', color:'#bec1cc'}}>Sempre incluso</div>}
                    </div>
                    <div style={{
                      width:'44px', height:'24px', borderRadius:'12px',
                      background: perms[key] ? '#193f9e' : '#dde0ed',
                      position:'relative', transition:'background 0.2s'
                    }}>
                      <div style={{
                        width:'18px', height:'18px', borderRadius:'50%', background:'#fff',
                        position:'absolute', top:'3px',
                        left: perms[key] ? '23px' : '3px', transition:'left 0.2s',
                        boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
                      }}/>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleGenera} style={{
                width:'100%', padding:'15px', borderRadius:'50px', border:'none',
                cursor:'pointer', fontWeight:'800', fontSize:'15px', color:'#fff',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)'
              }}>
                🔗 Genera Token
              </button>
            </div>
          )}

          {/* STEP 2: TOKEN GENERATO */}
          {step === 2 && tokenGenerato && (
            <div style={{background:'#feffff', borderRadius:'18px', padding:'20px', boxShadow:sh}}>
              <div style={{textAlign:'center', marginBottom:'20px'}}>
                <div style={{
                  width:'60px', height:'60px', borderRadius:'50%',
                  background:'linear-gradient(135deg,#00BFA6,#2e84e9)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 12px',
                  boxShadow:'0 6px 20px rgba(0,191,166,0.35)'
                }}>
                  <Check size={28} color="#fff" strokeWidth={3}/>
                </div>
                <div style={{fontSize:'18px', fontWeight:'900', color:'#08184c', marginBottom:'4px'}}>
                  Token generato!
                </div>
                <div style={{fontSize:'12px', color:'#7c8088'}}>
                  Comunica questo token a {tokenGenerato.medicoName}
                </div>
              </div>

              <div style={{
                background:'#f3f4f7', borderRadius:'16px', padding:'20px',
                textAlign:'center', marginBottom:'16px',
                border:'2px dashed #193f9e44'
              }}>
                <div style={{
                  fontFamily:"'Courier New', monospace",
                  fontSize:'22px', fontWeight:'900', color:'#193f9e',
                  letterSpacing:'3px', marginBottom:'8px'
                }}>{tokenGenerato.token}</div>
                <div style={{fontSize:'11px', color:'#7c8088'}}>
                  Valido per {giorni} giorni
                </div>
              </div>

              <button onClick={() => handleCopy(tokenGenerato.token)} style={{
                width:'100%', padding:'14px', borderRadius:'50px', border:'none',
                cursor:'pointer', fontWeight:'800', fontSize:'14px',
                background: copied ? 'linear-gradient(135deg,#00BFA6,#2e84e9)' : '#EEF3FD',
                color: copied ? '#fff' : '#193f9e',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                marginBottom:'10px', transition:'all 0.2s'
              }}>
                {copied ? <><Check size={16} color="#fff"/> Copiato!</> : <><Copy size={16} color="#193f9e"/> Copia token</>}
              </button>

              <button onClick={() => setStep(0)} style={{
                width:'100%', padding:'14px', borderRadius:'50px', border:'none',
                cursor:'pointer', fontWeight:'800', fontSize:'14px',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)', color:'#fff',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)'
              }}>
                Torna alla lista
              </button>

              {isDemo && (
                <div style={{textAlign:'center', marginTop:'10px', fontSize:'11px', color:'#8B6914', fontWeight:'600'}}>
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
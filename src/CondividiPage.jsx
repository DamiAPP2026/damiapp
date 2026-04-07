import { useState, useEffect } from 'react'
import { ChevronLeft, Copy, Trash2, Check, BookOpen, Pill, Droplets, BarChart2, FileText } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, update } from 'firebase/database'
import { encrypt, processFirebaseSnap } from './crypto'

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = n => Array.from({length:n}, ()=>chars[Math.floor(Math.random()*chars.length)]).join('')
  return `DMI${rand(4)}${rand(4)}`
}

const PERMESSI_CONFIG = [
  {key:'shareCrises', Icon:BookOpen, label:'Diario crisi', sub:'Tutte le crisi registrate', color:'#F7295A', locked:true},
  {key:'shareTerapie', Icon:Pill, label:'Terapie', sub:'Farmaci e orari', color:'#00BFA6'},
  {key:'shareReport', Icon:BarChart2, label:'Statistiche / Report', sub:'Grafici e andamenti', color:'#7B5EA7'},
  {key:'shareToilet', Icon:Droplets, label:'Toilet Training', sub:'Sessioni e progressi', color:'#2e84e9'},
  {key:'shareDocuments', Icon:FileText, label:'Documenti medici', sub:'Referti e visite', color:'#FF8C42'},
]

export default function CondividiPage({ onBack, isDemo }) {
  const [tokens, setTokens] = useState([])
  const [step, setStep] = useState(0)
  const [medicoName, setMedicoName] = useState('')
  const [giorni, setGiorni] = useState(90)
  const [perms, setPerms] = useState({
    shareCrises:true, shareTerapie:false,
    shareReport:false, shareToilet:false, shareDocuments:false,
  })
  const [tokenGenerato, setTokenGenerato] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isDemo) {
      setTokens([{
        id:1, medicoName:'Dr. Rossi', token:'DMI7K2X9P4R',
        active:true, expiresAt:Date.now()+60*86400000,
        permissions:{shareCrises:true, shareTerapie:true, shareReport:true, shareToilet:false, shareDocuments:false}
      }])
      return
    }
    const unsub = onValue(ref(db,'sharetokens'), snap => {
      setTokens(processFirebaseSnap(snap))
    })
    return () => unsub()
  }, [isDemo])

  function handleGenera() {
    if (!medicoName.trim()) { alert('Inserisci il nome del medico'); return }
    const token = generateToken()
    const nuovoToken = {
      id:Date.now(), medicoName:medicoName.trim(), token,
      active:true, createdAt:Date.now(),
      expiresAt:Date.now()+giorni*86400000,
      permissions:perms,
    }
    if (!isDemo) push(ref(db,'sharetokens'), encrypt(nuovoToken))
    setTokenGenerato(nuovoToken)
    setStep(2)
  }

  function handleRevoca(t) {
    if (!window.confirm(`Revocare l'accesso a ${t.medicoName}?`)) return
    if (!isDemo && t._firebaseKey) update(ref(db,`sharetokens/${t._firebaseKey}`), {active:false})
    setTokens(prev => prev.map(tk => tk.id===t.id ? {...tk, active:false} : tk))
  }

  function handleCopy(token) {
    navigator.clipboard?.writeText(token).then(() => {
      setCopied(true); setTimeout(()=>setCopied(false),2000)
    })
  }

  const activeTokens = tokens.filter(t=>t.active)
  const revokedTokens = tokens.filter(t=>!t.active)

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.cond-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="cond-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#193f9e,#2e84e9)',padding:'14px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <button onClick={step>0 ? ()=>setStep(0) : onBack} style={{
              width:'36px',height:'36px',borderRadius:'50%',
              background:'rgba(255,255,255,0.2)',border:'none',
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'
            }}><ChevronLeft size={20} color="#fff"/></button>
            <div>
              <div style={{fontSize:'18px',fontWeight:'900',color:'#fff'}}>🔗 Condividi con medico</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.75)'}}>
                {step===0?'Gestisci accessi':step===1?'Nuovo accesso':'Token generato!'}
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* ── STEP 0: LISTA ── */}
          {step===0 && (
            <>
              <div style={{
                background:'#EEF3FD',borderRadius:'14px',padding:'12px 14px',
                marginBottom:'12px',border:'1.5px solid #193f9e22',
                fontSize:'12px',color:'#193f9e',lineHeight:'1.6'
              }}>
                ℹ️ Genera un codice sicuro da dare al tuo medico. Puoi scegliere cosa condividere e revocare l'accesso in qualsiasi momento.
              </div>

              <button onClick={()=>{setStep(1);setMedicoName('');setTokenGenerato(null);setPerms({shareCrises:true,shareTerapie:false,shareReport:false,shareToilet:false,shareDocuments:false})}} style={{
                width:'100%',padding:'15px',borderRadius:'50px',border:'none',
                cursor:'pointer',fontWeight:'800',fontSize:'15px',color:'#fff',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)',marginBottom:'14px',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'
              }}>
                🔗 Genera nuovo accesso medico
              </button>

              {/* Token attivi */}
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>
                🔐 Accessi attivi ({activeTokens.length})
              </div>

              {activeTokens.length===0 ? (
                <div style={{background:'#feffff',borderRadius:'14px',padding:'24px',textAlign:'center',boxShadow:sh,marginBottom:'10px'}}>
                  <div style={{fontSize:'28px',marginBottom:'8px'}}>🔗</div>
                  <div style={{fontSize:'13px',color:'#7c8088'}}>Nessun accesso attivo</div>
                </div>
              ) : (
                activeTokens.map(t => {
                  const gg = Math.ceil((t.expiresAt-Date.now())/86400000)
                  return (
                    <div key={t.id} style={{background:'#feffff',borderRadius:'16px',padding:'14px',marginBottom:'8px',boxShadow:sh}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                        <div>
                          <div style={{fontSize:'14px',fontWeight:'800',color:'#02153f'}}>👨‍⚕️ {t.medicoName}</div>
                          <div style={{
                            fontFamily:"'Courier New',monospace",fontSize:'18px',
                            fontWeight:'900',color:'#193f9e',letterSpacing:'2px',marginTop:'4px'
                          }}>{t.token}</div>
                        </div>
                        <button onClick={()=>handleRevoca(t)} style={{
                          width:'32px',height:'32px',borderRadius:'50%',
                          background:'#FEF0F4',border:'none',cursor:'pointer',
                          display:'flex',alignItems:'center',justifyContent:'center'
                        }}>
                          <Trash2 size={14} color="#F7295A"/>
                        </button>
                      </div>

                      {/* Permessi */}
                      <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'8px'}}>
                        {PERMESSI_CONFIG.filter(p=>t.permissions?.[p.key]).map(p=>(
                          <span key={p.key} style={{
                            fontSize:'10px',fontWeight:'700',padding:'2px 8px',
                            borderRadius:'20px',background:`${p.color}18`,color:p.color
                          }}>{p.label}</span>
                        ))}
                      </div>

                      <div style={{fontSize:'11px',color:gg<10?'#F7295A':'#7c8088'}}>
                        ⏳ Scade tra {gg} giorni
                      </div>

                      <button onClick={()=>handleCopy(t.token)} style={{
                        width:'100%',padding:'9px',borderRadius:'10px',border:'none',
                        cursor:'pointer',fontWeight:'700',fontSize:'12px',
                        background:'#EEF3FD',color:'#193f9e',marginTop:'8px',
                        display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'
                      }}>
                        <Copy size={13} color="#193f9e"/> Copia codice
                      </button>
                    </div>
                  )
                })
              )}

              {/* Token revocati */}
              {revokedTokens.length>0 && (
                <>
                  <div style={{fontSize:'13px',fontWeight:'800',color:'#bec1cc',margin:'12px 0 8px'}}>
                    Accessi revocati ({revokedTokens.length})
                  </div>
                  {revokedTokens.map(t=>(
                    <div key={t.id} style={{background:'#f3f4f7',borderRadius:'14px',padding:'12px',marginBottom:'6px',opacity:0.6}}>
                      <div style={{fontSize:'13px',fontWeight:'700',color:'#7c8088'}}>👨‍⚕️ {t.medicoName}</div>
                      <div style={{fontFamily:"'Courier New',monospace",fontSize:'13px',color:'#bec1cc',marginTop:'2px'}}>{t.token}</div>
                      <div style={{fontSize:'10px',color:'#bec1cc',marginTop:'4px'}}>❌ Accesso revocato</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── STEP 1: WIZARD ── */}
          {step===1 && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',boxShadow:sh}}>

              {/* Nome medico */}
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>
                  👨‍⚕️ Nome del medico
                </div>
                <input
                  value={medicoName}
                  onChange={e=>setMedicoName(e.target.value)}
                  placeholder="Es: Dr. Rossi"
                  style={{
                    width:'100%',padding:'12px',borderRadius:'12px',
                    border:'1.5px solid #f0f1f4',fontSize:'14px',color:'#02153f',
                    background:'#f3f4f7',fontFamily:'inherit',outline:'none',
                    boxSizing:'border-box'
                  }}
                  onFocus={e=>e.target.style.borderColor='#2e84e9'}
                  onBlur={e=>e.target.style.borderColor='#f0f1f4'}
                />
              </div>

              {/* Durata */}
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>
                  ⏳ Durata accesso
                </div>
                <div style={{display:'flex',gap:'6px'}}>
                  {[30,60,90,180].map(g=>(
                    <div key={g} onClick={()=>setGiorni(g)} style={{
                      flex:1,padding:'10px 4px',borderRadius:'12px',cursor:'pointer',
                      textAlign:'center',fontSize:'12px',fontWeight:'700',
                      border:`2px solid ${giorni===g?'#193f9e':'#f0f1f4'}`,
                      background:giorni===g?'#EEF3FD':'#feffff',
                      color:giorni===g?'#193f9e':'#7c8088'
                    }}>{g}gg</div>
                  ))}
                </div>
              </div>

              {/* Permessi */}
              <div style={{marginBottom:'20px'}}>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>
                  📋 Cosa condividere
                </div>
                {PERMESSI_CONFIG.map(({key, Icon, label, sub, color, locked})=>(
                  <div key={key} onClick={()=>!locked&&setPerms(p=>({...p,[key]:!p[key]}))} style={{
                    display:'flex',alignItems:'center',gap:'12px',
                    padding:'12px',borderRadius:'12px',marginBottom:'6px',
                    background:perms[key]?`${color}10`:'#f3f4f7',
                    border:`1.5px solid ${perms[key]?`${color}44`:'transparent'}`,
                    cursor:locked?'default':'pointer',
                    transition:'all 0.15s'
                  }}>
                    <div style={{
                      width:'36px',height:'36px',borderRadius:'10px',
                      background:perms[key]?`${color}20`:'#e8eaf0',
                      display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
                    }}>
                      <Icon size={18} color={perms[key]?color:'#bec1cc'}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px',fontWeight:'700',color:perms[key]?color:'#394058'}}>{label}</div>
                      <div style={{fontSize:'10px',color:'#7c8088'}}>{sub}{locked?' · Sempre incluso':''}</div>
                    </div>
                    <div style={{
                      width:'44px',height:'24px',borderRadius:'12px',
                      background:perms[key]?color:'#dde0ed',
                      position:'relative',transition:'background 0.2s',flexShrink:0
                    }}>
                      <div style={{
                        width:'18px',height:'18px',borderRadius:'50%',background:'#fff',
                        position:'absolute',top:'3px',
                        left:perms[key]?'23px':'3px',transition:'left 0.2s',
                        boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
                      }}/>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleGenera} style={{
                width:'100%',padding:'15px',borderRadius:'50px',border:'none',
                cursor:'pointer',fontWeight:'800',fontSize:'15px',color:'#fff',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)'
              }}>
                🔗 Genera codice accesso
              </button>
            </div>
          )}

          {/* ── STEP 2: TOKEN GENERATO ── */}
          {step===2 && tokenGenerato && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'20px',boxShadow:sh}}>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <div style={{
                  width:'60px',height:'60px',borderRadius:'50%',
                  background:'linear-gradient(135deg,#00BFA6,#2e84e9)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  margin:'0 auto 12px',boxShadow:'0 6px 20px rgba(0,191,166,0.35)'
                }}>
                  <Check size={28} color="#fff" strokeWidth={3}/>
                </div>
                <div style={{fontSize:'18px',fontWeight:'900',color:'#08184c',marginBottom:'4px'}}>
                  Codice generato!
                </div>
                <div style={{fontSize:'12px',color:'#7c8088'}}>
                  Comunica questo codice a {tokenGenerato.medicoName}
                </div>
              </div>

              <div style={{
                background:'#f3f4f7',borderRadius:'16px',padding:'20px',
                textAlign:'center',marginBottom:'14px',border:'2px dashed #193f9e44'
              }}>
                <div style={{
                  fontFamily:"'Courier New',monospace",
                  fontSize:'28px',fontWeight:'900',color:'#193f9e',
                  letterSpacing:'4px',marginBottom:'6px'
                }}>{tokenGenerato.token}</div>
                <div style={{fontSize:'11px',color:'#7c8088'}}>Valido per {giorni} giorni</div>
              </div>

              {/* Riepilogo permessi */}
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:'12px',fontWeight:'700',color:'#7c8088',marginBottom:'8px'}}>
                  Il medico potrà vedere:
                </div>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                  {PERMESSI_CONFIG.filter(p=>tokenGenerato.permissions?.[p.key]).map(p=>(
                    <span key={p.key} style={{
                      fontSize:'11px',fontWeight:'700',padding:'3px 10px',
                      borderRadius:'20px',background:`${p.color}18`,color:p.color
                    }}>{p.label}</span>
                  ))}
                </div>
              </div>

              <button onClick={()=>handleCopy(tokenGenerato.token)} style={{
                width:'100%',padding:'14px',borderRadius:'50px',border:'none',
                cursor:'pointer',fontWeight:'800',fontSize:'14px',
                background:copied?'linear-gradient(135deg,#00BFA6,#2e84e9)':'#EEF3FD',
                color:copied?'#fff':'#193f9e',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
                marginBottom:'10px',transition:'all 0.2s'
              }}>
                {copied?<><Check size={16} color="#fff"/> Copiato!</>:<><Copy size={16} color="#193f9e"/> Copia codice</>}
              </button>

              <button onClick={()=>setStep(0)} style={{
                width:'100%',padding:'14px',borderRadius:'50px',border:'none',
                cursor:'pointer',fontWeight:'800',fontSize:'14px',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',color:'#fff',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)'
              }}>
                Torna alla lista
              </button>

              {isDemo&&<div style={{textAlign:'center',marginTop:'10px',fontSize:'11px',color:'#8B6914',fontWeight:'600'}}>🎭 Modalità demo — token non salvato</div>}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
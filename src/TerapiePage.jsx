import { useState, useEffect } from 'react'
import { ChevronLeft, Pill, Clock, Plus, Check } from 'lucide-react'
import { db } from './firebase'
import { ref, onValue } from 'firebase/database'

const DEMO_TERAPIE = [
  {id:1, nome:'Keppra 500mg', quantita:'1 compressa', orario:'08:00', note:'Con colazione', colore:'#F7295A'},
  {id:2, nome:'Depakine 250ml', quantita:'5ml', orario:'13:00', note:'Con pranzo', colore:'#00BFA6'},
  {id:3, nome:'Keppra 500mg', quantita:'1 compressa', orario:'20:00', note:'Con cena', colore:'#F7295A'},
  {id:4, nome:'Rivotril 0.5mg', quantita:'½ compressa', orario:'22:00', note:'Prima di dormire', colore:'#7B5EA7'},
]

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

export default function TerapiePage({ onBack, isDemo }) {
  const [terapie, setTerapie] = useState([])
  const [loading, setLoading] = useState(true)
  const [assunte, setAssunte] = useState({})
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (isDemo) {
      setTerapie(DEMO_TERAPIE)
      setLoading(false)
      return
    }
    const tRef = ref(db, 'terapies')
    const unsubscribe = onValue(tRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const lista = Object.values(data).map(t => {
          try { return typeof t === 'string' ? JSON.parse(t) : t }
          catch { return t }
        }).filter(Boolean).sort((a,b) => (a.orario||'').localeCompare(b.orario||''))
        setTerapie(lista)
      } else {
        setTerapie([])
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [isDemo])

  const timeStr = time.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})
  const oggi = new Date().toLocaleDateString('it-IT')

  function toggleAssunta(id) {
    setAssunte(prev => ({...prev, [id]: !prev[id]}))
  }

  // Prossima terapia
  const ora = time.getHours() * 60 + time.getMinutes()
  const prossima = terapie
    .map(t => {
      const [h, m] = (t.orario || '00:00').split(':').map(Number)
      return {...t, minuti: h*60 + m}
    })
    .filter(t => t.minuti > ora && !assunte[t.id])
    .sort((a,b) => a.minuti - b.minuti)[0]

  if (loading) {
    return (
      <div style={{
        minHeight:'100vh', background:'#f3f4f7', display:'flex',
        alignItems:'center', justifyContent:'center',
        fontFamily:"-apple-system,'Segoe UI',sans-serif"
      }}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'32px', marginBottom:'12px'}}>💊</div>
          <div style={{fontSize:'14px', color:'#7c8088'}}>Caricamento terapie...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .terapie-wrap{background:#f3f4f7;min-height:100vh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          padding-bottom:40px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="terapie-wrap">

        {/* HEADER */}
        <div style={{
          background:'linear-gradient(135deg,#00BFA6,#2e84e9)',
          padding:'14px 16px 24px'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}>
            <button onClick={onBack} style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'rgba(255,255,255,0.2)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}><ChevronLeft size={20} color="#fff"/></button>
            <div>
              <div style={{fontSize:'18px', fontWeight:'900', color:'#fff'}}>💊 Terapie</div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.75)'}}>
                {isDemo ? '🎭 Dati demo' : `${terapie.length} terapie programmate`}
              </div>
            </div>
          </div>

          {/* Ora attuale + prossima */}
          <div style={{
            background:'rgba(255,255,255,0.15)', borderRadius:'16px', padding:'14px',
            display:'flex', alignItems:'center', justifyContent:'space-between'
          }}>
            <div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.7)', marginBottom:'2px'}}>
                Ora attuale
              </div>
              <div style={{fontSize:'28px', fontWeight:'900', color:'#fff',
                fontVariantNumeric:'tabular-nums', letterSpacing:'-1px'}}>
                {timeStr}
              </div>
            </div>
            {prossima && (
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'11px', color:'rgba(255,255,255,0.7)', marginBottom:'2px'}}>
                  Prossima
                </div>
                <div style={{fontSize:'16px', fontWeight:'800', color:'#fff'}}>
                  {prossima.orario}
                </div>
                <div style={{fontSize:'11px', color:'rgba(255,255,255,0.85)'}}>
                  {prossima.nome}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* TERAPIE OGGI */}
          <div style={{
            display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'10px'
          }}>
            <span style={{fontSize:'14px', fontWeight:'800', color:'#02153f'}}>
              📋 Terapie di oggi
            </span>
            <span style={{fontSize:'11px', color:'#bec1cc'}}>
              {Object.values(assunte).filter(Boolean).length}/{terapie.length} assunte
            </span>
          </div>

          {terapie.length === 0 ? (
            <div style={{
              background:'#feffff', borderRadius:'18px', padding:'32px',
              textAlign:'center', boxShadow:sh
            }}>
              <div style={{fontSize:'32px', marginBottom:'12px'}}>💊</div>
              <div style={{fontSize:'14px', color:'#7c8088', marginBottom:'4px'}}>
                Nessuna terapia registrata
              </div>
              <div style={{fontSize:'12px', color:'#bec1cc'}}>
                Le terapie appariranno qui
              </div>
            </div>
          ) : (
            terapie.map(t => {
              const assunta = assunte[t.id]
              const color = t.colore || '#2e84e9'
              const [h, m] = (t.orario || '00:00').split(':').map(Number)
              const minTerapia = h*60 + m
              const passata = minTerapia < ora
              return (
                <div key={t.id} style={{
                  background:'#feffff', borderRadius:'16px', padding:'14px',
                  marginBottom:'8px', boxShadow:sh,
                  display:'flex', alignItems:'center', gap:'12px',
                  opacity: assunta ? 0.6 : 1,
                  transition:'opacity 0.2s'
                }}>
                  {/* Icona */}
                  <div style={{
                    width:'44px', height:'44px', borderRadius:'14px',
                    background: assunta ? '#f3f4f7' : `${color}18`,
                    border: `2px solid ${assunta ? '#f0f1f4' : color}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0
                  }}>
                    <Pill size={20} color={assunta ? '#bec1cc' : color}/>
                  </div>

                  {/* Info */}
                  <div style={{flex:1}}>
                    <div style={{
                      fontSize:'14px', fontWeight:'800',
                      color: assunta ? '#bec1cc' : '#02153f',
                      textDecoration: assunta ? 'line-through' : 'none',
                      marginBottom:'2px'
                    }}>{t.nome}</div>
                    <div style={{fontSize:'12px', color:'#7c8088'}}>
                      {t.quantita}
                      {t.note && ` · ${t.note}`}
                    </div>
                    <div style={{
                      display:'flex', alignItems:'center', gap:'4px', marginTop:'4px'
                    }}>
                      <Clock size={11} color={passata && !assunta ? '#F7295A' : '#bec1cc'}/>
                      <span style={{
                        fontSize:'11px', fontWeight:'700',
                        color: assunta ? '#bec1cc' : passata ? '#F7295A' : '#193f9e'
                      }}>
                        {t.orario}
                        {passata && !assunta && ' — In ritardo!'}
                        {assunta && ' — Assunta ✓'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle assunta */}
                  <button
                    onClick={() => toggleAssunta(t.id)}
                    style={{
                      width:'36px', height:'36px', borderRadius:'50%', border:'none',
                      cursor:'pointer', flexShrink:0,
                      background: assunta
                        ? 'linear-gradient(135deg,#00BFA6,#2e84e9)'
                        : '#f3f4f7',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: assunta ? '0 3px 10px rgba(0,191,166,0.3)' : 'none',
                      transition:'all 0.2s'
                    }}>
                    <Check size={16} color={assunta ? '#fff' : '#bec1cc'}/>
                  </button>
                </div>
              )
            })
          )}

          {/* PROGRESSIONE GIORNATA */}
          {terapie.length > 0 && (
            <div style={{
              background:'#feffff', borderRadius:'18px', padding:'14px',
              marginTop:'10px', boxShadow:sh
            }}>
              <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'10px'}}>
                📊 Progresso oggi
              </div>
              <div style={{
                height:'8px', borderRadius:'4px', background:'#f3f4f7',
                overflow:'hidden', marginBottom:'6px'
              }}>
                <div style={{
                  height:'100%', borderRadius:'4px',
                  width:`${(Object.values(assunte).filter(Boolean).length/terapie.length)*100}%`,
                  background:'linear-gradient(90deg,#00BFA6,#2e84e9)',
                  transition:'width 0.4s'
                }}/>
              </div>
              <div style={{fontSize:'11px', color:'#7c8088', textAlign:'right'}}>
                {Object.values(assunte).filter(Boolean).length} di {terapie.length} terapie assunte
              </div>
            </div>
          )}

          {isDemo && (
            <div style={{
              textAlign:'center', marginTop:'12px',
              fontSize:'11px', color:'#8B6914', fontWeight:'600'
            }}>
              🎭 Modalità demo — dati non reali
            </div>
          )}

        </div>
      </div>
    </>
  )
}
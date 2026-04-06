import { useState, useEffect, useRef } from 'react'
import { Play, Square, RotateCcw, ChevronLeft, Check, Save, ChevronDown } from 'lucide-react'

const TIPI_CRISI = [
  { value:'Crisi tonico-cloniche', label:'Tonico-cloniche', sub:'Grande male', color:'#F7295A' },
  { value:'Crisi di assenza', label:'Assenza', sub:'Piccolo male', color:'#7B5EA7' },
  { value:'Crisi miocloniche', label:'Miocloniche', sub:'Scosse rapide', color:'#FF8C42' },
  { value:'Crisi toniche', label:'Toniche', sub:'Rigidità muscolare', color:'#2e84e9' },
  { value:'Crisi cloniche', label:'Cloniche', sub:'Movimenti ritmici', color:'#00BFA6' },
  { value:'Crisi atoniche', label:'Atoniche', sub:'Perdita tono', color:'#FFD93D' },
]

const AREE = [
  'Braccio dx', 'Braccio sx', 'Gamba dx', 'Gamba sx',
  'Capo verso dx', 'Capo verso sx', 'Parte dx del corpo',
  'Parte sx del corpo', 'Crisi generalizzata', 'Desaturazione', 'Scialorrea'
]

const CIBI = ['Nessuno', 'Colazione', 'Pranzo', 'Cena', 'Spuntino', 'Digiuno']

const TRIGGER = [
  'Nessuno noto', 'Farmaco dimenticato', 'Poco sonno', 'Stress',
  'Febbre', 'Luci intermittenti', 'Stanchezza', 'Attività fisica intensa',
  'Altro'
]

const FARMACI_SOCCORSO = [
  'Nessuno', 'Diazepam (Valium)', 'Midazolam (Buccolam)',
  'Lorazepam', 'Clonazepam', 'Diazepam rettale', 'Altro'
]

const ATTIVITA = [
  'Dormiva', 'Riposava sveglio', 'Mangiava', 'Giocava',
  'Guardava TV/schermo', 'In bagno', 'Camminava', 'Altro'
]

const LUOGO = [
  'Casa — camera', 'Casa — soggiorno', 'Casa — bagno',
  'Scuola', 'In auto', 'Spazio aperto', 'Altro'
]

const POST_CRISI = [
  'Sonno profondo', 'Confusione', 'Stanchezza', 'Normale',
  'Agitazione', 'Pianto', 'Dolore', 'Amnesia'
]

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

function SelectMenu({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{marginBottom:'10px'}}>
      {label && (
        <div style={{
          fontSize:'11px', fontWeight:'700', color:'#7c8088',
          textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'6px'
        }}>{label}</div>
      )}
      <div style={{position:'relative'}}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width:'100%', padding:'11px 36px 11px 12px',
            borderRadius:'12px', border:'1.5px solid #f0f1f4',
            fontSize:'13px', color: value ? '#02153f' : '#bec1cc',
            background:'#f3f4f7', fontFamily:'inherit',
            appearance:'none', outline:'none', cursor:'pointer'
          }}
          onFocus={e => e.target.style.borderColor='#2e84e9'}
          onBlur={e => e.target.style.borderColor='#f0f1f4'}
        >
          <option value="">{placeholder || 'Seleziona...'}</option>
          {options.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown size={16} color="#bec1cc" style={{
          position:'absolute', right:'12px', top:'50%',
          transform:'translateY(-50%)', pointerEvents:'none'
        }}/>
      </div>
    </div>
  )
}

export default function CrisiPage({ onBack, timerSecInizio = 0, isDemo }) {
  const [timerSec, setTimerSec] = useState(timerSecInizio)
  const [running, setRunning] = useState(timerSecInizio > 0)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef(null)

  // Form fields
  const [tipo, setTipo] = useState('')
  const [aree, setAree] = useState([])
  const [trigger, setTrigger] = useState('')
  const [attivita, setAttivita] = useState('')
  const [luogo, setLuogo] = useState('')
  const [cibo, setCibo] = useState('')
  const [farmaco, setFarmaco] = useState('')
  const [farmacoAltro, setFarmacoAltro] = useState('')
  const [farmacoOra, setFarmacoOra] = useState('')
  const [intensita, setIntensita] = useState(5)
  const [perdCoscienza, setPerdCoscienza] = useState(false)
  const [morseLingua, setMorseLingua] = useState(false)
  const [enuresi, setEnuresi] = useState(false)
  const [cianosi, setCianosi] = useState(false)
  const [emissioneVocale, setEmissioneVocale] = useState(false)
  const [postCrisi, setPostCrisi] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (timerSecInizio > 0) {
      timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [])

  function startTimer() {
    if (running) return
    setRunning(true)
    timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
  }
  function stopTimer() { setRunning(false); clearInterval(timerRef.current) }
  function resetTimer() { stopTimer(); setTimerSec(0) }

  function fmt(s) {
    return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
      .map(n => String(n).padStart(2,'0')).join(':')
  }

  function toggleArea(area) {
    setAree(prev => prev.includes(area)
      ? prev.filter(a => a !== area)
      : [...prev, area])
  }

  function handleSave() {
    if (!tipo) { alert('Seleziona il tipo di crisi'); return }
    stopTimer()
    const crisi = {
      id: Date.now(),
      type: tipo,
      duration: fmt(timerSec),
      durationSec: timerSec,
      date: new Date().toLocaleString('it-IT'),
      timestamp: Date.now(),
      areas: aree,
      trigger,
      attivita,
      luogo,
      ciboPreCrisi: cibo,
      farmaco: farmaco === 'Altro' ? farmacoAltro : farmaco,
      farmacoOra,
      intensita,
      perdCoscienza,
      morseLingua,
      enuresi,
      cianosi,
      emissioneVocale,
      postCrisi,
      note,
    }
    if (!isDemo) {
      console.log('Salvo crisi su Firebase:', crisi)
      // db.ref('crises').push(encrypt(crisi))
    }
    setSaved(true)
    setTimeout(() => onBack && onBack(), 2200)
  }

  if (saved) {
    return (
      <div style={{
        minHeight:'100vh', background:'#f3f4f7',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"-apple-system,'Segoe UI',sans-serif"
      }}>
        <div style={{textAlign:'center', padding:'40px'}}>
          <div style={{
            width:'80px', height:'80px', borderRadius:'50%',
            background:'linear-gradient(135deg,#00BFA6,#2e84e9)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px',
            boxShadow:'0 8px 24px rgba(0,191,166,0.35)'
          }}>
            <Check size={40} color="#fff" strokeWidth={3}/>
          </div>
          <div style={{fontSize:'22px', fontWeight:'900', color:'#08184c', marginBottom:'8px'}}>
            Crisi registrata!
          </div>
          <div style={{fontSize:'14px', color:'#7c8088'}}>
            Durata: {fmt(timerSec)} · {tipo}
          </div>
          {isDemo && (
            <div style={{
              marginTop:'16px', padding:'8px 16px',
              background:'rgba(255,140,66,0.12)', borderRadius:'20px',
              fontSize:'12px', color:'#8B6914', fontWeight:'600'
            }}>🎭 Modalità demo — dati non salvati</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .crisi-wrap{background:#f3f4f7;min-height:100vh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          padding-bottom:40px;width:100%;max-width:480px;margin:0 auto;}
        .toggle-pill{display:flex;align-items:center;justify-content:space-between;
          padding:10px 12px;border-radius:12px;cursor:pointer;
          margin-bottom:7px;transition:all 0.15s;}
      `}</style>

      <div className="crisi-wrap">

        {/* ── HEADER + TIMER ── */}
        <div style={{
          background:'linear-gradient(135deg,#F7295A,#FF8C42)',
          padding:'14px 16px 20px',
          position:'sticky', top:0, zIndex:10
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px'}}>
            <button onClick={onBack} style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'rgba(255,255,255,0.2)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:'18px', fontWeight:'900', color:'#fff'}}>
                🚨 Registra crisi
              </div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.75)'}}>
                {running ? '🔴 Timer in corso...' : 'Compila e salva'}
              </div>
            </div>
          </div>

          <div style={{
            background:'rgba(255,255,255,0.15)', borderRadius:'18px',
            padding:'14px', textAlign:'center'
          }}>
            <div style={{
              fontSize:'52px', fontWeight:'900', color:'#fff',
              letterSpacing:'-2px', fontVariantNumeric:'tabular-nums',
              lineHeight:1, marginBottom:'10px'
            }}>{fmt(timerSec)}</div>
            <div style={{display:'flex', justifyContent:'center', gap:'12px'}}>
              <button onClick={startTimer} style={{
                width:'44px', height:'44px', borderRadius:'50%', border:'none',
                background: running ? 'rgba(255,255,255,0.2)' : '#fff',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                boxShadow: running ? 'none' : '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <Play size={18} color={running ? '#fff' : '#F7295A'} fill={running ? '#fff' : '#F7295A'}/>
              </button>
              <button onClick={stopTimer} style={{
                width:'44px', height:'44px', borderRadius:'50%', border:'none',
                background:'rgba(255,255,255,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
              }}>
                <Square size={18} color="#fff" fill="#fff"/>
              </button>
              <button onClick={resetTimer} style={{
                width:'44px', height:'44px', borderRadius:'50%', border:'none',
                background:'rgba(255,255,255,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
              }}>
                <RotateCcw size={18} color="#fff"/>
              </button>
            </div>
          </div>
        </div>

        <div style={{padding:'12px 12px 0'}}>

          {/* ── TIPO CRISI ── */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'12px'}}>
              ⚡ Tipo di crisi *
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px'}}>
              {TIPI_CRISI.map(t => (
                <div key={t.value} onClick={() => setTipo(t.value)} style={{
                  padding:'10px 12px', borderRadius:'12px', cursor:'pointer',
                  border:`2px solid ${tipo===t.value ? t.color : '#f0f1f4'}`,
                  background: tipo===t.value ? `${t.color}14` : '#feffff',
                  transition:'all 0.15s'
                }}>
                  <div style={{
                    fontSize:'12px', fontWeight:'800',
                    color: tipo===t.value ? t.color : '#02153f'
                  }}>{t.label}</div>
                  <div style={{fontSize:'10px', color:'#7c8088', marginTop:'1px'}}>{t.sub}</div>
                  {tipo===t.value && (
                    <div style={{
                      width:'16px', height:'16px', borderRadius:'50%',
                      background:t.color, display:'flex', alignItems:'center',
                      justifyContent:'center', marginTop:'6px'
                    }}>
                      <Check size={10} color="#fff" strokeWidth={3}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── AREE CORPOREE ── */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'10px'}}>
              🧍 Aree coinvolte
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
              {AREE.map(area => {
                const sel = aree.includes(area)
                return (
                  <div key={area} onClick={() => toggleArea(area)} style={{
                    padding:'6px 12px', borderRadius:'20px', cursor:'pointer',
                    border:`1.5px solid ${sel ? '#2e84e9' : '#f0f1f4'}`,
                    background: sel ? '#EEF3FD' : '#feffff',
                    fontSize:'11px', fontWeight: sel ? '700' : '500',
                    color: sel ? '#193f9e' : '#7c8088', transition:'all 0.15s'
                  }}>
                    {sel ? '✓ ' : ''}{area}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── INTENSITÀ ── */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{
              display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'10px'
            }}>
              <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f'}}>
                📊 Intensità percepita
              </div>
              <div style={{
                width:'32px', height:'32px', borderRadius:'50%',
                background: intensita<=3 ? '#00BFA6' : intensita<=6 ? '#FFD93D' : '#F7295A',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'14px', fontWeight:'900', color:'#fff'
              }}>{intensita}</div>
            </div>
            <input type="range" min="1" max="10" value={intensita}
              onChange={e => setIntensita(Number(e.target.value))}
              style={{width:'100%', accentColor:'#2e84e9'}}/>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'4px'}}>
              <span style={{fontSize:'10px', color:'#00BFA6', fontWeight:'600'}}>Lieve (1)</span>
              <span style={{fontSize:'10px', color:'#FFD93D', fontWeight:'600'}}>Moderata (5)</span>
              <span style={{fontSize:'10px', color:'#F7295A', fontWeight:'600'}}>Grave (10)</span>
            </div>
          </div>

          {/* ── SINTOMI ASSOCIATI ── */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'10px'}}>
              🔍 Sintomi associati
            </div>
            {[
              { label:'Perdita di coscienza', value:perdCoscienza, set:setPerdCoscienza, color:'#F7295A' },
              { label:'Morso della lingua', value:morseLingua, set:setMorseLingua, color:'#FF8C42' },
              { label:'Enuresi (pipì involontaria)', value:enuresi, set:setEnuresi, color:'#7B5EA7' },
              { label:'Cianosi (colorito bluastro)', value:cianosi, set:setCianosi, color:'#2e84e9' },
              { label:'Emissione vocale', value:emissioneVocale, set:setEmissioneVocale, color:'#00BFA6' },
            ].map(({label, value, set, color}) => (
              <div key={label} onClick={() => set(!value)} className="toggle-pill" style={{
                background: value ? `${color}12` : '#f3f4f7',
                border: `1.5px solid ${value ? `${color}44` : 'transparent'}`,
              }}>
                <div style={{fontSize:'12px', fontWeight:'600', color: value ? color : '#394058'}}>
                  {label}
                </div>
                <div style={{
                  width:'44px', height:'24px', borderRadius:'12px',
                  background: value ? color : '#dde0ed',
                  position:'relative', transition:'background 0.2s', flexShrink:0
                }}>
                  <div style={{
                    width:'18px', height:'18px', borderRadius:'50%', background:'#fff',
                    position:'absolute', top:'3px',
                    left: value ? '23px' : '3px',
                    transition:'left 0.2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
                  }}/>
                </div>
              </div>
            ))}
          </div>

          {/* ── TRIGGER + CONTESTO ── */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'12px'}}>
              🔎 Contesto e trigger
            </div>
            <SelectMenu
              label="Possibile trigger"
              value={trigger}
              onChange={setTrigger}
              options={TRIGGER}
              placeholder="Cosa potrebbe averla scatenata?"
            />
            <SelectMenu
              label="Attività in corso"
              value={attivita}
              onChange={setAttivita}
              options={ATTIVITA}
              placeholder="Cosa stava facendo?"
            />
            <SelectMenu
              label="Luogo"
              value={luogo}
              onChange={setLuogo}
              options={LUOGO}
              placeholder="Dove si trovava?"
            />
            <SelectMenu
              label="Cibo pre-crisi"
              value={cibo}
              onChange={setCibo}
              options={CIBI}
              placeholder="Aveva mangiato?"
            />
          </div>

          {/* ── FARMACO DI SOCCORSO ── */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'12px'}}>
              💊 Farmaco di soccorso
            </div>
            <SelectMenu
              label="Farmaco somministrato"
              value={farmaco}
              onChange={setFarmaco}
              options={FARMACI_SOCCORSO}
              placeholder="È stato dato un farmaco?"
            />
            {farmaco === 'Altro' && (
              <div style={{marginBottom:'10px'}}>
                <div style={{fontSize:'11px', fontWeight:'700', color:'#7c8088',
                  textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'6px'}}>
                  Specifica farmaco
                </div>
                <input
                  value={farmacoAltro}
                  onChange={e => setFarmacoAltro(e.target.value)}
                  placeholder="Nome del farmaco..."
                  style={{
                    width:'100%', padding:'11px 12px', borderRadius:'12px',
                    border:'1.5px solid #f0f1f4', fontSize:'13px', color:'#02153f',
                    background:'#f3f4f7', fontFamily:'inherit', outline:'none',
                    boxSizing:'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor='#2e84e9'}
                  onBlur={e => e.target.style.borderColor='#f0f1f4'}
                />
              </div>
            )}
            {farmaco && farmaco !== 'Nessuno' && (
              <div>
                <div style={{fontSize:'11px', fontWeight:'700', color:'#7c8088',
                  textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'6px'}}>
                  Ora somministrazione
                </div>
                <input
                  type="time"
                  value={farmacoOra}
                  onChange={e => setFarmacoOra(e.target.value)}
                  style={{
                    width:'100%', padding:'11px 12px', borderRadius:'12px',
                    border:'1.5px solid #f0f1f4', fontSize:'13px', color:'#02153f',
                    background:'#f3f4f7', fontFamily:'inherit', outline:'none',
                    boxSizing:'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor='#2e84e9'}
                  onBlur={e => e.target.style.borderColor='#f0f1f4'}
                />
              </div>
            )}
          </div>

          {/* ── POST CRISI ── */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'12px'}}>
              😴 Stato post-crisi
            </div>
            <SelectMenu
              value={postCrisi}
              onChange={setPostCrisi}
              options={POST_CRISI}
              placeholder="Come sta dopo la crisi?"
            />
            <div style={{display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'4px'}}>
              {POST_CRISI.map(s => (
                <div key={s} onClick={() => setPostCrisi(s)} style={{
                  padding:'6px 12px', borderRadius:'20px', cursor:'pointer',
                  border:`1.5px solid ${postCrisi===s ? '#7B5EA7' : '#f0f1f4'}`,
                  background: postCrisi===s ? '#F5F3FF' : '#feffff',
                  fontSize:'11px', fontWeight: postCrisi===s ? '700' : '500',
                  color: postCrisi===s ? '#7B5EA7' : '#7c8088'
                }}>{s}</div>
              ))}
            </div>
          </div>

          {/* ── NOTE ── */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'16px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'8px'}}>
              📝 Note per il medico
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Aggiungi dettagli utili per il neurologo..."
              rows={3}
              style={{
                width:'100%', border:'1.5px solid #f0f1f4', borderRadius:'12px',
                padding:'10px 12px', fontSize:'13px', color:'#02153f',
                background:'#f3f4f7', fontFamily:'inherit', resize:'none',
                outline:'none', lineHeight:'1.5', boxSizing:'border-box'
              }}
              onFocus={e => e.target.style.borderColor='#2e84e9'}
              onBlur={e => e.target.style.borderColor='#f0f1f4'}
            />
          </div>

          {/* ── SALVA ── */}
          <button onClick={handleSave} style={{
            width:'100%', padding:'17px', borderRadius:'50px', border:'none',
            cursor:'pointer', fontWeight:'800', fontSize:'16px', color:'#fff',
            background: tipo
              ? 'linear-gradient(135deg,#08184c,#2e84e9)'
              : '#dde0ed',
            boxShadow: tipo ? '0 8px 24px rgba(8,24,76,0.35)' : 'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            gap:'8px', transition:'all 0.2s', marginBottom:'8px'
          }}>
            <Save size={18} color="#fff"/>
            {tipo
              ? `Salva crisi${timerSec > 0 ? ' — '+fmt(timerSec) : ''}`
              : 'Seleziona prima il tipo di crisi'}
          </button>

          {isDemo && (
            <div style={{
              textAlign:'center', fontSize:'11px',
              color:'#8B6914', fontWeight:'600', marginBottom:'8px'
            }}>
              🎭 Modalità demo — dati non salvati su Firebase
            </div>
          )}

        </div>
      </div>
    </>
  )
}
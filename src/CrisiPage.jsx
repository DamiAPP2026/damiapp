import { useState, useEffect, useRef } from 'react'
import { Play, Square, RotateCcw, ChevronLeft, Check, Save } from 'lucide-react'
import { db } from './firebase'
import { ref, push } from 'firebase/database'
import { encrypt } from './crypto'

const TIPI_CRISI = [
  { value:'Crisi tonico-cloniche', label:'Tonico-cloniche', sub:'Grande male', color:'#F7295A' },
  { value:'Crisi di assenza', label:'Assenza', sub:'Piccolo male', color:'#7B5EA7' },
  { value:'Crisi miocloniche', label:'Miocloniche', sub:'Scosse rapide', color:'#FF8C42' },
  { value:'Crisi toniche', label:'Toniche', sub:'Rigidità muscolare', color:'#2e84e9' },
  { value:'Crisi cloniche', label:'Cloniche', sub:'Movimenti ritmici', color:'#00BFA6' },
  { value:'Crisi atoniche', label:'Atoniche', sub:'Perdita tono', color:'#FFD93D' },
]

const AREE = [
  'Braccio dx','Braccio sx','Gamba dx','Gamba sx',
  'Capo verso dx','Capo verso sx','Parte dx del corpo',
  'Parte sx del corpo','Crisi generalizzata','Desaturazione','Scialorrea'
]

const TRIGGER = [
  'Nessuno noto','Farmaco dimenticato','Poco sonno','Stress',
  'Febbre','Luci intermittenti','Stanchezza','Attività fisica intensa','Altro'
]

const FARMACI_SOCCORSO = [
  'Nessuno','Diazepam (Valium)','Midazolam (Buccolam)',
  'Lorazepam','Clonazepam','Diazepam rettale','Altro'
]

const ATTIVITA = [
  'Dormiva','Riposava sveglio','Mangiava','Giocava',
  'Guardava TV/schermo','In bagno','Camminava','Altro'
]

const LUOGO = [
  'Casa — camera','Casa — soggiorno','Casa — bagno',
  'Scuola','In auto','Spazio aperto','Altro'
]

const POST_CRISI = [
  'Sonno profondo','Confusione','Stanchezza','Normale',
  'Agitazione','Pianto','Dolore','Amnesia'
]

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

function ChipGroup({ options, value, onChange, color='#2e84e9', colorBg='#EEF3FD' }) {
  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
      {options.map(o => {
        const sel = value === o
        return (
          <div key={o} onClick={() => onChange(sel ? '' : o)} style={{
            padding:'6px 13px', borderRadius:'20px', cursor:'pointer',
            border:`1.5px solid ${sel ? color : '#f0f1f4'}`,
            background: sel ? colorBg : '#feffff',
            fontSize:'12px', fontWeight: sel ? '700' : '500',
            color: sel ? color : '#7c8088', transition:'all 0.15s'
          }}>
            {sel ? '✓ ' : ''}{o}
          </div>
        )
      })}
    </div>
  )
}

function MultiChipGroup({ options, values, onChange, color='#2e84e9', colorBg='#EEF3FD' }) {
  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
      {options.map(o => {
        const sel = values.includes(o)
        return (
          <div key={o} onClick={() => onChange(
            sel ? values.filter(v => v !== o) : [...values, o]
          )} style={{
            padding:'6px 13px', borderRadius:'20px', cursor:'pointer',
            border:`1.5px solid ${sel ? color : '#f0f1f4'}`,
            background: sel ? colorBg : '#feffff',
            fontSize:'12px', fontWeight: sel ? '700' : '500',
            color: sel ? color : '#7c8088', transition:'all 0.15s'
          }}>
            {sel ? '✓ ' : ''}{o}
          </div>
        )
      })}
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background:'#feffff', borderRadius:'18px',
      padding:'14px', marginBottom:'10px', boxShadow:sh
    }}>
      <div style={{
        fontSize:'13px', fontWeight:'800',
        color:'#02153f', marginBottom:'12px'
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function CrisiPage({ onBack, timerSecInizio = 0, isDemo }) {
  const [timerSec, setTimerSec] = useState(timerSecInizio)
  const [running, setRunning] = useState(timerSecInizio > 0)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const timerRef = useRef(null)

  // Campi del modulo
  const [tipo, setTipo] = useState('')
  const [aree, setAree] = useState([])
  const [trigger, setTrigger] = useState('')
  const [attivita, setAttivita] = useState('')
  const [luogo, setLuogo] = useState('')
  const [ciboDescrizione, setCiboDescrizione] = useState('')
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

  // Avvia timer subito se arriva da Home
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
  function stopTimer() {
    setRunning(false)
    clearInterval(timerRef.current)
  }
  function resetTimer() { stopTimer(); setTimerSec(0) }

  function fmt(s) {
    return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
      .map(n => String(n).padStart(2,'0')).join(':')
  }

  async function handleSave() {
    // Validazione
    if (!tipo) {
      alert('Seleziona il tipo di crisi prima di salvare')
      return
    }
    if (timerSec === 0) {
      alert('Avvia il timer per registrare la durata della crisi')
      return
    }

    stopTimer()
    setSaving(true)
    setSaveError('')

    // Costruisco l'oggetto crisi completo
    const crisi = {
      id: Date.now(),
      type: tipo,
      duration: fmt(timerSec),
      durationSec: timerSec,
      date: new Date().toLocaleString('it-IT'),
      timestamp: Date.now(),
      areas: aree,
      trigger: trigger,
      attivita: attivita,
      luogo: luogo,
      ciboPreCrisi: ciboDescrizione,
      farmaco: farmaco === 'Altro' ? farmacoAltro : farmaco,
      farmacoOra: farmacoOra,
      intensita: intensita,
      perdCoscienza: perdCoscienza,
      morseLingua: morseLingua,
      enuresi: enuresi,
      cianosi: cianosi,
      emissioneVocale: emissioneVocale,
      postCrisi: postCrisi,
      note: note,
    }

    try {
      if (isDemo) {
        // Modalità demo: simula salvataggio senza toccare Firebase
        console.log('🎭 DEMO — Crisi NON salvata su Firebase:', crisi)
        await new Promise(r => setTimeout(r, 800)) // simula attesa
      } else {
        // Modalità reale: cifra e salva su Firebase
        console.log('💾 Salvataggio crisi su Firebase...')
        await push(ref(db, 'crises'), encrypt(crisi))
        console.log('✅ Crisi salvata con successo su Firebase')
      }
      setSaved(true)
    } catch (error) {
      console.error('❌ Errore salvataggio crisi:', error)
      setSaveError('Errore nel salvataggio. Verifica la connessione e riprova.')
      setSaving(false)
      // Riavvia timer in caso di errore
      startTimer()
    }
  }

  // Torna alla home dopo salvataggio
  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => onBack && onBack(), 2500)
      return () => clearTimeout(timer)
    }
  }, [saved])

  // Schermata di successo
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
          <div style={{
            fontSize:'22px', fontWeight:'900',
            color:'#08184c', marginBottom:'8px'
          }}>
            Crisi registrata!
          </div>
          <div style={{fontSize:'14px', color:'#7c8088', marginBottom:'6px'}}>
            Durata: <strong>{fmt(timerSec)}</strong>
          </div>
          <div style={{fontSize:'13px', color:'#7c8088', marginBottom:'16px'}}>
            {tipo}
          </div>
          {isDemo ? (
            <div style={{
              padding:'10px 18px', background:'rgba(255,140,66,0.12)',
              borderRadius:'20px', fontSize:'12px',
              color:'#8B6914', fontWeight:'600', display:'inline-block'
            }}>
              🎭 Modalità demo — dati non salvati su Firebase
            </div>
          ) : (
            <div style={{
              padding:'10px 18px', background:'rgba(0,191,166,0.12)',
              borderRadius:'20px', fontSize:'12px',
              color:'#007a6a', fontWeight:'600', display:'inline-block'
            }}>
              ✅ Salvato su Firebase
            </div>
          )}
          <div style={{fontSize:'11px', color:'#bec1cc', marginTop:'16px'}}>
            Torno alla home...
          </div>
        </div>
      </div>
    )
  }

  const labelStyle = {
    fontSize:'11px', fontWeight:'700', color:'#7c8088',
    textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'8px'
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f3f4f7; }
        .crisi-wrap {
          background: #f3f4f7; min-height: 100vh;
          font-family: -apple-system, 'Segoe UI', sans-serif;
          padding-bottom: 40px; width: 100%;
          max-width: 480px; margin: 0 auto;
        }
      `}</style>

      <div className="crisi-wrap">

        {/* ── HEADER + TIMER ── */}
        <div style={{
          background:'linear-gradient(135deg,#F7295A,#FF8C42)',
          padding:'14px 16px 20px',
          position:'sticky', top:0, zIndex:10
        }}>
          <div style={{
            display:'flex', alignItems:'center',
            gap:'12px', marginBottom:'14px'
          }}>
            <button onClick={onBack} style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'rgba(255,255,255,0.2)', border:'none',
              display:'flex', alignItems:'center',
              justifyContent:'center', cursor:'pointer'
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

          {/* Timer grande */}
          <div style={{
            background:'rgba(255,255,255,0.15)', borderRadius:'18px',
            padding:'14px', textAlign:'center'
          }}>
            <div style={{
              fontSize:'52px', fontWeight:'900', color:'#fff',
              letterSpacing:'-2px', fontVariantNumeric:'tabular-nums',
              lineHeight:1, marginBottom:'10px'
            }}>
              {fmt(timerSec)}
            </div>
            <div style={{display:'flex', justifyContent:'center', gap:'12px'}}>
              <button onClick={startTimer} style={{
                width:'44px', height:'44px', borderRadius:'50%', border:'none',
                background: running ? 'rgba(255,255,255,0.2)' : '#fff',
                display:'flex', alignItems:'center',
                justifyContent:'center', cursor:'pointer',
                boxShadow: running ? 'none' : '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <Play size={18}
                  color={running ? '#fff' : '#F7295A'}
                  fill={running ? '#fff' : '#F7295A'}/>
              </button>
              <button onClick={stopTimer} style={{
                width:'44px', height:'44px', borderRadius:'50%', border:'none',
                background:'rgba(255,255,255,0.2)',
                display:'flex', alignItems:'center',
                justifyContent:'center', cursor:'pointer'
              }}>
                <Square size={18} color="#fff" fill="#fff"/>
              </button>
              <button onClick={resetTimer} style={{
                width:'44px', height:'44px', borderRadius:'50%', border:'none',
                background:'rgba(255,255,255,0.15)',
                display:'flex', alignItems:'center',
                justifyContent:'center', cursor:'pointer'
              }}>
                <RotateCcw size={18} color="#fff"/>
              </button>
            </div>
          </div>
        </div>

        <div style={{padding:'12px 12px 0'}}>

          {/* TIPO CRISI */}
          <SectionCard title="⚡ Tipo di crisi *">
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
                  <div style={{
                    fontSize:'10px', color:'#7c8088', marginTop:'1px'
                  }}>{t.sub}</div>
                  {tipo===t.value && (
                    <div style={{
                      width:'16px', height:'16px', borderRadius:'50%',
                      background:t.color, display:'flex',
                      alignItems:'center', justifyContent:'center',
                      marginTop:'6px'
                    }}>
                      <Check size={10} color="#fff" strokeWidth={3}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* AREE CORPOREE */}
          <SectionCard title="🧍 Aree coinvolte">
            <MultiChipGroup
              options={AREE}
              values={aree}
              onChange={setAree}
              color="#2e84e9"
              colorBg="#EEF3FD"
            />
          </SectionCard>

          {/* INTENSITÀ */}
          <SectionCard title="📊 Intensità percepita">
            <div style={{
              display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'10px'
            }}>
              <div style={{fontSize:'12px', color:'#7c8088'}}>
                Scala da 1 (lieve) a 10 (grave)
              </div>
              <div style={{
                width:'34px', height:'34px', borderRadius:'50%',
                background: intensita<=3 ? '#00BFA6' : intensita<=6 ? '#FFD93D' : '#F7295A',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'15px', fontWeight:'900', color:'#fff'
              }}>{intensita}</div>
            </div>
            <input type="range" min="1" max="10" value={intensita}
              onChange={e => setIntensita(Number(e.target.value))}
              style={{width:'100%', accentColor:'#2e84e9'}}/>
            <div style={{
              display:'flex', justifyContent:'space-between', marginTop:'4px'
            }}>
              <span style={{fontSize:'10px', color:'#00BFA6', fontWeight:'600'}}>Lieve</span>
              <span style={{fontSize:'10px', color:'#FFD93D', fontWeight:'600'}}>Moderata</span>
              <span style={{fontSize:'10px', color:'#F7295A', fontWeight:'600'}}>Grave</span>
            </div>
          </SectionCard>

          {/* SINTOMI ASSOCIATI */}
          <SectionCard title="🔍 Sintomi associati">
            {[
              {label:'Perdita di coscienza', value:perdCoscienza, set:setPerdCoscienza, color:'#F7295A'},
              {label:'Morso della lingua', value:morseLingua, set:setMorseLingua, color:'#FF8C42'},
              {label:'Enuresi (pipì involontaria)', value:enuresi, set:setEnuresi, color:'#7B5EA7'},
              {label:'Cianosi (colorito bluastro)', value:cianosi, set:setCianosi, color:'#2e84e9'},
              {label:'Emissione vocale', value:emissioneVocale, set:setEmissioneVocale, color:'#00BFA6'},
            ].map(({label, value, set, color}) => (
              <div key={label} onClick={() => set(!value)} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 12px', borderRadius:'12px', cursor:'pointer',
                marginBottom:'7px',
                background: value ? `${color}12` : '#f3f4f7',
                border:`1.5px solid ${value ? `${color}44` : 'transparent'}`,
                transition:'all 0.15s'
              }}>
                <div style={{
                  fontSize:'12px', fontWeight:'600',
                  color: value ? color : '#394058'
                }}>
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
                    left: value ? '23px' : '3px', transition:'left 0.2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
                  }}/>
                </div>
              </div>
            ))}
          </SectionCard>

          {/* TRIGGER */}
          <SectionCard title="🔎 Trigger scatenante">
            <ChipGroup
              options={TRIGGER}
              value={trigger}
              onChange={setTrigger}
              color="#F7295A"
              colorBg="#FEF0F4"
            />
          </SectionCard>

          {/* CONTESTO */}
          <SectionCard title="📍 Contesto">
            <div style={labelStyle}>Attività in corso</div>
            <ChipGroup
              options={ATTIVITA}
              value={attivita}
              onChange={setAttivita}
              color="#2e84e9"
              colorBg="#EEF3FD"
            />
            <div style={{...labelStyle, marginTop:'14px'}}>Luogo</div>
            <ChipGroup
              options={LUOGO}
              value={luogo}
              onChange={setLuogo}
              color="#7B5EA7"
              colorBg="#F5F3FF"
            />
          </SectionCard>

          {/* CIBO PRE-CRISI */}
          <SectionCard title="🍽️ Cibo pre-crisi">
            <textarea
              value={ciboDescrizione}
              onChange={e => setCiboDescrizione(e.target.value)}
              placeholder="Descrivi cosa ha mangiato o bevuto prima della crisi. Es: colazione con latte e biscotti, a digiuno..."
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
          </SectionCard>

          {/* FARMACO DI SOCCORSO */}
          <SectionCard title="💊 Farmaco di soccorso">
            <div style={labelStyle}>Farmaco somministrato</div>
            <ChipGroup
              options={FARMACI_SOCCORSO}
              value={farmaco}
              onChange={setFarmaco}
              color="#00BFA6"
              colorBg="#F0FDFB"
            />
            {farmaco === 'Altro' && (
              <div style={{marginTop:'10px'}}>
                <div style={labelStyle}>Specifica farmaco</div>
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
              <div style={{marginTop:'10px'}}>
                <div style={labelStyle}>Ora somministrazione</div>
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
          </SectionCard>

          {/* POST CRISI */}
          <SectionCard title="😴 Stato post-crisi">
            <ChipGroup
              options={POST_CRISI}
              value={postCrisi}
              onChange={setPostCrisi}
              color="#7B5EA7"
              colorBg="#F5F3FF"
            />
          </SectionCard>

          {/* NOTE */}
          <SectionCard title="📝 Note per il medico">
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
          </SectionCard>

          {/* ERRORE SALVATAGGIO */}
          {saveError && (
            <div style={{
              background:'#FEF0F4', borderRadius:'14px', padding:'12px 14px',
              marginBottom:'10px', border:'1.5px solid #F7295A33',
              fontSize:'13px', color:'#F7295A', fontWeight:'600',
              textAlign:'center'
            }}>
              ❌ {saveError}
            </div>
          )}

          {/* PULSANTE SALVA */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width:'100%', padding:'17px', borderRadius:'50px', border:'none',
              cursor: saving ? 'wait' : tipo ? 'pointer' : 'default',
              fontWeight:'800', fontSize:'16px', color:'#fff',
              background: saving
                ? 'linear-gradient(135deg,#7c8088,#bec1cc)'
                : tipo
                  ? 'linear-gradient(135deg,#08184c,#2e84e9)'
                  : '#dde0ed',
              boxShadow: tipo && !saving
                ? '0 8px 24px rgba(8,24,76,0.35)'
                : 'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              gap:'8px', transition:'all 0.2s', marginBottom:'8px',
              opacity: saving ? 0.7 : 1
            }}>
            {saving
              ? <><span style={{fontSize:'16px'}}>⏳</span> Salvataggio in corso...</>
              : <><Save size={18} color="#fff"/>
                  {tipo
                    ? `Salva crisi${timerSec>0 ? ' — '+fmt(timerSec) : ''}`
                    : 'Seleziona prima il tipo di crisi'
                  }
                </>
            }
          </button>

          {isDemo && (
            <div style={{
              textAlign:'center', fontSize:'11px',
              color:'#8B6914', fontWeight:'600', marginBottom:'16px'
            }}>
              🎭 Modalità demo — la crisi non verrà salvata su Firebase
            </div>
          )}

        </div>
      </div>
    </>
  )
}
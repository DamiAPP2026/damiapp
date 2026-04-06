import { useState, useEffect } from 'react'
import { ChevronLeft, Check, Save } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue } from 'firebase/database'

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

const DEMO_LOG = [
  {id:1, data:'06/04/2026', ora:'08:30', bisogno:'pippi', modalita:'caa-auto', incidentePippi:false, incidenteCacca:false},
  {id:2, data:'06/04/2026', ora:'13:15', bisogno:'entrambi', modalita:'adulto', incidentePippi:false, incidenteCacca:false},
  {id:3, data:'05/04/2026', ora:'09:00', bisogno:'cacca', modalita:'caa-guidata', incidentePippi:false, incidenteCacca:false},
  {id:4, data:'05/04/2026', ora:'15:30', bisogno:'pippi', modalita:'caa-auto', incidentePippi:true, oraPippi:'15:10', incidenteCacca:false},
]

export default function ToiletPage({ onBack, isDemo }) {
  const oggi = new Date()
  const [ttDate, setTtDate] = useState(oggi.toISOString().split('T')[0])
  const [ttOra, setTtOra] = useState(oggi.toTimeString().slice(0,5))
  const [ttBisogno, setTtBisogno] = useState('')
  const [ttModalita, setTtModalita] = useState('')
  const [ttIncidentePippi, setTtIncidentePippi] = useState(false)
  const [ttOraPippi, setTtOraPippi] = useState('')
  const [ttIncidenteCacca, setTtIncidenteCacca] = useState(false)
  const [ttOraCacca, setTtOraCacca] = useState('')
  const [saved, setSaved] = useState(false)
  const [log, setLog] = useState([])

  useEffect(() => {
    if (isDemo) { setLog(DEMO_LOG); return }
    const ttRef = ref(db, 'toilet_training')
    const unsubscribe = onValue(ttRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const lista = Object.values(data)
          .filter(Boolean)
          .sort((a,b) => b.timestamp - a.timestamp)
        setLog(lista)
      } else {
        setLog([])
      }
    })
    return () => unsubscribe()
  }, [isDemo])

  function handleSave() {
    if (!ttBisogno) { alert('Seleziona che bisogno ha fatto'); return }
    if (!ttModalita) { alert('Seleziona la modalità'); return }
    const sessione = {
      id: Date.now(),
      timestamp: Date.now(),
      data: ttDate.split('-').reverse().join('/'),
      ora: ttOra,
      bisogno: ttBisogno,
      modalita: ttModalita,
      incidentePippi: ttIncidentePippi,
      oraPippi: ttIncidentePippi ? ttOraPippi : '',
      incidenteCacca: ttIncidenteCacca,
      oraCacca: ttIncidenteCacca ? ttOraCacca : '',
    }
    if (!isDemo) {
      push(ref(db, 'toilet_training'), sessione)
    }
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setTtBisogno('')
      setTtModalita('')
      setTtIncidentePippi(false)
      setTtOraPippi('')
      setTtIncidenteCacca(false)
      setTtOraCacca('')
    }, 1500)
  }

  const inputStyle = {
    width:'100%', padding:'11px 12px', borderRadius:'12px',
    border:'1.5px solid #f0f1f4', fontSize:'14px', color:'#02153f',
    background:'#f3f4f7', fontFamily:'inherit', outline:'none',
    boxSizing:'border-box'
  }

  const labelStyle = {
    fontSize:'11px', fontWeight:'700', color:'#7c8088',
    textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'6px', display:'block'
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .toilet-wrap{background:#f3f4f7;min-height:100vh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="toilet-wrap">

        {/* HEADER */}
        <div style={{
          background:'linear-gradient(135deg,#7B5EA7,#2e84e9)',
          padding:'14px 16px 24px'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px'}}>
            <button onClick={onBack} style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'rgba(255,255,255,0.2)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}><ChevronLeft size={20} color="#fff"/></button>
            <div>
              <div style={{fontSize:'18px', fontWeight:'900', color:'#fff'}}>🚽 Toilet Training</div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.75)'}}>
                {isDemo ? '🎭 Dati demo' : 'Registra sessione'}
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* FORM NUOVA SESSIONE */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', marginBottom:'10px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'12px'}}>
              ➕ Nuova sessione
            </div>

            {/* Data e ora */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div>
                <label style={labelStyle}>Data</label>
                <input type="date" value={ttDate} onChange={e => setTtDate(e.target.value)} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Ora</label>
                <input type="time" value={ttOra} onChange={e => setTtOra(e.target.value)} style={inputStyle}/>
              </div>
            </div>

            {/* Bisogno */}
            <div style={{marginBottom:'12px'}}>
              <label style={labelStyle}>💧 Che bisogno ha fatto?</label>
              <div style={{display:'flex', gap:'8px'}}>
                {[
                  {key:'pippi', label:'💧 Pipì'},
                  {key:'cacca', label:'💩 Cacca'},
                  {key:'entrambi', label:'🔄 Entrambi'},
                ].map(({key, label}) => (
                  <div key={key} onClick={() => setTtBisogno(key)} style={{
                    flex:1, padding:'10px 8px', borderRadius:'12px', cursor:'pointer',
                    textAlign:'center', fontSize:'12px', fontWeight:'700',
                    border:`2px solid ${ttBisogno===key ? '#7B5EA7' : '#f0f1f4'}`,
                    background: ttBisogno===key ? '#F5F3FF' : '#feffff',
                    color: ttBisogno===key ? '#7B5EA7' : '#7c8088',
                    transition:'all 0.15s'
                  }}>{label}</div>
                ))}
              </div>
            </div>

            {/* Modalità */}
            <div style={{marginBottom:'12px'}}>
              <label style={labelStyle}>🧠 Come è andato in bagno?</label>
              {[
                {key:'adulto', icon:'👆', title:'Comando adulto', sub:"Imposto dall'adulto"},
                {key:'caa-guidata', icon:'🤝', title:'CAA guidata', sub:'Comunicazione Aumentativa guidata da adulto'},
                {key:'caa-auto', icon:'⭐', title:'CAA autonoma', sub:'Comunicazione Aumentativa in autonomia'},
              ].map(opt => (
                <div key={opt.key} onClick={() => setTtModalita(opt.key)} style={{
                  display:'flex', alignItems:'center', gap:'12px',
                  padding:'11px 12px', borderRadius:'12px', cursor:'pointer',
                  marginBottom:'6px',
                  border:`2px solid ${ttModalita===opt.key ? '#7B5EA7' : '#f0f1f4'}`,
                  background: ttModalita===opt.key ? '#F5F3FF' : '#feffff',
                  transition:'all 0.15s'
                }}>
                  <div style={{
                    width:'36px', height:'36px', borderRadius:'10px',
                    background: ttModalita===opt.key ? '#7B5EA7' : '#f3f4f7',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'18px', flexShrink:0, transition:'background 0.15s'
                  }}>{opt.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{
                      fontSize:'13px', fontWeight:'700',
                      color: ttModalita===opt.key ? '#7B5EA7' : '#02153f'
                    }}>{opt.title}</div>
                    <div style={{fontSize:'10px', color:'#7c8088'}}>{opt.sub}</div>
                  </div>
                  {ttModalita===opt.key && <Check size={16} color="#7B5EA7"/>}
                </div>
              ))}
            </div>

            {/* Incidenti */}
            <div style={{marginBottom:'14px'}}>
              <label style={labelStyle}>⚠️ Incidente addosso?</label>
              {/* Pipì */}
              <div onClick={() => setTtIncidentePippi(!ttIncidentePippi)} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 12px', borderRadius:'12px', cursor:'pointer',
                background: ttIncidentePippi ? '#FEF0F4' : '#f3f4f7',
                border:`1.5px solid ${ttIncidentePippi ? '#F7295A33' : 'transparent'}`,
                marginBottom:'6px'
              }}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <span style={{fontSize:'16px'}}>💧</span>
                  <span style={{fontSize:'12px', fontWeight:'700',
                    color: ttIncidentePippi ? '#F7295A' : '#7c8088'}}>Pipì addosso</span>
                </div>
                <div style={{
                  width:'44px', height:'24px', borderRadius:'12px',
                  background: ttIncidentePippi ? '#F7295A' : '#dde0ed',
                  position:'relative', transition:'background 0.2s'
                }}>
                  <div style={{
                    width:'18px', height:'18px', borderRadius:'50%', background:'#fff',
                    position:'absolute', top:'3px',
                    left: ttIncidentePippi ? '23px' : '3px', transition:'left 0.2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
                  }}/>
                </div>
              </div>
              {ttIncidentePippi && (
                <div style={{padding:'0 4px 8px'}}>
                  <label style={{...labelStyle, marginBottom:'4px'}}>Ora incidente pipì</label>
                  <input type="time" value={ttOraPippi}
                    onChange={e => setTtOraPippi(e.target.value)} style={inputStyle}/>
                </div>
              )}

              {/* Cacca */}
              <div onClick={() => setTtIncidenteCacca(!ttIncidenteCacca)} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 12px', borderRadius:'12px', cursor:'pointer',
                background: ttIncidenteCacca ? '#FEF0F4' : '#f3f4f7',
                border:`1.5px solid ${ttIncidenteCacca ? '#F7295A33' : 'transparent'}`,
                marginBottom:'6px'
              }}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <span style={{fontSize:'16px'}}>💩</span>
                  <span style={{fontSize:'12px', fontWeight:'700',
                    color: ttIncidenteCacca ? '#F7295A' : '#7c8088'}}>Cacca addosso</span>
                </div>
                <div style={{
                  width:'44px', height:'24px', borderRadius:'12px',
                  background: ttIncidenteCacca ? '#F7295A' : '#dde0ed',
                  position:'relative', transition:'background 0.2s'
                }}>
                  <div style={{
                    width:'18px', height:'18px', borderRadius:'50%', background:'#fff',
                    position:'absolute', top:'3px',
                    left: ttIncidenteCacca ? '23px' : '3px', transition:'left 0.2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
                  }}/>
                </div>
              </div>
              {ttIncidenteCacca && (
                <div style={{padding:'0 4px 8px'}}>
                  <label style={{...labelStyle, marginBottom:'4px'}}>Ora incidente cacca</label>
                  <input type="time" value={ttOraCacca}
                    onChange={e => setTtOraCacca(e.target.value)} style={inputStyle}/>
                </div>
              )}
            </div>

            {/* Salva */}
            <button onClick={handleSave} style={{
              width:'100%', padding:'15px', borderRadius:'50px', border:'none',
              cursor:'pointer', fontWeight:'800', fontSize:'15px', color:'#fff',
              background: saved
                ? 'linear-gradient(135deg,#00BFA6,#2e84e9)'
                : 'linear-gradient(135deg,#7B5EA7,#2e84e9)',
              boxShadow:'0 6px 20px rgba(123,94,167,0.35)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              transition:'all 0.3s'
            }}>
              {saved ? <><Check size={18} color="#fff"/> Salvato!</> : <><Save size={18} color="#fff"/> Salva sessione</>}
            </button>
          </div>

          {/* LOG SESSIONI */}
          <div style={{background:'#feffff', borderRadius:'18px', padding:'14px', boxShadow:sh}}>
            <div style={{fontSize:'13px', fontWeight:'800', color:'#02153f', marginBottom:'12px'}}>
              📋 Sessioni recenti
            </div>
            {log.length === 0 ? (
              <div style={{textAlign:'center', padding:'20px', color:'#bec1cc', fontSize:'13px'}}>
                Nessuna sessione registrata
              </div>
            ) : (
              log.slice(0,10).map((s,i) => (
                <div key={s.id || i} style={{
                  padding:'10px 12px', borderRadius:'12px', marginBottom:'7px',
                  background:'#f3f4f7',
                  borderLeft:`3px solid ${s.bisogno==='pippi' ? '#2e84e9' : s.bisogno==='cacca' ? '#7B5EA7' : '#00BFA6'}`
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                    <span style={{fontSize:'12px', fontWeight:'800', color:'#02153f'}}>
                      {s.bisogno==='pippi' ? '💧 Pipì' : s.bisogno==='cacca' ? '💩 Cacca' : '🔄 Entrambi'}
                    </span>
                    <span style={{fontSize:'11px', color:'#bec1cc'}}>{s.data} {s.ora}</span>
                  </div>
                  <div style={{fontSize:'11px', color:'#7c8088'}}>
                    {s.modalita==='adulto' ? '👆 Comando adulto' :
                     s.modalita==='caa-guidata' ? '🤝 CAA guidata' : '⭐ CAA autonoma'}
                  </div>
                  {(s.incidentePippi || s.incidenteCacca) && (
                    <div style={{
                      fontSize:'10px', color:'#F7295A', fontWeight:'700', marginTop:'4px'
                    }}>
                      ⚠️ Incidente {s.incidentePippi ? 'pipì' : ''}{s.incidentePippi && s.incidenteCacca ? ' e ' : ''}{s.incidenteCacca ? 'cacca' : ''}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
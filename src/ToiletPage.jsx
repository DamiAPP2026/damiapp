import { useState, useEffect } from 'react'
import { ChevronLeft, Check, Save } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'
import ToiletCharts from './ToiletCharts'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

const DEMO_LOG = [
  {id:1, timestamp:Date.now()-3600000, data:'07/04/2026', ora:'08:30', bisogno:'pippi', modalita:'caa-auto', incidentePippi:false, incidenteCacca:false},
  {id:2, timestamp:Date.now()-7200000, data:'07/04/2026', ora:'13:15', bisogno:'entrambi', modalita:'adulto', incidentePippi:false, incidenteCacca:false},
  {id:3, timestamp:Date.now()-86400000, data:'06/04/2026', ora:'09:00', bisogno:'cacca', modalita:'caa-guidata', incidentePippi:false, incidenteCacca:false},
  {id:4, timestamp:Date.now()-90000000, data:'06/04/2026', ora:'15:30', bisogno:'pippi', modalita:'caa-auto', incidentePippi:true, oraPippi:'15:10', incidenteCacca:false},
  {id:5, timestamp:Date.now()-180000000, data:'05/04/2026', ora:'11:00', bisogno:'nessuno', modalita:'', incidentePippi:true, oraPippi:'10:50', incidenteCacca:true, oraCacca:'10:55'},
]

export default function ToiletPage({ onBack, isDemo }) {
  const oggi = new Date()
  const [ttDate, setTtDate] = useState(oggi.toISOString().split('T')[0])
  const [ttOra, setTtOra] = useState(oggi.toTimeString().slice(0,5))

  // Bisogno in bagno — INDIPENDENTE dagli incidenti
  const [ttBisogno, setTtBisogno] = useState('')
  const [ttModalita, setTtModalita] = useState('')

  // Incidenti — COMPLETAMENTE INDIPENDENTI
  const [ttIncidentePippi, setTtIncidentePippi] = useState(false)
  const [ttOraPippi, setTtOraPippi] = useState('')
  const [ttIncidenteCacca, setTtIncidenteCacca] = useState(false)
  const [ttOraCacca, setTtOraCacca] = useState('')

  const [saved, setSaved] = useState(false)
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [sezione, setSezione] = useState('form') // 'form' | 'log'

  useEffect(() => {
    if (isDemo) { setLog(DEMO_LOG); setLoading(false); return }
    const ttRef = ref(db, 'toilet_training')
    const unsubscribe = onValue(ttRef, (snapshot) => {
      const lista = processFirebaseSnap(snapshot)
        .sort((a,b) => b.timestamp - a.timestamp)
      setLog(lista)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [isDemo])

  function handleSave() {
    // Validazione: almeno bisogno in bagno OPPURE un incidente
    const hasBagno = ttBisogno !== ''
    const hasIncidente = ttIncidentePippi || ttIncidenteCacca
    if (!hasBagno && !hasIncidente) {
      alert('Seleziona almeno: cosa ha fatto in bagno oppure se c\'è stato un incidente')
      return
    }
    // Se ha fatto qualcosa in bagno, la modalità è obbligatoria
    if (hasBagno && !ttModalita) {
      alert('Seleziona come è andato in bagno')
      return
    }

    const sessione = {
      id: Date.now(),
      timestamp: Date.now(),
      data: ttDate.split('-').reverse().join('/'),
      ora: ttOra,
      bisogno: ttBisogno || 'nessuno',
      modalita: ttModalita,
      incidentePippi: ttIncidentePippi,
      oraPippi: ttIncidentePippi ? ttOraPippi : '',
      incidenteCacca: ttIncidenteCacca,
      oraCacca: ttIncidenteCacca ? ttOraCacca : '',
    }

    if (!isDemo) push(ref(db, 'toilet_training'), encrypt(sessione))

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setTtBisogno('')
      setTtModalita('')
      setTtIncidentePippi(false)
      setTtOraPippi('')
      setTtIncidenteCacca(false)
      setTtOraCacca('')
      const n = new Date()
      setTtOra(n.toTimeString().slice(0,5))
    }, 1500)
  }

  const inputStyle = {
    width:'100%', padding:'11px 12px', borderRadius:'12px',
    border:'1.5px solid #f0f1f4', fontSize:f(13), color:'#02153f',
    background:'#f3f4f7', fontFamily:'inherit', outline:'none',
    boxSizing:'border-box'
  }
  const labelStyle = {
    fontSize:f(11), fontWeight:'700', color:'#7c8088',
    textTransform:'uppercase', letterSpacing:'0.4px',
    marginBottom:'6px', display:'block'
  }

  // Stats rapide
  const oggi2 = new Date().toLocaleDateString('it-IT')
  const logOggi = log.filter(s => s.data === oggi2)
  const incidentiOggi = logOggi.filter(s => s.incidentePippi || s.incidenteCacca).length
  const bagnoOggi = logOggi.filter(s => s.bisogno && s.bisogno !== 'nessuno').length

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .toilet-wrap{
          background:#f3f4f7;min-height:100vh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;
        }
      `}</style>
      <div className="toilet-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#7B5EA7,#2e84e9)',padding:'14px 16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>🚽 Toilet Training</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                {isDemo ? '🎭 Dati demo' : 'Registra sessione'}
              </div>
            </div>
          </div>

          {/* Stats rapide */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
            {[
              {label:'Bagno oggi', val:bagnoOggi, color:'#fff'},
              {label:'Incidenti oggi', val:incidentiOggi, color:incidentiOggi>0?'#FFD93D':'#fff'},
              {label:'Totale log', val:log.length, color:'#fff'},
            ].map(({label,val,color},i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:f(20),fontWeight:'900',color}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TAB form / log */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#f3f4f7',margin:'12px 12px 0',borderRadius:'12px',padding:'3px',gap:'3px'}}>
          {[{k:'form',l:'➕ Nuova sessione'},{k:'log',l:'📋 Log sessioni'}].map(({k,l})=>(
            <button key={k} onClick={()=>setSezione(k)} style={{
              padding:'9px',borderRadius:'9px',border:'none',cursor:'pointer',
              fontWeight:'700',fontSize:f(12),fontFamily:'inherit',
              background:sezione===k?'#feffff':'transparent',
              color:sezione===k?'#7B5EA7':'#7c8088',
              boxShadow:sezione===k?'0 2px 8px rgba(2,21,63,0.10)':'none',
              transition:'all 0.2s'
            }}>{l}</button>
          ))}
        </div>

        <div style={{padding:'12px'}}>

          {/* ── FORM NUOVA SESSIONE ── */}
          {sezione==='form' && (
            <>
              {/* Data e ora */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                  📅 Data e ora
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  <div>
                    <label style={labelStyle}>Data</label>
                    <input type="date" value={ttDate}
                      onChange={e=>setTtDate(e.target.value)} style={inputStyle}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Ora</label>
                    <input type="time" value={ttOra}
                      onChange={e=>setTtOra(e.target.value)} style={inputStyle}/>
                  </div>
                </div>
              </div>

              {/* ── SEZIONE INCIDENTI — COMPLETAMENTE INDIPENDENTE ── */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>
                  ⚠️ Incidente addosso
                </div>
                <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>
                  Registra se c'è stato un incidente — indipendentemente da cosa ha fatto in bagno
                </div>

                {/* Toggle Pipì addosso */}
                <div onClick={()=>setTtIncidentePippi(!ttIncidentePippi)} style={{
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'12px',borderRadius:'14px',cursor:'pointer',
                  background:ttIncidentePippi?'#FEF0F4':'#f3f4f7',
                  border:`2px solid ${ttIncidentePippi?'#F7295A33':'transparent'}`,
                  marginBottom:'8px',transition:'all 0.15s'
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'22px'}}>💧</span>
                    <div>
                      <div style={{fontSize:f(13),fontWeight:'700',color:ttIncidentePippi?'#F7295A':'#394058'}}>
                        Pipì addosso
                      </div>
                      <div style={{fontSize:f(10),color:'#7c8088'}}>Ha fatto pipì nei vestiti</div>
                    </div>
                  </div>
                  <div style={{width:'48px',height:'26px',borderRadius:'13px',background:ttIncidentePippi?'#F7295A':'#dde0ed',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                    <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'3px',left:ttIncidentePippi?'25px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                  </div>
                </div>

                {/* Ora incidente pipì */}
                {ttIncidentePippi && (
                  <div style={{padding:'4px 4px 10px',animation:'fadeIn 0.2s'}}>
                    <label style={labelStyle}>Ora dell'incidente pipì</label>
                    <input type="time" value={ttOraPippi}
                      onChange={e=>setTtOraPippi(e.target.value)}
                      style={inputStyle}/>
                  </div>
                )}

                {/* Toggle Cacca addosso */}
                <div onClick={()=>setTtIncidenteCacca(!ttIncidenteCacca)} style={{
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'12px',borderRadius:'14px',cursor:'pointer',
                  background:ttIncidenteCacca?'#FEF0F4':'#f3f4f7',
                  border:`2px solid ${ttIncidenteCacca?'#F7295A33':'transparent'}`,
                  marginBottom:'8px',transition:'all 0.15s'
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'22px'}}>💩</span>
                    <div>
                      <div style={{fontSize:f(13),fontWeight:'700',color:ttIncidenteCacca?'#F7295A':'#394058'}}>
                        Cacca addosso
                      </div>
                      <div style={{fontSize:f(10),color:'#7c8088'}}>Ha fatto cacca nei vestiti</div>
                    </div>
                  </div>
                  <div style={{width:'48px',height:'26px',borderRadius:'13px',background:ttIncidenteCacca?'#F7295A':'#dde0ed',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                    <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'3px',left:ttIncidenteCacca?'25px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                  </div>
                </div>

                {/* Ora incidente cacca */}
                {ttIncidenteCacca && (
                  <div style={{padding:'4px 4px 10px'}}>
                    <label style={labelStyle}>Ora dell'incidente cacca</label>
                    <input type="time" value={ttOraCacca}
                      onChange={e=>setTtOraCacca(e.target.value)}
                      style={inputStyle}/>
                  </div>
                )}
              </div>

              {/* ── SEZIONE BAGNO — COMPLETAMENTE INDIPENDENTE ── */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>
                  🚽 Ha usato il bagno?
                </div>
                <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>
                  Opzionale — compila solo se ha fatto qualcosa in bagno
                </div>

                {/* Cosa ha fatto */}
                <label style={labelStyle}>💧 Cosa ha fatto in bagno</label>
                <div style={{display:'flex',gap:'7px',marginBottom:'14px'}}>
                  {[
                    {key:'pippi',label:'💧 Pipì'},
                    {key:'cacca',label:'💩 Cacca'},
                    {key:'entrambi',label:'🔄 Entrambi'},
                  ].map(({key,label})=>(
                    <div key={key} onClick={()=>setTtBisogno(ttBisogno===key?'':key)} style={{
                      flex:1,padding:'10px 6px',borderRadius:'12px',cursor:'pointer',
                      textAlign:'center',fontSize:f(12),fontWeight:'700',
                      border:`2px solid ${ttBisogno===key?'#7B5EA7':'#f0f1f4'}`,
                      background:ttBisogno===key?'#F5F3FF':'#feffff',
                      color:ttBisogno===key?'#7B5EA7':'#7c8088',
                      transition:'all 0.15s'
                    }}>{label}</div>
                  ))}
                </div>

                {/* Modalità — appare solo se ha selezionato bisogno */}
                {ttBisogno && (
                  <>
                    <label style={labelStyle}>🧠 Come è andato in bagno</label>
                    {[
                      {key:'adulto',icon:'👆',title:'Comando adulto',sub:"L'adulto ha deciso il momento"},
                      {key:'caa-guidata',icon:'🤝',title:'CAA guidata',sub:'Comunicazione Aumentativa guidata'},
                      {key:'caa-auto',icon:'⭐',title:'CAA autonoma',sub:'Ha comunicato da solo'},
                    ].map(opt=>(
                      <div key={opt.key} onClick={()=>setTtModalita(opt.key)} style={{
                        display:'flex',alignItems:'center',gap:'12px',
                        padding:'11px 12px',borderRadius:'12px',cursor:'pointer',
                        marginBottom:'7px',
                        border:`2px solid ${ttModalita===opt.key?'#7B5EA7':'#f0f1f4'}`,
                        background:ttModalita===opt.key?'#F5F3FF':'#feffff',
                        transition:'all 0.15s'
                      }}>
                        <div style={{width:'36px',height:'36px',borderRadius:'10px',background:ttModalita===opt.key?'#7B5EA7':'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0,transition:'background 0.15s'}}>
                          {opt.icon}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:f(13),fontWeight:'700',color:ttModalita===opt.key?'#7B5EA7':'#02153f'}}>{opt.title}</div>
                          <div style={{fontSize:f(10),color:'#7c8088'}}>{opt.sub}</div>
                        </div>
                        {ttModalita===opt.key&&<Check size={16} color="#7B5EA7"/>}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* PULSANTE SALVA */}
              <button onClick={handleSave} style={{
                width:'100%',padding:'16px',borderRadius:'50px',border:'none',
                cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',
                background:saved
                  ?'linear-gradient(135deg,#00BFA6,#2e84e9)'
                  :'linear-gradient(135deg,#7B5EA7,#2e84e9)',
                boxShadow:'0 6px 20px rgba(123,94,167,0.35)',
                display:'flex',alignItems:'center',justifyContent:'center',
                gap:'8px',transition:'all 0.3s',marginBottom:'8px'
              }}>
                {saved
                  ?<><Check size={18} color="#fff"/> Salvato!</>
                  :<><Save size={18} color="#fff"/> Salva sessione</>
                }
              </button>

              {isDemo&&(
                <div style={{textAlign:'center',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>
                  🎭 Modalità demo — dati non salvati
                </div>
              )}
            </>
          )}

          {/* ── LOG SESSIONI ── */}
          {sezione==='log' && (
  <>
    <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
      <ToiletCharts dati={log} />
    </div>

    <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
      <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
        📋 Sessioni recenti ({log.length})
      </div>
      {loading?(
        <div style={{textAlign:'center',padding:'20px',color:'#bec1cc',fontSize:f(13)}}>Caricamento...</div>
      ):log.length===0?(
        <div style={{textAlign:'center',padding:'20px',color:'#bec1cc',fontSize:f(13)}}>Nessuna sessione registrata</div>
      ):(
        log.slice(0,30).map((s,i)=>{
          const hasBagno = s.bisogno && s.bisogno!=='nessuno'
          const hasIncidente = s.incidentePippi||s.incidenteCacca
          const borderColor = hasIncidente?'#F7295A':hasBagno?'#7B5EA7':'#bec1cc'
          return (
            <div key={s.id||i} style={{padding:'11px 12px',borderRadius:'12px',marginBottom:'8px',background:'#f3f4f7',borderLeft:`3px solid ${borderColor}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {hasBagno&&(
                    <span style={{fontSize:f(12),fontWeight:'800',color:'#7B5EA7'}}>
                      {s.bisogno==='pippi'?'💧 Pipì':s.bisogno==='cacca'?'💩 Cacca':'🔄 Entrambi'}
                    </span>
                  )}
                  {hasIncidente&&(
                    <span style={{fontSize:f(11),fontWeight:'700',color:'#F7295A',background:'#FEF0F4',padding:'1px 8px',borderRadius:'20px'}}>
                      ⚠️ Incidente{s.incidentePippi&&s.incidenteCacca?' pipì+cacca':s.incidentePippi?' pipì':' cacca'}
                    </span>
                  )}
                  {!hasBagno&&!hasIncidente&&<span style={{fontSize:f(11),color:'#bec1cc'}}>Sessione vuota</span>}
                </div>
                <span style={{fontSize:f(10),color:'#bec1cc',flexShrink:0}}>{s.data} {s.ora}</span>
              </div>
              {hasBagno&&s.modalita&&(
                <div style={{fontSize:f(11),color:'#7c8088'}}>
                  {s.modalita==='adulto'?'👆 Comando adulto':s.modalita==='caa-guidata'?'🤝 CAA guidata':'⭐ CAA autonoma'}
                </div>
              )}
              {s.incidentePippi&&s.oraPippi&&<div style={{fontSize:f(10),color:'#F7295A',marginTop:'3px'}}>💧 Pipì addosso alle {s.oraPippi}</div>}
              {s.incidenteCacca&&s.oraCacca&&<div style={{fontSize:f(10),color:'#F7295A',marginTop:'2px'}}>💩 Cacca addosso alle {s.oraCacca}</div>}
            </div>
          )
        })
      )}
    </div>
  </>
)}

        </div>
      </div>
    </>
  )
}
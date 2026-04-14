import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, MessageCircle, Clock, CheckCheck, Check, AlertCircle } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, serverTimestamp, update } from 'firebase/database'

const f = (base) => `${Math.round(base * 1.15)}px`

const NAVBAR_H = 58 // altezza navbar fissa App.jsx

export default function MessaggiPage({ onBack, isDemo, nomeUtente = 'Famiglia' }) {
  const [messaggi, setMessaggi] = useState([])
  const [testo, setTesto]       = useState('')
  const [inviando, setInviando] = useState(false)
  const [errore, setErrore]     = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (isDemo) {
      setMessaggi([
        { id:'1', testo:'Buongiorno! Come sta Damiano questa settimana?',                                                                                          da:'medico',   mittente:'Dr. test', timestamp:Date.now()-86400000*2,          letto:true  },
        { id:'2', testo:'Ha avuto 2 crisi lunedì, durata circa 2 minuti ciascuna. Mercoledì invece nessun episodio.',                                              da:'famiglia', mittente:'Famiglia', timestamp:Date.now()-86400000*2+3600000,  letto:true  },
        { id:'3', testo:'Grazie per l\'aggiornamento. Continuate con la terapia attuale. Se le crisi si ripetono questa settimana, sentitemi subito.',             da:'medico',   mittente:'Dr. test', timestamp:Date.now()-86400000,            letto:true  },
        { id:'4', testo:'Perfetto, grazie dottore. Le faremo sapere.',                                                                                             da:'famiglia', mittente:'Famiglia', timestamp:Date.now()-3600000*5,           letto:true  },
        { id:'5', testo:'Ho rivisto i report delle ultime settimane. Il pattern delle crisi sembra concentrarsi al mattino. Tenete monitorato.',                   da:'medico',   mittente:'Dr. test', timestamp:Date.now()-1800000,             letto:false },
      ])
      return
    }
    const msgRef = ref(db, 'messages')
    const unsub = onValue(msgRef, snap => {
      const val = snap.val()
      if (!val) { setMessaggi([]); return }
      const lista = Object.entries(val)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a,b) => (a.timestamp||0) - (b.timestamp||0))
      setMessaggi(lista)
      // Marca come letti i messaggi del medico
      lista.filter(m => m.da === 'medico' && !m.letto).forEach(m => {
        update(ref(db, `messages/${m.id}`), { letto: true })
      })
    })
    return () => unsub()
  }, [isDemo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messaggi])

  async function invia() {
    const txt = testo.trim()
    if (!txt || inviando) return
    setInviando(true)
    setErrore('')
    try {
      if (isDemo) {
        setMessaggi(prev => [...prev, { id:Date.now().toString(), testo:txt, da:'famiglia', mittente:nomeUtente, timestamp:Date.now(), letto:false }])
        setTesto('')
        setInviando(false)
        return
      }
      await push(ref(db, 'messages'), { testo:txt, da:'famiglia', mittente:nomeUtente, timestamp:serverTimestamp(), letto:false })
      setTesto('')
    } catch(err) {
      console.error(err)
      setErrore('Errore nell\'invio. Riprova.')
    }
    setInviando(false)
  }

  function formatOra(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const oggi = new Date()
    const ieri  = new Date(oggi); ieri.setDate(ieri.getDate()-1)
    const hm = d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
    if (d.toDateString()===oggi.toDateString()) return hm
    if (d.toDateString()===ieri.toDateString()) return `Ieri ${hm}`
    return `${d.getDate()}/${d.getMonth()+1} ${hm}`
  }

  function formatGiorno(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const oggi = new Date()
    const ieri  = new Date(oggi); ieri.setDate(ieri.getDate()-1)
    if (d.toDateString()===oggi.toDateString()) return 'Oggi'
    if (d.toDateString()===ieri.toDateString()) return 'Ieri'
    return d.toLocaleDateString('it-IT',{day:'numeric',month:'long'})
  }

  const gruppi = []
  messaggi.forEach((m,i) => {
    const giorno = formatGiorno(m.timestamp)
    if (i===0 || giorno!==formatGiorno(messaggi[i-1].timestamp)) gruppi.push({tipo:'separatore',giorno})
    gruppi.push({tipo:'msg',...m})
  })

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      height:`calc(100vh - ${NAVBAR_H}px)`,  // FIX: lascia spazio alla navbar
      background:'#f3f4f7',
      fontFamily:"-apple-system,'Segoe UI',sans-serif",
      position:'relative',
    }}>

      {/* HEADER */}
      <div style={{
        background:'linear-gradient(135deg,#193f9e,#2e84e9)',
        padding:'14px 16px 14px',
        display:'flex', alignItems:'center', gap:'12px',
        flexShrink:0,
        boxShadow:'0 4px 20px rgba(25,63,158,0.25)',
      }}>
        <button type="button" onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <ArrowLeft size={18} color="#fff"/>
        </button>
        <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <MessageCircle size={20} color="#fff"/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:f(15),fontWeight:'900',color:'#fff'}}>Messaggi Medico</div>
          <div style={{fontSize:f(10),color:'rgba(255,255,255,0.7)'}}>Chat con il tuo medico</div>
        </div>
        {isDemo && (
          <span style={{background:'rgba(255,255,255,0.2)',borderRadius:'20px',padding:'3px 10px',fontSize:f(9),color:'#fff',fontWeight:'700'}}>DEMO</span>
        )}
      </div>

      {/* MESSAGGI */}
      <div style={{flex:1,overflowY:'auto',padding:'12px 12px 0',display:'flex',flexDirection:'column',gap:'4px'}}>
        {gruppi.length===0 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',textAlign:'center'}}>
            <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg,#193f9e22,#2e84e922)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
              <MessageCircle size={28} color="#2e84e9"/>
            </div>
            <div style={{fontSize:f(15),fontWeight:'800',color:'#02153f',marginBottom:'6px'}}>Nessun messaggio</div>
            <div style={{fontSize:f(12),color:'#7c8088',lineHeight:'1.6',maxWidth:'240px'}}>
              Scrivi un messaggio al tuo medico. Risponderà appena possibile.
            </div>
          </div>
        )}

        {gruppi.map((item,i) => {
          if (item.tipo==='separatore') {
            return (
              <div key={`sep-${i}`} style={{textAlign:'center',margin:'8px 0 4px'}}>
                <span style={{background:'#e8eaf0',borderRadius:'20px',padding:'3px 12px',fontSize:f(9),color:'#7c8088',fontWeight:'600'}}>{item.giorno}</span>
              </div>
            )
          }
          const isMio = item.da==='famiglia'
          return (
            <div key={item.id} style={{display:'flex',justifyContent:isMio?'flex-end':'flex-start',marginBottom:'2px'}}>
              <div style={{
                maxWidth:'78%',
                background:isMio?'linear-gradient(135deg,#193f9e,#2e84e9)':'#feffff',
                borderRadius:isMio?'18px 18px 4px 18px':'18px 18px 18px 4px',
                padding:'10px 13px',
                boxShadow:isMio?'0 4px 14px rgba(25,63,158,0.30)':'0 2px 10px rgba(2,21,63,0.08)',
              }}>
                {!isMio && (
                  <div style={{fontSize:f(9),fontWeight:'800',color:'#2e84e9',marginBottom:'3px'}}>{item.mittente||'Medico'}</div>
                )}
                <div style={{fontSize:f(13),lineHeight:'1.5',color:isMio?'#fff':'#02153f',wordBreak:'break-word'}}>{item.testo}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'4px',marginTop:'4px'}}>
                  <span style={{fontSize:f(8),color:isMio?'rgba(255,255,255,0.65)':'#bec1cc'}}>{formatOra(item.timestamp)}</span>
                  {isMio && (item.letto
                    ? <CheckCheck size={11} color="rgba(255,255,255,0.8)"/>
                    : <Check size={11} color="rgba(255,255,255,0.5)"/>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} style={{height:'8px'}}/>
      </div>

      {/* ERRORE */}
      {errore && (
        <div style={{margin:'8px 12px 0',padding:'8px 12px',borderRadius:'10px',background:'#FEF0F4',border:'1px solid #F7295A22',display:'flex',alignItems:'center',gap:'6px'}}>
          <AlertCircle size={14} color="#F7295A"/>
          <span style={{fontSize:f(11),color:'#F7295A',fontWeight:'600'}}>{errore}</span>
        </div>
      )}

      {/* INPUT — FIX: padding-bottom safe per evitare sovrapposizione navbar */}
      <div style={{
        padding:'10px 12px 16px',
        background:'#feffff',
        borderTop:'1px solid #f0f1f4',
        boxShadow:'0 -4px 16px rgba(2,21,63,0.06)',
        flexShrink:0,
      }}>
        <div style={{display:'flex',gap:'8px',alignItems:'flex-end'}}>
          <textarea
            ref={inputRef}
            value={testo}
            onChange={e=>setTesto(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();invia()} }}
            placeholder="Scrivi un messaggio…"
            rows={1}
            style={{
              flex:1, padding:'11px 14px', borderRadius:'22px',
              border:'2px solid #e8eaf0', fontSize:f(13),
              fontFamily:'inherit', resize:'none', outline:'none',
              background:'#f3f4f7', color:'#02153f',
              lineHeight:'1.4', maxHeight:'100px', overflowY:'auto',
              transition:'border-color 0.2s', boxSizing:'border-box',
            }}
            onFocus={e=>e.target.style.borderColor='#2e84e9'}
            onBlur={e=>e.target.style.borderColor='#e8eaf0'}
          />
          <button type="button"
            onClick={invia}
            disabled={!testo.trim()||inviando}
            style={{
              width:'44px', height:'44px', borderRadius:'50%', border:'none',
              background:testo.trim()&&!inviando?'linear-gradient(135deg,#193f9e,#2e84e9)':'#e8eaf0',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:testo.trim()&&!inviando?'pointer':'default',
              flexShrink:0, transition:'all 0.2s',
              boxShadow:testo.trim()&&!inviando?'0 4px 14px rgba(25,63,158,0.35)':'none',
            }}
          >
            {inviando
              ? <Clock size={18} color="#bec1cc"/>
              : <Send size={18} color={testo.trim()?'#fff':'#bec1cc'}/>
            }
          </button>
        </div>
      </div>

    </div>
  )
}

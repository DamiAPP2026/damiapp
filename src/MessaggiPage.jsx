import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, MessageCircle, Clock, CheckCheck, Check, AlertCircle } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, serverTimestamp, update } from 'firebase/database'

const f = (base) => `${Math.round(base * 1.15)}px`
const NAVBAR_H = 58

export default function MessaggiPage({ onBack, isDemo, nomeUtente = 'Famiglia' }) {
  const [messaggi, setMessaggi] = useState([])
  const [testo,    setTesto]    = useState('')
  const [inviando, setInviando] = useState(false)
  const [errore,   setErrore]   = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (isDemo) {
      setMessaggi([
        { id:'1', testo:'Buongiorno! Come sta Damiano questa settimana?',                                                             da:'medico',   mittente:'Dr. Bianchi', timestamp:Date.now()-86400000*2,         letto:true  },
        { id:'2', testo:'Ha avuto 2 crisi lunedì, durata circa 2 minuti ciascuna. Mercoledì invece nessun episodio.',                da:'famiglia', mittente:'Famiglia',    timestamp:Date.now()-86400000*2+3600000, letto:true  },
        { id:'3', testo:'Grazie per l\'aggiornamento. Continuate con la terapia attuale. Se le crisi si ripetono sentitemi subito.', da:'medico',   mittente:'Dr. Bianchi', timestamp:Date.now()-86400000,           letto:true  },
        { id:'4', testo:'Perfetto, grazie dottore. Le faremo sapere.',                                                               da:'famiglia', mittente:'Famiglia',    timestamp:Date.now()-3600000*5,          letto:true  },
        { id:'5', testo:'Ho rivisto i report delle ultime settimane. Il pattern delle crisi sembra concentrarsi al mattino.',        da:'medico',   mittente:'Dr. Bianchi', timestamp:Date.now()-1800000,            letto:false },
      ])
      return
    }
    const unsub = onValue(ref(db,'messages'), snap => {
      const val = snap.val()
      if (!val) { setMessaggi([]); return }
      const lista = Object.entries(val)
        .map(([id,m]) => ({id,...m}))
        .sort((a,b) => (a.timestamp||0)-(b.timestamp||0))
      setMessaggi(lista)
      lista.filter(m=>m.da==='medico'&&!m.letto)
           .forEach(m=>update(ref(db,`messages/${m.id}`),{letto:true}))
    })
    return () => unsub()
  }, [isDemo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior:'smooth'})
  }, [messaggi])

  async function invia() {
    const txt = testo.trim()
    if (!txt||inviando) return
    setInviando(true); setErrore('')
    try {
      if (isDemo) {
        setMessaggi(prev=>[...prev,{id:Date.now().toString(),testo:txt,da:'famiglia',mittente:nomeUtente,timestamp:Date.now(),letto:false}])
        setTesto(''); setInviando(false); return
      }
      await push(ref(db,'messages'),{testo:txt,da:'famiglia',mittente:nomeUtente,timestamp:serverTimestamp(),letto:false})
      setTesto('')
    } catch(err) {
      console.error(err); setErrore('Errore nell\'invio. Riprova.')
    }
    setInviando(false)
  }

  // ── Formattatori data/ora ──────────────────────────────────
  function formatOra(ts) {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
  }

  function formatDataCompleta(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const oggi = new Date()
    const ieri  = new Date(); ieri.setDate(ieri.getDate()-1)
    const hm = d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
    const dataStr = d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})
    if (d.toDateString()===oggi.toDateString()) return `Oggi · ${hm}`
    if (d.toDateString()===ieri.toDateString()) return `Ieri · ${hm}`
    return `${dataStr} · ${hm}`
  }

  function formatGiornoSep(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const oggi = new Date()
    const ieri  = new Date(); ieri.setDate(ieri.getDate()-1)
    if (d.toDateString()===oggi.toDateString())
      return `Oggi · ${d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}`
    if (d.toDateString()===ieri.toDateString())
      return `Ieri · ${d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}`
    return d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
  }

  // Raggruppa per giorno
  const gruppi = []
  messaggi.forEach((m,i) => {
    const giorno = new Date(m.timestamp||0).toDateString()
    if (i===0||giorno!==new Date(messaggi[i-1].timestamp||0).toDateString())
      gruppi.push({tipo:'separatore',giorno:formatGiornoSep(m.timestamp)})
    gruppi.push({tipo:'msg',...m})
  })

  const nonLetti = messaggi.filter(m=>m.da==='medico'&&!m.letto).length

  return (
    <div style={{display:'flex',flexDirection:'column',height:`calc(100vh - ${NAVBAR_H}px)`,background:'#f3f4f7',fontFamily:"-apple-system,'Segoe UI',sans-serif",position:'relative'}}>

      {/* HEADER */}
      <div style={{background:'linear-gradient(135deg,#193f9e,#2e84e9)',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px',flexShrink:0,boxShadow:'0 4px 20px rgba(25,63,158,0.25)'}}>
        <button type="button" onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <ArrowLeft size={18} color="#fff"/>
        </button>
        <div style={{position:'relative',flexShrink:0}}>
          <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <MessageCircle size={20} color="#fff"/>
          </div>
          {nonLetti>0 && (
            <div style={{position:'absolute',top:'-3px',right:'-3px',width:'16px',height:'16px',borderRadius:'50%',background:'#F7295A',border:'2px solid #193f9e',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:'8px',fontWeight:'900',color:'#fff',lineHeight:1}}>{nonLetti>9?'9+':nonLetti}</span>
            </div>
          )}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:f(15),fontWeight:'900',color:'#fff'}}>Messaggi Medico</div>
          <div style={{fontSize:f(10),color:'rgba(255,255,255,0.7)'}}>
            {nonLetti>0 ? `${nonLetti} non letti` : 'Chat con il tuo medico'}
          </div>
        </div>
        {isDemo&&<span style={{background:'rgba(255,255,255,0.2)',borderRadius:'20px',padding:'3px 10px',fontSize:f(9),color:'#fff',fontWeight:'700'}}>DEMO</span>}
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
          if (item.tipo==='separatore') return (
            <div key={`sep-${i}`} style={{textAlign:'center',margin:'10px 0 5px'}}>
              <span style={{background:'#e8eaf0',borderRadius:'20px',padding:'3px 12px',fontSize:f(9),color:'#7c8088',fontWeight:'600',textTransform:'capitalize'}}>{item.giorno}</span>
            </div>
          )
          const isMio = item.da==='famiglia'
          const nonLetto = !isMio && !item.letto
          return (
            <div key={item.id} style={{display:'flex',justifyContent:isMio?'flex-end':'flex-start',marginBottom:'2px'}}>
              <div style={{
                maxWidth:'78%',
                background:isMio?'linear-gradient(135deg,#193f9e,#2e84e9)':'#feffff',
                borderRadius:isMio?'18px 18px 4px 18px':'18px 18px 18px 4px',
                padding:'10px 13px',
                boxShadow:isMio?'0 4px 14px rgba(25,63,158,0.30)':'0 2px 10px rgba(2,21,63,0.08)',
                border:nonLetto?'2px solid #2e84e933':'none',
              }}>
                {!isMio && (
                  <div style={{fontSize:f(9),fontWeight:'800',color:'#2e84e9',marginBottom:'3px'}}>
                    {item.mittente||'Medico'}
                    {nonLetto&&<span style={{marginLeft:'5px',background:'#2e84e9',color:'#fff',borderRadius:'10px',padding:'1px 5px',fontSize:'8px',fontWeight:'800'}}>nuovo</span>}
                  </div>
                )}
                <div style={{fontSize:f(13),lineHeight:'1.5',color:isMio?'#fff':'#02153f',wordBreak:'break-word'}}>{item.testo}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'4px',marginTop:'5px'}}>
                  <span style={{fontSize:f(8),color:isMio?'rgba(255,255,255,0.65)':'#bec1cc'}}>{formatDataCompleta(item.timestamp)}</span>
                  {isMio&&(item.letto
                    ?<CheckCheck size={11} color="rgba(255,255,255,0.8)"/>
                    :<Check size={11} color="rgba(255,255,255,0.5)"/>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} style={{height:'8px'}}/>
      </div>

      {/* ERRORE */}
      {errore&&(
        <div style={{margin:'8px 12px 0',padding:'8px 12px',borderRadius:'10px',background:'#FEF0F4',border:'1px solid #F7295A22',display:'flex',alignItems:'center',gap:'6px'}}>
          <AlertCircle size={14} color="#F7295A"/>
          <span style={{fontSize:f(11),color:'#F7295A',fontWeight:'600'}}>{errore}</span>
        </div>
      )}

      {/* DISCLAIMER permanente */}
      <div style={{
        background:'#FFF5EE',
        borderTop:'1px solid #FF8C4222',
        padding:'7px 14px',
        display:'flex',alignItems:'flex-start',gap:'7px',
        flexShrink:0,
      }}>
        <AlertCircle size={13} color="#FF8C42" style={{flexShrink:0,marginTop:'1px'}}/>
        <div style={{fontSize:f(9),color:'#8B6914',lineHeight:'1.6'}}>
          I messaggi sono <strong>permanenti, non eliminabili e non recuperabili</strong> se persi. DamiAPP non è responsabile del contenuto. La chat non sostituisce una visita medica.
        </div>
      </div>

      {/* INPUT */}
      <div style={{padding:'10px 12px 14px',background:'#feffff',borderTop:'1px solid #f0f1f4',boxShadow:'0 -4px 16px rgba(2,21,63,0.06)',flexShrink:0}}>
        <div style={{display:'flex',gap:'8px',alignItems:'flex-end'}}>
          <textarea
            ref={inputRef}
            value={testo}
            onChange={e=>setTesto(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();invia()}}}
            placeholder="Scrivi un messaggio…"
            rows={1}
            style={{flex:1,padding:'11px 14px',borderRadius:'22px',border:'2px solid #e8eaf0',fontSize:f(13),fontFamily:'inherit',resize:'none',outline:'none',background:'#f3f4f7',color:'#02153f',lineHeight:'1.4',maxHeight:'100px',overflowY:'auto',transition:'border-color 0.2s',boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#2e84e9'}
            onBlur={e=>e.target.style.borderColor='#e8eaf0'}
          />
          <button type="button" onClick={invia} disabled={!testo.trim()||inviando} style={{
            width:'44px',height:'44px',borderRadius:'50%',border:'none',
            background:testo.trim()&&!inviando?'linear-gradient(135deg,#193f9e,#2e84e9)':'#e8eaf0',
            display:'flex',alignItems:'center',justifyContent:'center',
            cursor:testo.trim()&&!inviando?'pointer':'default',
            flexShrink:0,transition:'all 0.2s',
            boxShadow:testo.trim()&&!inviando?'0 4px 14px rgba(25,63,158,0.35)':'none',
          }}>
            {inviando?<Clock size={18} color="#bec1cc"/>:<Send size={18} color={testo.trim()?'#fff':'#bec1cc'}/>}
          </button>
        </div>
      </div>
    </div>
  )
}

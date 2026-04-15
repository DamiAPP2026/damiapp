import { useState, useEffect, useRef } from 'react'
import {
  LogOut, AlertTriangle, Pill, Phone, FileText,
  MessageCircle, Send, CheckCheck, Check, Clock,
  Save, ChevronLeft, Eye, Droplets, BarChart2,
  Activity, Package, BookOpen, Shield
} from 'lucide-react'
import { db } from './firebase'
import { ref, get, push, onValue, serverTimestamp, update, set } from 'firebase/database'
import { decrypt, encrypt, processFirebaseSnap } from './crypto'
import ToiletCharts from './ToiletCharts'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const TIPO_COLORI = {
  'Crisi tonico-cloniche':'#F7295A','Crisi di assenza':'#7B5EA7',
  'Crisi miocloniche':'#FF8C42','Crisi toniche':'#2e84e9',
  'Crisi cloniche':'#00BFA6','Crisi atoniche':'#FFD93D',
}
const PERIODI = [
  {key:'all',label:'Tutto'},{key:'week',label:'7g'},{key:'month',label:'30g'},
  {key:'3months',label:'3M'},{key:'6months',label:'6M'},{key:'year',label:'1A'},
]

const MODALITA_TT = [
  {key:'adulto',      label:'👆 Comando adulto', sub:"L'adulto ha deciso"},
  {key:'caa-guidata', label:'🤝 CAA guidata',    sub:'Comunicazione guidata'},
  {key:'caa-auto',    label:'⭐ CAA autonoma',   sub:'Ha comunicato da solo'},
]
const BISOGNI_TT = [
  {key:'pippi',    label:'💧 Pipì'},
  {key:'cacca',    label:'💩 Cacca'},
  {key:'entrambi', label:'🔄 Entrambi'},
]

function nowDate() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function emptyForm() {
  return { data:nowDate(), ora:nowTime(), bisogno:'', modalita:'', incidentePippi:false, oraPippi:'', incidenteCacca:false, oraCacca:'', note:'' }
}

function formatDataCompleta(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const oggi = new Date(); const ieri = new Date(); ieri.setDate(ieri.getDate()-1)
  const hm = d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
  const dataStr = d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})
  if (d.toDateString()===oggi.toDateString()) return `Oggi · ${hm}`
  if (d.toDateString()===ieri.toDateString()) return `Ieri · ${hm}`
  return `${dataStr} · ${hm}`
}
function formatGiornoSep(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const oggi = new Date(); const ieri = new Date(); ieri.setDate(ieri.getDate()-1)
  if (d.toDateString()===oggi.toDateString()) return `Oggi · ${d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}`
  if (d.toDateString()===ieri.toDateString()) return `Ieri · ${d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}`
  return d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
}

// ─── CHAT MEDICO ──────────────────────────────────────────────
function ChatMedico({ tokenData }) {
  const [messaggi, setMessaggi] = useState([])
  const [testo,    setTesto]    = useState('')
  const [inviando, setInviando] = useState(false)
  const bottomRef = useRef(null)
  const nomeMedico = `Dr. ${tokenData.medicoName||'Medico'}`

  useEffect(() => {
    const unsub = onValue(ref(db,'messages'), snap => {
      const val = snap.val()
      if (!val) { setMessaggi([]); return }
      const lista = Object.entries(val).map(([id,m])=>({id,...m})).sort((a,b)=>(a.timestamp||0)-(b.timestamp||0))
      setMessaggi(lista)
      lista.filter(m=>m.da==='famiglia'&&!m.letto).forEach(m=>update(ref(db,`messages/${m.id}`),{letto:true}))
    })
    return () => unsub()
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messaggi])

  async function invia() {
    const txt = testo.trim()
    if (!txt||inviando) return
    setInviando(true)
    try {
      await push(ref(db,'messages'),{testo:txt,da:'medico',mittente:nomeMedico,timestamp:serverTimestamp(),letto:false})
      setTesto('')
    } catch(err) { console.error(err) }
    setInviando(false)
  }

  const gruppi = []
  messaggi.forEach((m,i) => {
    const g = new Date(m.timestamp||0).toDateString()
    if (i===0||g!==new Date(messaggi[i-1].timestamp||0).toDateString())
      gruppi.push({tipo:'separatore',giorno:formatGiornoSep(m.timestamp)})
    gruppi.push({tipo:'msg',...m})
  })

  const nonLettiF = messaggi.filter(m=>m.da==='famiglia'&&!m.letto).length

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 130px)'}}>
      <div style={{margin:'12px 12px 0',padding:'8px 14px',background:'linear-gradient(135deg,#EEF3FD,#E8FBF8)',borderRadius:'12px',display:'flex',alignItems:'center',gap:'8px',border:'1px solid #d8e8f8',flexShrink:0}}>
        <MessageCircle size={14} color="#193f9e"/>
        <span style={{fontSize:f(11),color:'#193f9e',fontWeight:'700'}}>
          Chat — stai scrivendo come <strong>{nomeMedico}</strong>
        </span>
        {nonLettiF>0&&<span style={{marginLeft:'auto',background:'#F7295A',color:'#fff',borderRadius:'20px',padding:'2px 8px',fontSize:f(9),fontWeight:'800'}}>{nonLettiF} nuovi</span>}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'10px 12px 0',display:'flex',flexDirection:'column',gap:'4px'}}>
        {gruppi.length===0&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',textAlign:'center'}}>
            <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'#EEF3FD',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
              <MessageCircle size={24} color="#2e84e9"/>
            </div>
            <div style={{fontSize:f(14),fontWeight:'800',color:'#02153f',marginBottom:'6px'}}>Nessun messaggio</div>
            <div style={{fontSize:f(11),color:'#7c8088',lineHeight:'1.6',maxWidth:'230px'}}>Scrivi il primo messaggio alla famiglia.</div>
          </div>
        )}
        {gruppi.map((item,i) => {
          if (item.tipo==='separatore') return (
            <div key={`sep-${i}`} style={{textAlign:'center',margin:'10px 0 5px'}}>
              <span style={{background:'#e8eaf0',borderRadius:'20px',padding:'3px 12px',fontSize:f(9),color:'#7c8088',fontWeight:'600',textTransform:'capitalize'}}>{item.giorno}</span>
            </div>
          )
          const isMio = item.da==='medico'
          return (
            <div key={item.id} style={{display:'flex',justifyContent:isMio?'flex-end':'flex-start',marginBottom:'2px'}}>
              <div style={{maxWidth:'78%',background:isMio?'linear-gradient(135deg,#08184c,#193f9e)':'#feffff',borderRadius:isMio?'18px 18px 4px 18px':'18px 18px 18px 4px',padding:'10px 13px',boxShadow:isMio?'0 4px 14px rgba(8,24,76,0.30)':'0 2px 10px rgba(2,21,63,0.08)'}}>
                {!isMio&&<div style={{fontSize:f(9),fontWeight:'800',color:'#F7295A',marginBottom:'3px'}}>{item.mittente||'Famiglia'}</div>}
                <div style={{fontSize:f(13),lineHeight:'1.5',color:isMio?'#fff':'#02153f',wordBreak:'break-word'}}>{item.testo}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'4px',marginTop:'5px'}}>
                  <span style={{fontSize:f(8),color:isMio?'rgba(255,255,255,0.6)':'#bec1cc'}}>{formatDataCompleta(item.timestamp)}</span>
                  {isMio&&(item.letto?<CheckCheck size={11} color="rgba(255,255,255,0.8)"/>:<Check size={11} color="rgba(255,255,255,0.5)"/>)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} style={{height:'8px'}}/>
      </div>

      {/* Disclaimer chat */}
      <div style={{background:'#FFF5EE',borderTop:'1px solid #FF8C4222',padding:'6px 14px',fontSize:f(9),color:'#8B6914',lineHeight:'1.5',flexShrink:0}}>
        ⚠️ Messaggi <strong>permanenti e non eliminabili</strong>. DamiAPP non è responsabile del contenuto. Non sostituisce una visita medica.
      </div>

      <div style={{padding:'10px 12px 16px',background:'#feffff',borderTop:'1px solid #f0f1f4',boxShadow:'0 -4px 16px rgba(2,21,63,0.06)',flexShrink:0}}>
        <div style={{display:'flex',gap:'8px',alignItems:'flex-end'}}>
          <textarea value={testo} onChange={e=>setTesto(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();invia()}}}
            placeholder="Scrivi un messaggio alla famiglia…" rows={1}
            style={{flex:1,padding:'11px 14px',borderRadius:'22px',border:'2px solid #e8eaf0',fontSize:f(13),fontFamily:'inherit',resize:'none',outline:'none',background:'#f3f4f7',color:'#02153f',lineHeight:'1.4',maxHeight:'100px',overflowY:'auto',transition:'border-color 0.2s',boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#193f9e'} onBlur={e=>e.target.style.borderColor='#e8eaf0'}/>
          <button type="button" onClick={invia} disabled={!testo.trim()||inviando} style={{width:'44px',height:'44px',borderRadius:'50%',border:'none',background:testo.trim()&&!inviando?'linear-gradient(135deg,#08184c,#193f9e)':'#e8eaf0',display:'flex',alignItems:'center',justifyContent:'center',cursor:testo.trim()&&!inviando?'pointer':'default',flexShrink:0,transition:'all 0.2s',boxShadow:testo.trim()&&!inviando?'0 4px 14px rgba(8,24,76,0.35)':'none'}}>
            {inviando?<Clock size={18} color="#bec1cc"/>:<Send size={18} color={testo.trim()?'#fff':'#bec1cc'}/>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VIEW TOILET WRITER ───────────────────────────────────────
function ToiletWriterView({ tokenData, onLogout }) {
  const [form,    setForm]    = useState(emptyForm())
  const [saved,   setSaved]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const intestatario = tokenData.intestatario || 'Paziente'
  const inSt = { width:'100%',padding:'11px 12px',borderRadius:'12px',border:'1.5px solid #f0f1f4',fontSize:'15px',color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',boxSizing:'border-box' }
  const lbSt = { fontSize:'13px',fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'6px',display:'block' }

  async function handleSave() {
    const hasBagno = !!form.bisogno
    const hasInc   = form.incidentePippi || form.incidenteCacca
    if (!hasBagno && !hasInc) { alert('Seleziona cosa ha fatto in bagno o se c\'è stato un incidente'); return }
    if (hasBagno && !form.modalita) { alert('Seleziona la modalità'); return }
    setSaving(true)
    const sessione = {
      id:Date.now(), timestamp:Date.now(),
      data:form.data, ora:form.ora,
      bisogno:form.bisogno||'nessuno', modalita:form.modalita,
      incidentePippi:form.incidentePippi, oraPippi:form.incidentePippi?form.oraPippi:'',
      incidenteCacca:form.incidenteCacca, oraCacca:form.incidenteCacca?form.oraCacca:'',
      note:form.note, registratoDa:`Educatore (token ${tokenData.token?.slice(0,6)||'—'})`,
    }
    try {
      await push(ref(db,'toilet_training'), encrypt(sessione))
      setSaved(true)
      setTimeout(()=>{ setSaved(false); setForm(emptyForm()) }, 1800)
    } catch(err) { console.error(err); alert('Errore nel salvataggio') }
    setSaving(false)
  }

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.tw-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:80px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="tw-wrap">
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#7B5EA7,#2e84e9)',padding:'14px 16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>🚽 Toilet Training</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>Paziente: <strong style={{color:'#fff'}}>{intestatario}</strong></div>
            </div>
            <button type="button" onClick={onLogout} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',borderRadius:'20px',border:'none',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:f(12),fontWeight:'700',cursor:'pointer'}}>
              <LogOut size={14} color="#fff"/> Esci
            </button>
          </div>
          <div style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px 12px',display:'flex',alignItems:'center',gap:'8px'}}>
            <Shield size={14} color="rgba(255,255,255,0.8)"/>
            <span style={{fontSize:f(11),color:'rgba(255,255,255,0.85)',fontWeight:'600'}}>
              Accesso educatore — solo registrazione sessioni · Scade: {tokenData.expiresAt?new Date(tokenData.expiresAt).toLocaleDateString('it-IT'):'N/D'}
            </span>
          </div>
        </div>

        <div style={{padding:'12px'}}>
          {/* Data/Ora */}
          <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
            <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>📅 Data e ora</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div>
                <label style={lbSt}>Data</label>
                <input type="text" value={form.data} onChange={e=>setForm({...form,data:e.target.value})} placeholder="gg/mm/aaaa" style={inSt}/>
              </div>
              <div>
                <label style={lbSt}>Ora</label>
                <input type="time" value={form.ora} onChange={e=>setForm({...form,ora:e.target.value})} style={inSt}/>
              </div>
            </div>
          </div>

          {/* Incidenti */}
          <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
            <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>⚠️ Incidente addosso</div>
            <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>Indipendente dal bagno</div>
            {[
              {val:form.incidentePippi,key:'incidentePippi',icon:'💧',title:'Pipì addosso',oraKey:'oraPippi',oraVal:form.oraPippi,labelOra:'Ora incidente pipì'},
              {val:form.incidenteCacca,key:'incidenteCacca',icon:'💩',title:'Cacca addosso',oraKey:'oraCacca',oraVal:form.oraCacca,labelOra:'Ora incidente cacca'},
            ].map(({val,key,icon,title,oraKey,oraVal,labelOra},i)=>(
              <div key={i}>
                <div onClick={()=>setForm({...form,[key]:!val})} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px',borderRadius:'14px',cursor:'pointer',background:val?'#FEF0F4':'#f3f4f7',border:`2px solid ${val?'#F7295A33':'transparent'}`,marginBottom:'8px',transition:'all 0.15s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'22px'}}>{icon}</span>
                    <div style={{fontSize:f(13),fontWeight:'700',color:val?'#F7295A':'#394058'}}>{title}</div>
                  </div>
                  <div style={{width:'48px',height:'26px',borderRadius:'13px',background:val?'#F7295A':'#dde0ed',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                    <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'3px',left:val?'25px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                  </div>
                </div>
                {val&&(
                  <div style={{padding:'0 4px 10px'}}>
                    <label style={lbSt}>{labelOra}</label>
                    <input type="time" value={oraVal} onChange={e=>setForm({...form,[oraKey]:e.target.value})} style={inSt}/>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bagno */}
          <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
            <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>🚽 Ha usato il bagno?</div>
            <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>Opzionale</div>
            <label style={lbSt}>Cosa ha fatto</label>
            <div style={{display:'flex',gap:'7px',marginBottom:'14px'}}>
              {BISOGNI_TT.map(({key,label})=>(
                <div key={key} onClick={()=>setForm({...form,bisogno:form.bisogno===key?'':key,modalita:form.bisogno===key?'':form.modalita})}
                  style={{flex:1,padding:'10px 6px',borderRadius:'12px',cursor:'pointer',textAlign:'center',fontSize:f(12),fontWeight:'700',border:`2px solid ${form.bisogno===key?'#7B5EA7':'#f0f1f4'}`,background:form.bisogno===key?'#F5F3FF':'#feffff',color:form.bisogno===key?'#7B5EA7':'#7c8088',transition:'all 0.15s'}}>
                  {label}
                </div>
              ))}
            </div>
            {form.bisogno&&(<>
              <label style={lbSt}>Come è andato</label>
              {MODALITA_TT.map(opt=>(
                <div key={opt.key} onClick={()=>setForm({...form,modalita:opt.key})}
                  style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 12px',borderRadius:'12px',cursor:'pointer',marginBottom:'7px',border:`2px solid ${form.modalita===opt.key?'#7B5EA7':'#f0f1f4'}`,background:form.modalita===opt.key?'#F5F3FF':'#feffff',transition:'all 0.15s'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:f(13),fontWeight:'700',color:form.modalita===opt.key?'#7B5EA7':'#02153f'}}>{opt.label}</div>
                    <div style={{fontSize:f(10),color:'#7c8088'}}>{opt.sub}</div>
                  </div>
                  {form.modalita===opt.key&&<Check size={16} color="#7B5EA7"/>}
                </div>
              ))}
            </>)}
            <label style={{...lbSt,marginTop:'10px'}}>📝 Note</label>
            <textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} rows={2} placeholder="Annotazioni opzionali…" style={{...inSt,resize:'vertical'}}/>
          </div>

          <button type="button" onClick={handleSave} disabled={saving} style={{
            width:'100%',padding:'16px',borderRadius:'50px',border:'none',
            cursor:saving?'wait':'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',
            background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#7B5EA7,#2e84e9)',
            boxShadow:'0 6px 20px rgba(123,94,167,0.35)',
            display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.3s'
          }}>
            {saved?<><Check size={18}/> Sessione salvata!</>:saving?<><Clock size={18}/> Salvataggio…</>:<><Save size={18}/> Salva sessione</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── VIEW VIEWER (sola lettura leggera) ───────────────────────
function ViewerView({ tokenData, onLogout }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const nomeViewer = tokenData.medicoName || 'Visualizzatore'

  useEffect(() => {
    async function load() {
      try {
        const [crisiSnap,terapieSnap,toiletSnap] = await Promise.all([
          get(ref(db,'crises')),
          get(ref(db,'terapies')),
          get(ref(db,'toilet_training')),
        ])
        function parse(snap) {
          if (!snap?.val()) return []
          return Object.entries(snap.val()).map(([k,enc])=>{
            const d = typeof enc==='object'?enc:decrypt(enc)
            return d?{...d,_key:k}:null
          }).filter(Boolean)
        }
        const crisi   = parse(crisiSnap).sort((a,b)=>b.timestamp-a.timestamp)
        const terapie = parse(terapieSnap).sort((a,b)=>(a.orario||'').localeCompare(b.orario||''))
        const toilet  = parse(toiletSnap).sort((a,b)=>b.timestamp-a.timestamp)
        setData({crisi,terapie,toilet})
      } catch(err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [])

  const oraMin = new Date().getHours()*60+new Date().getMinutes()
  const crisi7gg = data?.crisi?.filter(c=>Date.now()-c.timestamp<7*86400000)||[]
  const terapieOggi = data?.terapie||[]

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'12px'}}>👁️</div>
        <div style={{fontSize:f(14),color:'#7c8088'}}>Caricamento...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.vw-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:60px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="vw-wrap">
        <div style={{background:'linear-gradient(135deg,#00BFA6,#2e84e9)',padding:'16px 16px 22px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>👁️ Vista Rapida</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>Benvenuto, {nomeViewer}</div>
            </div>
            <button type="button" onClick={onLogout} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',borderRadius:'20px',border:'none',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:f(12),fontWeight:'700',cursor:'pointer'}}>
              <LogOut size={14} color="#fff"/> Esci
            </button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
            {[
              {label:'Crisi 7 giorni', val:crisi7gg.length,          color:crisi7gg.length>0?'#FFD93D':'#fff'},
              {label:'Terapie oggi',   val:terapieOggi.length,        color:'#fff'},
              {label:'Bagno oggi',     val:(data?.toilet||[]).filter(s=>{const d=new Date(s.timestamp||0);const oggi=new Date();return d.toDateString()===oggi.toDateString()&&s.bisogno&&s.bisogno!=='nessuno'}).length, color:'#fff'},
            ].map(({label,val,color},i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:f(20),fontWeight:'900',color}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:'12px'}}>
          {/* Terapie */}
          {terapieOggi.length>0&&(
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>💊 Terapie di oggi</div>
              {terapieOggi.map((t,i)=>{
                const [h,m]=(t.orario||'00:00').split(':').map(Number)
                const passata=h*60+m<oraMin
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 0',borderBottom:i<terapieOggi.length-1?'1px solid #f0f1f4':'none'}}>
                    <div style={{width:'8px',height:'8px',borderRadius:'50%',background:passata?'#bec1cc':'#00BFA6',flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:f(13),fontWeight:'700',color:passata?'#bec1cc':'#02153f',textDecoration:passata?'line-through':'none'}}>{t.nome}</div>
                      <div style={{fontSize:f(11),color:'#7c8088'}}>{t.quantita}</div>
                    </div>
                    <span style={{fontSize:f(12),fontWeight:'700',color:passata?'#bec1cc':'#193f9e'}}>{t.orario}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Crisi ultima settimana */}
          <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f'}}>⚡ Crisi ultima settimana</div>
              <span style={{fontSize:f(16),fontWeight:'900',color:'#F7295A'}}>{crisi7gg.length}</span>
            </div>
            {crisi7gg.length===0?(
              <div style={{textAlign:'center',padding:'16px',color:'#00BFA6',fontSize:f(13),fontWeight:'700'}}>✓ Nessuna crisi negli ultimi 7 giorni</div>
            ):crisi7gg.slice(0,5).map((c,i)=>{
              const color=TIPO_COLORI[c.type]||'#7c8088'
              return (
                <div key={i} style={{padding:'9px',borderRadius:'12px',marginBottom:'7px',background:'#f3f4f7',borderLeft:`3px solid ${color}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:f(12),fontWeight:'800',color}}>{c.type}</span>
                    <span style={{fontSize:f(10),color:'#bec1cc'}}>{c.date}</span>
                  </div>
                  {c.duration&&<div style={{fontSize:f(10),color:'#7c8088',marginTop:'2px'}}>Durata: {c.duration}</div>}
                </div>
              )
            })}
          </div>

          {/* Toilet grafici */}
          {(data?.toilet?.length||0)>0&&(
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>🚽 Toilet Training</div>
              <ToiletCharts dati={data.toilet} titolo={false}/>
            </div>
          )}

          <div style={{background:'#EEF3FD',borderRadius:'14px',padding:'10px 14px',border:'1.5px solid #193f9e22',display:'flex',gap:'8px',alignItems:'flex-start'}}>
            <Shield size={14} color="#193f9e" style={{flexShrink:0,marginTop:'1px'}}/>
            <div style={{fontSize:f(11),color:'#193f9e',lineHeight:'1.6'}}>
              Accesso in <strong>sola lettura</strong>. Scade il {tokenData.expiresAt?new Date(tokenData.expiresAt).toLocaleDateString('it-IT'):'N/D'}.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── DOCTOR VIEW PRINCIPALE ───────────────────────────────────
const TABS_MEDICO = [
  {key:'dati',     label:'Dati Paziente', Icon:FileText},
  {key:'messaggi', label:'Messaggi',      Icon:MessageCircle},
]

export default function DoctorView({ tokenData, onLogout }) {
  const role = tokenData.role || 'medico'

  // Smistamento per ruolo
  if (role==='toilet_writer') return <ToiletWriterView tokenData={tokenData} onLogout={onLogout}/>
  if (role==='viewer')        return <ViewerView        tokenData={tokenData} onLogout={onLogout}/>

  // ── VISTA MEDICO ─────────────────────────────────────────────
  const [data,        setData]    = useState(null)
  const [loading,     setLoading] = useState(true)
  const [periodo,     setPeriodo] = useState('month')
  const [tab,         setTab]     = useState('dati')
  const [msgNonLetti, setMsg]     = useState(0)
  const canvasRef = useRef(null)
  const perms = tokenData.permissions || {}

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const unsub = onValue(ref(db,'messages'), snap => {
      const val = snap.val()
      if (!val) { setMsg(0); return }
      setMsg(Object.values(val).filter(m=>m.da==='famiglia'&&!m.letto).length)
    })
    return () => unsub()
  }, [])

  async function loadData() {
    try {
      const selectedDocIds = perms.selectedDocIds || []
      const [crisiSnap,terapieSnap,docsSnap,toiletSnap,diarioSnap,magazzinoSnap,disturbiSnap,reportSnap] = await Promise.all([
        get(ref(db,'crises')),
        perms.shareTerapie   ? get(ref(db,'terapies'))        : Promise.resolve(null),
        perms.shareDocuments ? get(ref(db,'documents'))       : Promise.resolve(null),
        perms.shareToilet    ? get(ref(db,'toilet_training')) : Promise.resolve(null),
        perms.shareDiario    ? get(ref(db,'crises'))          : Promise.resolve(null),
        perms.shareMagazzino ? get(ref(db,'magazzino'))       : Promise.resolve(null),
        perms.shareDisturbi  ? get(ref(db,'disturbi'))        : Promise.resolve(null),
        Promise.resolve(null),
      ])
      function parse(snap) {
        if (!snap?.val()) return []
        return Object.entries(snap.val()).map(([k,enc])=>{
          const d=typeof enc==='object'?enc:decrypt(enc)
          return d?{...d,_key:k}:null
        }).filter(Boolean)
      }
      // Filtra documenti selezionati
      let documenti = parse(docsSnap)
      if (selectedDocIds.length>0) documenti = documenti.filter(d=>selectedDocIds.includes(d._key||d.id?.toString()))
      setData({
        crisi:     parse(crisiSnap).sort((a,b)=>b.timestamp-a.timestamp),
        terapie:   parse(terapieSnap).sort((a,b)=>(a.orario||'').localeCompare(b.orario||'')),
        documenti,
        toilet:    parse(toiletSnap).sort((a,b)=>b.timestamp-a.timestamp),
        magazzino: parse(magazzinoSnap),
        disturbi:  parse(disturbiSnap),
      })
    } catch(err) { console.error(err) }
    setLoading(false)
  }

  function getCrisiPeriodo() {
    if (!data?.crisi) return []
    if (periodo==='all') return data.crisi
    const days = {week:7,month:30,'3months':90,'6months':180,year:365}[periodo]
    return data.crisi.filter(c=>c.timestamp>=Date.now()-days*86400000)
  }
  const crisiPeriodo = getCrisiPeriodo()
  const tipiCount = {}
  crisiPeriodo.forEach(c=>{ tipiCount[c.type]=(tipiCount[c.type]||0)+1 })
  const mediaInt = crisiPeriodo.length>0 ? (crisiPeriodo.reduce((s,c)=>s+(c.intensita||0),0)/crisiPeriodo.length).toFixed(1) : '—'

  useEffect(() => {
    if (!canvasRef.current||!data||tab!=='dati') return
    const ctx=canvasRef.current.getContext('2d')
    const W=canvasRef.current.width, H=canvasRef.current.height
    ctx.clearRect(0,0,W,H)
    const weeks=[]
    for(let i=7;i>=0;i--){
      const start=new Date();start.setDate(start.getDate()-i*7-6);start.setHours(0,0,0,0)
      const end=new Date();end.setDate(end.getDate()-i*7);end.setHours(23,59,59,999)
      const count=(data.crisi||[]).filter(c=>c.timestamp>=start.getTime()&&c.timestamp<=end.getTime()).length
      weeks.push({label:`S${8-i}`,count})
    }
    const max=Math.max(...weeks.map(w=>w.count),1)
    const barW=(W-40)/weeks.length-4,chartH=H-30
    weeks.forEach((w,i)=>{
      const x=20+i*((W-40)/weeks.length)
      const barH=(w.count/max)*chartH*0.85,y=chartH-barH
      const grad=ctx.createLinearGradient(0,y,0,chartH)
      grad.addColorStop(0,'#2e84e9');grad.addColorStop(1,'#193f9e')
      ctx.fillStyle=w.count>0?grad:'#f0f1f4'
      ctx.beginPath();ctx.roundRect(x,y,barW,barH+2,[4,4,0,0]);ctx.fill()
      ctx.fillStyle='#bec1cc';ctx.font='9px -apple-system';ctx.textAlign='center'
      ctx.fillText(w.label,x+barW/2,H-6)
      if(w.count>0){ctx.fillStyle='#02153f';ctx.font='bold 10px -apple-system';ctx.fillText(w.count,x+barW/2,y-4)}
    })
  },[data,periodo,tab])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:'32px',marginBottom:'12px'}}>👨‍⚕️</div><div style={{fontSize:f(14),color:'#7c8088'}}>Caricamento dati paziente...</div></div>
    </div>
  )

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.doc-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:40px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="doc-wrap">

        <div style={{background:'linear-gradient(135deg,#08184c,#193f9e)',padding:'16px 16px 0'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>👨‍⚕️ Vista Medico</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.7)',marginTop:'2px'}}>Dr. {tokenData.medicoName} — Sola lettura</div>
            </div>
            <button type="button" onClick={onLogout} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',borderRadius:'20px',border:'none',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:f(12),fontWeight:'700',cursor:'pointer'}}>
              <LogOut size={14}/> Esci
            </button>
          </div>
          <div style={{background:'rgba(255,255,255,0.12)',borderRadius:'12px',padding:'8px 12px',display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
            <FileText size={14} color="rgba(255,255,255,0.8)"/>
            <span style={{fontSize:f(11),color:'rgba(255,255,255,0.8)',fontWeight:'600'}}>
              Sola lettura · Scade: {tokenData.expiresAt?new Date(tokenData.expiresAt).toLocaleDateString('it-IT'):'N/D'}
            </span>
          </div>

          <div style={{display:'flex',gap:'4px'}}>
            {TABS_MEDICO.filter(tb=>tb.key!=='messaggi'||perms.shareChat).map(({key,label,Icon})=>{
              const active=tab===key
              const badge=key==='messaggi'&&msgNonLetti>0
              return (
                <button key={key} type="button" onClick={()=>setTab(key)} style={{
                  flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',
                  padding:'10px 8px 12px',border:'none',cursor:'pointer',fontFamily:'inherit',
                  fontWeight:'800',fontSize:f(12),
                  background:active?'#f3f4f7':'transparent',
                  color:active?'#193f9e':'rgba(255,255,255,0.65)',
                  borderRadius:'12px 12px 0 0',transition:'all 0.2s',position:'relative'
                }}>
                  <Icon size={15}/>{label}
                  {badge&&(
                    <span style={{position:'absolute',top:'6px',right:'10px',width:'16px',height:'16px',borderRadius:'50%',background:'#F7295A',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #193f9e'}}>
                      <span style={{fontSize:'8px',fontWeight:'900',color:'#fff'}}>{msgNonLetti>9?'9+':msgNonLetti}</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {tab==='messaggi'&&perms.shareChat&&<ChatMedico tokenData={tokenData}/>}

        {tab==='dati'&&(
          <div style={{padding:'12px'}}>
            {/* Badge permessi */}
            <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'12px'}}>
              {[
                {label:'Crisi',color:'#F7295A',bg:'#FEF0F4',show:true},
                {label:'Terapie',color:'#00BFA6',bg:'#E8FBF8',show:perms.shareTerapie},
                {label:'Toilet',color:'#7B5EA7',bg:'#F5F3FF',show:perms.shareToilet},
                {label:'Documenti',color:'#2e84e9',bg:'#EEF3FD',show:perms.shareDocuments},
                {label:'Magazzino',color:'#FF8C42',bg:'#FFF5EE',show:perms.shareMagazzino},
                {label:'Disturbi',color:'#FF8C42',bg:'#FFF5EE',show:perms.shareDisturbi},
              ].filter(p=>p.show).map((p,i)=>(
                <span key={i} style={{fontSize:f(11),fontWeight:'700',padding:'4px 10px',borderRadius:'20px',background:p.bg,color:p.color}}>✓ {p.label}</span>
              ))}
            </div>

            {/* Stats crisi */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'7px',marginBottom:'10px'}}>
              {[
                {label:'Crisi totali',val:data?.crisi?.length||0,color:'#F7295A'},
                {label:'Nel periodo', val:crisiPeriodo.length,    color:'#FF8C42'},
                {label:'Media int.',  val:mediaInt,               color:'#7B5EA7'},
              ].map(({label,val,color},i)=>(
                <div key={i} style={{background:'#feffff',borderRadius:'14px',padding:'10px 8px',boxShadow:shSm,textAlign:'center'}}>
                  <div style={{fontSize:f(22),fontWeight:'900',color,marginBottom:'2px'}}>{val}</div>
                  <div style={{fontSize:f(9),color:'#7c8088',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.3px'}}>{label}</div>
                </div>
              ))}
            </div>

            {/* Grafico crisi */}
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>📊 Andamento crisi</div>
              <div style={{display:'flex',gap:'5px',marginBottom:'12px',overflowX:'auto'}}>
                {PERIODI.map(p=>(
                  <button key={p.key} type="button" onClick={()=>setPeriodo(p.key)} style={{padding:'5px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),whiteSpace:'nowrap',fontFamily:'inherit',background:periodo===p.key?'#193f9e':'#f3f4f7',color:periodo===p.key?'#fff':'#7c8088',transition:'all 0.2s'}}>
                    {p.label}
                  </button>
                ))}
              </div>
              {(data?.crisi?.length||0)===0
                ?<div style={{textAlign:'center',padding:'20px',color:'#bec1cc',fontSize:f(13)}}>Nessuna crisi registrata</div>
                :<canvas ref={canvasRef} width={420} height={110} style={{width:'100%',height:'auto'}}/>
              }
            </div>

            {/* Distribuzione per tipo */}
            {Object.keys(tipiCount).length>0&&(
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>🎯 Distribuzione per tipo</div>
                {Object.entries(tipiCount).sort((a,b)=>b[1]-a[1]).map(([tipo,count])=>{
                  const color=TIPO_COLORI[tipo]||'#7c8088'
                  const pct=Math.round((count/crisiPeriodo.length)*100)
                  return (
                    <div key={tipo} style={{marginBottom:'8px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:color}}/>
                          <span style={{fontSize:f(12),fontWeight:'700',color:'#394058'}}>{tipo}</span>
                        </div>
                        <span style={{fontSize:f(11),color:'#7c8088'}}>{count}x · {pct}%</span>
                      </div>
                      <div style={{height:'6px',borderRadius:'3px',background:'#f3f4f7',overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:'3px',width:`${pct}%`,background:color}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Ultime crisi */}
            {(data?.crisi?.length||0)>0&&(
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>📋 Ultime crisi</div>
                {(data?.crisi||[]).slice(0,10).map((c,i)=>{
                  const color=TIPO_COLORI[c.type]||'#7c8088'
                  return (
                    <div key={i} style={{padding:'10px',borderRadius:'12px',marginBottom:'7px',background:'#f3f4f7',border:`1.5px solid ${color}22`}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                        <div style={{width:'8px',height:'8px',borderRadius:'50%',background:color,flexShrink:0}}/>
                        <span style={{fontSize:f(13),fontWeight:'800',color,flex:1}}>{c.type}</span>
                        <span style={{fontSize:f(10),fontWeight:'700',color:'#fff',background:color,padding:'2px 7px',borderRadius:'20px'}}>{c.duration}</span>
                      </div>
                      <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'3px'}}>📅 {c.date}</div>
                      {c.areas?.length>0&&<div style={{fontSize:f(11),color:'#394058',marginBottom:'2px'}}>🎯 {c.areas.join(', ')}</div>}
                      {c.trigger&&c.trigger!=='Nessuno noto'&&<div style={{fontSize:f(11),color:'#394058',marginBottom:'2px'}}>⚡ {c.trigger}</div>}
                      <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginTop:'5px'}}>
                        {c.intensita&&<span style={{fontSize:f(10),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:c.intensita<=3?'#E8FBF8':c.intensita<=6?'#FFF9E6':'#FEF0F4',color:c.intensita<=3?'#00BFA6':c.intensita<=6?'#FF8C42':'#F7295A'}}>Int. {c.intensita}/10</span>}
                        {c.perdCoscienza&&<span style={{fontSize:f(10),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#FEF0F4',color:'#F7295A'}}>Perdita coscienza</span>}
                        {c.postCrisi&&<span style={{fontSize:f(10),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#F5F3FF',color:'#7B5EA7'}}>{c.postCrisi}</span>}
                      </div>
                      {c.note&&<div style={{fontSize:f(11),color:'#7c8088',marginTop:'5px',fontStyle:'italic',borderTop:'1px solid #f0f1f4',paddingTop:'5px'}}>📝 {c.note}</div>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Terapie */}
            {perms.shareTerapie&&(data?.terapie?.length||0)>0&&(
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>💊 Terapie programmate</div>
                {(data?.terapie||[]).map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 0',borderBottom:i<(data.terapie.length-1)?'1px solid #f0f1f4':'none'}}>
                    <Pill size={16} color="#00BFA6"/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:f(13),fontWeight:'700',color:'#02153f'}}>{t.nome}</div>
                      <div style={{fontSize:f(11),color:'#7c8088'}}>{t.quantita}{t.note?` · ${t.note}`:''}</div>
                    </div>
                    <span style={{fontSize:f(12),fontWeight:'700',color:'#193f9e'}}>{t.orario}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Toilet */}
            {perms.shareToilet&&(data?.toilet?.length||0)>0&&(
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>🚽 Toilet Training</div>
                <ToiletCharts dati={data?.toilet||[]} titolo={false}/>
              </div>
            )}

            {/* Documenti selezionati */}
            {perms.shareDocuments&&(data?.documenti?.length||0)>0&&(
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>📄 Documenti condivisi</div>
                {(data?.documenti||[]).map((d,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px',borderRadius:'12px',marginBottom:'7px',background:'#f3f4f7'}}>
                    <FileText size={18} color="#2e84e9"/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:f(13),fontWeight:'700',color:'#02153f',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.nome}</div>
                      <div style={{fontSize:f(10),color:'#7c8088'}}>{d.tipo} · {d.data}</div>
                    </div>
                    {d.url&&(
                      <button type="button" onClick={()=>window.open(d.url,'_blank')} style={{padding:'6px 12px',borderRadius:'20px',border:'none',cursor:'pointer',background:'#EEF3FD',color:'#2e84e9',fontWeight:'700',fontSize:f(10),fontFamily:'inherit'}}>
                        Apri
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Magazzino */}
            {perms.shareMagazzino&&(data?.magazzino?.length||0)>0&&(
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>📦 Scorte medicinali</div>
                {(data?.magazzino||[]).map((m,i)=>{
                  const gg = m.scadenza ? Math.ceil((new Date(m.scadenza)-Date.now())/86400000) : null
                  const col = gg!==null&&gg<=30 ? '#F7295A' : '#00BFA6'
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 0',borderBottom:i<(data.magazzino.length-1)?'1px solid #f0f1f4':'none'}}>
                      <Package size={16} color={col}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:f(13),fontWeight:'700',color:'#02153f'}}>{m.nome}</div>
                        {m.scadenza&&<div style={{fontSize:f(10),color:col,fontWeight:'600'}}>Scad. {m.scadenza}</div>}
                      </div>
                      {m.scatole&&<span style={{fontSize:f(12),fontWeight:'700',color:'#7c8088'}}>{m.scatole} sc.</span>}
                    </div>
                  )
                })}
              </div>
            )}

            {(data?.crisi?.length||0)===0&&(
              <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh}}>
                <div style={{fontSize:'32px',marginBottom:'12px'}}>📋</div>
                <div style={{fontSize:f(14),color:'#7c8088'}}>Nessun dato disponibile</div>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}

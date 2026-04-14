import { useState, useEffect } from 'react'
import { ChevronLeft, Check, Save, Plus, PenSquare, X, Filter } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, remove, update } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'
import ToiletCharts from './ToiletCharts'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const cardSh = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const MODALITA = [
  { key: 'adulto',      label: '👆 Comando adulto', sub: "L'adulto ha deciso il momento" },
  { key: 'caa-guidata', label: '🤝 CAA guidata',    sub: 'Comunicazione Aumentativa guidata' },
  { key: 'caa-auto',    label: '⭐ CAA autonoma',   sub: 'Ha comunicato da solo' },
]

const BISOGNI = [
  { key: 'pippi',    label: '💧 Pipì' },
  { key: 'cacca',    label: '💩 Cacca' },
  { key: 'entrambi', label: '🔄 Entrambi' },
]

const DEMO_LOG = [
  { id:1, timestamp:Date.now()-3600000,   data:'12/04/2026', ora:'08:30', bisogno:'pippi',    modalita:'caa-auto',    incidentePippi:false, incidenteCacca:false },
  { id:2, timestamp:Date.now()-7200000,   data:'12/04/2026', ora:'13:15', bisogno:'entrambi', modalita:'adulto',      incidentePippi:false, incidenteCacca:false },
  { id:3, timestamp:Date.now()-86400000,  data:'11/04/2026', ora:'09:00', bisogno:'cacca',    modalita:'caa-guidata', incidentePippi:false, incidenteCacca:false },
  { id:4, timestamp:Date.now()-90000000,  data:'11/04/2026', ora:'15:30', bisogno:'pippi',    modalita:'caa-auto',    incidentePippi:true,  oraPippi:'15:10', incidenteCacca:false },
  { id:5, timestamp:Date.now()-180000000, data:'10/04/2026', ora:'11:00', bisogno:'nessuno',  modalita:'',            incidentePippi:true,  oraPippi:'10:50', incidenteCacca:true, oraCacca:'10:55' },
]

function matchOggi(dataField) {
  if (!dataField) return false
  const d = new Date()
  const oggi = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const raw = String(dataField).replace(/[\/\-\s]/g,'')
  const oggiRaw = oggi.replace(/[\/\-\s]/g,'')
  return raw === oggiRaw || String(dataField) === oggi
}

function nowDate() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function emptyForm() {
  return {
    data: nowDate(), ora: nowTime(),
    bisogno: '', modalita: '',
    incidentePippi: false, oraPippi: '',
    incidenteCacca: false, oraCacca: '',
    note: '',
  }
}

const inputStyle = {
  width:'100%', padding:'11px 12px', borderRadius:'12px',
  border:'1.5px solid #f0f1f4', fontSize:'15px', color:'#02153f',
  background:'#f3f4f7', fontFamily:'inherit', outline:'none', boxSizing:'border-box',
}
const labelStyle = {
  fontSize:'13px', fontWeight:'700', color:'#7c8088',
  textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'6px', display:'block',
}

function FormFields({ formData, setFormData, onSubmit, submitLabel, isSaved }) {
  return (
    <>
      <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
        <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>📅 Data e ora</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
          <div>
            <label style={labelStyle}>Data</label>
            <input type="text" value={formData.data} onChange={e=>setFormData({...formData,data:e.target.value})} placeholder="gg/mm/aaaa" style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Ora</label>
            <input type="time" value={formData.ora} onChange={e=>setFormData({...formData,ora:e.target.value})} style={inputStyle}/>
          </div>
        </div>
      </div>

      <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
        <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>⚠️ Incidente addosso</div>
        <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>Indipendente dal bagno</div>
        {[
          { val:formData.incidentePippi, key:'incidentePippi', icon:'💧', title:'Pipì addosso', oraKey:'oraPippi', oraVal:formData.oraPippi, labelOra:'Ora incidente pipì' },
          { val:formData.incidenteCacca, key:'incidenteCacca', icon:'💩', title:'Cacca addosso', oraKey:'oraCacca', oraVal:formData.oraCacca, labelOra:'Ora incidente cacca' },
        ].map(({val,key,icon,title,oraKey,oraVal,labelOra},i) => (
          <div key={i}>
            <div onClick={()=>setFormData({...formData,[key]:!val})} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px',borderRadius:'14px',cursor:'pointer',background:val?'#FEF0F4':'#f3f4f7',border:`2px solid ${val?'#F7295A33':'transparent'}`,marginBottom:'8px',transition:'all 0.15s'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{fontSize:'22px'}}>{icon}</span>
                <div style={{fontSize:f(13),fontWeight:'700',color:val?'#F7295A':'#394058'}}>{title}</div>
              </div>
              <div style={{width:'48px',height:'26px',borderRadius:'13px',background:val?'#F7295A':'#dde0ed',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'3px',left:val?'25px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
              </div>
            </div>
            {val && (
              <div style={{padding:'0 4px 10px'}}>
                <label style={labelStyle}>{labelOra}</label>
                <input type="time" value={oraVal} onChange={e=>setFormData({...formData,[oraKey]:e.target.value})} style={inputStyle}/>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
        <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px'}}>🚽 Ha usato il bagno?</div>
        <div style={{fontSize:f(11),color:'#7c8088',marginBottom:'12px'}}>Opzionale</div>
        <label style={labelStyle}>Cosa ha fatto</label>
        <div style={{display:'flex',gap:'7px',marginBottom:'14px'}}>
          {BISOGNI.map(({key,label}) => (
            <div key={key} onClick={()=>setFormData({...formData,bisogno:formData.bisogno===key?'':key,modalita:formData.bisogno===key?'':formData.modalita})} style={{flex:1,padding:'10px 6px',borderRadius:'12px',cursor:'pointer',textAlign:'center',fontSize:f(12),fontWeight:'700',border:`2px solid ${formData.bisogno===key?'#7B5EA7':'#f0f1f4'}`,background:formData.bisogno===key?'#F5F3FF':'#feffff',color:formData.bisogno===key?'#7B5EA7':'#7c8088',transition:'all 0.15s'}}>{label}</div>
          ))}
        </div>
        {formData.bisogno && (
          <>
            <label style={labelStyle}>🧠 Come è andato</label>
            {MODALITA.map(opt => (
              <div key={opt.key} onClick={()=>setFormData({...formData,modalita:opt.key})} style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 12px',borderRadius:'12px',cursor:'pointer',marginBottom:'7px',border:`2px solid ${formData.modalita===opt.key?'#7B5EA7':'#f0f1f4'}`,background:formData.modalita===opt.key?'#F5F3FF':'#feffff',transition:'all 0.15s'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:f(13),fontWeight:'700',color:formData.modalita===opt.key?'#7B5EA7':'#02153f'}}>{opt.label}</div>
                  <div style={{fontSize:f(10),color:'#7c8088'}}>{opt.sub}</div>
                </div>
                {formData.modalita===opt.key && <Check size={16} color="#7B5EA7"/>}
              </div>
            ))}
          </>
        )}
        <label style={{...labelStyle,marginTop:'10px'}}>📝 Note</label>
        <textarea value={formData.note} onChange={e=>setFormData({...formData,note:e.target.value})} rows={2} placeholder="Annotazioni opzionali..." style={{...inputStyle,resize:'vertical'}}/>
      </div>

      <button type="button" onClick={onSubmit} style={{width:'100%',padding:'16px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:isSaved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#7B5EA7,#2e84e9)',boxShadow:'0 6px 20px rgba(123,94,167,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.3s',marginBottom:'8px'}}>
        {isSaved ? <><Check size={18} color="#fff"/> Salvato!</> : <><Save size={18} color="#fff"/> {submitLabel}</>}
      </button>
    </>
  )
}

export default function ToiletPage({ onBack, isDemo }) {
  const [tab, setTab] = useState('form')
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [filtro, setFiltro] = useState('settimana')
  const [showFilters, setShowFilters] = useState(false)
  const [filterBisogno, setFilterBisogno] = useState('tutti')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [editForm, setEditForm] = useState(emptyForm())

  useEffect(() => {
    if (isDemo) { setLog(DEMO_LOG); setLoading(false); return }
    const ttRef = ref(db, 'toilet_training')
    const unsub = onValue(ttRef, (snap) => {
      const lista = processFirebaseSnap(snap).sort((a,b) => b.timestamp - a.timestamp)
      setLog(lista)
      setLoading(false)
    })
    return () => unsub()
  }, [isDemo])

  function handleSave() {
    const hasBagno = form.bisogno !== ''
    const hasIncidente = form.incidentePippi || form.incidenteCacca
    if (!hasBagno && !hasIncidente) {
      alert("Seleziona cosa ha fatto in bagno oppure se c'è stato un incidente")
      return
    }
    if (hasBagno && !form.modalita) { alert('Seleziona come è andato in bagno'); return }
    const sessione = {
      id: Date.now(), timestamp: Date.now(),
      data: form.data, ora: form.ora,
      bisogno: form.bisogno || 'nessuno', modalita: form.modalita,
      incidentePippi: form.incidentePippi, oraPippi: form.incidentePippi ? form.oraPippi : '',
      incidenteCacca: form.incidenteCacca, oraCacca: form.incidenteCacca ? form.oraCacca : '',
      note: form.note,
    }
    if (!isDemo) push(ref(db, 'toilet_training'), encrypt(sessione))
    else setLog(prev => [sessione, ...prev])
    setSaved(true)
    setTimeout(() => { setSaved(false); setForm(emptyForm()) }, 1500)
  }

  function openEdit(item) {
    setEditItem(item)
    setEditForm({
      data: item.data || nowDate(), ora: item.ora || nowTime(),
      bisogno: item.bisogno === 'nessuno' ? '' : (item.bisogno || ''),
      modalita: item.modalita || '',
      incidentePippi: !!item.incidentePippi, oraPippi: item.oraPippi || '',
      incidenteCacca: !!item.incidenteCacca, oraCacca: item.oraCacca || '',
      note: item.note || '',
    })
    setShowEditModal(true)
  }

  function handleUpdate() {
    if (!editItem) return
    const updated = {
      ...editItem,
      data: editForm.data, ora: editForm.ora,
      bisogno: editForm.bisogno || 'nessuno', modalita: editForm.modalita,
      incidentePippi: editForm.incidentePippi, oraPippi: editForm.incidentePippi ? editForm.oraPippi : '',
      incidenteCacca: editForm.incidenteCacca, oraCacca: editForm.incidenteCacca ? editForm.oraCacca : '',
      note: editForm.note,
    }
    if (!isDemo && editItem._firebaseKey) {
      update(ref(db, `toilet_training/${editItem._firebaseKey}`), encrypt(updated))
    } else {
      setLog(prev => prev.map(x => x.id === editItem.id ? updated : x))
    }
    setShowEditModal(false); setEditItem(null)
  }

  function handleDelete(item) {
    if (!window.confirm('Eliminare questa sessione?')) return
    if (!isDemo && item._firebaseKey) remove(ref(db, `toilet_training/${item._firebaseKey}`))
    else setLog(prev => prev.filter(x => x.id !== item.id))
    setShowEditModal(false); setEditItem(null)
  }

  function logFiltrato() {
    let lista = log
    if (filtro === 'oggi')      lista = lista.filter(s => matchOggi(s.data))
    if (filtro === 'settimana') lista = lista.filter(s => (s.timestamp||0) >= Date.now()-7*86400000)
    if (filtro === 'mese')      lista = lista.filter(s => (s.timestamp||0) >= Date.now()-30*86400000)
    if (filterBisogno !== 'tutti') lista = lista.filter(s => s.bisogno === filterBisogno)
    return lista
  }

  const logOggi = log.filter(s => matchOggi(s.data))
  const bagnoOggi = logOggi.filter(s => s.bisogno && s.bisogno !== 'nessuno').length
  const incidentiOggi = logOggi.filter(s => s.incidentePippi || s.incidenteCacca).length
  const logVisibile = logFiltrato()

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.tw{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:140px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="tw">

        <div style={{background:'linear-gradient(135deg,#7B5EA7,#2e84e9)',padding:'14px 16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <button type="button" onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>🚽 Toilet Training</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>{isDemo?'🎭 Dati demo':'Registra sessione'}</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
            {[
              {label:'Bagno oggi',    val:bagnoOggi,      color:'#fff'},
              {label:'Incidenti oggi',val:incidentiOggi,  color:incidentiOggi>0?'#FFD93D':'#fff'},
              {label:'Tot. sessioni', val:log.length,     color:'#fff'},
            ].map(({label,val,color},i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:f(20),fontWeight:'900',color}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',background:'#f3f4f7',margin:'12px 12px 0',borderRadius:'12px',padding:'3px',gap:'3px'}}>
          {[{k:'form',l:'➕ Nuova'},{k:'storico',l:'📋 Storico'},{k:'grafici',l:'📊 Grafici'}].map(({k,l}) => (
            <button type="button" key={k} onClick={()=>setTab(k)} style={{padding:'9px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:tab===k?'#feffff':'transparent',color:tab===k?'#7B5EA7':'#7c8088',boxShadow:tab===k?'0 2px 8px rgba(2,21,63,0.10)':'none',transition:'all 0.2s'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:'12px'}}>

          {tab==='form' && (
            <>
              <FormFields formData={form} setFormData={setForm} onSubmit={handleSave} submitLabel="Salva sessione" isSaved={saved}/>
              {isDemo && <div style={{textAlign:'center',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Modalità demo — dati non salvati su Firebase</div>}
            </>
          )}

          {tab==='storico' && (
            <>
              <div style={{display:'flex',gap:'6px',marginBottom:'8px',flexWrap:'wrap'}}>
                {[{k:'oggi',l:'Oggi'},{k:'settimana',l:'7 giorni'},{k:'mese',l:'30 giorni'},{k:'tutto',l:'Tutto'}].map(({k,l}) => (
                  <button type="button" key={k} onClick={()=>setFiltro(k)} style={{padding:'6px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:filtro===k?'#7B5EA7':'#feffff',color:filtro===k?'#fff':'#7c8088',boxShadow:filtro===k?'0 3px 10px rgba(123,94,167,0.3)':'0 2px 6px rgba(0,0,0,0.06)',transition:'all 0.2s'}}>
                    {l}
                  </button>
                ))}
                <button type="button" onClick={()=>setShowFilters(v=>!v)} style={{padding:'6px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:'#feffff',color:'#7c8088',boxShadow:'0 2px 6px rgba(0,0,0,0.06)',display:'flex',alignItems:'center',gap:'4px'}}>
                  <Filter size={12}/> Filtri
                </button>
              </div>

              {showFilters && (
                <div style={{background:'#feffff',borderRadius:'14px',padding:'12px',marginBottom:'10px',boxShadow:cardSh}}>
                  <label style={labelStyle}>Tipo bisogno</label>
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                    {[{k:'tutti',l:'Tutti'}, ...BISOGNI.map(b=>({k:b.key,l:b.label}))].map(({k,l}) => (
                      <button type="button" key={k} onClick={()=>setFilterBisogno(k)} style={{padding:'5px 10px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:filterBisogno===k?'#7B5EA7':'#f3f4f7',color:filterBisogno===k?'#fff':'#7c8088',transition:'all 0.2s'}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>📋 {logVisibile.length} sessioni</div>
                {loading ? (
                  <div style={{textAlign:'center',padding:'20px',color:'#bec1cc',fontSize:f(13)}}>Caricamento...</div>
                ) : logVisibile.length===0 ? (
                  <div style={{textAlign:'center',padding:'20px',color:'#bec1cc',fontSize:f(13)}}>Nessuna sessione in questo periodo</div>
                ) : (
                  logVisibile.map((s,i) => {
                    const hasBagno = s.bisogno && s.bisogno !== 'nessuno'
                    const hasInc = s.incidentePippi || s.incidenteCacca
                    const borderColor = hasInc ? '#F7295A' : hasBagno ? '#7B5EA7' : '#bec1cc'
                    return (
                      <div key={s.id||i} style={{padding:'11px 12px',borderRadius:'12px',marginBottom:'8px',background:'#f3f4f7',borderLeft:`3px solid ${borderColor}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'5px'}}>
                          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',flex:1}}>
                            {hasBagno && <span style={{fontSize:f(12),fontWeight:'800',color:'#7B5EA7'}}>{s.bisogno==='pippi'?'💧 Pipì':s.bisogno==='cacca'?'💩 Cacca':'🔄 Entrambi'}</span>}
                            {hasInc && <span style={{fontSize:f(11),fontWeight:'700',color:'#F7295A',background:'#FEF0F4',padding:'1px 8px',borderRadius:'20px'}}>⚠️ Incidente{s.incidentePippi&&s.incidenteCacca?' pipì+cacca':s.incidentePippi?' pipì':' cacca'}</span>}
                            {!hasBagno && !hasInc && <span style={{fontSize:f(11),color:'#bec1cc'}}>Sessione vuota</span>}
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                            <span style={{fontSize:f(10),color:'#bec1cc'}}>{s.data} {s.ora}</span>
                            <button type="button" onClick={()=>openEdit(s)} style={{width:'28px',height:'28px',borderRadius:'8px',border:'none',background:'#e8eaf0',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <PenSquare size={13} color="#7c8088"/>
                            </button>
                          </div>
                        </div>
                        {hasBagno && s.modalita && <div style={{fontSize:f(11),color:'#7c8088'}}>{s.modalita==='adulto'?'👆 Comando adulto':s.modalita==='caa-guidata'?'🤝 CAA guidata':'⭐ CAA autonoma'}</div>}
                        {s.incidentePippi && s.oraPippi && <div style={{fontSize:f(10),color:'#F7295A',marginTop:'3px'}}>💧 Pipì addosso alle {s.oraPippi}</div>}
                        {s.incidenteCacca && s.oraCacca && <div style={{fontSize:f(10),color:'#F7295A',marginTop:'2px'}}>💩 Cacca addosso alle {s.oraCacca}</div>}
                        {s.note ? <div style={{fontSize:f(10),color:'#7c8088',marginTop:'3px',fontStyle:'italic'}}>{s.note}</div> : null}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {tab==='grafici' && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
              {log.length===0 ? (
                <div style={{textAlign:'center',padding:'24px',color:'#bec1cc'}}>
                  <div style={{fontSize:'32px',marginBottom:'8px'}}>📊</div>
                  <div style={{fontSize:f(13)}}>Nessuna sessione registrata</div>
                </div>
              ) : (
                <ToiletCharts dati={log} titolo={false}/>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODALE MODIFICA */}
      {showEditModal && editItem && (
        <div onClick={()=>{setShowEditModal(false);setEditItem(null)}} style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:'480px',background:'#f3f4f7',borderTopLeftRadius:'24px',borderTopRightRadius:'24px',padding:'14px',maxHeight:'88vh',overflowY:'auto'}}>
            <div style={{width:'40px',height:'4px',borderRadius:'99px',background:'#dde0ed',margin:'0 auto 14px'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <div style={{fontSize:f(15),fontWeight:'900',color:'#02153f'}}>✏️ Modifica sessione</div>
              <div style={{display:'flex',gap:'8px'}}>
                <button type="button" onClick={()=>handleDelete(editItem)} style={{padding:'8px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),background:'#FEF0F4',color:'#F7295A',fontFamily:'inherit'}}>
                  🗑 Elimina
                </button>
                <button type="button" onClick={()=>{setShowEditModal(false);setEditItem(null)}} style={{width:'32px',height:'32px',borderRadius:'50%',border:'none',background:'#f3f4f7',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <X size={16} color="#7c8088"/>
                </button>
              </div>
            </div>
            <FormFields formData={editForm} setFormData={setEditForm} onSubmit={handleUpdate} submitLabel="Aggiorna sessione" isSaved={false}/>
          </div>
        </div>
      )}
    </>
  )
}

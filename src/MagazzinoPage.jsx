import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Plus, AlertTriangle, Check, Trash2, Pencil, Minus, Camera, X } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, remove, set } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const DEMO_MAGAZZINO = [
  {id:1,nome:'Keppra 500mg',ean:'8001234567890',scatole:3,lotto:'ABC123',scadenza:'2026-12-31',note:''},
  {id:2,nome:'Depakine 250ml',ean:'8009876543210',scatole:1,lotto:'DEF456',scadenza:'2026-06-15',note:'Tenere in frigo'},
  {id:3,nome:'Rivotril 0.5mg',ean:'8001122334455',scatole:2,lotto:'GHI789',scadenza:'2026-08-20',note:''},
  {id:4,nome:'Keppra 750mg',ean:'8005544332211',scatole:0,lotto:'JKL012',scadenza:'2026-04-30',note:'DA RIORDINARE'},
]

function getDaysToExpiry(scadenza) {
  if (!scadenza) return 9999
  return Math.ceil((new Date(scadenza) - Date.now()) / 86400000)
}

function colorScadenza(gg) {
  if (gg < 0) return '#F7295A'
  if (gg <= 7) return '#F7295A'
  if (gg <= 30) return '#FF8C42'
  return '#00BFA6'
}

// ── Toast feedback ─────────────────────────────────────────────
function Toast({ msg, color = '#00BFA6' }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
      background: color, color: '#fff', borderRadius: '50px',
      padding: '10px 22px', fontSize: f(13), fontWeight: '800',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999,
      whiteSpace: 'nowrap', animation: 'toastIn 0.25s cubic-bezier(0.22,1,0.36,1)',
      fontFamily: "-apple-system,'Segoe UI',sans-serif",
    }}>
      {msg}
    </div>
  )
}

// ── Grafici canvas ─────────────────────────────────────────────
function GraficoScatole({ magazzino }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current || magazzino.length === 0) return
    const ctx = canvasRef.current.getContext('2d')
    const W = canvasRef.current.width
    const H = canvasRef.current.height
    ctx.clearRect(0,0,W,H)
    const maxS = Math.max(...magazzino.map(m=>m.scatole||0), 1)
    const barH = Math.min(28, (H-10)/magazzino.length - 4)
    magazzino.forEach((m,i) => {
      const y = i*(barH+6) + 5
      const n = m.scatole||0
      const pct = n/maxS
      const color = n===0?'#F7295A':n===1?'#FF8C42':'#00BFA6'
      ctx.fillStyle = '#f3f4f7'
      ctx.beginPath(); ctx.roundRect(90, y, W-100, barH, [4]); ctx.fill()
      if (n>0) {
        ctx.fillStyle = color
        ctx.beginPath(); ctx.roundRect(90, y, (W-100)*pct, barH, [4]); ctx.fill()
      }
      const nome = m.nome.length>14 ? m.nome.slice(0,12)+'…' : m.nome
      ctx.fillStyle = '#394058'; ctx.font = `bold ${Math.round(10*1.15)}px -apple-system`
      ctx.textAlign = 'right'; ctx.fillText(nome, 85, y+barH/2+4)
      ctx.fillStyle = n===0?'#F7295A':n===1?'#FF8C42':'#00BFA6'
      ctx.font = `bold ${Math.round(10*1.15)}px -apple-system`
      ctx.textAlign = 'left'
      ctx.fillText(n===0?'Esaurito':`${n} scatole`, 90+(W-100)*pct+6, y+barH/2+4)
    })
  }, [magazzino])
  const altezza = Math.max(magazzino.length * 34 + 20, 80)
  return <canvas ref={canvasRef} width={420} height={altezza} style={{width:'100%',height:'auto'}}/>
}

function TimelineScadenze({ magazzino }) {
  const sorted = [...magazzino]
    .filter(m => m.scadenza)
    .sort((a,b) => getDaysToExpiry(a.scadenza) - getDaysToExpiry(b.scadenza))
  return (
    <div>
      {sorted.map((m,i) => {
        const gg = getDaysToExpiry(m.scadenza)
        const color = colorScadenza(gg)
        const maxGG = 365
        const pct = Math.min(Math.max(gg,0)/maxGG*100, 100)
        return (
          <div key={i} style={{marginBottom:'10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
              <span style={{fontSize:f(11),fontWeight:'700',color:'#394058'}}>{m.nome}</span>
              <span style={{fontSize:f(11),fontWeight:'700',color}}>
                {gg<0?'Scaduto':gg===0?'Oggi':gg<=30?`${gg}gg`:`${Math.floor(gg/30)}m`}
              </span>
            </div>
            <div style={{height:'7px',borderRadius:'4px',background:'#f3f4f7',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:'4px',width:`${pct}%`,background:color,transition:'width 0.4s'}}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Form aggiunta/modifica ─────────────────────────────────────
function FormMedicinale({ initial={}, onSave, onCancel, title='Aggiungi medicinale' }) {
  const [nome, setNome] = useState(initial.nome||'')
  const [ean, setEan] = useState(initial.ean||'')
  const [scatole, setScatole] = useState(String(initial.scatole||1))
  const [lotto, setLotto] = useState(initial.lotto||'')
  const [scadenza, setScadenza] = useState(initial.scadenza||'')
  const [note, setNote] = useState(initial.note||'')
  const [scanning, setScanning] = useState(false)
  const fileRef = useRef(null)
  const formRef = useRef(null)

  // Scroll automatico al form appena montato
  useEffect(() => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [])

  function handleSave() {
    if (!nome.trim()) { alert('Inserisci il nome del medicinale'); return }
    if (!scadenza) { alert('Inserisci la data di scadenza'); return }
    onSave({ nome:nome.trim(), ean:ean.trim(), scatole:parseInt(scatole)||0, lotto:lotto.trim(), scadenza, note:note.trim() })
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const b64 = ev.target.result
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: [
                { type:'image', source:{ type:'base64', media_type:file.type||'image/jpeg', data:b64.split(',')[1] } },
                { type:'text', text:'Leggi questa immagine di un medicinale o confezione farmaceutica. Rispondimi SOLO in JSON con i campi: nome (nome commerciale del medicinale), ean (codice EAN/barcode numerico se visibile, altrimenti stringa vuota), lotto (numero lotto se visibile, altrimenti stringa vuota), scadenza (data scadenza in formato YYYY-MM-DD se visibile, altrimenti stringa vuota). Niente altro testo.' }
              ]
            }]
          })
        })
        const data = await resp.json()
        const txt = data.content?.[0]?.text || ''
        try {
          const clean = txt.replace(/```json|```/g,'').trim()
          const parsed = JSON.parse(clean)
          if (parsed.nome) setNome(parsed.nome)
          if (parsed.ean) setEan(parsed.ean)
          if (parsed.lotto) setLotto(parsed.lotto)
          if (parsed.scadenza) setScadenza(parsed.scadenza)
        } catch { alert('Non sono riuscito a leggere il medicinale. Inserisci i dati manualmente.') }
        setScanning(false)
      }
      reader.readAsDataURL(file)
    } catch { setScanning(false); alert('Errore lettura immagine') }
    e.target.value = ''
  }

  const inputStyle = {
    width:'100%', padding:'11px 12px', borderRadius:'12px',
    border:'1.5px solid #f0f1f4', fontSize:f(13), color:'#02153f',
    background:'#f3f4f7', fontFamily:'inherit', outline:'none', boxSizing:'border-box',
    marginBottom:'10px'
  }
  const labelStyle = {
    fontSize:f(11), fontWeight:'700', color:'#7c8088',
    textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'5px', display:'block'
  }

  return (
    <div ref={formRef} style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'10px',boxShadow:sh}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <div style={{fontSize:f(14),fontWeight:'800',color:'#02153f'}}>{title}</div>
        <button onClick={onCancel} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <X size={16} color="#7c8088"/>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:'none'}}/>
      <button onClick={()=>fileRef.current?.click()} disabled={scanning} style={{
        width:'100%',padding:'12px',borderRadius:'12px',border:'1.5px dashed #2e84e9',
        background:'#EEF3FD',color:'#193f9e',fontWeight:'700',fontSize:f(12),
        cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        gap:'8px',marginBottom:'14px',fontFamily:'inherit',
        opacity:scanning?0.6:1
      }}>
        <Camera size={16} color="#193f9e"/>
        {scanning?'Lettura in corso...':'Fotografa il medicinale (OCR automatico)'}
      </button>

      <label style={labelStyle}>Nome *</label>
      <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Es: Keppra 500mg" style={inputStyle}
        onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        <div>
          <label style={labelStyle}>Scatole</label>
          <input type="number" min="0" value={scatole} onChange={e=>setScatole(e.target.value)} style={inputStyle}
            onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
        </div>
        <div>
          <label style={labelStyle}>Scadenza *</label>
          <input type="date" value={scadenza} onChange={e=>setScadenza(e.target.value)}
            min="2020-01-01" max="2040-12-31"
            style={{...inputStyle, WebkitAppearance:'none', appearance:'none'}}
            onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
        </div>
      </div>

      <label style={labelStyle}>Codice EAN</label>
      <input value={ean} onChange={e=>setEan(e.target.value)} placeholder="Es: 8001234567890" style={inputStyle}
        onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

      <label style={labelStyle}>Lotto</label>
      <input value={lotto} onChange={e=>setLotto(e.target.value)} placeholder="Es: ABC123" style={inputStyle}
        onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

      <label style={labelStyle}>Note</label>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Es: Tenere in frigo" style={inputStyle}
        onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

      <button onClick={handleSave} style={{
        width:'100%',padding:'14px',borderRadius:'50px',border:'none',
        cursor:'pointer',fontWeight:'800',fontSize:f(14),color:'#fff',
        background:'linear-gradient(135deg,#00BFA6,#193f9e)',
        boxShadow:'0 6px 20px rgba(0,191,166,0.35)',fontFamily:'inherit'
      }}>
        <Check size={16} color="#fff" style={{marginRight:'6px'}}/> Salva
      </button>
    </div>
  )
}

// ── COMPONENTE PRINCIPALE ──────────────────────────────────────
export default function MagazzinoPage({ onBack, isDemo }) {
  const [magazzino, setMagazzino] = useState([])
  const [loading, setLoading] = useState(true)
  const [sezione, setSezione] = useState('lista')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [toast, setToast] = useState({ msg: '', color: '#00BFA6' })

  function showToast(msg, color = '#00BFA6') {
    setToast({ msg, color })
    setTimeout(() => setToast({ msg: '', color: '#00BFA6' }), 2200)
  }

  useEffect(() => {
    if (isDemo) { setMagazzino(DEMO_MAGAZZINO); setLoading(false); return }
    const mRef = ref(db,'magazzino')
    const unsubscribe = onValue(mRef, (snapshot) => {
      const lista = processFirebaseSnap(snapshot)
        .sort((a,b) => getDaysToExpiry(a.scadenza) - getDaysToExpiry(b.scadenza))
      setMagazzino(lista)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [isDemo])

  function handleAdd(data) {
    const med = { id:Date.now(), ...data }
    if (!isDemo) push(ref(db,'magazzino'), encrypt(med))
    else setMagazzino(prev=>[...prev,{...med,id:Date.now()}])
    setShowForm(false)
    showToast('✅ Medicinale aggiunto!')
  }

  function handleEdit(data) {
    if (!isDemo && editItem._firebaseKey) {
      set(ref(db,`magazzino/${editItem._firebaseKey}`), encrypt({...editItem,...data}))
    } else {
      setMagazzino(prev=>prev.map(m=>m.id===editItem.id?{...m,...data}:m))
    }
    setEditItem(null)
    showToast('✅ Modificato!')
  }

  function handleDelete(item) {
    if (!window.confirm(`Eliminare ${item.nome}?`)) return
    if (!isDemo && item._firebaseKey) remove(ref(db,`magazzino/${item._firebaseKey}`))
    else setMagazzino(prev=>prev.filter(m=>m.id!==item.id))
    showToast('🗑️ Eliminato', '#7c8088')
  }

  function handleScarico(item) {
    if ((item.scatole||0) <= 0) return
    const nuoveScatole = (item.scatole||0) - 1
    const updated = {...item, scatole:nuoveScatole}
    if (!isDemo && item._firebaseKey) {
      const toSave = {...updated}; delete toSave._firebaseKey
      set(ref(db,`magazzino/${item._firebaseKey}`), encrypt(toSave))
    } else {
      setMagazzino(prev=>prev.map(m=>m.id===item.id?{...m,scatole:nuoveScatole}:m))
    }
    if (nuoveScatole === 0) showToast(`⚠️ ${item.nome} esaurito! Riordinare.`, '#F7295A')
    else if (nuoveScatole === 1) showToast(`⚠️ ${item.nome}: ultima scatola!`, '#FF8C42')
    else showToast(`📦 ${item.nome}: ${nuoveScatole} scatole rimaste`)
  }

  const inScadenza = magazzino.filter(m=>{const g=getDaysToExpiry(m.scadenza);return g>=0&&g<=30})
  const esauriti = magazzino.filter(m=>(m.scatole||0)===0)

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'12px'}}>💊</div>
        <div style={{fontSize:f(14),color:'#7c8088'}}>Caricamento magazzino...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .mag-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>

      <Toast msg={toast.msg} color={toast.color} />

      <div className="mag-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#00BFA6,#193f9e)',padding:'14px 16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <ChevronLeft size={20} color="#fff"/>
              </button>
              <div>
                <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>💊 Magazzino</div>
                <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                  {isDemo?'🎭 Dati demo':`${magazzino.length} medicinali`}
                </div>
              </div>
            </div>
            <button onClick={()=>{setShowForm(true);setEditItem(null)}} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <Plus size={20} color="#fff"/>
            </button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
            {[
              {label:'Medicinali',val:magazzino.length,color:'#fff'},
              {label:'In scadenza',val:inScadenza.length,color:inScadenza.length>0?'#FFD93D':'#fff'},
              {label:'Esauriti',val:esauriti.length,color:esauriti.length>0?'#FFD93D':'#fff'},
            ].map(({label,val,color},i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:f(20),fontWeight:'900',color}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TAB */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#f3f4f7',margin:'12px 12px 0',borderRadius:'12px',padding:'3px',gap:'3px'}}>
          {[{k:'lista',l:'💊 Lista'},{k:'grafici',l:'📊 Grafici'}].map(({k,l})=>(
            <button key={k} onClick={()=>setSezione(k)} style={{padding:'9px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(12),fontFamily:'inherit',background:sezione===k?'#feffff':'transparent',color:sezione===k?'#00BFA6':'#7c8088',boxShadow:sezione===k?'0 2px 8px rgba(2,21,63,0.10)':'none',transition:'all 0.2s'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:'12px'}}>

          {/* Form aggiunta */}
          {showForm && !editItem && (
            <FormMedicinale
              title="➕ Aggiungi medicinale"
              onSave={handleAdd}
              onCancel={()=>setShowForm(false)}
            />
          )}

          {/* Form modifica */}
          {editItem && (
            <FormMedicinale
              title={`✏️ Modifica — ${editItem.nome}`}
              initial={editItem}
              onSave={handleEdit}
              onCancel={()=>setEditItem(null)}
            />
          )}

          {/* ALERT scadenze */}
          {inScadenza.length>0 && sezione==='lista' && (
            <div style={{background:'#FFF9E6',borderRadius:'14px',padding:'12px 14px',marginBottom:'10px',border:'1.5px solid #FFD93D66',display:'flex',gap:'10px',alignItems:'flex-start'}}>
              <AlertTriangle size={18} color="#FF8C42" style={{flexShrink:0,marginTop:'1px'}}/>
              <div>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#8B6914',marginBottom:'2px'}}>Medicinali in scadenza</div>
                <div style={{fontSize:f(12),color:'#8B6914'}}>{inScadenza.map(m=>m.nome).join(', ')}</div>
              </div>
            </div>
          )}
          {esauriti.length>0 && sezione==='lista' && (
            <div style={{background:'#FEF0F4',borderRadius:'14px',padding:'12px 14px',marginBottom:'10px',border:'1.5px solid #F7295A33',display:'flex',gap:'10px',alignItems:'flex-start'}}>
              <AlertTriangle size={18} color="#F7295A" style={{flexShrink:0,marginTop:'1px'}}/>
              <div>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#c41230',marginBottom:'2px'}}>Medicinali esauriti</div>
                <div style={{fontSize:f(12),color:'#c41230'}}>{esauriti.map(m=>m.nome).join(', ')} — Da riordinare</div>
              </div>
            </div>
          )}

          {/* ── LISTA ── */}
          {sezione==='lista' && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
              <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                💊 Scorte ({magazzino.length})
              </div>
              {magazzino.length===0 ? (
                <div style={{textAlign:'center',padding:'24px',color:'#bec1cc'}}>
                  <div style={{fontSize:'32px',marginBottom:'8px'}}>💊</div>
                  <div style={{fontSize:f(13),marginBottom:'4px'}}>Nessun medicinale</div>
                  <div style={{fontSize:f(11)}}>Tocca + per aggiungere</div>
                </div>
              ) : (
                magazzino.map((m,i) => {
                  const gg = getDaysToExpiry(m.scadenza)
                  const esaurito = (m.scatole||0)===0
                  const inScad = gg>=0 && gg<=30
                  const scaduto = gg<0
                  let borderColor = '#f0f1f4'
                  if (scaduto||esaurito) borderColor='#F7295A'
                  else if (inScad) borderColor='#FFD93D'

                  return (
                    <div key={m.id||i} style={{padding:'12px',borderRadius:'14px',marginBottom:'8px',background:'#f3f4f7',border:`1.5px solid ${borderColor}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                        <div style={{fontSize:f(14),fontWeight:'800',color:'#02153f',flex:1,marginRight:'8px'}}>{m.nome}</div>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button onClick={()=>{setEditItem(m);setShowForm(false)}} style={{width:'30px',height:'30px',borderRadius:'50%',background:'#EEF3FD',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Pencil size={13} color="#193f9e"/>
                          </button>
                          <button onClick={()=>handleDelete(m)} style={{width:'30px',height:'30px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Trash2 size={13} color="#F7295A"/>
                          </button>
                        </div>
                      </div>

                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',flex:1}}>
                          <span style={{fontSize:f(11),fontWeight:'700',padding:'3px 10px',borderRadius:'20px',background:esaurito?'#FEF0F4':'#E8FBF8',color:esaurito?'#F7295A':'#00BFA6'}}>
                            {esaurito?'⚠️ Esaurito':`📦 ${m.scatole} scatole`}
                          </span>
                          <span style={{fontSize:f(11),fontWeight:'700',padding:'3px 10px',borderRadius:'20px',background:scaduto?'#FEF0F4':inScad?'#FFF9E6':'#f3f4f7',color:scaduto?'#F7295A':inScad?'#FF8C42':'#7c8088'}}>
                            {scaduto?'❌ Scaduto':inScad?`⚠️ ${gg}gg`:`✓ ${gg}gg`}
                          </span>
                        </div>
                        <button
                          onClick={()=>handleScarico(m)}
                          disabled={esaurito}
                          style={{
                            display:'flex',alignItems:'center',gap:'5px',
                            padding:'6px 12px',borderRadius:'20px',border:'none',
                            cursor:esaurito?'default':'pointer',
                            background:esaurito?'#f3f4f7':'linear-gradient(135deg,#193f9e,#2e84e9)',
                            color:esaurito?'#bec1cc':'#fff',
                            fontWeight:'700',fontSize:f(11),fontFamily:'inherit',
                            opacity:esaurito?0.5:1
                          }}>
                          <Minus size={12} color={esaurito?'#bec1cc':'#fff'}/>
                          Prendo 1
                        </button>
                      </div>

                      {m.lotto && <div style={{fontSize:f(11),color:'#bec1cc'}}>Lotto: {m.lotto}</div>}
                      {m.ean && <div style={{fontSize:f(10),color:'#bec1cc',marginTop:'2px'}}>EAN: {m.ean}</div>}
                      {m.note && <div style={{fontSize:f(11),color:'#7c8088',marginTop:'4px',fontStyle:'italic'}}>📝 {m.note}</div>}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── GRAFICI ── */}
          {sezione==='grafici' && (
            <>
              {magazzino.length===0 ? (
                <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh}}>
                  <div style={{fontSize:'32px',marginBottom:'12px'}}>📊</div>
                  <div style={{fontSize:f(14),color:'#7c8088'}}>Aggiungi medicinali per vedere i grafici</div>
                </div>
              ) : (
                <>
                  <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                    <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>📦 Scorte per medicinale</div>
                    <GraficoScatole magazzino={magazzino}/>
                  </div>
                  <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
                    <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>⏳ Timeline scadenze</div>
                    <TimelineScadenze magazzino={magazzino}/>
                    <div style={{display:'flex',gap:'12px',marginTop:'10px',padding:'8px 0',borderTop:'1px solid #f0f1f4'}}>
                      {[{c:'#00BFA6',l:'OK (>30gg)'},{c:'#FF8C42',l:'Attenzione (≤30gg)'},{c:'#F7295A',l:'Urgente (≤7gg/Scaduto)'}].map(({c,l})=>(
                        <div key={l} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:c,flexShrink:0}}/>
                          <span style={{fontSize:f(9),color:'#7c8088'}}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </>
  )
}

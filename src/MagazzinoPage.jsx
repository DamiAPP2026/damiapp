import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Plus, AlertTriangle, Check, Trash2, Pencil, Minus, Camera, X } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, remove, set } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

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

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg, color = '#00BFA6' }) {
  if (!msg) return null
  return (
    <div style={{
      position:'fixed', bottom:'90px', left:'50%', transform:'translateX(-50%)',
      background:color, color:'#fff', borderRadius:'50px',
      padding:'10px 22px', fontSize:f(13), fontWeight:'800',
      boxShadow:'0 8px 24px rgba(0,0,0,0.18)', zIndex:9999,
      whiteSpace:'nowrap', animation:'toastIn 0.25s cubic-bezier(0.22,1,0.36,1)',
      fontFamily:"-apple-system,'Segoe UI',sans-serif",
    }}>
      {msg}
    </div>
  )
}

// ── Grafici ────────────────────────────────────────────────────
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
      ctx.fillStyle = color; ctx.font = `bold ${Math.round(10*1.15)}px -apple-system`
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
  if (sorted.length === 0) return (
    <div style={{fontSize:f(12),color:'#bec1cc',textAlign:'center',padding:'12px 0'}}>
      Nessuna scadenza registrata
    </div>
  )
  return (
    <div>
      {sorted.map((m,i) => {
        const gg = getDaysToExpiry(m.scadenza)
        const color = colorScadenza(gg)
        const pct = Math.min(Math.max(gg,0)/365*100, 100)
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

// ── Bottom Sheet Form ──────────────────────────────────────────
function BottomSheetForm({ initial, onSave, onCancel, isNew }) {
  const [nome,     setNome]     = useState(initial?.nome     || '')
  const [ean,      setEan]      = useState(initial?.ean      || '')
  const [scatole,  setScatole]  = useState(initial?.scatole  ?? 1)
  const [lotto,    setLotto]    = useState(initial?.lotto    || '')
  const [scadenza, setScadenza] = useState(initial?.scadenza || '')
  const [note,     setNote]     = useState(initial?.note     || '')
  const [scanning, setScanning] = useState(false)
  const fileRef = useRef(null)
  const nomeRef = useRef(null)

  useEffect(() => {
    // Focus automatico sul nome
    setTimeout(() => nomeRef.current?.focus(), 100)
  }, [])

  function changeScatole(delta) {
    setScatole(prev => Math.max(0, (prev || 0) + delta))
  }

  function handleSave() {
    if (!nome.trim()) { nomeRef.current?.focus(); return }
    onSave({
      nome: nome.trim(), ean: ean.trim(),
      scatole: scatole || 0, lotto: lotto.trim(),
      scadenza: scadenza || '', note: note.trim()
    })
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
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            model:'claude-sonnet-4-20250514', max_tokens:300,
            messages:[{ role:'user', content:[
              { type:'image', source:{ type:'base64', media_type:file.type||'image/jpeg', data:b64.split(',')[1] } },
              { type:'text', text:'Leggi questa immagine di un medicinale. Rispondimi SOLO in JSON con: nome, ean, lotto, scadenza (YYYY-MM-DD o stringa vuota). Niente altro.' }
            ]}]
          })
        })
        const data = await resp.json()
        const txt = data.content?.[0]?.text || ''
        try {
          const parsed = JSON.parse(txt.replace(/```json|```/g,'').trim())
          if (parsed.nome)     setNome(parsed.nome)
          if (parsed.ean)      setEan(parsed.ean)
          if (parsed.lotto)    setLotto(parsed.lotto)
          if (parsed.scadenza) setScadenza(parsed.scadenza)
        } catch { alert('Non riuscito a leggere. Inserisci manualmente.') }
        setScanning(false)
      }
      reader.readAsDataURL(file)
    } catch { setScanning(false) }
    e.target.value = ''
  }

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:'11px',
    border:'1.5px solid #f0f1f4', fontSize:f(13), color:'#02153f',
    background:'#f3f4f7', fontFamily:'inherit', outline:'none',
    boxSizing:'border-box', marginBottom:'10px'
  }
  const labelStyle = {
    fontSize:f(10), fontWeight:'700', color:'#7c8088',
    textTransform:'uppercase', letterSpacing:'0.4px',
    marginBottom:'4px', display:'block'
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCancel}
        style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.22)',zIndex:200}}
      />
      {/* Sheet */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:'480px',
        background:'#feffff', borderRadius:'22px 22px 0 0',
        zIndex:201, maxHeight:'88vh', display:'flex', flexDirection:'column',
        boxShadow:'0 -8px 40px rgba(2,21,63,0.18)'
      }}>
        {/* Handle */}
        <div style={{padding:'10px 0 0', flexShrink:0}}>
          <div style={{width:'34px',height:'4px',borderRadius:'2px',background:'#dde0ed',margin:'0 auto'}}/>
        </div>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px 0',flexShrink:0}}>
          <div style={{fontSize:f(15),fontWeight:'800',color:'#02153f'}}>
            {isNew ? '➕ Nuovo medicinale' : `✏️ ${initial?.nome || 'Modifica'}`}
          </div>
          <button onClick={onCancel} style={{width:'30px',height:'30px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={15} color="#7c8088"/>
          </button>
        </div>

        {/* Contenuto scrollabile */}
        <div style={{overflowY:'auto',padding:'12px 16px',flex:1}}>

          {/* OCR */}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:'none'}}/>
          <button onClick={()=>fileRef.current?.click()} disabled={scanning} style={{
            width:'100%',padding:'10px',borderRadius:'11px',border:'1.5px dashed #2e84e9',
            background:'#EEF3FD',color:'#193f9e',fontWeight:'700',fontSize:f(12),
            cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
            gap:'8px',marginBottom:'12px',fontFamily:'inherit',opacity:scanning?0.6:1
          }}>
            <Camera size={15} color="#193f9e"/>
            {scanning ? 'Lettura in corso…' : 'Fotografa il medicinale (OCR)'}
          </button>

          {/* Nome */}
          <label style={labelStyle}>Nome *</label>
          <input
            ref={nomeRef}
            value={nome}
            onChange={e=>setNome(e.target.value)}
            placeholder="Es: Keppra 500mg"
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor='#2e84e9'}
            onBlur={e=>e.target.style.borderColor='#f0f1f4'}
          />

          {/* Stepper scatole */}
          <label style={labelStyle}>Scatole</label>
          <div style={{display:'flex',alignItems:'center',borderRadius:'11px',border:'1.5px solid #f0f1f4',background:'#f3f4f7',overflow:'hidden',marginBottom:'10px'}}>
            <button
              onClick={()=>changeScatole(-1)}
              disabled={scatole <= 0}
              style={{width:'52px',height:'44px',border:'none',background:'#feffff',cursor:scatole<=0?'default':'pointer',fontSize:'20px',fontWeight:'700',color:'#F7295A',flexShrink:0,opacity:scatole<=0?0.3:1}}
            >−</button>
            <div style={{flex:1,textAlign:'center',fontSize:f(17),fontWeight:'800',color:'#02153f'}}>{scatole}</div>
            <button
              onClick={()=>changeScatole(1)}
              style={{width:'52px',height:'44px',border:'none',background:'#feffff',cursor:'pointer',fontSize:'20px',fontWeight:'700',color:'#193f9e',flexShrink:0}}
            >+</button>
          </div>

          {/* Scadenza + Lotto */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            <div>
              <label style={labelStyle}>Scadenza <span style={{fontWeight:'400',textTransform:'none',letterSpacing:0,fontSize:f(9)}}>facoltativa</span></label>
              <input
                type="date" value={scadenza}
                onChange={e=>setScadenza(e.target.value)}
                min="2020-01-01" max="2040-12-31"
                style={{...inputStyle, WebkitAppearance:'none', appearance:'none'}}
                onFocus={e=>e.target.style.borderColor='#2e84e9'}
                onBlur={e=>e.target.style.borderColor='#f0f1f4'}
              />
            </div>
            <div>
              <label style={labelStyle}>Lotto</label>
              <input value={lotto} onChange={e=>setLotto(e.target.value)} placeholder="Es: ABC123" style={inputStyle}
                onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
            </div>
          </div>

          {/* EAN */}
          <label style={labelStyle}>Codice EAN</label>
          <input value={ean} onChange={e=>setEan(e.target.value)} placeholder="Es: 8001234567890" style={inputStyle}
            onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

          {/* Note */}
          <label style={labelStyle}>Note</label>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Es: Tenere in frigo" style={inputStyle}
            onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
        </div>

        {/* Tasto salva — sempre visibile */}
        <div style={{padding:'10px 16px 24px',flexShrink:0,borderTop:'1px solid #f0f1f4'}}>
          <button onClick={handleSave} style={{
            width:'100%',padding:'15px',borderRadius:'50px',border:'none',
            cursor:'pointer',fontWeight:'800',fontSize:f(14),color:'#fff',
            background: nome.trim() ? 'linear-gradient(135deg,#00BFA6,#193f9e)' : '#dde0ed',
            boxShadow: nome.trim() ? '0 6px 20px rgba(0,191,166,0.35)' : 'none',
            fontFamily:'inherit', transition:'all 0.2s'
          }}>
            <Check size={16} color="#fff" style={{marginRight:'6px'}}/> {isNew ? 'Aggiungi' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Scheda medicinale ──────────────────────────────────────────
function CardMedicinale({ m, onEdit, onDelete, onChangeScatole }) {
  const gg = getDaysToExpiry(m.scadenza)
  const esaurito = (m.scatole || 0) === 0
  const inScad   = m.scadenza && gg >= 0 && gg <= 30
  const scaduto  = m.scadenza && gg < 0

  let borderColor = '#f0f1f4'
  if (scaduto || esaurito) borderColor = '#F7295A'
  else if (inScad) borderColor = '#FFD93D'

  return (
    <div style={{padding:'12px',borderRadius:'14px',marginBottom:'8px',background:'#feffff',border:`1.5px solid ${borderColor}`,boxShadow:'0 2px 8px rgba(2,21,63,0.05)'}}>

      {/* Nome + azioni */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
        <div style={{fontSize:f(14),fontWeight:'800',color:'#02153f',flex:1,marginRight:'8px'}}>{m.nome}</div>
        <div style={{display:'flex',gap:'6px'}}>
          <button onClick={onEdit} style={{width:'30px',height:'30px',borderRadius:'50%',background:'#EEF3FD',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Pencil size={13} color="#193f9e"/>
          </button>
          <button onClick={onDelete} style={{width:'30px',height:'30px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Trash2 size={13} color="#F7295A"/>
          </button>
        </div>
      </div>

      {/* Stepper + badge scadenza */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px'}}>

        {/* Badge stato */}
        <div style={{display:'flex',flexDirection:'column',gap:'4px',flex:1}}>
          {m.scadenza ? (
            <span style={{fontSize:f(10),fontWeight:'700',padding:'3px 9px',borderRadius:'20px',display:'inline-block',
              background:scaduto?'#FEF0F4':inScad?'#FFF9E6':'#E8FBF8',
              color:scaduto?'#F7295A':inScad?'#FF8C42':'#00BFA6'}}>
              {scaduto ? '❌ Scaduto' : inScad ? `⚠️ ${gg}gg alla scad.` : `✓ Scad. ${Math.floor(gg/30)}m`}
            </span>
          ) : (
            <span style={{fontSize:f(10),fontWeight:'700',padding:'3px 9px',borderRadius:'20px',display:'inline-block',background:'#f3f4f7',color:'#bec1cc'}}>
              Scadenza n.d.
            </span>
          )}
          {esaurito && (
            <span style={{fontSize:f(10),fontWeight:'700',padding:'3px 9px',borderRadius:'20px',display:'inline-block',background:'#FEF0F4',color:'#F7295A'}}>
              ⚠️ Esaurito
            </span>
          )}
        </div>

        {/* Stepper −/+ */}
        <div style={{display:'flex',alignItems:'center',borderRadius:'22px',border:'1.5px solid #e8eaf0',overflow:'hidden',flexShrink:0}}>
          <button
            onClick={()=>onChangeScatole(m, -1)}
            disabled={esaurito}
            style={{width:'36px',height:'36px',border:'none',background:'#feffff',cursor:esaurito?'default':'pointer',fontSize:'18px',fontWeight:'700',color:'#F7295A',opacity:esaurito?0.3:1,display:'flex',alignItems:'center',justifyContent:'center'}}
          >−</button>
          <div style={{width:'36px',textAlign:'center',fontSize:f(14),fontWeight:'800',color:'#02153f',background:'#f3f4f7',lineHeight:'36px'}}>{m.scatole || 0}</div>
          <button
            onClick={()=>onChangeScatole(m, +1)}
            style={{width:'36px',height:'36px',border:'none',background:'#feffff',cursor:'pointer',fontSize:'18px',fontWeight:'700',color:'#193f9e',display:'flex',alignItems:'center',justifyContent:'center'}}
          >+</button>
        </div>
      </div>

      {/* Meta info */}
      {(m.lotto || m.ean || m.note) && (
        <div style={{marginTop:'8px',paddingTop:'8px',borderTop:'1px solid #f0f1f4',fontSize:f(10),color:'#bec1cc',lineHeight:'1.7'}}>
          {m.lotto && <span>Lotto: {m.lotto}&nbsp;&nbsp;</span>}
          {m.ean && <span>EAN: {m.ean}&nbsp;&nbsp;</span>}
          {m.note && <span style={{color:'#7c8088',fontStyle:'italic'}}>📝 {m.note}</span>}
        </div>
      )}
    </div>
  )
}

// ── COMPONENTE PRINCIPALE ──────────────────────────────────────
export default function MagazzinoPage({ onBack, isDemo }) {
  const [magazzino, setMagazzino] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [sezione,   setSezione]   = useState('lista')
  const [sheet,     setSheet]     = useState(null) // null | 'new' | item
  const [toast,     setToast]     = useState({ msg:'', color:'#00BFA6' })

  function showToast(msg, color='#00BFA6') {
    setToast({ msg, color })
    setTimeout(() => setToast({ msg:'', color:'#00BFA6' }), 2200)
  }

  useEffect(() => {
    if (isDemo) { setMagazzino(DEMO_MAGAZZINO); setLoading(false); return }
    const unsubscribe = onValue(ref(db,'magazzino'), snapshot => {
      const lista = processFirebaseSnap(snapshot)
        .sort((a,b) => getDaysToExpiry(a.scadenza) - getDaysToExpiry(b.scadenza))
      setMagazzino(lista)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [isDemo])

  function saveToFirebase(key, data) {
    if (isDemo) return
    const toSave = {...data}; delete toSave._firebaseKey
    set(ref(db, `magazzino/${key}`), encrypt(toSave))
  }

  function handleAdd(data) {
    const med = { id:Date.now(), ...data }
    if (!isDemo) push(ref(db,'magazzino'), encrypt(med))
    else setMagazzino(prev => [...prev, med])
    setSheet(null)
    showToast('✅ Medicinale aggiunto!')
  }

  function handleEdit(data) {
    const updated = { ...sheet, ...data }
    if (!isDemo && sheet._firebaseKey) saveToFirebase(sheet._firebaseKey, updated)
    else setMagazzino(prev => prev.map(m => m.id === sheet.id ? updated : m))
    setSheet(null)
    showToast('✅ Modificato!')
  }

  function handleDelete(item) {
    if (!window.confirm(`Eliminare ${item.nome}?`)) return
    if (!isDemo && item._firebaseKey) remove(ref(db, `magazzino/${item._firebaseKey}`))
    else setMagazzino(prev => prev.filter(m => m.id !== item.id))
    showToast('🗑️ Eliminato', '#7c8088')
  }

  function handleChangeScatole(item, delta) {
    const nuove = Math.max(0, (item.scatole || 0) + delta)
    const updated = { ...item, scatole: nuove }
    if (!isDemo && item._firebaseKey) saveToFirebase(item._firebaseKey, updated)
    else setMagazzino(prev => prev.map(m => m.id === item.id ? updated : m))
    if (nuove === 0)      showToast(`⚠️ ${item.nome} esaurito!`, '#F7295A')
    else if (nuove === 1) showToast(`⚠️ Ultima scatola di ${item.nome}`, '#FF8C42')
    else if (delta > 0)   showToast(`📦 ${item.nome}: ${nuove} scatole`)
    else                  showToast(`📦 ${item.nome}: ${nuove} scatole`)
  }

  const inScadenza = magazzino.filter(m => { const g = getDaysToExpiry(m.scadenza); return g >= 0 && g <= 30 })
  const esauriti   = magazzino.filter(m => (m.scatole || 0) === 0)

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'12px'}}>💊</div>
        <div style={{fontSize:f(14),color:'#7c8088'}}>Caricamento magazzino…</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .mag-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>

      <Toast msg={toast.msg} color={toast.color}/>

      {/* Bottom sheet */}
      {sheet && (
        <BottomSheetForm
          initial={sheet === 'new' ? null : sheet}
          isNew={sheet === 'new'}
          onSave={sheet === 'new' ? handleAdd : handleEdit}
          onCancel={() => setSheet(null)}
        />
      )}

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
                  {isDemo ? '🎭 Dati demo' : `${magazzino.length} medicinali`}
                </div>
              </div>
            </div>
            <button onClick={()=>setSheet('new')} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <Plus size={20} color="#fff"/>
            </button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
            {[
              {label:'Medicinali', val:magazzino.length, color:'#fff'},
              {label:'In scadenza', val:inScadenza.length, color:inScadenza.length>0?'#FFD93D':'#fff'},
              {label:'Esauriti', val:esauriti.length, color:esauriti.length>0?'#FFD93D':'#fff'},
            ].map(({label,val,color},i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:f(20),fontWeight:'900',color}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TAB */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#f3f4f7',margin:'12px 12px 0',borderRadius:'12px',padding:'3px',gap:'3px'}}>
          {[{k:'lista',l:'💊 Lista'},{k:'grafici',l:'📊 Grafici'}].map(({k,l}) => (
            <button key={k} onClick={()=>setSezione(k)} style={{padding:'9px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(12),fontFamily:'inherit',background:sezione===k?'#feffff':'transparent',color:sezione===k?'#00BFA6':'#7c8088',boxShadow:sezione===k?'0 2px 8px rgba(2,21,63,0.10)':'none',transition:'all 0.2s'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:'12px'}}>

          {/* ALERT */}
          {inScadenza.length > 0 && sezione === 'lista' && (
            <div style={{background:'#FFF9E6',borderRadius:'14px',padding:'12px 14px',marginBottom:'10px',border:'1.5px solid #FFD93D66',display:'flex',gap:'10px',alignItems:'flex-start'}}>
              <AlertTriangle size={18} color="#FF8C42" style={{flexShrink:0,marginTop:'1px'}}/>
              <div>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#8B6914',marginBottom:'2px'}}>Medicinali in scadenza</div>
                <div style={{fontSize:f(12),color:'#8B6914'}}>{inScadenza.map(m=>m.nome).join(', ')}</div>
              </div>
            </div>
          )}
          {esauriti.length > 0 && sezione === 'lista' && (
            <div style={{background:'#FEF0F4',borderRadius:'14px',padding:'12px 14px',marginBottom:'10px',border:'1.5px solid #F7295A33',display:'flex',gap:'10px',alignItems:'flex-start'}}>
              <AlertTriangle size={18} color="#F7295A" style={{flexShrink:0,marginTop:'1px'}}/>
              <div>
                <div style={{fontSize:f(13),fontWeight:'800',color:'#c41230',marginBottom:'2px'}}>Medicinali esauriti</div>
                <div style={{fontSize:f(12),color:'#c41230'}}>{esauriti.map(m=>m.nome).join(', ')} — Da riordinare</div>
              </div>
            </div>
          )}

          {/* LISTA */}
          {sezione === 'lista' && (
            <div style={{background:'#f3f4f7'}}>
              {magazzino.length === 0 ? (
                <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh}}>
                  <div style={{fontSize:'32px',marginBottom:'8px'}}>💊</div>
                  <div style={{fontSize:f(14),color:'#7c8088',marginBottom:'4px'}}>Nessun medicinale</div>
                  <div style={{fontSize:f(12),color:'#bec1cc'}}>Tocca + per aggiungere</div>
                </div>
              ) : (
                magazzino.map((m,i) => (
                  <CardMedicinale
                    key={m.id || i}
                    m={m}
                    onEdit={() => setSheet(m)}
                    onDelete={() => handleDelete(m)}
                    onChangeScatole={handleChangeScatole}
                  />
                ))
              )}
            </div>
          )}

          {/* GRAFICI */}
          {sezione === 'grafici' && (
            <>
              {magazzino.length === 0 ? (
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
                      {[{c:'#00BFA6',l:'OK (>30gg)'},{c:'#FF8C42',l:'Attenzione (≤30gg)'},{c:'#F7295A',l:'Urgente (≤7gg/Scaduto)'}].map(({c,l}) => (
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

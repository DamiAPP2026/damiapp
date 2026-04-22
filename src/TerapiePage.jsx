import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Check, Clock, Plus, Edit2, Trash2, X } from 'lucide-react'
import { db } from './firebase'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const DEMO_TERAPIE = [
  { id:1, nome:'Keppra 500mg',    quantita:'1 compressa', orario:'08:00', note:'Con colazione',    colore:'#F7295A' },
  { id:2, nome:'Depakine 250ml',  quantita:'5ml',         orario:'13:00', note:'Con pranzo',       colore:'#2e84e9' },
  { id:3, nome:'Keppra 500mg',    quantita:'1 compressa', orario:'20:00', note:'Con cena',         colore:'#00BFA6' },
  { id:4, nome:'Rivotril 0.5mg',  quantita:'½ compressa', orario:'22:00', note:'Prima di dormire', colore:'#7B5EA7' },
]

const COLORI = [
  '#F7295A','#00BFA6','#7B5EA7','#FF8C42',
  '#2e84e9','#FFD93D','#E040FB','#26C6DA',
]

const EMPTY_FORM = { nome:'', quantita:'', orario:'08:00', note:'', colore:'#F7295A' }

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

// ── Timeline stepper ──────────────────────────────────────────
function Timeline({ terapie, assunte, ora }) {
  return (
    <div style={{ overflowX:'auto', paddingBottom:'4px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', minWidth:'max-content', position:'relative', padding:'0 4px' }}>
        {/* linea connettore */}
        <div style={{ position:'absolute', top:'17px', left:'22px', right:'22px', height:'2px', background:'rgba(255,255,255,0.25)', zIndex:0 }}/>

        {terapie.map((t, idx) => {
          const key = t.id || t._firebaseKey || idx
          const assunta = !!assunte[key]
          const [h, m] = (t.orario || '00:00').split(':').map(Number)
          const minT = h * 60 + m
          const isProssima = !assunta && minT > ora &&
            terapie.every((x, xi) => {
              const xKey = x.id || x._firebaseKey || xi
              const [xh, xm] = (x.orario || '00:00').split(':').map(Number)
              return assunte[xKey] || x.id === t.id || xh * 60 + xm >= minT
            })

          return (
            <div key={key} style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'72px', position:'relative', zIndex:1 }}>
              {/* cerchio */}
              {assunta ? (
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#00BFA6', border:'3px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'5px' }}>
                  <Check size={13} color="#fff" strokeWidth={3}/>
                </div>
              ) : isProssima ? (
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.95)', border:'3px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'5px', boxShadow:'0 0 0 4px rgba(255,255,255,0.3)' }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'50%', background: t.colore || '#2e84e9' }}/>
                </div>
              ) : (
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'3px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'5px' }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'rgba(255,255,255,0.45)' }}/>
                </div>
              )}
              <div style={{ fontSize:'10px', fontWeight:'700', color: assunta ? 'rgba(255,255,255,0.75)' : isProssima ? '#fff' : 'rgba(255,255,255,0.65)', textAlign:'center' }}>
                {t.orario}
              </div>
              <div style={{ fontSize:'9px', color: assunta ? 'rgba(255,255,255,0.5)' : isProssima ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)', textAlign:'center', maxWidth:'66px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {t.nome.split(' ')[0]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Form bottom sheet ─────────────────────────────────────────
function FormSheet({ form, setForm, onSalva, onClose, editTarget, saved, isDemo }) {
  const nomeRef = useRef(null)
  const inStyle = { width:'100%', padding:'10px 12px', borderRadius:'12px', border:'1.5px solid #f0f1f4', fontSize:f(13), color:'#02153f', background:'#f3f4f7', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
  const lbStyle = { fontSize:f(11), fontWeight:'700', color:'#7c8088', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'5px', display:'block' }

  useEffect(() => {
    setTimeout(() => nomeRef.current?.focus(), 80)
  }, [])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(2,21,63,0.55)', zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ background:'#feffff', borderRadius:'24px 24px 0 0', padding:'20px', paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))', width:'100%', maxWidth:'480px', maxHeight:'90vh', overflowY:'auto' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <span style={{ fontSize:f(16), fontWeight:'900', color:'#02153f' }}>
            {editTarget ? 'Modifica terapia' : 'Nuova terapia'}
          </span>
          <button type="button" onClick={onClose} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#f3f4f7', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} color="#7c8088"/>
          </button>
        </div>

        {/* Nome */}
        <label style={lbStyle}>Nome farmaco *</label>
        <input
          ref={nomeRef}
          value={form.nome}
          onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
          placeholder="Es: Keppra 500mg"
          style={{ ...inStyle, marginBottom:'12px' }}
          onFocus={e => e.target.style.borderColor='#00BFA6'}
          onBlur={e => e.target.style.borderColor='#f0f1f4'}
        />

        {/* Orario + Quantità */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
          <div>
            <label style={lbStyle}>Orario *</label>
            <input
              type="time"
              value={form.orario}
              onChange={e => setForm(p => ({ ...p, orario: e.target.value }))}
              style={{ ...inStyle }}
              onFocus={e => e.target.style.borderColor='#00BFA6'}
              onBlur={e => e.target.style.borderColor='#f0f1f4'}
            />
          </div>
          <div>
            <label style={lbStyle}>Quantità</label>
            <input
              value={form.quantita}
              onChange={e => setForm(p => ({ ...p, quantita: e.target.value }))}
              placeholder="Es: 1 compressa"
              style={{ ...inStyle }}
              onFocus={e => e.target.style.borderColor='#00BFA6'}
              onBlur={e => e.target.style.borderColor='#f0f1f4'}
            />
          </div>
        </div>

        {/* Note */}
        <label style={lbStyle}>Note</label>
        <input
          value={form.note}
          onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          placeholder="Es: con colazione, a digiuno..."
          style={{ ...inStyle, marginBottom:'14px' }}
          onFocus={e => e.target.style.borderColor='#00BFA6'}
          onBlur={e => e.target.style.borderColor='#f0f1f4'}
        />

        {/* Colore */}
        <label style={lbStyle}>Colore</label>
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'nowrap' }}>
          {COLORI.map(c => (
            <div
              key={c}
              onClick={() => setForm(p => ({ ...p, colore: c }))}
              style={{
                width:'28px', height:'28px', borderRadius:'50%', background:c,
                cursor:'pointer', flexShrink:0,
                boxShadow: form.colore === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none',
                transition:'box-shadow 0.15s',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onSalva}
          style={{ width:'100%', padding:'15px', borderRadius:'50px', border:'none', cursor:'pointer', fontWeight:'800', fontSize:f(15), color:'#fff', background: saved ? 'linear-gradient(135deg,#00BFA6,#2e84e9)' : 'linear-gradient(135deg,#00BFA6,#2e84e9)', boxShadow:'0 6px 20px rgba(0,191,166,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'inherit', transition:'all 0.3s' }}
        >
          {saved ? <><Check size={18} color="#fff"/> Salvato!</> : <>{editTarget ? 'Aggiorna terapia' : 'Aggiungi terapia'}</>}
        </button>

        {isDemo && (
          <div style={{ textAlign:'center', marginTop:'10px', fontSize:f(11), color:'#8B6914', fontWeight:'600' }}>
            Demo — non salvato su Firebase
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
export default function TerapiePage({ onBack, isDemo }) {
  const [terapie,    setTerapie]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [assunte,    setAssunte]    = useState({})
  const [time,       setTime]       = useState(new Date())
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState({ ...EMPTY_FORM })
  const [editTarget, setEditTarget] = useState(null)
  const [saved,      setSaved]      = useState(false)

  // Orologio
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Caricamento
  useEffect(() => {
    if (isDemo) { setTerapie(DEMO_TERAPIE); setLoading(false); return }
    const u = onValue(ref(db, 'terapies'), snap => {
      setTerapie(
        processFirebaseSnap(snap).sort((a, b) => (a.orario || '').localeCompare(b.orario || ''))
      )
      setLoading(false)
    })
    return () => u()
  }, [isDemo])

  const timeStr = time.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })
  const ora = time.getHours() * 60 + time.getMinutes()

  const prossima = terapie
    .map(t => { const [h, m] = (t.orario || '00:00').split(':').map(Number); return { ...t, min: h * 60 + m } })
    .filter(t => {
      const key = t.id || t._firebaseKey
      return t.min > ora && !assunte[key]
    })
    .sort((a, b) => a.min - b.min)[0]

  function apriNuovo() {
    setForm({ ...EMPTY_FORM })
    setEditTarget(null)
    setSaved(false)
    setShowForm(true)
  }

  function apriModifica(t) {
    setForm({ nome: t.nome || '', quantita: t.quantita || '', orario: t.orario || '08:00', note: t.note || '', colore: t.colore || '#F7295A' })
    setEditTarget(t)
    setSaved(false)
    setShowForm(true)
  }

  function handleSalva() {
    if (!form.nome.trim()) { alert('Inserisci il nome del farmaco'); return }
    if (!form.orario)      { alert('Inserisci l\'orario'); return }
    const doc = { id: editTarget?.id || Date.now(), ...form, nome: form.nome.trim() }

    if (!isDemo) {
      if (editTarget?._firebaseKey) set(ref(db, `terapies/${editTarget._firebaseKey}`), encrypt(doc))
      else push(ref(db, 'terapies'), encrypt(doc))
    } else {
      if (editTarget) {
        setTerapie(prev => prev.map(t => t.id === editTarget.id ? { ...doc, _firebaseKey: t._firebaseKey } : t).sort((a, b) => (a.orario || '').localeCompare(b.orario || '')))
      } else {
        setTerapie(prev => [...prev, { ...doc, _firebaseKey: `demo_${Date.now()}` }].sort((a, b) => (a.orario || '').localeCompare(b.orario || '')))
      }
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowForm(false) }, 1200)
  }

  function handleElimina(t) {
    if (!window.confirm(`Eliminare "${t.nome}"?`)) return
    if (!isDemo && t._firebaseKey) remove(ref(db, `terapies/${t._firebaseKey}`))
    else setTerapie(prev => prev.filter(x => x.id !== t.id))
  }

  function toggleAssunta(key) {
    setAssunte(p => ({ ...p, [key]: !p[key] }))
  }

  const assunte_count = Object.values(assunte).filter(Boolean).length

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'32px', marginBottom:'12px' }}>💊</div>
        <div style={{ fontSize:'14px', color:'#7c8088' }}>Caricamento terapie...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.ter-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="ter-wrap">

        {/* FORM SHEET */}
        {showForm && (
          <FormSheet
            form={form}
            setForm={setForm}
            onSalva={handleSalva}
            onClose={() => setShowForm(false)}
            editTarget={editTarget}
            saved={saved}
            isDemo={isDemo}
          />
        )}

        {/* HEADER */}
        <div style={{ background:'linear-gradient(135deg,#00BFA6,#2e84e9)', padding:'14px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
            <button onClick={onBack} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:f(18), fontWeight:'900', color:'#fff' }}>💊 Terapie</div>
              <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.75)' }}>
                {isDemo ? '🎭 Dati demo' : `${terapie.length} terapie programmate`}
              </div>
            </div>
            <button onClick={apriNuovo} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <Plus size={20} color="#fff"/>
            </button>
          </div>

          {/* Ora + prossima */}
          <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:'16px', padding:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <div>
              <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.7)', marginBottom:'2px' }}>Ora attuale</div>
              <div style={{ fontSize:f(28), fontWeight:'900', color:'#fff', fontVariantNumeric:'tabular-nums', letterSpacing:'-1px' }}>{timeStr}</div>
            </div>
            {prossima && (
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.7)', marginBottom:'2px' }}>Prossima</div>
                <div style={{ fontSize:f(16), fontWeight:'800', color:'#fff' }}>{prossima.orario}</div>
                <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.85)' }}>{prossima.nome}</div>
              </div>
            )}
          </div>

          {/* TIMELINE STEPPER */}
          {terapie.length > 0 && (
            <Timeline terapie={terapie} assunte={assunte} ora={ora}/>
          )}
        </div>

        {/* LISTA */}
        <div style={{ padding:'12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <span style={{ fontSize:f(14), fontWeight:'800', color:'#02153f' }}>📋 Terapie di oggi</span>
            <span style={{ fontSize:f(11), color:'#bec1cc' }}>{assunte_count}/{terapie.length} assunte</span>
          </div>

          {terapie.length === 0 ? (
            <div style={{ background:'#feffff', borderRadius:'18px', padding:'32px', textAlign:'center', boxShadow:sh }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>💊</div>
              <div style={{ fontSize:f(14), color:'#7c8088', marginBottom:'8px' }}>Nessuna terapia registrata</div>
              <button type="button" onClick={apriNuovo} style={{ padding:'10px 24px', borderRadius:'50px', border:'none', cursor:'pointer', background:'linear-gradient(135deg,#00BFA6,#2e84e9)', color:'#fff', fontWeight:'800', fontSize:f(13), fontFamily:'inherit' }}>
                + Aggiungi terapia
              </button>
            </div>
          ) : (
            terapie.map((t, idx) => {
              const key = t.id || t._firebaseKey || idx
              const assunta = !!assunte[key]
              const color = t.colore || COLORI[idx % COLORI.length]
              const [h, m] = (t.orario || '00:00').split(':').map(Number)
              const passata = h * 60 + m < ora

              return (
                <div key={key} style={{ background:'#feffff', borderRadius:'16px', padding:'14px', marginBottom:'8px', boxShadow:sh, display:'flex', alignItems:'center', gap:'12px', opacity: assunta ? 0.6 : 1, transition:'opacity 0.2s', border: passata && !assunta ? '1.5px solid #F7295A33' : '1.5px solid transparent' }}>

                  {/* Icona colore */}
                  <div style={{ width:'44px', height:'44px', borderRadius:'14px', background: assunta ? '#f3f4f7' : `${color}20`, border:`2px solid ${assunta ? '#f0f1f4' : color}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'20px' }}>
                    💊
                  </div>

                  {/* Info */}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:f(14), fontWeight:'800', color: assunta ? '#bec1cc' : '#02153f', textDecoration: assunta ? 'line-through' : 'none', marginBottom:'2px' }}>{t.nome}</div>
                    <div style={{ fontSize:f(12), color:'#7c8088' }}>{t.quantita}{t.note ? ` · ${t.note}` : ''}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                      <Clock size={11} color={passata && !assunta ? '#F7295A' : '#bec1cc'}/>
                      <span style={{ fontSize:f(11), fontWeight:'700', color: assunta ? '#bec1cc' : passata ? '#F7295A' : '#193f9e' }}>
                        {t.orario}{passata && !assunta ? ' — In ritardo!' : ''}{assunta ? ' — Assunta ✓' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Azioni */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px', flexShrink:0 }}>
                    {/* Spunta */}
                    <button type="button" onClick={() => toggleAssunta(key)} style={{ width:'30px', height:'30px', borderRadius:'50%', border:'none', cursor:'pointer', background: assunta ? 'linear-gradient(135deg,#00BFA6,#2e84e9)' : '#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: assunta ? '0 3px 10px rgba(0,191,166,0.3)' : 'none', transition:'all 0.2s' }}>
                      <Check size={14} color={assunta ? '#fff' : '#bec1cc'}/>
                    </button>
                    {/* Modifica */}
                    <button type="button" onClick={() => apriModifica(t)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#EEF3FD', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Edit2 size={13} color="#2e84e9"/>
                    </button>
                    {/* Elimina */}
                    <button type="button" onClick={() => handleElimina(t)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#FEF0F4', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Trash2 size={13} color="#F7295A"/>
                    </button>
                  </div>
                </div>
              )
            })
          )}

          {/* Barra progresso */}
          {terapie.length > 0 && (
            <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', marginTop:'10px', boxShadow:sh }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <span style={{ fontSize:f(13), fontWeight:'800', color:'#02153f' }}>📊 Progresso oggi</span>
                <span style={{ fontSize:f(11), color:'#7c8088' }}>{assunte_count} di {terapie.length}</span>
              </div>
              <div style={{ height:'8px', borderRadius:'4px', background:'#f3f4f7', overflow:'hidden', marginBottom:'6px' }}>
                <div style={{ height:'100%', borderRadius:'4px', width:`${terapie.length > 0 ? (assunte_count / terapie.length) * 100 : 0}%`, background:'linear-gradient(90deg,#00BFA6,#2e84e9)', transition:'width 0.4s' }}/>
              </div>
              <div style={{ fontSize:f(11), color:'#7c8088', textAlign:'right' }}>
                {terapie.length - assunte_count > 0
                  ? `${terapie.length - assunte_count} ancora da assumere`
                  : '✅ Tutte le terapie assunte!'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

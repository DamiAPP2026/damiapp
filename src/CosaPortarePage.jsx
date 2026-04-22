import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Plus, Trash2, Check, Edit2, Save, X } from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'
const f    = (base) => `${Math.round(base * 1.15)}px`

const DEMO_LISTE = [
  {
    id:1, name:'Visita neurologo',
    items:[
      {id:11, text:'Diario crisi stampato', completed:false},
      {id:12, text:'Lista farmaci',         completed:false},
      {id:13, text:'Tessera sanitaria',     completed:false},
      {id:14, text:'Ultima EEG',            completed:false},
    ]
  },
  {
    id:2, name:'Gita scolastica',
    items:[
      {id:21, text:'Farmaci di soccorso',  completed:false},
      {id:22, text:'Numero medico',        completed:false},
      {id:23, text:'Piano di emergenza',   completed:false},
    ]
  },
]

// ── stile input condiviso ─────────────────────────────────────
const inStyle = {
  width:'100%', padding:'11px 12px', borderRadius:'12px',
  border:'1.5px solid #f0f1f4', fontSize:f(13), color:'#02153f',
  background:'#f3f4f7', fontFamily:'inherit', outline:'none', boxSizing:'border-box',
}
const lbStyle = {
  fontSize:f(11), fontWeight:'700', color:'#7c8088',
  textTransform:'uppercase', letterSpacing:'0.4px',
  marginBottom:'5px', display:'block',
}

// ════════════════════════════════════════════════════════════
export default function CosaPortarePage({ onBack, isDemo }) {
  const [liste,         setListe]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [view,          setView]          = useState('list') // 'list' | 'new' | 'edit' | 'use'
  const [listaCorrente, setListaCorrente] = useState({ name:'', items:[] })
  const [listaInUso,    setListaInUso]    = useState(null)
  const [nuovoItem,     setNuovoItem]     = useState('')
  const [saved,         setSaved]         = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingText,   setEditingText]   = useState('')
  const nomeRef  = useRef(null)
  const nuovoRef = useRef(null)

  useEffect(() => {
    if (isDemo) { setListe(DEMO_LISTE); setLoading(false); return }
    const r = ref(db, 'todolists')
    const unsub = onValue(r, snap => {
      setListe(processFirebaseSnap(snap))
      setLoading(false)
    })
    return () => unsub()
  }, [isDemo])

  // ── focus automatico nome quando si apre il form ──────────
  useEffect(() => {
    if (view === 'new' || view === 'edit') {
      setTimeout(() => nomeRef.current?.focus(), 80)
    }
  }, [view])

  // ── salva nuova lista ─────────────────────────────────────
  function salvaNuovaLista() {
    if (!listaCorrente.name.trim())        { alert('Dai un nome alla lista!'); return }
    if (listaCorrente.items.length === 0)  { alert('Aggiungi almeno un elemento!'); return }
    const lista = { ...listaCorrente, id: Date.now() }
    if (!isDemo) push(ref(db, 'todolists'), encrypt(lista))
    else setListe(prev => [...prev, lista])
    setListaCorrente({ name:'', items:[] })
    setSaved(true)
    setTimeout(() => { setSaved(false); setView('list') }, 1200)
  }

  // ── salva modifica lista esistente ────────────────────────
  function salvaModificaLista() {
    if (!listaCorrente.name.trim())       { alert('Dai un nome alla lista!'); return }
    if (listaCorrente.items.length === 0) { alert('Aggiungi almeno un elemento!'); return }
    const updated = { ...listaCorrente }
    if (!isDemo && listaCorrente._firebaseKey) {
      set(ref(db, `todolists/${listaCorrente._firebaseKey}`), encrypt(updated))
    } else {
      setListe(prev => prev.map(l => l.id === updated.id ? updated : l))
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setView('list') }, 1200)
  }

  function eliminaLista(lista) {
    if (!window.confirm(`Eliminare "${lista.name}"?`)) return
    if (!isDemo && lista._firebaseKey) remove(ref(db, `todolists/${lista._firebaseKey}`))
    else setListe(prev => prev.filter(l => l.id !== lista.id))
  }

  function apriModifica(lista) {
    setListaCorrente({ ...lista, items: lista.items.map(i => ({ ...i })) })
    setEditingItemId(null)
    setNuovoItem('')
    setSaved(false)
    setView('edit')
  }

  // ── gestione item nel form (nuovo o modifica) ─────────────
  function aggiungiItem() {
    if (!nuovoItem.trim()) return
    setListaCorrente(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), text: nuovoItem.trim(), completed: false }]
    }))
    setNuovoItem('')
    setTimeout(() => nuovoRef.current?.focus(), 50)
  }

  function rimuoviItem(id) {
    setListaCorrente(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
    if (editingItemId === id) setEditingItemId(null)
  }

  function avviaEditItem(item) {
    setEditingItemId(item.id)
    setEditingText(item.text)
  }

  function confermaEditItem(id) {
    if (!editingText.trim()) return
    setListaCorrente(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, text: editingText.trim() } : i)
    }))
    setEditingItemId(null)
  }

  // ── usa lista (modalità spunta) ───────────────────────────
  function caricaLista(lista) {
    setListaInUso({ ...lista, items: lista.items.map(i => ({ ...i, completed: false })) })
    setView('use')
  }

  function toggleItem(itemId) {
    setListaInUso(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i)
    }))
  }

  // ── titolo header dinamico ────────────────────────────────
  function titoloHeader() {
    if (view === 'list') return `${liste.length} liste salvate`
    if (view === 'new')  return 'Nuova lista'
    if (view === 'edit') return `Modifica — ${listaCorrente.name || '...'}`
    if (view === 'use')  return listaInUso?.name || ''
    return ''
  }

  function handleBack() {
    if (view === 'list') onBack()
    else { setView('list'); setEditingItemId(null) }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'32px', marginBottom:'12px' }}>🎒</div>
        <div style={{ fontSize:'14px', color:'#7c8088' }}>Caricamento...</div>
      </div>
    </div>
  )

  // ── padding bottom sheet — SEMPRE sopra navbar ────────────
  const sheetPadding = 'calc(80px + env(safe-area-inset-bottom, 0px))'

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}
        .cp-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="cp-wrap">

        {/* HEADER */}
        <div style={{ background:'linear-gradient(135deg,#FF8C42,#FFD93D)', padding:'14px 16px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <button onClick={handleBack} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:f(18), fontWeight:'900', color:'#fff' }}>🎒 Cosa Portare</div>
              <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.85)' }}>{titoloHeader()}</div>
            </div>
            {view === 'list' && (
              <button onClick={() => { setListaCorrente({ name:'', items:[] }); setNuovoItem(''); setSaved(false); setView('new') }}
                style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Plus size={20} color="#fff"/>
              </button>
            )}
          </div>
        </div>

        <div style={{ padding:'12px' }}>

          {/* ════ VISTA LISTA ════ */}
          {view === 'list' && (
            <>
              {liste.length === 0 ? (
                <div style={{ background:'#feffff', borderRadius:'18px', padding:'32px', textAlign:'center', boxShadow:sh }}>
                  <div style={{ fontSize:'40px', marginBottom:'12px' }}>🎒</div>
                  <div style={{ fontSize:f(14), color:'#7c8088', marginBottom:'4px' }}>Nessuna lista</div>
                  <div style={{ fontSize:f(12), color:'#bec1cc', marginBottom:'16px' }}>Crea la tua prima lista</div>
                  <button onClick={() => { setListaCorrente({ name:'', items:[] }); setNuovoItem(''); setView('new') }}
                    style={{ padding:'10px 24px', borderRadius:'50px', border:'none', cursor:'pointer', background:'linear-gradient(135deg,#FF8C42,#FFD93D)', color:'#fff', fontWeight:'800', fontSize:f(13), fontFamily:'inherit' }}>
                    + Crea lista
                  </button>
                </div>
              ) : (
                liste.map((lista, i) => (
                  <div key={lista.id || i} style={{ background:'#feffff', borderRadius:'16px', padding:'14px', marginBottom:'8px', boxShadow:shSm }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#FF8C42,#FFD93D)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'20px' }}>🎒</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:f(14), fontWeight:'800', color:'#02153f' }}>{lista.name}</div>
                        <div style={{ fontSize:f(11), color:'#7c8088', marginTop:'1px' }}>{lista.items?.length || 0} elementi</div>
                      </div>
                      {/* Modifica + Elimina */}
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={() => apriModifica(lista)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#EEF3FD', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Edit2 size={13} color="#2e84e9"/>
                        </button>
                        <button onClick={() => eliminaLista(lista)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#FEF0F4', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Trash2 size={13} color="#F7295A"/>
                        </button>
                      </div>
                    </div>

                    {/* Anteprima items */}
                    <div style={{ marginBottom:'10px' }}>
                      {lista.items?.slice(0, 3).map((item, j) => (
                        <div key={item.id || j} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0', fontSize:f(12), color:'#394058' }}>
                          <div style={{ width:'14px', height:'14px', borderRadius:'4px', border:'1.5px solid #dde0ed', flexShrink:0 }}/>
                          {item.text}
                        </div>
                      ))}
                      {(lista.items?.length || 0) > 3 && (
                        <div style={{ fontSize:f(11), color:'#bec1cc', marginTop:'2px' }}>+{lista.items.length - 3} altri...</div>
                      )}
                    </div>

                    <button onClick={() => caricaLista(lista)} style={{ width:'100%', padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:'700', fontSize:f(12), background:'linear-gradient(135deg,#FF8C42,#FFD93D)', color:'#fff', boxShadow:'0 3px 10px rgba(255,140,66,0.3)', fontFamily:'inherit' }}>
                      Usa questa lista →
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* ════ FORM CONDIVISO: nuova lista / modifica ════ */}
          {(view === 'new' || view === 'edit') && (
            <div style={{ background:'#feffff', borderRadius:'18px', padding:'16px', paddingBottom: sheetPadding, boxShadow:sh }}>

              {/* Nome lista */}
              <label style={lbStyle}>Nome della lista *</label>
              <input
                ref={nomeRef}
                value={listaCorrente.name}
                onChange={e => setListaCorrente(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Es: Visita neurologo, Gita..."
                style={{ ...inStyle, marginBottom:'16px' }}
                onFocus={e => e.target.style.borderColor='#FF8C42'}
                onBlur={e => e.target.style.borderColor='#f0f1f4'}
              />

              {/* Elementi */}
              <label style={lbStyle}>Elementi ({listaCorrente.items.length})</label>

              {listaCorrente.items.map((item) => (
                <div key={item.id}>
                  {editingItemId === item.id ? (
                    /* Item in modifica inline */
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'10px', background:'#EEF3FD', marginBottom:'6px', border:'1.5px solid #2e84e9' }}>
                      <div style={{ width:'16px', height:'16px', borderRadius:'5px', border:'1.5px solid #2e84e9', flexShrink:0 }}/>
                      <input
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confermaEditItem(item.id); if (e.key === 'Escape') setEditingItemId(null) }}
                        autoFocus
                        style={{ flex:1, fontSize:f(13), color:'#02153f', background:'transparent', border:'none', outline:'none', fontFamily:'inherit' }}
                      />
                      {/* Conferma edit */}
                      <button type="button" onClick={() => confermaEditItem(item.id)} style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#00BFA620', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Check size={12} color="#00BFA6" strokeWidth={3}/>
                      </button>
                      {/* Annulla edit */}
                      <button type="button" onClick={() => setEditingItemId(null)} style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#f3f4f7', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <X size={12} color="#bec1cc"/>
                      </button>
                    </div>
                  ) : (
                    /* Item normale */
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'10px', background:'#f3f4f7', marginBottom:'6px' }}>
                      <div style={{ width:'16px', height:'16px', borderRadius:'5px', border:'1.5px solid #dde0ed', flexShrink:0 }}/>
                      <span style={{ flex:1, fontSize:f(13), color:'#02153f' }}>{item.text}</span>
                      {/* Matita item */}
                      <button type="button" onClick={() => avviaEditItem(item)} style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#EEF3FD', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Edit2 size={11} color="#2e84e9"/>
                      </button>
                      {/* Rimuovi item */}
                      <button type="button" onClick={() => rimuoviItem(item.id)} style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#FEF0F4', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <X size={12} color="#F7295A"/>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Aggiungi elemento */}
              <div style={{ display:'flex', gap:'8px', marginTop:'8px', marginBottom:'16px' }}>
                <input
                  ref={nuovoRef}
                  value={nuovoItem}
                  onChange={e => setNuovoItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && aggiungiItem()}
                  placeholder="Aggiungi elemento..."
                  style={{ ...inStyle, flex:1 }}
                  onFocus={e => e.target.style.borderColor='#FF8C42'}
                  onBlur={e => e.target.style.borderColor='#f0f1f4'}
                />
                <button type="button" onClick={aggiungiItem} style={{ width:'44px', height:'44px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#FF8C42,#FFD93D)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 3px 10px rgba(255,140,66,0.3)', flexShrink:0 }}>
                  <Plus size={20} color="#fff"/>
                </button>
              </div>

              {/* SALVA — padding bottom gestito dal container, mai sotto navbar */}
              <button
                type="button"
                onClick={view === 'new' ? salvaNuovaLista : salvaModificaLista}
                style={{ width:'100%', padding:'15px', borderRadius:'50px', border:'none', cursor:'pointer', fontWeight:'800', fontSize:f(15), color:'#fff', background: saved ? 'linear-gradient(135deg,#00BFA6,#2e84e9)' : 'linear-gradient(135deg,#FF8C42,#FFD93D)', boxShadow:'0 6px 20px rgba(255,140,66,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.3s', fontFamily:'inherit' }}
              >
                {saved
                  ? <><Check size={18} color="#fff"/> Salvato!</>
                  : view === 'new'
                    ? <><Save size={16} color="#fff"/> Salva lista</>
                    : <><Save size={16} color="#fff"/> Salva modifiche</>
                }
              </button>

              {isDemo && (
                <div style={{ textAlign:'center', marginTop:'10px', fontSize:f(11), color:'#8B6914', fontWeight:'600' }}>
                  Demo — non salvato su Firebase
                </div>
              )}
            </div>
          )}

          {/* ════ VISTA USA LISTA ════ */}
          {view === 'use' && listaInUso && (
            <>
              {/* Progresso */}
              <div style={{ background:'#feffff', borderRadius:'16px', padding:'14px', marginBottom:'10px', boxShadow:sh }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                  <span style={{ fontSize:f(13), fontWeight:'800', color:'#02153f' }}>Progresso</span>
                  <span style={{ fontSize:f(13), fontWeight:'800', color:'#FF8C42' }}>
                    {listaInUso.items.filter(i => i.completed).length}/{listaInUso.items.length}
                  </span>
                </div>
                <div style={{ height:'8px', borderRadius:'4px', background:'#f3f4f7', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:'4px', width:`${(listaInUso.items.filter(i => i.completed).length / listaInUso.items.length) * 100}%`, background:'linear-gradient(90deg,#FF8C42,#FFD93D)', transition:'width 0.3s' }}/>
                </div>
              </div>

              {/* Items spuntabili */}
              <div style={{ background:'#feffff', borderRadius:'18px', padding:'14px', boxShadow:sh }}>
                {listaInUso.items.map((item) => (
                  <div key={item.id} onClick={() => toggleItem(item.id)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 10px', borderRadius:'12px', cursor:'pointer', marginBottom:'4px', background: item.completed ? '#F5FDF8' : 'transparent', transition:'background 0.15s' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'7px', border:`2px solid ${item.completed ? '#00BFA6' : '#dde0ed'}`, background: item.completed ? '#00BFA6' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                      {item.completed && <Check size={13} color="#fff" strokeWidth={3}/>}
                    </div>
                    <span style={{ fontSize:f(13), fontWeight:'600', color: item.completed ? '#7c8088' : '#02153f', textDecoration: item.completed ? 'line-through' : 'none', flex:1, transition:'all 0.15s' }}>
                      {item.text}
                    </span>
                  </div>
                ))}

                {listaInUso.items.every(i => i.completed) && (
                  <div style={{ textAlign:'center', padding:'16px', marginTop:'8px', background:'#E8FBF8', borderRadius:'12px' }}>
                    <div style={{ fontSize:'24px', marginBottom:'6px' }}>✅</div>
                    <div style={{ fontSize:f(14), fontWeight:'800', color:'#00BFA6' }}>Tutto pronto!</div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}

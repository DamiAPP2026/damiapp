import { useState, useEffect } from 'react'
import { ChevronLeft, Plus, Trash2, Check, Edit2, Save, X } from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const DEMO_LISTE = [
  {
    id:1, name:'Visita neurologo',
    items:[
      {id:11, text:'Diario crisi stampato', completed:false},
      {id:12, text:'Lista farmaci', completed:false},
      {id:13, text:'Tessera sanitaria', completed:false},
      {id:14, text:'Ultima EEG', completed:false},
    ]
  },
  {
    id:2, name:'Gita scolastica',
    items:[
      {id:21, text:'Farmaci di soccorso', completed:false},
      {id:22, text:'Numero medico', completed:false},
      {id:23, text:'Piano di emergenza', completed:false},
    ]
  },
]

export default function CosaPortarePage({ onBack, isDemo }) {
  const [liste, setListe] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'edit' | 'use'
  const [listaCorrente, setListaCorrente] = useState({name:'', items:[]})
  const [listaInUso, setListaInUso] = useState(null)
  const [nuovoItem, setNuovoItem] = useState('')

  useEffect(() => {
    if (isDemo) { setListe(DEMO_LISTE); setLoading(false); return }
    const ref_ = ref(db, 'todolists')
    const unsub = onValue(ref_, snap => {
      setListe(processFirebaseSnap(snap))
      setLoading(false)
    })
    return () => unsub()
  }, [isDemo])

  function salvaLista() {
    if (!listaCorrente.name.trim()) { alert('Dai un nome alla lista!'); return }
    if (listaCorrente.items.length === 0) { alert('Aggiungi almeno un elemento!'); return }
    const lista = {...listaCorrente, id: Date.now()}
    if (!isDemo) push(ref(db, 'todolists'), encrypt(lista))
    else setListe(prev => [...prev, lista])
    setListaCorrente({name:'', items:[]})
    setView('list')
  }

  function eliminaLista(lista) {
    if (!window.confirm(`Eliminare "${lista.name}"?`)) return
    if (!isDemo && lista._firebaseKey) remove(ref(db, `todolists/${lista._firebaseKey}`))
    else setListe(prev => prev.filter(l => l.id !== lista.id))
  }

  function aggiungiItem() {
    if (!nuovoItem.trim()) return
    setListaCorrente(prev => ({
      ...prev,
      items: [...prev.items, {id:Date.now(), text:nuovoItem.trim(), completed:false}]
    }))
    setNuovoItem('')
  }

  function rimuoviItem(id) {
    setListaCorrente(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }))
  }

  function toggleItem(lista, itemId) {
    setListaInUso(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === itemId ? {...i, completed:!i.completed} : i)
    }))
  }

  function caricaLista(lista) {
    setListaInUso({...lista, items: lista.items.map(i => ({...i, completed:false}))})
    setView('use')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'12px'}}>🎒</div>
        <div style={{fontSize:'14px',color:'#7c8088'}}>Caricamento...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}
        .cp-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="cp-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#FF8C42,#FFD93D)',padding:'14px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <button onClick={view==='list' ? onBack : () => setView('list')} style={{
              width:'36px',height:'36px',borderRadius:'50%',
              background:'rgba(255,255,255,0.2)',border:'none',
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'
            }}><ChevronLeft size={20} color="#fff"/></button>
            <div>
              <div style={{fontSize:'18px',fontWeight:'900',color:'#fff'}}>🎒 Cosa Portare</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.85)'}}>
                {view==='list' ? `${liste.length} liste salvate` :
                 view==='edit' ? 'Nuova lista' : listaInUso?.name}
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* ── VISTA LISTA ── */}
          {view === 'list' && (
            <>
              <button onClick={() => { setListaCorrente({name:'',items:[]}); setView('edit') }} style={{
                width:'100%',padding:'14px',borderRadius:'14px',border:'none',
                cursor:'pointer',fontWeight:'800',fontSize:'14px',color:'#fff',
                background:'linear-gradient(135deg,#FF8C42,#FFD93D)',
                boxShadow:'0 6px 20px rgba(255,140,66,0.35)',
                display:'flex',alignItems:'center',justifyContent:'center',
                gap:'8px',marginBottom:'14px'
              }}>
                <Plus size={18} color="#fff"/> Crea nuova lista
              </button>

              {liste.length === 0 ? (
                <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh}}>
                  <div style={{fontSize:'40px',marginBottom:'12px'}}>🎒</div>
                  <div style={{fontSize:'14px',color:'#7c8088',marginBottom:'4px'}}>Nessuna lista</div>
                  <div style={{fontSize:'12px',color:'#bec1cc'}}>Crea la tua prima lista</div>
                </div>
              ) : (
                liste.map((lista, i) => (
                  <div key={lista.id||i} style={{
                    background:'#feffff',borderRadius:'16px',padding:'14px',
                    marginBottom:'8px',boxShadow:shSm
                  }}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                      <div style={{
                        width:'40px',height:'40px',borderRadius:'12px',
                        background:'linear-gradient(135deg,#FF8C42,#FFD93D)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        flexShrink:0,fontSize:'20px'
                      }}>🎒</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'14px',fontWeight:'800',color:'#02153f'}}>{lista.name}</div>
                        <div style={{fontSize:'11px',color:'#7c8088',marginTop:'1px'}}>
                          {lista.items?.length||0} elementi
                        </div>
                      </div>
                      <button onClick={() => eliminaLista(lista)} style={{
                        width:'30px',height:'30px',borderRadius:'50%',
                        background:'#FEF0F4',border:'none',cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center'
                      }}>
                        <Trash2 size={13} color="#F7295A"/>
                      </button>
                    </div>

                    {/* Anteprima items */}
                    <div style={{marginBottom:'10px'}}>
                      {lista.items?.slice(0,3).map((item,j) => (
                        <div key={item.id||j} style={{
                          display:'flex',alignItems:'center',gap:'8px',
                          padding:'4px 0',fontSize:'12px',color:'#394058'
                        }}>
                          <div style={{
                            width:'14px',height:'14px',borderRadius:'4px',
                            border:'1.5px solid #dde0ed',flexShrink:0
                          }}/>
                          {item.text}
                        </div>
                      ))}
                      {(lista.items?.length||0) > 3 && (
                        <div style={{fontSize:'11px',color:'#bec1cc',marginTop:'2px'}}>
                          +{lista.items.length-3} altri...
                        </div>
                      )}
                    </div>

                    <button onClick={() => caricaLista(lista)} style={{
                      width:'100%',padding:'10px',borderRadius:'10px',border:'none',
                      cursor:'pointer',fontWeight:'700',fontSize:'12px',
                      background:'linear-gradient(135deg,#FF8C42,#FFD93D)',
                      color:'#fff',boxShadow:'0 3px 10px rgba(255,140,66,0.3)'
                    }}>
                      Usa questa lista →
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── VISTA CREA ── */}
          {view === 'edit' && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',boxShadow:sh}}>
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
                📋 Nome della lista
              </div>
              <input
                value={listaCorrente.name}
                onChange={e => setListaCorrente(prev => ({...prev, name:e.target.value}))}
                placeholder="Es: Visita neurologo, Gita..."
                style={{
                  width:'100%',padding:'12px',borderRadius:'12px',
                  border:'1.5px solid #f0f1f4',fontSize:'14px',color:'#02153f',
                  background:'#f3f4f7',fontFamily:'inherit',outline:'none',
                  boxSizing:'border-box',marginBottom:'16px'
                }}
                onFocus={e => e.target.style.borderColor='#FF8C42'}
                onBlur={e => e.target.style.borderColor='#f0f1f4'}
              />

              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'10px'}}>
                📝 Elementi ({listaCorrente.items.length})
              </div>

              {listaCorrente.items.map((item,i) => (
                <div key={item.id} style={{
                  display:'flex',alignItems:'center',gap:'8px',
                  padding:'8px 10px',borderRadius:'10px',
                  background:'#f3f4f7',marginBottom:'6px'
                }}>
                  <div style={{
                    width:'16px',height:'16px',borderRadius:'5px',
                    border:'1.5px solid #dde0ed',flexShrink:0
                  }}/>
                  <span style={{flex:1,fontSize:'13px',color:'#02153f'}}>{item.text}</span>
                  <button onClick={() => rimuoviItem(item.id)} style={{
                    width:'24px',height:'24px',borderRadius:'50%',
                    background:'#FEF0F4',border:'none',cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center'
                  }}>
                    <X size={12} color="#F7295A"/>
                  </button>
                </div>
              ))}

              {/* Aggiungi item */}
              <div style={{display:'flex',gap:'8px',marginTop:'8px',marginBottom:'16px'}}>
                <input
                  value={nuovoItem}
                  onChange={e => setNuovoItem(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && aggiungiItem()}
                  placeholder="Aggiungi elemento..."
                  style={{
                    flex:1,padding:'11px 12px',borderRadius:'12px',
                    border:'1.5px solid #f0f1f4',fontSize:'13px',color:'#02153f',
                    background:'#f3f4f7',fontFamily:'inherit',outline:'none'
                  }}
                  onFocus={e => e.target.style.borderColor='#FF8C42'}
                  onBlur={e => e.target.style.borderColor='#f0f1f4'}
                />
                <button onClick={aggiungiItem} style={{
                  width:'44px',height:'44px',borderRadius:'12px',border:'none',
                  background:'linear-gradient(135deg,#FF8C42,#FFD93D)',
                  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
                  boxShadow:'0 3px 10px rgba(255,140,66,0.3)'
                }}>
                  <Plus size={20} color="#fff"/>
                </button>
              </div>

              <button onClick={salvaLista} style={{
                width:'100%',padding:'14px',borderRadius:'50px',border:'none',
                cursor:'pointer',fontWeight:'800',fontSize:'14px',color:'#fff',
                background:'linear-gradient(135deg,#FF8C42,#FFD93D)',
                boxShadow:'0 6px 20px rgba(255,140,66,0.35)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'
              }}>
                <Save size={16} color="#fff"/> Salva lista
              </button>
            </div>
          )}

          {/* ── VISTA USA LISTA ── */}
          {view === 'use' && listaInUso && (
            <>
              {/* Progress */}
              <div style={{background:'#feffff',borderRadius:'16px',padding:'14px',marginBottom:'10px',boxShadow:sh}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <span style={{fontSize:'13px',fontWeight:'800',color:'#02153f'}}>Progresso</span>
                  <span style={{fontSize:'13px',fontWeight:'800',color:'#FF8C42'}}>
                    {listaInUso.items.filter(i=>i.completed).length}/{listaInUso.items.length}
                  </span>
                </div>
                <div style={{height:'8px',borderRadius:'4px',background:'#f3f4f7',overflow:'hidden'}}>
                  <div style={{
                    height:'100%',borderRadius:'4px',
                    width:`${(listaInUso.items.filter(i=>i.completed).length/listaInUso.items.length)*100}%`,
                    background:'linear-gradient(90deg,#FF8C42,#FFD93D)',transition:'width 0.3s'
                  }}/>
                </div>
              </div>

              {/* Items */}
              <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
                {listaInUso.items.map((item,i) => (
                  <div key={item.id} onClick={() => toggleItem(listaInUso, item.id)} style={{
                    display:'flex',alignItems:'center',gap:'12px',
                    padding:'12px 10px',borderRadius:'12px',cursor:'pointer',
                    marginBottom:'4px',
                    background:item.completed?'#F5FDF8':'transparent',
                    transition:'background 0.15s'
                  }}>
                    <div style={{
                      width:'22px',height:'22px',borderRadius:'7px',
                      border:`2px solid ${item.completed?'#00BFA6':'#dde0ed'}`,
                      background:item.completed?'#00BFA6':'#fff',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      flexShrink:0,transition:'all 0.15s'
                    }}>
                      {item.completed && <Check size={13} color="#fff" strokeWidth={3}/>}
                    </div>
                    <span style={{
                      fontSize:'13px',fontWeight:'600',
                      color:item.completed?'#7c8088':'#02153f',
                      textDecoration:item.completed?'line-through':'none',
                      flex:1,transition:'all 0.15s'
                    }}>{item.text}</span>
                  </div>
                ))}

                {listaInUso.items.every(i=>i.completed) && (
                  <div style={{
                    textAlign:'center',padding:'16px',marginTop:'8px',
                    background:'#E8FBF8',borderRadius:'12px'
                  }}>
                    <div style={{fontSize:'24px',marginBottom:'6px'}}>✅</div>
                    <div style={{fontSize:'14px',fontWeight:'800',color:'#00BFA6'}}>
                      Tutto pronto!
                    </div>
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
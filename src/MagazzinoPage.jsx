import { useState, useEffect } from 'react'
import { ChevronLeft, Plus, AlertTriangle, Check, Trash2 } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, remove } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const DEMO_MAGAZZINO = [
  {id:1, nome:'Keppra 500mg', ean:'8001234567890', scatole:3, lotto:'ABC123', scadenza:'2026-12-31', note:''},
  {id:2, nome:'Depakine 250ml', ean:'8009876543210', scatole:1, lotto:'DEF456', scadenza:'2026-06-15', note:'Tenere in frigo'},
  {id:3, nome:'Rivotril 0.5mg', ean:'8001122334455', scatole:2, lotto:'GHI789', scadenza:'2026-08-20', note:''},
  {id:4, nome:'Keppra 750mg', ean:'8005544332211', scatole:0, lotto:'JKL012', scadenza:'2026-04-30', note:'DA RIORDINARE'},
]

const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

function getDaysToExpiry(scadenza) {
  if (!scadenza) return 9999
  const exp = new Date(scadenza)
  const now = new Date()
  return Math.ceil((exp - now) / 86400000)
}

export default function MagazzinoPage({ onBack, isDemo, onNavigate }) {
  const [magazzino, setMagazzino] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newMed, setNewMed] = useState({
    nome:'', ean:'', scatole:'1', lotto:'', scadenza:'', note:''
  })

  useEffect(() => {
    if (isDemo) { setMagazzino(DEMO_MAGAZZINO); setLoading(false); return }
    const mRef = ref(db, 'magazzino')
    const unsubscribe = onValue(mRef, (snapshot) => {
      const lista = processFirebaseSnap(snapshot)
        .sort((a,b) => getDaysToExpiry(a.scadenza) - getDaysToExpiry(b.scadenza))
      setMagazzino(lista)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [isDemo])

  function handleSave() {
    if (!newMed.nome.trim()) { alert('Inserisci il nome del medicinale'); return }
    if (!newMed.scadenza) { alert('Inserisci la data di scadenza'); return }
    const med = {
      id: Date.now(),
      ...newMed,
      scatole: parseInt(newMed.scatole)||0,
    }
    if (!isDemo) {
      push(ref(db, 'magazzino'), encrypt(med))
    }
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setShowForm(false)
      setNewMed({nome:'',ean:'',scatole:'1',lotto:'',scadenza:'',note:''})
    }, 1200)
  }

  function handleDelete(item) {
    if (!window.confirm(`Eliminare ${item.nome}?`)) return
    if (!isDemo && item._firebaseKey) {
      remove(ref(db, `magazzino/${item._firebaseKey}`))
    } else {
      setMagazzino(prev => prev.filter(m => m.id !== item.id))
    }
  }

  const inScadenza = magazzino.filter(m => {
    const g = getDaysToExpiry(m.scadenza)
    return g >= 0 && g <= 30
  })
  const esauriti = magazzino.filter(m => (m.scatole||0) === 0)

  const inputStyle = {
    width:'100%', padding:'11px 12px', borderRadius:'12px',
    border:'1.5px solid #f0f1f4', fontSize:'13px', color:'#02153f',
    background:'#f3f4f7', fontFamily:'inherit', outline:'none',
    boxSizing:'border-box', marginBottom:'10px'
  }
  const labelStyle = {
    fontSize:'11px', fontWeight:'700', color:'#7c8088',
    textTransform:'uppercase', letterSpacing:'0.4px',
    marginBottom:'5px', display:'block'
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'12px'}}>💊</div>
        <div style={{fontSize:'14px',color:'#7c8088'}}>Caricamento magazzino...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}
        .mag-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="mag-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#00BFA6,#193f9e)',padding:'14px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <ChevronLeft size={20} color="#fff"/>
              </button>
              <div>
                <div style={{fontSize:'18px',fontWeight:'900',color:'#fff'}}>💊 Magazzino</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.75)'}}>
                  {isDemo?'🎭 Dati demo':`${magazzino.length} medicinali`}
                </div>
              </div>
            </div>
            <button onClick={() => setShowForm(!showForm)} style={{
              width:'36px',height:'36px',borderRadius:'50%',
              background:'rgba(255,255,255,0.25)',border:'none',
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'
            }}>
              <Plus size={20} color="#fff"/>
            </button>
          </div>
        </div>

        <div style={{padding:'12px'}}>

          {/* ALERT SCADENZE */}
          {inScadenza.length>0 && (
            <div style={{
              background:'#FFF9E6',borderRadius:'14px',padding:'12px 14px',
              marginBottom:'10px',border:'1.5px solid #FFD93D66',
              display:'flex',gap:'10px',alignItems:'flex-start'
            }}>
              <AlertTriangle size={18} color="#FF8C42" style={{flexShrink:0,marginTop:'1px'}}/>
              <div>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#8B6914',marginBottom:'2px'}}>
                  Medicinali in scadenza
                </div>
                <div style={{fontSize:'12px',color:'#8B6914'}}>
                  {inScadenza.length} medicinale/i scadono entro 30 giorni
                </div>
              </div>
            </div>
          )}

          {/* ALERT ESAURITI */}
          {esauriti.length>0 && (
            <div style={{
              background:'#FEF0F4',borderRadius:'14px',padding:'12px 14px',
              marginBottom:'10px',border:'1.5px solid #F7295A33',
              display:'flex',gap:'10px',alignItems:'flex-start'
            }}>
              <AlertTriangle size={18} color="#F7295A" style={{flexShrink:0,marginTop:'1px'}}/>
              <div>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#c41230',marginBottom:'2px'}}>
                  Medicinali esauriti
                </div>
                <div style={{fontSize:'12px',color:'#c41230'}}>
                  {esauriti.map(m=>m.nome).join(', ')} — Da riordinare
                </div>
              </div>
            </div>
          )}

          {/* FORM AGGIUNGI */}
          {showForm && (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'16px',marginBottom:'10px',boxShadow:sh}}>
              <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'14px'}}>
                ➕ Aggiungi medicinale
              </div>
              <label style={labelStyle}>Nome *</label>
              <input value={newMed.nome} onChange={e=>setNewMed({...newMed,nome:e.target.value})}
                placeholder="Es: Keppra 500mg" style={inputStyle}
                onFocus={e=>e.target.style.borderColor='#2e84e9'}
                onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div>
                  <label style={labelStyle}>Scatole</label>
                  <input type="number" min="0" value={newMed.scatole}
                    onChange={e=>setNewMed({...newMed,scatole:e.target.value})}
                    style={{...inputStyle}}
                    onFocus={e=>e.target.style.borderColor='#2e84e9'}
                    onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
                <div>
                  <label style={labelStyle}>Scadenza *</label>
                  <input type="month" value={newMed.scadenza}
                    onChange={e=>setNewMed({...newMed,scadenza:e.target.value+'-01'})}
                    style={{...inputStyle}}
                    onFocus={e=>e.target.style.borderColor='#2e84e9'}
                    onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
              </div>
              <label style={labelStyle}>Codice EAN (opzionale)</label>
              <input value={newMed.ean} onChange={e=>setNewMed({...newMed,ean:e.target.value})}
                placeholder="Es: 8001234567890" style={inputStyle}
                onFocus={e=>e.target.style.borderColor='#2e84e9'}
                onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
              <label style={labelStyle}>Lotto</label>
              <input value={newMed.lotto} onChange={e=>setNewMed({...newMed,lotto:e.target.value})}
                placeholder="Es: ABC123" style={inputStyle}
                onFocus={e=>e.target.style.borderColor='#2e84e9'}
                onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
              <label style={labelStyle}>Note</label>
              <input value={newMed.note} onChange={e=>setNewMed({...newMed,note:e.target.value})}
                placeholder="Es: Tenere in frigo" style={inputStyle}
                onFocus={e=>e.target.style.borderColor='#2e84e9'}
                onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
              <button onClick={handleSave} style={{
                width:'100%',padding:'14px',borderRadius:'50px',border:'none',
                cursor:'pointer',fontWeight:'800',fontSize:'14px',color:'#fff',
                background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#00BFA6,#193f9e)',
                boxShadow:'0 6px 20px rgba(0,191,166,0.35)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
                transition:'all 0.3s'
              }}>
                {saved?<><Check size={16} color="#fff"/> Salvato!</>:<><Plus size={16} color="#fff"/> Aggiungi</>}
              </button>
            </div>
          )}

          {/* LISTA MEDICINALI */}
          <div style={{background:'#feffff',borderRadius:'18px',padding:'14px',boxShadow:sh}}>
            <div style={{fontSize:'13px',fontWeight:'800',color:'#02153f',marginBottom:'12px'}}>
              💊 Scorte ({magazzino.length})
            </div>
            {magazzino.length===0 ? (
              <div style={{textAlign:'center',padding:'24px',color:'#bec1cc'}}>
                <div style={{fontSize:'32px',marginBottom:'8px'}}>💊</div>
                <div style={{fontSize:'13px',marginBottom:'4px'}}>Nessun medicinale</div>
                <div style={{fontSize:'11px'}}>Tocca + per aggiungere</div>
              </div>
            ) : (
              magazzino.map((m,i) => {
                const gg = getDaysToExpiry(m.scadenza)
                const esaurito = (m.scatole||0) === 0
                const inScad = gg>=0 && gg<=30
                const scaduto = gg<0
                let borderColor = '#f0f1f4'
                if (scaduto) borderColor = '#F7295A'
                else if (inScad) borderColor = '#FFD93D'
                else if (esaurito) borderColor = '#F7295A'

                return (
                  <div key={m.id||i} style={{
                    padding:'12px',borderRadius:'14px',marginBottom:'8px',
                    background:'#f3f4f7',border:`1.5px solid ${borderColor}`,
                    position:'relative'
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                      <div style={{fontSize:'14px',fontWeight:'800',color:'#02153f',flex:1,marginRight:'8px'}}>
                        {m.nome}
                      </div>
                      <button onClick={()=>handleDelete(m)} style={{
                        width:'28px',height:'28px',borderRadius:'50%',
                        background:'#FEF0F4',border:'none',cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
                      }}>
                        <Trash2 size={13} color="#F7295A"/>
                      </button>
                    </div>

                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'6px'}}>
                      {/* Scatole */}
                      <span style={{
                        fontSize:'11px',fontWeight:'700',padding:'3px 10px',borderRadius:'20px',
                        background:esaurito?'#FEF0F4':'#E8FBF8',
                        color:esaurito?'#F7295A':'#00BFA6'
                      }}>
                        {esaurito?'⚠️ Esaurito':`📦 ${m.scatole} scatole`}
                      </span>
                      {/* Scadenza */}
                      <span style={{
                        fontSize:'11px',fontWeight:'700',padding:'3px 10px',borderRadius:'20px',
                        background:scaduto?'#FEF0F4':inScad?'#FFF9E6':'#f3f4f7',
                        color:scaduto?'#F7295A':inScad?'#FF8C42':'#7c8088'
                      }}>
                        {scaduto?'❌ Scaduto':inScad?`⚠️ ${gg}gg`:`✓ ${gg}gg`}
                      </span>
                    </div>

                    {m.lotto && (
                      <div style={{fontSize:'11px',color:'#bec1cc'}}>Lotto: {m.lotto}</div>
                    )}
                    {m.note && (
                      <div style={{fontSize:'11px',color:'#7c8088',marginTop:'3px',fontStyle:'italic'}}>
                        📝 {m.note}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>
    </>
  )
}
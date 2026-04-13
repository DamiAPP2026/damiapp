import { useState, useEffect } from 'react'
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, FileText, Search, ExternalLink, Eye, ZoomIn, User, Users, ChevronRight } from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const TIPI = [
  { key:'eeg',         label:'EEG',          color:'#F7295A', bg:'#FEF0F4', emoji:'🧠' },
  { key:'ricetta',     label:'Ricetta',       color:'#2e84e9', bg:'#EEF3FD', emoji:'💊' },
  { key:'referto',     label:'Referto',       color:'#7B5EA7', bg:'#F5F3FF', emoji:'📋' },
  { key:'certificato', label:'Certificato',   color:'#00BFA6', bg:'#E8FBF8', emoji:'🏥' },
  { key:'analisi',     label:'Analisi',       color:'#FF8C42', bg:'#FFF5EE', emoji:'🔬' },
  { key:'verbale',     label:'Verbale',       color:'#193f9e', bg:'#EEF3FD', emoji:'📄' },
  { key:'foto',        label:'Foto',          color:'#e67e22', bg:'#FFF5EE', emoji:'📷' },
  { key:'tessera',     label:'Tessera',       color:'#8e44ad', bg:'#F5F3FF', emoji:'💳' },
  { key:'altro',       label:'Altro',         color:'#394058', bg:'#f3f4f7', emoji:'📎' },
]

// SEZIONI PERSONA — ogni sezione è una cartella dedicata
const SEZIONI = [
  { key:'damiano',  label:'Damiano',   sub:'Documenti personali',  color:'#F7295A', grad:'linear-gradient(135deg,#F7295A,#7B5EA7)', emoji:'👦' },
  { key:'papa',     label:'Papà',      sub:'Documenti personali',  color:'#193f9e', grad:'linear-gradient(135deg,#193f9e,#2e84e9)', emoji:'👨' },
  { key:'mamma',    label:'Mamma',     sub:'Documenti personali',  color:'#7B5EA7', grad:'linear-gradient(135deg,#7B5EA7,#e67e22)', emoji:'👩' },
  { key:'famiglia', label:'Famiglia',  sub:'Documenti condivisi',  color:'#00BFA6', grad:'linear-gradient(135deg,#00BFA6,#2e84e9)', emoji:'👨‍👩‍👦' },
  { key:'scuola',   label:'Scuola',    sub:'PEI, comunicazioni',   color:'#FF8C42', grad:'linear-gradient(135deg,#FF8C42,#FFD93D)', emoji:'🏫' },
]

function getTipo(key) { return TIPI.find(t => t.key === key) || TIPI[TIPI.length - 1] }
function getSezione(key) { return SEZIONI.find(s => s.key === key) || SEZIONI[0] }

const oggi = new Date()
const fmtOggi = `${String(oggi.getDate()).padStart(2,'0')}/${String(oggi.getMonth()+1).padStart(2,'0')}/${oggi.getFullYear()}`

const DEMO_DOCS = [
  { id:1, tipo:'eeg',         sezione:'damiano',  nome:'EEG 12-04-2026',           data:fmtOggi,      url:'', note:'Ambulatorio neurologia',   _firebaseKey:'dd1' },
  { id:2, tipo:'ricetta',     sezione:'damiano',  nome:'Ricetta Keppra apr-2026',   data:'01/04/2026', url:'', note:'Valida 30 giorni',         _firebaseKey:'dd2' },
  { id:3, tipo:'referto',     sezione:'damiano',  nome:'Visita neurologica mar-26', data:'15/03/2026', url:'', note:'Dr. Rossi',                _firebaseKey:'dd3' },
  { id:4, tipo:'tessera',     sezione:'papa',     nome:'Tessera sanitaria',         data:'01/01/2026', url:'', note:'Scadenza 2030',             _firebaseKey:'dd4' },
  { id:5, tipo:'certificato', sezione:'damiano',  nome:'Certificato L.104',         data:'10/01/2025', url:'', note:'art.3 c.3',                _firebaseKey:'dd5' },
  { id:6, tipo:'verbale',     sezione:'scuola',   nome:'Piano educativo 2025/26',   data:'10/09/2025', url:'', note:'PEI approvato',             _firebaseKey:'dd6' },
  { id:7, tipo:'foto',        sezione:'papa',     nome:'Foto documento',            data:'01/01/2026', url:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg', note:'Fronte/retro', _firebaseKey:'dd7' },
  { id:8, tipo:'verbale',     sezione:'famiglia', nome:'Verbale riunione UVMD',     data:'20/02/2026', url:'', note:'Commissione disabilità',   _firebaseKey:'dd8' },
]

const EMPTY_FORM = { tipo:'referto', sezione:'damiano', nome:'', data:fmtOggi, url:'', note:'' }

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ doc, onClose }) {
  const tipo = getTipo(doc.tipo)
  const isImage = doc.url && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(doc.url)
  const isPDF   = doc.url && /\.pdf/i.test(doc.url)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:9000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif", cursor:'pointer' }}>
      <div onClick={e => e.stopPropagation()} style={{ position:'fixed', top:0, left:0, right:0, background:'rgba(0,0,0,0.7)', padding:'16px 20px', display:'flex', alignItems:'center', gap:'12px', zIndex:9001, backdropFilter:'blur(10px)' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:tipo.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{tipo.emoji}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:f(14), fontWeight:'800', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.nome}</div>
          <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.5)' }}>{doc.data} · {tipo.label}</div>
        </div>
        <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
          {doc.url && (
            <button onClick={e => { e.stopPropagation(); window.open(doc.url, '_blank') }} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ExternalLink size={16} color="#fff"/>
            </button>
          )}
          <button onClick={onClose} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18} color="#fff"/>
          </button>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:'480px', marginTop:'70px', marginBottom:'20px', padding:'0 16px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        {isImage ? (
          <img src={doc.url} alt={doc.nome} style={{ width:'100%', maxHeight:'60vh', objectFit:'contain', borderRadius:'12px', boxShadow:'0 0 40px rgba(255,255,255,0.1)' }}/>
        ) : isPDF ? (
          <iframe src={doc.url} title={doc.nome} style={{ width:'100%', height:'65vh', border:'none', borderRadius:'12px', background:'#fff' }}/>
        ) : (
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'20px', padding:'28px', width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:'56px', marginBottom:'16px' }}>{tipo.emoji}</div>
            <div style={{ fontSize:f(20), fontWeight:'900', color:'#fff', marginBottom:'8px' }}>{doc.nome}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginBottom:'16px' }}>
              <span style={{ padding:'4px 12px', borderRadius:'20px', background:tipo.color+'33', color:tipo.color, fontWeight:'700', fontSize:f(12) }}>{tipo.label}</span>
              <span style={{ padding:'4px 12px', borderRadius:'20px', background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontWeight:'700', fontSize:f(12) }}>{doc.data}</span>
              <span style={{ padding:'4px 12px', borderRadius:'20px', background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontWeight:'700', fontSize:f(12) }}>{getSezione(doc.sezione).label}</span>
            </div>
            {doc.note && <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'12px', padding:'12px 16px', fontSize:f(13), color:'rgba(255,255,255,0.6)', lineHeight:'1.6', fontStyle:'italic' }}>📝 {doc.note}</div>}
            {!doc.url && <div style={{ marginTop:'16px', fontSize:f(11), color:'rgba(255,255,255,0.3)' }}>Nessun file allegato</div>}
          </div>
        )}
        {doc.note && (isImage || isPDF) && (
          <div style={{ marginTop:'14px', padding:'10px 14px', background:'rgba(255,255,255,0.08)', borderRadius:'12px', fontSize:f(12), color:'rgba(255,255,255,0.6)', width:'100%', textAlign:'center' }}>📝 {doc.note}</div>
        )}
      </div>
      <div style={{ position:'fixed', bottom:'24px', fontSize:f(11), color:'rgba(255,255,255,0.25)' }}>Tocca lo schermo per chiudere</div>
    </div>
  )
}

// ── Vista hub sezioni (schermata iniziale) ────────────────────
function HubSezioni({ documenti, onSezione }) {
  return (
    <div style={{ padding:'12px' }}>
      <div style={{ fontSize:f(12), color:'#7c8088', marginBottom:'14px', fontWeight:'600' }}>
        Seleziona una cartella per visualizzare i documenti
      </div>
      {SEZIONI.map(s => {
        const n = documenti.filter(d => d.sezione === s.key).length
        return (
          <div key={s.key} onClick={() => onSezione(s.key)}
            style={{ background:'#feffff', borderRadius:'18px', marginBottom:'10px', boxShadow:shSm, cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center' }}>
            <div style={{ width:'6px', alignSelf:'stretch', background:s.grad, flexShrink:0 }}/>
            <div style={{ width:'52px', height:'52px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', flexShrink:0 }}>
              {s.emoji}
            </div>
            <div style={{ flex:1, padding:'14px 4px 14px 0' }}>
              <div style={{ fontSize:f(15), fontWeight:'900', color:'#02153f' }}>{s.label}</div>
              <div style={{ fontSize:f(11), color:'#7c8088' }}>{s.sub}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', paddingRight:'14px' }}>
              <div style={{ background:s.color+'18', borderRadius:'20px', padding:'3px 12px' }}>
                <span style={{ fontSize:f(13), fontWeight:'900', color:s.color }}>{n}</span>
              </div>
              <ChevronRight size={16} color="#bec1cc"/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
export default function DocumentiPage({ onBack, isDemo }) {
  const [documenti,   setDocumenti]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [sezioneAttiva, setSezioneAttiva] = useState(null)   // null = hub
  const [showForm,    setShowForm]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [form,        setForm]        = useState({...EMPTY_FORM})
  const [search,      setSearch]      = useState('')
  const [filtroTipo,  setFiltroTipo]  = useState('tutti')
  const [saved,       setSaved]       = useState(false)
  const [preview,     setPreview]     = useState(null)

  useEffect(() => {
    if (isDemo) { setDocumenti(DEMO_DOCS); setLoading(false); return }
    const u = onValue(ref(db, 'documents'), snap => {
      setDocumenti(processFirebaseSnap(snap).sort((a, b) => (b.id || 0) - (a.id || 0)))
      setLoading(false)
    })
    return () => u()
  }, [isDemo])

  function apriNuovo() {
    setForm({ ...EMPTY_FORM, sezione: sezioneAttiva || 'damiano' })
    setEditTarget(null); setShowForm(true)
  }
  function apriModifica(d) {
    setForm({ tipo:d.tipo||'altro', sezione:d.sezione||'damiano', nome:d.nome||'', data:d.data||'', url:d.url||'', note:d.note||'' })
    setEditTarget(d); setShowForm(true)
  }
  function handleSalva() {
    if (!form.nome.trim()) { alert('Inserisci il nome del documento'); return }
    const doc = { id: editTarget?.id || Date.now(), ...form, nome: form.nome.trim() }
    if (!isDemo) {
      if (editTarget?._firebaseKey) set(ref(db, `documents/${editTarget._firebaseKey}`), encrypt(doc))
      else push(ref(db, 'documents'), encrypt(doc))
    } else {
      if (editTarget) setDocumenti(prev => prev.map(d => d.id === editTarget.id ? { ...doc, _firebaseKey: d._firebaseKey } : d))
      else setDocumenti(prev => [{ ...doc, _firebaseKey: `demo_${Date.now()}` }, ...prev])
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowForm(false) }, 1200)
  }
  function handleElimina(d) {
    if (!window.confirm(`Eliminare "${d.nome}"?`)) return
    if (!isDemo && d._firebaseKey) remove(ref(db, `documents/${d._firebaseKey}`))
    else setDocumenti(prev => prev.filter(x => x.id !== d.id))
  }

  const sezioneInfo = sezioneAttiva ? getSezione(sezioneAttiva) : null

  const docsFiltrati = (sezioneAttiva ? documenti.filter(d => d.sezione === sezioneAttiva) : documenti).filter(d => {
    const mS = !search || (d.nome || '').toLowerCase().includes(search.toLowerCase()) || (d.note || '').toLowerCase().includes(search.toLowerCase())
    const mT = filtroTipo === 'tutti' || d.tipo === filtroTipo
    return mS && mT
  })

  const inStyle = { width:'100%', padding:'11px 12px', borderRadius:'12px', border:'1.5px solid #f0f1f4', fontSize:f(13), color:'#02153f', background:'#f3f4f7', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
  const lbStyle = { fontSize:f(11), fontWeight:'700', color:'#7c8088', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'5px', display:'block' }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <FileText size={36} color="#bec1cc" style={{ margin:'0 auto 10px', display:'block' }}/>
        <div style={{ fontSize:f(13), color:'#bec1cc' }}>Caricamento documenti...</div>
      </div>
    </div>
  )

  // Colori header: hub = gradiente blu-viola, sezione = gradiente della sezione
  const headerGrad = sezioneInfo ? sezioneInfo.grad : 'linear-gradient(135deg,#2e84e9,#7B5EA7)'

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.dc-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="dc-wrap">

        {preview && <Lightbox doc={preview} onClose={() => setPreview(null)}/>}

        {/* HEADER */}
        <div style={{ background:headerGrad, padding:'14px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom: sezioneAttiva ? '14px' : '6px' }}>
            <button
              onClick={() => { if (sezioneAttiva) { setSezioneAttiva(null); setSearch(''); setFiltroTipo('tutti') } else onBack() }}
              style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
            >
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:f(18), fontWeight:'900', color:'#fff' }}>
                {sezioneAttiva ? `${sezioneInfo.emoji} ${sezioneInfo.label}` : '📂 Documenti'}
              </div>
              <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.75)' }}>
                {sezioneAttiva
                  ? `${sezioneInfo.sub} · ${docsFiltrati.length} doc`
                  : isDemo ? '🎭 Dati demo' : `${documenti.length} documenti totali`
                }
              </div>
            </div>
            {sezioneAttiva && (
              <button onClick={apriNuovo} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Plus size={20} color="#fff"/>
              </button>
            )}
          </div>

          {/* Barra ricerca e filtro tipo — solo dentro una sezione */}
          {sezioneAttiva && (
            <>
              <div style={{ position:'relative', marginBottom:'10px' }}>
                <Search size={15} color="#bec1cc" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)' }}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca documento..." style={{ ...inStyle, paddingLeft:'34px', background:'rgba(255,255,255,0.95)', border:'none' }}/>
              </div>
              <div style={{ overflowX:'auto' }}>
                <div style={{ display:'flex', gap:'5px', paddingBottom:'2px', width:'max-content' }}>
                  <button onClick={() => setFiltroTipo('tutti')} style={{ padding:'5px 10px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'700', fontSize:f(10), fontFamily:'inherit', background:filtroTipo==='tutti'?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)', color:filtroTipo==='tutti'?'#394058':'#fff', whiteSpace:'nowrap' }}>
                    Tutti
                  </button>
                  {TIPI.map(t => {
                    const n = documenti.filter(d => d.sezione === sezioneAttiva && d.tipo === t.key).length
                    if (n === 0) return null
                    return (
                      <button key={t.key} onClick={() => setFiltroTipo(t.key)} style={{ padding:'5px 10px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'700', fontSize:f(10), fontFamily:'inherit', background:filtroTipo===t.key?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)', color:filtroTipo===t.key?t.color:'#fff', whiteSpace:'nowrap' }}>
                        {t.emoji} {t.label} ({n})
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* CONTENUTO */}
        {!sezioneAttiva ? (
          <HubSezioni documenti={documenti} onSezione={key => { setSezioneAttiva(key); setSearch(''); setFiltroTipo('tutti') }}/>
        ) : (
          <div style={{ padding:'10px 12px' }}>
            {docsFiltrati.length === 0 ? (
              <div style={{ background:'#feffff', borderRadius:'18px', padding:'32px', textAlign:'center', boxShadow:sh, marginTop:'8px' }}>
                <FileText size={40} color="#bec1cc" style={{ margin:'0 auto 12px', display:'block' }}/>
                <div style={{ fontSize:f(14), color:'#7c8088', marginBottom:'4px' }}>
                  {search || filtroTipo !== 'tutti' ? 'Nessun risultato' : 'Nessun documento'}
                </div>
                {!search && filtroTipo === 'tutti' && (
                  <div style={{ fontSize:f(12), color:'#bec1cc', marginTop:'4px' }}>Aggiungi il primo documento con il +</div>
                )}
              </div>
            ) : (
              docsFiltrati.map((d, i) => {
                const tipo    = getTipo(d.tipo)
                const hasFile = !!d.url
                const isImage = hasFile && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(d.url)
                return (
                  <div key={d.id || i} style={{ background:'#feffff', borderRadius:'18px', marginBottom:'10px', boxShadow:shSm, overflow:'hidden' }}>
                    {isImage && (
                      <div onClick={() => setPreview(d)} style={{ width:'100%', height:'120px', overflow:'hidden', cursor:'pointer', position:'relative', background:'#f3f4f7' }}>
                        <img src={d.url} alt={d.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        <div style={{ position:'absolute', bottom:'6px', right:'6px', background:'rgba(0,0,0,0.5)', borderRadius:'8px', padding:'3px 8px', fontSize:f(10), color:'#fff', fontWeight:'700' }}>👁 Anteprima</div>
                      </div>
                    )}
                    <div style={{ padding:'12px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                        <div onClick={() => setPreview(d)} style={{ width:'44px', height:'44px', borderRadius:'12px', background:tipo.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'22px', cursor:'pointer', boxShadow:`0 3px 10px ${tipo.color}44` }}>
                          {tipo.emoji}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div onClick={() => setPreview(d)} style={{ fontSize:f(14), fontWeight:'800', color:'#02153f', marginBottom:'5px', cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nome}</div>
                          <div style={{ display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap' }}>
                            <span style={{ fontSize:f(10), fontWeight:'700', padding:'2px 8px', borderRadius:'20px', background:tipo.bg, color:tipo.color }}>{tipo.emoji} {tipo.label}</span>
                            {d.data && <span style={{ fontSize:f(10), color:'#bec1cc' }}>{d.data}</span>}
                            {hasFile && !isImage && <span style={{ fontSize:f(10), fontWeight:'700', padding:'2px 7px', borderRadius:'20px', background:'#E8FBF8', color:'#00BFA6' }}>📎 file</span>}
                          </div>
                          {d.note && <div style={{ fontSize:f(10), color:'#bec1cc', marginTop:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📝 {d.note}</div>}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px', flexShrink:0 }}>
                          <button onClick={() => setPreview(d)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#f3f4f7', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Eye size={13} color="#7c8088"/>
                          </button>
                          <button onClick={() => apriModifica(d)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#EEF3FD', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Edit2 size={13} color="#2e84e9"/>
                          </button>
                          <button onClick={() => handleElimina(d)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#FEF0F4', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Trash2 size={13} color="#F7295A"/>
                          </button>
                        </div>
                      </div>
                      {hasFile && !isImage && (
                        <button onClick={() => window.open(d.url, '_blank')} style={{ width:'100%', marginTop:'10px', padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', background:'#EEF3FD', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontWeight:'700', fontSize:f(11), color:'#2e84e9', fontFamily:'inherit' }}>
                          <ExternalLink size={13} color="#2e84e9"/> Apri documento
                        </button>
                      )}
                      {hasFile && isImage && (
                        <button onClick={() => setPreview(d)} style={{ width:'100%', marginTop:'10px', padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', background:'#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontWeight:'700', fontSize:f(11), color:'#7c8088', fontFamily:'inherit' }}>
                          <ZoomIn size={13} color="#7c8088"/> Vedi a schermo intero
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* MODAL FORM */}
        {showForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(2,21,63,0.55)', zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif" }}>
            <div style={{ background:'#feffff', borderRadius:'24px 24px 0 0', padding:'20px', width:'100%', maxWidth:'480px', maxHeight:'92vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <span style={{ fontSize:f(16), fontWeight:'900', color:'#02153f' }}>{editTarget ? 'Modifica documento' : 'Nuovo documento'}</span>
                <button onClick={() => setShowForm(false)} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#f3f4f7', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={16} color="#7c8088"/>
                </button>
              </div>

              {/* Nome */}
              <label style={lbStyle}>Nome documento *</label>
              <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome:e.target.value }))} placeholder="Es: EEG 12/04/2026" style={{ ...inStyle, marginBottom:'12px' }}
                onFocus={e => e.target.style.borderColor='#2e84e9'} onBlur={e => e.target.style.borderColor='#f0f1f4'}/>

              {/* Sezione */}
              <label style={lbStyle}>Cartella</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginBottom:'12px' }}>
                {SEZIONI.map(s => (
                  <div key={s.key} onClick={() => setForm(p => ({ ...p, sezione:s.key }))}
                    style={{ padding:'9px 10px', borderRadius:'12px', cursor:'pointer', border:`2px solid ${form.sezione===s.key?s.color:'#f0f1f4'}`, background:form.sezione===s.key?s.color+'15':'#feffff', display:'flex', alignItems:'center', gap:'8px', transition:'all 0.15s' }}>
                    <span style={{ fontSize:'18px' }}>{s.emoji}</span>
                    <span style={{ fontSize:f(12), fontWeight:'800', color:form.sezione===s.key?s.color:'#394058' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Tipo */}
              <label style={lbStyle}>Tipo documento</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginBottom:'12px' }}>
                {TIPI.map(t => (
                  <div key={t.key} onClick={() => setForm(p => ({ ...p, tipo:t.key }))}
                    style={{ padding:'9px 10px', borderRadius:'10px', cursor:'pointer', border:`2px solid ${form.tipo===t.key?t.color:'#f0f1f4'}`, background:form.tipo===t.key?t.bg:'#feffff', display:'flex', alignItems:'center', gap:'8px', transition:'all 0.15s' }}>
                    <span style={{ fontSize:'18px' }}>{t.emoji}</span>
                    <span style={{ fontSize:f(12), fontWeight:'700', color:form.tipo===t.key?t.color:'#394058' }}>{t.label}</span>
                  </div>
                ))}
              </div>

              {/* Data + Link */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
                <div>
                  <label style={lbStyle}>Data</label>
                  <input value={form.data} onChange={e => setForm(p => ({ ...p, data:e.target.value }))} placeholder="gg/mm/aaaa" style={inStyle}
                    onFocus={e => e.target.style.borderColor='#2e84e9'} onBlur={e => e.target.style.borderColor='#f0f1f4'}/>
                </div>
                <div>
                  <label style={lbStyle}>Link file (opz.)</label>
                  <input value={form.url} onChange={e => setForm(p => ({ ...p, url:e.target.value }))} placeholder="https://..." type="url" style={inStyle}
                    onFocus={e => e.target.style.borderColor='#2e84e9'} onBlur={e => e.target.style.borderColor='#f0f1f4'}/>
                </div>
              </div>
              {form.url && <div style={{ fontSize:f(11), color:'#7c8088', marginBottom:'10px', padding:'6px 10px', background:'#f3f4f7', borderRadius:'8px' }}>💡 Incolla il link diretto al file (Google Drive, Dropbox, ecc.)</div>}

              {/* Note */}
              <label style={lbStyle}>Note</label>
              <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note:e.target.value }))} placeholder="Es: Dr. Rossi, scadenza 30 giorni..." rows={2} style={{ ...inStyle, resize:'none', marginBottom:'16px' }}
                onFocus={e => e.target.style.borderColor='#2e84e9'} onBlur={e => e.target.style.borderColor='#f0f1f4'}/>

              <button onClick={handleSalva} style={{ width:'100%', padding:'15px', borderRadius:'50px', border:'none', cursor:'pointer', fontWeight:'800', fontSize:f(15), color:'#fff', background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#2e84e9,#7B5EA7)', boxShadow:'0 6px 20px rgba(46,132,233,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.3s', fontFamily:'inherit' }}>
                {saved ? <><Check size={18} color="#fff"/>Salvato!</> : <>{editTarget ? 'Aggiorna documento' : 'Aggiungi documento'}</>}
              </button>
              {isDemo && <div style={{ textAlign:'center', marginTop:'10px', fontSize:f(11), color:'#8B6914', fontWeight:'600' }}>🎭 Demo — non salvato su Firebase</div>}
            </div>
          </div>
        )}

      </div>
    </>
  )
}

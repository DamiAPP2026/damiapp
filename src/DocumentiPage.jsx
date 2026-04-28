import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft, Plus, Trash2, Edit2, Check, X,
  FileText, Search, ExternalLink, Eye, ZoomIn,
  ChevronRight, Brain, Pill, ClipboardList,
  HeartPulse, FlaskConical, ScrollText, Camera,
  CreditCard, Paperclip, Users, School,
  User, BookOpen, Upload, Download, AlertCircle
} from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

// Overlay si ferma SOPRA la navbar — mai sotto
const NAV_H = 'calc(64px + env(safe-area-inset-bottom, 0px))'

const TIPI = [
  { key:'eeg',         label:'EEG',         Icon:Brain,         color:'#F7295A', bg:'#FEF0F4' },
  { key:'ricetta',     label:'Ricetta',      Icon:Pill,          color:'#2e84e9', bg:'#EEF3FD' },
  { key:'referto',     label:'Referto',      Icon:ClipboardList, color:'#7B5EA7', bg:'#F5F3FF' },
  { key:'certificato', label:'Certificato',  Icon:HeartPulse,    color:'#00BFA6', bg:'#E8FBF8' },
  { key:'analisi',     label:'Analisi',      Icon:FlaskConical,  color:'#FF8C42', bg:'#FFF5EE' },
  { key:'verbale',     label:'Verbale',      Icon:ScrollText,    color:'#193f9e', bg:'#EEF3FD' },
  { key:'foto',        label:'Foto',         Icon:Camera,        color:'#e67e22', bg:'#FFF5EE' },
  { key:'tessera',     label:'Tessera',      Icon:CreditCard,    color:'#8e44ad', bg:'#F5F3FF' },
  { key:'altro',       label:'Altro',        Icon:Paperclip,     color:'#394058', bg:'#f3f4f7' },
]

const SEZIONI = [
  { key:'damiano',  label:'Damiano',  sub:'Documenti personali',   color:'#F7295A', grad:'linear-gradient(135deg,#F7295A,#7B5EA7)', Icon:User   },
  { key:'papa',     label:'Papà',     sub:'Documenti personali',   color:'#193f9e', grad:'linear-gradient(135deg,#193f9e,#2e84e9)', Icon:User   },
  { key:'mamma',    label:'Mamma',    sub:'Documenti personali',   color:'#7B5EA7', grad:'linear-gradient(135deg,#7B5EA7,#e67e22)', Icon:User   },
  { key:'parenti',  label:'Parenti',  sub:'Nonni, zii, familiari', color:'#e67e22', grad:'linear-gradient(135deg,#e67e22,#FFD93D)', Icon:Users  },
  { key:'famiglia', label:'Famiglia', sub:'Documenti condivisi',   color:'#00BFA6', grad:'linear-gradient(135deg,#00BFA6,#2e84e9)', Icon:Users  },
  { key:'scuola',   label:'Scuola',   sub:'PEI, comunicazioni',    color:'#FF8C42', grad:'linear-gradient(135deg,#FF8C42,#FFD93D)', Icon:School },
]

function getTipo(key)    { return TIPI.find(t => t.key === key) || TIPI[TIPI.length - 1] }
function getSezione(key) { return SEZIONI.find(s => s.key === key) || SEZIONI[0] }

function normalizzaDoc(d) {
  if (d.sezione) return d
  const map = { medici:'damiano', personali:'damiano', scuola:'scuola' }
  return { ...d, sezione: map[d.categoria] || 'damiano' }
}

function detectContent(url, filename) {
  if (!url) return null
  if (url.startsWith('data:')) {
    const mimeMatch = url.match(/data:([^;]+);/)
    const mime = mimeMatch ? mimeMatch[1] : ''
    if (mime.startsWith('image/') || (filename && filename.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)))
      return { type: 'image', url }
    if (mime === 'application/pdf' || (filename && filename.toLowerCase().endsWith('.pdf')))
      return { type: 'pdf', url }
    if (mime.startsWith('text/')) {
      try { return { type: 'text', data: atob(url.split(',')[1]), url } }
      catch { return { type: 'download', url, filename } }
    }
    return { type: 'download', url, filename }
  }
  if (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(url)) return { type: 'image', url }
  if (/\.pdf/i.test(url))                          return { type: 'pdf', url }
  return { type: 'download', url, filename }
}

const oggi = new Date()
const fmtOggi = `${String(oggi.getDate()).padStart(2,'0')}/${String(oggi.getMonth()+1).padStart(2,'0')}/${oggi.getFullYear()}`

const DEMO_DOCS = [
  { id:1, tipo:'eeg',         sezione:'damiano',  nome:'EEG 12-04-2026',           filename:'EEG_12042026.pdf',   data:fmtOggi,      url:'', note:'Ambulatorio neurologia'   },
  { id:2, tipo:'ricetta',     sezione:'damiano',  nome:'Ricetta Keppra apr-2026',   filename:'Ricetta_apr26.pdf',  data:'01/04/2026', url:'', note:'Valida 30 giorni'          },
  { id:3, tipo:'referto',     sezione:'damiano',  nome:'Visita neurologica mar-26', filename:'Referto_mar26.pdf',  data:'15/03/2026', url:'', note:'Dr. Rossi'                 },
  { id:4, tipo:'tessera',     sezione:'papa',     nome:'Tessera sanitaria',         filename:'tessera.jpg',        data:'01/01/2026', url:'', note:'Scadenza 2030'              },
  { id:5, tipo:'certificato', sezione:'damiano',  nome:'Certificato L.104',         filename:'L104.pdf',           data:'10/01/2025', url:'', note:'art.3 c.3'                 },
  { id:6, tipo:'verbale',     sezione:'scuola',   nome:'Piano educativo 2025/26',   filename:'PEI_2526.pdf',       data:'10/09/2025', url:'', note:'PEI approvato'              },
  { id:7, tipo:'foto',        sezione:'papa',     nome:'Foto documento fronte/r.',  filename:'foto_doc.jpg',       data:'01/01/2026', url:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg', note:'Fronte/retro' },
  { id:8, tipo:'verbale',     sezione:'famiglia', nome:'Verbale riunione UVMD',     filename:'UVMD_feb26.pdf',     data:'20/02/2026', url:'', note:'Commissione disabilità'    },
].map((d,i) => ({ ...d, _firebaseKey: `demo_${i}` }))

const EMPTY_FORM = { tipo:'referto', sezione:'damiano', nome:'', data:fmtOggi, url:'', filename:'', note:'' }

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ doc, onClose }) {
  const tipo = getTipo(doc.tipo)
  const { Icon: TipoIcon } = tipo
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    setLoading(true); setError('')
    try {
      const c = detectContent(doc.url, doc.filename || doc.nome)
      if (c) setContent(c)
      else setError('Nessun file allegato a questo documento')
    } catch { setError('Errore nel caricamento del documento') }
    setLoading(false)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [doc])

  function handleDownload() {
    if (!doc.url) return
    const a = document.createElement('a')
    a.href = doc.url; a.download = doc.filename || doc.nome || 'documento'; a.click()
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:9000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"-apple-system,'Segoe UI',sans-serif", cursor:'pointer' }}>
      <div onClick={e=>e.stopPropagation()} style={{ position:'fixed', top:0, left:0, right:0, background:'rgba(0,0,0,0.75)', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px', zIndex:9001, backdropFilter:'blur(10px)' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:tipo.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <TipoIcon size={18} color="#fff"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:f(14), fontWeight:'800', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.nome}</div>
          <div style={{ fontSize:f(10), color:'rgba(255,255,255,0.5)' }}>{doc.data} · {tipo.label}{doc.filename ? ` · ${doc.filename}` : ''}</div>
        </div>
        <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
          {doc.url && <button type="button" onClick={e=>{e.stopPropagation();handleDownload()}} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Download size={16} color="#fff"/></button>}
          <button type="button" onClick={onClose} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18} color="#fff"/></button>
        </div>
      </div>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:'480px', marginTop:'68px', marginBottom:'40px', padding:'0 16px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ width:'40px', height:'40px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:f(13) }}>Caricamento...</div>
          </div>
        ) : error ? (
          <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:'20px', padding:'32px', width:'100%', textAlign:'center' }}>
            <AlertCircle size={40} color="rgba(255,255,255,0.3)" style={{ margin:'0 auto 14px', display:'block' }}/>
            <div style={{ fontSize:f(14), color:'rgba(255,255,255,0.6)', marginBottom:'8px' }}>{error}</div>
            <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.3)' }}>Nessun file allegato — aggiungi un file dal form di modifica</div>
          </div>
        ) : content ? (
          <>
            {content.type==='image' && (
              <div style={{ textAlign:'center', width:'100%' }}>
                <img src={content.url} alt={doc.nome} style={{ width:'100%', maxHeight:'65vh', objectFit:'contain', borderRadius:'12px' }} onError={()=>setError("Impossibile visualizzare l'immagine")}/>
                <button type="button" onClick={handleDownload} style={{ marginTop:'14px', padding:'10px 24px', borderRadius:'50px', border:'none', cursor:'pointer', background:'rgba(255,255,255,0.15)', color:'#fff', fontWeight:'700', fontSize:f(12), display:'inline-flex', alignItems:'center', gap:'6px', fontFamily:'inherit' }}><Download size={14} color="#fff"/> Scarica immagine</button>
              </div>
            )}
            {content.type==='pdf' && (
              <div style={{ width:'100%', textAlign:'center' }}>
                <iframe src={content.url} title={doc.nome} style={{ width:'100%', height:'65vh', border:'none', borderRadius:'12px', background:'#fff' }}/>
                <button type="button" onClick={handleDownload} style={{ marginTop:'14px', padding:'10px 24px', borderRadius:'50px', border:'none', cursor:'pointer', background:'rgba(255,255,255,0.15)', color:'#fff', fontWeight:'700', fontSize:f(12), display:'inline-flex', alignItems:'center', gap:'6px', fontFamily:'inherit' }}><Download size={14} color="#fff"/> Scarica PDF</button>
              </div>
            )}
            {content.type==='text' && (
              <div style={{ width:'100%' }}>
                <pre style={{ whiteSpace:'pre-wrap', background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.85)', padding:'20px', borderRadius:'12px', maxHeight:'65vh', overflow:'auto', fontSize:f(12), lineHeight:'1.6', fontFamily:"'Courier New',monospace" }}>{content.data}</pre>
                <button type="button" onClick={handleDownload} style={{ marginTop:'14px', padding:'10px 24px', borderRadius:'50px', border:'none', cursor:'pointer', background:'rgba(255,255,255,0.15)', color:'#fff', fontWeight:'700', fontSize:f(12), display:'inline-flex', alignItems:'center', gap:'6px', fontFamily:'inherit' }}><Download size={14} color="#fff"/> Scarica file</button>
              </div>
            )}
            {content.type==='download' && (
              <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:'20px', padding:'32px', width:'100%', textAlign:'center' }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'18px', background:tipo.color, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><TipoIcon size={32} color="#fff"/></div>
                <div style={{ fontSize:f(18), fontWeight:'900', color:'#fff', marginBottom:'8px' }}>{doc.nome}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginBottom:'20px' }}>
                  <span style={{ padding:'4px 12px', borderRadius:'20px', background:tipo.color+'33', color:tipo.color, fontWeight:'700', fontSize:f(11) }}>{tipo.label}</span>
                  <span style={{ padding:'4px 12px', borderRadius:'20px', background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontWeight:'700', fontSize:f(11) }}>{doc.data}</span>
                </div>
                {doc.note && <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'12px', padding:'12px 16px', fontSize:f(12), color:'rgba(255,255,255,0.5)', lineHeight:'1.6', fontStyle:'italic', marginBottom:'16px' }}>{doc.note}</div>}
                <div style={{ fontSize:f(12), color:'rgba(255,255,255,0.4)', marginBottom:'16px' }}>Anteprima non disponibile per questo tipo di file</div>
                <button type="button" onClick={handleDownload} style={{ padding:'12px 28px', borderRadius:'50px', border:'none', cursor:'pointer', background:'linear-gradient(135deg,#00BFA6,#2e84e9)', color:'#fff', fontWeight:'800', fontSize:f(14), display:'inline-flex', alignItems:'center', gap:'8px', fontFamily:'inherit' }}><Download size={16} color="#fff"/> Scarica {doc.filename||'file'}</button>
              </div>
            )}
          </>
        ) : null}
      </div>
      <div style={{ position:'fixed', bottom:'16px', fontSize:f(10), color:'rgba(255,255,255,0.2)' }}>Tocca lo schermo per chiudere · ESC per uscire</div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Hub sezioni ───────────────────────────────────────────────
function HubSezioni({ documenti, onSezione }) {
  const totale = documenti.length
  return (
    <div style={{ padding:'12px' }}>
      <div style={{ fontSize:f(12), color:'#7c8088', marginBottom:'14px', fontWeight:'600' }}>
        {totale} {totale===1?'documento totale':'documenti totali'} — seleziona una cartella
      </div>
      {SEZIONI.map(s => {
        const n = documenti.filter(d => d.sezione===s.key).length
        const { Icon: SIcon } = s
        return (
          <div key={s.key} onClick={()=>onSezione(s.key)}
            style={{ background:'#feffff', borderRadius:'18px', marginBottom:'10px', boxShadow:shSm, cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center' }}>
            <div style={{ width:'6px', alignSelf:'stretch', background:s.grad, flexShrink:0 }}/>
            <div style={{ width:'52px', height:'52px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:s.color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <SIcon size={18} color={s.color}/>
              </div>
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
  const [documenti,       setDocumenti]       = useState([])
  const [loading,         setLoading]         = useState(true)
  const [sezioneAttiva,   setSezioneAttiva]   = useState(null)
  const [showForm,        setShowForm]        = useState(false)
  const [editTarget,      setEditTarget]      = useState(null)
  const [form,            setForm]            = useState({ ...EMPTY_FORM })
  const [search,          setSearch]          = useState('')
  const [filtroTipo,      setFiltroTipo]      = useState('tutti')
  const [saved,           setSaved]           = useState(false)
  const [preview,         setPreview]         = useState(null)
  const [changingSezione, setChangingSezione] = useState(null)
  const [uploading,       setUploading]       = useState(false)
  const [uploadError,     setUploadError]     = useState('')
  const fileInputRef = useRef(null)
  const nomeInputRef = useRef(null)

  useEffect(() => {
    if (isDemo) { setDocumenti(DEMO_DOCS); setLoading(false); return }
    const u = onValue(ref(db,'documents'), snap => {
      setDocumenti(processFirebaseSnap(snap).map(normalizzaDoc).sort((a,b)=>(b.id||0)-(a.id||0)))
      setLoading(false)
    })
    return () => u()
  }, [isDemo])

  function handleFileSelect(e) {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 10*1024*1024) { setUploadError('File troppo grande! Massimo 10MB'); e.target.value=''; return }
    setUploadError(''); setUploading(true)
    const reader = new FileReader()
    reader.onload = ev => { setForm(p=>({...p,url:ev.target.result,filename:file.name})); setUploading(false) }
    reader.onerror = () => { setUploadError('Errore durante la lettura del file'); setUploading(false) }
    reader.readAsDataURL(file); e.target.value=''
  }

  function apriNuovo() {
    setForm({...EMPTY_FORM, sezione:sezioneAttiva||'damiano'})
    setUploadError(''); setEditTarget(null); setShowForm(true)
    setTimeout(() => nomeInputRef.current?.focus(), 80)
  }

  function apriModifica(d) {
    setForm({tipo:d.tipo||'altro',sezione:d.sezione||'damiano',nome:d.nome||'',data:d.data||'',url:d.url||'',filename:d.filename||'',note:d.note||''})
    setUploadError(''); setEditTarget(d); setShowForm(true)
    setTimeout(() => nomeInputRef.current?.focus(), 80)
  }

  function handleSalva() {
    if (!form.nome.trim()) { alert('Inserisci il nome del documento'); return }
    const doc = { id:editTarget?.id||Date.now(), ...form, nome:form.nome.trim() }
    if (!isDemo) {
      if (editTarget?._firebaseKey) set(ref(db,`documents/${editTarget._firebaseKey}`), encrypt(doc))
      else push(ref(db,'documents'), encrypt(doc))
    } else {
      if (editTarget) setDocumenti(prev=>prev.map(d=>d.id===editTarget.id?{...doc,_firebaseKey:d._firebaseKey}:d))
      else setDocumenti(prev=>[{...doc,_firebaseKey:`demo_${Date.now()}`},...prev])
    }
    setSaved(true)
    setTimeout(()=>{setSaved(false);setShowForm(false)},1200)
  }

  function handleElimina(d) {
    if (!window.confirm(`Eliminare "${d.nome}"?`)) return
    if (!isDemo && d._firebaseKey) remove(ref(db,`documents/${d._firebaseKey}`))
    else setDocumenti(prev=>prev.filter(x=>x.id!==d.id))
  }

  function handleCambioSezione(doc, nuovaSezione) {
    const updated = {...doc, sezione:nuovaSezione}
    if (!isDemo && doc._firebaseKey) set(ref(db,`documents/${doc._firebaseKey}`), encrypt(updated))
    setDocumenti(prev=>prev.map(d=>d.id===doc.id?{...updated}:d))
    setChangingSezione(null)
  }

  function rimuoviFile() { setForm(p=>({...p,url:'',filename:''})) }

  const sezioneInfo = sezioneAttiva ? getSezione(sezioneAttiva) : null
  const headerGrad  = sezioneInfo ? sezioneInfo.grad : 'linear-gradient(135deg,#2e84e9,#7B5EA7)'

  const docsFiltrati = (sezioneAttiva ? documenti.filter(d=>d.sezione===sezioneAttiva) : documenti).filter(d => {
    const mS = !search||(d.nome||'').toLowerCase().includes(search.toLowerCase())||(d.note||'').toLowerCase().includes(search.toLowerCase())
    const mT = filtroTipo==='tutti'||d.tipo===filtroTipo
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

  return (
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.dc-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="dc-wrap">

        {preview && <Lightbox doc={preview} onClose={()=>setPreview(null)}/>}

        {/* Overlay cambio sezione */}
        {changingSezione && (
          <div onClick={()=>setChangingSezione(null)} style={{ position:'fixed', inset:0, background:'rgba(2,21,63,0.45)', zIndex:3000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#feffff', borderRadius:'24px 24px 0 0', paddingTop:'20px', paddingLeft:'20px', paddingRight:'20px', paddingBottom:'20px', width:'100%', maxWidth:'480px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                <span style={{ fontSize:f(15), fontWeight:'900', color:'#02153f' }}>Sposta in cartella</span>
                <button type="button" onClick={()=>setChangingSezione(null)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#f3f4f7', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14} color="#7c8088"/></button>
              </div>
              <div style={{ fontSize:f(11), color:'#7c8088', marginBottom:'14px' }}>"{changingSezione.nome}"</div>
              {SEZIONI.map(s => {
                const { Icon: SIcon } = s
                const isAttuale = s.key===changingSezione.sezione
                return (
                  <div key={s.key} onClick={()=>!isAttuale&&handleCambioSezione(changingSezione,s.key)}
                    style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', borderRadius:'14px', marginBottom:'6px', cursor:isAttuale?'default':'pointer', background:isAttuale?s.color+'12':'#f3f4f7', border:`2px solid ${isAttuale?s.color:'transparent'}`, transition:'all 0.15s' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:isAttuale?s.color:s.color+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <SIcon size={16} color={isAttuale?'#fff':s.color}/>
                    </div>
                    <span style={{ flex:1, fontSize:f(14), fontWeight:'800', color:isAttuale?s.color:'#02153f' }}>{s.label}</span>
                    {isAttuale && <Check size={16} color={s.color}/>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* HEADER */}
        <div style={{ background:headerGrad, padding:'14px 16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:sezioneAttiva?'14px':'6px' }}>
            <button type="button"
              onClick={()=>{ if(sezioneAttiva){setSezioneAttiva(null);setSearch('');setFiltroTipo('tutti')}else onBack() }}
              style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                {sezioneInfo && (()=>{ const { Icon:SI }=sezioneInfo; return <SI size={18} color="#fff"/> })()}
                <div style={{ fontSize:f(18), fontWeight:'900', color:'#fff' }}>{sezioneAttiva?sezioneInfo.label:'Documenti'}</div>
              </div>
              <div style={{ fontSize:f(11), color:'rgba(255,255,255,0.75)' }}>
                {sezioneAttiva?`${sezioneInfo.sub} · ${docsFiltrati.length} doc`:isDemo?'Dati demo':`${documenti.length} documenti totali`}
              </div>
            </div>
            {sezioneAttiva && (
              <button type="button" onClick={apriNuovo} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Plus size={20} color="#fff"/>
              </button>
            )}
          </div>
          {sezioneAttiva && (
            <>
              <div style={{ position:'relative', marginBottom:'10px' }}>
                <Search size={15} color="#bec1cc" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)' }}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca documento..."
                  style={{ ...inStyle, paddingLeft:'34px', background:'rgba(255,255,255,0.95)', border:'none' }}/>
              </div>
              <div style={{ overflowX:'auto' }}>
                <div style={{ display:'flex', gap:'5px', paddingBottom:'2px', width:'max-content' }}>
                  <button type="button" onClick={()=>setFiltroTipo('tutti')} style={{ padding:'5px 10px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'700', fontSize:f(10), fontFamily:'inherit', background:filtroTipo==='tutti'?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)', color:filtroTipo==='tutti'?'#394058':'#fff', whiteSpace:'nowrap' }}>Tutti</button>
                  {TIPI.map(t => {
                    const n = documenti.filter(d=>d.sezione===sezioneAttiva&&d.tipo===t.key).length
                    if (n===0) return null
                    const { Icon:TIcon } = t
                    return (
                      <button type="button" key={t.key} onClick={()=>setFiltroTipo(t.key)} style={{ padding:'5px 10px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'700', fontSize:f(10), fontFamily:'inherit', background:filtroTipo===t.key?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)', color:filtroTipo===t.key?t.color:'#fff', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'4px' }}>
                        <TIcon size={11} color={filtroTipo===t.key?t.color:'#fff'}/> {t.label} ({n})
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
          <HubSezioni documenti={documenti} onSezione={key=>{setSezioneAttiva(key);setSearch('');setFiltroTipo('tutti')}}/>
        ) : (
          <div style={{ padding:'10px 12px' }}>
            {docsFiltrati.length===0 ? (
              <div style={{ background:'#feffff', borderRadius:'18px', padding:'32px', textAlign:'center', boxShadow:sh, marginTop:'8px' }}>
                <FileText size={40} color="#bec1cc" style={{ margin:'0 auto 12px', display:'block' }}/>
                <div style={{ fontSize:f(14), color:'#7c8088', marginBottom:'4px' }}>{search||filtroTipo!=='tutti'?'Nessun risultato':'Nessun documento'}</div>
                {!search&&filtroTipo==='tutti'&&<div style={{ fontSize:f(12), color:'#bec1cc', marginTop:'4px' }}>Aggiungi il primo documento con il +</div>}
              </div>
            ) : docsFiltrati.map((d,i) => {
              const tipo=getTipo(d.tipo); const sez=getSezione(d.sezione)
              const { Icon:TIcon }=tipo; const { Icon:SIcon }=sez
              const content=detectContent(d.url,d.filename||d.nome)
              const hasFile=!!d.url; const isImg=content?.type==='image'
              const isPdf=content?.type==='pdf'; const isDownload=content?.type==='download'
              return (
                <div key={d.id||i} style={{ background:'#feffff', borderRadius:'18px', marginBottom:'10px', boxShadow:shSm, overflow:'hidden' }}>
                  {isImg && (
                    <div onClick={()=>setPreview(d)} style={{ width:'100%', height:'120px', overflow:'hidden', cursor:'pointer', position:'relative', background:'#f3f4f7' }}>
                      <img src={d.url} alt={d.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      <div style={{ position:'absolute', bottom:'6px', right:'6px', background:'rgba(0,0,0,0.5)', borderRadius:'8px', padding:'3px 8px', fontSize:f(10), color:'#fff', fontWeight:'700', display:'flex', alignItems:'center', gap:'4px' }}><Eye size={11} color="#fff"/> Anteprima</div>
                    </div>
                  )}
                  <div style={{ padding:'12px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                      <div onClick={()=>setPreview(d)} style={{ width:'44px', height:'44px', borderRadius:'12px', background:tipo.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer', boxShadow:`0 3px 10px ${tipo.color}44` }}><TIcon size={20} color="#fff"/></div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div onClick={()=>setPreview(d)} style={{ fontSize:f(14), fontWeight:'800', color:'#02153f', marginBottom:'5px', cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nome}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap' }}>
                          <span style={{ fontSize:f(10), fontWeight:'700', padding:'2px 8px', borderRadius:'20px', background:tipo.bg, color:tipo.color, display:'flex', alignItems:'center', gap:'3px' }}><TIcon size={10} color={tipo.color}/> {tipo.label}</span>
                          <span onClick={()=>setChangingSezione(d)} style={{ fontSize:f(10), fontWeight:'700', padding:'2px 8px', borderRadius:'20px', background:sez.color+'18', color:sez.color, display:'flex', alignItems:'center', gap:'3px', cursor:'pointer' }}><SIcon size={10} color={sez.color}/> {sez.label}</span>
                          {d.data&&<span style={{ fontSize:f(10), color:'#bec1cc' }}>{d.data}</span>}
                          {hasFile&&!isImg&&<span style={{ fontSize:f(10), fontWeight:'700', padding:'2px 7px', borderRadius:'20px', background:'#E8FBF8', color:'#00BFA6', display:'flex', alignItems:'center', gap:'3px' }}><Paperclip size={10} color="#00BFA6"/> {isPdf?'PDF':isDownload?'file':'allegato'}</span>}
                        </div>
                        {d.note&&<div style={{ fontSize:f(10), color:'#bec1cc', marginTop:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.note}</div>}
                        {d.filename&&<div style={{ fontSize:f(9), color:'#dde0ed', marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.filename}</div>}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'5px', flexShrink:0 }}>
                        <button type="button" onClick={()=>setPreview(d)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#f3f4f7', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Eye size={13} color="#7c8088"/></button>
                        <button type="button" onClick={()=>apriModifica(d)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#EEF3FD', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Edit2 size={13} color="#2e84e9"/></button>
                        <button type="button" onClick={()=>handleElimina(d)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#FEF0F4', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Trash2 size={13} color="#F7295A"/></button>
                      </div>
                    </div>
                    {hasFile&&!isImg&&<button type="button" onClick={()=>setPreview(d)} style={{ width:'100%', marginTop:'10px', padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', background:isPdf?'#FEF0F4':'#EEF3FD', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontWeight:'700', fontSize:f(11), color:isPdf?'#F7295A':'#2e84e9', fontFamily:'inherit' }}>{isPdf?<><Eye size={13} color="#F7295A"/> Visualizza PDF</>:<><ExternalLink size={13} color="#2e84e9"/> Apri documento</>}</button>}
                    {isImg&&<button type="button" onClick={()=>setPreview(d)} style={{ width:'100%', marginTop:'10px', padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', background:'#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontWeight:'700', fontSize:f(11), color:'#7c8088', fontFamily:'inherit' }}><ZoomIn size={13} color="#7c8088"/> Vedi a schermo intero</button>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ════ MODAL FORM aggiunta/modifica ════
            SOLUZIONE NAVBAR: overlay bottom=NAV_H
            Il sheet fisicamente non scende sotto la navbar
        */}
        {showForm && (
          <div
            onClick={()=>setShowForm(false)}
            style={{
              position:'fixed',
              top:0, left:0, right:0,
              bottom: NAV_H,
              background:'rgba(2,21,63,0.55)',
              zIndex:2000,
              display:'flex',
              alignItems:'flex-end',
              justifyContent:'center',
              fontFamily:"-apple-system,'Segoe UI',sans-serif",
            }}
          >
            <div
              onClick={e=>e.stopPropagation()}
              style={{
                background:'#feffff',
                borderRadius:'24px 24px 0 0',
                paddingTop:'20px',
                paddingLeft:'20px',
                paddingRight:'20px',
                paddingBottom:'20px',
                width:'100%',
                maxWidth:'480px',
                maxHeight:'100%',
                overflowY:'auto',
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <span style={{ fontSize:f(16), fontWeight:'900', color:'#02153f' }}>{editTarget?'Modifica documento':'Nuovo documento'}</span>
                <button type="button" onClick={()=>setShowForm(false)} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#f3f4f7', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16} color="#7c8088"/></button>
              </div>

              <label style={lbStyle}>Nome documento *</label>
              <input ref={nomeInputRef} value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Es: EEG 12/04/2026"
                style={{ ...inStyle, marginBottom:'12px' }}
                onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              <label style={lbStyle}>Cartella</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginBottom:'12px' }}>
                {SEZIONI.map(s => {
                  const { Icon:SIcon }=s; const sel=form.sezione===s.key
                  return (
                    <div key={s.key} onClick={()=>setForm(p=>({...p,sezione:s.key}))}
                      style={{ padding:'9px 10px', borderRadius:'12px', cursor:'pointer', border:`2px solid ${sel?s.color:'#f0f1f4'}`, background:sel?s.color+'15':'#feffff', display:'flex', alignItems:'center', gap:'8px', transition:'all 0.15s' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:sel?s.color:s.color+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><SIcon size={14} color={sel?'#fff':s.color}/></div>
                      <span style={{ fontSize:f(12), fontWeight:'800', color:sel?s.color:'#394058' }}>{s.label}</span>
                    </div>
                  )
                })}
              </div>

              <label style={lbStyle}>Tipo documento</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginBottom:'12px' }}>
                {TIPI.map(t => {
                  const { Icon:TIcon }=t; const sel=form.tipo===t.key
                  return (
                    <div key={t.key} onClick={()=>setForm(p=>({...p,tipo:t.key}))}
                      style={{ padding:'9px 10px', borderRadius:'10px', cursor:'pointer', border:`2px solid ${sel?t.color:'#f0f1f4'}`, background:sel?t.bg:'#feffff', display:'flex', alignItems:'center', gap:'8px', transition:'all 0.15s' }}>
                      <TIcon size={16} color={sel?t.color:'#bec1cc'}/>
                      <span style={{ fontSize:f(12), fontWeight:'700', color:sel?t.color:'#394058' }}>{t.label}</span>
                    </div>
                  )
                })}
              </div>

              <label style={lbStyle}>Data</label>
              <input value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))} placeholder="gg/mm/aaaa"
                style={{ ...inStyle, marginBottom:'12px' }}
                onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              <label style={lbStyle}>File allegato</label>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} style={{ display:'none' }}/>

              {form.url ? (
                <div style={{ marginBottom:'12px' }}>
                  {detectContent(form.url,form.filename)?.type==='image' ? (
                    <div style={{ position:'relative', borderRadius:'12px', overflow:'hidden', marginBottom:'8px', background:'#f3f4f7' }}>
                      <img src={form.url} alt="anteprima" style={{ width:'100%', maxHeight:'160px', objectFit:'contain', display:'block' }}/>
                    </div>
                  ) : (
                    <div style={{ background:'#f3f4f7', borderRadius:'12px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                      <FileText size={22} color="#2e84e9"/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:f(12), fontWeight:'700', color:'#02153f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{form.filename||'File allegato'}</div>
                        <div style={{ fontSize:f(10), color:'#7c8088' }}>{detectContent(form.url,form.filename)?.type?.toUpperCase()||'FILE'}</div>
                      </div>
                    </div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    <button type="button" onClick={()=>fileInputRef.current?.click()} style={{ padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', background:'#EEF3FD', color:'#2e84e9', fontWeight:'700', fontSize:f(11), display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', fontFamily:'inherit' }}><Upload size={13} color="#2e84e9"/> Sostituisci</button>
                    <button type="button" onClick={rimuoviFile} style={{ padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', background:'#FEF0F4', color:'#F7295A', fontWeight:'700', fontSize:f(11), display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', fontFamily:'inherit' }}><X size={13} color="#F7295A"/> Rimuovi</button>
                  </div>
                </div>
              ) : (
                <div onClick={()=>fileInputRef.current?.click()}
                  style={{ border:'2px dashed #dde0ed', borderRadius:'14px', padding:'20px', textAlign:'center', cursor:'pointer', marginBottom:'12px', background:'#fafbff', transition:'border-color 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#2e84e9'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#dde0ed'}>
                  {uploading ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'28px', height:'28px', border:'3px solid #EEF3FD', borderTop:'3px solid #2e84e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                      <span style={{ fontSize:f(12), color:'#7c8088' }}>Caricamento in corso...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} color="#bec1cc" style={{ margin:'0 auto 8px', display:'block' }}/>
                      <div style={{ fontSize:f(13), fontWeight:'700', color:'#394058', marginBottom:'4px' }}>Tocca per selezionare un file</div>
                      <div style={{ fontSize:f(10), color:'#bec1cc' }}>Immagini, PDF, Word, Excel · Max 10MB</div>
                    </>
                  )}
                </div>
              )}

              {uploadError && (
                <div style={{ background:'#FEF0F4', borderRadius:'10px', padding:'10px 12px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <AlertCircle size={15} color="#F7295A"/>
                  <span style={{ fontSize:f(12), color:'#F7295A', fontWeight:'600' }}>{uploadError}</span>
                </div>
              )}

              <label style={lbStyle}>Note</label>
              <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Es: Dr. Rossi, scadenza 30 giorni..." rows={2}
                style={{ ...inStyle, resize:'none', marginBottom:'16px' }}
                onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              <button type="button" onClick={handleSalva}
                style={{ width:'100%', padding:'15px', borderRadius:'50px', border:'none', cursor:'pointer', fontWeight:'800', fontSize:f(15), color:'#fff', background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#2e84e9,#7B5EA7)', boxShadow:'0 6px 20px rgba(46,132,233,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.3s', fontFamily:'inherit' }}>
                {saved?<><Check size={18} color="#fff"/>Salvato!</>:<>{editTarget?'Aggiorna documento':'Aggiungi documento'}</>}
              </button>
              {isDemo&&<div style={{ textAlign:'center', marginTop:'10px', fontSize:f(11), color:'#8B6914', fontWeight:'600' }}>Demo — non salvato su Firebase</div>}
            </div>
          </div>
        )}

        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, FileText, Search, ExternalLink, Eye, Download, ZoomIn } from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const TIPI = [
  { key:'eeg',        label:'EEG',           color:'#F7295A', bg:'#FEF0F4', emoji:'🧠' },
  { key:'ricetta',    label:'Ricetta',        color:'#2e84e9', bg:'#EEF3FD', emoji:'💊' },
  { key:'referto',    label:'Referto',        color:'#7B5EA7', bg:'#F5F3FF', emoji:'📋' },
  { key:'certificato',label:'Certificato',    color:'#00BFA6', bg:'#E8FBF8', emoji:'🏥' },
  { key:'analisi',    label:'Analisi',        color:'#FF8C42', bg:'#FFF5EE', emoji:'🔬' },
  { key:'verbale',    label:'Verbale',        color:'#193f9e', bg:'#EEF3FD', emoji:'📄' },
  { key:'foto',       label:'Foto',           color:'#e67e22', bg:'#FFF5EE', emoji:'📷' },
  { key:'tessera',    label:'Tessera',        color:'#8e44ad', bg:'#F5F3FF', emoji:'💳' },
  { key:'altro',      label:'Altro',          color:'#394058', bg:'#f3f4f7', emoji:'📎' },
]

const CATEGORIE = [
  { key:'medici',    label:'Medici',     color:'#F7295A', grad:'linear-gradient(135deg,#F7295A,#7B5EA7)' },
  { key:'personali', label:'Personali',  color:'#2e84e9', grad:'linear-gradient(135deg,#2e84e9,#00BFA6)' },
  { key:'scuola',    label:'Scuola',     color:'#FF8C42', grad:'linear-gradient(135deg,#FF8C42,#FFD93D)' },
]

function getTipo(key){ return TIPI.find(t=>t.key===key)||TIPI[TIPI.length-1] }
function getCat(key){ return CATEGORIE.find(c=>c.key===key)||CATEGORIE[0] }

const oggi=new Date()
const fmtOggi=`${String(oggi.getDate()).padStart(2,'0')}/${String(oggi.getMonth()+1).padStart(2,'0')}/${oggi.getFullYear()}`

const DEMO_DOCS=[
  { id:1, tipo:'eeg',         categoria:'medici',    nome:'EEG 12-04-2026',           data:fmtOggi,      url:'', note:'Ambulatorio neurologia',   _firebaseKey:'dd1' },
  { id:2, tipo:'ricetta',     categoria:'medici',    nome:'Ricetta Keppra apr-2026',   data:'01/04/2026', url:'', note:'Valida 30 giorni',         _firebaseKey:'dd2' },
  { id:3, tipo:'referto',     categoria:'medici',    nome:'Visita neurologica mar-26', data:'15/03/2026', url:'', note:'Dr. Rossi',                _firebaseKey:'dd3' },
  { id:4, tipo:'tessera',     categoria:'personali', nome:'Tessera sanitaria',         data:'01/01/2026', url:'', note:'Scadenza 2030',             _firebaseKey:'dd4' },
  { id:5, tipo:'certificato', categoria:'personali', nome:'Certificato di disabilità', data:'10/01/2025', url:'', note:'L.104 art.3 c.3',          _firebaseKey:'dd5' },
  { id:6, tipo:'verbale',     categoria:'scuola',    nome:'Piano educativo 2025/26',   data:'10/09/2025', url:'', note:'PEI approvato',             _firebaseKey:'dd6' },
  { id:7, tipo:'foto',        categoria:'personali', nome:'Foto documento',            data:'01/01/2026', url:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg', note:'Fronte/retro',  _firebaseKey:'dd7' },
]

const EMPTY_FORM={ tipo:'referto', categoria:'medici', nome:'', data:fmtOggi, url:'', note:'' }

// ── Lightbox anteprima ────────────────────────────────────────
function Lightbox({ doc, onClose }) {
  const tipo = getTipo(doc.tipo)
  const isImage = doc.url && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(doc.url)
  const isPDF   = doc.url && /\.pdf/i.test(doc.url)

  useEffect(()=>{
    document.body.style.overflow='hidden'
    function onKey(e){ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',onKey)
    return()=>{ document.body.style.overflow=''; window.removeEventListener('keydown',onKey) }
  },[])

  return(
    <div
      onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.96)',zIndex:9000,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif",cursor:'pointer'}}
    >
      {/* Header */}
      <div
        onClick={e=>e.stopPropagation()}
        style={{position:'fixed',top:0,left:0,right:0,background:'rgba(0,0,0,0.7)',padding:'16px 20px',display:'flex',alignItems:'center',gap:'12px',zIndex:9001,backdropFilter:'blur(10px)'}}
      >
        <div style={{width:'36px',height:'36px',borderRadius:'10px',background:tipo.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
          {tipo.emoji}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:f(14),fontWeight:'800',color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{doc.nome}</div>
          <div style={{fontSize:f(11),color:'rgba(255,255,255,0.5)'}}>{doc.data} · {tipo.label}</div>
        </div>
        <div style={{display:'flex',gap:'8px',flexShrink:0}}>
          {doc.url&&(
            <button
              onClick={e=>{e.stopPropagation();window.open(doc.url,'_blank')}}
              style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
            >
              <ExternalLink size={16} color="#fff"/>
            </button>
          )}
          <button
            onClick={onClose}
            style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
          >
            <X size={18} color="#fff"/>
          </button>
        </div>
      </div>

      {/* Contenuto */}
      <div
        onClick={e=>e.stopPropagation()}
        style={{width:'100%',maxWidth:'480px',marginTop:'70px',marginBottom:'20px',padding:'0 16px',display:'flex',flexDirection:'column',alignItems:'center'}}
      >
        {isImage ? (
          <img
            src={doc.url} alt={doc.nome}
            style={{width:'100%',maxHeight:'60vh',objectFit:'contain',borderRadius:'12px',boxShadow:'0 0 40px rgba(255,255,255,0.1)'}}
          />
        ) : isPDF ? (
          <iframe
            src={doc.url} title={doc.nome}
            style={{width:'100%',height:'65vh',border:'none',borderRadius:'12px',background:'#fff'}}
          />
        ) : (
          // Nessun URL — mostra scheda dettaglio
          <div style={{background:'rgba(255,255,255,0.08)',borderRadius:'20px',padding:'28px',width:'100%',textAlign:'center'}}>
            <div style={{fontSize:'56px',marginBottom:'16px'}}>{tipo.emoji}</div>
            <div style={{fontSize:f(20),fontWeight:'900',color:'#fff',marginBottom:'8px'}}>{doc.nome}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',justifyContent:'center',marginBottom:'16px'}}>
              <span style={{padding:'4px 12px',borderRadius:'20px',background:tipo.color+'33',color:tipo.color,fontWeight:'700',fontSize:f(12)}}>{tipo.label}</span>
              <span style={{padding:'4px 12px',borderRadius:'20px',background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)',fontWeight:'700',fontSize:f(12)}}>{doc.data}</span>
              <span style={{padding:'4px 12px',borderRadius:'20px',background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)',fontWeight:'700',fontSize:f(12)}}>{getCat(doc.categoria).label}</span>
            </div>
            {doc.note&&(
              <div style={{background:'rgba(255,255,255,0.06)',borderRadius:'12px',padding:'12px 16px',fontSize:f(13),color:'rgba(255,255,255,0.6)',lineHeight:'1.6',fontStyle:'italic'}}>
                📝 {doc.note}
              </div>
            )}
            {!doc.url&&(
              <div style={{marginTop:'16px',fontSize:f(11),color:'rgba(255,255,255,0.3)'}}>
                Nessun file allegato — aggiungi un link nella modifica
              </div>
            )}
          </div>
        )}

        {/* Note sotto l'immagine */}
        {doc.note&&(isImage||isPDF)&&(
          <div style={{marginTop:'14px',padding:'10px 14px',background:'rgba(255,255,255,0.08)',borderRadius:'12px',fontSize:f(12),color:'rgba(255,255,255,0.6)',width:'100%',textAlign:'center'}}>
            📝 {doc.note}
          </div>
        )}
      </div>

      {/* Tap per chiudere */}
      <div style={{position:'fixed',bottom:'24px',fontSize:f(11),color:'rgba(255,255,255,0.25)'}}>
        Tocca lo schermo per chiudere
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
export default function DocumentiPage({ onBack, isDemo, categoria: catIniziale }) {
  const [documenti,setDocumenti]   = useState([])
  const [loading,setLoading]       = useState(true)
  const [showForm,setShowForm]     = useState(false)
  const [editTarget,setEditTarget] = useState(null)
  const [form,setForm]             = useState({...EMPTY_FORM,categoria:catIniziale||'medici'})
  const [search,setSearch]         = useState('')
  const [filtroTipo,setFiltroTipo] = useState('tutti')
  const [filtroCat,setFiltroCat]   = useState(catIniziale||'tutti')
  const [saved,setSaved]           = useState(false)
  const [preview,setPreview]       = useState(null) // doc da mostrare in lightbox

  useEffect(()=>{
    if(isDemo){setDocumenti(DEMO_DOCS);setLoading(false);return}
    const r=ref(db,'documents')
    const u=onValue(r,snap=>{setDocumenti(processFirebaseSnap(snap).sort((a,b)=>(b.id||0)-(a.id||0)));setLoading(false)})
    return()=>u()
  },[isDemo])

  function apriNuovo(){ setForm({...EMPTY_FORM,categoria:filtroCat!=='tutti'?filtroCat:'medici'}); setEditTarget(null); setShowForm(true) }
  function apriModifica(d){
    setForm({tipo:d.tipo||'altro',categoria:d.categoria||'medici',nome:d.nome||'',data:d.data||'',url:d.url||'',note:d.note||''})
    setEditTarget(d); setShowForm(true)
  }

  function handleSalva(){
    if(!form.nome.trim()){alert('Inserisci il nome del documento');return}
    const doc={id:editTarget?.id||Date.now(),...form,nome:form.nome.trim()}
    if(!isDemo){
      if(editTarget?._firebaseKey) set(ref(db,`documents/${editTarget._firebaseKey}`),encrypt(doc))
      else push(ref(db,'documents'),encrypt(doc))
    } else {
      if(editTarget) setDocumenti(prev=>prev.map(d=>d.id===editTarget.id?{...doc,_firebaseKey:d._firebaseKey}:d))
      else setDocumenti(prev=>[{...doc,_firebaseKey:`demo_${Date.now()}`},...prev])
    }
    setSaved(true)
    setTimeout(()=>{setSaved(false);setShowForm(false)},1200)
  }

  function handleElimina(d){
    if(!window.confirm(`Eliminare "${d.nome}"?`))return
    if(!isDemo&&d._firebaseKey) remove(ref(db,`documents/${d._firebaseKey}`))
    else setDocumenti(prev=>prev.filter(x=>x.id!==d.id))
  }

  const docsFiltrati = documenti.filter(d=>{
    const mS = !search||(d.nome||'').toLowerCase().includes(search.toLowerCase())||(d.note||'').toLowerCase().includes(search.toLowerCase())
    const mT = filtroTipo==='tutti'||d.tipo===filtroTipo
    const mC = filtroCat==='tutti'||d.categoria===filtroCat
    return mS&&mT&&mC
  })

  const inStyle={width:'100%',padding:'11px 12px',borderRadius:'12px',border:'1.5px solid #f0f1f4',fontSize:f(13),color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}
  const lbStyle={fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'5px',display:'block'}

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}><FileText size={36} color="#bec1cc" style={{margin:'0 auto 10px',display:'block'}}/><div style={{fontSize:f(13),color:'#bec1cc'}}>Caricamento documenti...</div></div>
    </div>
  )

  return(
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.dc-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="dc-wrap">

        {/* Lightbox */}
        {preview && <Lightbox doc={preview} onClose={()=>setPreview(null)}/>}

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#2e84e9,#7B5EA7)',padding:'14px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div style={{flex:1}}>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>📂 Documenti</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                {isDemo?'🎭 Dati demo':`${documenti.length} documenti`}
              </div>
            </div>
            <button onClick={apriNuovo} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <Plus size={20} color="#fff"/>
            </button>
          </div>

          {/* Tab categorie nell'header */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'6px',marginBottom:'12px'}}>
            <button onClick={()=>setFiltroCat('tutti')} style={{padding:'7px 4px',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:filtroCat==='tutti'?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.15)',color:filtroCat==='tutti'?'#2e84e9':'#fff'}}>
              Tutti<br/><span style={{fontSize:f(14),fontWeight:'900'}}>{documenti.length}</span>
            </button>
            {CATEGORIE.map(c=>{
              const n=documenti.filter(d=>d.categoria===c.key).length
              return(
                <button key={c.key} onClick={()=>setFiltroCat(c.key)} style={{padding:'7px 4px',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:filtroCat===c.key?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.15)',color:filtroCat===c.key?c.color:'#fff'}}>
                  {c.label}<br/><span style={{fontSize:f(14),fontWeight:'900'}}>{n}</span>
                </button>
              )
            })}
          </div>

          {/* Ricerca */}
          <div style={{position:'relative'}}>
            <Search size={15} color="#bec1cc" style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca documento..." style={{...inStyle,paddingLeft:'34px',background:'rgba(255,255,255,0.95)',border:'none'}}/>
          </div>
        </div>

        {/* Filtri tipo (scrollabile) */}
        <div style={{padding:'10px 12px 0',overflowX:'auto'}}>
          <div style={{display:'flex',gap:'5px',paddingBottom:'4px',width:'max-content'}}>
            <button onClick={()=>setFiltroTipo('tutti')} style={{padding:'5px 10px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:filtroTipo==='tutti'?'#394058':'#f3f4f7',color:filtroTipo==='tutti'?'#fff':'#7c8088',whiteSpace:'nowrap'}}>
              Tutti tipi
            </button>
            {TIPI.map(t=>{
              const n=documenti.filter(d=>d.tipo===t.key).length
              if(n===0)return null
              return(
                <button key={t.key} onClick={()=>setFiltroTipo(t.key)} style={{padding:'5px 10px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:filtroTipo===t.key?t.color:t.bg,color:filtroTipo===t.key?'#fff':t.color,whiteSpace:'nowrap'}}>
                  {t.emoji} {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{padding:'10px 12px'}}>

          {docsFiltrati.length===0?(
            <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh,marginTop:'8px'}}>
              <FileText size={40} color="#bec1cc" style={{margin:'0 auto 12px',display:'block'}}/>
              <div style={{fontSize:f(14),color:'#7c8088',marginBottom:'4px'}}>
                {search||filtroTipo!=='tutti'||filtroCat!=='tutti'?'Nessun risultato':'Nessun documento'}
              </div>
              {!search&&filtroTipo==='tutti'&&filtroCat==='tutti'&&(
                <div style={{fontSize:f(12),color:'#bec1cc'}}>Aggiungi il primo documento con il +</div>
              )}
            </div>
          ):(
            docsFiltrati.map((d,i)=>{
              const tipo=getTipo(d.tipo)
              const cat=getCat(d.categoria)
              const hasFile=!!d.url
              const isImage=hasFile&&/\.(jpg|jpeg|png|gif|webp|svg)/i.test(d.url)

              return(
                <div key={d.id||i} style={{background:'#feffff',borderRadius:'18px',marginBottom:'10px',boxShadow:shSm,overflow:'hidden'}}>

                  {/* Anteprima immagine in cima se c'è */}
                  {isImage&&(
                    <div
                      onClick={()=>setPreview(d)}
                      style={{width:'100%',height:'120px',overflow:'hidden',cursor:'pointer',position:'relative',background:'#f3f4f7'}}
                    >
                      <img src={d.url} alt={d.nome} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.15)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity 0.2s'}}
                        onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                        onMouseLeave={e=>e.currentTarget.style.opacity='0'}
                      >
                        <ZoomIn size={28} color="#fff"/>
                      </div>
                      <div style={{position:'absolute',bottom:'6px',right:'6px',background:'rgba(0,0,0,0.5)',borderRadius:'8px',padding:'3px 8px',fontSize:f(10),color:'#fff',fontWeight:'700'}}>
                        👁 Anteprima
                      </div>
                    </div>
                  )}

                  <div style={{padding:'12px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                      {/* Icona tipo */}
                      <div
                        onClick={()=>setPreview(d)}
                        style={{width:'44px',height:'44px',borderRadius:'12px',background:tipo.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'22px',cursor:'pointer',boxShadow:`0 3px 10px ${tipo.color}44`}}
                      >
                        {tipo.emoji}
                      </div>

                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div
                          onClick={()=>setPreview(d)}
                          style={{fontSize:f(14),fontWeight:'800',color:'#02153f',marginBottom:'5px',cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                        >
                          {d.nome}
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'5px',flexWrap:'wrap'}}>
                          <span style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:tipo.bg,color:tipo.color}}>{tipo.emoji} {tipo.label}</span>
                          <span style={{fontSize:f(10),fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:cat.color+'18',color:cat.color}}>{cat.label}</span>
                          {d.data&&<span style={{fontSize:f(10),color:'#bec1cc'}}>{d.data}</span>}
                          {hasFile&&!isImage&&<span style={{fontSize:f(10),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#E8FBF8',color:'#00BFA6'}}>📎 file</span>}
                        </div>
                        {d.note&&<div style={{fontSize:f(10),color:'#bec1cc',marginTop:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>📝 {d.note}</div>}
                      </div>

                      {/* Azioni */}
                      <div style={{display:'flex',flexDirection:'column',gap:'5px',flexShrink:0}}>
                        <button onClick={()=>setPreview(d)} style={{width:'30px',height:'30px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} title="Anteprima">
                          <Eye size={13} color="#7c8088"/>
                        </button>
                        <button onClick={()=>apriModifica(d)} style={{width:'30px',height:'30px',borderRadius:'50%',background:'#EEF3FD',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} title="Modifica">
                          <Edit2 size={13} color="#2e84e9"/>
                        </button>
                        <button onClick={()=>handleElimina(d)} style={{width:'30px',height:'30px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} title="Elimina">
                          <Trash2 size={13} color="#F7295A"/>
                        </button>
                      </div>
                    </div>

                    {/* Pulsante apri file (non immagine) */}
                    {hasFile&&!isImage&&(
                      <button onClick={()=>window.open(d.url,'_blank')} style={{width:'100%',marginTop:'10px',padding:'9px',borderRadius:'10px',border:'none',cursor:'pointer',background:'#EEF3FD',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',fontWeight:'700',fontSize:f(11),color:'#2e84e9',fontFamily:'inherit'}}>
                        <ExternalLink size={13} color="#2e84e9"/> Apri documento
                      </button>
                    )}
                    {hasFile&&isImage&&(
                      <button onClick={()=>setPreview(d)} style={{width:'100%',marginTop:'10px',padding:'9px',borderRadius:'10px',border:'none',cursor:'pointer',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',fontWeight:'700',fontSize:f(11),color:'#7c8088',fontFamily:'inherit'}}>
                        <ZoomIn size={13} color="#7c8088"/> Vedi a schermo intero
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* MODAL FORM */}
        {showForm&&(
          <div style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.55)',zIndex:2000,display:'flex',alignItems:'flex-end',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
            <div style={{background:'#feffff',borderRadius:'24px 24px 0 0',padding:'20px',width:'100%',maxWidth:'480px',maxHeight:'92vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <span style={{fontSize:f(16),fontWeight:'900',color:'#02153f'}}>{editTarget?'Modifica documento':'Nuovo documento'}</span>
                <button onClick={()=>setShowForm(false)} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <X size={16} color="#7c8088"/>
                </button>
              </div>

              {/* Nome */}
              <label style={lbStyle}>Nome documento *</label>
              <input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Es: EEG 12/04/2026" style={{...inStyle,marginBottom:'12px'}}
                onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              {/* Categoria */}
              <label style={lbStyle}>Categoria</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'12px'}}>
                {CATEGORIE.map(c=>(
                  <div key={c.key} onClick={()=>setForm(p=>({...p,categoria:c.key}))} style={{padding:'9px 6px',borderRadius:'12px',cursor:'pointer',textAlign:'center',border:`2px solid ${form.categoria===c.key?c.color:'#f0f1f4'}`,background:form.categoria===c.key?c.color+'18':'#feffff',transition:'all 0.15s'}}>
                    <div style={{fontSize:f(12),fontWeight:'800',color:form.categoria===c.key?c.color:'#394058'}}>{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Tipo */}
              <label style={lbStyle}>Tipo</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'12px'}}>
                {TIPI.map(t=>(
                  <div key={t.key} onClick={()=>setForm(p=>({...p,tipo:t.key}))} style={{padding:'9px 10px',borderRadius:'10px',cursor:'pointer',border:`2px solid ${form.tipo===t.key?t.color:'#f0f1f4'}`,background:form.tipo===t.key?t.bg:'#feffff',display:'flex',alignItems:'center',gap:'8px',transition:'all 0.15s'}}>
                    <span style={{fontSize:'18px'}}>{t.emoji}</span>
                    <span style={{fontSize:f(12),fontWeight:'700',color:form.tipo===t.key?t.color:'#394058'}}>{t.label}</span>
                  </div>
                ))}
              </div>

              {/* Data + Link */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div>
                  <label style={lbStyle}>Data</label>
                  <input value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))} placeholder="gg/mm/aaaa" style={inStyle}
                    onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
                <div>
                  <label style={lbStyle}>Link file (opz.)</label>
                  <input value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))} placeholder="https://..." type="url" style={inStyle}
                    onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
              </div>
              {form.url&&<div style={{fontSize:f(11),color:'#7c8088',marginBottom:'10px',padding:'6px 10px',background:'#f3f4f7',borderRadius:'8px'}}>💡 Incolla il link diretto al file (Google Drive, Dropbox, ecc.)</div>}

              {/* Note */}
              <label style={lbStyle}>Note</label>
              <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Es: Dr. Rossi, scadenza 30 giorni..." rows={2} style={{...inStyle,resize:'none',marginBottom:'16px'}}
                onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              <button onClick={handleSalva} style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#2e84e9,#7B5EA7)',boxShadow:'0 6px 20px rgba(46,132,233,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.3s'}}>
                {saved?<><Check size={18} color="#fff"/>Salvato!</>:<>{editTarget?'Aggiorna documento':'Aggiungi documento'}</>}
              </button>
              {isDemo&&<div style={{textAlign:'center',marginTop:'10px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Demo — non salvato su Firebase</div>}
            </div>
          </div>
        )}

      </div>
    </>
  )
}

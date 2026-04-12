import { useState, useEffect } from 'react'
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, FileText, Search, Download, ExternalLink } from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const TIPI = [
  { key:'eeg',        label:'EEG',                color:'#F7295A', bg:'#FEF0F4', emoji:'🧠' },
  { key:'ricetta',    label:'Ricetta',            color:'#2e84e9', bg:'#EEF3FD', emoji:'💊' },
  { key:'referto',    label:'Referto',            color:'#7B5EA7', bg:'#F5F3FF', emoji:'📋' },
  { key:'certificato',label:'Certificato',        color:'#00BFA6', bg:'#E8FBF8', emoji:'🏥' },
  { key:'analisi',    label:'Analisi',            color:'#FF8C42', bg:'#FFF5EE', emoji:'🔬' },
  { key:'verbale',    label:'Verbale',            color:'#193f9e', bg:'#EEF3FD', emoji:'📄' },
  { key:'altro',      label:'Altro',              color:'#394058', bg:'#f3f4f7', emoji:'📎' },
]

const CATEGORIE = [
  { key:'medici',    label:'Documenti medici' },
  { key:'personali', label:'Documenti personali' },
  { key:'scuola',    label:'Scuola' },
]

function getTipo(key) { return TIPI.find(t=>t.key===key)||TIPI[TIPI.length-1] }

const oggi = new Date()
const fmtOggi = `${String(oggi.getDate()).padStart(2,'0')}/${String(oggi.getMonth()+1).padStart(2,'0')}/${oggi.getFullYear()}`

const DEMO_DOCS = [
  { id:1, tipo:'eeg',         categoria:'medici',    nome:'EEG 12-04-2026',          data:fmtOggi,          url:'', note:'Ambulatorio neurologia', _firebaseKey:'dd1' },
  { id:2, tipo:'ricetta',     categoria:'medici',    nome:'Ricetta Keppra apr-2026',  data:'01/04/2026',     url:'', note:'Valida 30 giorni',       _firebaseKey:'dd2' },
  { id:3, tipo:'referto',     categoria:'medici',    nome:'Visita neurologica mar-26', data:'15/03/2026',    url:'', note:'Dr. Rossi',              _firebaseKey:'dd3' },
  { id:4, tipo:'certificato', categoria:'personali', nome:'Tessera sanitaria',        data:'01/01/2026',    url:'', note:'Scadenza 2030',           _firebaseKey:'dd4' },
  { id:5, tipo:'verbale',     categoria:'scuola',    nome:'Piano educativo 2026',     data:'10/09/2025',    url:'', note:'PEI approvato',           _firebaseKey:'dd5' },
]

const EMPTY_FORM = { tipo:'referto', categoria:'medici', nome:'', data: `${String(oggi.getDate()).padStart(2,'0')}/${String(oggi.getMonth()+1).padStart(2,'0')}/${oggi.getFullYear()}`, url:'', note:'' }

export default function DocumentiPage({ onBack, isDemo, categoria: catIniziale }) {
  const [documenti, setDocumenti]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState({...EMPTY_FORM, categoria: catIniziale||'medici'})
  const [search, setSearch]         = useState('')
  const [filtroTipo, setFiltroTipo] = useState('tutti')
  const [filtroCategoria, setFiltroCategoria] = useState(catIniziale||'tutti')
  const [saved, setSaved]           = useState(false)

  useEffect(()=>{
    if(isDemo){setDocumenti(DEMO_DOCS);setLoading(false);return}
    const r=ref(db,'documents')
    const unsub=onValue(r,snap=>{
      setDocumenti(processFirebaseSnap(snap).sort((a,b)=>(b.id||0)-(a.id||0)))
      setLoading(false)
    })
    return()=>unsub()
  },[isDemo])

  function apriNuovo(){ setForm({...EMPTY_FORM,categoria:filtroCategoria!=='tutti'?filtroCategoria:'medici'}); setEditTarget(null); setShowForm(true) }
  function apriModifica(d){ setForm({tipo:d.tipo||'altro',categoria:d.categoria||'medici',nome:d.nome||'',data:d.data||'',url:d.url||'',note:d.note||''}); setEditTarget(d); setShowForm(true) }

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
    const matchS = !search || (d.nome||'').toLowerCase().includes(search.toLowerCase()) || (d.note||'').toLowerCase().includes(search.toLowerCase())
    const matchT  = filtroTipo==='tutti'||d.tipo===filtroTipo
    const matchC  = filtroCategoria==='tutti'||d.categoria===filtroCategoria
    return matchS&&matchT&&matchC
  })

  const inStyle = {width:'100%',padding:'11px 12px',borderRadius:'12px',border:'1.5px solid #f0f1f4',fontSize:f(13),color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}
  const lbStyle = {fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'5px',display:'block'}

  const headerGrad = 'linear-gradient(135deg,#2e84e9,#7B5EA7)'

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:'center'}}><FileText size={36} color="#bec1cc" style={{margin:'0 auto 10px',display:'block'}}/><div style={{fontSize:f(13),color:'#bec1cc'}}>Caricamento documenti...</div></div>
    </div>
  )

  return(
    <>
      <style>{`*{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}.dc-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}`}</style>
      <div className="dc-wrap">

        {/* HEADER */}
        <div style={{background:headerGrad,padding:'14px 16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronLeft size={20} color="#fff"/>
            </button>
            <div>
              <div style={{fontSize:f(18),fontWeight:'900',color:'#fff'}}>📂 Documenti</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.75)'}}>
                {isDemo?'🎭 Dati demo':`${documenti.length} documenti`}
              </div>
            </div>
            <button onClick={apriNuovo} style={{marginLeft:'auto',width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <Plus size={20} color="#fff"/>
            </button>
          </div>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
            {CATEGORIE.map(c=>{
              const n=documenti.filter(d=>d.categoria===c.key).length
              return(
                <div key={c.key} style={{background:'rgba(255,255,255,0.15)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                  <div style={{fontSize:f(20),fontWeight:'900',color:'#fff'}}>{n}</div>
                  <div style={{fontSize:f(9),color:'rgba(255,255,255,0.75)',marginTop:'1px'}}>{c.label.split(' ')[1]||c.label}</div>
                </div>
              )
            })}
          </div>
          {/* Ricerca */}
          <div style={{position:'relative'}}>
            <Search size={15} color="#bec1cc" style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca documento..." style={{...inStyle,paddingLeft:'34px',background:'rgba(255,255,255,0.95)',border:'none'}}/>
          </div>
        </div>

        {/* FILTRI CATEGORIA */}
        <div style={{padding:'10px 12px 0',overflowX:'auto'}}>
          <div style={{display:'flex',gap:'6px',paddingBottom:'4px',width:'max-content'}}>
            <button onClick={()=>setFiltroCategoria('tutti')} style={{padding:'6px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:filtroCategoria==='tutti'?'#2e84e9':'#feffff',color:filtroCategoria==='tutti'?'#fff':'#7c8088',whiteSpace:'nowrap'}}>
              Tutti ({documenti.length})
            </button>
            {CATEGORIE.map(c=>{
              const n=documenti.filter(d=>d.categoria===c.key).length
              return(
                <button key={c.key} onClick={()=>setFiltroCategoria(c.key)} style={{padding:'6px 12px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(11),fontFamily:'inherit',background:filtroCategoria===c.key?'#7B5EA7':'#feffff',color:filtroCategoria===c.key?'#fff':'#7c8088',whiteSpace:'nowrap'}}>
                  {c.label} ({n})
                </button>
              )
            })}
          </div>
        </div>

        {/* FILTRI TIPO */}
        <div style={{padding:'6px 12px 0',overflowX:'auto'}}>
          <div style={{display:'flex',gap:'5px',paddingBottom:'4px',width:'max-content'}}>
            <button onClick={()=>setFiltroTipo('tutti')} style={{padding:'4px 10px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:filtroTipo==='tutti'?'#394058':'#f3f4f7',color:filtroTipo==='tutti'?'#fff':'#7c8088'}}>
              Tutti
            </button>
            {TIPI.map(t=>{
              const n=documenti.filter(d=>d.tipo===t.key).length
              if(n===0)return null
              return(
                <button key={t.key} onClick={()=>setFiltroTipo(t.key)} style={{padding:'4px 10px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(10),fontFamily:'inherit',background:filtroTipo===t.key?t.color:t.bg,color:filtroTipo===t.key?'#fff':t.color,whiteSpace:'nowrap'}}>
                  {t.emoji} {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{padding:'10px 12px'}}>
          {docsFiltrati.length===0 ? (
            <div style={{background:'#feffff',borderRadius:'18px',padding:'32px',textAlign:'center',boxShadow:sh,marginTop:'8px'}}>
              <FileText size={40} color="#bec1cc" style={{margin:'0 auto 12px',display:'block'}}/>
              <div style={{fontSize:f(14),color:'#7c8088',marginBottom:'4px'}}>
                {search||filtroTipo!=='tutti'||filtroCategoria!=='tutti'?'Nessun risultato':'Nessun documento'}
              </div>
              <div style={{fontSize:f(12),color:'#bec1cc'}}>
                {!search&&filtroTipo==='tutti'&&filtroCategoria==='tutti'&&'Aggiungi il primo documento con il +'}
              </div>
            </div>
          ) : (
            docsFiltrati.map((d,i)=>{
              const tipo=getTipo(d.tipo)
              return(
                <div key={d.id||i} style={{background:'#feffff',borderRadius:'16px',padding:'12px',marginBottom:'8px',boxShadow:shSm}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                    {/* Icona tipo */}
                    <div style={{width:'42px',height:'42px',borderRadius:'12px',background:tipo.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'20px'}}>
                      {tipo.emoji}
                    </div>
                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:f(13),fontWeight:'800',color:'#02153f',marginBottom:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.nome}</div>
                      <div style={{display:'flex',alignItems:'center',gap:'5px',flexWrap:'wrap',marginBottom:'3px'}}>
                        <span style={{fontSize:f(10),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:tipo.bg,color:tipo.color}}>{tipo.label}</span>
                        {d.categoria&&<span style={{fontSize:f(10),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#f3f4f7',color:'#7c8088'}}>{CATEGORIE.find(c=>c.key===d.categoria)?.label.split(' ')[1]||d.categoria}</span>}
                        {d.data&&<span style={{fontSize:f(10),color:'#bec1cc'}}>{d.data}</span>}
                      </div>
                      {d.note&&<div style={{fontSize:f(10),color:'#bec1cc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>📝 {d.note}</div>}
                    </div>
                    {/* Azioni */}
                    <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0}}>
                      <button onClick={()=>apriModifica(d)} style={{width:'28px',height:'28px',borderRadius:'50%',background:'#EEF3FD',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <Edit2 size={12} color="#2e84e9"/>
                      </button>
                      <button onClick={()=>handleElimina(d)} style={{width:'28px',height:'28px',borderRadius:'50%',background:'#FEF0F4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <Trash2 size={12} color="#F7295A"/>
                      </button>
                    </div>
                  </div>
                  {/* Link documento se presente */}
                  {d.url&&(
                    <button onClick={()=>window.open(d.url,'_blank')} style={{width:'100%',marginTop:'8px',padding:'8px',borderRadius:'10px',border:'none',cursor:'pointer',background:'#EEF3FD',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',fontWeight:'700',fontSize:f(11),color:'#2e84e9',fontFamily:'inherit'}}>
                      <ExternalLink size={13} color="#2e84e9"/> Apri documento
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* MODAL FORM */}
        {showForm&&(
          <div style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.5)',zIndex:2000,display:'flex',alignItems:'flex-end',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
            <div style={{background:'#feffff',borderRadius:'24px 24px 0 0',padding:'20px',width:'100%',maxWidth:'480px',maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <span style={{fontSize:f(16),fontWeight:'900',color:'#02153f'}}>{editTarget?'Modifica documento':'Nuovo documento'}</span>
                <button onClick={()=>setShowForm(false)} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <X size={16} color="#7c8088"/>
                </button>
              </div>

              <label style={lbStyle}>Nome documento *</label>
              <input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Es: EEG 12/04/2026" style={{...inStyle,marginBottom:'12px'}}
                onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              <label style={lbStyle}>Tipo</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'12px'}}>
                {TIPI.map(t=>(
                  <div key={t.key} onClick={()=>setForm(p=>({...p,tipo:t.key}))} style={{padding:'8px 10px',borderRadius:'10px',cursor:'pointer',border:`2px solid ${form.tipo===t.key?t.color:'#f0f1f4'}`,background:form.tipo===t.key?t.bg:'#feffff',display:'flex',alignItems:'center',gap:'6px',transition:'all 0.15s'}}>
                    <span style={{fontSize:'16px'}}>{t.emoji}</span>
                    <span style={{fontSize:f(11),fontWeight:'700',color:form.tipo===t.key?t.color:'#394058'}}>{t.label}</span>
                  </div>
                ))}
              </div>

              <label style={lbStyle}>Categoria</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'12px'}}>
                {CATEGORIE.map(c=>(
                  <div key={c.key} onClick={()=>setForm(p=>({...p,categoria:c.key}))} style={{padding:'8px',borderRadius:'10px',cursor:'pointer',textAlign:'center',border:`2px solid ${form.categoria===c.key?'#2e84e9':'#f0f1f4'}`,background:form.categoria===c.key?'#EEF3FD':'#feffff',transition:'all 0.15s'}}>
                    <div style={{fontSize:f(10),fontWeight:'700',color:form.categoria===c.key?'#2e84e9':'#394058',lineHeight:'1.3'}}>{c.label.replace('Documenti ','')}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div>
                  <label style={lbStyle}>Data</label>
                  <input value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))} placeholder="gg/mm/aaaa" style={inStyle}
                    onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
                <div>
                  <label style={lbStyle}>Link (opz.)</label>
                  <input value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))} placeholder="https://..." type="url" style={inStyle}
                    onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>
                </div>
              </div>

              <label style={lbStyle}>Note</label>
              <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Es: Dr. Rossi, valida 30 giorni..." rows={2} style={{...inStyle,resize:'none',marginBottom:'16px'}}
                onFocus={e=>e.target.style.borderColor='#2e84e9'} onBlur={e=>e.target.style.borderColor='#f0f1f4'}/>

              <button onClick={handleSalva} style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:saved?'linear-gradient(135deg,#00BFA6,#2e84e9)':'linear-gradient(135deg,#2e84e9,#7B5EA7)',boxShadow:'0 6px 20px rgba(46,132,233,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.3s'}}>
                {saved?<><Check size={18} color="#fff"/> Salvato!</>:<>{editTarget?'Aggiorna':'Aggiungi documento'}</>}
              </button>
              {isDemo&&<div style={{textAlign:'center',marginTop:'10px',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>🎭 Demo — non salvato su Firebase</div>}
            </div>
          </div>
        )}

      </div>
    </>
  )
}

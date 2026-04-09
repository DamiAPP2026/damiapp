import { useState, useEffect } from 'react'
import {
  ChevronRight, AlertTriangle, Clock, Bell, Pill,
  Droplets, BookOpen, BarChart2, Package, Phone,
  Link, Settings, Home, ShoppingBag, FileText,
  CreditCard, X, Check, Pencil, ChevronUp
} from 'lucide-react'
import { db } from './firebase'
import { ref, onValue } from 'firebase/database'
import { processFirebaseSnap } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const FRASI = [
  "Ogni giorno è una nuova occasione per essere più forti di ieri.",
  "La cura più grande nasce dall'amore più profondo.",
  "Sei straordinario — ogni piccolo passo conta.",
  "La forza non si misura in assenza di difficoltà.",
  "Chi ama davvero trova sempre la strada giusta.",
  "Oggi è un buon giorno per prendersi cura di chi ami.",
  "La tua dedizione è la medicina più potente.",
  "Anche i giorni difficili passano — tu rimani forte.",
  "L'amore che dai ogni giorno è invisibile ma infinito.",
  "Prenditi cura di te mentre ti prendi cura degli altri.",
  "Sei un eroe silenzioso — il tuo lavoro conta.",
  "La costanza è la forma più alta di coraggio.",
  "Ogni momento di serenità è una vittoria.",
  "La speranza è il filo che tiene insieme i giorni.",
  "Sei sulla strada giusta — continua così.",
  "Il tuo impegno fa la differenza, anche quando non si vede.",
  "Respira. Ce la stai facendo meglio di quanto pensi.",
  "L'amore si misura nei gesti quotidiani.",
  "Hai già superato cose difficili — ce la farai anche oggi.",
  "Ogni crisi superata è una prova della tua forza.",
]

const ALL_QUICK_ACTIONS = [
  {key:'crisi', Icon:AlertTriangle, label:'Registra crisi', sub:'Timer immediato', color:'#F7295A', grad:'linear-gradient(135deg,#F7295A,#FF8C42)', page:'crisi'},
  {key:'diario', Icon:BookOpen, label:'Diario crisi', sub:'Vedi registro', color:'#F7295A', grad:'linear-gradient(135deg,#F7295A,#7B5EA7)', page:'diario'},
  {key:'terapie', Icon:Pill, label:'Terapie', sub:'Farmaci oggi', color:'#00BFA6', grad:'linear-gradient(135deg,#00BFA6,#2e84e9)', page:'terapie'},
  {key:'toilet', Icon:Droplets, label:'Toilet Training', sub:'Log sessione', color:'#7B5EA7', grad:'linear-gradient(135deg,#7B5EA7,#2e84e9)', page:'toilet'},
  {key:'magazzino', Icon:Package, label:'Magazzino', sub:'Scorte medicinali', color:'#00BFA6', grad:'linear-gradient(135deg,#00BFA6,#193f9e)', page:'magazzino'},
  {key:'report', Icon:BarChart2, label:'Report', sub:'Statistiche', color:'#FF8C42', grad:'linear-gradient(135deg,#FF8C42,#F7295A)', page:'report'},
  {key:'condividi', Icon:Link, label:'Condividi', sub:'Token medico', color:'#193f9e', grad:'linear-gradient(135deg,#193f9e,#2e84e9)', page:'condividi'},
  {key:'rubrica', Icon:Phone, label:'Rubrica', sub:'Contatti', color:'#F7295A', grad:'linear-gradient(135deg,#F7295A,#FF8C42)', page:'rubrica'},
]

const DEFAULT_QUICK = ['crisi', 'terapie', 'toilet']

const NAV_BOTTOM = [
  {Icon:Home, label:'Home', page:'home'},
  {Icon:BookOpen, label:'Diario', page:'diario'},
  {Icon:Pill, label:'Terapie', page:'terapie'},
  {Icon:Droplets, label:'Toilet', page:'toilet'},
  {Icon:Link, label:'Condividi', page:'condividi'},
  {Icon:Settings, label:'Altro', page:'altro'},
]

const NAV_EXTRA = [
  {Icon:BarChart2, label:'Report', page:'report'},
  {Icon:Package, label:'Magazzino', page:'magazzino'},
  {Icon:Phone, label:'Rubrica', page:'rubrica'},
  {Icon:ShoppingBag, label:'Portare', page:'cosa_portare'},
  {Icon:FileText, label:'Documenti', page:'doc_medici'},
  {Icon:CreditCard, label:'Pagamenti', page:'pagamenti'},
]

function oggiStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export default function HomeScreen({ nomeUtente, isDemo, onNavigate, showExtra, onToggleExtra }) {
  const [time, setTime] = useState(new Date())
  const [crisi, setCrisi] = useState([])
  const [terapie, setTerapie] = useState([])
  const [magazzino, setMagazzino] = useState([])
  const [toiletData, setToiletData] = useState([])
  const [quickActions, setQuickActions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('damiapp_quick_actions')) || DEFAULT_QUICK }
    catch { return DEFAULT_QUICK }
  })
  const [showQuickEdit, setShowQuickEdit] = useState(false)

  const frase = FRASI[(new Date().getDate() + new Date().getMonth()) % FRASI.length]

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (isDemo) {
      const oggi = oggiStr()
      const ieri = (() => {
        const d = new Date(Date.now()-86400000)
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
      })()
      setCrisi([
        {id:1,type:'Crisi tonico-cloniche',timestamp:Date.now()-3*86400000,duration:'00:02:34',intensita:7},
        {id:2,type:'Crisi di assenza',timestamp:Date.now()-10*86400000,duration:'00:00:18',intensita:4},
        {id:3,type:'Crisi miocloniche',timestamp:Date.now()-18*86400000,duration:'00:00:45',intensita:5},
      ])
      setTerapie([
        {id:1,nome:'Keppra 500mg',orario:'08:00',quantita:'1 cp'},
        {id:2,nome:'Depakine',orario:'13:00',quantita:'5ml'},
        {id:3,nome:'Keppra 750mg',orario:'20:00',quantita:'1 cp'},
      ])
      setMagazzino([
        {id:1,nome:'Keppra 500mg',scadenza:'2026-05-15',scatole:2},
        {id:2,nome:'Depakine',scadenza:'2026-04-20',scatole:1},
      ])
      setToiletData([
        {id:1,data:oggi,ora:'08:30',bisogno:'pippi',modalita:'caa-auto',incidentePippi:false,incidenteCacca:false,timestamp:Date.now()-3600000},
        {id:2,data:oggi,ora:'13:15',bisogno:'cacca',modalita:'adulto',incidentePippi:false,incidenteCacca:false,timestamp:Date.now()-7200000},
        {id:3,data:oggi,ora:'15:00',bisogno:'nessuno',modalita:'',incidentePippi:true,incidenteCacca:false,timestamp:Date.now()-3000000},
        {id:4,data:ieri,ora:'09:00',bisogno:'entrambi',modalita:'caa-guidata',incidentePippi:false,incidenteCacca:false,timestamp:Date.now()-86400000},
        {id:5,data:ieri,ora:'16:00',bisogno:'pippi',modalita:'caa-auto',incidentePippi:false,incidenteCacca:false,timestamp:Date.now()-79200000},
      ])
      return
    }
    const u1 = onValue(ref(db,'crises'), snap => setCrisi(processFirebaseSnap(snap)))
    const u2 = onValue(ref(db,'terapies'), snap => setTerapie(processFirebaseSnap(snap)))
    const u3 = onValue(ref(db,'magazzino'), snap => setMagazzino(processFirebaseSnap(snap)))
    const u4 = onValue(ref(db,'toilet_training'), snap => setToiletData(processFirebaseSnap(snap)))
    return () => { u1(); u2(); u3(); u4() }
  }, [isDemo])

  function saveQuickActions(keys) {
    setQuickActions(keys)
    localStorage.setItem('damiapp_quick_actions', JSON.stringify(keys))
  }

  const giorni = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
  const mesi = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
  const dataStr = `${giorni[time.getDay()]} ${time.getDate()} ${mesi[time.getMonth()]} ${time.getFullYear()}`
  const timeStr = time.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  const oraMinuti = time.getHours()*60+time.getMinutes()
  const oggi = oggiStr()

  const ultimaCrisi = [...crisi].sort((a,b)=>b.timestamp-a.timestamp)[0]
  const giorniSenzaCrisi = ultimaCrisi ? Math.floor((Date.now()-ultimaCrisi.timestamp)/86400000) : null
  const colorGiorni = giorniSenzaCrisi===null?'#bec1cc':giorniSenzaCrisi>=30?'#00BFA6':giorniSenzaCrisi>=7?'#FF8C42':'#F7295A'

  const prossimaTerapia = [...terapie]
    .map(t=>{const[h,m]=(t.orario||'00:00').split(':').map(Number);return{...t,min:h*60+m}})
    .filter(t=>t.min>oraMinuti).sort((a,b)=>a.min-b.min)[0]

  const scadenzeAlert = magazzino.filter(m=>{
    if(!m.scadenza) return false
    const gg=Math.ceil((new Date(m.scadenza)-Date.now())/86400000)
    return gg>=0&&gg<=30
  })

  const bagnoOggi = toiletData.filter(s=>s.data===oggi&&s.bisogno&&s.bisogno!=='nessuno').length
  const incOggi = toiletData.filter(s=>s.data===oggi&&(s.incidentePippi||s.incidenteCacca)).length
  const toilet7gg = toiletData.filter(s=>Date.now()-(s.timestamp||0)<7*86400000&&s.bisogno&&s.bisogno!=='nessuno').length
  const fasceMattina = toiletData.filter(s=>{const h=parseInt((s.ora||'00').split(':')[0]);return s.data===oggi&&h>=6&&h<12}).length
  const fascePomeriggio = toiletData.filter(s=>{const h=parseInt((s.ora||'00').split(':')[0]);return s.data===oggi&&h>=12&&h<18}).length
  const fasceSera = toiletData.filter(s=>{const h=parseInt((s.ora||'00').split(':')[0]);return s.data===oggi&&h>=18}).length
  const fasceMax = Math.max(fasceMattina,fascePomeriggio,fasceSera,1)

  const selectedActions = quickActions.map(k=>ALL_QUICK_ACTIONS.find(a=>a.key===k)).filter(Boolean)

  const navPaddingBottom = showExtra ? '185px' : '80px'

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .home-wrap{
          background:#f3f4f7;min-height:100vh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          padding-bottom:${navPaddingBottom};
          width:100%;max-width:480px;margin:0 auto;
          transition:padding-bottom 0.3s ease;
        }
        .nav-fixed{
          position:fixed;bottom:0;left:0;right:0;z-index:100;
        }
        .nav-extra-bar{
          background:#feffff;
          border-top:1px solid #f0f1f4;
          display:flex;
          padding:6px 0 4px;
          width:100%;
          transform:translateY(${showExtra?'0':'100%'});
          transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-main-bar{
          background:#feffff;
          border-top:1px solid #f0f1f4;
          display:flex;
          padding:7px 0 14px;
          box-shadow:0 -4px 16px rgba(2,21,63,0.08);
          width:100%;
        }
        .nav-item{
          flex:1;display:flex;flex-direction:column;
          align-items:center;gap:3px;cursor:pointer;
        }
        .overlay-extra{
          position:fixed;inset:0;z-index:99;
          background:rgba(2,21,63,0.15);
          opacity:${showExtra?'1':'0'};
          pointer-events:${showExtra?'auto':'none'};
          transition:opacity 0.3s ease;
        }
      `}</style>

      {/* Overlay chiude la barra extra */}
      <div className="overlay-extra" onClick={onToggleExtra}/>

      {/* ── MODAL PERSONALIZZA ── */}
      {showQuickEdit && (
        <div style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.5)',zIndex:600,display:'flex',alignItems:'flex-end',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
          <div style={{background:'#feffff',borderRadius:'24px 24px 0 0',padding:'20px',width:'100%',maxWidth:'480px',maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
              <div style={{fontSize:f(16),fontWeight:'900',color:'#02153f'}}>Personalizza priorità rapide</div>
              <button onClick={()=>setShowQuickEdit(false)} style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f3f4f7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <X size={16} color="#7c8088"/>
              </button>
            </div>
            <div style={{fontSize:f(12),color:'#7c8088',marginBottom:'14px'}}>Seleziona fino a 3 azioni da mostrare in Home</div>
            {ALL_QUICK_ACTIONS.map(({key,Icon,label,sub,color,grad})=>{
              const sel=quickActions.includes(key)
              return (
                <div key={key} onClick={()=>{
                  if(sel) saveQuickActions(quickActions.filter(k=>k!==key))
                  else if(quickActions.length<3) saveQuickActions([...quickActions,key])
                }} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'14px',marginBottom:'8px',cursor:'pointer',background:sel?`${color}10`:'#f3f4f7',border:`2px solid ${sel?color:'transparent'}`,transition:'all 0.15s'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'12px',background:grad,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Icon size={18} color="#fff"/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:f(13),fontWeight:'700',color:sel?color:'#02153f'}}>{label}</div>
                    <div style={{fontSize:f(10),color:'#7c8088'}}>{sub}</div>
                  </div>
                  {sel&&<Check size={18} color={color}/>}
                </div>
              )
            })}
            <button onClick={()=>setShowQuickEdit(false)} style={{width:'100%',padding:'14px',borderRadius:'50px',border:'none',cursor:'pointer',background:'linear-gradient(135deg,#193f9e,#2e84e9)',color:'#fff',fontWeight:'800',fontSize:f(14),marginTop:'8px'}}>
              Fatto
            </button>
          </div>
        </div>
      )}

      <div className="home-wrap">

        {/* ── HERO CARD ── */}
        <div style={{padding:'12px 12px 0'}}>
          <div style={{background:'#fdfdfd',borderRadius:'22px',padding:'14px 18px 16px',boxShadow:sh}}>
            <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
              <span style={{fontSize:f(10),color:'#bec1cc',fontWeight:'600'}}>{dataStr}</span>
              <span style={{fontSize:f(13),fontWeight:'900',color:'#bec1cc',fontVariantNumeric:'tabular-nums'}}>{timeStr}</span>
            </div>
            <div style={{display:'flex',justifyContent:'center',marginBottom:'10px'}}>
              <img src="/DamiLogo.png" alt="logo" style={{width:'62px',height:'62px',borderRadius:'50%',objectFit:'cover',boxShadow:'0 6px 20px rgba(8,24,76,0.18)'}}/>
            </div>
            {isDemo&&(
              <div style={{textAlign:'center',marginBottom:'8px'}}>
                <span style={{background:'linear-gradient(135deg,#FFD93D,#FF8C42)',color:'#5a3000',fontSize:f(10),fontWeight:'800',padding:'3px 12px',borderRadius:'20px'}}>
                  🎭 MODALITÀ DEMO
                </span>
              </div>
            )}
            <div style={{fontSize:f(26),fontWeight:'900',color:'#08184c',letterSpacing:'-0.5px',marginBottom:'6px'}}>
              Ciao {nomeUtente}!
            </div>
            <div style={{fontSize:f(13),color:'#7c8088',marginBottom:'18px',lineHeight:'1.6',fontStyle:'italic',padding:'8px 12px',background:'#f3f4f7',borderRadius:'12px',borderLeft:'3px solid #2e84e9'}}>
              {frase}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <button onClick={()=>onNavigate&&onNavigate('crisi')} style={{position:'relative',height:'50px',borderRadius:'50px',border:'none',overflow:'hidden',cursor:'pointer',boxShadow:'0 6px 20px rgba(25,63,158,0.35)'}}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#193f9e,#2e84e9)'}}/>
                <div style={{position:'absolute',left:0,bottom:0,width:'40px',height:'40px',background:'linear-gradient(135deg,#FF5B8D,#FF9F3F)',borderRadius:'0 50% 0 50px',opacity:0.75}}/>
                <div style={{position:'absolute',right:0,top:0,width:'30px',height:'30px',background:'linear-gradient(135deg,#FFD93D,#FF8C42)',borderRadius:'50px 0 50% 0',opacity:0.65}}/>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                  <AlertTriangle size={15} color="#fff"/>
                  <span style={{color:'#fff',fontSize:f(12),fontWeight:'800'}}>Avvia timer crisi</span>
                </div>
              </button>
              <button onClick={()=>onNavigate&&onNavigate('sos')} style={{height:'50px',borderRadius:'50px',border:'2.5px solid #e53935',background:'#feffff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',boxShadow:'0 4px 14px rgba(229,57,53,0.18)'}}>
                <Phone size={15} color="#e53935"/>
                <span style={{fontSize:f(13),fontWeight:'900',color:'#e53935'}}>SOCCORSO</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── MINI CARDS ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',padding:'8px 12px'}}>
          <div style={{background:'#feffff',borderRadius:'14px',overflow:'hidden',boxShadow:shSm}}>
            <div style={{padding:'9px 8px 7px'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'8px',background:colorGiorni,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'6px'}}>
                <AlertTriangle size={13} color="#fff"/>
              </div>
              <div style={{fontSize:f(8),color:'#7c8088',fontWeight:'700',textTransform:'uppercase',marginBottom:'2px'}}>Senza crisi</div>
              <div style={{fontSize:f(16),fontWeight:'900',color:'#02153f',lineHeight:1}}>{giorniSenzaCrisi!==null?`${giorniSenzaCrisi}g`:'—'}</div>
              <div style={{fontSize:f(9),color:'#bec1cc',marginTop:'2px'}}>{ultimaCrisi?`ul. ${new Date(ultimaCrisi.timestamp).toLocaleDateString('it-IT').slice(0,5)}`:'Nessuna'}</div>
            </div>
            <div style={{height:'3px',background:`linear-gradient(90deg,${colorGiorni},${colorGiorni}88)`}}/>
          </div>
          <div style={{background:'#feffff',borderRadius:'14px',overflow:'hidden',boxShadow:shSm}}>
            <div style={{padding:'9px 8px 7px'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'#00BFA6',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'6px'}}>
                <Clock size={13} color="#fff"/>
              </div>
              <div style={{fontSize:f(8),color:'#7c8088',fontWeight:'700',textTransform:'uppercase',marginBottom:'2px'}}>Prossima ter.</div>
              <div style={{fontSize:f(14),fontWeight:'900',color:'#02153f',lineHeight:1}}>{prossimaTerapia?prossimaTerapia.orario:'—'}</div>
              <div style={{fontSize:f(9),color:'#bec1cc',marginTop:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{prossimaTerapia?prossimaTerapia.nome:'Finite per oggi'}</div>
            </div>
            <div style={{height:'3px',background:'linear-gradient(90deg,#00BFA6,#2e84e9)'}}/>
          </div>
          <div style={{background:'#feffff',borderRadius:'14px',overflow:'hidden',boxShadow:shSm}}>
            <div style={{padding:'9px 8px 7px'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'8px',background:scadenzeAlert.length>0?'#FF8C42':'#00BFA6',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'6px'}}>
                <Bell size={13} color="#fff"/>
              </div>
              <div style={{fontSize:f(8),color:'#7c8088',fontWeight:'700',textTransform:'uppercase',marginBottom:'2px'}}>Scadenze</div>
              <div style={{fontSize:f(16),fontWeight:'900',color:scadenzeAlert.length>0?'#FF8C42':'#02153f',lineHeight:1}}>{scadenzeAlert.length}</div>
              <div style={{fontSize:f(9),color:'#bec1cc',marginTop:'2px'}}>{scadenzeAlert.length>0?'entro 30g':'tutto ok'}</div>
            </div>
            <div style={{height:'3px',background:scadenzeAlert.length>0?'linear-gradient(90deg,#FFD93D,#FF8C42)':'#f0f1f4'}}/>
          </div>
        </div>

        {/* ── PRIORITÀ RAPIDE ── */}
        <div style={{padding:'0 12px',marginBottom:'10px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
            <span style={{fontSize:f(14),fontWeight:'800',color:'#02153f'}}>Priorità rapide</span>
            <div onClick={()=>setShowQuickEdit(true)} style={{display:'flex',alignItems:'center',gap:'4px',cursor:'pointer'}}>
              <Pencil size={12} color="#2e84e9"/>
              <span style={{fontSize:f(11),color:'#2e84e9',fontWeight:'700'}}>Personalizza</span>
            </div>
          </div>
          {selectedActions.map(({key,Icon,label,sub,color,grad,page})=>(
            <div key={key} onClick={()=>onNavigate&&onNavigate(page)} style={{background:'#feffff',borderRadius:'14px',padding:'12px 14px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'7px',boxShadow:shSm,cursor:'pointer'}}>
              <div style={{width:'38px',height:'38px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 4px 12px ${color}44`}}>
                <Icon size={17} color="#fff"/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:f(13),fontWeight:'700',color:'#02153f'}}>{label}</div>
                <div style={{fontSize:f(10),color:'#7c8088',marginTop:'1px'}}>{sub}</div>
              </div>
              <ChevronRight size={16} color="#2e84e9"/>
            </div>
          ))}
        </div>

        {/* ── DASHBOARD 2x2 ── */}
        <div style={{padding:'0 12px',marginBottom:'12px'}}>
          <div style={{fontSize:f(14),fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>Dashboard</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>

            <div onClick={()=>onNavigate&&onNavigate('diario')} style={{background:'#feffff',borderRadius:'16px',padding:'12px',boxShadow:shSm,cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <span style={{fontSize:f(11),fontWeight:'800',color:'#02153f'}}>Crisi 7 giorni</span>
                <span style={{fontSize:f(16),fontWeight:'900',color:'#F7295A'}}>{crisi.filter(c=>Date.now()-c.timestamp<7*86400000).length}</span>
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:'3px',height:'34px'}}>
                {[6,5,4,3,2,1,0].map(i=>{
                  const s=new Date();s.setDate(s.getDate()-i);s.setHours(0,0,0,0)
                  const e=new Date(s);e.setHours(23,59,59,999)
                  const n=crisi.filter(c=>c.timestamp>=s.getTime()&&c.timestamp<=e.getTime()).length
                  const all=[6,5,4,3,2,1,0].map(j=>{const ss=new Date();ss.setDate(ss.getDate()-j);ss.setHours(0,0,0,0);const ee=new Date(ss);ee.setHours(23,59,59,999);return crisi.filter(c=>c.timestamp>=ss.getTime()&&c.timestamp<=ee.getTime()).length})
                  return <div key={i} style={{flex:1,height:`${n>0?(n/Math.max(...all,1))*100:8}%`,borderRadius:'3px 3px 0 0',background:n>0?'#F7295A':'#f0f1f4',minHeight:'3px'}}/>
                })}
              </div>
              <div style={{display:'flex',marginTop:'3px'}}>
                {['L','M','M','G','V','S','D'].map((g,i)=><span key={i} style={{flex:1,textAlign:'center',fontSize:f(7),color:'#bec1cc'}}>{g}</span>)}
              </div>
              <div style={{textAlign:'right',marginTop:'5px'}}>
                <span style={{fontSize:f(9),color:'#F7295A',fontWeight:'700'}}>Vedi diario →</span>
              </div>
            </div>

            <div onClick={()=>onNavigate&&onNavigate('terapie')} style={{background:'#feffff',borderRadius:'16px',padding:'12px',boxShadow:shSm,cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <span style={{fontSize:f(11),fontWeight:'800',color:'#02153f'}}>Terapie oggi</span>
                <ChevronRight size={12} color="#00BFA6"/>
              </div>
              {terapie.length===0?(
                <div style={{fontSize:f(10),color:'#bec1cc',textAlign:'center',padding:'8px'}}>Nessuna terapia</div>
              ):(
                [...terapie].sort((a,b)=>(a.orario||'').localeCompare(b.orario||'')).slice(0,3).map((t,i,arr)=>{
                  const[h,m]=(t.orario||'00:00').split(':').map(Number)
                  const passata=h*60+m<oraMinuti
                  return <div key={i} style={{display:'flex',alignItems:'center',gap:'6px',padding:'3px 0',borderBottom:i<arr.length-1?'1px solid #f0f1f4':'none'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:passata?'#bec1cc':'#00BFA6',flexShrink:0}}/>
                    <span style={{fontSize:f(10),color:passata?'#bec1cc':'#394058',fontWeight:'600',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:passata?'line-through':'none'}}>{t.nome}</span>
                    <span style={{fontSize:f(9),color:'#bec1cc'}}>{t.orario}</span>
                  </div>
                })
              )}
              <div style={{textAlign:'right',marginTop:'5px'}}>
                <span style={{fontSize:f(9),color:'#00BFA6',fontWeight:'700'}}>Vedi terapie →</span>
              </div>
            </div>

            <div onClick={()=>onNavigate&&onNavigate('toilet')} style={{background:'#feffff',borderRadius:'16px',padding:'12px',boxShadow:shSm,cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <span style={{fontSize:f(11),fontWeight:'800',color:'#02153f'}}>Toilet oggi</span>
                <ChevronRight size={12} color="#7B5EA7"/>
              </div>
              <div style={{display:'flex',gap:'5px',marginBottom:'8px'}}>
                <div style={{flex:1,background:'#F5F3FF',borderRadius:'8px',padding:'5px',textAlign:'center'}}>
                  <div style={{fontSize:f(17),fontWeight:'900',color:'#7B5EA7'}}>{bagnoOggi}</div>
                  <div style={{fontSize:f(8),color:'#7c8088'}}>In bagno</div>
                </div>
                <div style={{flex:1,background:incOggi>0?'#FEF0F4':'#E8FBF8',borderRadius:'8px',padding:'5px',textAlign:'center'}}>
                  <div style={{fontSize:f(17),fontWeight:'900',color:incOggi>0?'#F7295A':'#00BFA6'}}>{incOggi}</div>
                  <div style={{fontSize:f(8),color:'#7c8088'}}>Incidenti</div>
                </div>
                <div style={{flex:1,background:'#f3f4f7',borderRadius:'8px',padding:'5px',textAlign:'center'}}>
                  <div style={{fontSize:f(17),fontWeight:'900',color:'#394058'}}>{toilet7gg}</div>
                  <div style={{fontSize:f(8),color:'#7c8088'}}>Sett.</div>
                </div>
              </div>
              {[{l:'Mattina',c:'#2e84e9',v:fasceMattina},{l:'Pomerigg.',c:'#FF8C42',v:fascePomeriggio},{l:'Sera',c:'#F7295A',v:fasceSera}].map(({l,c,v})=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'3px'}}>
                  <span style={{fontSize:f(8),color:'#7c8088',width:'50px',flexShrink:0}}>{l}</span>
                  <div style={{flex:1,height:'5px',borderRadius:'3px',background:'#f3f4f7',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:'3px',width:`${(v/fasceMax)*100}%`,background:c}}/>
                  </div>
                  <span style={{fontSize:f(8),fontWeight:'700',color:c,width:'12px',textAlign:'right'}}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{background:'#feffff',borderRadius:'16px',padding:'12px',boxShadow:shSm}}>
              <div style={{fontSize:f(11),fontWeight:'800',color:'#02153f',marginBottom:'8px'}}>Totali</div>
              {[
                {label:'Crisi registrate',val:crisi.length,color:'#F7295A',page:'diario'},
                {label:'Terapie attive',val:terapie.length,color:'#00BFA6',page:'terapie'},
                {label:'Medicinali',val:magazzino.length,color:'#FF8C42',page:'magazzino'},
              ].map(({label,val,color,page},i)=>(
                <div key={i} onClick={()=>onNavigate&&onNavigate(page)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<2?'1px solid #f0f1f4':'none',cursor:'pointer'}}>
                  <span style={{fontSize:f(10),color:'#7c8088'}}>{label}</span>
                  <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                    <span style={{fontSize:f(13),fontWeight:'900',color}}>{val}</span>
                    <ChevronRight size={10} color={color}/>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── DOPPIA NAVBAR FISSA ── */}
      <div className="nav-fixed">

        {/* Barra extra a scomparsa — grigia come navbar */}
        <div className="nav-extra-bar">
          {NAV_EXTRA.map(({Icon,label,page})=>(
            <div key={page} onClick={()=>{onNavigate&&onNavigate(page);onToggleExtra&&onToggleExtra()}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',cursor:'pointer'}}>
              <div style={{width:'34px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px'}}>
                <Icon size={17} color="#bec1cc"/>
              </div>
              <span style={{fontSize:f(9),fontWeight:'500',color:'#bec1cc'}}>{label}</span>
            </div>
          ))}
        </div>

        {/* Navbar principale */}
        <div className="nav-main-bar">
          {NAV_BOTTOM.map(({Icon,label,page})=>{
            const act = page==='home'
            const isAltro = page==='altro'
            const altroAct = isAltro && showExtra
            return (
              <div key={page} onClick={()=>{
                if(isAltro) onToggleExtra&&onToggleExtra()
                else { onNavigate&&onNavigate(page); if(showExtra) onToggleExtra&&onToggleExtra() }
              }} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',cursor:'pointer'}}>
                <div style={{width:'34px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',background:(act||altroAct)?'#EEF3FD':'transparent'}}>
                  {isAltro
                    ? <ChevronUp size={17} color={altroAct?'#193f9e':'#bec1cc'} style={{transform:showExtra?'rotate(0deg)':'rotate(180deg)',transition:'transform 0.3s'}}/>
                    : <Icon size={17} color={act?'#193f9e':'#bec1cc'}/>
                  }
                </div>
                <span style={{fontSize:f(9),fontWeight:(act||altroAct)?'800':'500',color:(act||altroAct)?'#193f9e':'#bec1cc'}}>
                  {isAltro ? (showExtra?'Chiudi':'Altro') : label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
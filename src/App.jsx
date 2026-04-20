import { useState, useEffect } from 'react'
import {
  Home, BookOpen, Brain, Droplets, MessageCircle,
  MoreHorizontal, ChevronUp,
  FileText, Package, Pill, BarChart2, Layers,
  AlertTriangle, Phone
} from 'lucide-react'
import { db } from './firebase'
import { ref, onValue, get } from 'firebase/database'
import { decrypt } from './crypto'
import Home2 from './Home'
import CrisiPage from './CrisiPage'
import DiarioCrisi from './DiarioCrisi'
import TerapiePage from './TerapiePage'
import SOSPage from './SOSPage'
import ToiletPage from './ToiletPage'
import CondividiPage from './CondividiPage'
import ReportPage from './ReportPage'
import MagazzinoPage from './MagazzinoPage'
import DoctorView from './DoctorView'
import DisturbPage from './DisturbPage'
import UtilityPage from './UtilityPage'
import RubricaPage from './RubricaPage'
import PagamentiPage from './PagamentiPage'
import DocumentiPage from './DocumentiPage'
import CosaPortarePage from './CosaPortarePage'
import MessaggiPage from './MessaggiPage'


const PIN_REALE = '261120'
const PIN_DEMO  = '010101'
const VERSION   = '05.01.05'

const f = (base) => `${Math.round(base * 1.15)}px`

// ─── COSTANTI NAVBAR ─────────────────────────────────────────
const NAV_H   = 58
const EXTRA_H = 52

// Navbar principale — 6 voci
const NAV_BOTTOM = [
  { Icon: Home,          label: 'Home',     page: 'home'      },
  { Icon: BookOpen,      label: 'Diario',   page: 'diario'    },
  { Icon: Brain,         label: 'Disturbi', page: 'disturbi'  },
  { Icon: Droplets,      label: 'Toilet',   page: 'toilet'    },
  { Icon: MessageCircle, label: 'Messaggi', page: 'messaggi', isBadge: true },
  { Icon: MoreHorizontal,label: 'Altro',    page: '__extra__' },
]

// Barra secondaria — 5 voci
const NAV_EXTRA = [
  { Icon: FileText,  label: 'Documenti', page: 'doc_medici'  },
  { Icon: Package,   label: 'Magazzino', page: 'magazzino'   },
  { Icon: Pill,      label: 'Terapie',   page: 'terapie'     },
  { Icon: BarChart2, label: 'Report',    page: 'report'      },
  { Icon: Layers,    label: 'Utility',   page: 'utility'     },
]

// Pagine considerate "extra"
const EXTRA_PAGES = new Set([
  'doc_medici','doc_personali','magazzino','terapie','report','utility',
  'rubrica','pagamenti','cosa_portare','condividi',
])

// Pagine senza navbar
const NO_NAV = ['crisi', 'sos']


const FRASI = [
  "Ogni giorno è una nuova occasione per essere più forti di ieri.",
  "La cura più grande nasce dall'amore più profondo.",
  "Sei straordinario — ogni piccolo passo conta.",
  "La forza non si misura in assenza di difficoltà, ma nel coraggio di affrontarle.",
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
  "La gentilezza che dai ritorna sempre.",
  "Stai facendo un lavoro meraviglioso.",
  "I momenti difficili costruiscono persone straordinarie.",
  "La pazienza è la forma più nobile di forza.",
  "Non sei solo — c'è sempre chi ti sostiene.",
  "Ogni giorno è un giorno pieno di significato.",
  "La normalità si costruisce un giorno alla volta.",
  "Anche le piccole vittorie meritano di essere celebrate.",
  "Sei più forte di quanto credi — sempre.",
  "La cura quotidiana è il gesto d'amore più grande.",
]

export function getFrase() {
  return FRASI[(new Date().getDate() + new Date().getMonth()) % FRASI.length]
}


const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e8eaf0; }
  body { display: flex; justify-content: center; min-height: 100dvh; }
  #root {
    width: 100%;
    max-width: 480px;
    background: #f3f4f7;
    min-height: 100dvh;
    position: relative;
    box-shadow: 0 0 60px rgba(2,21,63,0.12);
    overflow-x: hidden;
  }

  @keyframes damiLoginSlideUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes damiSlideInRight {
    from { opacity: 0; transform: translateX(48px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .dami-login-card {
    animation: damiLoginSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }
  .dami-page-enter {
    animation: damiSlideInRight 0.32s cubic-bezier(0.22,1,0.36,1) both;
  }
  .dami-btn-accedi {
    transition: transform 0.15s cubic-bezier(0.22,1,0.36,1), box-shadow 0.15s;
  }
  .dami-btn-accedi:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(8,24,76,0.45) !important;
  }
  .dami-btn-accedi:active {
    transform: scale(0.97);
    box-shadow: 0 4px 12px rgba(8,24,76,0.25) !important;
  }

  /* ── NAVBAR UNIFICATA ── */
  .nav-extra-bar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%) scaleY(0);
    transform-origin: bottom center;
    width: 100%;
    max-width: 480px;
    background: #feffff;
    border-top: 1px solid #eef0f5;
    display: flex;
    align-items: center;
    box-shadow: 0 -2px 12px rgba(2,21,63,0.08);
    z-index: 1100;
    opacity: 0;
    pointer-events: none;
    transition:
      transform 0.30s cubic-bezier(0.34,1.56,0.64,1),
      opacity   0.18s ease;
    will-change: transform, opacity;
  }
  .nav-extra-bar.open {
    transform: translateX(-50%) scaleY(1);
    opacity: 1;
    pointer-events: auto;
  }
  .nav-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(2,21,63,0.12);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.22s ease;
    backdrop-filter: blur(0.5px);
  }
  .nav-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }
  .nav-btn {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    padding: 3px 2px;
    position: relative;
    border: none;
    background: transparent;
  }
`


function Disclaimer({ nome, onAccept }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{background:'#feffff',borderRadius:'24px',padding:'28px 24px',width:'100%',maxWidth:'360px',boxShadow:'0 20px 60px rgba(2,21,63,0.3)'}}>
        <div style={{textAlign:'center',marginBottom:'20px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'50%',background:'linear-gradient(135deg,#F7295A,#FF8C42)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:'24px'}}>⚠️</div>
          <div style={{fontSize:f(18),fontWeight:'900',color:'#08184c',marginBottom:'6px'}}>Informativa sull'utilizzo</div>
          <div style={{fontSize:f(12),color:'#7c8088'}}>Leggi attentamente prima di continuare</div>
        </div>
        <div style={{background:'#f3f4f7',borderRadius:'14px',padding:'16px',marginBottom:'20px',fontSize:f(12),color:'#394058',lineHeight:'1.7',maxHeight:'200px',overflowY:'auto'}}>
          <p style={{marginBottom:'10px'}}><strong style={{color:'#08184c'}}>Ciao {nome}!</strong> Prima di accedere a DamiAPP, ti chiediamo di leggere e accettare quanto segue:</p>
          <p style={{marginBottom:'10px'}}><strong style={{color:'#02153f'}}>1. Responsabilità dei dati</strong><br/>DamiAPP è uno strumento di supporto personale.</p>
          <p style={{marginBottom:'10px'}}><strong style={{color:'#02153f'}}>2. Protezione dei dati</strong><br/>Dati salvati su Firebase (Google).<strong style={{color:'#F7295A'}}> DamiAPP non garantisce la protezione assoluta.</strong></p>
          <p style={{marginBottom:'10px'}}><strong style={{color:'#02153f'}}>3. Uso medico</strong><br/>DamiAPP <strong>non sostituisce il medico</strong>. Emergenze → chiama il 112.</p>
          <p style={{marginBottom:'10px'}}><strong style={{color:'#02153f'}}>4. Modalità Demo</strong><br/>In modalità Demo tutti i dati sono fittizi.</p>
          <p style={{margin:0,color:'#bec1cc',fontSize:f(11)}}>v{VERSION} — Continuando accetti queste condizioni.</p>
        </div>
        <button type="button" onClick={onAccept} style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:'linear-gradient(135deg,#08184c,#193f9e)',boxShadow:'0 6px 20px rgba(8,24,76,0.35)',marginBottom:'10px'}}>
          ✅ Ho letto e accetto
        </button>
        <div style={{textAlign:'center',fontSize:f(11),color:'#bec1cc'}}>Non accettando non potrai utilizzare l'app</div>
      </div>
    </div>
  )
}


function OnboardingModal({ onDone, isDemo }) {
  const [nome, setNome] = useState('')
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
      <div style={{background:'#feffff',borderRadius:'24px',padding:'32px 24px',width:'100%',maxWidth:'340px',boxShadow:'0 20px 60px rgba(2,21,63,0.25)'}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <img src="/DamiAPP_Trasp.png" alt="logo" style={{width:'72px',height:'72px',borderRadius:'50%',objectFit:'contain',background:'#f3f4f7',marginBottom:'14px',boxShadow:'0 4px 16px rgba(8,24,76,0.25)'}} onError={e=>{e.target.style.display='none'}}/>
          <div style={{fontSize:f(20),fontWeight:'900',color:'#08184c',marginBottom:'6px'}}>
            {isDemo ? '👋 Benvenuto nella Demo!' : 'Benvenuto in DamiAPP'}
          </div>
          <div style={{fontSize:f(13),color:'#7c8088',lineHeight:'1.5'}}>
            {isDemo ? 'Come ti chiami? Personalizziamo la demo.' : 'Come ti chiami? Ti saluteremo ogni giorno.'}
          </div>
          {isDemo && (
            <div style={{marginTop:'10px',padding:'8px 12px',background:'rgba(255,140,66,0.12)',borderRadius:'10px',border:'1px solid rgba(255,140,66,0.3)',fontSize:f(11),color:'#8B6914',fontWeight:'600'}}>
              🎭 Modalità Demo — dati fittizi
            </div>
          )}
        </div>
        <input
          value={nome} onChange={e=>setNome(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&nome.trim()&&onDone(nome.trim())}
          placeholder="Il tuo nome..." autoFocus
          style={{width:'100%',padding:'14px 16px',borderRadius:'14px',border:'2px solid #e8eaf0',fontSize:f(16),color:'#02153f',marginBottom:'16px',outline:'none',boxSizing:'border-box',fontFamily:'inherit',background:'#f3f4f7'}}
          onFocus={e=>e.target.style.borderColor='#2e84e9'}
          onBlur={e=>e.target.style.borderColor='#e8eaf0'}
        />
        <button type="button"
          onClick={()=>nome.trim()&&onDone(nome.trim())}
          disabled={!nome.trim()}
          style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',background:nome.trim()?'linear-gradient(135deg,#08184c,#193f9e)':'#e8eaf0',color:nome.trim()?'#fff':'#bec1cc',fontSize:f(15),fontWeight:'800',cursor:nome.trim()?'pointer':'default',boxShadow:nome.trim()?'0 6px 20px rgba(8,24,76,0.35)':'none'}}
        >Inizia →</button>
      </div>
    </div>
  )
}


function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('paziente')
  const [token, setToken] = useState('')
  const [ricordaPin, setRicordaPin] = useState(false)
  const [checkingToken, setCheckingToken] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('damiapp_saved_pin')
    if (saved) { setPin(saved); setRicordaPin(true) }
  }, [])

  function handlePinLogin() {
    if (pin === PIN_REALE || pin === PIN_DEMO) {
      if (ricordaPin) localStorage.setItem('damiapp_saved_pin', pin)
      else localStorage.removeItem('damiapp_saved_pin')
      onLogin(pin === PIN_DEMO, null)
    } else {
      setError('PIN errato. Riprova.')
      setPin('')
    }
  }

  async function handleTokenLogin() {
    if (!token.trim()) { setError('Inserisci il token'); return }
    setCheckingToken(true)
    setError('')
    try {
      const snap = await get(ref(db, 'sharetokens'))
      const val = snap.val()
      if (!val) { setError('Token non valido o scaduto.'); setCheckingToken(false); return }
      let trovato = null
      Object.entries(val).forEach(([key, encData]) => {
        const t = typeof encData === 'object' ? encData : decrypt(encData)
        if (t && t.token === token.trim().toUpperCase() && t.active) {
          const scadenza = t.expiresAt ? new Date(t.expiresAt) : null
          if (!scadenza || scadenza > new Date()) trovato = { ...t, _firebaseKey: key }
        }
      })
      if (trovato) onLogin(false, trovato)
      else setError('Token non valido o scaduto.')
    } catch(err) {
      console.error(err)
      setError('Errore di connessione. Riprova.')
    }
    setCheckingToken(false)
  }

  return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f3f4f7',fontFamily:"-apple-system,'Segoe UI',sans-serif",padding:'20px'}}>
      <div className="dami-login-card" style={{background:'#feffff',borderRadius:'28px',overflow:'hidden',width:'100%',maxWidth:'340px',boxShadow:'0 20px 60px rgba(2,21,63,0.20),0 8px 20px rgba(2,21,63,0.10)'}}>
        <div style={{background:'linear-gradient(135deg,#08184c,#193f9e)',padding:'36px 24px 30px',textAlign:'center',position:'relative'}}>
          <div style={{position:'absolute',top:'10px',right:'14px',fontSize:f(10),color:'rgba(255,255,255,0.35)',fontWeight:'600'}}>v{VERSION}</div>
          <img
            src="/DamiAPP_Trasp.png"
            alt="logo"
            style={{width:'100px',height:'100px',borderRadius:'50%',objectFit:'contain',background:'#f3f4f7',marginBottom:'16px',border:'3px solid rgba(255,255,255,0.25)'}}
            onError={e=>{e.target.style.display='none'}}
          />
          <div style={{fontSize:f(28),fontWeight:'900',color:'#fff',letterSpacing:'-0.5px'}}>DamiAPP</div>
          <div style={{fontSize:f(12),color:'rgba(255,255,255,0.5)',marginTop:'4px'}}>Il tuo assistente quotidiano</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#f3f4f7',margin:'16px 16px 0',borderRadius:'12px',padding:'3px',gap:'3px'}}>
          {['paziente','medico'].map(t=>(
            <button type="button" key={t} onClick={()=>{setTab(t);setError('');setPin('');setToken('')}}
              style={{padding:'9px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(12),fontFamily:'inherit',background:tab===t?'#feffff':'transparent',color:tab===t?'#08184c':'#7c8088',boxShadow:tab===t?'0 2px 8px rgba(2,21,63,0.10)':'none',transition:'all 0.2s cubic-bezier(0.22,1,0.36,1)'}}>
              {t==='paziente'?'👤 Paziente':'👨‍⚕️ Medico'}
            </button>
          ))}
        </div>
        <div style={{padding:'20px 24px 28px'}}>
          {tab==='paziente' ? (
            <>
              <div style={{fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>PIN di accesso</div>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e=>setPin(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handlePinLogin()}
                placeholder="• • • • • •"
                maxLength={6}
                style={{width:'100%',padding:'16px',borderRadius:'14px',border:'2px solid #e8eaf0',fontSize:'26px',textAlign:'center',letterSpacing:'12px',marginBottom:'10px',outline:'none',boxSizing:'border-box',color:'#02153f',background:'#f3f4f7',fontFamily:'inherit',transition:'border-color 0.2s, box-shadow 0.2s'}}
                onFocus={e=>{e.target.style.borderColor='#2e84e9';e.target.style.boxShadow='0 0 0 3px rgba(46,132,233,0.12)'}}
                onBlur={e=>{e.target.style.borderColor='#e8eaf0';e.target.style.boxShadow='none'}}
              />
              <div onClick={()=>setRicordaPin(!ricordaPin)} style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',marginBottom:'14px',userSelect:'none'}}>
                <div style={{width:'20px',height:'20px',borderRadius:'6px',border:`2px solid ${ricordaPin?'#193f9e':'#dde0ed'}`,background:ricordaPin?'#193f9e':'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s'}}>
                  {ricordaPin && <span style={{color:'#fff',fontSize:'13px',fontWeight:'900'}}>✓</span>}
                </div>
                <span style={{fontSize:f(12),color:'#7c8088',fontWeight:'600'}}>Ricorda PIN per accesso rapido</span>
              </div>
              {error && <div style={{color:'#e53935',fontSize:f(13),textAlign:'center',marginBottom:'12px',fontWeight:'600'}}>❌ {error}</div>}
              <button
                type="button"
                onClick={handlePinLogin}
                className="dami-btn-accedi"
                style={{width:'100%',padding:'16px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(16),color:'#fff',background:'linear-gradient(135deg,#08184c,#193f9e)',boxShadow:'0 8px 24px rgba(8,24,76,0.35)'}}
              >
                Accedi
              </button>
              <div style={{textAlign:'center',marginTop:'12px',fontSize:f(11),color:'#bec1cc'}}>💡 PIN demo disponibile per la presentazione</div>
            </>
          ) : (
            <>
              <div style={{fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>Token di accesso medico</div>
              <input
                type="text" value={token}
                onChange={e=>setToken(e.target.value.toUpperCase())}
                onKeyDown={e=>e.key==='Enter'&&handleTokenLogin()}
                placeholder="Es: DMIABCD12345"
                style={{width:'100%',padding:'14px',borderRadius:'14px',border:'2px solid #e8eaf0',fontSize:f(16),textAlign:'center',letterSpacing:'2px',marginBottom:'10px',outline:'none',boxSizing:'border-box',color:'#02153f',background:'#f3f4f7',fontFamily:"'Courier New',monospace",transition:'border-color 0.2s, box-shadow 0.2s'}}
                onFocus={e=>{e.target.style.borderColor='#2e84e9';e.target.style.boxShadow='0 0 0 3px rgba(46,132,233,0.12)'}}
                onBlur={e=>{e.target.style.borderColor='#e8eaf0';e.target.style.boxShadow='none'}}
              />
              {error && <div style={{color:'#e53935',fontSize:f(13),textAlign:'center',marginBottom:'12px',fontWeight:'600'}}>❌ {error}</div>}
              <button type="button" onClick={handleTokenLogin} disabled={checkingToken}
                style={{width:'100%',padding:'16px',borderRadius:'50px',border:'none',cursor:checkingToken?'wait':'pointer',fontWeight:'800',fontSize:f(16),color:'#fff',background:checkingToken?'#bec1cc':'linear-gradient(135deg,#00BFA6,#2e84e9)',boxShadow:checkingToken?'none':'0 8px 24px rgba(0,191,166,0.3)',opacity:checkingToken?0.7:1,transition:'all 0.2s'}}>
                {checkingToken ? '⏳ Verifica in corso...' : 'Accedi come Medico'}
              </button>
              <div style={{textAlign:'center',marginTop:'12px',fontSize:f(11),color:'#bec1cc'}}>Il token ti è stato fornito dalla famiglia del paziente</div>
            </>
          )}
          <div style={{textAlign:'center',marginTop:'16px',fontSize:f(12),color:'#bec1cc',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>
            🔒 Dati cifrati e protetti
          </div>
        </div>
      </div>
    </div>
  )
}


function PaginaInArrivo({ onBack }) {
  return (
    <div style={{minHeight:'100dvh',background:'#f3f4f7',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif",paddingBottom:'80px'}}>
      <div style={{textAlign:'center',padding:'40px'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🚧</div>
        <div style={{fontSize:f(18),fontWeight:'900',color:'#02153f',marginBottom:'8px'}}>In arrivo</div>
        <div style={{fontSize:f(13),color:'#7c8088',marginBottom:'24px'}}>Questa sezione è in sviluppo</div>
        <button type="button" onClick={onBack} style={{padding:'12px 24px',borderRadius:'50px',border:'none',background:'linear-gradient(135deg,#193f9e,#2e84e9)',color:'#fff',fontWeight:'700',fontSize:f(14),cursor:'pointer'}}>
          ← Torna indietro
        </button>
      </div>
    </div>
  )
}


// ─── NAVBAR UNIFICATA ────────────────────────────────────────
// Unica navbar per tutta l'app — sostituisce NavbarInterna e
// la navbar di Home.jsx. Monta sempre tranne su crisi/sos.
function NavbarApp({ page, onNavigate, showExtra, onToggleExtra, msgNonLetti = 0 }) {

  function isNavActive(p) {
    if (p === '__extra__') return showExtra || EXTRA_PAGES.has(page)
    return page === p
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`nav-overlay${showExtra ? ' open' : ''}`}
        onClick={onToggleExtra}
      />

      {/* Barra extra — spring */}
      <div
        className={`nav-extra-bar${showExtra ? ' open' : ''}`}
        style={{ bottom: NAV_H, height: `${EXTRA_H}px` }}
      >
        {NAV_EXTRA.map(({ Icon, label, page: p }) => {
          const active = page === p
          return (
            <button key={p} type="button"
              onClick={() => { onToggleExtra(); onNavigate(p) }}
              className="nav-btn"
            >
              {active && (
                <div style={{
                  position:'absolute', top:0, left:'50%',
                  transform:'translateX(-50%)',
                  width:'28px', height:'3px',
                  background:'#193f9e',
                  borderRadius:'0 0 4px 4px',
                }}/>
              )}
              <div style={{
                width:'36px', height:'28px',
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'10px',
                background: active ? '#EEF3FD' : 'transparent',
                transition:'background 0.2s',
              }}>
                <Icon size={20} color={active ? '#193f9e' : '#bec1cc'} strokeWidth={active ? 2.5 : 2}/>
              </div>
              <span style={{
                fontSize:`${Math.round(9*1.15)}px`,
                fontWeight: active ? '800' : '500',
                color: active ? '#193f9e' : '#bec1cc',
                transition:'color 0.2s', lineHeight:1,
              }}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Navbar principale */}
      <nav style={{
        position: 'fixed',
        bottom: 0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:'480px',
        height:`${NAV_H}px`,
        background:'#feffff',
        borderTop:'1px solid #eef0f5',
        display:'flex', alignItems:'center',
        boxShadow:'0 -4px 16px rgba(2,21,63,0.09)',
        zIndex:1200,
        paddingBottom:'env(safe-area-inset-bottom)',
      }}>
        {NAV_BOTTOM.map(({ Icon, label, page: p, isBadge }) => {
          const isExtra = p === '__extra__'
          const active  = isNavActive(p)
          return (
            <button key={p} type="button"
              onClick={() => isExtra ? onToggleExtra() : onNavigate(p)}
              className="nav-btn"
              style={{ height: '100%' }}
            >
              {active && (
                <div style={{
                  position:'absolute', top:0, left:'50%',
                  transform:'translateX(-50%)',
                  width:'28px', height:'3px',
                  background:'#193f9e',
                  borderRadius:'0 0 4px 4px',
                }}/>
              )}
              <div style={{
                width:'36px', height:'28px',
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'10px',
                background: active ? '#EEF3FD' : 'transparent',
                transition:'background 0.2s',
                position:'relative',
              }}>
                {isExtra
                  ? <ChevronUp
                      size={20}
                      color={showExtra ? '#193f9e' : '#bec1cc'}
                      style={{
                        transform: showExtra ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.30s cubic-bezier(0.34,1.56,0.64,1)',
                      }}
                    />
                  : <Icon size={20} color={active ? '#193f9e' : '#bec1cc'} strokeWidth={active ? 2.5 : 2}/>
                }
                {isBadge && msgNonLetti > 0 && (
                  <span style={{
                    position:'absolute', top:'-4px', right:'-4px',
                    minWidth:'15px', height:'15px', borderRadius:'50%',
                    background:'#F7295A', display:'flex', alignItems:'center',
                    justifyContent:'center', border:'2px solid #feffff', padding:'0 2px',
                  }}>
                    <span style={{fontSize:'8px',fontWeight:'900',color:'#fff',lineHeight:1}}>
                      {msgNonLetti > 9 ? '9+' : msgNonLetti}
                    </span>
                  </span>
                )}
              </div>
              <span style={{
                fontSize:`${Math.round(9*1.15)}px`,
                fontWeight: active ? '800' : '500',
                color: active ? '#193f9e' : '#bec1cc',
                transition:'color 0.2s', lineHeight:1,
              }}>
                {isExtra ? (showExtra ? 'Chiudi' : 'Altro') : label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}


export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [isMedico, setIsMedico] = useState(false)
  const [tokenMedico, setTokenMedico] = useState(null)
  const [page, setPage] = useState('home')
  const [nomeUtente, setNomeUtente] = useState(()=>localStorage.getItem('damiapp_nome')||'')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [pendingNome, setPendingNome] = useState('')
  const [timerSecCrisi, setTimerSecCrisi] = useState(0)
  const [showExtra, setShowExtra] = useState(false)
  const [msgNonLetti, setMsgNonLetti] = useState(0)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setInstallBanner] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isInStandaloneMode = window.navigator.standalone === true
    const hasDismissed = localStorage.getItem('damiapp_install_dismissed')
    if (isIOS && !isInStandaloneMode && !hasDismissed) {
      const t = setTimeout(() => setInstallBanner('ios'), 3000)
      return () => clearTimeout(t)
    }
    function handleBeforeInstall(e) {
      e.preventDefault()
      setInstallPrompt(e)
      if (!hasDismissed) setTimeout(() => setInstallBanner('android'), 4000)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') { setInstallBanner(false); setInstallPrompt(null) }
  }

  function dismissInstall() {
    setInstallBanner(false)
    localStorage.setItem('damiapp_install_dismissed', '1')
  }

  useEffect(() => {
    if (!authenticated || isDemo || isMedico) return
    const unsub = onValue(ref(db, 'sharetokens'), snapTokens => {
      const rawTokens = snapTokens.val()
      if (!rawTokens) { setMsgNonLetti(0); return }
      // FIX bug chat: usa d.token (es. "DMIABC12345") non la chiave Firebase
      // perché ChatMedico scrive su messages/{token_string}
      const tokenStrings = Object.entries(rawTokens)
        .map(([k, enc]) => { const d = decrypt(enc); return (d && d.token && d.active) ? d.token : null })
        .filter(Boolean)
      if (tokenStrings.length === 0) { setMsgNonLetti(0); return }
      Promise.all(
        tokenStrings.map(tk =>
          new Promise(resolve => {
            onValue(ref(db, 'messages/' + tk), snap => {
              const raw = snap.val()
              if (!raw) { resolve(0); return }
              // i messaggi sono oggetti plain, non cifrati
              const msgs = Object.values(raw).filter(m => m && typeof m === 'object')
              resolve(msgs.filter(m => m.da === 'medico' && !m.letto).length)
            }, { onlyOnce: true })
          })
        )
      ).then(counts => setMsgNonLetti(counts.reduce((a, b) => a + b, 0)))
    })
    return () => unsub()
  }, [authenticated, isDemo, isMedico])

  function handleLogin(demo, tokenData) {
    setIsDemo(demo)
    setAuthenticated(true)
    if (tokenData) {
      setIsMedico(true)
      setTokenMedico(tokenData)
    } else {
      setIsMedico(false)
      setTokenMedico(null)
      if (demo || !nomeUtente) setShowOnboarding(true)
    }
  }

  function handleNome(nome) {
    setPendingNome(nome)
    setShowOnboarding(false)
    setShowDisclaimer(true)
  }

  function handleAcceptDisclaimer() {
    if (!isDemo) localStorage.setItem('damiapp_nome', pendingNome)
    setShowDisclaimer(false)
  }

  function handleNavigate(dest) {
    // chiude la barra extra solo se la destinazione NON è una pagina extra
    if (!EXTRA_PAGES.has(dest)) setShowExtra(false)
    if (dest === 'crisi') setTimerSecCrisi(1)
    setPage(dest)
  }

  const nomeEffettivo = isMedico
    ? `Dr. ${tokenMedico?.medicoName||'Medico'}`
    : isDemo ? (pendingNome||'Ospite')
    : (pendingNome||nomeUtente||'Damiano')

  const showNav = authenticated && !isMedico && !NO_NAV.includes(page)
  // padding bottom per le pagine: navbar + eventuale barra extra
  const pb = showExtra ? NAV_H + EXTRA_H + 4 : NAV_H + 4

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {!authenticated && <Login onLogin={handleLogin}/>}

      {authenticated && isMedico && tokenMedico && (
        <DoctorView
          tokenData={tokenMedico}
          onLogout={()=>{setAuthenticated(false);setIsMedico(false);setTokenMedico(null)}}
        />
      )}

      {authenticated && !isMedico && (
        <>
          {showOnboarding && <OnboardingModal onDone={handleNome} isDemo={isDemo}/>}
          {showDisclaimer && <Disclaimer nome={nomeEffettivo} onAccept={handleAcceptDisclaimer}/>}

          {page==='crisi' && <CrisiPage onBack={()=>setPage('home')} timerSecInizio={timerSecCrisi} isDemo={isDemo}/>}
          {page==='sos'   && <SOSPage onBack={()=>setPage('home')}/>}

          {!NO_NAV.includes(page) && (
            <div key={page} className="dami-page-enter" style={{paddingBottom:`${pb}px`}}>
              {page==='home' && (
                <Home2
                  nomeUtente={nomeEffettivo}
                  isDemo={isDemo}
                  onNavigate={handleNavigate}
                  msgNonLetti={msgNonLetti}
                />
              )}
              {page==='diario'        && <DiarioCrisi    onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='terapie'       && <TerapiePage     onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='toilet'        && <ToiletPage      onBack={()=>setPage('home')} isDemo={isDemo}/>}
              {page==='condividi'     && <CondividiPage   onBack={()=>setPage('home')} isDemo={isDemo}/>}
              {page==='messaggi'      && <MessaggiPage    onBack={()=>setPage('home')} isDemo={isDemo}/>}
              {page==='report'        && <ReportPage      onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='magazzino'     && <MagazzinoPage   onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='disturbi'      && <DisturbPage     onBack={()=>setPage('home')} isDemo={isDemo}/>}
              {page==='utility'       && <UtilityPage     onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='rubrica'       && <RubricaPage     onBack={()=>handleNavigate('utility')} isDemo={isDemo}/>}
              {page==='pagamenti'     && <PagamentiPage   onBack={()=>handleNavigate('utility')} isDemo={isDemo}/>}
              {page==='cosa_portare'  && <CosaPortarePage onBack={()=>handleNavigate('utility')} isDemo={isDemo}/>}
              {page==='doc_medici'    && <DocumentiPage   onBack={()=>handleNavigate('utility')} isDemo={isDemo} categoria="medici"/>}
              {page==='doc_personali' && <DocumentiPage   onBack={()=>handleNavigate('utility')} isDemo={isDemo} categoria="personali"/>}
              {page==='admin'         && <PaginaInArrivo  onBack={()=>handleNavigate('home')}/>}
            </div>
          )}

          {/* NAVBAR UNIFICATA — sempre montata, mai smontata al cambio pagina */}
          {showNav && (
            <NavbarApp
              page={page}
              onNavigate={handleNavigate}
              showExtra={showExtra}
              onToggleExtra={() => setShowExtra(p => !p)}
              msgNonLetti={msgNonLetti}
            />
          )}

          {showInstallBanner && (
            <div style={{position:'fixed',bottom: showNav ? NAV_H + 8 : 8,left:'50%',transform:'translateX(-50%)',width:'calc(100% - 24px)',maxWidth:'456px',background:'#08184c',borderRadius:'20px',padding:'14px 16px',boxShadow:'0 8px 32px rgba(2,21,63,0.45)',zIndex:3000,display:'flex',alignItems:'center',gap:'12px',fontFamily:"-apple-system,'Segoe UI',sans-serif"}}>
              <img src="/DamiAPP_Trasp.png" alt="logo" style={{width:'44px',height:'44px',borderRadius:'12px',objectFit:'contain',background:'#f3f4f7',flexShrink:0,border:'2px solid rgba(255,255,255,0.2)'}} onError={e=>{e.target.style.display='none'}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'14px',fontWeight:'900',color:'#fff',marginBottom:'2px'}}>Installa DamiAPP</div>
                {showInstallBanner==='ios'
                  ? <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',lineHeight:'1.4'}}>Tocca <strong style={{color:'#fff'}}>⎋ Condividi</strong> poi <strong style={{color:'#fff'}}>"Aggiungi a Home"</strong></div>
                  : <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)'}}>Accesso rapido dalla schermata Home</div>
                }
              </div>
              <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                {showInstallBanner==='android' && (
                  <button type="button" onClick={handleInstall} style={{padding:'8px 14px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:'12px',color:'#08184c',background:'#fff',fontFamily:'inherit'}}>
                    Installa
                  </button>
                )}
                <button type="button" onClick={dismissInstall} style={{width:'30px',height:'30px',borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(255,255,255,0.15)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>
                  ×
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

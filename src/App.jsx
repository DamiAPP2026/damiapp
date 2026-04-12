import { useState, useEffect } from 'react'
import { Home, BookOpen, Pill, Droplets, Link, Settings, Layers } from 'lucide-react'
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

const PIN_REALE = '261120'
const PIN_DEMO  = '010101'
const VERSION   = '05.00.24'

const f = (base) => `${Math.round(base * 1.15)}px`

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

// ── CSS GLOBALE ──────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e8eaf0; }
  body { display: flex; justify-content: center; min-height: 100vh; }
  #root {
    width: 100%;
    max-width: 480px;
    background: #f3f4f7;
    min-height: 100vh;
    position: relative;
    box-shadow: 0 0 60px rgba(2,21,63,0.12);
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
        <button onClick={onAccept} style={{width:'100%',padding:'15px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(15),color:'#fff',background:'linear-gradient(135deg,#08184c,#193f9e)',boxShadow:'0 6px 20px rgba(8,24,76,0.35)',marginBottom:'10px'}}>
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
          <img src="/DamiLogo.png" alt="logo" style={{width:'72px',height:'72px',borderRadius:'50%',objectFit:'cover',marginBottom:'14px',boxShadow:'0 4px 16px rgba(8,24,76,0.25)'}}/>
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
        <button
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
      const { ref, get } = await import('firebase/database')
      const { db } = await import('./firebase')
      const { decrypt } = await import('./crypto')
      const snap = await get(ref(db,'sharetokens'))
      const val = snap.val()
      if (!val) { setError('Token non valido o scaduto.'); setCheckingToken(false); return }
      let trovato = null
      Object.entries(val).forEach(([key,encData]) => {
        const t = typeof encData==='object' ? encData : decrypt(encData)
        if (t && t.token===token.trim().toUpperCase() && t.active) {
          const scadenza = t.expiresAt ? new Date(t.expiresAt) : null
          if (!scadenza || scadenza > new Date()) trovato = {...t, _firebaseKey:key}
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
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f3f4f7',fontFamily:"-apple-system,'Segoe UI',sans-serif",padding:'20px'}}>
      <div style={{background:'#feffff',borderRadius:'28px',overflow:'hidden',width:'100%',maxWidth:'340px',boxShadow:'0 20px 60px rgba(2,21,63,0.20),0 8px 20px rgba(2,21,63,0.10)'}}>
        <div style={{background:'linear-gradient(135deg,#08184c,#193f9e)',padding:'36px 24px 30px',textAlign:'center',position:'relative'}}>
          <div style={{position:'absolute',top:'10px',right:'14px',fontSize:f(10),color:'rgba(255,255,255,0.35)',fontWeight:'600'}}>v{VERSION}</div>
          <img src="/DamiLogo.png" alt="logo" style={{width:'100px',height:'100px',borderRadius:'50%',objectFit:'cover',marginBottom:'16px',border:'3px solid rgba(255,255,255,0.25)',boxShadow:'0 12px 40px rgba(0,0,0,0.5),0 4px 12px rgba(0,0,0,0.3)'}}/>
          <div style={{fontSize:f(28),fontWeight:'900',color:'#fff',letterSpacing:'-0.5px'}}>DamiAPP</div>
          <div style={{fontSize:f(12),color:'rgba(255,255,255,0.5)',marginTop:'4px'}}>Il tuo assistente quotidiano</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#f3f4f7',margin:'16px 16px 0',borderRadius:'12px',padding:'3px',gap:'3px'}}>
          {['paziente','medico'].map(t=>(
            <button key={t} onClick={()=>{setTab(t);setError('');setPin('');setToken('')}}
              style={{padding:'9px',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:f(12),fontFamily:'inherit',background:tab===t?'#feffff':'transparent',color:tab===t?'#08184c':'#7c8088',boxShadow:tab===t?'0 2px 8px rgba(2,21,63,0.10)':'none',transition:'all 0.2s'}}>
              {t==='paziente'?'👤 Paziente':'👨‍⚕️ Medico'}
            </button>
          ))}
        </div>
        <div style={{padding:'20px 24px 28px'}}>
          {tab==='paziente' ? (
            <>
              <div style={{fontSize:f(11),fontWeight:'700',color:'#7c8088',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>PIN di accesso</div>
              <input
                type="password" value={pin}
                onChange={e=>setPin(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handlePinLogin()}
                placeholder="• • • • • •" maxLength={6}
                style={{width:'100%',padding:'16px',borderRadius:'14px',border:'2px solid #e8eaf0',fontSize:'26px',textAlign:'center',letterSpacing:'12px',marginBottom:'10px',outline:'none',boxSizing:'border-box',color:'#02153f',background:'#f3f4f7',fontFamily:'inherit'}}
                onFocus={e=>e.target.style.borderColor='#2e84e9'}
                onBlur={e=>e.target.style.borderColor='#e8eaf0'}
              />
              <div onClick={()=>setRicordaPin(!ricordaPin)} style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',marginBottom:'14px',userSelect:'none'}}>
                <div style={{width:'20px',height:'20px',borderRadius:'6px',border:`2px solid ${ricordaPin?'#193f9e':'#dde0ed'}`,background:ricordaPin?'#193f9e':'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s'}}>
                  {ricordaPin && <span style={{color:'#fff',fontSize:'13px',fontWeight:'900'}}>✓</span>}
                </div>
                <span style={{fontSize:f(12),color:'#7c8088',fontWeight:'600'}}>Ricorda PIN per accesso rapido</span>
              </div>
              {error && <div style={{color:'#e53935',fontSize:f(13),textAlign:'center',marginBottom:'12px',fontWeight:'600'}}>❌ {error}</div>}
              <button onClick={handlePinLogin} style={{width:'100%',padding:'16px',borderRadius:'50px',border:'none',cursor:'pointer',fontWeight:'800',fontSize:f(16),color:'#fff',background:'linear-gradient(135deg,#08184c,#193f9e)',boxShadow:'0 8px 24px rgba(8,24,76,0.35)'}}>
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
                style={{width:'100%',padding:'14px',borderRadius:'14px',border:'2px solid #e8eaf0',fontSize:f(16),textAlign:'center',letterSpacing:'2px',marginBottom:'10px',outline:'none',boxSizing:'border-box',color:'#02153f',background:'#f3f4f7',fontFamily:"'Courier New',monospace"}}
                onFocus={e=>e.target.style.borderColor='#2e84e9'}
                onBlur={e=>e.target.style.borderColor='#e8eaf0'}
              />
              {error && <div style={{color:'#e53935',fontSize:f(13),textAlign:'center',marginBottom:'12px',fontWeight:'600'}}>❌ {error}</div>}
              <button onClick={handleTokenLogin} disabled={checkingToken}
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
    <div style={{minHeight:'100vh',background:'#f3f4f7',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"-apple-system,'Segoe UI',sans-serif",paddingBottom:'80px'}}>
      <div style={{textAlign:'center',padding:'40px'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🚧</div>
        <div style={{fontSize:f(18),fontWeight:'900',color:'#02153f',marginBottom:'8px'}}>In arrivo</div>
        <div style={{fontSize:f(13),color:'#7c8088',marginBottom:'24px'}}>Questa sezione è in sviluppo</div>
        <button onClick={onBack} style={{padding:'12px 24px',borderRadius:'50px',border:'none',background:'linear-gradient(135deg,#193f9e,#2e84e9)',color:'#fff',fontWeight:'700',fontSize:f(14),cursor:'pointer'}}>
          ← Torna indietro
        </button>
      </div>
    </div>
  )
}

// ── NAVBAR per pagine interne ─────────────────────────────────
function NavbarInterna({ page, onNavigate }) {
  const items = [
    {Icon:Home,     label:'Home',      p:'home'},
    {Icon:BookOpen, label:'Diario',    p:'diario'},
    {Icon:Pill,     label:'Terapie',   p:'terapie'},
    {Icon:Droplets, label:'Toilet',    p:'toilet'},
    {Icon:Link,     label:'Condividi', p:'condividi'},
    {Icon:Layers,   label:'Utility',   p:'utility'},
  ]
  return (
    <div style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:'480px',
      background:'#feffff', borderTop:'1px solid #f0f1f4',
      display:'flex', padding:'7px 0 14px',
      boxShadow:'0 -4px 16px rgba(2,21,63,0.08)', zIndex:100
    }}>
      {items.map(({Icon,label,p})=>{
        const act = page===p
        return (
          <div key={label} onClick={()=>onNavigate(p)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',cursor:'pointer',touchAction:'manipulation'}}>
            <div style={{width:'34px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',background:act?'#EEF3FD':'transparent'}}>
              <Icon size={17} color={act?'#193f9e':'#bec1cc'}/>
            </div>
            <span style={{fontSize:`${Math.round(9*1.15)}px`,fontWeight:act?'800':'500',color:act?'#193f9e':'#bec1cc'}}>{label}</span>
          </div>
        )
      })}
    </div>
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

  function handleLogin(demo, tokenData) {
    setIsDemo(demo)
    setAuthenticated(true)
    if (tokenData) {
      setIsMedico(true)
      setTokenMedico(tokenData)
    } else {
      setIsMedico(false)
      setTokenMedico(null)
      if (demo||!nomeUtente) setShowOnboarding(true)
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
    setShowExtra(false)
    if (dest==='crisi') setTimerSecCrisi(1)
    setPage(dest)
  }

  const nomeEffettivo = isMedico
    ? `Dr. ${tokenMedico?.medicoName||'Medico'}`
    : isDemo ? (pendingNome||'Ospite')
    : (pendingNome||nomeUtente||'Damiano')

  const noNav    = ['crisi','sos']
  // Pagine in arrivo (solo quelle non ancora implementate)
  const inArrivo = ['doc_personali','admin']

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

          {/* Pagine senza navbar */}
          {page==='crisi'    && <CrisiPage onBack={()=>setPage('home')} timerSecInizio={timerSecCrisi} isDemo={isDemo}/>}
          {page==='sos'      && <SOSPage onBack={()=>setPage('home')}/>}

          {/* Pagine con navbar */}
          {!noNav.includes(page) && (
            <>
              {page==='home' && (
                <Home2
                  nomeUtente={nomeEffettivo}
                  isDemo={isDemo}
                  onNavigate={handleNavigate}
                  showExtra={showExtra}
                  onToggleExtra={()=>setShowExtra(p=>!p)}
                />
              )}
              {page==='diario'    && <DiarioCrisi   onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='terapie'   && <TerapiePage    onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='toilet'    && <ToiletPage     onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='condividi' && <CondividiPage  onBack={()=>setPage('home')} isDemo={isDemo}/>}
              {page==='report'    && <ReportPage     onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='magazzino' && <MagazzinoPage  onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='disturbi'  && <DisturbPage    onBack={()=>setPage('home')} isDemo={isDemo}/>}
              {page==='utility'   && <UtilityPage    onBack={()=>setPage('home')} isDemo={isDemo} onNavigate={handleNavigate}/>}
              {page==='cosa_portare' && <PaginaInArrivo onBack={()=>handleNavigate('utility')}/>}
              {page==='doc_medici'   && <PaginaInArrivo onBack={()=>handleNavigate('utility')}/>}
              {page==='rubrica'      && <PaginaInArrivo onBack={()=>handleNavigate('utility')}/>}
              {page==='pagamenti'    && <PaginaInArrivo onBack={()=>handleNavigate('utility')}/>}
              {inArrivo.includes(page) && <PaginaInArrivo onBack={()=>handleNavigate('home')}/>}

              {page !== 'home' && (
                <NavbarInterna page={page} onNavigate={handleNavigate}/>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

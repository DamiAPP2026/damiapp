import { useState, useEffect } from 'react'
import Home from './Home'
import CrisiPage from './CrisiPage'
import DiarioCrisi from './DiarioCrisi'

const PIN_REALE = '261120'
const PIN_DEMO = '010101'
const VERSION = '05.00.07'

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
  const idx = (new Date().getDate() + new Date().getMonth()) % FRASI.length
  return FRASI[idx]
}

function Disclaimer({ nome, onAccept }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(2,21,63,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:2000, padding:'20px',
      fontFamily:"-apple-system,'Segoe UI',sans-serif"
    }}>
      <div style={{
        background:'#feffff', borderRadius:'24px', padding:'28px 24px',
        width:'100%', maxWidth:'360px',
        boxShadow:'0 20px 60px rgba(2,21,63,0.3)'
      }}>
        <div style={{textAlign:'center', marginBottom:'20px'}}>
          <div style={{
            width:'52px', height:'52px', borderRadius:'50%',
            background:'linear-gradient(135deg,#F7295A,#FF8C42)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 14px', fontSize:'24px'
          }}>⚠️</div>
          <div style={{fontSize:'18px', fontWeight:'900', color:'#08184c', marginBottom:'6px'}}>
            Informativa sull'utilizzo
          </div>
          <div style={{fontSize:'12px', color:'#7c8088'}}>
            Leggi attentamente prima di continuare
          </div>
        </div>

        <div style={{
          background:'#f3f4f7', borderRadius:'14px', padding:'16px',
          marginBottom:'20px', fontSize:'12px', color:'#394058',
          lineHeight:'1.7', maxHeight:'200px', overflowY:'auto'
        }}>
          <p style={{marginBottom:'10px'}}>
            <strong style={{color:'#08184c'}}>Ciao {nome}!</strong> Prima di accedere a DamiAPP,
            ti chiediamo di leggere e accettare quanto segue:
          </p>
          <p style={{marginBottom:'10px'}}>
            <strong style={{color:'#02153f'}}>1. Responsabilità dei dati</strong><br/>
            DamiAPP è uno strumento di supporto personale. I dati inseriti
            sono sotto la tua esclusiva responsabilità. Gli sviluppatori non
            sono responsabili per errori, perdite o utilizzi impropri delle
            informazioni inserite.
          </p>
          <p style={{marginBottom:'10px'}}>
            <strong style={{color:'#02153f'}}>2. Protezione dei dati</strong><br/>
            I dati sono salvati su Firebase (Google).
            <strong style={{color:'#F7295A'}}> DamiAPP non garantisce
            la protezione assoluta dei dati</strong> e non è conforme
            a normative specifiche per dati sanitari. Non inserire dati
            strettamente confidenziali.
          </p>
          <p style={{marginBottom:'10px'}}>
            <strong style={{color:'#02153f'}}>3. Uso medico</strong><br/>
            DamiAPP <strong>non sostituisce il medico</strong> né costituisce
            consulenza medica. In caso di emergenza chiama sempre il 112.
          </p>
          <p style={{marginBottom:'10px'}}>
            <strong style={{color:'#02153f'}}>4. Modalità Demo</strong><br/>
            In modalità Demo tutti i dati sono fittizi e a scopo dimostrativo.
            Non inserire dati reali in modalità demo.
          </p>
          <p style={{margin:0, color:'#bec1cc', fontSize:'11px'}}>
            Versione {VERSION} — Continuando accetti queste condizioni.
          </p>
        </div>

        <button onClick={onAccept} style={{
          width:'100%', padding:'15px', borderRadius:'50px', border:'none',
          cursor:'pointer', fontWeight:'800', fontSize:'15px', color:'#fff',
          background:'linear-gradient(135deg,#08184c,#193f9e)',
          boxShadow:'0 6px 20px rgba(8,24,76,0.35)', marginBottom:'10px'
        }}>
          ✅ Ho letto e accetto
        </button>
        <div style={{textAlign:'center', fontSize:'11px', color:'#bec1cc'}}>
          Non accettando non potrai utilizzare l'app
        </div>
      </div>
    </div>
  )
}

function OnboardingModal({ onDone, isDemo }) {
  const [nome, setNome] = useState('')
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(2,21,63,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, padding:'20px',
      fontFamily:"-apple-system,'Segoe UI',sans-serif"
    }}>
      <div style={{
        background:'#feffff', borderRadius:'24px', padding:'32px 24px',
        width:'100%', maxWidth:'340px',
        boxShadow:'0 20px 60px rgba(2,21,63,0.25)'
      }}>
        <div style={{textAlign:'center', marginBottom:'24px'}}>
          <img src="/DamiLogo.png" alt="logo" style={{
            width:'72px', height:'72px', borderRadius:'50%',
            objectFit:'cover', marginBottom:'14px',
            boxShadow:'0 4px 16px rgba(8,24,76,0.25)'
          }}/>
          <div style={{fontSize:'20px', fontWeight:'900', color:'#08184c', marginBottom:'6px'}}>
            {isDemo ? '👋 Benvenuto nella Demo!' : 'Benvenuto in DamiAPP'}
          </div>
          <div style={{fontSize:'13px', color:'#7c8088', lineHeight:'1.5'}}>
            {isDemo
              ? 'Come ti chiami? Personalizziamo la demo per te.'
              : 'Come ti chiami? Ti saluteremo ogni giorno.'}
          </div>
          {isDemo && (
            <div style={{
              marginTop:'10px', padding:'8px 12px',
              background:'rgba(255,140,66,0.12)',
              borderRadius:'10px', border:'1px solid rgba(255,140,66,0.3)',
              fontSize:'11px', color:'#8B6914', fontWeight:'600'
            }}>
              🎭 Modalità Demo — dati fittizi
            </div>
          )}
        </div>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && nome.trim() && onDone(nome.trim())}
          placeholder="Il tuo nome..."
          autoFocus
          style={{
            width:'100%', padding:'14px 16px', borderRadius:'14px',
            border:'2px solid #e8eaf0', fontSize:'16px', color:'#02153f',
            marginBottom:'16px', outline:'none', boxSizing:'border-box',
            fontFamily:'inherit', background:'#f3f4f7'
          }}
          onFocus={e => e.target.style.borderColor='#2e84e9'}
          onBlur={e => e.target.style.borderColor='#e8eaf0'}
        />
        <button
          onClick={() => nome.trim() && onDone(nome.trim())}
          disabled={!nome.trim()}
          style={{
            width:'100%', padding:'15px', borderRadius:'50px', border:'none',
            background: nome.trim() ? 'linear-gradient(135deg,#08184c,#193f9e)' : '#e8eaf0',
            color: nome.trim() ? '#fff' : '#bec1cc',
            fontSize:'15px', fontWeight:'800',
            cursor: nome.trim() ? 'pointer' : 'default',
            boxShadow: nome.trim() ? '0 6px 20px rgba(8,24,76,0.35)' : 'none'
          }}
        >
          Inizia →
        </button>
      </div>
    </div>
  )
}

function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('paziente')
  const [token, setToken] = useState('')

  function handleLogin() {
    if (pin === PIN_REALE) onLogin(false)
    else if (pin === PIN_DEMO) onLogin(true)
    else { setError('PIN errato. Riprova.'); setPin('') }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'#f3f4f7',
      fontFamily:"-apple-system,'Segoe UI',sans-serif", padding:'20px'
    }}>
      <div style={{
        background:'#feffff', borderRadius:'28px', overflow:'hidden',
        width:'100%', maxWidth:'340px',
        boxShadow:'0 20px 60px rgba(2,21,63,0.20), 0 8px 20px rgba(2,21,63,0.10), 0 2px 6px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          background:'linear-gradient(135deg,#08184c,#193f9e)',
          padding:'36px 24px 30px', textAlign:'center', position:'relative'
        }}>
          <div style={{
            position:'absolute', top:'10px', right:'14px',
            fontSize:'10px', color:'rgba(255,255,255,0.35)',
            fontWeight:'600', letterSpacing:'0.5px'
          }}>v{VERSION}</div>
          <img src="/DamiLogo.png" alt="logo" style={{
            width:'100px', height:'100px', borderRadius:'50%',
            objectFit:'cover', marginBottom:'16px',
            border:'3px solid rgba(255,255,255,0.25)',
            boxShadow:'0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
          }}/>
          <div style={{fontSize:'28px', fontWeight:'900', color:'#fff', letterSpacing:'-0.5px'}}>
            DamiAPP
          </div>
          <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)', marginTop:'4px'}}>
            Il tuo assistente quotidiano
          </div>
        </div>

        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          background:'#f3f4f7', margin:'16px 16px 0',
          borderRadius:'12px', padding:'3px', gap:'3px'
        }}>
          {['paziente','medico'].map(t => (
            <button key={t}
              onClick={() => { setTab(t); setError(''); setPin(''); setToken('') }}
              style={{
                padding:'9px', borderRadius:'9px', border:'none', cursor:'pointer',
                fontWeight:'700', fontSize:'12px', fontFamily:'inherit',
                background: tab===t ? '#feffff' : 'transparent',
                color: tab===t ? '#08184c' : '#7c8088',
                boxShadow: tab===t ? '0 2px 8px rgba(2,21,63,0.10)' : 'none',
                transition:'all 0.2s'
              }}>
              {t === 'paziente' ? '👤 Paziente' : '👨‍⚕️ Medico'}
            </button>
          ))}
        </div>

        <div style={{padding:'20px 24px 28px'}}>
          {tab === 'paziente' ? (
            <>
              <div style={{
                fontSize:'11px', fontWeight:'700', color:'#7c8088',
                textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'10px'
              }}>PIN di accesso</div>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="• • • • • •"
                maxLength={6}
                style={{
                  width:'100%', padding:'16px', borderRadius:'14px',
                  border:'2px solid #e8eaf0', fontSize:'26px', textAlign:'center',
                  letterSpacing:'12px', marginBottom:'10px', outline:'none',
                  boxSizing:'border-box', color:'#02153f', background:'#f3f4f7',
                  fontFamily:'inherit'
                }}
                onFocus={e => e.target.style.borderColor='#2e84e9'}
                onBlur={e => e.target.style.borderColor='#e8eaf0'}
              />
              {error && (
                <div style={{
                  color:'#e53935', fontSize:'13px', textAlign:'center',
                  marginBottom:'12px', fontWeight:'600'
                }}>❌ {error}</div>
              )}
              <button onClick={handleLogin} style={{
                width:'100%', padding:'16px', borderRadius:'50px', border:'none',
                cursor:'pointer', fontWeight:'800', fontSize:'16px', color:'#fff',
                background:'linear-gradient(135deg,#08184c,#193f9e)',
                boxShadow:'0 8px 24px rgba(8,24,76,0.35)'
              }}>Accedi</button>
              <div style={{
                textAlign:'center', marginTop:'12px',
                fontSize:'11px', color:'#bec1cc'
              }}>
                💡 PIN demo disponibile per la presentazione
              </div>
            </>
          ) : (
            <>
              <div style={{
                fontSize:'11px', fontWeight:'700', color:'#7c8088',
                textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'10px'
              }}>Token di accesso medico</div>
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value.toUpperCase())}
                placeholder="Es: DMI·7K2X·9P4R"
                style={{
                  width:'100%', padding:'14px', borderRadius:'14px',
                  border:'2px solid #e8eaf0', fontSize:'16px', textAlign:'center',
                  letterSpacing:'2px', marginBottom:'10px', outline:'none',
                  boxSizing:'border-box', color:'#02153f', background:'#f3f4f7',
                  fontFamily:"'Courier New', monospace"
                }}
                onFocus={e => e.target.style.borderColor='#2e84e9'}
                onBlur={e => e.target.style.borderColor='#e8eaf0'}
              />
              {error && (
                <div style={{
                  color:'#e53935', fontSize:'13px', textAlign:'center',
                  marginBottom:'12px', fontWeight:'600'
                }}>❌ {error}</div>
              )}
              <button onClick={() => setError('Token non valido o scaduto.')} style={{
                width:'100%', padding:'16px', borderRadius:'50px', border:'none',
                cursor:'pointer', fontWeight:'800', fontSize:'16px', color:'#fff',
                background:'linear-gradient(135deg,#00BFA6,#2e84e9)',
                boxShadow:'0 8px 24px rgba(0,191,166,0.3)'
              }}>Accedi come Medico</button>
              <div style={{
                textAlign:'center', marginTop:'12px',
                fontSize:'11px', color:'#bec1cc'
              }}>
                Il token ti è stato fornito dalla famiglia del paziente
              </div>
            </>
          )}
          <div style={{
            textAlign:'center', marginTop:'16px', fontSize:'12px', color:'#bec1cc',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'
          }}>
            🔒 Dati cifrati e protetti
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [page, setPage] = useState('home')
  const [nomeUtente, setNomeUtente] = useState(
    () => localStorage.getItem('damiapp_nome') || ''
  )
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [pendingNome, setPendingNome] = useState('')
  const [timerSecCrisi, setTimerSecCrisi] = useState(0)

  function handleLogin(demo) {
    setIsDemo(demo)
    setAuthenticated(true)
    if (demo || !nomeUtente) setShowOnboarding(true)
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
    if (dest === 'crisi') setTimerSecCrisi(1)
    setPage(dest)
  }

  const nomeEffettivo = isDemo
    ? (pendingNome || 'Ospite')
    : (pendingNome || nomeUtente || 'Damiano')

  if (!authenticated) return <Login onLogin={handleLogin} />

  return (
    <>
      {showOnboarding && <OnboardingModal onDone={handleNome} isDemo={isDemo} />}
      {showDisclaimer && <Disclaimer nome={nomeEffettivo} onAccept={handleAcceptDisclaimer} />}
      {page === 'crisi'
  ? <CrisiPage
      onBack={() => setPage('home')}
      timerSecInizio={timerSecCrisi}
      isDemo={isDemo}
    />
  : page === 'diario'
  ? <DiarioCrisi
      onBack={() => setPage('home')}
      isDemo={isDemo}
    />
  : <Home
      nomeUtente={nomeEffettivo}
      frase={getFrase()}
      isDemo={isDemo}
      onNavigate={handleNavigate}
    />
}
    </>
  )
}
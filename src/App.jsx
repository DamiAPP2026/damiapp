import { useState, useEffect } from 'react'
import Home from './Home'

const PIN = '261120'
const VERSION = '05.00.02'

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
  "Ogni giorno con Damiano è un giorno pieno di significato.",
  "La normalità si costruisce un giorno alla volta.",
  "Il tuo amore è la sua ancora più sicura.",
  "Anche le piccole vittorie meritano di essere celebrate.",
  "Sei più forte di quanto credi — sempre.",
]

export function getFrase() {
  const idx = (new Date().getDate() + new Date().getMonth()) % FRASI.length
  return FRASI[idx]
}

function OnboardingModal({ onDone }) {
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
            boxShadow:'0 4px 16px rgba(25,63,158,0.25)'
          }}/>
          <div style={{
            fontSize:'22px', fontWeight:'900', color:'#02153f',
            marginBottom:'6px', letterSpacing:'-0.5px'
          }}>
            Benvenuto in DamiAPP
          </div>
          <div style={{fontSize:'13px', color:'#7c8088', lineHeight:'1.5'}}>
            Come ti chiami? Ti saluteremo ogni giorno.
          </div>
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
          onFocus={e => e.target.style.borderColor = '#2e84e9'}
          onBlur={e => e.target.style.borderColor = '#e8eaf0'}
        />
        <button
          onClick={() => nome.trim() && onDone(nome.trim())}
          disabled={!nome.trim()}
          style={{
            width:'100%', padding:'15px', borderRadius:'50px', border:'none',
            background: nome.trim()
              ? 'linear-gradient(135deg,#193f9e,#2e84e9)'
              : '#e8eaf0',
            color: nome.trim() ? '#fff' : '#bec1cc',
            fontSize:'15px', fontWeight:'800',
            cursor: nome.trim() ? 'pointer' : 'default',
            boxShadow: nome.trim()
              ? '0 6px 20px rgba(25,63,158,0.35)'
              : 'none'
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

  function handleLogin() {
    if (pin === PIN) onLogin()
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
        boxShadow:'0 12px 40px rgba(2,21,63,0.14), 0 4px 12px rgba(0,0,0,0.06)'
      }}>

        {/* Header */}
        <div style={{
          background:'linear-gradient(135deg,#193f9e,#2e84e9)',
          padding:'36px 24px 30px', textAlign:'center'
        }}>
          <img src="/DamiLogo.png" alt="logo" style={{
            width:'80px', height:'80px', borderRadius:'50%',
            objectFit:'cover', marginBottom:'14px',
            border:'3px solid rgba(255,255,255,0.35)',
            boxShadow:'0 6px 20px rgba(0,0,0,0.2)'
          }}/>
          <div style={{
            fontSize:'28px', fontWeight:'900', color:'#fff',
            letterSpacing:'-0.5px'
          }}>
            DamiAPP
          </div>
          <div style={{
            fontSize:'12px', color:'rgba(255,255,255,0.7)',
            marginTop:'4px'
          }}>
            Gestione crisi epilettiche v{VERSION}
          </div>
        </div>

        {/* Form */}
        <div style={{padding:'28px 24px'}}>
          <div style={{
            fontSize:'11px', fontWeight:'700', color:'#7c8088',
            textTransform:'uppercase', letterSpacing:'0.8px',
            marginBottom:'10px'
          }}>
            PIN di accesso
          </div>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="• • • • • •"
            maxLength={6}
            style={{
              width:'100%', padding:'16px', borderRadius:'14px',
              border:'2px solid #e8eaf0', fontSize:'26px',
              textAlign:'center', letterSpacing:'12px',
              marginBottom:'10px', outline:'none',
              boxSizing:'border-box', color:'#02153f',
              background:'#f3f4f7', fontFamily:'inherit'
            }}
            onFocus={e => e.target.style.borderColor = '#2e84e9'}
            onBlur={e => e.target.style.borderColor = '#e8eaf0'}
          />
          {error && (
            <div style={{
              color:'#e53935', fontSize:'13px', textAlign:'center',
              marginBottom:'12px', fontWeight:'600'
            }}>
              ❌ {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            style={{
              width:'100%', padding:'16px', borderRadius:'50px',
              border:'none', cursor:'pointer', fontWeight:'800',
              fontSize:'16px', color:'#fff', letterSpacing:'0.3px',
              background:'linear-gradient(135deg,#193f9e,#2e84e9)',
              boxShadow:'0 8px 24px rgba(25,63,158,0.38)'
            }}
          >
            Accedi
          </button>
          <div style={{
            textAlign:'center', marginTop:'18px',
            fontSize:'12px', color:'#bec1cc',
            display:'flex', alignItems:'center',
            justifyContent:'center', gap:'5px'
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
  const [nomeUtente, setNomeUtente] = useState(
    () => localStorage.getItem('damiapp_nome') || ''
  )
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (authenticated && !nomeUtente) {
      setShowOnboarding(true)
    }
  }, [authenticated])

  function handleNome(nome) {
    localStorage.setItem('damiapp_nome', nome)
    setNomeUtente(nome)
    setShowOnboarding(false)
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />
  }

  return (
    <>
      {showOnboarding && <OnboardingModal onDone={handleNome} />}
      <Home nomeUtente={nomeUtente} frase={getFrase()} />
    </>
  )
}
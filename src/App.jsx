import { useState } from 'react'
import Home from './Home'

const PIN = '261120'

function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleLogin() {
    if (pin === PIN) {
      onLogin()
    } else {
      setError('PIN errato. Riprova.')
      setPin('')
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'#F0F2F8', fontFamily:"-apple-system,'Segoe UI',sans-serif"
    }}>
      <div style={{
        background:'#fff', borderRadius:'28px', overflow:'hidden',
        width:'320px', boxShadow:'0 8px 32px rgba(74,108,247,0.18)'
      }}>

        {/* Header gradiente */}
        <div style={{
          background:'linear-gradient(135deg,#4A6CF7,#7B5EA7)',
          padding:'32px 24px 28px', textAlign:'center'
        }}>
          <img
            src="/DamiLogo.png"
            alt="DamiAPP"
            style={{
              width:'80px', height:'80px', borderRadius:'50%',
              objectFit:'cover', marginBottom:'12px',
              border:'3px solid rgba(255,255,255,0.4)',
              boxShadow:'0 4px 16px rgba(0,0,0,0.2)'
            }}
          />
          <div style={{fontSize:'22px', fontWeight:'900', color:'#fff', letterSpacing:'-0.5px'}}>
            DamiAPP
          </div>
          <div style={{fontSize:'12px', color:'rgba(255,255,255,0.75)', marginTop:'4px'}}>
            Gestione crisi epilettiche v2.0
          </div>
        </div>

        {/* Form login */}
        <div style={{padding:'24px'}}>
          <div style={{
            fontSize:'11px', fontWeight:'700', color:'#8A94B2',
            textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px'
          }}>
            PIN di accesso
          </div>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••"
            maxLength={6}
            style={{
              width:'100%', padding:'14px', borderRadius:'14px',
              border:'2px solid #EDF0F8', fontSize:'24px',
              textAlign:'center', letterSpacing:'10px',
              marginBottom:'8px', outline:'none',
              boxSizing:'border-box', color:'#1A1F3A',
              transition:'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor='#4A6CF7'}
            onBlur={e => e.target.style.borderColor='#EDF0F8'}
          />

          {error && (
            <div style={{
              color:'#F7295A', fontSize:'13px', textAlign:'center',
              marginBottom:'12px', fontWeight:'600'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              width:'100%', padding:'15px', borderRadius:'50px',
              border:'none', cursor:'pointer', fontWeight:'800',
              fontSize:'15px', color:'#fff', marginTop:'4px',
              background:'linear-gradient(135deg,#4A6CF7,#7B5EA7)',
              boxShadow:'0 6px 18px rgba(74,108,247,0.38)',
              transition:'transform 0.15s'
            }}
            onMouseOver={e => e.target.style.transform='scale(1.02)'}
            onMouseOut={e => e.target.style.transform='scale(1)'}
          >
            Accedi
          </button>

          <div style={{
            textAlign:'center', marginTop:'16px',
            fontSize:'12px', color:'#8A94B2'
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

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />
  }

  return <Home />
}
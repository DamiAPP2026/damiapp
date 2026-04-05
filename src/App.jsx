import { useState } from 'react'

const PIN = '261120'

export default function App() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  function handleLogin() {
    if (pin === PIN) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('PIN errato. Riprova.')
      setPin('')
    }
  }

  if (authenticated) {
    return (
      <div style={{padding:'20px', fontFamily:'sans-serif'}}>
        <h1>✅ Benvenuto in DamiAPP!</h1>
        <p>Login effettuato con successo.</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'#F0F2F8', fontFamily:'sans-serif'
    }}>
      <div style={{
        background:'#fff', borderRadius:'24px', padding:'32px 28px',
        width:'300px', boxShadow:'0 8px 28px rgba(74,108,247,0.15)'
      }}>
        <h2 style={{textAlign:'center', color:'#1A1F3A', marginBottom:'8px'}}>
          DamiAPP
        </h2>
        <p style={{textAlign:'center', color:'#8A94B2', marginBottom:'24px', fontSize:'14px'}}>
          Inserisci il PIN per accedere
        </p>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="••••••"
          style={{
            width:'100%', padding:'12px', borderRadius:'12px',
            border:'2px solid #EDF0F8', fontSize:'20px', textAlign:'center',
            letterSpacing:'8px', marginBottom:'12px', outline:'none',
            boxSizing:'border-box'
          }}
        />
        {error && (
          <p style={{color:'#F7295A', fontSize:'13px', textAlign:'center', marginBottom:'12px'}}>
            {error}
          </p>
        )}
        <button
          onClick={handleLogin}
          style={{
            width:'100%', padding:'14px', borderRadius:'50px', border:'none',
            background:'linear-gradient(135deg, #4A6CF7, #7B5EA7)',
            color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer'
          }}
        >
          Accedi
        </button>
      </div>
    </div>
  )
}
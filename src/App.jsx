import { useState, useEffect, useRef } from 'react'
import { db } from './firebase'
import { ref, onValue } from 'firebase/database'
import { decrypt, processFirebaseSnap } from './crypto'
import {
  Lock, Eye, EyeOff, LogOut, Activity, ChevronLeft,
  BarChart3, Package, Users, Briefcase, FileText, CreditCard,
  Home, BookOpen, Pill, Baby, Share2, MoreHorizontal
} from 'lucide-react'
import HomePage from './Home'
import CrisiPage from './CrisiPage'
import DiarioCrisi from './DiarioCrisi'
import TerapiePage from './TerapiePage'
import ToiletPage from './ToiletPage'
import SOSPage from './SOSPage'
import CondividiPage from './CondividiPage'
import ReportPage from './ReportPage'
import MagazzinoPage from './MagazzinoPage'
import DoctorView from './DoctorView'

const VERSION = 'v05.00.20'
const PIN_REALE = '261120'
const PIN_DEMO  = '010101'
const f = base => `${Math.round(base * 1.15)}px`

// ── WRAPPER RESPONSIVE ──────────────────────────────────────────
// Centra l'app (max 480px) su desktop, piena larghezza su mobile
function AppShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#d0d4e0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        minHeight: '100vh',
        background: '#f3f4f7',
        position: 'relative',
        boxShadow: '0 0 60px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── LOGIN ────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [tab, setTab]       = useState('utente')   // utente | medico
  const [pin, setPin]       = useState('')
  const [token, setToken]   = useState('')
  const [show, setShow]     = useState(false)
  const [err, setErr]       = useState('')
  const [loading, setLoading] = useState(false)

  const handleUtente = () => {
    if (pin === PIN_REALE) { onLogin('real', false); return }
    if (pin === PIN_DEMO)  { onLogin('demo', false); return }
    setErr('PIN non corretto')
  }

  const handleMedico = async () => {
    if (!token.trim()) { setErr('Inserisci il token'); return }
    setLoading(true); setErr('')
    try {
      let found = null
      await new Promise(res => {
        onValue(ref(db, 'sharetokens'), snap => {
          const rows = processFirebaseSnap(snap) || []
          found = rows.find(r => r.token === token.trim().toUpperCase() && r.active)
          res()
        }, { onlyOnce: true })
      })
      if (!found) { setErr('Token non valido o scaduto'); setLoading(false); return }
      const exp = new Date(found.expiresAt)
      if (exp < new Date()) { setErr('Token scaduto'); setLoading(false); return }
      onLogin('doctor', false, found)
    } catch (e) {
      setErr('Errore di rete'); setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '360px', background: '#feffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 56px rgba(2,21,63,0.14)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#08184c,#193f9e,#2e84e9)', padding: '32px 24px 24px', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', right: '14px', background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '3px 10px', borderRadius: '50px', fontSize: f(9), fontWeight: '700' }}>{VERSION}</div>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', overflow: 'hidden', margin: '0 auto 12px', border: '2px solid rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.12)' }}>
            <img src="DamiLogo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
          </div>
          <div style={{ fontSize: f(20), fontWeight: '900', color: '#fff', letterSpacing: '-0.4px' }}>DamiAPP</div>
          <div style={{ fontSize: f(11), color: 'rgba(255,255,255,0.70)', marginTop: '3px' }}>Gestione crisi e terapie</div>
        </div>

        {/* Tab */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', background: '#f3f4f7', borderRadius: '12px', padding: '3px', marginBottom: '18px' }}>
            {[['utente','Utente'],['medico','Medico']].map(([k,l]) => (
              <button key={k} onClick={() => { setTab(k); setErr(''); setPin(''); setToken('') }}
                style={{ flex: 1, padding: '9px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: f(12), fontFamily: 'inherit',
                  background: tab === k ? '#feffff' : 'transparent',
                  color: tab === k ? '#193f9e' : '#7c8088',
                  boxShadow: tab === k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s' }}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'utente' ? (
            <>
              <label style={{ fontSize: f(10), fontWeight: '700', color: '#7c8088', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PIN di accesso</label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input type={show ? 'text' : 'password'} value={pin} onChange={e => { setPin(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && handleUtente()}
                  placeholder="••••••"
                  style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: '12px', border: `1.5px solid ${err ? '#F7295A' : '#e7eaf0'}`, background: '#f8f9fb', fontSize: f(15), fontFamily: 'inherit', color: '#02153f', outline: 'none', boxSizing: 'border-box' }} />
                <button onClick={() => setShow(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  {show ? <EyeOff size={16} color="#7c8088" /> : <Eye size={16} color="#7c8088" />}
                </button>
              </div>
              {err && <div style={{ fontSize: f(11), color: '#F7295A', marginBottom: '10px', fontWeight: '600' }}>{err}</div>}
              <button onClick={handleUtente}
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#193f9e,#2e84e9)', color: '#fff', border: 'none', borderRadius: '50px', fontSize: f(13), fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px', boxShadow: '0 6px 18px rgba(25,63,158,0.35)' }}>
                Accedi
              </button>
            </>
          ) : (
            <>
              <label style={{ fontSize: f(10), fontWeight: '700', color: '#7c8088', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Token medico (9 caratteri)</label>
              <input type="text" value={token} onChange={e => { setToken(e.target.value.toUpperCase()); setErr('') }}
                onKeyDown={e => e.key === 'Enter' && handleMedico()}
                placeholder="DMI-XXXXXX"
                maxLength={12}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: `1.5px solid ${err ? '#F7295A' : '#e7eaf0'}`, background: '#f8f9fb', fontSize: f(14), fontFamily: 'monospace', color: '#02153f', outline: 'none', boxSizing: 'border-box', marginBottom: '14px', letterSpacing: '2px' }} />
              {err && <div style={{ fontSize: f(11), color: '#F7295A', marginBottom: '10px', fontWeight: '600' }}>{err}</div>}
              <button onClick={handleMedico} disabled={loading}
                style={{ width: '100%', padding: '14px', background: loading ? '#bec1cc' : 'linear-gradient(135deg,#193f9e,#2e84e9)', color: '#fff', border: 'none', borderRadius: '50px', fontSize: f(13), fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: '20px' }}>
                {loading ? 'Verifica...' : 'Accedi come medico'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ALTRO PAGE (svuotata) ────────────────────────────────────────
function AltroPage({ onNavigate }) {
  return (
    <div style={{ background: '#f3f4f7', minHeight: '100vh', fontFamily: "-apple-system,'Segoe UI',sans-serif", paddingBottom: '80px' }}>
      <div style={{ background: 'linear-gradient(135deg,#08184c,#193f9e)', padding: '20px 16px 24px' }}>
        <div style={{ fontSize: f(21), fontWeight: '900', color: '#fff' }}>Altro</div>
        <div style={{ fontSize: f(13), color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Usa la barra in basso per navigare</div>
      </div>
    </div>
  )
}

// ── APP ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth]           = useState(null)   // null | 'real' | 'demo' | 'doctor'
  const [isDemo, setIsDemo]       = useState(false)
  const [doctorToken, setDoctorToken] = useState(null)
  const [page, setPage]           = useState('home')

  // Ricorda login tra sessioni
  useEffect(() => {
    const saved = sessionStorage.getItem('damiauth')
    if (saved) {
      try {
        const { auth: a, isDemo: d, doctorToken: dt, page: p } = JSON.parse(saved)
        setAuth(a); setIsDemo(d); setDoctorToken(dt); setPage(p || 'home')
      } catch {}
    }
  }, [])

  const handleLogin = (mode, _unused, docToken = null) => {
    const a = mode
    const d = mode === 'demo'
    setAuth(a); setIsDemo(d); setDoctorToken(docToken); setPage('home')
    sessionStorage.setItem('damiauth', JSON.stringify({ auth: a, isDemo: d, doctorToken: docToken, page: 'home' }))
  }

  const handleLogout = () => {
    setAuth(null); setIsDemo(false); setDoctorToken(null); setPage('home')
    sessionStorage.removeItem('damiauth')
  }

  const navigate = (p) => {
    setPage(p)
    sessionStorage.setItem('damiauth', JSON.stringify({ auth, isDemo, doctorToken, page: p }))
  }

  // ── NON AUTENTICATO ──────────────────────────────────────────
  if (!auth) {
    return (
      <AppShell>
        <LoginPage onLogin={handleLogin} />
      </AppShell>
    )
  }

  // ── VISTA MEDICO ─────────────────────────────────────────────
  if (auth === 'doctor') {
    return (
      <AppShell>
        <DoctorView token={doctorToken} onBack={handleLogout} />
      </AppShell>
    )
  }

  // ── ROUTING PAGINE ───────────────────────────────────────────
  const commonProps = { onBack: () => navigate('home'), onNavigate: navigate, isDemo }

  const renderPage = () => {
    switch (page) {
      case 'home':      return <HomePage onNavigate={navigate} isDemo={isDemo} />
      case 'crisi':     return <CrisiPage {...commonProps} />
      case 'diario':    return <DiarioCrisi {...commonProps} />
      case 'terapie':   return <TerapiePage {...commonProps} />
      case 'toilet':    return <ToiletPage {...commonProps} />
      case 'sos':       return <SOSPage {...commonProps} />
      case 'condividi': return <CondividiPage {...commonProps} />
      case 'report':    return <ReportPage {...commonProps} />
      case 'magazzino': return <MagazzinoPage {...commonProps} />
      case 'altro':     return <AltroPage onNavigate={navigate} />
      // Pagine in arrivo — placeholder
      case 'rubrica':
      case 'portare':
      case 'documenti':
      case 'pagamenti':
        return (
          <div style={{ background: '#f3f4f7', minHeight: '100vh', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>
            <div style={{ background: 'linear-gradient(135deg,#08184c,#193f9e)', padding: '20px 16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => navigate('home')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronLeft size={18} color="#fff" />
              </button>
              <div>
                <div style={{ fontSize: f(18), fontWeight: '900', color: '#fff', textTransform: 'capitalize' }}>{page}</div>
                <div style={{ fontSize: f(11), color: 'rgba(255,255,255,0.7)' }}>In arrivo</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Activity size={40} color="#bec1cc" style={{ display: 'block', margin: '0 auto 14px' }} />
              <div style={{ fontSize: f(15), fontWeight: '800', color: '#394058', marginBottom: '6px' }}>Pagina in sviluppo</div>
              <div style={{ fontSize: f(12), color: '#7c8088' }}>Questa sezione sarà disponibile prossimamente.</div>
            </div>
          </div>
        )
      default:
        navigate('home')
        return null
    }
  }

  return (
    <AppShell>
      {/* Pulsante logout visibile su tutte le pagine tranne home */}
      {page !== 'home' && (
        <button onClick={handleLogout}
          title="Logout"
          style={{
            position: 'fixed',
            top: '14px', right: 'calc(50% - 226px)',   // allineato al bordo destro del container 480px
            zIndex: 999,
            width: '36px', height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid #e7eaf0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}>
          <LogOut size={15} color="#7c8088" />
        </button>
      )}
      {renderPage()}
    </AppShell>
  )
}

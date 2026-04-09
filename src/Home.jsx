import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Home, BookOpen, Pill, Baby, Share2, MoreHorizontal,
  BarChart3, Package, Users, Briefcase, FileText, CreditCard,
  Zap, Clock, AlertTriangle, ChevronRight, Plus, X,
  Activity, Flame, Shield, Droplets
} from 'lucide-react'
import { db } from './firebase'
import { ref, onValue } from 'firebase/database'
import { processFirebaseSnap } from './crypto'

const f = base => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const NAVBAR_H = 64   // altezza navbar principale px
const EXTRA_H = 60    // altezza barra extra px

// Dati demo
const DEMO_CRISI = [
  { id: 1, type: 'Crisi tonico-cloniche', timestamp: Date.now() - 2 * 86400000, intensita: 8, perdCoscienza: true },
  { id: 2, type: 'Crisi di assenza', timestamp: Date.now() - 5 * 86400000, intensita: 4 },
  { id: 3, type: 'Crisi tonico-cloniche', timestamp: Date.now() - 9 * 86400000, intensita: 7, perdCoscienza: true },
]
const DEMO_TERAPIE = [
  { id: 1, nome: 'Keppra 500mg', orario: '08:00', quantita: '1 cp', colore: '#00BFA6' },
  { id: 2, nome: 'Depakine 200mg', orario: '13:00', quantita: '2 cp', colore: '#2e84e9' },
  { id: 3, nome: 'Keppra 500mg', orario: '20:00', quantita: '1 cp', colore: '#00BFA6' },
]
const DEMO_MAGAZZINO = [
  { id: 1, nome: 'Keppra 500mg', scatole: 2, scadenza: '2026-06-01' },
  { id: 2, nome: 'Depakine 200mg', scatole: 1, scadenza: '2026-04-20' },
]

const PRIORITA_DEFAULT = [
  { id: 'crisi', label: 'Registra crisi', sub: 'Tocca per avviare timer', color: '#F7295A', Icon: Zap, nav: 'crisi' },
  { id: 'terapia', label: 'Terapie oggi', sub: 'Gestisci farmaci', color: '#00BFA6', Icon: Pill, nav: 'terapie' },
  { id: 'toilet', label: 'Toilet training', sub: 'Registra sessione', color: '#7B5EA7', Icon: Droplets, nav: 'toilet' },
]

const EXTRA_VOCI = [
  { id: 'report', label: 'Report', Icon: BarChart3, color: '#2e84e9', nav: 'report' },
  { id: 'magazzino', label: 'Magazzino', Icon: Package, color: '#FF8C42', nav: 'magazzino' },
  { id: 'rubrica', label: 'Rubrica', Icon: Users, color: '#00BFA6', nav: 'rubrica' },
  { id: 'portare', label: 'Portare', Icon: Briefcase, color: '#7B5EA7', nav: 'portare' },
  { id: 'documenti', label: 'Documenti', Icon: FileText, color: '#193f9e', nav: 'documenti' },
  { id: 'pagamenti', label: 'Pagamenti', Icon: CreditCard, color: '#F7295A', nav: 'pagamenti' },
]

function oggiStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`
}

export default function HomePage({ onNavigate, isDemo }) {
  const [crisi, setCrisi] = useState([])
  const [terapie, setTerapie] = useState([])
  const [magazzino, setMagazzino] = useState([])
  const [toilet, setToilet] = useState([])
  const [loading, setLoading] = useState(true)
  const [showExtra, setShowExtra] = useState(false)
  const [showPrioritaModal, setShowPrioritaModal] = useState(false)
  const [ora, setOra] = useState(new Date())

  // Orologio
  useEffect(() => {
    const t = setInterval(() => setOra(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Firebase / Demo
  useEffect(() => {
    if (isDemo) {
      setCrisi(DEMO_CRISI)
      setTerapie(DEMO_TERAPIE)
      setMagazzino(DEMO_MAGAZZINO)
      setToilet([])
      setLoading(false)
      return
    }
    let done = 0
    const check = () => { done++; if (done >= 4) setLoading(false) }
    const u1 = onValue(ref(db, 'crises'), s => { setCrisi(processFirebaseSnap(s) || []); check() })
    const u2 = onValue(ref(db, 'terapies'), s => { setTerapie(processFirebaseSnap(s) || []); check() })
    const u3 = onValue(ref(db, 'magazzino'), s => { setMagazzino(processFirebaseSnap(s) || []); check() })
    const u4 = onValue(ref(db, 'toilettraining'), s => { setToilet(processFirebaseSnap(s) || []); check() })
    return () => { u1(); u2(); u3(); u4() }
  }, [isDemo])

  // Chiudi barra extra cliccando fuori
  const extraRef = useRef(null)
  const navRef = useRef(null)
  useEffect(() => {
    if (!showExtra) return
    const handler = (e) => {
      if (extraRef.current && !extraRef.current.contains(e.target) &&
          navRef.current && !navRef.current.contains(e.target)) {
        setShowExtra(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [showExtra])

  // Calcoli dashboard
  const oggi = oggiStr()
  const ultCrisi = crisi.length > 0
    ? [...crisi].sort((a,b) => b.timestamp - a.timestamp)[0]
    : null
  const giorniSenza = ultCrisi
    ? Math.floor((Date.now() - ultCrisi.timestamp) / 86400000)
    : null
  const crisiMese = crisi.filter(c => {
    const d = new Date(c.timestamp)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const terapieOggi = terapie.slice().sort((a,b) => (a.orario||'').localeCompare(b.orario||''))
  const prossimaTerapia = terapieOggi.find(t => {
    if (!t.orario) return false
    const [hh, mm] = t.orario.split(':').map(Number)
    const now = new Date()
    return hh * 60 + mm > now.getHours() * 60 + now.getMinutes()
  })

  const scadenzeProssime = magazzino.filter(m => {
    if (!m.scadenza) return false
    const diff = (new Date(m.scadenza) - Date.now()) / 86400000
    return diff >= 0 && diff <= 30
  })

  const toiletOggi = toilet.filter(t => {
    if (!t.data) return false
    const raw = String(t.data).replace(/\//g, '')
    return raw === oggi || t.data === oggi
  })
  const incidentiOggi = toiletOggi.filter(t => t.incidentePippi || t.incidenteCacca).length

  const oreStr = ora.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const giornoStr = ora.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  const nav = (page) => {
    setShowExtra(false)
    onNavigate(page)
  }

  // ── NAVBAR ITEMS ──────────────────────────────────────────────
  const NAV_ITEMS = [
    { id: 'home',      label: 'Home',      Icon: Home,          nav: 'home' },
    { id: 'diario',    label: 'Diario',    Icon: BookOpen,      nav: 'diario' },
    { id: 'terapie',   label: 'Terapie',   Icon: Pill,          nav: 'terapie' },
    { id: 'toilet',    label: 'Toilet',    Icon: Baby,          nav: 'toilet' },
    { id: 'condividi', label: 'Condividi', Icon: Share2,        nav: 'condividi' },
    { id: 'altro',     label: 'Altro',     Icon: MoreHorizontal, nav: null },
  ]

  // ── STILI NAVBAR (responsive: max 480px centrato) ─────────────
  const navbarBase = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    zIndex: 300,
    background: '#feffff',
    borderTop: '1.5px solid #e7eaf0',
    display: 'flex',
    boxShadow: '0 -4px 16px rgba(0,0,0,0.07)',
    height: `${NAVBAR_H}px`,
    alignItems: 'center',
  }

  const extraBarStyle = {
    position: 'fixed',
    bottom: showExtra ? NAVBAR_H : -EXTRA_H - 4,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    zIndex: 299,
    background: '#feffff',
    borderTop: '1.5px solid #e7eaf0',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: `${EXTRA_H}px`,
    boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
    transition: 'bottom 0.36s cubic-bezier(0.4,0,0.2,1)',
    paddingBottom: '2px',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f3f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <Activity size={36} color="#193f9e" style={{ display: 'block', margin: '0 auto 12px' }} />
        <div style={{ fontSize: f(13), color: '#7c8088' }}>Caricamento...</div>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f3f4f7', minHeight: '100vh', paddingBottom: `${NAVBAR_H + EXTRA_H + 8}px`, fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#08184c,#193f9e,#2e84e9)', padding: '20px 16px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: f(11), color: 'rgba(255,255,255,0.65)', marginBottom: '2px', textTransform: 'capitalize' }}>{giornoStr}</div>
            <div style={{ fontSize: f(22), fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>{oreStr}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: f(11), color: 'rgba(255,255,255,0.65)' }}>DamiAPP</div>
            {isDemo && <div style={{ fontSize: f(9), background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: '10px', marginTop: '3px' }}>DEMO</div>}
          </div>
        </div>

        {/* Mini stats hero */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Crisi questo mese', val: crisiMese, color: '#F7295A', sub: 'episodi', Icon: Flame },
            { label: 'Giorni senza crisi', val: giorniSenza !== null ? giorniSenza : '—', color: '#00BFA6', sub: 'giorni liberi', Icon: Shield },
            { label: 'Toilet oggi', val: toiletOggi.length, color: '#7B5EA7', sub: `${incidentiOggi} incidenti`, Icon: Droplets },
          ].map(({ label, val, color, sub, Icon: Ic }, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '10px 8px', backdropFilter: 'blur(4px)' }}>
              <Ic size={13} color={color} style={{ display: 'block', marginBottom: '4px' }} />
              <div style={{ fontSize: f(20), fontWeight: '900', color: '#fff', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: f(8.5), color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROSSIMA TERAPIA ──────────────────────────────────── */}
      {prossimaTerapia && (
        <div style={{ margin: '12px 12px 0', background: '#feffff', borderRadius: '16px', padding: '12px 14px', boxShadow: shSm, display: 'flex', alignItems: 'center', gap: '12px' }}
          onClick={() => nav('terapie')} role="button" style={{ margin: '12px 12px 0', background: '#feffff', borderRadius: '16px', padding: '12px 14px', boxShadow: shSm, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: prossimaTerapia.colore || '#00BFA6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: f(10), color: '#7c8088', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Prossima terapia</div>
            <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>{prossimaTerapia.nome}</div>
            <div style={{ fontSize: f(10), color: '#7c8088' }}>{prossimaTerapia.orario} · {prossimaTerapia.quantita}</div>
          </div>
          <ChevronRight size={16} color="#bec1cc" />
        </div>
      )}

      {/* ── ALLERTA SCADENZE ──────────────────────────────────── */}
      {scadenzeProssime.length > 0 && (
        <div style={{ margin: '10px 12px 0', background: '#fff8f0', borderRadius: '14px', padding: '10px 14px', border: '1.5px solid rgba(255,140,66,0.3)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => nav('magazzino')}>
          <AlertTriangle size={16} color="#FF8C42" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: f(11), fontWeight: '800', color: '#02153f' }}>Scadenze in arrivo</div>
            <div style={{ fontSize: f(10), color: '#7c8088' }}>{scadenzeProssime.map(m => m.nome).join(', ')}</div>
          </div>
          <ChevronRight size={14} color="#FF8C42" />
        </div>
      )}

      {/* ── PRIORITA RAPIDE ───────────────────────────────────── */}
      <div style={{ padding: '14px 12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>Azioni rapide</div>
          <button onClick={() => setShowPrioritaModal(true)}
            style={{ background: 'none', border: 'none', fontSize: f(10), color: '#193f9e', fontWeight: '700', cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit' }}>
            Personalizza
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PRIORITA_DEFAULT.map(({ id, label, sub, color, Icon: Ic, nav: navTarget }) => (
            <div key={id} onClick={() => nav(navTarget)}
              style={{ background: '#feffff', borderRadius: '14px', padding: '12px 14px', boxShadow: shSm, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic size={18} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: f(12), fontWeight: '800', color: '#02153f' }}>{label}</div>
                <div style={{ fontSize: f(10), color: '#7c8088' }}>{sub}</div>
              </div>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={14} color="#193f9e" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD 2×2 ─────────────────────────────────────── */}
      <div style={{ padding: '14px 12px 0' }}>
        <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f', marginBottom: '8px' }}>Dashboard</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Diario crisi', val: crisi.length, sub: 'totale registrate', color: '#F7295A', nav: 'diario', Icon: BookOpen },
            { label: 'Terapie attive', val: terapie.length, sub: 'farmaci programmati', color: '#00BFA6', nav: 'terapie', Icon: Pill },
            { label: 'Toilet sessioni', val: toilet.length, sub: 'totale sessioni', color: '#7B5EA7', nav: 'toilet', Icon: Baby },
            { label: 'Magazzino', val: magazzino.length, sub: `${scadenzeProssime.length} in scadenza`, color: '#FF8C42', nav: 'magazzino', Icon: Package },
          ].map(({ label, val, sub, color, nav: navTarget, Icon: Ic }) => (
            <div key={label} onClick={() => nav(navTarget)}
              style={{ background: '#feffff', borderRadius: '14px', padding: '14px 12px', boxShadow: shSm, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <Ic size={16} color={color} />
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={10} color="#193f9e" />
                </div>
              </div>
              <div style={{ fontSize: f(24), fontWeight: '900', color: '#02153f', lineHeight: 1, marginBottom: '3px' }}>{val}</div>
              <div style={{ fontSize: f(11), fontWeight: '700', color: '#394058' }}>{label}</div>
              <div style={{ fontSize: f(9), color: '#7c8088', marginTop: '1px' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ULTIMA CRISI ──────────────────────────────────────── */}
      {ultCrisi && (
        <div style={{ margin: '14px 12px 0', background: '#feffff', borderRadius: '16px', padding: '14px', boxShadow: sh }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Flame size={15} color="#F7295A" />
            <div style={{ fontSize: f(12), fontWeight: '800', color: '#02153f' }}>Ultima crisi registrata</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, background: '#fff8f8', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: f(22), fontWeight: '900', color: '#F7295A' }}>{giorniSenza}</div>
              <div style={{ fontSize: f(9), color: '#7c8088', fontWeight: '700' }}>giorni fa</div>
            </div>
            <div style={{ flex: 2, background: '#f8f9fb', borderRadius: '10px', padding: '10px' }}>
              <div style={{ fontSize: f(11), fontWeight: '700', color: '#394058' }}>{ultCrisi.type}</div>
              <div style={{ fontSize: f(10), color: '#7c8088', marginTop: '2px' }}>
                {new Date(ultCrisi.timestamp).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {ultCrisi.intensita && (
                <div style={{ marginTop: '6px', display: 'flex', gap: '3px' }}>
                  {[...Array(10)].map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < ultCrisi.intensita ? '#F7295A' : '#f0f1f4' }} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div onClick={() => nav('diario')}
            style={{ marginTop: '10px', textAlign: 'center', fontSize: f(11), color: '#193f9e', fontWeight: '700', cursor: 'pointer', padding: '6px' }}>
            Vedi tutto il diario →
          </div>
        </div>
      )}

      <div style={{ height: '20px' }} />

      {/* ══════════════════════════════════════════════════════════
          BARRA EXTRA (appare sopra la navbar principale)
      ══════════════════════════════════════════════════════════ */}
      <div ref={extraRef} style={extraBarStyle}>
        {EXTRA_VOCI.map(({ id, label, Icon: Ic, color, nav: navTarget }) => (
          <div key={id} onClick={() => nav(navTarget)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '0 6px', flex: 1 }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic size={16} color={color} />
            </div>
            <span style={{ fontSize: f(8.5), color: '#394058', fontWeight: '700', textAlign: 'center', lineHeight: 1.1 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          NAVBAR PRINCIPALE
      ══════════════════════════════════════════════════════════ */}
      <div ref={navRef} style={navbarBase}>
        {NAV_ITEMS.map(({ id, label, Icon: Ic, nav: navTarget }) => {
          const isAltro = id === 'altro'
          const isActive = isAltro ? showExtra : id === 'home'
          return (
            <div key={id}
              onClick={() => isAltro ? setShowExtra(v => !v) : nav(navTarget)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '8px 0' }}>
              <div style={{
                width: '36px', height: '28px', borderRadius: '10px',
                background: isActive ? '#EEF3FD' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}>
                <Ic size={18} color={isActive ? '#193f9e' : '#bec1cc'} />
              </div>
              <span style={{ fontSize: f(9), fontWeight: isActive ? '800' : '600', color: isActive ? '#193f9e' : '#bec1cc', letterSpacing: '0.2px' }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── MODAL PERSONALIZZA PRIORITA ───────────────────────── */}
      {showPrioritaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,21,63,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowPrioritaModal(false)}>
          <div style={{ background: '#feffff', borderRadius: '22px 22px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: '36px', height: '4px', background: '#e7eaf0', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: f(15), fontWeight: '900', color: '#02153f', marginBottom: '6px' }}>Azioni rapide</div>
            <div style={{ fontSize: f(11), color: '#7c8088', marginBottom: '18px' }}>Le azioni principali sempre in primo piano.</div>
            {PRIORITA_DEFAULT.map(({ id, label, sub, color, Icon: Ic }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f1f4' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic size={16} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: f(12), fontWeight: '700', color: '#02153f' }}>{label}</div>
                  <div style={{ fontSize: f(10), color: '#7c8088' }}>{sub}</div>
                </div>
              </div>
            ))}
            <button onClick={() => setShowPrioritaModal(false)}
              style={{ marginTop: '20px', width: '100%', padding: '14px', background: 'linear-gradient(135deg,#193f9e,#2e84e9)', color: '#fff', border: 'none', borderRadius: '50px', fontSize: f(13), fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

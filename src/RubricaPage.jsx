import { useState, useEffect } from 'react'
import { ChevronLeft, Plus, Phone, Trash2, Edit2, Check, X, Search, User } from 'lucide-react'
import { db } from './firebase'
import { ref, push, remove, set, onValue } from 'firebase/database'
import { processFirebaseSnap, encrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh   = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const RUOLI = [
  { key: 'neurologo',  label: 'Neurologo',       color: '#F7295A', bg: '#FEF0F4' },
  { key: 'pediatra',   label: 'Pediatra',        color: '#2e84e9', bg: '#EEF3FD' },
  { key: 'terapista',  label: 'Terapista',       color: '#7B5EA7', bg: '#F5F3FF' },
  { key: 'farmacia',   label: 'Farmacia',        color: '#00BFA6', bg: '#E8FBF8' },
  { key: 'pronto_soc', label: 'Pronto Soccorso', color: '#e53935', bg: '#FEEFEF' },
  { key: 'scuola',     label: 'Scuola',          color: '#FF8C42', bg: '#FFF5EE' },
  { key: 'famiglia',   label: 'Famiglia',        color: '#193f9e', bg: '#EEF3FD' },
  { key: 'altro',      label: 'Altro',           color: '#394058', bg: '#f3f4f7' },
]

const DEMO_CONTATTI = [
  { id:1, nome:'Dr. Rossi',         telefono:'0721-123456', ruolo:'neurologo',  note:'Visita ogni 6 mesi',    _firebaseKey:'d1' },
  { id:2, nome:'Dr.ssa Bianchi',    telefono:'0721-654321', ruolo:'pediatra',   note:'',                      _firebaseKey:'d2' },
  { id:3, nome:'Centro Terapie',    telefono:'333-1234567', ruolo:'terapista',  note:'Lun-Ven 9-18',          _firebaseKey:'d3' },
  { id:4, nome:'Farmacia Centrale', telefono:'0721-111222', ruolo:'farmacia',   note:'Aperta anche domenica', _firebaseKey:'d4' },
  { id:5, nome:'Mamma',             telefono:'333-9876543', ruolo:'famiglia',   note:'',                      _firebaseKey:'d5' },
  { id:6, nome:'Scuola Primaria',   telefono:'0721-333444', ruolo:'scuola',     note:'Ins. Verdi',            _firebaseKey:'d6' },
]

const EMPTY_FORM = { nome: '', telefono: '', ruolo: 'neurologo', note: '' }

function getRuolo(key) {
  return RUOLI.find(r => r.key === key) || RUOLI[RUOLI.length - 1]
}

function iniziale(nome) {
  return (nome || '?').trim().charAt(0).toUpperCase()
}

export default function RubricaPage({ onBack, isDemo }) {
  const [contatti,    setContatti]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [search,      setSearch]      = useState('')
  const [saved,       setSaved]       = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [filtroRuolo, setFiltroRuolo] = useState('tutti')

  useEffect(() => {
    if (isDemo) { setContatti(DEMO_CONTATTI); setLoading(false); return }
    const unsub = onValue(ref(db, 'contacts'), snap => {
      setContatti(processFirebaseSnap(snap).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')))
      setLoading(false)
    })
    return () => unsub()
  }, [isDemo])

  function apriNuovo() {
    setForm(EMPTY_FORM)
    setEditTarget(null)
    setSaved(false)
    setShowForm(true)
  }

  function apriModifica(c) {
    setForm({ nome: c.nome || '', telefono: c.telefono || '', ruolo: c.ruolo || 'altro', note: c.note || '' })
    setEditTarget(c)
    setSaved(false)
    setShowForm(true)
  }

  function chiudiForm() {
    setShowForm(false)
    setSaved(false)
    setSaving(false)
  }

  async function handleSalva() {
    if (!form.nome.trim()) { alert('Inserisci almeno il nome'); return }
    setSaving(true)
    const contatto = {
      id: editTarget?.id || Date.now(),
      nome: form.nome.trim(),
      telefono: form.telefono.trim(),
      ruolo: form.ruolo,
      note: form.note.trim(),
    }
    try {
      if (!isDemo) {
        if (editTarget?._firebaseKey) {
          await set(ref(db, `contacts/${editTarget._firebaseKey}`), encrypt(contatto))
        } else {
          await push(ref(db, 'contacts'), encrypt(contatto))
        }
      } else {
        if (editTarget) {
          setContatti(prev => prev.map(c => c.id === editTarget.id ? { ...contatto, _firebaseKey: c._firebaseKey } : c))
        } else {
          setContatti(prev => [...prev, { ...contatto, _firebaseKey: `demo_${Date.now()}` }].sort((a,b)=>(a.nome||'').localeCompare(b.nome||'')))
        }
      }
      setSaved(true)
      setTimeout(() => chiudiForm(), 1000)
    } catch (err) {
      console.error(err)
      alert('Errore nel salvataggio. Riprova.')
    }
    setSaving(false)
  }

  function handleElimina(c) {
    if (!window.confirm(`Eliminare ${c.nome}?`)) return
    if (!isDemo && c._firebaseKey) remove(ref(db, `contacts/${c._firebaseKey}`))
    else setContatti(prev => prev.filter(x => x.id !== c.id))
  }

  function chiama(tel) {
    if (!tel) return
    window.location.href = `tel:${tel.replace(/\s/g, '')}`
  }

  const contattiFiltered = contatti.filter(c => {
    const matchSearch = !search ||
      (c.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.telefono || '').includes(search)
    const matchRuolo = filtroRuolo === 'tutti' || c.ruolo === filtroRuolo
    return matchSearch && matchRuolo
  })

  const inStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '14px',
    border: '2px solid #f0f1f4', fontSize: f(14), color: '#02153f',
    background: '#f3f4f7', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  }
  const lbStyle = {
    fontSize: f(11), fontWeight: '700', color: '#7c8088',
    textTransform: 'uppercase', letterSpacing: '0.4px',
    marginBottom: '6px', display: 'block',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f3f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <User size={36} color="#bec1cc" style={{ margin: '0 auto 10px', display: 'block' }} />
        <div style={{ fontSize: f(13), color: '#bec1cc' }}>Caricamento rubrica...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f3f4f7; }
        .rb-wrap {
          background: #f3f4f7;
          min-height: 100vh;
          font-family: -apple-system, 'Segoe UI', sans-serif;
          padding-bottom: 120px;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }
        .rb-fab {
          position: fixed;
          bottom: calc(80px + env(safe-area-inset-bottom));
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 448px;
          z-index: 100;
        }
        .rb-fab-btn {
          width: 100%;
          padding: 16px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          font-weight: 800;
          font-size: ${f(15)};
          font-family: inherit;
          color: #fff;
          background: linear-gradient(135deg, #F7295A, #FF8C42);
          box-shadow: 0 8px 28px rgba(247,41,90,0.40);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .rb-fab-btn:active { transform: scale(0.97); box-shadow: 0 4px 14px rgba(247,41,90,0.30); }
      `}</style>

      <div className="rb-wrap">

        {/* ── HEADER ── */}
        <div style={{ background: 'linear-gradient(135deg,#F7295A,#FF8C42)', padding: '14px 16px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <button type="button" onClick={onBack} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronLeft size={20} color="#fff" />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: f(18), fontWeight: '900', color: '#fff' }}>📞 Rubrica</div>
              <div style={{ fontSize: f(11), color: 'rgba(255,255,255,0.75)' }}>
                {isDemo ? '🎭 Dati demo' : `${contatti.length} contatt${contatti.length === 1 ? 'o' : 'i'}`}
              </div>
            </div>
            {/* Bottone + anche nell'header per comodità */}
            <button type="button" onClick={apriNuovo} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Plus size={20} color="#fff" />
            </button>
          </div>

          {/* Barra ricerca */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#bec1cc" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca nome o numero..."
              style={{ ...inStyle, paddingLeft: '38px', background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '14px' }}
            />
          </div>
        </div>

        {/* ── FILTRI RUOLO ── */}
        <div style={{ padding: '10px 12px 0', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '6px', paddingBottom: '4px', width: 'max-content' }}>
            <button type="button" onClick={() => setFiltroRuolo('tutti')}
              style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: f(11), fontFamily: 'inherit', background: filtroRuolo === 'tutti' ? '#193f9e' : '#feffff', color: filtroRuolo === 'tutti' ? '#fff' : '#7c8088', transition: 'all 0.15s', boxShadow: shSm }}>
              Tutti ({contatti.length})
            </button>
            {RUOLI.map(r => {
              const n = contatti.filter(c => c.ruolo === r.key).length
              if (n === 0) return null
              return (
                <button type="button" key={r.key} onClick={() => setFiltroRuolo(r.key)}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: f(11), fontFamily: 'inherit', background: filtroRuolo === r.key ? r.color : r.bg, color: filtroRuolo === r.key ? '#fff' : r.color, transition: 'all 0.15s', whiteSpace: 'nowrap', boxShadow: shSm }}>
                  {r.label} ({n})
                </button>
              )
            })}
          </div>
        </div>

        {/* ── LISTA CONTATTI ── */}
        <div style={{ padding: '10px 12px' }}>
          {contattiFiltered.length === 0 ? (
            <div style={{ background: '#feffff', borderRadius: '18px', padding: '40px 20px', textAlign: 'center', boxShadow: sh, marginTop: '8px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF0F4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <User size={28} color="#F7295A" />
              </div>
              <div style={{ fontSize: f(14), fontWeight: '800', color: '#02153f', marginBottom: '6px' }}>
                {search || filtroRuolo !== 'tutti' ? 'Nessun risultato' : 'Rubrica vuota'}
              </div>
              <div style={{ fontSize: f(12), color: '#7c8088', marginBottom: '20px' }}>
                {!search && filtroRuolo === 'tutti'
                  ? 'Aggiungi il primo contatto con il bottone qui sotto'
                  : 'Prova a cambiare la ricerca o il filtro'}
              </div>
              {!search && filtroRuolo === 'tutti' && (
                <button type="button" onClick={apriNuovo}
                  style={{ padding: '12px 24px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: f(13), color: '#fff', background: 'linear-gradient(135deg,#F7295A,#FF8C42)', boxShadow: '0 6px 18px rgba(247,41,90,0.35)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}>
                  <Plus size={16} /> Aggiungi contatto
                </button>
              )}
            </div>
          ) : (
            contattiFiltered.map((c, i) => {
              const ruolo = getRuolo(c.ruolo)
              return (
                <div key={c.id || i} style={{ background: '#feffff', borderRadius: '16px', padding: '13px 14px', marginBottom: '8px', boxShadow: shSm, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Avatar */}
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: `linear-gradient(135deg,${ruolo.color},${ruolo.color}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: f(18), fontWeight: '900', color: '#fff', boxShadow: `0 3px 10px ${ruolo.color}44` }}>
                    {iniziale(c.nome)}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: f(14), fontWeight: '800', color: '#02153f', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: f(10), fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: ruolo.bg, color: ruolo.color }}>{ruolo.label}</span>
                      {c.telefono && <span style={{ fontSize: f(11), color: '#7c8088' }}>{c.telefono}</span>}
                    </div>
                    {c.note && <div style={{ fontSize: f(10), color: '#bec1cc', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {c.note}</div>}
                  </div>
                  {/* Azioni */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {c.telefono && (
                      <button type="button" onClick={() => chiama(c.telefono)}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA6,#2e84e9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,191,166,0.35)' }}>
                        <Phone size={15} color="#fff" />
                      </button>
                    )}
                    <button type="button" onClick={() => apriModifica(c)}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EEF3FD', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Edit2 size={14} color="#193f9e" />
                    </button>
                    <button type="button" onClick={() => handleElimina(c)}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF0F4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Trash2 size={14} color="#F7295A" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── FAB — BOTTONE FISSO IN BASSO ── */}
      {!showForm && (
        <div className="rb-fab">
          <button type="button" className="rb-fab-btn" onClick={apriNuovo}>
            <Plus size={20} color="#fff" />
            Aggiungi contatto
          </button>
        </div>
      )}

      {/* ── MODAL FORM ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,21,63,0.55)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}
          onClick={e => { if (e.target === e.currentTarget) chiudiForm() }}>
          <div style={{ background: '#feffff', borderRadius: '24px 24px 0 0', padding: '0', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(2,21,63,0.20)' }}>

            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#dde0ed' }} />
            </div>

            {/* Header modale */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 0' }}>
              <div>
                <div style={{ fontSize: f(17), fontWeight: '900', color: '#02153f' }}>
                  {editTarget ? '✏️ Modifica contatto' : '➕ Nuovo contatto'}
                </div>
                {editTarget && <div style={{ fontSize: f(11), color: '#7c8088', marginTop: '2px' }}>{editTarget.nome}</div>}
              </div>
              <button type="button" onClick={chiudiForm}
                style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f3f4f7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#7c8088" />
              </button>
            </div>

            <div style={{ padding: '16px 20px 32px' }}>

              {/* Nome */}
              <label style={lbStyle}>Nome *</label>
              <input
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Es: Dr. Rossi — Neurologo"
                style={{ ...inStyle, marginBottom: '14px' }}
                onFocus={e => e.target.style.borderColor = '#F7295A'}
                onBlur={e => e.target.style.borderColor = '#f0f1f4'}
                autoFocus
              />

              {/* Telefono */}
              <label style={lbStyle}>Telefono</label>
              <input
                value={form.telefono}
                onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                placeholder="Es: 333-1234567"
                type="tel"
                inputMode="tel"
                style={{ ...inStyle, marginBottom: '14px' }}
                onFocus={e => e.target.style.borderColor = '#F7295A'}
                onBlur={e => e.target.style.borderColor = '#f0f1f4'}
              />

              {/* Ruolo */}
              <label style={lbStyle}>Ruolo</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '14px' }}>
                {RUOLI.map(r => (
                  <div key={r.key} onClick={() => setForm(p => ({ ...p, ruolo: r.key }))}
                    style={{ padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', border: `2px solid ${form.ruolo === r.key ? r.color : '#f0f1f4'}`, background: form.ruolo === r.key ? r.bg : '#feffff', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: form.ruolo === r.key ? r.color : '#dde0ed', flexShrink: 0, transition: 'background 0.15s' }} />
                    <div style={{ fontSize: f(12), fontWeight: '700', color: form.ruolo === r.key ? r.color : '#394058' }}>{r.label}</div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <label style={lbStyle}>Note</label>
              <textarea
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Es: visita ogni 6 mesi, apertura..."
                rows={2}
                style={{ ...inStyle, resize: 'none', marginBottom: '20px' }}
                onFocus={e => e.target.style.borderColor = '#F7295A'}
                onBlur={e => e.target.style.borderColor = '#f0f1f4'}
              />

              {/* Bottone salva */}
              <button type="button" onClick={handleSalva} disabled={saving}
                style={{
                  width: '100%', padding: '16px', borderRadius: '50px', border: 'none',
                  cursor: saving ? 'wait' : 'pointer',
                  fontWeight: '800', fontSize: f(15), color: '#fff', fontFamily: 'inherit',
                  background: saved
                    ? 'linear-gradient(135deg,#00BFA6,#2e84e9)'
                    : 'linear-gradient(135deg,#F7295A,#FF8C42)',
                  boxShadow: saved
                    ? '0 6px 20px rgba(0,191,166,0.35)'
                    : '0 6px 20px rgba(247,41,90,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.3s',
                }}>
                {saved
                  ? <><Check size={18} /> Salvato!</>
                  : saving
                    ? 'Salvataggio...'
                    : editTarget ? 'Aggiorna contatto' : 'Aggiungi contatto'
                }
              </button>

              {isDemo && (
                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: f(11), color: '#8B6914', fontWeight: '600' }}>
                  🎭 Modalità demo — non salvato su Firebase
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
